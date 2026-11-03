import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react'
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

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric' })

function clamp(step: number) {
  return Math.max(-RANGE, Math.min(RANGE, step))
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

export function TimeMachine() {
  const ref = useRef<HTMLDivElement>(null)
  const width = useElementWidth(ref)
  const radius = width / 2
  const spacing = radius * Math.sin(STEP_ANGLE)

  const [today] = useState(() => startOfDay(Date.now()))
  const [position, setPosition] = useState(0)
  const positionRef = useRef(0)
  const drag = useRef({ active: false, startX: 0, startPosition: 0, lastX: 0, lastTime: 0, velocity: 0 })
  const frame = useRef(0)
  const wheelSnap = useRef(0)
  const glide = useRef({ active: false, to: 0 })

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  function moveTo(next: number) {
    const clamped = clamp(next)
    if (Math.round(clamped) !== Math.round(positionRef.current)) playTick()
    positionRef.current = clamped
    setPosition(clamped)
    return clamped
  }

  function stop() {
    cancelAnimationFrame(frame.current)
    glide.current.active = false
  }

  function glideTo(target: number) {
    stop()
    const from = positionRef.current
    const to = clamp(target)
    const duration = 180 + Math.min(Math.abs(to - from) * 4, 520)
    const start = performance.now()
    glide.current = { active: true, to }

    function animate(time: number) {
      const progress = Math.min((time - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      moveTo(from + (to - from) * eased)
      if (progress < 1) frame.current = requestAnimationFrame(animate)
      else glide.current.active = false
    }

    frame.current = requestAnimationFrame(animate)
  }

  function snap() {
    moveTo(Math.round(positionRef.current))
  }

  function fling(initialVelocity: number) {
    let velocity = initialVelocity
    let last = performance.now()

    function roll(time: number) {
      const elapsed = time - last
      last = time
      velocity *= FRICTION ** (elapsed / 16)
      const reached = moveTo(positionRef.current + velocity * elapsed)

      if (Math.abs(velocity) < MIN_VELOCITY || Math.abs(reached) === RANGE) return snap()
      frame.current = requestAnimationFrame(roll)
    }

    frame.current = requestAnimationFrame(roll)
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
  }

  function onPointerMove(event: PointerEvent) {
    const d = drag.current
    if (!d.active) return
    const now = performance.now()
    const elapsed = Math.max(now - d.lastTime, 1)
    const instant = -(event.clientX - d.lastX) / spacing / elapsed
    d.velocity = 0.8 * instant + 0.2 * d.velocity
    d.lastX = event.clientX
    d.lastTime = now
    moveTo(d.startPosition - (event.clientX - d.startX) / spacing)
  }

  function onPointerUp(event: PointerEvent) {
    const d = drag.current
    d.active = false

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
    snap()
  }

  function onWheel(event: WheelEvent) {
    if (event.deltaX === 0) return
    stop()
    moveTo(positionRef.current + event.deltaX / spacing)
    clearTimeout(wheelSnap.current)
    wheelSnap.current = setTimeout(snap, 120)
  }

  function onKeyDown(event: KeyboardEvent) {
    const current = glide.current.active ? glide.current.to : Math.round(positionRef.current)
    const byWeek = event.metaKey || event.ctrlKey
    let next: number

    if (event.key === 'ArrowRight') {
      next = byWeek ? (Math.floor(current / STEPS_PER_WEEK) + 1) * STEPS_PER_WEEK : current + 1
    } else if (event.key === 'ArrowLeft') {
      next = byWeek ? (Math.ceil(current / STEPS_PER_WEEK) - 1) * STEPS_PER_WEEK : current - 1
    } else if (event.key === 'Home') {
      next = 0
    } else {
      return
    }

    event.preventDefault()
    glideTo(next)
  }


  const atNow = Math.abs(position) < 0.5
  const base = Math.floor(position)
  const fraction = position - base
  const visible = Math.floor(Math.PI / 2 / STEP_ANGLE)
  const ticks = []

  for (let k = -visible; k <= visible + 1; k++) {
    const index = base + k
    const angle = (k - fraction) * STEP_ANGLE
    if (Math.abs(index) > RANGE || Math.abs(angle) > Math.PI / 2) continue

    const depth = Math.cos(angle)
    const x = radius + radius * Math.sin(angle)
    const date = dayAt(today, index)
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
          opacity={(depth - 0.4) / 0.6}
        >
          {isNow ? 'Today' : dayFormat.format(date)}
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
          opacity={(depth - 0.4) / 0.6}
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
        onWheel={onWheel}
        onKeyDown={onKeyDown}
        className="relative cursor-grab touch-none text-label outline-none select-none active:cursor-grabbing"
        style={{ height: HEIGHT + LABEL_HEIGHT }}
      >
        <svg width={width} height={HEIGHT + LABEL_HEIGHT} className="block">
          {ticks}
        </svg>
        <div
          className={`pointer-events-none absolute top-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full transition-colors ${
            atNow ? 'bg-accent' : 'bg-label'
          }`}
          style={{ height: HEIGHT }}
        />
      </div>
    </div>
  )
}
