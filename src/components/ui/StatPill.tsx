import type { ComponentType, SVGProps } from 'react'

type Props = {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: string
  label: string
  value: string
  detail: string
  selected: boolean
  onClick: () => void
}

export function StatPill({ icon: Icon, tone, label, value, detail, selected, onClick }: Props) {
  return (
    <button
      type="button"
      title={detail}
      aria-pressed={selected}
      onClick={onClick}
      className={`flex shrink-0 items-center gap-3 rounded-full py-1.5 pr-5 pl-1.5 text-left transition-colors ${
        selected ? 'bg-white/[0.12]' : 'hover:bg-white/[0.06]'
      }`}
    >
      <span className={`grid size-9 place-items-center rounded-full ${tone}`}>
        <Icon className="h-[18px] w-[22px]" />
      </span>
      <span className="flex max-w-36 flex-col leading-tight">
        <span className="truncate text-[15px] font-semibold tracking-tight">{value}</span>
        <span className="text-[11px] text-label-secondary">{label}</span>
      </span>
    </button>
  )
}
