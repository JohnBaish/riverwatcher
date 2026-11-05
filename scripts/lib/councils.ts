// Each gauge's council area (district, borough or unitary), from OS Boundary-Line's
// district_borough_unitary_region layer (ESRI Shapefile download, Open Government Licence;
// not kept in the repo), for the curated combinations (SPEC §8.5). A point just off the coast
// takes the council within 2 km, as the counties do (areas.ts).

import { join } from 'node:path'
import { COAST_M } from './areas.ts'
import { contains, distanceTo, readShapes, type Shape } from './shapefile.ts'

/** OS's name without its bookkeeping: "Reading (B)" → "Reading", "South Oxfordshire District"
 *  → "South Oxfordshire", "Basingstoke and Deane District (B)" → "Basingstoke and Deane". */
export function councilName(os: string): string {
  return os.replace(/ \(B\)$/, '').replace(/ (District|London Boro)$/, '').trim()
}

export function readCouncils(boundaryLineDir: string): Shape[] {
  return readShapes(join(boundaryLineDir, 'Data/GB/district_borough_unitary_region'))
}

export function councilOf(shapes: Shape[], e: number, n: number): string | null {
  const hit = shapes.find((s) => contains(s, e, n))
  if (hit) return councilName(hit.fields.NAME)
  let best: { s: Shape; d: number } | null = null
  for (const s of shapes) {
    const d = distanceTo(s, e, n, COAST_M)
    if (d !== null && (!best || d < best.d)) best = { s, d }
  }
  return best ? councilName(best.s.fields.NAME) : null
}
