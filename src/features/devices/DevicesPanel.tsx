import { Avatar } from '../../components/ui/Avatar'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'

const BORROWED = [
  { name: 'Vision Pro', location: 'Brussels', person: 'Ruben Willems', initials: 'RW', since: '09:20' },
  { name: 'iPad Pro 13″', location: 'Antwerp', person: 'Jonas Maes', initials: 'JM', since: '08:40' },
  { name: 'Pixel 9', location: 'Ghent', person: 'Thomas De Smet', initials: 'TD', since: 'Monday' },
]

const CABINET = [
  { name: 'iPhone 16 Pro', os: 'iOS 26.1', battery: 100 },
  { name: 'iPhone SE', os: 'iOS 26.1', battery: 92 },
  { name: 'Galaxy S24', os: 'Android 16', battery: 77 },
  { name: 'iPad mini', os: 'iPadOS 26.1', battery: 100 },
  { name: 'Meta Quest 3', os: 'Horizon OS', battery: 58 },
  { name: 'MacBook Pro 14″', os: 'macOS 26.1', battery: 96 },
  { name: 'ThinkPad X1 Carbon', os: 'Windows 11', battery: 88 },
]

const LOW_BATTERY = 25

function BatteryLevel({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-label-secondary tabular-nums">
      {level}%
      <span className="h-[11px] w-[22px] rounded-[3.5px] border border-current p-px">
        <span
          className={`block h-full rounded-[2px] ${level <= LOW_BATTERY ? 'bg-danger' : 'bg-label'}`}
          style={{ width: `${level}%` }}
        />
      </span>
    </span>
  )
}

export function DevicesPanel({ onClose }: { onClose: () => void }) {
  const total = BORROWED.length + CABINET.length

  return (
    <Sheet title="Devices" subtitle={`${CABINET.length} of ${total} in the cabinet`} onClose={onClose}>
      <Facts
        facts={[
          { label: 'Borrowed', value: `${BORROWED.length}` },
          { label: 'Updates', value: 'All up to date' },
          { label: 'Most used', value: 'Vision Pro' },
        ]}
      />
      <List title="Borrowed">
        {BORROWED.map((device) => (
          <Row
            key={device.name}
            title={device.name}
            subtitle={device.location}
            trailing={
              <span className="flex flex-col items-end gap-1">
                <Avatar initials={device.initials} name={device.person} />
                <span className="text-[11px] whitespace-nowrap text-label-secondary">
                  {device.person} · since {device.since}
                </span>
              </span>
            }
          />
        ))}
      </List>
      <List title="In the cabinet">
        {CABINET.map((device) => (
          <Row key={device.name} title={device.name} subtitle={device.os} trailing={<BatteryLevel level={device.battery} />} />
        ))}
      </List>
    </Sheet>
  )
}
