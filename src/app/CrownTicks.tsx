import type { IncidentMarks } from '../data/derive'
import { Incident } from '../model/types'
import {
  DEFAULT_HOUR,
  HEIGHT,
  HOURS,
  LABEL_HEIGHT,
  RANGE,
  STEP_ANGLE,
  STEPS_PER_WEEK,
  dayAt,
  hourLabel,
  weekLabel,
  type Selection,
} from './crown'

const PILL_CLEAR = 48
const PILL_FADE = 24

const INCIDENT_COLOR: Record<Incident, string> = {
  [Incident.DoorLeftUnlocked]: 'var(--color-danger)',
  [Incident.LightsLeftOn]: 'var(--color-glow)',
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric' })

type Props = {
  width: number
  position: number
  fine: boolean
  today: number
  nowHour: number
  selection: Selection
  incidents: IncidentMarks
}

export function CrownTicks({ width, position, fine, today, nowHour, selection, incidents }: Props) {
  const radius = width / 2
  const picked = selection.hour.status === 'picked' ? selection.hour.hour : undefined
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
      const hourIncident = incidents.hours.get(index * HOURS + h + DEFAULT_HOUR)
      hourTicks.push(
        <line
          key={`hour-${index}-${h}`}
          x1={hourX}
          x2={hourX}
          y1={HEIGHT / 2 - hourHalf}
          y2={HEIGHT / 2 + hourHalf}
          stroke={isNowHour ? 'var(--color-accent)' : hourIncident ? INCIDENT_COLOR[hourIncident] : 'currentColor'}
          strokeWidth={0.4 + 0.6 * hourDepth}
          strokeLinecap="round"
          opacity={(hourIncident ? 0.3 : 0.08) + 0.6 * hourDepth * hourDepth}
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
    const incident = fine ? incidents.hours.get(index * HOURS + DEFAULT_HOUR) : incidents.days.get(index)

    ticks.push(
      <line
        key={index}
        x1={x}
        x2={x}
        y1={HEIGHT / 2 - half}
        y2={HEIGHT / 2 + half}
        stroke={isNow ? 'var(--color-accent)' : incident ? INCIDENT_COLOR[incident] : 'currentColor'}
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
    <svg width={width} height={HEIGHT + LABEL_HEIGHT} className="block">
      <g style={{ opacity: fine ? 1 : 0, transition: 'opacity 300ms ease' }}>{hourTicks}</g>
      {ticks}
    </svg>
  )
}
