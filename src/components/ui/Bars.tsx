export type Bar = { label: string; value: number; highlight?: boolean; muted?: boolean; predicted?: boolean }

function fill(bar: Bar) {
  if (bar.predicted) return bar.highlight ? 'border border-dashed border-accent bg-accent/15' : 'border border-dashed border-white/30'
  if (bar.highlight) return 'bg-accent'
  return bar.muted ? 'bg-white/[0.08]' : 'bg-white/25'
}

export function Bars({ bars, max }: { bars: Bar[]; max: number }) {
  return (
    <div className="squircle flex h-36 gap-2 rounded-2xl bg-white/[0.05] px-4 pt-4 pb-3">
      {bars.map((bar) => (
        <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div className={`w-full rounded-[5px] ${fill(bar)}`} style={{ height: `${(bar.value / max) * 100}%` }} />
          </div>
          <span className={`text-[10px] ${bar.highlight ? 'text-label' : 'text-label-secondary'}`}>{bar.label}</span>
        </div>
      ))}
    </div>
  )
}
