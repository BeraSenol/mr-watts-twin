export const LINE = '#737373'
export const FAINT = '#2e2e2e'
export const SEATED = '#4a4a4a'
export const WALL = 1.5

function corners(x: number, y: number, w: number, h: number, r: number) {
  const k = r * 0.1
  const right = x + w
  const bottom = y + h
  return {
    bottomRight: `C ${right - k} ${bottom} ${right} ${bottom - k} ${right} ${bottom - r}`,
    topRight: `C ${right} ${y + k} ${right - k} ${y} ${right - r} ${y}`,
    topLeft: `C ${x + k} ${y} ${x} ${y + k} ${x} ${y + r}`,
    bottomLeft: `C ${x} ${bottom - k} ${x + k} ${bottom} ${x + r} ${bottom}`,
  }
}

export function squircle(x: number, y: number, w: number, h: number, r: number) {
  const c = corners(x, y, w, h, r)
  return [
    `M ${x + r} ${y + h}`,
    `L ${x + w - r} ${y + h}`,
    c.bottomRight,
    `L ${x + w} ${y + r}`,
    c.topRight,
    `L ${x + r} ${y}`,
    c.topLeft,
    `L ${x} ${y + h - r}`,
    c.bottomLeft,
    'Z',
  ].join(' ')
}

export function againstWall(x: number, y: number, w: number, h: number, r: number) {
  const c = corners(x, y, w, h, r)
  return [`M ${x + w} ${y + h}`, `L ${x + w} ${y + r}`, c.topRight, `L ${x + r} ${y}`, c.topLeft, `L ${x} ${y + h}`].join(' ')
}

export function walls(x: number, y: number, w: number, h: number, r: number, gapFrom: number, gapTo: number) {
  const c = corners(x, y, w, h, r)
  return [
    `M ${gapTo} ${y + h}`,
    `L ${x + w - r} ${y + h}`,
    c.bottomRight,
    `L ${x + w} ${y + r}`,
    c.topRight,
    `L ${x + r} ${y}`,
    c.topLeft,
    `L ${x} ${y + h - r}`,
    c.bottomLeft,
    `L ${gapFrom} ${y + h}`,
  ].join(' ')
}
