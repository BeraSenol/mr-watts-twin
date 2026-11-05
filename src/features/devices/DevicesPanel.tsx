import { Avatar } from '../../components/ui/Avatar'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { devices } from '../../data/catalogue'
import { clock, deviceById, devicesIn, isKnown, mostUsedDevice, personById } from '../../data/derive'
import type { Battery, Snapshot } from '../../model/types'

const LOW_BATTERY = 25

function BatteryLevel({ battery }: { battery: Battery }) {
  if (battery.status === 'unknown') return <span className="text-[12px] text-label-secondary">—</span>
  return (
    <span className="flex items-center gap-1.5 text-[12px] text-label-secondary tabular-nums">
      {battery.level}%
      <span className="h-[11px] w-[22px] rounded-[3.5px] border border-current p-px">
        <span
          className={`block h-full rounded-[2px] ${battery.level <= LOW_BATTERY ? 'bg-danger' : 'bg-label'}`}
          style={{ width: `${battery.level}%` }}
        />
      </span>
    </span>
  )
}

type Props = { snapshot: Snapshot; now: Date; onClose: () => void }

export function DevicesPanel({ snapshot, now, onClose }: Props) {
  const known = isKnown(snapshot)
  const approx = known ? '' : '~'
  const inCabinet = devicesIn(snapshot)
  const updates = devices.filter((device) => device.os !== device.latestOs).length
  const mostUsed = mostUsedDevice(new Date(snapshot.time), now)

  const out = snapshot.devices.flatMap((state) => {
    const device = deviceById.get(state.deviceId)
    if (!device || (state.holder.status !== 'borrowed' && state.holder.status !== 'expected')) return []
    const person = personById.get(state.holder.personId)
    if (!person) return []
    const { holder } = state
    const where = holder.status === 'borrowed' ? holder.location : `Usually out ~${clock(holder.from)}–${clock(holder.until)}`
    const when = holder.status === 'borrowed' ? `since ${clock(holder.since)}` : 'usually'
    return [{ device, person, where, when }]
  })

  return (
    <Sheet
      title="Devices"
      subtitle={
        known
          ? `${inCabinet.length} of ${devices.length} in the cabinet`
          : `~${inCabinet.length} of ${devices.length} expected in the cabinet · based on the last 4 weeks`
      }
      onClose={onClose}
    >
      <Facts
        facts={[
          { label: known ? 'Borrowed' : 'Expected out', value: `${approx}${out.length}` },
          { label: 'Updates', value: updates === 0 ? 'All up to date' : `${updates} available` },
          { label: 'Most used this week', value: mostUsed ? mostUsed.name : '—' },
        ]}
      />
      <List title={known ? 'Borrowed' : 'Expected out'}>
        {out.length === 0 ? (
          <Row
            title={known ? 'Nothing borrowed' : 'Nothing expected out'}
            subtitle="Every device is in the cabinet"
            dimmed
          />
        ) : (
          out.map(({ device, person, where, when }) => (
            <Row
              key={device.id}
              title={device.name}
              subtitle={where}
              trailing={
                <span className="flex flex-col items-end gap-1">
                  <Avatar initials={person.initials} name={person.name} />
                  <span className="text-[11px] whitespace-nowrap text-label-secondary">
                    {person.name} · {when}
                  </span>
                </span>
              }
            />
          ))
        )}
      </List>
      <List title={known ? 'In the cabinet' : 'Expected in the cabinet'}>
        {inCabinet.map((state) => {
          const device = deviceById.get(state.deviceId)
          if (!device) return null
          return <Row key={device.id} title={device.name} subtitle={device.os} trailing={<BatteryLevel battery={state.battery} />} />
        })}
      </List>
    </Sheet>
  )
}
