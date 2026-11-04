import { useState, type ReactNode } from 'react'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'

const TRACK = { title: 'Harbour Lights', artist: 'The Quiet Hours', durationSec: 214, positionSec: 83 }

const UP_NEXT = [
  { title: 'Paper Planes at Noon', artist: 'Mila Verhoeven' },
  { title: 'Soft Static', artist: 'North Window' },
  { title: 'Last Tram Home', artist: 'Lowland Club' },
]

const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

function ControlButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-12 place-items-center rounded-full transition-colors hover:bg-white/10 active:scale-95"
    >
      <svg viewBox="0 0 24 24" className="size-6" fill="currentColor">
        {children}
      </svg>
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
        <ControlButton label="Previous" onClick={() => {}}>
          <path d="M5 5 H7 V19 H5 Z M20 5 V19 L8.5 12 Z" />
        </ControlButton>
        <ControlButton label={playing ? 'Pause' : 'Play'} onClick={() => setPlaying(!playing)}>
          {playing ? <path d="M6 4 H10 V20 H6 Z M14 4 H18 V20 H14 Z" /> : <path d="M7 4 L20 12 L7 20 Z" />}
        </ControlButton>
        <ControlButton label="Next" onClick={() => {}}>
          <path d="M17 5 H19 V19 H17 Z M4 5 V19 L15.5 12 Z" />
        </ControlButton>
      </div>

      <List title="Up next">
        {UP_NEXT.map((track) => (
          <Row key={track.title} title={track.title} subtitle={track.artist} />
        ))}
      </List>
    </Sheet>
  )
}
