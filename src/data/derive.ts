import {
  EnergySource,
  LightPower,
  Presence,
  TimeMode,
  type EnergyShare,
  type Reservation,
  type Snapshot,
  type TimeReading,
} from '../model/types'
import { devices, lights, people, tracks } from './catalogue'
import { snapshotAt } from './history'
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
export const lightsOn = (snapshot: Snapshot) => snapshot.lights.filter((light) => light.power === LightPower.On)
export const devicesIn = (snapshot: Snapshot) => snapshot.devices.filter((device) => device.holder.status === 'cabinet')
export const meetingsNow = (snapshot: Snapshot) =>
  snapshot.reservations.filter((reservation) => reservation.start <= snapshot.time && snapshot.time < reservation.end)

export function isAfterHours(snapshot: Snapshot) {
  const moment = new Date(snapshot.time)
  const weekend = moment.getDay() === 0 || moment.getDay() === 6
  return weekend || moment.getHours() < OPENS_HOUR || moment.getHours() >= CLOSES_HOUR
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
    { source: EnergySource.Desktops, watts: presentPeople(snapshot).length * WATTS.desktop },
    { source: EnergySource.Water, watts: WATTS.water },
    { source: EnergySource.Speaker, watts: snapshot.music.status === 'playing' ? WATTS.speaker : 0 },
    { source: EnergySource.Screen, watts: meetingsNow(snapshot).length > 0 ? WATTS.screenOn : WATTS.screenStandby },
    { source: EnergySource.Network, watts: WATTS.network },
    { source: EnergySource.Lights, watts: lightWatts },
  ]
}

export const totalWatts = (snapshot: Snapshot) => energyShares(snapshot).reduce((sum, share) => sum + share.watts, 0)

function atHour(moment: Date, day: number, hour: number) {
  const date = new Date(moment)
  date.setDate(date.getDate() + day)
  date.setHours(hour, 0, 0, 0)
  return date
}

export function hourlyWatts(moment: Date, now: Date) {
  return Array.from({ length: 24 }, (_, hour) => {
    const snapshot = snapshotAt(atHour(moment, 0, hour), now)
    return { hour, watts: isKnown(snapshot) && hour <= moment.getHours() ? totalWatts(snapshot) : 0 }
  })
}

export const kilowattHours = (hourly: { watts: number }[]) => hourly.reduce((sum, hour) => sum + hour.watts, 0) / 1000

export function weekPresence(moment: Date, now: Date) {
  const monday = (moment.getDay() + 6) % 7
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label, index) => {
    const snapshot = snapshotAt(atHour(moment, index - monday, 12), now)
    return { label, value: presentPeople(snapshot).length, known: isKnown(snapshot), selected: index === monday }
  })
}

export function mostUsedDevice(moment: Date, now: Date) {
  const minutesOut = new Map(devices.map((device) => [device.id, 0]))
  for (let day = -6; day <= 0; day++) {
    for (let hour = OPENS_HOUR; hour < CLOSES_HOUR; hour++) {
      const snapshot = snapshotAt(atHour(moment, day, hour), now)
      for (const state of snapshot.devices) {
        if (state.holder.status === 'borrowed') minutesOut.set(state.deviceId, (minutesOut.get(state.deviceId) ?? 0) + 60)
      }
    }
  }
  const [id] = [...minutesOut.entries()].sort((a, b) => b[1] - a[1])[0]
  return deviceById.get(id)
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
