// Which Environment Agency stations are river gauges, which near-duplicates go, which
// gauges are held by a lock or weir, and how names are shown (SPEC §3). Plain functions,
// so `npm run check` can test them; `scripts/build-gauges.ts` puts them together.

import { lastPart, list } from './ea.ts'

/** A station from the flood-monitoring list (`/id/stations?_view=full`), as far as used. */
export type Station = {
  stationReference: string
  wiskiID?: string
  label: string | string[]
  riverName?: string
  town?: string
  lat?: number
  long?: number
  easting?: number
  northing?: number
  RLOIid?: string | string[]
  dateOpened?: string
  stageScale?: unknown
  measures?: Measure | Measure[]
}
export type Measure = { '@id': string; parameter?: string; qualifier?: string; unitName?: string }

export const LEVEL_UNITS = ['mASD', 'm', 'mAOD']

/** The level measure that makes a station a river gauge, or null (SPEC §3.1): no tidal or
 *  groundwater measure, and a level measure with the qualifier "Stage" in m, mASD or mAOD.
 *  Where there are two (one station has both mASD and mAOD, a few m and mASD), the one
 *  with the latest reading, then mASD, m, mAOD in that order. "Downstream Stage" measures
 *  aren't used (no archive history). */
export function riverMeasure(s: Station, latestAt: (measure: string) => number | undefined): Measure | null {
  const ms = list(s.measures)
  if (ms.some((m) => m.qualifier === 'Tidal Level' || m.qualifier === 'Groundwater')) return null
  const stage = ms.filter((m) => m.parameter === 'level' && m.qualifier === 'Stage' && LEVEL_UNITS.includes(m.unitName ?? ''))
  if (!stage.length) return null
  return stage.sort((a, b) =>
    (latestAt(lastPart(b['@id'])) ?? 0) - (latestAt(lastPart(a['@id'])) ?? 0) ||
    LEVEL_UNITS.indexOf(a.unitName!) - LEVEL_UNITS.indexOf(b.unitName!))[0]
}

export const hasDownstream = (s: Station) => list(s.measures).some((m) => m.qualifier === 'Downstream Stage')

/** Straight-line distance in metres between two points in British National Grid metres. */
export const metres = (a: { e: number; n: number }, b: { e: number; n: number }) => Math.hypot(a.e - b.e, a.n - b.n)

/** Miles between two points in latitude and longitude (flat-earth sum, good to well under
 *  1% at these distances). */
export function miles(a: [number, number], b: [number, number]): number {
  const r = Math.PI / 180
  const x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) / 2) * r)
  const y = (b[0] - a[0]) * r
  return 3958.8 * Math.hypot(x, y)
}

// ---- near-duplicates (SPEC §3.2) ----

export const NEAR_DUPLICATE_M = 100
export const isBackup = (name: string) => /\bback-?up\b/i.test(name)

/** Of gauges on the same river within 100 m of each other, one is kept: one with archive
 *  history first, then the shorter name, then the lower reference. Returns the kept
 *  gauges and, for each one dropped, the one it gave way to. Backups have already gone. */
export function dropNearDuplicates<G extends { ref: string; name: string; river: string | null; e: number; n: number; archive: string | null }>(gauges: G[]): { kept: G[]; dropped: { gauge: G; for: G; metres: number }[] } {
  const order = [...gauges].sort((a, b) => Number(!!b.archive) - Number(!!a.archive) || a.name.length - b.name.length || a.ref.localeCompare(b.ref))
  const kept: G[] = []
  const dropped: { gauge: G; for: G; metres: number }[] = []
  for (const g of order) {
    const twin = kept.find((k) => k.river !== null && k.river === g.river && metres(k, g) < NEAR_DUPLICATE_M)
    if (twin) dropped.push({ gauge: g, for: twin, metres: Math.round(metres(twin, g)) })
    else kept.push(g)
  }
  return { kept, dropped }
}

// ---- held by a lock or weir (SPEC §3.4, the list Claude's to draft) ----

export type HeldReason = 'name' | 'canal' | 'drain' | 'thames' | 'navigation'

/** Named after a structure (agreed, October 30th): a lock, weir, sluice, mill or gate, or a
 *  staunch (the Great Ouse's word for a weir with a gate). Not "Locks" (Locks Weir on the
 *  Ribble is a weir's name). */
export const STRUCTURE_NAME = /\b(lock|weir|sluice|mill|gate|staunch)\b/i

/** A structure that holds a navigation's level, for finding where a navigation starts. */
export const NAVIGATION_STRUCTURE = /\b(lock|staunch|sluice)\b/i

