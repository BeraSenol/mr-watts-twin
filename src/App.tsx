import { useState } from 'react'
import { Shell } from './app/Shell'
import type { Selection } from './app/TimeMachine'
import { Overview } from './features/overview/Overview'

function App() {
  const [selection, setSelection] = useState<Selection>({ day: 0, hour: { status: 'default' } })

  return (
    <Shell onChange={setSelection}>
      <Overview selection={selection} />
    </Shell>
  )
}

export default App
