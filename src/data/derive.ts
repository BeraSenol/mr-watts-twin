import {
  DoorState,
  EnergySource,
  Incident,
  LightPower,
  Presence,
  TimeMode,
  type EnergyShare,
  type Reservation,
  type Snapshot,
  type TimeReading,
} from '../model/types'
import { devices, lights, people, tracks } from './catalogue'
import { average, FORECAST_WEEKS } from './forecast'
import { snapshotAt } from './snapshot'
import { CLOSES_HOUR, OPENS_HOUR, WATTS } from './office'

const byId = <T extends { id: string }>(items: T[]) => new Map(items.map((item) => [item.id, item]))
export const personById = byId(people)
export const deviceById = byId(devices)
export const lightById = byId(lights)
export const trackById = byId(tracks)

const clockFormat = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })
export const clock = (time: number) => clockFormat.format(time)

export function readingText(reading: TimeReading) {
  if (reading.status === 'actual') return clock(reading.at)
  if (reading.status === 'estimated') return `~${clock(reading.at)}`
  return '—'
}

export const isKnown = (snapshot: Snapshot) => snapshot.mode !== TimeMode.Future
export const presentPeople = (snapshot: Snapshot) => snapshot.people.filter((person) => person.presence === Presence.Present)
export const expectedPeople = (snapshot: Snapshot) => snapshot.people.filter((person) => person.presence === Presence.Expected)
export const peopleCount = (snapshot: Snapshot) => (isKnown(snapshot) ? presentPeople(snapshot) : expectedPeople(snapshot)).length
export const lightsOn = (snapshot: Snapshot) => snapshot.lights.filter((light) => light.power === LightPower.On)
export const devicesIn = (snapshot: Snapshot) => snapshot.devices.filter((device) => device.holder.status === 'cabinet')
export const meetingsNow = (snapshot: Snapshot) =>
  snapshot.reservations.filter((reservation) => reservation.start <= snapshot.time && snapshot.time < reservation.end)

export function isAfterHours(snapshot: Snapshot) {
  const moment = new Date(snapshot.time)
  const weekend = moment.getDay() === 0 || moment.getDay() === 6
  return weekend || moment.getHours() < OPENS_HOUR || moment.getHours() >= CLOSES_HOUR
}

export function lastDeparture(snapshot: Snapshot): TimeReading {
  const times = snapshot.people.flatMap((person) => (person.departure.status === 'actual' ? [person.departure.at] : []))
  return times.length > 0 ? { status: 'actual', at: Math.max(...times) } : { status: 'unknown' }
}

export const doorLeftUnlocked = (snapshot: Snapshot) =>
  snapshot.door === DoorState.Unlocked && presentPeople(snapshot).length === 0
export const lightsLeftOn = (snapshot: Snapshot) =>
  isAfterHours(snapshot) && presentPeople(snapshot).length === 0 && lightsOn(snapshot).length > 0

export function incidentAt(snapshot: Snapshot) {
  if (doorLeftUnlocked(snapshot)) return Incident.DoorLeftUnlocked
  if (lightsLeftOn(snapshot)) return Incident.LightsLeftOn
  return undefined
}

export function conflicts(reservations: Reservation[]) {
  return new Set(
    reservations
      .filter((a) => reservations.some((b) => b.id !== a.id && a.start < b.end && b.start < a.end))
      .map((reservation) => reservation.id),
  )
}

export function energyShares(snapshot: Snapshot): EnergyShare[] {
  const lightWatts = lightsOn(snapshot).reduce((sum, light) => sum + (lightById.get(light.lightId)?.watts ?? 0), 0)
  return [
    { source: EnergySource.Desktops, watts: peopleCount(snapshot) * WATTS.desktop },
    { source: EnergySource.Water, watts: WATTS.water },
    { source: EnergySource.Speaker, watts: snapshot.music.status === 'playing' ? WATTS.speaker : 0 },
    { source: EnergySource.Screen, watts: meetingsNow(snapshot).length > 0 ? WATTS.screenOn : WATTS.screenStandby },
    { source: EnergySource.Network, watts: WATTS.network },
    { source: EnergySource.Lights, watts: lightWatts },
  ]
}

const LEARNED: EnergySource[] = [EnergySource.Lights, EnergySource.Speaker]

function weeksBefore(snapshot: Snapshot, now: Date) {
  const past: Snapshot[] = []
  for (let week = 1; past.length < FORECAST_WEEKS && week <= FORECAST_WEEKS * 2; week++) {
    const date = new Date(snapshot.time)
    date.setDate(date.getDate() - 7 * week)
    const earlier = snapshotAt(date, now)
    if (isKnown(earlier)) past.push(earlier)
  }
  return past
}

