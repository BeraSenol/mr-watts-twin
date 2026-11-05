import {
  DoorState,
  LightPower,
  Presence,
  Room,
  TimeMode,
  type DeviceState,
  type LightState,
  type MusicState,
  type PersonState,
  type Play,
  type Snapshot,
  type TimeReading,
} from '../model/types'
import { devices, lights, people, tracks } from './catalogue'
import { CITIES, CLOSES_HOUR, OPENS_HOUR } from './office'
import { seededRandom } from './random'

const MINUTE = 60_000
const VISIT_CHANCE = [0, 0.6, 0.85, 0.65, 0.85, 0.4, 0]
const REGULARS: Record<string, number> = {
  jonas: 1,
  pieter: 0.95,
  thomas: 1,
  ruben: 0.9,
  simon: 1,
  lars: 0.7,
  matthias: 0.75,
  kobe: 0.65,
}
const LEFT_ON_CHANCE = 0.2
const LOAN_CHANCE = 0.3
const DOUBLE_BOOKING_CHANCE = 0.15
const MEETING_TITLES = ['Sprint planning', 'Client demo', 'Design review', 'Unity sync', 'Team retro', 'Investor call', 'Playtest']

type Span = { start: number; end: number }
type Visit = Span & { personId: string }
type Loan = Span & { deviceId: string; personId: string; location: string }
type Meeting = Span & { id: string; title: string; personId: string }

type DayPlan = {
  visits: Visit[]
  firstArrival: number
  lastDeparture: number
  leftOnUntil: number
  loans: Loan[]
  meetings: Meeting[]
  cups: number[]
  batteries: Record<string, number>
  firstTrack: number
}

const plans = new Map<number, DayPlan>()

function planFor(day: number): DayPlan {
  const cached = plans.get(day)
  if (cached) return cached

  const random = seededRandom(Math.round(day / MINUTE))
  const between = (min: number, max: number) => min + Math.floor(random() * (max - min))
  const pick = <T,>(items: T[]) => items[Math.floor(random() * items.length)]
  const visitChance = VISIT_CHANCE[new Date(day).getDay()]

  const visits = people
    .filter((person) => random() < visitChance * REGULARS[person.id])
    .map((person) => ({
      personId: person.id,
      start: between(OPENS_HOUR * 60, OPENS_HOUR * 60 + 105),
      end: between(CLOSES_HOUR * 60 - 90, CLOSES_HOUR * 60 + 60),
    }))

  const firstArrival = Math.min(...visits.map((visit) => visit.start))
  const lastDeparture = Math.max(...visits.map((visit) => visit.end))
  const anyone = visits.length > 0

  const plan: DayPlan = {
    visits,
    firstArrival,
    lastDeparture,
    leftOnUntil: anyone && random() < LEFT_ON_CHANCE ? lastDeparture + between(60, 240) : lastDeparture,
    loans: anyone
      ? devices
          .filter(() => random() < LOAN_CHANCE)
          .map((device) => {
            const visit = pick(visits)
            const start = between(visit.start, visit.start + 120)
            return { deviceId: device.id, personId: visit.personId, location: pick(CITIES), start, end: start + between(60, 300) }
          })
      : [],
    meetings: [],
    cups: visits.flatMap((visit) => Array.from({ length: between(3, 8) }, () => between(visit.start, visit.end))),
    batteries: Object.fromEntries(devices.map((device) => [device.id, between(40, 100)])),
    firstTrack: between(0, tracks.length),
  }

  const wanted = visits.length > 1 ? between(1, 4) : 0
  for (let index = 0; index < wanted; index++) {
    const start = between(18, 33) * 30
    const meeting = { id: `${day}-${index}`, title: pick(MEETING_TITLES), personId: pick(visits).personId, start, end: start + pick([30, 60, 90]) }
    const clashes = plan.meetings.some((other) => meeting.start < other.end && other.start < meeting.end)
    if (!clashes || random() < DOUBLE_BOOKING_CHANCE) plan.meetings.push(meeting)
  }

  plans.set(day, plan)
  return plan
}

const unknown: TimeReading = { status: 'unknown' }

function modeOf(moment: Date, now: Date) {
  if (Math.abs(moment.getTime() - now.getTime()) < MINUTE) return TimeMode.Now
  return moment < now ? TimeMode.Past : TimeMode.Future
}

