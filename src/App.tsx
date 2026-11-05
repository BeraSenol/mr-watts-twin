import { useState } from 'react'
import { Shell } from './app/Shell'
import { Overview } from './features/overview/Overview'

function App() {
  const [day, setDay] = useState(0)

  return (
    <Shell onDayChange={setDay}>
      <Overview day={day} />
    </Shell>
  )
}

export default App
