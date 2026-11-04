import { DoorState } from '../../model/types'

const LINE = '#737373'
const FAINT = '#2e2e2e'

const ROOM = { x: 40, y: 40, w: 1120, h: 440, r: 40 }
const DOOR = { from: 820, to: 900 }
const WALL_X = 360

function corners(x: number, y: number, w: number, h: number, r: number) {
  const k = r * 0.1
  const right = x + w
  const bottom = y + h
  return {
    bottomRight: `C ${right - k} ${bottom} ${right} ${bottom - k} ${right} ${bottom - r}`,
    topRight: `C ${right} ${y + k} ${right - k} ${y} ${right - r} ${y}`,
    topLeft: `C ${x + k} ${y} ${x} ${y + k} ${x} ${y + r}`,
    bottomLeft: `C ${x} ${bottom - k} ${x + k} ${bottom} ${x + r} ${bottom}`,
  }
}

function squircle(x: number, y: number, w: number, h: number, r: number) {
  const c = corners(x, y, w, h, r)
  return [
    `M ${x + r} ${y + h}`,
    `L ${x + w - r} ${y + h}`,
    c.bottomRight,
    `L ${x + w} ${y + r}`,
    c.topRight,
    `L ${x + r} ${y}`,
    c.topLeft,
    `L ${x} ${y + h - r}`,
    c.bottomLeft,
    'Z',
  ].join(' ')
}

function againstWall(x: number, y: number, w: number, h: number, r: number) {
  const c = corners(x, y, w, h, r)
  return [`M ${x + w} ${y + h}`, `L ${x + w} ${y + r}`, c.topRight, `L ${x + r} ${y}`, c.topLeft, `L ${x} ${y + h}`].join(' ')
}

function walls(x: number, y: number, w: number, h: number, r: number, gapFrom: number, gapTo: number) {
  const c = corners(x, y, w, h, r)
  return [
    `M ${gapTo} ${y + h}`,
    `L ${x + w - r} ${y + h}`,
    c.bottomRight,
    `L ${x + w} ${y + r}`,
    c.topRight,
    `L ${x + r} ${y}`,
    c.topLeft,
    `L ${x} ${y + h - r}`,
    c.bottomLeft,
    `L ${gapFrom} ${y + h}`,
  ].join(' ')
}

const GRID = 40
const DESK = 2 * GRID
const ISLAND = { x: 20 * GRID, y: 3 * GRID, w: 4 * DESK, h: 2 * DESK }
const CHAIR = { long: 22, short: 18 }

const chairs = Array.from({ length: 8 }, (_, i) => ({
  x: ISLAND.x + (DESK - CHAIR.long) / 2 + (i % 4) * DESK,
  y: i < 4 ? ISLAND.y - CHAIR.short - 4 : ISLAND.y + ISLAND.h + 4,
}))

const STUDIO_DISPLAY = { width: 623, depth: 28, footFront: 56, footBack: 93, footWidth: 210 }
const MM = 44 / STUDIO_DISPLAY.width
const MONITOR = { w: STUDIO_DISPLAY.width * MM, h: STUDIO_DISPLAY.depth * MM }
const FOOT = { w: STUDIO_DISPLAY.footWidth * MM, front: STUDIO_DISPLAY.footFront * MM, back: STUDIO_DISPLAY.footBack * MM }
const FOOT_GAP = 6

const desktops = Array.from({ length: 8 }, (_, i) => {
  const x = ISLAND.x + DESK / 2 + (i % 4) * DESK
  const divider = ISLAND.y + DESK
  const top = i < 4
  const monitorY = top ? divider - FOOT_GAP - FOOT.front - MONITOR.h : divider + FOOT_GAP + FOOT.front
  return { x, monitorY, above: top ? FOOT.back : FOOT.front, below: top ? FOOT.front : FOOT.back }
})

const TABLE = { x: 4 * GRID, y: 4 * GRID, w: 2 * GRID, h: 4 * GRID }

const meetingChairs = [-52, 0, 52].flatMap((dy) => {
  const y = TABLE.y + TABLE.h / 2 + dy - CHAIR.long / 2
  return [
    { x: TABLE.x - CHAIR.short - 4, y },
    { x: TABLE.x + TABLE.w + 4, y },
  ]
})

const SCREEN = { x: TABLE.x - 8, y: 464, w: TABLE.w + 16, h: 8 }
const CABINET = { x: 10 * GRID, y: 2 * GRID, w: 4 * GRID, h: GRID }
const WATER = { x: 17 * GRID, y: 11 * GRID, w: GRID, h: GRID }

const WALL = 1.5
const LABEL_GAP = 16
const CAP_HEIGHT = 8

