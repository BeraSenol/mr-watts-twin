import { useState } from 'react'
import { momentOf } from './app/moment'
import { Shell } from './app/Shell'
import type { Selection } from './app/crown'
import { snapshotAt } from './data/history'
import { Overview } from './features/overview/Overview'

export function App() {
  const [now] = useState(() => new Date())
  const [selection, setSelection] = useState<Selection>({ day: 0, hour: { status: 'default' } })
  const snapshot = snapshotAt(momentOf(selection, now), now)

  return (
    <Shell snapshot={snapshot} onChange={setSelection}>
      <Overview snapshot={snapshot} now={now} />
    </Shell>
  )
}