export function snapshotAt(moment: Date, now: Date): Snapshot {
  const midnight = new Date(moment)
  midnight.setHours(0, 0, 0, 0)
  const day = midnight.getTime()
  const minute = moment.getHours() * 60 + moment.getMinutes()
  const at = (minutes: number) => day + minutes * MINUTE
  const actual = (minutes: number): TimeReading => ({ status: 'actual', at: at(minutes) })

  const plan = planFor(day)
  const mode = modeOf(moment, now)
  const reservations = plan.meetings.map((meeting) => ({
    id: meeting.id,
    title: meeting.title,
    personId: meeting.personId,
    start: at(meeting.start),
    end: at(meeting.end),
  }))

  if (mode === TimeMode.Future) {
    return {
      time: moment.getTime(),
      mode,
      door: DoorState.Unknown,
      doorTimes: { unlocked: unknown, locked: unknown },
      people: people.map((person) => ({ personId: person.id, presence: Presence.Unknown, arrival: unknown, departure: unknown })),
      lights: lights.map((light) => ({ lightId: light.id, power: LightPower.Unknown, brightness: 0 })),
      devices: devices.map((device) => ({ deviceId: device.id, holder: { status: 'unknown' }, battery: { status: 'unknown' } })),
      music: { status: 'unknown' },
      playedToday: [],
      reservations,
      cupsToday: 0,
    }
  }

  const peopleStates = people.map((person): PersonState => {
    const visit = plan.visits.find((candidate) => candidate.personId === person.id)
    if (!visit) return { personId: person.id, presence: Presence.Absent, arrival: unknown, departure: unknown }
    return {
      personId: person.id,
      presence: visit.start <= minute && minute < visit.end ? Presence.Present : Presence.Absent,
      arrival: visit.start <= minute ? actual(visit.start) : unknown,
      departure: visit.end <= minute ? actual(visit.end) : unknown,
    }
  })

  const present = peopleStates.filter((state) => state.presence === Presence.Present).length
  const leftOn = present === 0 && plan.lastDeparture <= minute && minute < plan.leftOnUntil
  const mainOn = present > 0 ? Math.min(4, Math.ceil(present / 2)) : leftOn ? 1 : 0
  const meetingNow = plan.meetings.some((meeting) => meeting.start <= minute && minute < meeting.end)

  let mainIndex = 0
  const lightStates = lights.map((light): LightState => {
    const on = light.room === Room.Main ? mainIndex++ < mainOn : meetingNow
    return { lightId: light.id, power: on ? LightPower.On : LightPower.Off, brightness: on ? 80 : 0 }
  })

  const deviceStates = devices.map((device): DeviceState => {
    const loans = plan.loans.filter((loan) => loan.deviceId === device.id)
    const used = loans.reduce((sum, loan) => sum + Math.max(0, Math.min(loan.end, minute) - loan.start), 0)
    const battery = { status: 'known', level: Math.max(5, Math.round(plan.batteries[device.id] - used / 6)) } as const
    const loan = loans.find((candidate) => candidate.start <= minute && minute < candidate.end)
    if (!loan) return { deviceId: device.id, holder: { status: 'cabinet' }, battery }
    return {
      deviceId: device.id,
      holder: { status: 'borrowed', personId: loan.personId, since: at(loan.start), location: loan.location },
      battery,
    }
  })

  const playedToday: Play[] = []
  let music: MusicState = { status: 'off' }
  if (plan.visits.length > 0 && minute > plan.firstArrival) {
    const until = (Math.min(minute, plan.lastDeparture) - plan.firstArrival) * 60
    for (let elapsed = 0, index = plan.firstTrack; elapsed <= until; index++) {
      const track = tracks[index % tracks.length]
      playedToday.push({ trackId: track.id, playedAt: at(plan.firstArrival) + elapsed * 1000 })
      if (elapsed + track.durationSec > until && minute < plan.lastDeparture) {
        music = {
          status: 'playing',
          trackId: track.id,
          sourceDevice: 'Office speaker',
          positionSec: until - elapsed,
          queue: [1, 2, 3].map((offset) => tracks[(index + offset) % tracks.length].id),
        }
      }
      elapsed += track.durationSec
    }
  }

  return {
    time: moment.getTime(),
    mode,
    door: present > 0 ? DoorState.Unlocked : DoorState.Locked,
    doorTimes: {
      unlocked: plan.visits.length > 0 && plan.firstArrival <= minute ? actual(plan.firstArrival) : unknown,
      locked: plan.visits.length > 0 && plan.lastDeparture <= minute ? actual(plan.lastDeparture) : unknown,
    },
    people: peopleStates,
    lights: lightStates,
    devices: deviceStates,
    music,
    playedToday,
    reservations,
    cupsToday: plan.cups.filter((cup) => cup <= minute).length,
  }
}
