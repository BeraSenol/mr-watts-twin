import type { ReactNode } from 'react'
import { Header } from './Header'
import type { Selection } from './TimeMachine'

type Props = { onChange: (selection: Selection) => void; children: ReactNode }

export function Shell({ onChange, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header onChange={onChange} />
      <main className="flex-1 px-8 pt-2 pb-24">{children}</main>
    </div>
  )
}
