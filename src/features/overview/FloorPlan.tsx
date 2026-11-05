import { useState, type PointerEvent } from 'react'
import { DoorState } from '../../model/types'
import { DASH, FAINT, LINE, PREDICTED, SEATED, WALL, againstWall, squircle, walls } from './drawing'
import { Panel } from './panel'
import { Door, Hotspot, Label } from './PlanParts'

const ROOM = { x: 40, y: 40, w: 1120, h: 440, r: 40 }
const DOOR = { from: 820, to: 900 }
const WALL_X = 360

const GRID = 40
const DESK = 2 * GRID
const ISLAND = { x: 20 * GRID, y: 3 * GRID, w: 4 * DESK, h: 2 * DESK }
const CHAIR = { long: 22, short: 18 }

const chairs = Array.from({ length: 8 }, (_, i) => ({
  x: ISLAND.x + (DESK - CHAIR.long) / 2 + (i % 4) * DESK,
  y: i < 4 ? ISLAND.y - CHAIR.short - 4 : ISLAND.y + ISLAND.h + 4,
}))

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
const SLOT = { w: 10, h: 22, gap: 5 }
const SLOT_Y = CABINET.y + (CABINET.h - SLOT.h) / 2

function slotX(index: number, count: number) {
  const row = count * SLOT.w + (count - 1) * SLOT.gap
  return CABINET.x + (CABINET.w - row) / 2 + index * (SLOT.w + SLOT.gap)
}

function spot(filled: boolean, predicted: boolean) {
  if (predicted) return filled ? { stroke: PREDICTED, fill: 'none', strokeDasharray: DASH } : undefined
  return filled ? { stroke: FAINT, fill: SEATED } : { stroke: FAINT, fill: 'none' }
}
const WATER = { x: 17 * GRID, y: 11 * GRID, w: GRID, h: GRID }
const SPEAKER = { x: 26 * GRID, y: 11 * GRID, w: 2 * GRID, h: GRID }

const AREAS = {
  meeting: { x: 48, y: 48, w: 304, h: 424 },
  island: { x: 784, y: 88, w: 352, h: 248 },
  cabinet: { x: 388, y: 68, w: 184, h: 88 },
  speaker: { x: 1028, y: 404, w: 104, h: 76 },
  water: { x: 668, y: 404, w: 64, h: 76 },
  door: { x: 816, y: 396, w: 88, h: 84 },
}

const GLOW_RADIUS = 260
const GLOW_STRENGTH = 0.25

const LABEL_GAP = 16
const CAP_HEIGHT = 8

const labelBelow = (bottom: number) => bottom + LABEL_GAP + CAP_HEIGHT
const labelAbove = (top: number) => top - LABEL_GAP

type Props = {
  door: DoorState
  seats: number
  devicesIn: number
  deviceSlots: number
  predicted: boolean
  meetingInUse: boolean
  onSelect: (panel: Panel) => void
}

