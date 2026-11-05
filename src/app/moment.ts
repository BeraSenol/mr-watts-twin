import { DEFAULT_HOUR, type Selection } from './crown'

export function momentOf(selection: Selection, now: Date) {
  const moment = new Date(now)
  moment.setDate(now.getDate() + selection.day)
  if (selection.hour.status === 'picked') moment.setHours(selection.hour.hour, 0, 0, 0)
  else if (selection.day !== 0) moment.setHours(DEFAULT_HOUR, 0, 0, 0)
  return moment
}
