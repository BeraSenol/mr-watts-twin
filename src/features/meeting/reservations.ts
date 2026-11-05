export type Reservation = {
  id: string
  title: string
  person: string
  initials: string
  day: string
  start: number
  end: number
}

export const dayKey = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`

export const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

export const overlaps = (a: { start: number; end: number }, b: { start: number; end: number }) =>
  a.start < b.end && b.start < a.end

export const conflicts = (reservations: Reservation[]) =>
  new Set(
    reservations
      .filter((a) => reservations.some((b) => b.id !== a.id && b.day === a.day && overlaps(a, b)))
      .map((reservation) => reservation.id),
  )

export function workdays(from: Date, count: number) {
  const days: Date[] = []
  const date = new Date(from)
  date.setHours(0, 0, 0, 0)
  while (days.length < count) {
    if (date.getDay() !== 0 && date.getDay() !== 6) days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
}

export function sampleReservations(days: Date[]): Reservation[] {
  const [today, next, later] = days.map(dayKey)
  return [
    { id: '1', title: 'Sprint planning', person: 'Simon Goossens', initials: 'SG', day: today, start: 570, end: 630 },
    { id: '2', title: 'Client demo', person: 'Ruben Willems', initials: 'RW', day: today, start: 840, end: 900 },
    { id: '5', title: 'Team retro', person: 'Kobe Hermans', initials: 'KH', day: today, start: 960, end: 1020 },
    { id: '6', title: 'Investor call', person: 'Simon Goossens', initials: 'SG', day: today, start: 990, end: 1050 },
    { id: '3', title: 'Design review', person: 'Jonas Maes', initials: 'JM', day: next, start: 600, end: 660 },
    { id: '4', title: 'Unity sync', person: 'Pieter Claes', initials: 'PC', day: later, start: 780, end: 840 },
  ]
}
