import { useState } from 'react'
import { momentOf } from './app/moment'
import { Shell } from './app/Shell'
import { RANGE, type Selection } from './app/crown'
import { incidentsBefore } from './data/derive'
import { snapshotAt } from './data/snapshot'
import { Overview } from './features/overview/Overview'

export function App() {
  const [now] = useState(() => new Date())
  const [incidents] = useState(() => incidentsBefore(now, RANGE))
  const [selection, setSelection] = useState<Selection>({ day: 0, hour: { status: 'default' } })
  const snapshot = snapshotAt(momentOf(selection, now), now)

  return (
    <Shell snapshot={snapshot} incidents={incidents} onChange={setSelection}>
      <Overview snapshot={snapshot} now={now} />
    </Shell>
  )
}
