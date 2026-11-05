import { Avatar } from '../../components/ui/Avatar'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { clock, conflicts, dayKey, type Reservation } from './reservations'

const duration = (minutes: number) => `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`

const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

type Props = {
  now: Date
  moment: Date
  reservations: Reservation[]
  onClose: () => void
}

export function MeetingPanel({ now, moment, reservations, onClose }: Props) {
  const day = dayKey(moment)
  const isToday = day === dayKey(now)

  const ofDay = reservations.filter((reservation) => reservation.day === day).sort((a, b) => a.start - b.start)
  const doubleBooked = conflicts(ofDay)

  const minutesNow = moment.getHours() * 60 + moment.getMinutes()
  const current = ofDay.find((reservation) => reservation.start <= minutesNow && minutesNow < reservation.end)
  const next = ofDay.find((reservation) => reservation.start > minutesNow)
  const screenMinutes = ofDay.reduce(
    (sum, reservation) => sum + Math.max(0, Math.min(reservation.end, minutesNow) - reservation.start),
    0,
  )

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

      <List title="Screen">
        <Row
          title={current ? 'On' : 'Standby'}
          subtitle={current ? `During ${current.title}` : 'Turns on with a meeting'}
        />
        <Row
          title="Hours of usage"
          subtitle={isToday ? 'Today so far' : `This day until ${clock(minutesNow)}`}
          trailing={<span className="text-[13px] text-label-secondary tabular-nums">{duration(screenMinutes)}</span>}
        />
      </List>
    </Sheet>
  )
}
