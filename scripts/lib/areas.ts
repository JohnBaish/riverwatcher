// Each gauge's ceremonial county and English region, from OS Boundary-Line (ESRI
// Shapefile download, Open Government Licence; not kept in the repo), as Hindcaster's
// scripts/build-areas.ts does it, with the same names shown (John chose them for
// Hindcaster, 19 October, B6). A point just off the coast (a gauge on a pier or at a sluice
// on the sea wall) takes the county within 2 km; anything farther out, or outside England,
// has none.

import { join } from 'node:path'
import { centre, contains, distanceTo, readShapes, type Shape } from './shapefile.ts'

export const COUNTY_NAME: Record<string, string> = {
  'City and County of the City of London': 'City of London',
  'Tyne & Wear': 'Tyne and Wear',
  'West Midlands': 'West Midlands ceremonial county',
}

export const REGION_NAME: Record<string, string> = {
  'North East English Region': 'North East England',
  'North West English Region': 'North West England',
  'Yorkshire and the Humber English Region': 'Yorkshire and the Humber',
  'East Midlands English Region': 'East Midlands',
  'West Midlands English Region': 'West Midlands region',
  'Eastern English Region': 'East of England',
  'London English Region': 'Greater London',
  'South East English Region': 'South East England',
  'South West English Region': 'South West England',
}

export const COAST_M = 2000

export type Areas = { counties: Shape[]; all: Shape[]; regions: Shape[] }

export function readAreas(boundaryLineDir: string): Areas {
  const all = readShapes(join(boundaryLineDir, 'Data/Supplementary_Ceremonial/Boundary-line-ceremonial-counties_region'))
  const regions = readShapes(join(boundaryLineDir, 'Data/GB/english_region_region'))
  if (regions.length !== 9) throw new Error(`Expected 9 English regions, found ${regions.length}`)
  // England's counties are those whose middle lies in an English region.
  const counties = all.filter((s) => {
    const c = centre(s)
    return regions.some((r) => contains(r, c.e, c.n))
  })
  if (counties.length !== 48) throw new Error(`Expected 48 English ceremonial counties, found ${counties.length}`)
  return { counties, all, regions }
}

function locate(shapes: Shape[], e: number, n: number): { shape: Shape; offshore?: number } | null {
  const hit = shapes.find((s) => contains(s, e, n))
  if (hit) return { shape: hit }
  let best: { shape: Shape; offshore: number } | null = null
  for (const s of shapes) {
    const d = distanceTo(s, e, n, COAST_M)
    if (d !== null && (!best || d < best.offshore)) best = { shape: s, offshore: Math.round(d) }
  }
  return best
}

/** The county and region shown for a point, or nulls outside England. All of Great
 *  Britain's counties are tried first, so a point in Wales or Scotland is found there
 *  rather than taken from the nearest English county. */
export function areaOf(a: Areas, e: number, n: number): { county: string | null; region: string | null; offshore?: number } {
  const found = locate(a.all, e, n)
  if (!found || !a.counties.includes(found.shape)) return { county: null, region: null }
  const r = locate(a.regions, e, n)
  const os = found.shape.fields.NAME
  return {
    county: COUNTY_NAME[os] ?? os,
    region: r ? REGION_NAME[r.shape.fields.NAME] ?? r.shape.fields.NAME : null,
    ...(found.offshore !== undefined ? { offshore: found.offshore } : {}),
  }
}
