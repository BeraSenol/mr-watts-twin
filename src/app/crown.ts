export const STEPS_PER_WEEK = 7
export const RANGE = 4 * STEPS_PER_WEEK
export const HOURS = 24
export const DEFAULT_HOUR = 10
export const STEP_ANGLE = (7.5 * Math.PI) / 180
export const HEIGHT = 32
export const LABEL_HEIGHT = 28

export type Hour = { status: 'default' } | { status: 'picked'; hour: number }
export type Selection = { day: number; hour: Hour }

export const easeOut = (progress: number) => 1 - (1 - progress) ** 3
export const easeInOut = (progress: number) => (progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2)

export const hourLabel = (hour: number) => `${String(hour).padStart(2, '0')}:00`

export function clamp(step: number) {
  return Math.max(-RANGE, Math.min(RANGE, step))
}

export function isTyping(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  )
}

export function startOfDay(time: number) {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

export function dayAt(today: number, index: number) {
  const date = new Date(today)
  date.setDate(date.getDate() + index)
  return date
}

export function weekLabel(index: number) {
  const weeks = index / STEPS_PER_WEEK
  const count = Math.abs(weeks)
  const unit = count === 1 ? 'week' : 'weeks'
  return weeks < 0 ? `${count} ${unit} ago` : `In ${count} ${unit}`
}
