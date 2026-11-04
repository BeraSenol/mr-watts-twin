import { Bars } from '../../components/ui/Bars'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'

const NOW_HOUR = 11

const HOURLY = [0.2, 0.9, 1.3, 1.4, 1.5, 1.2, 1.4, 1.5, 1.3, 1.1, 0.6, 0.2]

const SOURCES = [
  { name: 'Desktops', detail: '5 in use', watts: 1000 },
  { name: 'Water dispenser', detail: 'Cooling', watts: 300 },
  { name: 'Network', detail: 'Always on', watts: 50 },
  { name: 'Lights', detail: '2 on', watts: 24 },
  { name: 'Speaker', detail: 'Playing', watts: 20 },
]

export function EnergyPanel({ onClose }: { onClose: () => void }) {
  const watts = SOURCES.reduce((sum, source) => sum + source.watts, 0)
  const bars = HOURLY.map((kw, index) => {
    const hour = 7 + index
    return { label: `${hour}`, value: kw, highlight: hour === NOW_HOUR, muted: hour > NOW_HOUR }
  })

  return (
    <Sheet title="Energy" subtitle="Normal usage" onClose={onClose}>
      <Facts
        facts={[
          { label: 'Now', value: `${(watts / 1000).toFixed(1)} kW` },
          { label: 'Today so far', value: '3.8 kWh' },
          { label: 'Normal', value: 'under 2 kW' },
        ]}
      />
      <List title="Today by hour">
        <Bars bars={bars} max={2} />
      </List>
      <List title="Using power now">
        {SOURCES.map((source) => (
          <Row
            key={source.name}
            title={source.name}
            subtitle={source.detail}
            trailing={<span className="text-[13px] text-label-secondary tabular-nums">{source.watts} W</span>}
          />
        ))}
      </List>
    </Sheet>
  )
}
