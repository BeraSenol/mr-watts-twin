import { DeviceKind, Room, type Device, type Light, type Person, type Track } from '../model/types'

export const people: Person[] = [
  { id: 'jonas', name: 'Jonas Maes', initials: 'JM', role: 'Product designer' },
  { id: 'pieter', name: 'Pieter Claes', initials: 'PC', role: 'Unity developer' },
  { id: 'thomas', name: 'Thomas De Smet', initials: 'TD', role: 'Frontend developer' },
  { id: 'ruben', name: 'Ruben Willems', initials: 'RW', role: 'XR developer' },
  { id: 'simon', name: 'Simon Goossens', initials: 'SG', role: 'Project manager' },
  { id: 'lars', name: 'Lars Janssens', initials: 'LJ', role: '3D artist' },
  { id: 'matthias', name: 'Matthias Jacobs', initials: 'MJ', role: 'Backend developer' },
  { id: 'kobe', name: 'Kobe Hermans', initials: 'KH', role: 'Motion designer' },
]

export const devices: Device[] = [
  { id: 'vision-pro', kind: DeviceKind.Headset, name: 'Vision Pro', model: 'Apple Vision Pro', os: 'visionOS 26.1', latestOs: 'visionOS 26.1' },
  { id: 'quest', kind: DeviceKind.Oculus, name: 'Meta Quest 3', model: 'Meta Quest 3', os: 'Horizon OS', latestOs: 'Horizon OS' },
  { id: 'iphone-pro', kind: DeviceKind.Phone, name: 'iPhone 16 Pro', model: 'iPhone 16 Pro', os: 'iOS 26.1', latestOs: 'iOS 26.1' },
  { id: 'iphone-se', kind: DeviceKind.Phone, name: 'iPhone SE', model: 'iPhone SE', os: 'iOS 26.1', latestOs: 'iOS 26.1' },
  { id: 'pixel', kind: DeviceKind.Phone, name: 'Pixel 9', model: 'Google Pixel 9', os: 'Android 16', latestOs: 'Android 16' },
  { id: 'galaxy', kind: DeviceKind.Phone, name: 'Galaxy S24', model: 'Samsung Galaxy S24', os: 'Android 16', latestOs: 'Android 16' },
  { id: 'ipad-pro', kind: DeviceKind.Tablet, name: 'iPad Pro 13″', model: 'iPad Pro 13″', os: 'iPadOS 26.1', latestOs: 'iPadOS 26.1' },
  { id: 'ipad-mini', kind: DeviceKind.Tablet, name: 'iPad mini', model: 'iPad mini', os: 'iPadOS 26.1', latestOs: 'iPadOS 26.1' },
  { id: 'macbook', kind: DeviceKind.Laptop, name: 'MacBook Pro 14″', model: 'MacBook Pro 14″', os: 'macOS 26.1', latestOs: 'macOS 26.1' },
  { id: 'thinkpad', kind: DeviceKind.Laptop, name: 'ThinkPad X1 Carbon', model: 'Lenovo ThinkPad X1 Carbon', os: 'Windows 11', latestOs: 'Windows 11' },
]

export const lights: Light[] = [
  { id: 'main-1', name: 'Light 1', room: Room.Main, watts: 12 },
  { id: 'main-2', name: 'Light 2', room: Room.Main, watts: 12 },
  { id: 'main-3', name: 'Light 3', room: Room.Main, watts: 12 },
  { id: 'main-4', name: 'Light 4', room: Room.Main, watts: 12 },
  { id: 'meeting-1', name: 'Light 1', room: Room.Meeting, watts: 12 },
  { id: 'meeting-2', name: 'Light 2', room: Room.Meeting, watts: 12 },
]

export const tracks: Track[] = [
  { id: 'harbour', title: 'Harbour Lights', artist: 'The Quiet Hours', durationSec: 214 },
  { id: 'paper', title: 'Paper Planes at Noon', artist: 'Mila Verhoeven', durationSec: 187 },
  { id: 'static', title: 'Soft Static', artist: 'North Window', durationSec: 243 },
  { id: 'tram', title: 'Last Tram Home', artist: 'Lowland Club', durationSec: 198 },
  { id: 'glass', title: 'Glasshouse', artist: 'Ada & the Engines', durationSec: 256 },
  { id: 'orbit', title: 'Slow Orbit', artist: 'Studio Nine', durationSec: 231 },
]
