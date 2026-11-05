import type { ReactNode } from 'react'
import type { Snapshot } from '../model/types'
import { Header } from './Header'
import type { Selection } from './crown'

type Props = { snapshot: Snapshot; onChange: (selection: Selection) => void; children: ReactNode }

export function Shell({ snapshot, onChange, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header snapshot={snapshot} onChange={onChange} />
      <main className="flex-1 px-8 pt-2 pb-24">{children}</main>
    </div>
  )
}
