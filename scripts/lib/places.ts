// The "Near …" line under a gauge (John, November 3rd 2026): Hindcaster's idea for rain
// gauges, with a rule that suits river gauges, which are often out in the fields.
//  - A gauge named after a town, city or village gets no line ("Reading", "Sonning Lock").
//  - Otherwise: a town or city within 3 miles; else a village within 2 miles; else a suburb
//    or hamlet within 2 miles ("Near Eton"). Further than that, the nearest town or village
//    with its distance and direction ("5 miles west of Wooler").
//  - A gauge named after a suburb or hamlet gets a line only from a town, city or village
//    ("Pinner, Avenue Road" isn't given "Near Pinnerwood Park").
//  - A place that repeats a word of the gauge's name is left out ("Horsforth Cornmill View"
//    gets no "Near Horsforth Woodside").
// Plain functions with no file access, so `npm run check` can test them.

import type { Place } from './openNames.ts'

export const MILE = 1609.344
const BIG = ['City', 'Town']
const VILLAGE = ['Village']
const SMALL = ['Hamlet', 'Suburban Area', 'Other Settlement']

/** The line's place: `far` only when it's more than the near limits away. */
export type GaugePlace = { name: string; type: string; metres: number; far: { miles: number; dir: string } | null }

// Words that name what a gauge is on or beside, not where it is, so they never count as
// "named after a place" on their own (some are hamlets' names too: Weir, Mill, Bridge).
const NOT_PLACES = new Set(
  'river brook stream ditch drain dyke dike beck burn water rhyne cut canal channel leat lock weir sluice mill bridge road lane street farm park house hall green common end gs station ps pumping upper lower north south east west new old main little great the at of and on in upstream downstream tail head ford'.split(' '),
)
const words = (s: string) => s.toLowerCase().replace(/[’']/g, "'").split(/[^a-z0-9'-]+/).filter(Boolean)
const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west']

export type PlaceIndex = { all: Place[]; byName: Map<string, Place[]> }
export function indexPlaces(places: Place[]): PlaceIndex {
  const byName = new Map<string, Place[]>()
  for (const p of places) {
    const k = words(p.name).join(' ')
    const list = byName.get(k)
    if (list) list.push(p)
    else byName.set(k, [p])
  }
  return { all: places, byName }
}

function nearest(places: Place[], x: number, y: number, types?: string[], not?: string) {
  let best: { p: Place; d: number } | null = null
  for (const p of places) {
    if (types && !types.includes(p.type)) continue
    if (not && p.name === not) continue
    const d = Math.hypot(p.x - x, p.y - y)
    if (!best || d < best.d) best = { p, d }
  }
  return best
}

/** The place the gauge is named after, if any: a run of words in its name matching a place
 *  within 5 miles (a town or city) or 2 miles (anything smaller); the longest run wins. */
export function namedAfter(name: string, x: number, y: number, idx: PlaceIndex): Place | null {
  const w = words(name)
  let best: { p: Place; len: number } | null = null
  for (let i = 0; i < w.length; i++) {
    for (let j = i + 1; j <= w.length; j++) {
      const run = w.slice(i, j)
      if (run.every((x) => NOT_PLACES.has(x) || x.length < 3)) continue
      const hit = nearest(idx.byName.get(run.join(' ')) ?? [], x, y)
      if (!hit || hit.d > (BIG.includes(hit.p.type) ? 5 : 2) * MILE) continue
      if (!best || run.length > best.len) best = { p: hit.p, len: run.length }
    }
  }
  return best?.p ?? null
}

/** The gauge's "Near …" place, or null for no line. */
export function gaugePlace(name: string, x: number, y: number, idx: PlaceIndex): GaugePlace | null {
  const after = namedAfter(name, x, y, idx)
  if (after && !SMALL.includes(after.type)) return null
  const not = after?.name
  const t = nearest(idx.all, x, y, BIG, not)
  const v = nearest(idx.all, x, y, VILLAGE, not)
  const s = nearest(idx.all, x, y, SMALL, not)
  let pick: { p: Place; d: number } | null = null
  let far = false
  if (t && t.d <= 3 * MILE) pick = t
  else if (v && v.d <= 2 * MILE) pick = v
  else if (after) return null // already named after a suburb or hamlet, and nothing bigger is near
  else if (s && s.d <= 2 * MILE) pick = s
  else {
    pick = !t ? v : !v ? t : t.d < v.d ? t : v
    far = true
  }
  if (!pick) return null
  const own = new Set(words(name))
  if (words(pick.p.name).some((x) => x.length > 3 && own.has(x))) return null
  const deg = ((Math.atan2(x - pick.p.x, y - pick.p.y) * 180) / Math.PI + 360) % 360
  return {
    name: pick.p.name, type: pick.p.type, metres: Math.round(pick.d),
    far: far ? { miles: Math.round(pick.d / MILE), dir: DIRS[Math.round(deg / 45) % 8] } : null,
  }
}
