import { useState } from 'react'
import {
  CalendarIcon,
  DevicesIcon,
  DevicesSlashIcon,
  DevicesUpdateIcon,
  EnergyIcon,
  LockFillIcon,
  LockOpenFillIcon,
  MusicIcon,
  PersonFillIcon,
  PersonIcon,
} from '../../components/icons/symbols'
import { StatPill } from '../../components/ui/StatPill'
import { Tone } from '../../components/ui/tone'
import { devices } from '../../data/catalogue'
import {
  conflicts,
  devicesIn,
  doorLeftUnlocked,
  isKnown,
  lightsLeftOn,
  meetingsNow,
  peopleCount,
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

const UNKNOWN = 'Unknown'

export function Overview({ snapshot, now }: { snapshot: Snapshot; now: Date }) {
  const [panel, setPanel] = useState<Panel>(Panel.None)
  const toggle = (next: Panel) => setPanel((current) => (current === next ? Panel.None : next))
  const close = () => setPanel(Panel.None)

  const known = isKnown(snapshot)
  const present = presentPeople(snapshot).length
  const anyoneIn = present > 0

  const unlocked = snapshot.door === DoorState.Unlocked
  const doorOpenEmpty = doorLeftUnlocked(snapshot)
  const doorTone = doorOpenEmpty ? Tone.Danger : unlocked ? Tone.Good : Tone.Off

  const lightsLeft = lightsLeftOn(snapshot)

  const inCabinet = devicesIn(snapshot).length
  const updates = devices.filter((device) => device.os !== device.latestOs).length
  const noDevices = known && inCabinet === 0
  const needsUpdate = !noDevices && updates > 0
  const devicesIcon = noDevices ? DevicesSlashIcon : needsUpdate ? DevicesUpdateIcon : DevicesIcon
  const devicesTone = !known || noDevices ? Tone.Off : needsUpdate ? Tone.Warning : Tone.Good
  const approx = known ? '' : '~'
  const devicesDetail = `${approx}${devices.length - inCabinet} borrowed` + (needsUpdate ? ` · ${updates} need an update` : '')

  const watts = totalWatts(snapshot, now)
  const energyHigh = watts > NORMAL_MAX_WATTS
  const energyDetail = lightsLeft
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
  const meetingTone = doubleBooked ? Tone.Warning : meetings.length > 0 ? Tone.Danger : Tone.Good
  const meetingValue = doubleBooked ? 'Double booked' : meetings.length > 0 ? 'In use' : 'Free'

  return (
    <div className="overflow-x-clip">
      <FloorPlan
        door={snapshot.door}
        seats={peopleCount(snapshot)}
        devicesIn={inCabinet}
        deviceSlots={devices.length}
        predicted={!known}
        meetingInUse={meetings.length > 0}
        onSelect={toggle}
      />

      {panel === Panel.People && <PeoplePanel snapshot={snapshot} now={now} onClose={close} />}
      {panel === Panel.Devices && <DevicesPanel snapshot={snapshot} now={now} onClose={close} />}
      {panel === Panel.Energy && <EnergyPanel snapshot={snapshot} now={now} onClose={close} />}
      {panel === Panel.Music && <MusicPanel snapshot={snapshot} onClose={close} />}
      {panel === Panel.Door && <DoorPanel snapshot={snapshot} now={now} onClose={close} />}
      {panel === Panel.Meeting && <MeetingPanel snapshot={snapshot} now={now} onClose={close} />}

      <nav className="fixed inset-x-0 bottom-6 z-10 flex justify-center px-4">
        <div className="glass flex max-w-full gap-1 overflow-x-auto rounded-full p-1.5">
          <StatPill
            icon={peopleCount(snapshot) > 0 ? PersonFillIcon : PersonIcon}
            tone={anyoneIn ? Tone.Good : Tone.Off}
            label={known ? 'People' : 'Expected'}
            value={`${known ? '' : '~'}${peopleCount(snapshot)} of ${DESKS}`}
            detail={`First arrival ${readingText(snapshot.doorTimes.unlocked)}`}
            selected={panel === Panel.People}
            onClick={() => toggle(Panel.People)}
          />
          <StatPill
            icon={devicesIcon}
            tone={devicesTone}
            label={known ? 'Devices in' : 'Expected in'}
            value={`${approx}${inCabinet} of ${devices.length}`}
            detail={devicesDetail}
            selected={panel === Panel.Devices}
            onClick={() => toggle(Panel.Devices)}
          />
          <StatPill
            icon={EnergyIcon}
            tone={!known ? Tone.Off : energyHigh || lightsLeft ? Tone.Warning : Tone.Good}
            label={known ? 'Energy' : 'Expected use'}
            value={`${approx}${(watts / 1000).toFixed(1)} kW`}
            detail={energyDetail}
            selected={panel === Panel.Energy}
            onClick={() => toggle(Panel.Energy)}
          />
          <StatPill
            icon={MusicIcon}
            tone={music.status === 'playing' ? Tone.Good : Tone.Off}
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
            icon={unlocked ? LockOpenFillIcon : LockFillIcon}
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
