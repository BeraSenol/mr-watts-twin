import { Avatar } from '../../components/ui/Avatar'
import { Bars } from '../../components/ui/Bars'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { isKnown, peopleCount, personById, readingText, weekPresence } from '../../data/derive'
import { DESKS } from '../../data/office'
import { Presence, type Snapshot } from '../../model/types'

const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' })

type Props = { snapshot: Snapshot; now: Date; onClose: () => void }

export function PeoplePanel({ snapshot, now, onClose }: Props) {
  const known = isKnown(snapshot)
  const count = peopleCount(snapshot)
  const approx = known ? '' : '~'
  const week = weekPresence(new Date(snapshot.time), now)
  const busiest = Math.max(...week.map((day) => day.value))
  const busiestDays = week.filter((day) => day.value === busiest && busiest > 0).map((day) => day.label)
  const onWeekday = `Usually in on ${weekday.format(snapshot.time)}s`

  const rows = (presence: Presence, dimmed: boolean) =>
    snapshot.people
      .filter((state) => state.presence === presence)
      .map((state) => {
        const person = personById.get(state.personId)
        if (!person) return null
        const subtitle = presence === Presence.Expected ? `${person.role} · ${onWeekday}` : person.role
        return (
          <Row
            key={person.id}
            title={person.name}
            subtitle={subtitle}
            leading={<Avatar initials={person.initials} name={person.name} />}
            dimmed={dimmed}
          />
        )
      })

  const inside = known ? Presence.Present : Presence.Expected

  return (
    <Sheet
      title="People"
      subtitle={known ? `${count} of ${DESKS} desks taken` : `~${count} of ${DESKS} desks expected · based on the last 4 weeks`}
      onClose={onClose}
    >
      <Facts
        facts={[
          { label: 'First arrival', value: readingText(snapshot.doorTimes.unlocked) },
          { label: 'Last departure', value: known && count > 0 ? 'Still here' : readingText(snapshot.doorTimes.locked) },
          { label: 'Free desks', value: `${approx}${DESKS - count}` },
        ]}
      />
      <List title={busiestDays.length > 0 ? `This week · busiest ${busiestDays.join(' and ')}` : 'This week'}>
        <Bars
          bars={week.map((day) => ({ label: day.label, value: day.value, highlight: day.selected, predicted: !day.known }))}
          max={DESKS}
        />
      </List>
      <List title={known ? 'In the office' : 'Expected'}>
        {count > 0 ? (
          rows(inside, false)
        ) : (
          <Row title="Nobody" subtitle={known ? 'The office is empty' : 'Nobody is expected'} dimmed />
        )}
      </List>
      <List title={known ? 'Not in' : 'Not expected'}>{rows(Presence.Absent, true)}</List>
    </Sheet>
  )
}
