import { DoorState } from '../../model/types'

export const doorText: Record<DoorState, string> = {
  [DoorState.Locked]: 'Locked',
  [DoorState.Unlocked]: 'Unlocked',
  [DoorState.Unknown]: 'Unknown',
}
