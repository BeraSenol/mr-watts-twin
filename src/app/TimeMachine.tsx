import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { playTick } from './playTick'
import { useElementWidth } from './useElementWidth'

const STEPS_PER_WEEK = 7
const RANGE = 4 * STEPS_PER_WEEK
const STEP_ANGLE = (7.5 * Math.PI) / 180
const FRICTION = 0.99
const MIN_VELOCITY = 0.002
const CLICK_TOLERANCE = 4
const HEIGHT = 32
const LABEL_HEIGHT = 28
const HOURS = 24
const HOLD_MS = 1000
const DEFAULT_HOUR = 10
const FINE_DRAG = 6
const PILL_CLEAR = 48
const PILL_FADE = 24

export type Hour = { status: 'default' } | { status: 'picked'; hour: number }
export type Selection = { day: number; hour: Hour }

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric' })
const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`

function clamp(step: number) {
  return Math.max(-RANGE, Math.min(RANGE, step))
}

function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

function startOfDay(time: number) {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

function dayAt(today: number, index: number) {
  const date = new Date(today)
  date.setDate(date.getDate() + index)
  return date
}

function weekLabel(index: number) {
  const weeks = index / STEPS_PER_WEEK
  const count = Math.abs(weeks)
  const unit = count === 1 ? 'week' : 'weeks'
  return weeks < 0 ? `${count} ${unit} ago` : `In ${count} ${unit}`
}

export function TimeMachine({ onChange }: { onChange: (selection: Selection) => void }) {
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
  const glide = useRef({ active: false, to: 0 })

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const unit = () => (fineRef.current ? 1 / HOURS : 1)
  const roundToUnit = (value: number) => Math.round(value / unit()) * unit()

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
    if (Math.round(clamped / unit()) !== Math.round(positionRef.current / unit())) {
      playTick()
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
    stop()
    const from = positionRef.current
    const to = clamp(target)
    const time = duration ?? 180 + Math.min(Math.abs(to - from) * 4, 520)
    const start = performance.now()
    glide.current = { active: true, to }

    function animate(now: number) {
      const progress = Math.min((now - start) / time, 1)
      const eased = 1 - (1 - progress) ** 3
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
      glideTo(Math.round(d.startPosition + angle / STEP_ANGLE))
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

    if (fineRef.current && (event.key === 'ArrowRight' || event.key === 'ArrowLeft')) {
      event.preventDefault()
      const current = roundToUnit(glide.current.active ? glide.current.to : positionRef.current)
      const step = event.metaKey || event.ctrlKey ? 1 : 1 / HOURS
      glideTo(current + (event.key === 'ArrowRight' ? step : -step))
      return
    }

    const current = glide.current.active ? glide.current.to : positionRef.current
    const byWeek = event.metaKey || event.ctrlKey
    let next: number

    if (event.key === 'ArrowRight') {
      next = byWeek ? (Math.floor(current / STEPS_PER_WEEK) + 1) * STEPS_PER_WEEK : Math.floor(current) + 1
    } else if (event.key === 'ArrowLeft') {
      next = byWeek ? (Math.ceil(current / STEPS_PER_WEEK) - 1) * STEPS_PER_WEEK : Math.ceil(current) - 1
    } else if (event.key === 'Home' || event.key === ' ') {
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
  const base = Math.floor(position)
  const fraction = position - base
  const visible = Math.floor(Math.PI / 2 / STEP_ANGLE)
  const ticks = []
  const hourTicks = []

  for (let k = -visible; k <= visible + 1; k++) {
    const index = base + k
    const angle = (k - fraction) * STEP_ANGLE
    if (Math.abs(index) > RANGE || Math.abs(angle) > Math.PI / 2) continue

    for (let h = 1; h < HOURS; h++) {
      const hourAngle = (k + h / HOURS - fraction) * STEP_ANGLE
      if (Math.abs(hourAngle) > Math.PI / 2 || index + h / HOURS > RANGE) continue
      const hourDepth = Math.cos(hourAngle)
      const hourX = radius + radius * Math.sin(hourAngle)
      const clock = (DEFAULT_HOUR + h) % HOURS
      const isNowHour = index * HOURS + h === nowHour - DEFAULT_HOUR
      const hourHalf = ((clock === 0 ? 14 : 7) * (0.5 + 0.5 * hourDepth)) / 2
      hourTicks.push(
        <line
          key={`hour-${index}-${h}`}
          x1={hourX}
          x2={hourX}
          y1={HEIGHT / 2 - hourHalf}
          y2={HEIGHT / 2 + hourHalf}
          stroke={isNowHour ? 'var(--color-accent)' : 'currentColor'}
          strokeWidth={0.4 + 0.6 * hourDepth}
          strokeLinecap="round"
          opacity={0.08 + 0.6 * hourDepth * hourDepth}
        />,
      )
    }

    const depth = Math.cos(angle)
    const x = radius + radius * Math.sin(angle)
    const date = dayAt(today, index)
    const clearance = fine ? Math.min(Math.max((Math.abs(x - radius) - PILL_CLEAR) / PILL_FADE, 0), 1) : 1
    const labelOpacity = ((depth - 0.4) / 0.6) * clearance
    const isNow = index === 0
    const isWeek = index % STEPS_PER_WEEK === 0 && !isNow
    const length = isNow ? HEIGHT : isWeek ? 22 : 12
    const half = (length * (0.5 + 0.5 * depth)) / 2

    ticks.push(
      <line
        key={index}
        x1={x}
        x2={x}
        y1={HEIGHT / 2 - half}
        y2={HEIGHT / 2 + half}
        stroke={isNow ? 'var(--color-accent)' : 'currentColor'}
        strokeWidth={0.5 + 1.5 * depth}
        strokeLinecap="round"
        opacity={0.1 + 0.9 * depth * depth}
      />,
    )

    if (depth > 0.4) {
      ticks.push(
        <text
          key={`label-${index}`}
          x={x}
          y={HEIGHT + 11}
          textAnchor="middle"
          fontSize={10}
          fill={isNow ? 'var(--color-accent)' : 'var(--color-label-secondary)'}
          opacity={labelOpacity}
        >
          {(isNow ? 'Today' : dayFormat.format(date)) +
            (!fine && picked !== undefined && selection.day === index ? ` · ${hourLabel(picked)}` : '')}
        </text>,
      )
    }

    if (isWeek && depth > 0.4) {
      ticks.push(
        <text
          key={`week-${index}`}
          x={x}
          y={HEIGHT + 24}
          textAnchor="middle"
          fontSize={10}
          fontWeight={600}
          fill="var(--color-label)"
          opacity={labelOpacity}
        >
          {weekLabel(index)}
        </text>,
      )
    }
  }

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
        <svg width={width} height={HEIGHT + LABEL_HEIGHT} className="block">
          <g style={{ opacity: fine ? 1 : 0, transition: 'opacity 300ms ease' }}>{hourTicks}</g>
          {ticks}
        </svg>
        <div
          className={`pointer-events-none absolute top-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full transition-colors ${
            atNow ? 'bg-accent' : 'bg-label'
          }`}
          style={{ height: HEIGHT }}
        />
        {fine && picked !== undefined && (
          <span
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 animate-sheet-in rounded-full bg-label px-2 py-0.5 text-[11px] font-semibold text-canvas tabular-nums"
            style={{ top: HEIGHT + 2 }}
          >
            {hourLabel(picked)}
          </span>
        )}
      </div>
    </div>
  )
}
