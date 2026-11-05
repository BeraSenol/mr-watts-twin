import type { ReactNode } from 'react'
import { Header } from './Header'

type Props = { onDayChange: (day: number) => void; children: ReactNode }

export function Shell({ onDayChange, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header onDayChange={onDayChange} />
      <main className="flex-1 px-8 pt-2 pb-24">{children}</main>
    </div>
  )
}
