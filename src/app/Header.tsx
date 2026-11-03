import { TimeMachine } from './TimeMachine'

export function Header() {
  return (
    <header className="sticky top-0 z-10 bg-canvas/70 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between border-b-[0.5px] border-separator px-8">
        <h1 className="text-[17px] font-semibold">Overview</h1>
        <span className="text-sm text-label-secondary">Open</span>
      </div>
      <TimeMachine />
    </header>
  )
}
