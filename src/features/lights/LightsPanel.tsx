import { useState } from 'react'
import { LightbulbFillIcon, LightbulbIcon } from '../../components/icons/symbols'
import { Facts } from '../../components/ui/Facts'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { Switch } from '../../components/ui/Switch'

const WATTS = 12

const ROOMS = [
  { name: 'Main room', lights: ['main-1', 'main-2', 'main-3', 'main-4'] },
  { name: 'Meeting room', lights: ['meeting-1', 'meeting-2'] },
]

export function LightsPanel({ onClose }: { onClose: () => void }) {
  const [on, setOn] = useState<Record<string, boolean>>({ 'main-1': true, 'main-2': true })
  const total = ROOMS.flatMap((room) => room.lights).length
  const count = Object.values(on).filter(Boolean).length

  return (
    <Sheet title="Lights" subtitle={`${count} of ${total} on`} onClose={onClose}>
      <Facts
        facts={[
          { label: 'Using', value: `${count * WATTS} W` },
          { label: 'Office hours', value: 'until 18:00' },
        ]}
      />
      {ROOMS.map((room) => (
        <List key={room.name} title={room.name}>
          {room.lights.map((id, index) => {
            const isOn = on[id] === true
            const Icon = isOn ? LightbulbFillIcon : LightbulbIcon
            return (
              <Row
                key={id}
                title={`Light ${index + 1}`}
                subtitle={isOn ? `On · ${WATTS} W` : 'Off'}
                leading={<Icon className={`size-5 ${isOn ? 'text-success' : 'text-label-tertiary'}`} />}
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
