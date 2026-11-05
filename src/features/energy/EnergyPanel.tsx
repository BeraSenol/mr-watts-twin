import { LightbulbFillIcon, LightbulbIcon } from '../../components/icons/symbols'
import { Bars } from '../../components/ui/Bars'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { lights } from '../../data/catalogue'
import {
  cupsThisMonth,
  energyShares,
  hourlyWatts,
  isKnown,
  kilowattHours,
  lightsOn,
  meetingsNow,
  presentPeople,
  totalWatts,
} from '../../data/derive'
import { CO2_PER_BOTTLE_GRAMS, NORMAL_MAX_WATTS } from '../../data/office'
import { EnergySource, LightPower, Room, type Snapshot } from '../../model/types'

const FIRST_HOUR = 7
const LAST_HOUR = 20

const sourceName: Record<EnergySource, string> = {
  [EnergySource.Desktops]: 'Desktops',
  [EnergySource.Lights]: 'Lights',
  [EnergySource.Water]: 'Water dispenser',
  [EnergySource.Network]: 'Network',
  [EnergySource.Speaker]: 'Speaker',
  [EnergySource.Screen]: 'Meeting room screen',
}

const roomName: Record<Room, string> = {
  [Room.Main]: 'Main room',
  [Room.Meeting]: 'Meeting room',
}

const kilograms = (cups: number) => `${((cups * CO2_PER_BOTTLE_GRAMS) / 1000).toFixed(1)} kg`
const value = (text: string) => <span className="text-[13px] text-label-secondary tabular-nums">{text}</span>

type Props = { snapshot: Snapshot; now: Date; onClose: () => void }

export function EnergyPanel({ snapshot, now, onClose }: Props) {
  const moment = new Date(snapshot.time)
  const known = isKnown(snapshot)
  const watts = totalWatts(snapshot)
  const hourly = hourlyWatts(moment, now)
  const on = lightsOn(snapshot).length

  const detail: Record<EnergySource, string> = {
    [EnergySource.Desktops]: `${presentPeople(snapshot).length} in use`,
    [EnergySource.Lights]: `${on} of ${lights.length} on`,
    [EnergySource.Water]: 'Cooling',
    [EnergySource.Network]: 'Always on',
    [EnergySource.Speaker]: snapshot.music.status === 'playing' ? 'Playing' : 'Off',
    [EnergySource.Screen]: meetingsNow(snapshot).length > 0 ? 'On' : 'Standby',
  }

  const bars = hourly
    .filter(({ hour }) => hour >= FIRST_HOUR && hour <= LAST_HOUR)
    .map(({ hour, watts: hourWatts }) => ({
      label: `${hour}`,
      value: hourWatts / 1000,
      highlight: hour === moment.getHours(),
      muted: hour > moment.getHours(),
    }))

  if (!known) {
    return (
      <Sheet title="Energy" subtitle="Not known yet" onClose={onClose}>
        <List title="Energy">
          <Row title="Not known yet" subtitle="Energy use is only known for the past and today" dimmed />
        </List>
      </Sheet>
    )
  }

  const cups = snapshot.cupsToday
  const month = cupsThisMonth(moment, now)

  return (
    <Sheet
      title="Energy"
      subtitle={`${on} of ${lights.length} lights on · ${watts > NORMAL_MAX_WATTS ? 'above normal' : 'normal usage'}`}
      onClose={onClose}
    >
      <Facts
        facts={[
          { label: 'Now', value: `${(watts / 1000).toFixed(1)} kW` },
          { label: 'Total today', value: `${kilowattHours(hourly).toFixed(1)} kWh` },
          { label: 'Normal', value: `under ${NORMAL_MAX_WATTS / 1000} kW` },
        ]}
      />
      <List title="Today by hour">
        <Bars bars={bars} max={NORMAL_MAX_WATTS / 1000} />
      </List>
      <List title="Using power now">
        {energyShares(snapshot).map((share) => (
          <Row key={share.source} title={sourceName[share.source]} subtitle={detail[share.source]} trailing={value(`${share.watts} W`)} />
        ))}
      </List>
      <List title="Water station">
        <Row title="Cups today" subtitle="Each cup is a plastic bottle not bought" trailing={value(`${cups}`)} />
        <Row title="CO₂ saved today" subtitle={`About ${CO2_PER_BOTTLE_GRAMS} g per bottle`} trailing={value(kilograms(cups))} />
        <Row title="CO₂ saved this month" subtitle={`${month} cups`} trailing={value(kilograms(month))} />
      </List>
      {[Room.Main, Room.Meeting].map((room) => (
        <List key={room} title={`Lights · ${roomName[room]}`}>
          {snapshot.lights.flatMap((state) => {
            const light = lights.find((candidate) => candidate.id === state.lightId)
            if (!light || light.room !== room) return []
            const isOn = state.power === LightPower.On
            const Icon = isOn ? LightbulbFillIcon : LightbulbIcon
            return [
              <Row
                key={light.id}
                title={light.name}
                subtitle={isOn ? `On · ${light.watts} W` : 'Off'}
                leading={<Icon className={`size-5 ${isOn ? 'text-glow' : 'text-label-tertiary'}`} />}
              />,
            ]
          })}
        </List>
      ))}
    </Sheet>
  )
}
