let audio: AudioContext | undefined

export function playTick() {
  audio ??= new AudioContext()
  const now = audio.currentTime
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()

  oscillator.type = 'square'
  oscillator.frequency.value = 2400
  gain.gain.setValueAtTime(0.03, now)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015)

  oscillator.connect(gain).connect(audio.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.02)
  navigator.vibrate?.(4)
}
