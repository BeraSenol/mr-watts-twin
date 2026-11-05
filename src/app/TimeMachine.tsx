import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { IncidentMarks } from '../data/derive'
import { Incident } from '../model/types'
import { CrownTicks } from './CrownTicks'
import {
  DEFAULT_HOUR,
  HEIGHT,
  HOURS,
  LABEL_HEIGHT,
  RANGE,
  STEP_ANGLE,
  STEPS_PER_WEEK,
  clamp,
  easeInOut,
  easeOut,
  hourLabel,
  isTyping,
  startOfDay,
  type Selection,
} from './crown'
import { playTick } from './playTick'
import { useElementWidth } from './useElementWidth'

const FRICTION = 0.99
const MIN_VELOCITY = 0.002
const CLICK_TOLERANCE = 4
const HOLD_MS = 1000
const FINE_DRAG = 6
const MS_PER_STEP = 80
const MIN_GLIDE = 250
const MAX_GLIDE = 900
const EPSILON = 1e-6
const PILL_TONE: Record<Incident, string> = {
  [Incident.DoorLeftUnlocked]: 'bg-danger text-white',
  [Incident.LightsLeftOn]: 'bg-glow text-canvas',
}

type Props = { incidents: IncidentMarks; onChange: (selection: Selection) => void }

