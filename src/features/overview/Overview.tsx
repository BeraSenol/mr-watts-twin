import { useState } from 'react'
import {
  CalendarIcon,
  DevicesIcon,
  DevicesSlashIcon,
  DevicesUpdateIcon,
  EnergyIcon,
  LockIcon,
  LockOpenIcon,
  MusicIcon,
  PersonFillIcon,
  PersonIcon,
} from '../../components/icons/symbols'
import { StatPill } from '../../components/ui/StatPill'
import { devices } from '../../data/catalogue'
import {
  conflicts,
  devicesIn,
  isAfterHours,
  isKnown,
  lightsOn,
  meetingsNow,
  presentPeople,
  readingText,
  totalWatts,
  trackById,
} from '../../data/derive'
import { DESKS, NORMAL_MAX_WATTS } from '../../data/office'
import { DoorState, type Snapshot } from '../../model/types'
import { DevicesPanel } from '../devices/DevicesPanel'
import { DoorPanel } from '../door/DoorPanel'
import { doorText } from '../door/doorText'
import { EnergyPanel } from '../energy/EnergyPanel'
import { MeetingPanel } from '../meeting/MeetingPanel'
import { MusicPanel } from '../music/MusicPanel'
import { PeoplePanel } from '../people/PeoplePanel'
import { FloorPlan } from './FloorPlan'
import { Panel } from './panel'

const GOOD = 'bg-success/15 text-success'
const WARNING = 'bg-glow/15 text-glow'
const OFF = 'bg-white/10 text-label-secondary'
const DANGER = 'bg-danger/15 text-danger'
const UNKNOWN = 'Unknown'

export function Overview({ snapshot, now }: { snapshot: Snapshot; now: Date }) {
  const [panel, setPanel] = useState<Panel>(Panel.None)
  const toggle = (next: Panel) => setPanel((current) => (current === next ? Panel.None : next))
  const close = () => setPanel(Panel.None)

  const known = isKnown(snapshot)
  const present = presentPeople(snapshot).length
  const anyoneIn = present > 0

  const unlocked = snapshot.door === DoorState.Unlocked
  const doorOpenEmpty = unlocked && !anyoneIn
  const doorTone = doorOpenEmpty ? WARNING : unlocked ? GOOD : OFF

  const lightsLeftOn = isAfterHours(snapshot) && !anyoneIn && lightsOn(snapshot).length > 0

  const inCabinet = devicesIn(snapshot).length
  const updates = devices.filter((device) => device.os !== device.latestOs).length
  const noDevices = known && inCabinet === 0
  const needsUpdate = !noDevices && updates > 0
  const devicesIcon = noDevices ? DevicesSlashIcon : needsUpdate ? DevicesUpdateIcon : DevicesIcon
  const devicesTone = !known || noDevices ? OFF : needsUpdate ? WARNING : GOOD
  const devicesDetail = `${devices.length - inCabinet} borrowed` + (needsUpdate ? ` · ${updates} need an update` : '')

  const watts = totalWatts(snapshot)
  const energyHigh = watts > NORMAL_MAX_WATTS
  const energyDetail = lightsLeftOn
    ? 'Lights left on after office hours'
    : energyHigh
      ? `Above normal (${NORMAL_MAX_WATTS / 1000} kW)`
      : 'Normal usage'

  const music = snapshot.music
  const track = music.status === 'playing' || music.status === 'paused' ? trackById.get(music.trackId) : undefined
  const musicLabel = music.status === 'playing' ? 'Playing now' : music.status === 'paused' ? 'Paused' : 'Music'
  const musicValue = track ? track.title : music.status === 'unknown' ? UNKNOWN : 'Off'

  const meetings = meetingsNow(snapshot)
  const doubleBooked = conflicts(meetings).size > 0
  const meetingTone = doubleBooked ? WARNING : meetings.length > 0 ? DANGER : GOOD
  const meetingValue = doubleBooked ? 'Double booked' : meetings.length > 0 ? 'In use' : 'Free'

  return (
    <div className="overflow-x-clip">
      <FloorPlan door={snapshot.door} occupiedDesks={present} meetingInUse={meetings.length > 0} onSelect={toggle} />

      {panel === Panel.People && <PeoplePanel snapshot={snapshot} now={now} onClose={close} />}
      {panel === Panel.Devices && <DevicesPanel snapshot={snapshot} now={now} onClose={close} />}
      {panel === Panel.Energy && <EnergyPanel snapshot={snapshot} now={now} onClose={close} />}
      {panel === Panel.Music && <MusicPanel snapshot={snapshot} onClose={close} />}
      {panel === Panel.Door && <DoorPanel snapshot={snapshot} now={now} onClose={close} />}
      {panel === Panel.Meeting && <MeetingPanel snapshot={snapshot} now={now} onClose={close} />}

      <nav className="fixed inset-x-0 bottom-6 z-10 flex justify-center px-4">
        <div className="glass flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5">
          <StatPill
            icon={anyoneIn ? PersonFillIcon : PersonIcon}
            tone={anyoneIn ? GOOD : OFF}
            label="People"
            value={known ? `${present} of ${DESKS}` : UNKNOWN}
            detail={known ? `First arrival ${readingText(snapshot.doorTimes.unlocked)}` : 'Not known yet'}
            selected={panel === Panel.People}
            onClick={() => toggle(Panel.People)}
          />
          <StatPill
            icon={devicesIcon}
            tone={devicesTone}
            label="Devices in"
            value={known ? `${inCabinet} of ${devices.length}` : UNKNOWN}
            detail={known ? devicesDetail : 'Not known yet'}
            selected={panel === Panel.Devices}
            onClick={() => toggle(Panel.Devices)}
          />
          <StatPill
            icon={EnergyIcon}
            tone={!known ? OFF : energyHigh || lightsLeftOn ? WARNING : GOOD}
            label="Energy"
            value={known ? `${(watts / 1000).toFixed(1)} kW` : UNKNOWN}
            detail={known ? energyDetail : 'Not known yet'}
            selected={panel === Panel.Energy}
            onClick={() => toggle(Panel.Energy)}
          />
          <StatPill
            icon={MusicIcon}
            tone={music.status === 'playing' ? GOOD : OFF}
            label={musicLabel}
            value={musicValue}
            detail="Office speaker"
            selected={panel === Panel.Music}
            onClick={() => toggle(Panel.Music)}
          />
          <StatPill
            icon={CalendarIcon}
            tone={meetingTone}
            label="Meeting room"
            value={meetingValue}
            detail={meetings.length > 0 ? meetings.map((meeting) => meeting.title).join(' & ') : 'No meeting right now'}
            selected={panel === Panel.Meeting}
            onClick={() => toggle(Panel.Meeting)}
          />
          <StatPill
            icon={unlocked ? LockOpenIcon : LockIcon}
            tone={doorTone}
            label="Front door"
            value={doorText[snapshot.door]}
            detail={doorOpenEmpty ? 'Unlocked while nobody is in' : `Unlocked at ${readingText(snapshot.doorTimes.unlocked)}`}
            selected={panel === Panel.Door}
            onClick={() => toggle(Panel.Door)}
          />
        </div>
      </nav>
    </div>
  )
}
