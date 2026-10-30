// Reads polygon shapefiles (.shp with its .dbf), as OS Boundary-Line supplies them,
// and finds which polygon a point lies in. Coordinates stay as they are in the file
// (British National Grid metres for OS's data). Copied from Hindcaster (2026-10-30), with
// `readDbf` exported and `readLines` added for OS Open Rivers' polylines (type 3).
// Character and number fields are read as text; no projection handling.

import { readFileSync } from 'node:fs'

export type Ring = number[] // x0, y0, x1, y1, …
export type Shape = { fields: Record<string, string>; box: [number, number, number, number]; rings: { box: [number, number, number, number]; xy: Ring }[] }

export function readDbf(path: string): Record<string, string>[] {
  const b = readFileSync(path)
  const count = b.readUInt32LE(4)
  const headerLength = b.readUInt16LE(8)
  const recordLength = b.readUInt16LE(10)
  const fields: { name: string; length: number }[] = []
  for (let i = 32; b[i] !== 0x0d; i += 32) {
    fields.push({ name: b.subarray(i, i + 11).toString('latin1').replace(/\0.*$/, ''), length: b[i + 16] })
  }
  const rows = []
  for (let r = 0; r < count; r++) {
    let o = headerLength + r * recordLength + 1 // the first byte marks deleted records
    const row: Record<string, string> = {}
    for (const f of fields) {
      row[f.name] = b.subarray(o, o + f.length).toString('latin1').trim()
      o += f.length
    }
    rows.push(row)
  }
  return rows
}

/** Every polygon in `<base>.shp`, with its row from `<base>.dbf`. */
export function readShapes(base: string): Shape[] {
  const rows = readDbf(`${base}.dbf`)
  const b = readFileSync(`${base}.shp`)
  const shapes: Shape[] = []
  let o = 100
  let n = 0
  while (o < b.length) {
    const length = b.readInt32BE(o + 4) * 2 // in 16-bit words
    const c = o + 8
    const type = b.readInt32LE(c)
    if (type === 5) {
      const parts = b.readInt32LE(c + 36)
      const points = b.readInt32LE(c + 40)
      const starts = Array.from({ length: parts }, (_, i) => b.readInt32LE(c + 44 + i * 4))
      const p0 = c + 44 + parts * 4
      const rings = starts.map((start, i) => {
        const end = i + 1 < parts ? starts[i + 1] : points
        const xy: Ring = []
        let box: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity]
        for (let k = start; k < end; k++) {
          const x = b.readDoubleLE(p0 + k * 16)
          const y = b.readDoubleLE(p0 + k * 16 + 8)
          xy.push(x, y)
          box = [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)]
        }
        return { box, xy }
      })
      const box: [number, number, number, number] = [b.readDoubleLE(c + 4), b.readDoubleLE(c + 12), b.readDoubleLE(c + 20), b.readDoubleLE(c + 28)]
      shapes.push({ fields: rows[n], box, rings })
    } else if (type !== 0) {
      throw new Error(`${base}.shp: shape type ${type}, not a polygon`)
    }
    n++
    o += 8 + length
  }
  return shapes
}

const inBox = (box: number[], x: number, y: number, pad = 0) => x >= box[0] - pad && x <= box[2] + pad && y >= box[1] - pad && y <= box[3] + pad

/** Inside a shape: an odd number of its rings round the point (so holes and islands
 *  both work, whichever way the rings are wound). */
export function contains(shape: Shape, x: number, y: number): boolean {
  if (!inBox(shape.box, x, y)) return false
  let inside = false
  for (const r of shape.rings) {
    if (!inBox(r.box, x, y)) continue
    const p = r.xy
    for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) {
      const xi = p[i], yi = p[i + 1], xj = p[j], yj = p[j + 1]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
  }
  return inside
}

/** How far a point is from a shape's edge, in the file's units, if within `limit`. */
export function distanceTo(shape: Shape, x: number, y: number, limit: number): number | null {
  if (!inBox(shape.box, x, y, limit)) return null
  let best = Infinity
  for (const r of shape.rings) {
    if (!inBox(r.box, x, y, limit)) continue
    const p = r.xy
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2], ay = p[i - 1], dx = p[i] - ax, dy = p[i + 1] - ay
      const t = dx || dy ? Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy))) : 0
      best = Math.min(best, Math.hypot(x - ax - t * dx, y - ay - t * dy))
    }
  }
  return best <= limit ? best : null
}

/** A shape's middle: the area-weighted centre of its rings (holes subtract). */
export function centre(shape: Shape): { e: number; n: number } {
  let a = 0, cx = 0, cy = 0
  for (const r of shape.rings) {
    const p = r.xy
    for (let i = 2; i < p.length; i += 2) {
      const cross = p[i - 2] * p[i + 1] - p[i] * p[i - 1]
      a += cross
      cx += (p[i - 2] + p[i]) * cross
      cy += (p[i - 1] + p[i + 1]) * cross
    }
  }
  return { e: Math.round(cx / (3 * a)), n: Math.round(cy / (3 * a)) }
}

/** Every polyline in `<base>.shp` (type 3, as OS Open Rivers), as one list of points
 *  (x0, y0, x1, y1, …) per record, parts joined. An empty shape gives an empty list. */
export function readLines(base: string): Float64Array[] {
  const b = readFileSync(`${base}.shp`)
  const out: Float64Array[] = []
  let o = 100
  while (o < b.length) {
    const length = b.readInt32BE(o + 4) * 2
    const c = o + 8
    const type = b.readInt32LE(c)
    if (type === 3) {
      const parts = b.readInt32LE(c + 36)
      const points = b.readInt32LE(c + 40)
      const p0 = c + 44 + parts * 4
      const xy = new Float64Array(points * 2)
      for (let k = 0; k < points * 2; k++) xy[k] = b.readDoubleLE(p0 + k * 8)
      out.push(xy)
    } else if (type === 0) {
      out.push(new Float64Array(0))
    } else {
      throw new Error(`${base}.shp: shape type ${type}, not a polyline`)
    }
    o += 8 + length
  }
  return out
}