const labelBelow = (bottom: number) => bottom + LABEL_GAP + CAP_HEIGHT
const labelAbove = (top: number) => top - LABEL_GAP

function Door({ x, y, dx, dy, open }: { x: number; y: number; dx: number; dy: number; open: boolean }) {
  const radius = Math.hypot(dx, dy)
  const swing = `M ${x + dx} ${y + dy} A ${radius} ${radius} 0 0 1 ${x - dy} ${y + dx}`

  return (
    <g>
      <path
        d={swing}
        stroke={FAINT}
        strokeDasharray="4 4"
        style={{ opacity: open ? 1 : 0, transition: 'opacity 700ms ease' }}
      />
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
          transition: 'transform 700ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      />
    </g>
  )
}

export function FloorPlan({ door }: { door: DoorState }) {
  return (
    <div className="w-full">
      <svg viewBox="0 0 1200 520" className="w-full" fill="none" stroke={LINE} strokeWidth={1.2}>
        <defs>
          <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} stroke="rgb(255 255 255 / 0.05)" strokeWidth={1} />
          </pattern>
        </defs>

        <path d={squircle(ROOM.x, ROOM.y, ROOM.w, ROOM.h, ROOM.r)} fill="url(#grid)" stroke="none" />

        <path d={walls(ROOM.x, ROOM.y, ROOM.w, ROOM.h, ROOM.r, DOOR.from, DOOR.to)} strokeWidth={WALL} />
        <Door x={DOOR.to} y={480} dx={DOOR.from - DOOR.to} dy={0} open={door === DoorState.Unlocked} />

        <path d={`M ${WALL_X} 40 L ${WALL_X} 380 M ${WALL_X} 440 L ${WALL_X} 480`} strokeWidth={WALL} />
        <Door x={WALL_X} y={440} dx={0} dy={-60} open />

        <path d={squircle(TABLE.x, TABLE.y, TABLE.w, TABLE.h, 24)} />
        <path d={squircle(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 3)} />
        {meetingChairs.map((chair, i) => (
          <path key={i} d={squircle(chair.x, chair.y, CHAIR.short, CHAIR.long, 6)} stroke={FAINT} />
        ))}

        <path d={squircle(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, 20)} />
        <path
          d={[1, 2, 3]
            .map((n) => `M ${ISLAND.x + n * DESK} ${ISLAND.y} L ${ISLAND.x + n * DESK} ${ISLAND.y + ISLAND.h}`)
            .concat(`M ${ISLAND.x} ${ISLAND.y + DESK} L ${ISLAND.x + ISLAND.w} ${ISLAND.y + DESK}`)
            .join(' ')}
          strokeWidth={0.6}
        />
        {chairs.map((chair, i) => (
          <path key={i} d={squircle(chair.x, chair.y, CHAIR.long, CHAIR.short, 6)} stroke={FAINT} />
        ))}
        {desktops.map(({ x, monitorY, above, below }, i) => {
          const bottom = monitorY + MONITOR.h
          return (
            <g key={i} strokeWidth={0.6}>
              <path d={squircle(x - MONITOR.w / 2, monitorY, MONITOR.w, MONITOR.h, 1)} />
              <g strokeWidth={0.4}>
                <path d={againstWall(x - FOOT.w / 2, monitorY - above, FOOT.w, above, 3)} />
                <path
                  d={againstWall(x - FOOT.w / 2, bottom, FOOT.w, below, 3)}
                  transform={`rotate(180 ${x} ${bottom + below / 2})`}
                />
              </g>
            </g>
          )
        })}

        <path d={againstWall(WATER.x, WATER.y, WATER.w, WATER.h, 12)} />
        <path d={squircle(CABINET.x, CABINET.y, CABINET.w, CABINET.h, 12)} />

        <g fill="rgb(255 255 255 / 0.35)" stroke="none" fontSize="11" letterSpacing="1.5">
          <text x={TABLE.x + TABLE.w / 2} y={labelBelow(TABLE.y + TABLE.h)} textAnchor="middle">
            MEETING ROOM
          </text>
          <text x={SCREEN.x + SCREEN.w / 2} y={labelAbove(SCREEN.y)} textAnchor="middle">
            SCREEN
          </text>
          <text x={ISLAND.x + ISLAND.w / 2} y={labelBelow(chairs[4].y + CHAIR.short)} textAnchor="middle">
            DESK ISLAND
          </text>
          <text x={WATER.x + WATER.w / 2} y={labelAbove(WATER.y)} textAnchor="middle">
            WATER
          </text>
          <text x={CABINET.x + CABINET.w / 2} y={labelBelow(CABINET.y + CABINET.h)} textAnchor="middle">
            DEVICE CABINET
          </text>
        </g>
      </svg>
    </div>
  )
}
