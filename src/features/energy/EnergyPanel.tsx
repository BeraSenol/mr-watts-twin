import { useState } from 'react'
import { LightbulbFillIcon, LightbulbIcon } from '../../components/icons/symbols'
import { Bars } from '../../components/ui/Bars'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { Switch } from '../../components/ui/Switch'

const NOW_HOUR = 11
const LIGHT_WATTS = 12
const CUPS_TODAY = 42
const CUPS_THIS_MONTH = 610
const CO2_PER_BOTTLE_GRAMS = 80

const HOURLY = [0.2, 0.9, 1.3, 1.4, 1.5, 1.2, 1.4, 1.5, 1.3, 1.1, 0.6, 0.2]

const SOURCES = [
  { name: 'Desktops', detail: '5 in use', watts: 1000 },
  { name: 'Water dispenser', detail: 'Cooling', watts: 300 },
  { name: 'Speaker', detail: 'Playing', watts: 60 },
  { name: 'Network', detail: 'Always on', watts: 50 },
  { name: 'Meeting room screen', detail: 'Standby', watts: 2 },
]

const ROOMS = [
  { name: 'Main room', lights: ['main-1', 'main-2', 'main-3', 'main-4'] },
  { name: 'Meeting room', lights: ['meeting-1', 'meeting-2'] },
]

export function EnergyPanel({ onClose }: { onClose: () => void }) {
  const [on, setOn] = useState<Record<string, boolean>>({ 'main-1': true, 'main-2': true })
  const lightsOn = Object.values(on).filter(Boolean).length
  const lightsTotal = ROOMS.flatMap((room) => room.lights).length

  const sources = [...SOURCES, { name: 'Lights', detail: `${lightsOn} of ${lightsTotal} on`, watts: lightsOn * LIGHT_WATTS }]
  const watts = sources.reduce((sum, source) => sum + source.watts, 0)
  const kilograms = (cups: number) => `${((cups * CO2_PER_BOTTLE_GRAMS) / 1000).toFixed(1)} kg`
  const bars = HOURLY.map((kw, index) => {
    const hour = 7 + index
    return { label: `${hour}`, value: kw, highlight: hour === NOW_HOUR, muted: hour > NOW_HOUR }
  })

  return (
    <Sheet title="Energy" subtitle={`${lightsOn} of ${lightsTotal} lights on · normal usage`} onClose={onClose}>
      <Facts
        facts={[
          { label: 'Now', value: `${(watts / 1000).toFixed(1)} kW` },
          { label: 'Total today', value: '3.8 kWh' },
          { label: 'Normal', value: 'under 2 kW' },
        ]}
      />
      <List title="Today by hour">
        <Bars bars={bars} max={2} />
      </List>
      <List title="Using power now">
        {sources.map((source) => (
          <Row
            key={source.name}
            title={source.name}
            subtitle={source.detail}
            trailing={<span className="text-[13px] text-label-secondary tabular-nums">{source.watts} W</span>}
          />
        ))}
      </List>
      <List title="Water station">
        <Row
          title="Cups today"
          subtitle="Each cup is a plastic bottle not bought"
          trailing={<span className="text-[13px] text-label-secondary tabular-nums">{CUPS_TODAY}</span>}
        />
        <Row
          title="CO₂ saved today"
          subtitle={`About ${CO2_PER_BOTTLE_GRAMS} g per bottle`}
          trailing={<span className="text-[13px] text-label-secondary tabular-nums">{kilograms(CUPS_TODAY)}</span>}
        />
        <Row
          title="CO₂ saved this month"
          subtitle={`${CUPS_THIS_MONTH} cups`}
          trailing={<span className="text-[13px] text-label-secondary tabular-nums">{kilograms(CUPS_THIS_MONTH)}</span>}
        />
      </List>
      {ROOMS.map((room) => (
        <List key={room.name} title={`Lights · ${room.name}`}>
          {room.lights.map((id, index) => {
            const isOn = on[id] === true
            const Icon = isOn ? LightbulbFillIcon : LightbulbIcon
            return (
              <Row
                key={id}
                title={`Light ${index + 1}`}
                subtitle={isOn ? `On · ${LIGHT_WATTS} W` : 'Off'}
                leading={<Icon className={`size-5 ${isOn ? 'text-glow' : 'text-label-tertiary'}`} />}
                trailing={
                  <Switch
                    checked={isOn}
                    label={`${room.name} light ${index + 1}`}
                    onChange={(checked) => setOn((current) => ({ ...current, [id]: checked }))}
                  />
                }
              />
            )
          })}
        </List>
      ))}
    </Sheet>
  )
}
