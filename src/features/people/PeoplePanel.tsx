import { Avatar } from '../../components/ui/Avatar'
import { Bars } from '../../components/ui/Bars'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'

const DESKS = 8

const PRESENT = [
  { name: 'Jonas Maes', initials: 'JM', role: 'Product designer' },
  { name: 'Pieter Claes', initials: 'PC', role: 'Unity developer' },
  { name: 'Thomas De Smet', initials: 'TD', role: 'Frontend developer' },
  { name: 'Ruben Willems', initials: 'RW', role: 'XR developer' },
  { name: 'Simon Goossens', initials: 'SG', role: 'Project manager' },
]

const ABSENT = [
  { name: 'Lars Janssens', initials: 'LJ', role: '3D artist' },
  { name: 'Matthias Jacobs', initials: 'MJ', role: 'Backend developer' },
  { name: 'Kobe Hermans', initials: 'KH', role: 'Motion designer' },
]

const WEEK = [
  { label: 'Mon', value: 5 },
  { label: 'Tue', value: 7 },
  { label: 'Wed', value: 5, highlight: true },
  { label: 'Thu', value: 7, muted: true },
  { label: 'Fri', value: 3, muted: true },
]

export function PeoplePanel({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="People" subtitle={`${PRESENT.length} of ${DESKS} desks taken`} onClose={onClose}>
      <Facts
        facts={[
          { label: 'First arrival', value: '08:12' },
          { label: 'Last departure', value: '~18:10' },
          { label: 'Free desks', value: `${DESKS - PRESENT.length}` },
        ]}
      />
      <List title="This week · busiest Tue and Thu">
        <Bars bars={WEEK} max={DESKS} />
      </List>
      <List title="In the office">
        {PRESENT.map((person) => (
          <Row key={person.name} title={person.name} subtitle={person.role} leading={<Avatar initials={person.initials} name={person.name} />} />
        ))}
      </List>
      <List title="Not in today">
        {ABSENT.map((person) => (
          <Row key={person.name} title={person.name} subtitle={person.role} leading={<Avatar initials={person.initials} name={person.name} />} dimmed />
        ))}
      </List>
    </Sheet>
  )
}
