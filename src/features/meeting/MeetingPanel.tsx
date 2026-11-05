import { Avatar } from '../../components/ui/Avatar'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { clock, conflicts, meetingsNow, personById } from '../../data/derive'
import { TimeMode, type Snapshot } from '../../model/types'

const dateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

const duration = (minutes: number) => `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`

type Props = { snapshot: Snapshot; now: Date; onClose: () => void }

export function MeetingPanel({ snapshot, now, onClose }: Props) {
  const moment = new Date(snapshot.time)
  const isToday = moment.toDateString() === now.toDateString()
  const isLive = snapshot.mode === TimeMode.Now

  const ofDay = [...snapshot.reservations].sort((a, b) => a.start - b.start)
  const doubleBooked = conflicts(ofDay)
  const current = meetingsNow(snapshot)[0]
  const next = ofDay.find((reservation) => reservation.start > snapshot.time)
  const screenMinutes = ofDay.reduce(
    (sum, reservation) => sum + Math.max(0, Math.min(reservation.end, snapshot.time) - reservation.start) / 60_000,
    0,
  )

  return (
    <Sheet title="Meeting room" subtitle={isToday ? 'Today' : dateLabel.format(moment)} onClose={onClose}>
      <Facts
        facts={[
          { label: isLive ? 'Now' : `At ${clock(snapshot.time)}`, value: current ? current.title : 'Free' },
          { label: 'Next', value: next ? `${clock(next.start)} ${next.title}` : 'Nothing after this' },
          { label: 'Bookings', value: `${ofDay.length} this day` },
        ]}
      />

      <List title="Reservations">
        {ofDay.length === 0 ? (
          <Row title="No reservations" subtitle="The room is free all day" dimmed />
        ) : (
          ofDay.map((reservation) => {
            const person = personById.get(reservation.personId)
            const conflict = doubleBooked.has(reservation.id)
            return (
              <Row
                key={reservation.id}
                title={reservation.title}
                subtitle={`${clock(reservation.start)}–${clock(reservation.end)} · ${person?.name ?? 'Unknown'}${conflict ? ' · Double booked' : ''}`}
                leading={<span className={`size-2 shrink-0 rounded-full ${conflict ? 'bg-glow' : 'bg-white/20'}`} />}
                trailing={person && <Avatar initials={person.initials} name={person.name} />}
              />
            )
          })
        )}
      </List>

      <List title="Screen">
        <Row title={current ? 'On' : 'Standby'} subtitle={current ? `During ${current.title}` : 'Turns on with a meeting'} />
        <Row
          title="Hours of usage"
          subtitle={isLive ? 'Today so far' : `Until ${clock(snapshot.time)}`}
          trailing={<span className="text-[13px] text-label-secondary tabular-nums">{duration(Math.round(screenMinutes))}</span>}
        />
      </List>
    </Sheet>
  )
}
