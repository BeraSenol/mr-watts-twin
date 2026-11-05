import type { Snapshot } from '../model/types'
import { Logo } from './Logo'
import { StatusSummary } from './StatusSummary'
import type { Selection } from './crown'
import { TimeMachine } from './TimeMachine'

export function Header({ snapshot, onChange }: { snapshot: Snapshot; onChange: (selection: Selection) => void }) {
  return (
    <header className="sticky top-0 z-10 bg-canvas/70 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between border-b-[0.5px] border-separator px-8">
        <Logo className="h-5 text-label" />
        <StatusSummary snapshot={snapshot} />
      </div>
      <TimeMachine onChange={onChange} />
    </header>
  )
}
