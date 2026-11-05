export const Panel = {
  None: 'none',
  People: 'people',
  Devices: 'devices',
  Energy: 'energy',
  Music: 'music',
  Meeting: 'meeting',
  Door: 'door',
} as const
export type Panel = (typeof Panel)[keyof typeof Panel]
