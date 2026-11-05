import { Facts } from '../../components/ui/Facts'
import { Sheet } from '../../components/ui/Sheet'
import { lastDoorEvents, whenText } from '../../data/derive'
import type { Snapshot, TimeReading } from '../../model/types'
import { doorText } from './doorText'

type Props = { snapshot: Snapshot; now: Date; onClose: () => void }

export function DoorPanel({ snapshot, now, onClose }: Props) {
  const { unlocked, locked } = lastDoorEvents(new Date(snapshot.time), now)
  const text = (reading: TimeReading) => (reading.status === 'unknown' ? '—' : whenText(reading.at, now))

  return (
    <Sheet title="Front door" subtitle={doorText[snapshot.door]} onClose={onClose}>
      <Facts
        stacked
        facts={[
          { label: 'Last unlocked', value: text(unlocked) },
          { label: 'Last locked', value: text(locked) },
        ]}
      />
    </Sheet>
  )
}