export const isCanal = (river: string | null, form: string | null) => form === 'canal' || /\b(canal|navigation)\b/i.test(river ?? '')

/** St John's Lock, Lechlade, the highest lock on the Thames, is at 1.69° W (as in the
 *  agreed mock-up): the non-tidal Thames east of it is one lock reach after another. */
export const THAMES_HEAD_LONG = -1.69

/** Rivers that are navigations with locks along them (SPEC §3.4: the EA's navigations, and
 *  others found; checked by Claude, October 30th 2026). Each is held from its head
 *  downwards: the named gauge where one is given (the first gauge at or below where the
 *  navigation starts), otherwise the highest gauge on that river named after a lock,
 *  staunch or sluice. Left out on purpose: navigations long disused (the Itchen, the
 *  Suffolk Stour, the Cuckmere), and the fen drains, whose levels are pumped (listed in the
 *  review for John). */
export const NAVIGATIONS: Record<string, string[]> = {
  thames: [],
  medway: [],
  'great ouse': ['Bedford'],
  nene: [],
  welland: [],
  ancholme: ['Brandy Wharf'],
  glen: [],
  kennet: ['Newbury'],
  lea: [],
  stort: ['Bishops Stortford, Grange Paddocks'],
  wey: [],
  severn: ['Worcester (Barbourne)'],
  avon: ['Stratford', 'Pulteney Weir'], // the Warwickshire Avon, and the Bristol Avon from Bath
  trent: [],
  soar: [],
  witham: ['Bargate Weir'],
  chelmer: [],
  cam: [],
  aire: ['Leeds Crown Point'],
  calder: [],
  don: ['Rotherham'],
  ouse: [],
}

/** A river's name as the navigation list has it ("River Lee" and "River Lea" are one). */
export const navName = (river: string | null) => (river ?? '').toLowerCase().replace(/\briver\b/g, '').replace(/\blee\b/g, 'lea').replace(/\s+/g, ' ').trim()

/** Why a gauge is held by a structure, or null if it isn't. `navigationHead` is the
 *  distance to the sea of its navigation's head (see `navigationHeads`). A gauge with a
 *  downstream measure isn't held on that account alone: many are gauging weirs or culverts,
 *  where the level follows the flow (locks research, finding 6). */
export function heldReason(g: { name: string; river: string | null; county?: string | null; long: number; form: string | null; toSeaKm: number | null }, navigationHead: number | undefined): HeldReason | null {
  if (STRUCTURE_NAME.test(g.name)) return 'name'
  if (isCanal(g.river, g.form)) return 'canal'
  if (isDrain(g.river, g.county ?? null)) return 'drain'
  if (/^river thames$/i.test(g.river ?? '') && g.long > THAMES_HEAD_LONG) return 'thames'
  if (navigationHead !== undefined && g.toSeaKm !== null && g.toSeaKm <= navigationHead + 0.2) return 'navigation'
  return null
}

/** Each navigation's head, for each river system it's in (OS Open Rivers' outlet keeps the
 *  four River Stours and two River Avons apart). */
export function navigationHeads(gauges: { name: string; river: string | null; outlet: string | null; toSeaKm: number | null }[]): Map<string, { toSeaKm: number; gauge: string }> {
  const heads = new Map<string, { toSeaKm: number; gauge: string }>()
  const named = new Set<string>()
  for (const g of gauges) {
    const nav = NAVIGATIONS[navName(g.river)]
    if (!nav || !g.outlet || g.toSeaKm === null) continue
    const key = riverKey(g.river!, g.outlet)
    if (nav.includes(g.name)) { heads.set(key, { toSeaKm: g.toSeaKm, gauge: g.name }); named.add(key); continue }
    if (named.has(key) || !NAVIGATION_STRUCTURE.test(g.name)) continue
    const h = heads.get(key)
    if (!h || g.toSeaKm > h.toSeaKm) heads.set(key, { toSeaKm: g.toSeaKm, gauge: g.name })
  }
  return heads
}
export const riverKey = (river: string, outlet: string) => `${navName(river)}|${outlet}`

/** A fen drain, rhyne or similar, whose level is usually set by pumping, so it's held like a
 *  lock reach (John, October 31st). A drainage word in its name, in the low-lying drained
 *  counties only: elsewhere a "dike" or "dyke" is usually a hill stream (Grimescar Dike,
 *  Cockers Dyke), and "Cut" and "Leam" are rivers (The Cut, the River Leam). */
export const DRAIN_NAME = /\b(drain|rhyne|lode|delph|eau|dyke|dike|catchwater)\b/i
export const DRAINED_COUNTIES = ['Lincolnshire', 'Cambridgeshire', 'Norfolk', 'Suffolk', 'Somerset', 'East Riding of Yorkshire', 'Nottinghamshire']
export const isDrain = (river: string | null, county: string | null) => DRAIN_NAME.test(river ?? '') && DRAINED_COUNTIES.includes(county ?? '')

