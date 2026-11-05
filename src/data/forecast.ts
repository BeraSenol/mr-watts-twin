import {
  DoorState,
  LightPower,
  Presence,
  TimeMode,
  type DeviceState,
  type PersonState,
  type Snapshot,
  type TimeReading,
} from '../model/types'
import { devices, lights, people } from './catalogue'
import { dayOf, MINUTE, planFor, reservationsOn, unknown, type Loan } from './history'
import { CLOSES_HOUR } from './office'

export const FORECAST_WEEKS = 4
const EXPECTED_CHANCE = 0.5

function pastSameWeekdays(day: number, today: number) {
  const days: number[] = []
  for (let back = 1; days.length < FORECAST_WEEKS && back <= FORECAST_WEEKS * 2; back++) {
    const date = new Date(day)
    date.setDate(date.getDate() - 7 * back)
    if (date.getTime() < today) days.push(date.getTime())
  }
  return days
}

export const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length

function forecastPerson(personId: string, day: number, minute: number, today: number, arrivedAt?: number): PersonState {
  const visits = pastSameWeekdays(day, today).map((past) => planFor(past).visits.find((visit) => visit.personId === personId))
  const came = visits.filter((visit) => visit !== undefined)
  const leaves = came.length > 0 ? Math.round(average(came.map((visit) => visit.end))) : CLOSES_HOUR * 60
  const departure: TimeReading = { status: 'estimated', at: day + leaves * MINUTE }

  if (arrivedAt !== undefined) {
    if (minute >= leaves) return { personId, presence: Presence.Absent, arrival: { status: 'actual', at: day + arrivedAt * MINUTE }, departure }
    return { personId, presence: Presence.Expected, arrival: { status: 'actual', at: day + arrivedAt * MINUTE }, departure }
  }

  const here = came.filter((visit) => visit.start <= minute && minute < visit.end)
  const chance = visits.length > 0 ? here.length / visits.length : 0
  if (chance < EXPECTED_CHANCE) return { personId, presence: Presence.Absent, arrival: unknown, departure: unknown }
  return {
    personId,
    presence: Presence.Expected,
    arrival: { status: 'estimated', at: day + Math.round(average(came.map((visit) => visit.start))) * MINUTE },
    departure,
  }
}

const mostCommon = (values: string[]) =>
  values.reduce((best, value) => (values.filter((v) => v === value).length > values.filter((v) => v === best).length ? value : best), values[0])

function forecastDevice(
  deviceId: string,
  day: number,
  minute: number,
  today: number,
  expected: (personId: string) => boolean,
  outNow?: Loan,
): DeviceState {
  const unknownBattery = { status: 'unknown' } as const
  const weeks = pastSameWeekdays(day, today)
  const loans = weeks.flatMap((past) => planFor(past).loans.filter((loan) => loan.deviceId === deviceId))

  if (outNow) {
    const theirs = loans.filter((loan) => loan.personId === outNow.personId)
    const until = theirs.length > 0 ? Math.round(average(theirs.map((loan) => loan.end))) : outNow.start + 120
    if (minute >= until || !expected(outNow.personId)) return { deviceId, holder: { status: 'cabinet' }, battery: unknownBattery }
    return {
      deviceId,
      holder: { status: 'expected', personId: outNow.personId, from: day + outNow.start * MINUTE, until: day + until * MINUTE },
      battery: unknownBattery,
    }
  }

  const out = loans.filter((loan) => loan.start <= minute && minute < loan.end)
  const borrower = out.length > 0 ? mostCommon(out.map((loan) => loan.personId)) : ''
  const theirs = out.filter((loan) => loan.personId === borrower)
  if (weeks.length === 0 || theirs.length / weeks.length < EXPECTED_CHANCE || !expected(borrower)) {
    return { deviceId, holder: { status: 'cabinet' }, battery: unknownBattery }
  }
  return {
    deviceId,
    holder: {
      status: 'expected',
      personId: borrower,
      from: day + Math.round(average(theirs.map((loan) => loan.start))) * MINUTE,
      until: day + Math.round(average(theirs.map((loan) => loan.end))) * MINUTE,
    },
    battery: unknownBattery,
  }
}

function estimatedSpan(states: PersonState[], unlocked: TimeReading) {
  const arrivals = states.flatMap((state) => (state.arrival.status === 'estimated' ? [state.arrival.at] : []))
  const departures = states.flatMap((state) => (state.departure.status === 'estimated' ? [state.departure.at] : []))
  const locked: TimeReading = departures.length > 0 ? { status: 'estimated', at: Math.max(...departures) } : unknown
  if (unlocked.status !== 'unknown' || arrivals.length === 0) return { unlocked, locked }
  return { unlocked: { status: 'estimated', at: Math.min(...arrivals) } as const, locked }
}

export function forecastSnapshot(moment: Date, now: Date): Snapshot {
  const { day, minute } = dayOf(moment)
  const { day: today, minute: nowMinute } = dayOf(now)
  const plan = planFor(day)
  const isToday = day === today

  const arrivedToday = (personId: string) =>
    isToday ? plan.visits.find((visit) => visit.personId === personId && visit.start <= nowMinute && nowMinute < visit.end)?.start : undefined
  const leftToday = (personId: string) =>
    isToday && plan.visits.some((visit) => visit.personId === personId && visit.end <= nowMinute)
  const forecast = people.map((person): PersonState =>
    leftToday(person.id)
      ? { personId: person.id, presence: Presence.Absent, arrival: unknown, departure: unknown }
      : forecastPerson(person.id, day, minute, today, arrivedToday(person.id)),
  )

  const outNow = (deviceId: string) =>
    isToday ? plan.loans.find((loan) => loan.deviceId === deviceId && loan.start <= nowMinute && nowMinute < loan.end) : undefined
  const isExpected = (personId: string) =>
    forecast.some((state) => state.personId === personId && state.presence === Presence.Expected)

  const opened: TimeReading =
    isToday && plan.visits.length > 0 && plan.firstArrival <= nowMinute ? { status: 'actual', at: day + plan.firstArrival * MINUTE } : unknown

  return {
    time: moment.getTime(),
    mode: TimeMode.Future,
    door: DoorState.Unknown,
    doorTimes: estimatedSpan(forecast, opened),
    people: forecast,
    lights: lights.map((light) => ({ lightId: light.id, power: LightPower.Unknown, brightness: 0 })),
    devices: devices.map((device) => forecastDevice(device.id, day, minute, today, isExpected, outNow(device.id))),
    music: { status: 'unknown' },
    playedToday: [],
    reservations: reservationsOn(day),
    cupsToday: 0,
  }
}
