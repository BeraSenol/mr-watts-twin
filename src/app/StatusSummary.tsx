import { DoorState } from '../model/types'

const doorText: Record<DoorState, string> = {
  [DoorState.Locked]: 'Door locked',
  [DoorState.Unlocked]: 'Door unlocked',
  [DoorState.Unknown]: 'Door unknown',
}

export function StatusSummary({ present, door }: { present: number; door: DoorState }) {
  return (
    <p className="text-sm text-label-secondary">
      <span className="text-label">{present} here</span> · {doorText[door]}
    </p>
  )
}
