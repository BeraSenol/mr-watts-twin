import { LockOpenFillIcon } from '../../components/icons/symbols'
import { Facts } from '../../components/ui/Facts'
import { Notice } from '../../components/ui/Notice'
import { Sheet } from '../../components/ui/Sheet'
import { Tone } from '../../components/ui/tone'
import { doorLeftUnlocked, lastDeparture, lastDoorEvents, readingText, whenText } from '../../data/derive'
import type { Snapshot, TimeReading } from '../../model/types'
import { doorText } from './doorText'

type Props = { snapshot: Snapshot; now: Date; onClose: () => void }

export function DoorPanel({ snapshot, now, onClose }: Props) {
  const { unlocked, locked } = lastDoorEvents(new Date(snapshot.time), now)
  const text = (reading: TimeReading) => (reading.status === 'unknown' ? '—' : whenText(reading.at, now))

  return (
    <Sheet title="Front door" subtitle={doorText[snapshot.door]} onClose={onClose}>
      {doorLeftUnlocked(snapshot) && (
        <Notice
          icon={LockOpenFillIcon}
          tone={Tone.Danger}
          title="Unlocked while nobody is in"
          message={`Everyone left at ${readingText(lastDeparture(snapshot))}, but the door hasn't been locked.`}
        />
      )}
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
