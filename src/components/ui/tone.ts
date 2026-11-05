export const Tone = {
  Good: 'bg-success/15 text-success',
  Warning: 'bg-glow/15 text-glow',
  Off: 'bg-white/10 text-label-secondary',
  Danger: 'bg-danger/15 text-danger',
} as const
export type Tone = (typeof Tone)[keyof typeof Tone]
