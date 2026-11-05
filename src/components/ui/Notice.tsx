import type { ComponentType, SVGProps } from 'react'
import type { Tone } from './tone'

type Props = { icon: ComponentType<SVGProps<SVGSVGElement>>; tone: Tone; title: string; message: string }

export function Notice({ icon: Icon, tone, title, message }: Props) {
  return (
    <div className="squircle flex items-center gap-3 rounded-2xl bg-white/[0.05] px-4 py-3">
      <span className={`grid size-9 shrink-0 place-items-center rounded-full ${tone}`}>
        <Icon className="h-[18px] w-[22px]" />
      </span>
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="text-[14px] font-semibold">{title}</span>
        <span className="text-[12px] text-label-secondary">{message}</span>
      </div>
    </div>
  )
}
