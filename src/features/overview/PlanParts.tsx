import { useId, type ReactNode } from 'react'
import { FAINT, WALL } from './drawing'

const DOOR_MOTION = '900ms cubic-bezier(0.45, 0, 0.25, 1)'

export function Door({ x, y, dx, dy, open }: { x: number; y: number; dx: number; dy: number; open: boolean }) {
  const mask = `door-${useId().replace(/\W/g, '')}`
  const radius = Math.hypot(dx, dy)
  const length = (Math.PI / 2) * radius
  const swing = `M ${x + dx} ${y + dy} A ${radius} ${radius} 0 0 1 ${x - dy} ${y + dx}`

  return (
    <g>
      <mask id={mask} maskUnits="userSpaceOnUse">
        <path
          d={swing}
          stroke="white"
          strokeWidth={6}
          strokeDasharray={`${length} ${length}`}
          style={{ strokeDashoffset: open ? 0 : length, transition: `stroke-dashoffset ${DOOR_MOTION}` }}
        />
      </mask>
      <path d={swing} stroke={FAINT} strokeDasharray="4 4" mask={`url(#${mask})`} />
      <line
        x1={x}
        y1={y}
        x2={x + dx}
        y2={y + dy}
        strokeWidth={WALL}
        strokeLinecap="round"
        style={{
          transform: `rotate(${open ? 90 : 0}deg)`,
          transformOrigin: `${x}px ${y}px`,
          transition: `transform ${DOOR_MOTION}, stroke 300ms ease`,
        }}
      />
    </g>
  )
}

export type Area = { x: number; y: number; w: number; h: number }

export function Hotspot({ label, area, onSelect, children }: { label: string; area: Area; onSelect: () => void; children: ReactNode }) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      onPointerDown={(event) => event.preventDefault()}
      onClick={onSelect}
      onKeyDown={(event) => event.key === 'Enter' && onSelect()}
      className="group cursor-pointer outline-none"
    >
      <rect x={area.x} y={area.y} width={area.w} height={area.h} fill="transparent" stroke="none" />
      <g className="[&_line]:transition-[stroke] [&_path]:transition-[stroke] [&_path]:duration-300 group-hover:[&_line]:stroke-accent group-hover:[&_path]:stroke-accent group-focus-visible:[&_line]:stroke-accent group-focus-visible:[&_path]:stroke-accent">
        {children}
      </g>
    </g>
  )
}

export function Label({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fill="rgb(255 255 255 / 0.35)"
      stroke="none"
      fontSize="11"
      letterSpacing="1.5"
      className="select-none transition-[fill] duration-300 group-hover:fill-accent group-focus-visible:fill-accent"
    >
      {children}
    </text>
  )
}
