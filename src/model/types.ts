type ValueOf<T> = T[keyof T]

export type Timestamp = number

export const TimeMode = {
  Past: 'past',
  Now: 'now',
  Future: 'future',
} as const
export type TimeMode = ValueOf<typeof TimeMode>

export type TimeReading =
  | { status: 'actual'; at: Timestamp }
  | { status: 'estimated'; at: Timestamp }
  | { status: 'unknown' }

// Catalogue

export interface Person {
  id: string
  name: string
  initials: string
  role: string
}

export const DeviceKind = {
  Phone: 'phone',
  Tablet: 'tablet',
  Headset: 'headset',
  Laptop: 'laptop',
  Oculus: 'oculus',
} as const
export type DeviceKind = ValueOf<typeof DeviceKind>

export interface Device {
  id: string
  kind: DeviceKind
  name: string
  model: string
  os: string
  latestOs: string
}

export const Room = {
  Main: 'main',
  Meeting: 'meeting',
} as const
export type Room = ValueOf<typeof Room>

export interface Light {
  id: string
  name: string
  room: Room
  watts: number
}

export interface Track {
  id: string
  title: string
  artist: string
  durationSec: number
}

// Snapshot

export const Presence = {
  Present: 'present',
  Absent: 'absent',
  Expected: 'expected',
  Unknown: 'unknown',
} as const
export type Presence = ValueOf<typeof Presence>

export interface PersonState {
  personId: string
  presence: Presence
  arrival: TimeReading
  departure: TimeReading
}

export const DoorState = {
  Locked: 'locked',
  Unlocked: 'unlocked',
  Unknown: 'unknown',
} as const
export type DoorState = ValueOf<typeof DoorState>

export const LightPower = {
  On: 'on',
  Off: 'off',
  Unknown: 'unknown',
} as const
export type LightPower = ValueOf<typeof LightPower>

export interface LightState {
  lightId: string
  power: LightPower
  brightness: number
}

export type DeviceHolder =
  | { status: 'cabinet' }
  | { status: 'borrowed'; personId: string; since: Timestamp }
  | { status: 'unknown' }

export type Battery =
  | { status: 'known'; level: number }
  | { status: 'unknown' }

export interface DeviceState {
  deviceId: string
  holder: DeviceHolder
  battery: Battery
}

export type MusicState =
  | { status: 'playing' | 'paused'; trackId: string; sourceDevice: string; positionSec: number; queue: string[] }
  | { status: 'off' }
  | { status: 'unknown' }

export interface Play {
  trackId: string
  playedAt: Timestamp
}

export const EnergySource = {
  Desktops: 'desktops',
  Lights: 'lights',
  Water: 'water',
  Network: 'network',
  Speaker: 'speaker',
} as const
export type EnergySource = ValueOf<typeof EnergySource>

export interface EnergyShare {
  source: EnergySource
  watts: number
}

export type LoanReturn =
  | { status: 'open' }
  | { status: 'returned'; at: Timestamp }

export interface Loan {
  deviceId: string
  personId: string
  borrowedAt: Timestamp
  returned: LoanReturn
}

export interface Snapshot {
  time: Timestamp
  mode: TimeMode
  door: DoorState
  people: PersonState[]
  lights: LightState[]
  devices: DeviceState[]
  music: MusicState
  playedToday: Play[]
  bottlesSavedToday: number
}
