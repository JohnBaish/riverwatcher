// `npm run gauges <Open Rivers data folder> <Boundary-Line folder> [<data folder>]`
//
// Builds the gauge list, data/gauges.json in JohnBaish/riverwatcher-data (the data folder,
// by default ../riverwatcher-data/data), and design/gauge-review.md for John (SPEC §3,
// PLAN stage 1.3). From the EA's live station list and latest readings, the Hydrology
// archive's station list, OS Open Rivers (each gauge's place along its river) and OS
// Boundary-Line (its county and region). Neither OS download is kept: OS Open Rivers is
// the "ESRI Shapefile" GB download's `data` folder, Boundary-Line the whole unzipped folder.
//
// With RW_CACHE=<folder>, the three EA lists are kept there and reused (for trying
// changes without asking the EA again).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FM, HY, getJson, lastPart, list } from './lib/ea.ts'
import { coastIndex, normRiver, readNetwork, place, type Place } from './lib/rivers.ts'
import { readLines } from './lib/shapefile.ts'
import { readAreas, areaOf } from './lib/areas.ts'
import {
  ARCHIVE_NEAR_M, metres, namesAgree,
  DRAIN_NAME, DRAINED_COUNTIES, dropNearDuplicates, hasDownstream, heldReason, isDrain, navName, isBackup, isLake, navigationHeads, riverKey, riverMeasure, riverName, shownName,
  type HeldReason, type Station,
} from './lib/gauges.ts'

const [riversDir, blDir, dataDir = '../riverwatcher-data/data'] = process.argv.slice(2)
if (!riversDir || !blDir) throw new Error('Usage: npm run gauges <Open Rivers data folder> <Boundary-Line folder> [<data folder>]')

/** A gauge must have sent a reading in the last week to be listed. */
const REPORTING_DAYS = 7
const now = new Date()

/** Gauges whose two positions disagree, where neither sits on its river in OS Open Rivers,
 *  decided by hand (none yet: see the review's section 10). */
const ARCHIVE_POSITION = new Set<string>([])

/** Gauges whose archive record carries on under a newer station, checked by hand. Twyford
 *  on the Loddon (2490TH): the archive's "Twyford" (1994 to 2011, suspended) was replaced by
 *  "Twyford Main" (2490_w1TH, from September 2010), whose 15-minute readings equal the live
 *  gauge's (October 8th 2026). The two don't agree where they overlap (8 to 24 cm apart), so
 *  they aren't joined; the newer one is used alone (John, October 31st). */
const ARCHIVE_INSTEAD: Record<string, string> = {
  '2490TH': '1f60373d-2b3c-4c41-b4be-0950dd97e068_w1TH',
  // Scots Float Sluice has a gauge on each side. The archive's "Scots Float" carries E6380's
  // reference, but its readings are E6381's (1.137 m at 9.30am on October 15th 2026, both).
  E6381: '13d51399-dfb4-4a26-bfd9-10f6fbbdcbb6',
}

/** Matches that turned out to be different gauges, checked by hand. "BARNWELL FSR WITS"
 *  (E4816, Nene) reads about 32.6 m; the archive's "Lower Barnwell upstream", 3.6 km away,
 *  read 21.4 m when it stopped in 2019. "SCOTS FLOAT SLUICE RL" (E6380): 0.077 m live against
 *  the archive's 1.137 m at the same moment; that record is the other side of the sluice,
 *  E6381 (both October 31st). */
const ARCHIVE_REFUSED = new Set(['E4816', 'E6380'])
const LIVE_POSITION = new Set<string>([])

async function cached<T>(name: string, url: string): Promise<T> {
  const dir = process.env.RW_CACHE
  const file = dir ? join(dir, name) : null
  if (file && existsSync(file)) return JSON.parse(readFileSync(file, 'utf8')) as T
  const body = await getJson<T>(url)
  if (!body) throw new Error(`${url}: not found`)
  if (file) writeFileSync(file, JSON.stringify(body))
  return body
}

