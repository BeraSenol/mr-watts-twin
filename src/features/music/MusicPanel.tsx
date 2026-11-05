import { useState, type ComponentType, type SVGProps } from 'react'
import { BackwardIcon, ForwardIcon, PauseIcon, PlayIcon } from '../../components/icons/symbols'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'

const TRACK = { title: 'Harbour Lights', artist: 'The Quiet Hours', durationSec: 214, positionSec: 83 }

const UP_NEXT = [
  { title: 'Paper Planes at Noon', artist: 'Mila Verhoeven' },
  { title: 'Soft Static', artist: 'North Window' },
  { title: 'Last Tram Home', artist: 'Lowland Club' },
]

const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

type ControlProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  size: string
  onClick: () => void
}

function ControlButton({ icon: Icon, label, size, onClick }: ControlProps) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-14 place-items-center rounded-full transition-[background-color,scale] hover:bg-white/10 active:scale-90"
    >
      <Icon className={size} />
    </button>
  )
}

export function MusicPanel({ onClose }: { onClose: () => void }) {
  const [playing, setPlaying] = useState(true)
  const progress = (TRACK.positionSec / TRACK.durationSec) * 100

  return (
    <Sheet title="Now playing" subtitle="Office speaker" onClose={onClose}>
      <div className="flex items-center gap-4">
        <div className="squircle size-20 shrink-0 rounded-2xl bg-gradient-to-br from-accent/80 via-cyan/40 to-success/40" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[17px] font-semibold tracking-tight">{TRACK.title}</span>
          <span className="truncate text-[14px] text-label-secondary">{TRACK.artist}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-label" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-label-secondary tabular-nums">
          <span>{time(TRACK.positionSec)}</span>
          <span>-{time(TRACK.durationSec - TRACK.positionSec)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <ControlButton icon={BackwardIcon} label="Previous" size="h-5 w-6" onClick={() => {}} />
        <ControlButton
          icon={playing ? PauseIcon : PlayIcon}
          label={playing ? 'Pause' : 'Play'}
          size="h-7 w-7"
          onClick={() => setPlaying(!playing)}
        />
        <ControlButton icon={ForwardIcon} label="Next" size="h-5 w-6" onClick={() => {}} />
      </div>

      <List title="Up next">
        {UP_NEXT.map((track) => (
          <Row key={track.title} title={track.title} subtitle={track.artist} />
        ))}
      </List>
    </Sheet>
  )
}
