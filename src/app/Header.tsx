import { clock, type IncidentMarks } from '../data/derive'
import type { Snapshot } from '../model/types'
import { Logo } from './Logo'
import { StatusSummary } from './StatusSummary'
import type { Selection } from './crown'
import { TimeMachine } from './TimeMachine'

const fullDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

type Props = { snapshot: Snapshot; incidents: IncidentMarks; onChange: (selection: Selection) => void }

export function Header({ snapshot, incidents, onChange }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-canvas/70 backdrop-blur-xl">
      <div className="relative flex h-14 items-center justify-between border-b-[0.5px] border-separator px-8">
        <Logo className="h-5 text-label" />
        <p className="absolute left-1/2 -translate-x-1/2 text-sm font-medium text-label tabular-nums">
          {fullDate.format(snapshot.time)} · {clock(snapshot.time)}
        </p>
        <StatusSummary snapshot={snapshot} />
      </div>
      <TimeMachine incidents={incidents} onChange={onChange} />
    </header>
  )
}
