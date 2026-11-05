import { isKnown, presentPeople } from '../data/derive'
import { DoorState, type Snapshot } from '../model/types'

const doorText: Record<DoorState, string> = {
  [DoorState.Locked]: 'Door locked',
  [DoorState.Unlocked]: 'Door unlocked',
  [DoorState.Unknown]: 'Door unknown',
}

export function StatusSummary({ snapshot }: { snapshot: Snapshot }) {
  const here = isKnown(snapshot) ? `${presentPeople(snapshot).length} here` : 'Not known yet'

  return (
    <p className="text-sm text-label-secondary">
      <span className="text-label">{here}</span> · {doorText[snapshot.door]}
    </p>
  )
}
