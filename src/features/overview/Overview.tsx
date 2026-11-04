import {
  DevicesIcon,
  DevicesSlashIcon,
  DevicesUpdateIcon,
  EnergyIcon,
  LightbulbFillIcon,
  LightbulbIcon,
  PersonFillIcon,
  PersonIcon,
} from '../../components/icons/symbols'
import { StatPill } from '../../components/ui/StatPill'
import { DoorState } from '../../model/types'
import { FloorPlan } from './FloorPlan'

const PRESENT: number = 5
const DESKS = 8
const LIGHTS_ON: number = 2
const LIGHTS_TOTAL = 6
const AFTER_HOURS: boolean = false
const DEVICES_IN: number = 7
const DEVICES_TOTAL = 10
const UPDATES: number = 0
const ENERGY_KW: number = 1.4
const ENERGY_NORMAL_MAX_KW = 2

const GOOD = 'bg-success/15 text-success'
const WARNING = 'bg-glow/15 text-glow'
const OFF = 'bg-white/10 text-label-secondary'

export function Overview() {
  const anyoneIn = PRESENT > 0

  const lightsOff = LIGHTS_ON === 0
  const lightsLeftOn = AFTER_HOURS && !lightsOff
  const lightsIcon = lightsOff ? LightbulbIcon : LightbulbFillIcon
  const lightsTone = lightsOff ? OFF : lightsLeftOn ? WARNING : GOOD

  const noDevices = DEVICES_IN === 0
  const needsUpdate = !noDevices && UPDATES > 0
  const devicesIcon = noDevices ? DevicesSlashIcon : needsUpdate ? DevicesUpdateIcon : DevicesIcon
  const devicesTone = noDevices ? OFF : needsUpdate ? WARNING : GOOD
  const devicesDetail = `${DEVICES_TOTAL - DEVICES_IN} borrowed` + (needsUpdate ? ` · ${UPDATES} needs an update` : '')

  const energyHigh = ENERGY_KW > ENERGY_NORMAL_MAX_KW

  return (
    <div className="overflow-x-clip">
      <FloorPlan door={DoorState.Unlocked} />

      <nav className="fixed inset-x-0 bottom-6 z-10 flex justify-center px-4">
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border-[0.5px] border-white/10 bg-surface/60 p-1.5 shadow-[0_20px_60px_-10px_rgb(0_0_0/0.8),inset_0_1px_0_rgb(255_255_255/0.08)] backdrop-blur-2xl backdrop-saturate-150">
          <StatPill
            icon={anyoneIn ? PersonFillIcon : PersonIcon}
            tone={anyoneIn ? GOOD : OFF}
            label="People"
            value={`${PRESENT} of ${DESKS}`}
            detail="Busiest day: Thursday"
          />
          <StatPill
            icon={lightsIcon}
            tone={lightsTone}
            label="Lights on"
            value={`${LIGHTS_ON} of ${LIGHTS_TOTAL}`}
            detail={lightsLeftOn ? 'Left on after office hours' : 'Meeting room off'}
          />
          <StatPill
            icon={devicesIcon}
            tone={devicesTone}
            label="Devices in"
            value={`${DEVICES_IN} of ${DEVICES_TOTAL}`}
            detail={devicesDetail}
          />
          <StatPill
            icon={EnergyIcon}
            tone={energyHigh ? WARNING : GOOD}
            label="Energy"
            value={`${ENERGY_KW} kW`}
            detail={energyHigh ? `Above normal (${ENERGY_NORMAL_MAX_KW} kW)` : 'Normal usage'}
          />
        </div>
      </nav>
    </div>
  )
}
