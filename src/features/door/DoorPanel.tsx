import { Facts } from '../../components/ui/Facts'
import { Sheet } from '../../components/ui/Sheet'
import { DoorState } from '../../model/types'
import { doorText } from './doorText'

const UNLOCKED_AT = '08:12'
const LOCKED_AT = '18:47'

export function DoorPanel({ door, onClose }: { door: DoorState; onClose: () => void }) {
  return (
    <Sheet title="Front door" subtitle={doorText[door]} onClose={onClose}>
      <Facts
        stacked
        facts={[
          { label: 'Unlocked at', value: UNLOCKED_AT },
          { label: 'Locked at', value: door === DoorState.Locked ? LOCKED_AT : 'Not yet' },
        ]}
      />
    </Sheet>
  )
}
