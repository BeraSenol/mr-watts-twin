import { useState, type ComponentType, type SVGProps } from 'react'
import { BackwardIcon, ForwardIcon, PauseIcon, PlayIcon } from '../../components/icons/symbols'
import { List, Row } from '../../components/ui/List'
import { Sheet } from '../../components/ui/Sheet'
import { clock, trackById } from '../../data/derive'
import type { Snapshot } from '../../model/types'

const PLAYED_SHOWN = 5

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

export function MusicPanel({ snapshot, onClose }: { snapshot: Snapshot; onClose: () => void }) {
  const [paused, setPaused] = useState(false)
  const music = snapshot.music
  const finished = music.status === 'playing' || music.status === 'paused' ? snapshot.playedToday.slice(0, -1) : snapshot.playedToday
  const played = finished.slice(-PLAYED_SHOWN).reverse()

  if (music.status === 'unknown') {
    return (
      <Sheet title="Now playing" subtitle="Office speaker" onClose={onClose}>
        <List title="Music">
          <Row title="Not known yet" subtitle="Music is only known for the past and today" dimmed />
        </List>
      </Sheet>
    )
  }

  const history = (
    <List title="Played today">
      {played.length === 0 ? (
        <Row title="Nothing yet" subtitle="Music starts with the first arrival" dimmed />
      ) : (
        played.map((play) => {
          const track = trackById.get(play.trackId)
          if (!track) return null
          return (
            <Row
              key={play.playedAt}
              title={track.title}
              subtitle={track.artist}
              trailing={<span className="text-[13px] text-label-secondary tabular-nums">{clock(play.playedAt)}</span>}
            />
          )
        })
      )}
    </List>
  )

  const track = music.status === 'off' ? undefined : trackById.get(music.trackId)
  if (music.status === 'off' || !track) {
    return (
      <Sheet title="Now playing" subtitle="Office speaker · off" onClose={onClose}>
        {history}
      </Sheet>
    )
  }

  const playing = music.status === 'playing' && !paused
  const progress = (music.positionSec / track.durationSec) * 100

  return (
    <Sheet title="Now playing" subtitle={music.sourceDevice} onClose={onClose}>
      <div className="flex items-center gap-4">
        <div className="squircle size-20 shrink-0 rounded-2xl bg-gradient-to-br from-accent/80 via-cyan/40 to-success/40" />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[17px] font-semibold tracking-tight">{track.title}</span>
          <span className="truncate text-[14px] text-label-secondary">{track.artist}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="h-1 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-label" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between text-[11px] text-label-secondary tabular-nums">
          <span>{time(music.positionSec)}</span>
          <span>-{time(track.durationSec - music.positionSec)}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6">
        <ControlButton icon={BackwardIcon} label="Previous" size="h-5 w-6" onClick={() => {}} />
        <ControlButton
          icon={playing ? PauseIcon : PlayIcon}
          label={playing ? 'Pause' : 'Play'}
          size="h-7 w-7"
          onClick={() => setPaused(playing)}
        />
        <ControlButton icon={ForwardIcon} label="Next" size="h-5 w-6" onClick={() => {}} />
      </div>

      <List title="Up next">
        {music.queue.map((id) => {
          const next = trackById.get(id)
          if (!next) return null
          return <Row key={id} title={next.title} subtitle={next.artist} />
        })}
      </List>
      {history}
    </Sheet>
  )
}