type Reading = { measure: string; dateTime: string; value: unknown }
type ArchiveStation = {
  notation: string; label?: string | string[]; riverName?: string | string[]; wiskiID?: string | string[]; stationReference?: string | string[]
  dateOpened?: string; dataQualityMessage?: string; measures?: { '@id': string }[]
  lat?: number; long?: number; easting?: number; northing?: number
}
const one = (x: unknown) => (Array.isArray(x) ? String(x[0]) : x == null ? undefined : String(x))

console.log('Asking the EA for its station lists…')
const [stations, latest, archive] = await Promise.all([
  cached<{ items: Station[] }>('stations.json', `${FM}/id/stations?_view=full&_limit=10000`),
  cached<{ items: Reading[] }>('latest.json', `${FM}/data/readings?latest&_limit=20000`),
  cached<{ items: ArchiveStation[] }>('archive.json', `${HY}/id/stations?observedProperty=waterLevel&_limit=10000`),
])
const latestBy = new Map<string, Reading>()
for (const r of latest.items) latestBy.set(lastPart(r.measure), r)
const latestAt = (m: string) => { const r = latestBy.get(m); return r ? Date.parse(r.dateTime) : undefined }

// An archive station counts only with both daily highest and lowest levels.
const archiveBy = new Map<string, ArchiveStation>()
for (const a of archive.items) {
  const ms = list(a.measures).map((m) => lastPart(m['@id']))
  if (!ms.some((m) => m.endsWith('-level-max-86400-m-qualified')) || !ms.some((m) => m.endsWith('-level-min-86400-m-qualified'))) continue
  for (const k of [...list(a.wiskiID), ...list(a.stationReference)]) if (!archiveBy.has(String(k))) archiveBy.set(String(k), a)
}

console.log('Reading OS Open Rivers and Boundary-Line…')
const net = readNetwork(riversDir, coastIndex(readLines(join(blDir, 'Data/GB/high_water_polyline'))))
const areas = readAreas(blDir)

type Built = {
  ref: string; label: string; name: string; river: string | null; riverFrom: 'ea' | 'archive' | 'os' | null
  lat: number; long: number; e: number; n: number; measure: string; unit: string; latestAt: string
  archive: string | null; archiveNote: string | null; rloi: string | null; downstream: boolean
  typical: [number, number] | null; opened: string | null
  at: Place | null
}
const leftOut: { ref: string; name: string; why: string }[] = []
const refused: { name: string; archive: string; km: number }[] = []
const moved: { name: string; river: string | null; km: number; used: 'live' | 'archive'; sure: boolean }[] = []
let built: Built[] = []
let riverStations = 0
for (const s of stations.items) {
  const m = riverMeasure(s, latestAt)
  if (!m) continue
  riverStations++
  const label = one(s.label) ?? s.stationReference
  if (typeof s.lat !== 'number' || typeof s.long !== 'number' || typeof s.easting !== 'number' || typeof s.northing !== 'number') {
    leftOut.push({ ref: s.stationReference, name: label, why: 'no position in the EA list' })
    continue
  }
  const measure = lastPart(m['@id'])
  const at = latestAt(measure)
  if (at === undefined || now.getTime() - at > REPORTING_DAYS * 86400e3) {
    leftOut.push({ ref: s.stationReference, name: label, why: at === undefined ? 'no reading at all' : `no reading since ${new Date(at).toISOString().slice(0, 10)}` })
    continue
  }
  const instead = ARCHIVE_INSTEAD[s.stationReference]
  let a = (instead ? archive.items.find((x) => x.notation === instead) : undefined) ?? archiveBy.get(String(s.wiskiID)) ?? archiveBy.get(s.stationReference) ?? null
  let pos = { lat: s.lat, long: s.long, e: s.easting, n: s.northing }
  if (a && ARCHIVE_REFUSED.has(s.stationReference)) {
    refused.push({ name: label, archive: one(a.label) ?? '', km: typeof a.easting === 'number' ? metres({ e: s.easting, n: s.northing }, { e: a.easting, n: a.northing! }) / 1000 : 0 })
    a = null
  }
  if (a && typeof a.easting === 'number' && typeof a.northing === 'number') {
    const apart = metres({ e: s.easting, n: s.northing }, { e: a.easting, n: a.northing })
    if (apart > ARCHIVE_NEAR_M) {
      const aLabel = one(a.label) ?? ''
      if (!namesAgree(label, aLabel)) {
        refused.push({ name: label, archive: aLabel, km: apart / 1000 })
        a = null
      } else {
        // The same gauge, but the two lists put it in different places: take the one on the
        // gauge's own river, if only one of them is.
        const river = one(s.riverName) ?? one(a.riverName) ?? null
        const onRiver = (e: number, n: number) => { const pl = place(net, e, n, river); return !!(pl && river && normRiver(pl.link) === normRiver(river)) }
        const liveOk = onRiver(s.easting, s.northing), archOk = onRiver(a.easting, a.northing)
        const useArchive = (archOk && !liveOk) || ARCHIVE_POSITION.has(s.stationReference)
        if (useArchive) pos = { lat: a.lat!, long: a.long!, e: a.easting, n: a.northing }
        moved.push({ name: label, river, km: apart / 1000, used: useArchive ? 'archive' : 'live', sure: liveOk !== archOk || ARCHIVE_POSITION.has(s.stationReference) || LIVE_POSITION.has(s.stationReference) })
      }
    }
  }
  const sc = s.stageScale && typeof s.stageScale === 'object' ? (s.stageScale as Record<string, unknown>) : null
  const lo = sc?.typicalRangeLow, hi = sc?.typicalRangeHigh
  const r0 = riverName(s.riverName, one(a?.riverName), undefined)
  built.push({
    ref: s.stationReference, label, name: shownName(label, one(a?.label) ?? null), river: r0.river, riverFrom: r0.from,
    lat: pos.lat, long: pos.long, e: pos.e, n: pos.n, measure, unit: m.unitName!, latestAt: new Date(at).toISOString(),
    archive: a ? a.notation : null, archiveNote: a?.dataQualityMessage ?? null, rloi: one(s.RLOIid) ?? null, downstream: hasDownstream(s),
    typical: typeof lo === 'number' && typeof hi === 'number' && hi > lo ? [lo, hi] : null,
    opened: s.dateOpened ?? one(a?.dateOpened) ?? null,
    at: null,
  })
}
const reporting = built.length

