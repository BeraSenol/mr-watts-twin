import { useEffect, type ReactNode } from 'react'

type Props = {
  title: string
  subtitle: string
  onClose: () => void
  children: ReactNode
}

export function Sheet({ title, subtitle, onClose, children }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <section
      aria-label={title}
      className="glass fixed inset-x-0 top-36 bottom-28 z-20 m-auto flex h-fit max-h-[calc(100dvh-256px)] w-[min(760px,calc(100vw-32px))] animate-sheet-in flex-col rounded-[28px]"
    >
      <header className="flex items-start justify-between gap-4 px-5 pt-5 pb-4">
        <div>
          <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>
          <p className="text-[13px] text-label-secondary">{subtitle}</p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-7 shrink-0 place-items-center rounded-full bg-white/10 text-label-secondary transition-colors hover:bg-white/15 hover:text-label"
        >
          <svg viewBox="0 0 10 10" className="size-2.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round">
            <path d="M1 1 L9 9 M9 1 L1 9" />
          </svg>
        </button>
      </header>
      <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-5">{children}</div>
    </section>
  )
}
