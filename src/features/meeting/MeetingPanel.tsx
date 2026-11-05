import { useState, type FormEvent } from 'react'
import { Avatar } from '../../components/ui/Avatar'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { CLOSES, OPENS, clock, conflicts, dayKey, overlaps, toMinutes, type Reservation } from './reservations'

const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

type Props = {
  now: Date
  moment: Date
  reservations: Reservation[]
  onBook: (reservation: Reservation) => void
  onClose: () => void
}

export function MeetingPanel({ now, moment, reservations, onBook, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [from, setFrom] = useState('11:00')
  const [to, setTo] = useState('12:00')
  const [error, setError] = useState('')

  const day = dayKey(moment)
  const isToday = day === dayKey(now)
  const isPast = moment < now && !isToday
  const isWeekend = moment.getDay() === 0 || moment.getDay() === 6

  const ofDay = reservations.filter((reservation) => reservation.day === day).sort((a, b) => a.start - b.start)
  const doubleBooked = conflicts(ofDay)

  const minutesNow = moment.getHours() * 60 + moment.getMinutes()
  const current = ofDay.find((reservation) => reservation.start <= minutesNow && minutesNow < reservation.end)
  const next = ofDay.find((reservation) => reservation.start > minutesNow)

  function book(event: FormEvent) {
    event.preventDefault()
    if (isPast) return setError("You can't book a day in the past.")
    if (isWeekend) return setError('The office is closed at the weekend.')
    const slot = { start: toMinutes(from), end: toMinutes(to) }
    if (slot.end <= slot.start) return setError('The end time has to be after the start time.')
    if (slot.start < OPENS || slot.end > CLOSES) return setError(`The office is open from ${clock(OPENS)} to ${clock(CLOSES)}.`)
    const clash = ofDay.find((reservation) => overlaps(reservation, slot))
    if (clash) return setError(`Overlaps with “${clash.title}” (${clock(clash.start)}–${clock(clash.end)}).`)

    onBook({ id: crypto.randomUUID(), title: title.trim(), person: 'You', initials: 'ME', day, ...slot })
    setTitle('')
    setError('')
  }

  return (
    <Sheet title="Meeting room" subtitle={isToday ? 'Today' : dateLabel.format(moment)} onClose={onClose}>
      <Facts
        facts={[
          { label: isToday ? 'Now' : `At ${clock(minutesNow)}`, value: current ? current.title : 'Free' },
          { label: 'Next', value: next ? `${clock(next.start)} ${next.title}` : 'Nothing after this' },
          { label: 'Bookings', value: `${ofDay.length} this day` },
        ]}
      />

      <List title="Reservations">
        {ofDay.length === 0 ? (
          <Row title="No reservations" subtitle="The room is free all day" dimmed />
        ) : (
          ofDay.map((reservation) => {
            const conflict = doubleBooked.has(reservation.id)
            return (
              <Row
                key={reservation.id}
                title={reservation.title}
                subtitle={`${clock(reservation.start)}–${clock(reservation.end)} · ${reservation.person}${conflict ? ' · Double booked' : ''}`}
                leading={<span className={`size-2 shrink-0 rounded-full ${conflict ? 'bg-glow' : 'bg-white/20'}`} />}
                trailing={<Avatar initials={reservation.initials} name={reservation.person} />}
              />
            )
          })
        )}
      </List>

      <List title="New reservation">
        <form onSubmit={book} className="flex flex-col gap-3 p-4">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What's the meeting?"
            aria-label="Title"
            className="squircle h-10 rounded-xl bg-white/[0.06] px-3 text-[14px] outline-none placeholder:text-label-tertiary focus:bg-white/10"
          />
          <div className="flex items-center gap-2 text-[13px] text-label-secondary">
            <input
              type="time"
              step={900}
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              aria-label="From"
              className="squircle h-10 flex-1 rounded-xl bg-white/[0.06] px-3 text-[14px] text-label outline-none focus:bg-white/10"
            />
            to
            <input
              type="time"
              step={900}
              value={to}
              onChange={(event) => setTo(event.target.value)}
              aria-label="To"
              className="squircle h-10 flex-1 rounded-xl bg-white/[0.06] px-3 text-[14px] text-label outline-none focus:bg-white/10"
            />
            <button
              type="submit"
              disabled={title.trim() === ''}
              className="h-10 rounded-full bg-accent px-5 font-semibold text-white transition-opacity disabled:opacity-40"
            >
              Book
            </button>
          </div>
          {error !== '' && <p className="text-[12px] text-danger">{error}</p>}
        </form>
      </List>
    </Sheet>
  )
}
