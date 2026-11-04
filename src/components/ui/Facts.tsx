export type Fact = { label: string; value: string }

export function Facts({ facts }: { facts: Fact[] }) {
  return (
    <div className="flex gap-2">
      {facts.map((fact) => (
        <div key={fact.label} className="squircle flex flex-1 flex-col gap-0.5 rounded-2xl bg-white/[0.05] px-4 py-3">
          <span className="text-[11px] text-label-secondary">{fact.label}</span>
          <span className="text-[17px] font-semibold tracking-tight">{fact.value}</span>
        </div>
      ))}
    </div>
  )
}