export function energyAt(snapshot: Snapshot, now: Date): EnergyShare[] {
  if (isKnown(snapshot)) return energyShares(snapshot)
  const past = weeksBefore(snapshot, now).map(energyShares)
  return energyShares(snapshot).map((share, index) =>
    LEARNED.includes(share.source) && past.length > 0
      ? { ...share, watts: Math.round(average(past.map((shares) => shares[index].watts))) }
      : share,
  )
}

export const totalWatts = (snapshot: Snapshot, now: Date) => energyAt(snapshot, now).reduce((sum, share) => sum + share.watts, 0)

function atHour(moment: Date, day: number, hour: number) {
  const date = new Date(moment)
  date.setDate(date.getDate() + day)
  date.setHours(hour, 0, 0, 0)
  return date
}

export function hourlyWatts(moment: Date, now: Date) {
  return Array.from({ length: 24 }, (_, hour) => {
    const snapshot = snapshotAt(atHour(moment, 0, hour), now)
    if (!isKnown(snapshot)) return { hour, watts: totalWatts(snapshot, now), predicted: true }
    return { hour, watts: hour <= moment.getHours() ? totalWatts(snapshot, now) : 0, predicted: false }
  })
}

export type IncidentMarks = { hours: Map<number, Incident>; days: Map<number, Incident> }

export function incidentsBefore(now: Date, days: number): IncidentMarks {
  const marks: IncidentMarks = { hours: new Map(), days: new Map() }
  for (let day = -days; day <= 0; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const moment = atHour(now, day, hour)
      if (moment > now) break
      const incident = incidentAt(snapshotAt(moment, now))
      if (!incident) continue
      marks.hours.set(day * 24 + hour, incident)
      if (marks.days.get(day) !== Incident.DoorLeftUnlocked) marks.days.set(day, incident)
    }
  }
  return marks
}

export const kilowattHours = (hourly: { watts: number }[]) => hourly.reduce((sum, hour) => sum + hour.watts, 0) / 1000

export function weekPresence(moment: Date, now: Date) {
  const monday = (moment.getDay() + 6) % 7
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label, index) => {
    const snapshot = snapshotAt(atHour(moment, index - monday, 12), now)
    return { label, value: peopleCount(snapshot), known: isKnown(snapshot), selected: index === monday }
  })
}

export function mostBorrowedDevice(moment: Date, now: Date) {
  const hoursOut = new Map(devices.map((device) => [device.id, 0]))
  for (let week = 0, counted = 0; counted < FORECAST_WEEKS && week <= FORECAST_WEEKS * 2; week++) {
    const day = -7 * week
    if (!isKnown(snapshotAt(atHour(moment, day, OPENS_HOUR), now))) continue
    counted++
    for (let hour = OPENS_HOUR; hour < CLOSES_HOUR; hour++) {
      for (const state of snapshotAt(atHour(moment, day, hour), now).devices) {
        if (state.holder.status === 'borrowed') hoursOut.set(state.deviceId, (hoursOut.get(state.deviceId) ?? 0) + 1)
      }
    }
  }
  const [id, hours] = [...hoursOut.entries()].sort((a, b) => b[1] - a[1])[0]
  return hours > 0 ? deviceById.get(id) : undefined
}

export function cupsThisMonth(moment: Date, now: Date) {
  let total = 0
  for (let day = 1; day < moment.getDate(); day++) {
    const date = new Date(moment)
    date.setDate(day)
    date.setHours(23, 59, 0, 0)
    total += snapshotAt(date, now).cupsToday
  }
  return total + snapshotAt(moment, now).cupsToday
}

const HISTORY_DAYS = 28
const dayFormat = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })

export function whenText(time: number, now: Date) {
  const date = new Date(time)
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  const day =
    date.toDateString() === now.toDateString()
      ? 'Today'
      : date.toDateString() === yesterday.toDateString()
        ? 'Yesterday'
        : dayFormat.format(date)
  return `${day} · ${clock(time)}`
}

export function lastDoorEvents(moment: Date, now: Date) {
  let unlocked: TimeReading = { status: 'unknown' }
  let locked: TimeReading = { status: 'unknown' }
  for (let day = 0; day >= -HISTORY_DAYS && (unlocked.status === 'unknown' || locked.status === 'unknown'); day--) {
    const snapshot = snapshotAt(day === 0 ? moment : atHour(moment, day, 23), now)
    if (!isKnown(snapshot)) return { unlocked, locked }
    if (unlocked.status === 'unknown') unlocked = snapshot.doorTimes.unlocked
    if (locked.status === 'unknown') locked = snapshot.doorTimes.locked
  }
  return { unlocked, locked }
}