export function FloorPlan({ door, seats, devicesIn, deviceSlots, predicted, meetingInUse, onSelect }: Props) {
  const [pointer, setPointer] = useState({ x: 0, y: 0, inside: false })

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const matrix = event.currentTarget.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    setPointer({ x: point.x, y: point.y, inside: true })
  }

  return (
    <div className="w-full">
      <svg
        viewBox="0 0 1200 520"
        className="w-full"
        fill="none"
        stroke={LINE}
        strokeWidth={1.2}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setPointer((current) => ({ ...current, inside: false }))}
      >
        <defs>
          <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} stroke="rgb(255 255 255 / 0.05)" strokeWidth={1} />
          </pattern>
          <pattern id="grid-glow" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
            <path d={`M ${GRID} 0 L 0 0 0 ${GRID}`} stroke="#0a84ff" strokeWidth={1} />
          </pattern>
          <radialGradient id="glow" gradientUnits="userSpaceOnUse" cx={pointer.x} cy={pointer.y} r={GLOW_RADIUS}>
            <stop offset="0" stopColor="white" stopOpacity={GLOW_STRENGTH} />
            <stop offset="1" stopColor="white" stopOpacity={0} />
          </radialGradient>
          <mask id="glow-mask">
            <rect width="1200" height="520" fill="url(#glow)" />
          </mask>
        </defs>

        <path d={squircle(ROOM.x, ROOM.y, ROOM.w, ROOM.h, ROOM.r)} fill="url(#grid)" stroke="none" />
        <path
          d={squircle(ROOM.x, ROOM.y, ROOM.w, ROOM.h, ROOM.r)}
          fill="url(#grid-glow)"
          stroke="none"
          mask="url(#glow-mask)"
          style={{ opacity: pointer.inside ? 1 : 0, transition: 'opacity 600ms ease' }}
        />

        <path d={walls(ROOM.x, ROOM.y, ROOM.w, ROOM.h, ROOM.r, DOOR.from, DOOR.to)} strokeWidth={WALL} />
        <path d={`M ${WALL_X} 40 L ${WALL_X} 380 M ${WALL_X} 440 L ${WALL_X} 480`} strokeWidth={WALL} />
        <Door x={WALL_X} y={440} dx={0} dy={-60} open={!meetingInUse} />

        <Hotspot label="Meeting room" area={AREAS.meeting} onSelect={() => onSelect(Panel.Meeting)}>
          <path d={squircle(TABLE.x, TABLE.y, TABLE.w, TABLE.h, 24)} />
          <path d={squircle(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 3)} />
          {meetingChairs.map((chair, i) => {
            const style = spot(meetingInUse, predicted)
            return style && <path key={i} d={squircle(chair.x, chair.y, CHAIR.short, CHAIR.long, 6)} {...style} />
          })}
          <Label x={TABLE.x + TABLE.w / 2} y={labelBelow(TABLE.y + TABLE.h)}>
            MEETING ROOM
          </Label>
          <Label x={SCREEN.x + SCREEN.w / 2} y={labelAbove(SCREEN.y)}>
            SCREEN
          </Label>
        </Hotspot>

        <Hotspot label="Desk island" area={AREAS.island} onSelect={() => onSelect(Panel.People)}>
          <path d={squircle(ISLAND.x, ISLAND.y, ISLAND.w, ISLAND.h, 20)} />
          <path
            d={[1, 2, 3]
              .map((n) => `M ${ISLAND.x + n * DESK} ${ISLAND.y} L ${ISLAND.x + n * DESK} ${ISLAND.y + ISLAND.h}`)
              .concat(`M ${ISLAND.x} ${ISLAND.y + DESK} L ${ISLAND.x + ISLAND.w} ${ISLAND.y + DESK}`)
              .join(' ')}
            strokeWidth={0.6}
          />
          {chairs.map((chair, i) => {
            const style = spot(i < seats, predicted)
            return style && <path key={i} d={squircle(chair.x, chair.y, CHAIR.long, CHAIR.short, 6)} {...style} />
          })}
          <Label x={ISLAND.x + ISLAND.w / 2} y={labelBelow(chairs[4].y + CHAIR.short)}>
            DESK ISLAND
          </Label>
        </Hotspot>

        <Hotspot label="Device cabinet" area={AREAS.cabinet} onSelect={() => onSelect(Panel.Devices)}>
          <path d={squircle(CABINET.x, CABINET.y, CABINET.w, CABINET.h, 12)} />
          {Array.from({ length: deviceSlots }, (_, i) => {
            const style = spot(i < devicesIn, predicted)
            return style && <path key={i} d={squircle(slotX(i, deviceSlots), SLOT_Y, SLOT.w, SLOT.h, 3)} {...style} />
          })}
          <Label x={CABINET.x + CABINET.w / 2} y={labelBelow(CABINET.y + CABINET.h)}>
            DEVICE CABINET
          </Label>
        </Hotspot>

        <Hotspot label="Speaker" area={AREAS.speaker} onSelect={() => onSelect(Panel.Music)}>
          <path d={againstWall(SPEAKER.x, SPEAKER.y, SPEAKER.w, SPEAKER.h, 12)} />
          <Label x={SPEAKER.x + SPEAKER.w / 2} y={labelAbove(SPEAKER.y)}>
            SPEAKER
          </Label>
        </Hotspot>

        <Hotspot label="Water station" area={AREAS.water} onSelect={() => onSelect(Panel.Energy)}>
          <path d={againstWall(WATER.x, WATER.y, WATER.w, WATER.h, 12)} />
          <Label x={WATER.x + WATER.w / 2} y={labelAbove(WATER.y)}>
            WATER
          </Label>
        </Hotspot>

        <Hotspot label="Front door" area={AREAS.door} onSelect={() => onSelect(Panel.Door)}>
          <Door x={DOOR.to} y={480} dx={DOOR.from - DOOR.to} dy={0} open={door === DoorState.Unlocked} />
        </Hotspot>
      </svg>
    </div>
  )
}
