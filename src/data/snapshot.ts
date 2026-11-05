import { TimeMode, type Snapshot } from '../model/types'
import { forecastSnapshot } from './forecast'
import { historySnapshot, MINUTE } from './history'

function modeOf(moment: Date, now: Date) {
  if (Math.abs(moment.getTime() - now.getTime()) < MINUTE) return TimeMode.Now
  return moment < now ? TimeMode.Past : TimeMode.Future
}

export function snapshotAt(moment: Date, now: Date): Snapshot {
  const mode = modeOf(moment, now)
  return mode === TimeMode.Future ? forecastSnapshot(moment, now) : historySnapshot(moment, mode)
}
