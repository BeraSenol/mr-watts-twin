import type { ReactNode } from 'react'

export function List({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-[11px] font-medium tracking-wider text-label-secondary uppercase">{title}</h3>
      <div className="squircle divide-y-[0.5px] divide-separator overflow-hidden rounded-2xl bg-white/[0.05]">
        {children}
      </div>
    </section>
  )
}

type RowProps = {
  title: string
  subtitle: string
  leading?: ReactNode
  trailing?: ReactNode
  dimmed?: boolean
}

export function Row({ title, subtitle, leading, trailing, dimmed = false }: RowProps) {
  return (
    <div className={`flex items-center gap-3 px-4 py-2.5 ${dimmed ? 'opacity-45' : ''}`}>
      {leading}
      <div className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate text-[14px]">{title}</span>
        <span className="truncate text-[12px] text-label-secondary">{subtitle}</span>
      </div>
      {trailing}
    </div>
  )
}
