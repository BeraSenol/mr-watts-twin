import { Avatar } from '../../components/ui/Avatar'
import { Bars } from '../../components/ui/Bars'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { isKnown, personById, presentPeople, readingText, weekPresence } from '../../data/derive'
import { DESKS } from '../../data/office'
import { Presence, type Snapshot } from '../../model/types'

type Props = { snapshot: Snapshot; now: Date; onClose: () => void }

export function PeoplePanel({ snapshot, now, onClose }: Props) {
  const known = isKnown(snapshot)
  const present = presentPeople(snapshot)
  const week = weekPresence(new Date(snapshot.time), now)
  const busiest = Math.max(...week.map((day) => day.value))
  const busiestDays = week.filter((day) => day.known && day.value === busiest).map((day) => day.label)

  const rows = (presence: Presence, dimmed: boolean) =>
    snapshot.people
      .filter((state) => state.presence === presence)
      .map((state) => {
        const person = personById.get(state.personId)
        if (!person) return null
        return (
          <Row
            key={person.id}
            title={person.name}
            subtitle={person.role}
            leading={<Avatar initials={person.initials} name={person.name} />}
            dimmed={dimmed}
          />
        )
      })

  return (
    <Sheet title="People" subtitle={known ? `${present.length} of ${DESKS} desks taken` : 'Not known yet'} onClose={onClose}>
      <Facts
        facts={[
          { label: 'First arrival', value: readingText(snapshot.doorTimes.unlocked) },
          { label: 'Last departure', value: present.length > 0 ? 'Still here' : readingText(snapshot.doorTimes.locked) },
          { label: 'Free desks', value: known ? `${DESKS - present.length}` : '—' },
        ]}
      />
      <List title={busiestDays.length > 0 ? `This week · busiest ${busiestDays.join(' and ')}` : 'This week'}>
        <Bars
          bars={week.map((day) => ({ label: day.label, value: day.value, highlight: day.selected, muted: !day.known }))}
          max={DESKS}
        />
      </List>
      {known ? (
        <>
          <List title="In the office">
            {present.length > 0 ? rows(Presence.Present, false) : <Row title="Nobody" subtitle="The office is empty" dimmed />}
          </List>
          <List title="Not in">{rows(Presence.Absent, true)}</List>
        </>
      ) : (
        <List title="In the office">
          <Row title="Not known yet" subtitle="Presence is only known for the past and today" dimmed />
        </List>
      )}
    </Sheet>
  )
}
