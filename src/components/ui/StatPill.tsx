import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  tone: string
  label: string
  value: string
  detail: string
}

export function StatPill({ icon: Icon, tone, label, value, detail }: Props) {
  return (
    <div
      title={detail}
      className="flex shrink-0 items-center gap-3 rounded-full py-1.5 pr-5 pl-1.5 transition-colors hover:bg-white/[0.06]"
    >
      <span className={`grid size-9 place-items-center rounded-full ${tone}`}>
        <Icon size={18} strokeWidth={2} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold tracking-tight">{value}</span>
        <span className="text-[11px] text-label-secondary">{label}</span>
      </span>
    </div>
  )
}