// Backups go first (SPEC §3.2).
const backups = built.filter((g) => isBackup(g.label))
built = built.filter((g) => !isBackup(g.label))

// Places along the rivers; a gauge with no river name takes Open Rivers' name for its stretch.
for (const g of built) {
  g.at = place(net, g.e, g.n, g.river)
  if (!g.river) {
    const r = riverName(undefined, undefined, g.at?.link)
    g.river = r.river
    g.riverFrom = r.from
  }
}

const dupes = dropNearDuplicates(built)
built = dupes.kept

// Held by a structure.
const systems = new Map<string, number>()
const systemOf = (outlet: string | null) => {
  if (!outlet) return null
  if (!systems.has(outlet)) systems.set(outlet, systems.size + 1)
  return systems.get(outlet)!
}
const heads = navigationHeads(built.map((g) => ({ name: g.name, river: g.river, outlet: g.at?.outlet ?? null, toSeaKm: g.at?.toSeaKm ?? null })))

const out = built
  .map((g) => {
    const area = areaOf(areas, g.e, g.n)
    const head = g.river && g.at ? heads.get(riverKey(g.river, g.at.outlet))?.toSeaKm : undefined
    const held: HeldReason | null = heldReason({ name: `${g.name} ${g.label}`, river: g.river, county: area.county, long: g.long, form: g.at?.form ?? null, toSeaKm: g.at?.toSeaKm ?? null }, head)
    return {
      ref: g.ref,
      name: g.name,
      ...(g.name !== g.label ? { label: g.label } : {}),
      river: g.river,
      riverFrom: g.riverFrom,
      lat: g.lat, long: g.long, e: Math.round(g.e), n: Math.round(g.n),
      measure: g.measure, unit: g.unit,
      archive: g.archive,
      rloi: g.rloi,
      typical: g.typical,
      held,
      downstream: g.downstream,
      lake: isLake(g.river, g.name, g.at?.form ?? null),
      county: area.county, region: area.region,
      toSeaKm: g.at?.toSeaKm ?? null,
      system: systemOf(g.at?.outlet ?? null),
      joins: g.at?.joins ?? null,
      snapM: g.at?.snapM ?? null,
      opened: g.opened,
    }
  })
  .sort((a, b) => a.ref.localeCompare(b.ref))

