import type { ReactNode } from 'react'
import { Header } from './Header'

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex-1 px-8 pt-2 pb-24">{children}</main>
    </div>
  )
}