export function TimeMachine({ incidents, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useElementWidth(ref)
  const radius = width / 2
  const spacing = radius * Math.sin(STEP_ANGLE)

  const [today] = useState(() => startOfDay(Date.now()))
  const [nowHour] = useState(() => new Date().getHours())
  const [position, setPosition] = useState(0)
  const positionRef = useRef(0)
  const [fine, setFine] = useState(false)
  const fineRef = useRef(false)
  const [selection, setSelection] = useState<Selection>({ day: 0, hour: { status: 'default' } })
  const holdTimer = useRef(0)
  const drag = useRef({ active: false, startX: 0, startPosition: 0, lastX: 0, lastTime: 0, velocity: 0 })
  const frame = useRef(0)
  const wheelSnap = useRef(0)
  const glide = useRef({ active: false, to: 0, quiet: false })
  const offset = useRef(0)

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const stepOf = (value: number) => (fineRef.current ? Math.round(value * HOURS) : Math.round(value - offset.current))
  const roundToUnit = (value: number) => (fineRef.current ? stepOf(value) / HOURS : stepOf(value) + offset.current)

  function selectionAt(step: number): Selection {
    const hoursFromMidnight = Math.round(step * HOURS) + DEFAULT_HOUR
    const day = Math.floor(hoursFromMidnight / HOURS)
    const onDayTick = Math.abs(step - Math.round(step)) < 1e-6
    if (onDayTick && !fineRef.current) return { day, hour: { status: 'default' } }
    return { day, hour: { status: 'picked', hour: ((hoursFromMidnight % HOURS) + HOURS) % HOURS } }
  }

  function select(next: Selection) {
    setSelection(next)
    onChange(next)
  }

  function moveTo(next: number) {
    const clamped = clamp(next)
    const step = stepOf(clamped)
    if (step !== stepOf(positionRef.current)) {
      const landing = step === stepOf(glide.current.to)
      const weekMark = !fineRef.current && step % STEPS_PER_WEEK === 0
      if (!(glide.current.active && glide.current.quiet) || landing || weekMark) playTick()
      select(selectionAt(roundToUnit(clamped)))
    }
    positionRef.current = clamped
    setPosition(clamped)
    return clamped
  }

  function enterFine() {
    if (fineRef.current) return
    fineRef.current = true
    setFine(true)
    select(selectionAt(roundToUnit(positionRef.current)))
  }

  function exitFine() {
    if (!fineRef.current) return
    const target = roundToUnit(glide.current.active ? glide.current.to : positionRef.current)
    const hours = Math.round(target * HOURS)
    const dayTick = Math.floor((hours + DEFAULT_HOUR) / HOURS)
    offset.current = (hours - dayTick * HOURS) / HOURS
    select(selectionAt(target))
    fineRef.current = false
    setFine(false)
    if (target !== positionRef.current) glideTo(target)
  }

  function stop() {
    cancelAnimationFrame(frame.current)
    glide.current.active = false
  }

  function glideTo(target: number, duration?: number) {
    const fromRest = !glide.current.active
    stop()
    const from = positionRef.current
    const to = clamp(target)
    const steps = Math.abs(to - from) * (fineRef.current ? HOURS : 1)
    const jump = duration === undefined && fromRest && steps > 1.5
    const time = duration ?? Math.min(Math.max(steps * MS_PER_STEP, MIN_GLIDE), MAX_GLIDE)
    const ease = jump ? easeInOut : easeOut
    const start = performance.now()
    glide.current = { active: true, to, quiet: jump }

    function animate(now: number) {
      const progress = Math.min((now - start) / time, 1)
      const eased = ease(progress)
      moveTo(from + (to - from) * eased)
      if (progress < 1) frame.current = requestAnimationFrame(animate)
      else {
        glide.current.active = false
        select(selectionAt(to))
      }
    }

    frame.current = requestAnimationFrame(animate)
  }

  function snap() {
    glideTo(roundToUnit(positionRef.current))
  }

  function fling(velocity: number) {
    const from = positionRef.current
    const projected = from + (velocity * 16) / (1 - FRICTION)
    const to = clamp(roundToUnit(projected))
    const duration = (3 * Math.abs(to - from)) / Math.abs(velocity)
    glideTo(to, Math.min(Math.max(duration, 250), 2500))
  }

  function onPointerDown(event: PointerEvent) {
    stop()
    event.currentTarget.setPointerCapture(event.pointerId)
    const now = performance.now()
    drag.current = {
      active: true,
      startX: event.clientX,
      startPosition: positionRef.current,
      lastX: event.clientX,
      lastTime: now,
      velocity: 0,
    }
    holdTimer.current = setTimeout(() => {
      enterFine()
      drag.current.startX = drag.current.lastX
      drag.current.startPosition = positionRef.current
    }, HOLD_MS)
  }

  function onPointerMove(event: PointerEvent) {
    const d = drag.current
    if (!d.active) return
    if (Math.abs(event.clientX - d.startX) > CLICK_TOLERANCE) clearTimeout(holdTimer.current)
    const scale = fineRef.current ? spacing * FINE_DRAG : spacing
    const now = performance.now()
    const elapsed = Math.max(now - d.lastTime, 1)
    const instant = -(event.clientX - d.lastX) / scale / elapsed
    d.velocity = 0.8 * instant + 0.2 * d.velocity
    d.lastX = event.clientX
    d.lastTime = now
    moveTo(d.startPosition - (event.clientX - d.startX) / scale)
  }

  function onPointerUp(event: PointerEvent) {
    const d = drag.current
    d.active = false
    clearTimeout(holdTimer.current)

    if (fineRef.current) {
      exitFine()
      return
    }

    if (Math.abs(event.clientX - d.startX) < CLICK_TOLERANCE) {
      const x = event.clientX - event.currentTarget.getBoundingClientRect().left
      const angle = Math.asin(Math.max(-1, Math.min(1, (x - radius) / radius)))
      glideTo(roundToUnit(d.startPosition + angle / STEP_ANGLE))
      return
    }

    const stillMoving = performance.now() - d.lastTime < 50
    if (stillMoving && Math.abs(d.velocity) > MIN_VELOCITY) fling(d.velocity)
    else snap()
  }

  function onPointerCancel() {
    drag.current.active = false
    clearTimeout(holdTimer.current)
    if (fineRef.current) exitFine()
    else snap()
  }

  function onWheel(event: WheelEvent) {
    event.preventDefault()
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    if (delta === 0) return
    stop()
    moveTo(positionRef.current + delta / (fineRef.current ? spacing * FINE_DRAG : spacing))
    clearTimeout(wheelSnap.current)
    wheelSnap.current = setTimeout(snap, 120)
  }

  function onKeyDown(event: KeyboardEvent) {
    if (isTyping(event.target)) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      enterFine()
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (fineRef.current) return
      const current = glide.current.active ? glide.current.to : positionRef.current
      const dayTick = Math.round(current - offset.current)
      offset.current = 0
      glideTo(dayTick)
      return
    }

    if (fineRef.current && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault()
      const current = roundToUnit(glide.current.active ? glide.current.to : positionRef.current)
      const step = event.metaKey || event.ctrlKey ? 1 : 1 / HOURS
      glideTo(current + (event.key === 'ArrowRight' ? step : -step))
      return
    }

    const current = (glide.current.active ? glide.current.to : positionRef.current) - offset.current
    const byWeek = event.metaKey || event.ctrlKey
    let next: number

    if (event.key === 'ArrowRight') {
      const ahead = current + EPSILON
      next = (byWeek ? (Math.floor(ahead / STEPS_PER_WEEK) + 1) * STEPS_PER_WEEK : Math.floor(ahead) + 1) + offset.current
    } else if (event.key === 'ArrowLeft') {
      const behind = current - EPSILON
      next = (byWeek ? (Math.ceil(behind / STEPS_PER_WEEK) - 1) * STEPS_PER_WEEK : Math.ceil(behind) - 1) + offset.current
    } else if (event.key === 'Home' || event.key === ' ') {
      offset.current = 0
      next = 0
    } else {
      return
    }

    event.preventDefault()
    glideTo(next)
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key === 'ArrowDown') exitFine()
  }

  const keyHandler = useRef(onKeyDown)
  const keyUpHandler = useRef(onKeyUp)
  const wheelHandler = useRef(onWheel)

  useEffect(() => {
    keyHandler.current = onKeyDown
    keyUpHandler.current = onKeyUp
    wheelHandler.current = onWheel
  })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const listener = (event: WheelEvent) => wheelHandler.current(event)
    element.addEventListener('wheel', listener, { passive: false })
    return () => element.removeEventListener('wheel', listener)
  }, [])

  useEffect(() => {
    const down = (event: KeyboardEvent) => keyHandler.current(event)
    const up = (event: KeyboardEvent) => keyUpHandler.current(event)
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  const picked = selection.hour.status === 'picked' ? selection.hour.hour : undefined
  const atNow = Math.abs(position) < 0.5 && picked === undefined
  const pickedIncident = picked !== undefined ? incidents.hours.get(selection.day * HOURS + picked) : undefined
  return (
    <div className="px-8 py-2">
      <div
        ref={ref}
        role="slider"
        aria-label="Time machine"
        aria-valuemin={-RANGE}
        aria-valuemax={RANGE}
        aria-valuenow={Math.round(position)}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="relative cursor-grab touch-none text-label outline-none select-none active:cursor-grabbing"
        style={{ height: HEIGHT + LABEL_HEIGHT }}
      >
        <CrownTicks
          width={width}
          position={position}
          fine={fine}
          today={today}
          nowHour={nowHour}
          selection={selection}
          incidents={incidents}
        />
        <div
          className={`pointer-events-none absolute top-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full transition-colors ${
            atNow ? 'bg-accent' : 'bg-label'
          }`}
          style={{ height: HEIGHT }}
        />
        {fine && picked !== undefined && (
          <span
            className={`pointer-events-none absolute left-1/2 -translate-x-1/2 animate-sheet-in rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
              pickedIncident ? PILL_TONE[pickedIncident] : 'bg-label text-canvas'
            }`}
            style={{ top: HEIGHT + 2 }}
          >
            {hourLabel(picked)}
          </span>
        )}
      </div>
    </div>
  )
}