// ---- names ----

/** The EA's site codes at the end of an operational gauge's name ("GS" gauging station,
 *  "GSM", "WITS", "RL" river level, "USGS" and "ULTRASONIC GS" ultrasonic gauging
 *  station), which mean nothing to a visitor. */
const SITE_CODES = /(\s+(gs|g\.stn|gsm|wits|rl|fd|usgs|ultrasonic|lvl|automation|auto|dual comms|telemetry|gauging station))+$/i
const SMALL = new Set(['and', 'at', 'by', 'in', 'of', 'on', 'the', 'upon', 'under', 'with', 'nr', 'u/s', 'd/s'])

/** "MANTHORPE GS WITS" → "Manthorpe"; "RIVER KENNET  AT  THEALE" → "River Kennet at
 *  Theale"; names that aren't all in capitals are kept as the EA gives them. */
export function tidyName(label: string): string {
  const one = label.replace(/\s+/g, ' ').trim()
  if (one !== one.toUpperCase() || !/[A-Z]/.test(one)) return one.replace(SITE_CODES, '') || one
  const words = one.replace(SITE_CODES, '').toLowerCase().split(' ')
  return words
    .map((w, i) => (i > 0 && SMALL.has(w) ? w : w.replace(/(^|[-'(/])([a-z])/g, (_, p, c) => p + c.toUpperCase())))
    .join(' ')
    .replace(/\bSt\b(?!\.)/g, 'St')
}

/** The live label, or the archive's own label when the live one is all in capitals (the
 *  archive usually has a plain place name for those: "RIVER KENNET AT THEALE" is
 *  "Theale"). */
export function shownName(label: string, archiveLabel: string | null): string {
  const one = label.replace(/\s+/g, ' ').trim()
  if (archiveLabel && one === one.toUpperCase() && archiveLabel !== archiveLabel.toUpperCase()) return archiveLabel.trim()
  return tidyName(one)
}

/** The river's name as the EA gives it, or the archive's, or OS Open Rivers' name for the
 *  stretch the gauge is on, with where it came from. */
export function riverName(live: string | undefined, archive: string | undefined, openRivers: string | undefined): { river: string | null; from: 'ea' | 'archive' | 'os' | null } {
  const clean = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()
  if (clean(live)) return { river: clean(live), from: 'ea' }
  if (clean(archive)) return { river: clean(archive), from: 'archive' }
  if (clean(openRivers)) return { river: clean(openRivers), from: 'os' }
  return { river: null, from: null }
}

/** A lake, reservoir, mere or pond, from the names or Open Rivers' "lake" form (SPEC §7.4:
 *  a lake has its own card). Not "… Water": in England that's usually a stream (Wooler
 *  Water, Shreen Water). */
export const isLake = (river: string | null, name: string, form: string | null) =>
  form === 'lake' || /^lake\b|\b(lake|mere|reservoir|tarn)$/i.test(river ?? '') || /\b(reservoir|lake|pond)\b/i.test(name)

// ---- matching the archive ----

/** Words that don't identify a site on their own. */
const COMMON = new Set(['river', 'stream', 'brook', 'beck', 'drain', 'sluice', 'weir', 'lock', 'mill', 'gate', 'bridge', 'road', 'lane', 'street',
  'upstream', 'downstream', 'level', 'station', 'gauge', 'gauging', 'rainfall', 'the', 'and', 'at', 'of', 'on', 'farm', 'house', 'park', 'main',
  'lower', 'upper', 'north', 'south', 'east', 'west', 'new', 'old', 'pumping', 'outfall', 'telemetry', 'screen', 'basin'])
const words = (s: string) => new Set(s.toLowerCase().replace(SITE_CODES, '').split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !COMMON.has(w)))

/** Whether two names are for the same site: they share a word that identifies it
 *  ("Blakes Lock G.STN" and "Blakes Lock"; not "Uphill Rhyne Terrace Tilting Weir" and
 *  "Sampford Brett Screen"), or are the same once tidied ("Canal Road"). */
export function namesAgree(a: string, b: string): boolean {
  const x = words(a), y = words(b)
  if ([...x].some((w) => y.has(w))) return true
  const t = (s: string) => s.toLowerCase().replace(SITE_CODES, '').replace(/[^a-z0-9]/g, '')
  return t(a) === t(b)
}

/** An archive station within this distance of the live one is taken to be the same gauge. */
export const ARCHIVE_NEAR_M = 1000
