import {
  CalendarIcon,
  DevicesIcon,
  DevicesSlashIcon,
  DevicesUpdateIcon,
  EnergyIcon,
  LightbulbFillIcon,
  LightbulbIcon,
  MusicIcon,
  PersonFillIcon,
  PersonIcon,
} from '../../components/icons/symbols'
import { useState } from 'react'
import { StatPill } from '../../components/ui/StatPill'
import { DoorState } from '../../model/types'
import { DevicesPanel } from '../devices/DevicesPanel'
import { EnergyPanel } from '../energy/EnergyPanel'
import { LightsPanel } from '../lights/LightsPanel'
import { MeetingPanel } from '../meeting/MeetingPanel'
import { conflicts, dayKey, sampleReservations, workdays, type Reservation } from '../meeting/reservations'
import { MusicPanel } from '../music/MusicPanel'
import { PeoplePanel } from '../people/PeoplePanel'
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
const NOW_PLAYING: string = 'Harbour Lights'
const MUSIC_PLAYING: boolean = true

const GOOD = 'bg-success/15 text-success'
const WARNING = 'bg-glow/15 text-glow'
const OFF = 'bg-white/10 text-label-secondary'
const DANGER = 'bg-danger/15 text-danger'

const Panel = {
  None: 'none',
  People: 'people',
  Lights: 'lights',
  Devices: 'devices',
  Energy: 'energy',
  Music: 'music',
  Meeting: 'meeting',
} as const
type Panel = (typeof Panel)[keyof typeof Panel]

export function Overview({ day }: { day: number }) {
  const [panel, setPanel] = useState<Panel>(Panel.None)
  const toggle = (next: Panel) => setPanel((current) => (current === next ? Panel.None : next))
  const close = () => setPanel(Panel.None)

  const [now] = useState(() => new Date())
  const [reservations, setReservations] = useState(() => sampleReservations(workdays(now, 5)))
  const book = (reservation: Reservation) => setReservations((current) => [...current, reservation])

  const moment = new Date(now)
  moment.setDate(now.getDate() + day)
  if (day !== 0) moment.setHours(10, 0, 0, 0)

  const minutesNow = moment.getHours() * 60 + moment.getMinutes()
  const today = reservations.filter((reservation) => reservation.day === dayKey(moment))
  const happening = today.filter((reservation) => reservation.start <= minutesNow && minutesNow < reservation.end)
  const meetingNow = happening[0]
  const doubleBooked = conflicts(happening).size > 0
  const meetingTone = doubleBooked ? WARNING : meetingNow ? DANGER : GOOD
  const meetingValue = doubleBooked ? 'Double booked' : meetingNow ? 'In use' : 'Free'

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

      {panel === Panel.People && <PeoplePanel onClose={close} />}
      {panel === Panel.Lights && <LightsPanel onClose={close} />}
      {panel === Panel.Devices && <DevicesPanel onClose={close} />}
      {panel === Panel.Energy && <EnergyPanel onClose={close} />}
      {panel === Panel.Music && <MusicPanel onClose={close} />}
      {panel === Panel.Meeting && (
        <MeetingPanel now={now} moment={moment} reservations={reservations} onBook={book} onClose={close} />
      )}

      <nav className="fixed inset-x-0 bottom-6 z-10 flex justify-center px-4">
        <div className="glass flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5">
          <StatPill
            icon={anyoneIn ? PersonFillIcon : PersonIcon}
            tone={anyoneIn ? GOOD : OFF}
            label="People"
            value={`${PRESENT} of ${DESKS}`}
            detail="Busiest day: Thursday"
            selected={panel === Panel.People}
            onClick={() => toggle(Panel.People)}
          />
          <StatPill
            icon={lightsIcon}
            tone={lightsTone}
            label="Lights on"
            value={`${LIGHTS_ON} of ${LIGHTS_TOTAL}`}
            detail={lightsLeftOn ? 'Left on after office hours' : 'Meeting room off'}
            selected={panel === Panel.Lights}
            onClick={() => toggle(Panel.Lights)}
          />
          <StatPill
            icon={devicesIcon}
            tone={devicesTone}
            label="Devices in"
            value={`${DEVICES_IN} of ${DEVICES_TOTAL}`}
            detail={devicesDetail}
            selected={panel === Panel.Devices}
            onClick={() => toggle(Panel.Devices)}
          />
          <StatPill
            icon={EnergyIcon}
            tone={energyHigh ? WARNING : GOOD}
            label="Energy"
            value={`${ENERGY_KW} kW`}
            detail={energyHigh ? `Above normal (${ENERGY_NORMAL_MAX_KW} kW)` : 'Normal usage'}
            selected={panel === Panel.Energy}
            onClick={() => toggle(Panel.Energy)}
          />
          <StatPill
            icon={MusicIcon}
            tone={MUSIC_PLAYING ? GOOD : OFF}
            label={MUSIC_PLAYING ? 'Playing now' : 'Music off'}
            value={MUSIC_PLAYING ? NOW_PLAYING : 'Nothing'}
            detail="Office speaker"
            selected={panel === Panel.Music}
            onClick={() => toggle(Panel.Music)}
          />
          <StatPill
            icon={CalendarIcon}
            tone={meetingTone}
            label="Meeting room"
            value={meetingValue}
            detail={meetingNow ? meetingNow.title : 'No meeting right now'}
            selected={panel === Panel.Meeting}
            onClick={() => toggle(Panel.Meeting)}
          />
        </div>
      </nav>
    </div>
  )
}
