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
  const inCabinet = devicesIn(snapshot)
  const updates = devices.filter((device) => device.os !== device.latestOs).length
  const mostUsed = mostUsedDevice(new Date(snapshot.time), now)

  const borrowed = snapshot.devices.flatMap((state) => {
    const device = deviceById.get(state.deviceId)
    if (!device || state.holder.status !== 'borrowed') return []
    const person = personById.get(state.holder.personId)
    if (!person) return []
    return [{ device, person, since: state.holder.since, location: state.holder.location }]
  })

  return (
    <Sheet
      title="Devices"
      subtitle={known ? `${inCabinet.length} of ${devices.length} in the cabinet` : 'Not known yet'}
      onClose={onClose}
    >
      <Facts
        facts={[
          { label: 'Borrowed', value: known ? `${borrowed.length}` : '—' },
          { label: 'Updates', value: updates === 0 ? 'All up to date' : `${updates} available` },
          { label: 'Most used this week', value: mostUsed ? mostUsed.name : '—' },
        ]}
      />
      {known ? (
        <>
          <List title="Borrowed">
            {borrowed.length === 0 ? (
              <Row title="Nothing borrowed" subtitle="Every device is in the cabinet" dimmed />
            ) : (
              borrowed.map(({ device, person, since, location }) => (
                <Row
                  key={device.id}
                  title={device.name}
                  subtitle={location}
                  trailing={
                    <span className="flex flex-col items-end gap-1">
                      <Avatar initials={person.initials} name={person.name} />
                      <span className="text-[11px] whitespace-nowrap text-label-secondary">
                        {person.name} · since {clock(since)}
                      </span>
                    </span>
                  }
                />
              ))
            )}
          </List>
          <List title="In the cabinet">
            {inCabinet.map((state) => {
              const device = deviceById.get(state.deviceId)
              if (!device) return null
              return (
                <Row key={device.id} title={device.name} subtitle={device.os} trailing={<BatteryLevel battery={state.battery} />} />
              )
            })}
          </List>
        </>
      ) : (
        <List title="Devices">
          <Row title="Not known yet" subtitle="Where devices are is only known for the past and today" dimmed />
        </List>
      )}
    </Sheet>
  )
}