mkdirSync(dataDir, { recursive: true })
writeFileSync(join(dataDir, 'gauges.json'), JSON.stringify({
  note: 'River gauges in and near England (Riverwatcher, scripts/build-gauges.ts). ref: the EA station reference; measure: its level measure; archive: the Hydrology archive station with daily highest and lowest levels, if any; typical: the EA\'s typical range (all year); held: why its level is held (name, canal, drain, thames, navigation), or null; downstream: it also has a downstream level; toSeaKm: distance to the sea along the river (OS Open Rivers); system: rivers with the same number flow out at the same place; joins: the river it flows into, and where (distance to the sea); e, n: British National Grid metres.',
  made: now.toISOString(),
  credits: [
    'This uses Environment Agency flood and river level data from the real-time data API (Beta).',
    'Contains OS data © Crown Copyright and database rights 2026.',
  ],
  gauges: out,
}) + '\n')

// ---- the review for John ----
const lines: string[] = []
const p = (s = '') => lines.push(s)
const n = (k: number) => k.toLocaleString('en-GB')
const row = (cells: (string | number | null | undefined)[]) => `| ${cells.map((c) => String(c ?? '').replace(/\|/g, '/')).join(' | ')} |`
const date = now.toLocaleDateString('en-GB', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Europe/London' })

p('# Riverwatcher: the gauge list, for review')
p()
p(`Made by \`npm run gauges\` on ${date}, from the Environment Agency's live station list and archive, OS Open Rivers and OS Boundary-Line. The list itself is \`data/gauges.json\` in \`JohnBaish/riverwatcher-data\`.`)
p()
p('## In numbers')
p()
const withArchive = out.filter((g) => g.archive).length
const withTypical = out.filter((g) => !g.archive && g.typical).length
const levelOnly = out.filter((g) => !g.archive && !g.typical)
p(`1. **${n(riverStations)}** EA stations are river gauges by SPEC §3.1 (no tidal or groundwater measure; a "Stage" level in m, mASD or mAOD).`)
p(`2. **${n(reporting)}** of them sent a reading in the last ${REPORTING_DAYS} days; ${n(leftOut.length)} are left out (section 9).`)
p(`3. **${n(backups.length)}** backups and **${n(dupes.dropped.length)}** near-duplicates left out (section 8), leaving **${n(out.length)}** gauges.`)
p(`4. **${n(withArchive)}** have daily history in the archive; ${n(withTypical)} more have only the EA's all-year typical range; **${n(levelOnly.length)}** have neither, so Riverwatcher could show their level but not whether it's high or low (section 6).`)
p(`5. **${n(out.filter((g) => g.held).length)}** are held by a lock or weir (section 2); **${n(out.filter((g) => g.lake).length)}** are on lakes or reservoirs (section 5).`)
p(`6. **${n(out.filter((g) => g.toSeaKm !== null).length)}** are placed on OS Open Rivers; ${n(out.filter((g) => g.toSeaKm === null).length)} aren't within ${600} m of a river (section 4).`)
p(`7. **${n(out.filter((g) => g.county).length)}** are in England; ${n(out.filter((g) => !g.county).length)} are just over the border or out to sea (section 7).`)
p()

p('## 1. Names')
p()
const renamed = out.filter((g) => g.label)
p(`The EA gives ${n(renamed.length)} gauges' names in capitals, usually with a site code ("GS", "WITS", "RL"). Where the archive has a plain name for the same gauge, that's used ("RIVER KENNET AT THEALE" is "Theale"); otherwise the name is put in ordinary capitals and the codes dropped. A sample:`)
p()
p(row(['EA name', 'Shown as', 'River']))
p(row(['---', '---', '---']))
for (const g of renamed.filter((_, i) => i % Math.max(1, Math.floor(renamed.length / 40)) === 0).slice(0, 40)) p(row([g.label, g.name, g.river]))
p()
const noRiver = out.filter((g) => !g.river)
const osRiver = out.filter((g) => g.riverFrom === 'os')
const archiveRiver = out.filter((g) => g.riverFrom === 'archive')
p(`**River names.** ${n(out.filter((g) => g.riverFrom === 'ea').length)} come from the EA's live list, ${n(archiveRiver.length)} from the archive, ${n(osRiver.length)} from OS Open Rivers (the nearest named stretch), and **${n(noRiver.length)} have none** (all below).`)
p()
if (noRiver.length) {
  p(row(['Gauge', 'EA name', 'County', 'Nearest stretch (m)']))
  p(row(['---', '---', '---', '---']))
  for (const g of noRiver) p(row([g.name, g.label ?? '', g.county, g.snapM]))
  p()
}

p('## 2. Held by a lock or weir')
p()
const reasons: Record<HeldReason, string> = {
  name: 'Named after a lock, weir, sluice, mill, gate or staunch',
  canal: 'On a canal or navigation',
  drain: 'On a fen drain, rhyne or similar, in the drained lowlands (John, October 31st)',
  thames: 'On the non-tidal Thames below Lechlade',
  navigation: 'On a navigation, from its head down',
}
p('A gauge counts as held for the first of these that applies:')
p()
for (const [k, v] of Object.entries(reasons)) p(`- **${v}:** ${n(out.filter((g) => g.held === k).length)}`)
p()
p(`A gauge with a downstream level as well isn't held on that account alone (a change from SPEC §3.4: many are gauging weirs or culverts, where the level follows the flow): ${n(out.filter((g) => g.downstream && !g.held).length)} such gauges aren't held.`)
p()
p('**Navigations** (from a list of navigable rivers checked by Claude; each is held from its head down: a named gauge where the navigation starts, otherwise the highest gauge named after a lock, staunch or sluice):')
p()
p(row(['River', 'Head', 'Km to the sea', 'Gauges held from there down']))
p(row(['---', '---', '---', '---']))
const headRows = [...heads.entries()].map(([key, h]) => {
  const [riverLower, outlet] = key.split('|')
  const system = systems.get(outlet) ?? null
  const river = out.find((g) => navName(g.river) === riverLower && g.system === system)?.river ?? riverLower
  const inReach = out.filter((g) => g.held && g.system === system && navName(g.river) === riverLower && g.toSeaKm !== null && g.toSeaKm <= h.toSeaKm + 0.2).length
  return { river, h, inReach }
}).sort((a, b) => a.river.localeCompare(b.river))
for (const r of headRows) p(row([r.river, r.h.gauge, r.h.toSeaKm.toFixed(1), r.inReach]))
p()
p('Every held gauge, by river:')
p()
const heldByRiver = new Map<string, typeof out>()
for (const g of out.filter((x) => x.held)) heldByRiver.set(g.river ?? '(no river name)', [...(heldByRiver.get(g.river ?? '(no river name)') ?? []), g])
for (const [river, gs] of [...heldByRiver].sort(([a], [b]) => a.localeCompare(b))) {
  p(`- **${river}:** ${gs.sort((a, b) => (b.toSeaKm ?? 0) - (a.toSeaKm ?? 0)).map((g) => `${g.name} (${g.held})`).join(', ')}`)
}
p()

{
  const drainWord = out.filter((g) => DRAIN_NAME.test(g.river ?? ''))
  p(`**Drains.** A drainage word in the river's name (drain, rhyne, lode, delph, eau, dyke, dike, catchwater) counts only in ${DRAINED_COUNTIES.join(', ')}. Held as drains: ${n(out.filter((g) => g.held === 'drain').length)}. Not held, being elsewhere (usually streams, or urban drains):`)
  p()
  p(drainWord.filter((g) => !isDrain(g.river, g.county)).map((g) => `${g.name} (${g.river}, ${g.county ?? 'outside England'})${g.held ? `, held by its ${g.held}` : ''}`).join('; ') + '.')
}
p()

p('## 3. Rivers joining')
p()
p('A check on OS Open Rivers: each tributary should join the river it really joins. A sample of the biggest:')
p()
const joinCount = new Map<string, number>()
for (const g of out) if (g.joins) joinCount.set(`${g.river} → ${g.joins.river}`, (joinCount.get(`${g.river} → ${g.joins.river}`) ?? 0) + 1)
p(row(['River → joins', 'Gauges']))
p(row(['---', '---']))
for (const [k, v] of [...joinCount].sort((a, b) => b[1] - a[1]).slice(0, 40)) p(row([k, v]))
p()
const mismatch = out.filter((g) => g.river && g.riverFrom !== 'os' && g.toSeaKm !== null && (() => {
  const pl = place(net, g.e, g.n, g.river)
  return pl && pl.link && pl.link.toLowerCase().replace(/\briver\b/g, '').trim() !== g.river!.toLowerCase().replace(/\briver\b/g, '').trim()
})())
p(`**${n(mismatch.length)} gauges sit on a stretch with a different name from the EA's river name** (often a mill stream, a side channel or a small tributary just beside the main river; the EA's name is kept). The first 40:`)
p()
p(row(['Gauge', "EA's river", 'Stretch it sits on', 'Metres']))
p(row(['---', '---', '---', '---']))
for (const g of mismatch.slice(0, 40)) {
  const pl = place(net, g.e, g.n, g.river)!
  p(row([g.name, g.river, pl.link, pl.snapM]))
}
p()

const pieces = new Map<string, Set<number>>()
for (const g of out) if (g.river && g.system !== null && g.county) pieces.set(`${g.river}|${g.county}`, (pieces.get(`${g.river}|${g.county}`) ?? new Set()).add(g.system))
const split = [...pieces].filter(([, v]) => v.size > 1).map(([k]) => k.split('|'))
p(`**Rivers in more than one piece.** OS Open Rivers has gaps that couldn't be joined up, so these rivers' gauges (in the same county) are in separate pieces and won't be put in order across the gap. ${n(split.length)} cases (some are really two rivers with one name):`)
p()
p(split.map(([r, c]) => `${r} (${c})`).join('; ') + '.')
p()

p('## 4. Far from any river')
p()
const far = out.filter((g) => g.toSeaKm === null)
p(`${n(far.length)} gauges have no OS Open Rivers stretch within 600 m, so they can't be put in river order (they'd be listed after the others):`)
p()
p(row(['Gauge', 'River', 'County']))
p(row(['---', '---', '---']))
for (const g of far) p(row([g.name, g.river, g.county]))
p()

p('## 5. Lakes and reservoirs')
p()
p(row(['Gauge', 'River or lake', 'County']))
p(row(['---', '---', '---']))
for (const g of out.filter((x) => x.lake)) p(row([g.name, g.river, g.county]))
p()

p('## 6. No history and no typical range')
p()
p(`${n(levelOnly.length)} gauges have neither archive history nor an EA typical range. Most are the EA's operational sites, not on GOV.UK's Check for flooding. **For John:** list them with their level only, or leave them out of the nearest five unless there's nothing else? By county:`)
p()
const levelByCounty = new Map<string, number>()
for (const g of levelOnly) levelByCounty.set(g.county ?? '(outside England)', (levelByCounty.get(g.county ?? '(outside England)') ?? 0) + 1)
p([...levelByCounty].sort((a, b) => b[1] - a[1]).map(([c, k]) => `${c} ${k}`).join(', ') + '.')
p()

p('## 7. Outside England')
p()
p(row(['Gauge', 'River', 'Latitude, longitude']))
p(row(['---', '---', '---']))
for (const g of out.filter((x) => !x.county)) p(row([g.name, g.river, `${g.lat.toFixed(3)}, ${g.long.toFixed(3)}`]))
p()

p('## 8. Backups and near-duplicates left out')
p()
p(row(['Left out', 'Kept instead', 'Metres apart']))
p(row(['---', '---', '---']))
for (const b of backups) p(row([b.label, '(a backup)', '']))
for (const d of dupes.dropped) p(row([d.gauge.name, d.for.name, d.metres]))
p()

p('## 9. Not reporting')
p()
p(row(['Gauge', 'Why']))
p(row(['---', '---']))
for (const l of leftOut.sort((a, b) => a.why.localeCompare(b.why))) p(row([l.name, l.why]))
p()

p('## 10. Archive matches')
p()
p(`An archive station counts as the same gauge when it's within ${ARCHIVE_NEAR_M / 1000} km, or further away but with the same name. **Refused** (different names, more than ${ARCHIVE_NEAR_M / 1000} km apart), so these gauges have no history:`)
p()
p(row(['Live gauge', 'Archive station', 'Km apart']))
p(row(['---', '---', '---']))
for (const r of refused) p(row([r.name, r.archive, r.km.toFixed(1)]))
p()
p('**Same name, different places.** The position used is the one on the gauge\'s own river in OS Open Rivers; "not sure" means neither or both are, so the live position is used:')
p()
p(row(['Gauge', 'River', 'Km apart', 'Position used', '']))
p(row(['---', '---', '---', '---', '---']))
for (const m of moved.sort((a, b) => b.km - a.km)) p(row([m.name, m.river, m.km.toFixed(1), m.used, m.sure ? '' : 'not sure']))
p()

p('## 11. What each gauge has')
p()
const histFile = join(dataDir, 'history', 'index.json')
type HistEntry = { status: 'ok' | 'short' | 'failed'; fromYear?: number; lastDay?: string; note?: string }
const hist: Record<string, HistEntry> | null = existsSync(histFile) ? JSON.parse(readFileSync(histFile, 'utf8')).gauges : null
if (!hist) {
  p('The history download (`npm run history`) hasn\'t been run yet, so this section only gives what the list itself says.')
  p()
}
{
  const kinds = new Map<string, string[]>()
  const add = (k: string, name: string) => kinds.set(k, [...(kinds.get(k) ?? []), name])
  for (const g of out) {
    const h = hist?.[g.ref]
    if (g.archive && h?.status === 'ok') add('History for the time of year', g.name)
    else if (g.archive && h?.status === 'short') add(g.typical ? 'Archive history too short (less than three years): the EA\'s typical range instead' : 'Archive history too short, and no typical range: the level only', g.name)
    else if (g.archive && h?.status === 'failed') add('Archive download failed (to try again)', g.name)
    else if (g.archive && !h) add('Archive history, not yet downloaded', g.name)
    else if (g.typical) add('No archive history: the EA\'s typical range', g.name)
    else add('Neither: the level only', g.name)
  }
  p(row(['What it has', 'Gauges']))
  p(row(['---', '---']))
  for (const [k, v] of kinds) p(row([k, v.length]))
  p()
  if (hist) {
    const old = out.filter((g) => hist[g.ref]?.status === 'ok' && hist[g.ref].lastDay! < `${now.getUTCFullYear() - 2}`)
    p(`**Old history.** ${n(old.length)} gauges' archive records (daily figures and 15-minute readings) stop more than two years ago, so their "time of year" rests on the years before. Decided (John, October 31st): they say "History incomplete" and name the gap.`)
    p()
    p(row(['Gauge', 'River', 'Record', 'Last day']))
    p(row(['---', '---', '---', '---']))
    for (const g of old.sort((a, b) => (hist[a.ref].lastDay! < hist[b.ref].lastDay! ? -1 : 1))) p(row([g.name, g.river, hist[g.ref].fromYear, hist[g.ref].lastDay]))
    p()
    const failedList = out.filter((g) => hist[g.ref]?.status === 'failed')
    if (failedList.length) {
      p('**Failed downloads:**')
      p()
      for (const g of failedList) p(`- ${g.name}: ${hist[g.ref].note}`)
      p()
    }
  }
}

p('## 12. Archive notes')
p()
const notes = built.filter((g) => g.archiveNote)
p(`The archive carries a note on ${n(notes.length)} of these gauges:`)
p()
const noteCount = new Map<string, number>()
for (const g of notes) noteCount.set(g.archiveNote!, (noteCount.get(g.archiveNote!) ?? 0) + 1)
for (const [k, v] of [...noteCount].sort((a, b) => b[1] - a[1])) p(`- "${k}" (${v})`)
p()

writeFileSync('design/gauge-review.md', lines.join('\n'))
console.log(`${out.length} gauges written to ${join(dataDir, 'gauges.json')}; review in design/gauge-review.md.`)
