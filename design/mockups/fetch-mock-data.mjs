// A real snapshot of Environment Agency data for the design mock-ups (step 3). Not the
// collector: a one-off script, run by hand, writing design/mockups/mock-data.json.
//
//   NODE_USE_ENV_PROXY=1 node design/mockups/fetch-mock-data.mjs <outcodes.json> <areas.json>
//
// <outcodes.json> is Lightreader's src/data/outcodes.json (district middles, WGS84);
// <areas.json> is Hindcaster's data/areas.json (each district's ceremonial county).
// A gauge's county here is the county of its nearest district middle: near enough for a
// mock-up, not for the tool (which should place gauges with OS Boundary-Line, as
// Hindcaster's scripts/build-areas.ts does).
//
// Rules (design/data-tests-2026-10-30.md and design/content-answers-2026-10-30.md):
// - a river gauge: no tidal or groundwater measure; a level measure with the qualifier
//   "Stage", in m, mASD or mAOD, with a reading in the last 24 hours;
// - "the usual level" for a day: the middle of that day's highest and lowest level
//   (the archive has no daily average level), from every past year, within a week
//   either side of the same date;
// - the judgement: the average of the last 24 hours against those days: very low (lowest
//   10%), low (10% to 25%), normal, high (75% to 90%), very high (highest 10%).

import { readFileSync, writeFileSync } from 'node:fs'

const [outcodesPath, areasPath] = process.argv.slice(2)
if (!outcodesPath || !areasPath) throw new Error('Usage: fetch-mock-data.mjs <outcodes.json> <areas.json>')
const FM = 'https://environment.data.gov.uk/flood-monitoring'
const HY = 'https://environment.data.gov.uk/hydrology'
const POSTCODES = ['RG4', 'CA12']
const COUNTY = 'Berkshire'
const NEAREST = 5
const WITHIN_MILES = 10
const WARN_MILES = 10
const OK_UNITS = new Set(['m', 'mASD', 'mAOD'])
const now = new Date()

async function json(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url)
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.json()
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`)
      await new Promise((ok) => setTimeout(ok, 2000 * i))
    }
  }
}
const L = (x) => (Array.isArray(x) ? x : x == null ? [] : [x])
const last = (id) => String(id).split('/').pop()
const miles = (a, b) => {
  const r = Math.PI / 180
  const x = (b[1] - a[1]) * r * Math.cos(((a[0] + b[0]) / 2) * r)
  const y = (b[0] - a[0]) * r
  return 3958.8 * Math.hypot(x, y)
}
async function pool(items, n, f) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: n }, async () => {
    while (next < items.length) { const i = next++; out[i] = await f(items[i], i) }
  }))
  return out
}

// ---- the gauges ----
// Held by a lock or weir (locks research, October 30th): named after a structure, or with a
// downstream gauge (a level measured on both sides of something), or on the non-tidal Thames
// below Lechlade, which is one lock reach after another. A first rule, for the mock-ups only:
// other navigations (the Kennet, the Medway, the Great Ouse and more) need a checked list.
function heldByStructure(s, ms) {
  if (/\b(lock|weir|sluice|mill|gate)\b/i.test(String(s.label))) return true
  if (ms.some((m) => m.qualifier === 'Downstream Stage')) return true
  return /^River Thames$/.test(String(s.riverName)) && s.long > -1.69
}
const [stations, latest, archive] = await Promise.all([
  json(`${FM}/id/stations?_view=full&_limit=10000`),
  json(`${FM}/data/readings?latest&_limit=20000`),
  json(`${HY}/id/stations?observedProperty=waterLevel&_limit=10000`),
])
const fresh = new Map()
for (const r of latest.items) {
  if (now - new Date(r.dateTime) < 86400e3) fresh.set(last(r.measure), r)
}
const archiveByRef = new Map()
for (const h of archive.items) for (const k of [...L(h.wiskiID), ...L(h.stationReference)]) archiveByRef.set(k, h)

let gauges = []
for (const s of stations.items) {
  const ms = L(s.measures)
  if (ms.some((m) => m.qualifier === 'Tidal Level' || m.qualifier === 'Groundwater')) continue
  const m = ms.find((m) => m.parameter === 'level' && m.qualifier === 'Stage' && OK_UNITS.has(m.unitName) && fresh.has(last(m['@id'])))
  if (!m || typeof s.lat !== 'number') continue
  const a = archiveByRef.get(s.wiskiID) ?? archiveByRef.get(s.stationReference)
  const sc = s.stageScale && typeof s.stageScale === 'object' ? s.stageScale : null
  gauges.push({
    ref: s.stationReference, name: s.label, river: s.riverName ?? null, town: s.town ?? null,
    lat: s.lat, long: s.long, easting: s.easting, northing: s.northing, measure: last(m['@id']), unit: m.unitName, rloi: s.RLOIid ?? null,
    held: heldByStructure(s, ms),
    archive: a ? a.notation : null,
    typical: sc && sc.typicalRangeLow != null ? [sc.typicalRangeLow, sc.typicalRangeHigh] : null,
  })
}
// Near-duplicates (data tests, finding 4): backups go; of gauges on the same river
// within 100 m, keep one, preferring one with archive history, then the shorter name.
// (300 m merged Caversham Lock into the separate Reading gauge, 290 m away.)
gauges = gauges.filter((g) => !/backup/i.test(g.name))
gauges.sort((a, b) => (!!b.archive - !!a.archive) || a.name.length - b.name.length)
const kept = []
for (const g of gauges) if (!kept.some((k) => k.river === g.river && miles([k.lat, k.long], [g.lat, g.long]) < 100 / 1609.344)) kept.push(g)
gauges = kept
console.log('river gauges', gauges.length)

// ---- places ----
const outcodes = JSON.parse(readFileSync(outcodesPath, 'utf8'))
const districts = outcodes.districts ?? outcodes.outcodes
const areas = JSON.parse(readFileSync(areasPath, 'utf8'))
const countyOfDistrict = (code) => areas.outcodes[code]?.county ?? null
const nearestDistrict = (g) => {
  let best = null
  for (const [code, [la, lo]] of Object.entries(districts)) {
    const d = miles([g.lat, g.long], [la, lo])
    if (!best || d < best.d) best = { code, d }
  }
  return best.code
}
for (const g of gauges) g.county = countyOfDistrict(nearestDistrict(g))

const places = {}
for (const code of POSTCODES) {
  const [la, lo, place] = districts[code]
  const near = gauges.map((g) => ({ g, d: miles([la, lo], [g.lat, g.long]) }))
    .filter((x) => x.d <= WITHIN_MILES).sort((a, b) => a.d - b.d).slice(0, NEAREST)
  const free = near.some((x) => !x.g.held) ? null : gauges.map((g) => ({ g, d: miles([la, lo], [g.lat, g.long]) }))
    .filter((x) => !x.g.held && x.d <= WITHIN_MILES).sort((a, b) => a.d - b.d)[0]
  places[code] = { code, place, lat: la, long: lo, gauges: near.map((x) => ({ ref: x.g.ref, miles: x.d })),
    free: free ? { ref: free.g.ref, miles: free.d } : null }
}
const inCounty = gauges.filter((g) => g.county === COUNTY)

// ---- flood warnings within 10 miles of each place ----
const floods = (await json(`${FM}/id/floods`)).items.filter((f) => f.severityLevel <= 3)
const floodAreas = await pool(floods, 3, (f) => json(`${FM}/id/floodAreas/${f.floodAreaID}`).then((a) => a.items))
for (const p of Object.values(places)) {
  p.warnings = floods.map((f, i) => ({ f, a: floodAreas[i] }))
    .filter(({ a }) => miles([p.lat, p.long], [a.lat, a.long]) <= WARN_MILES)
    .map(({ f }) => ({ severity: f.severity, level: f.severityLevel, area: f.description, raised: f.timeRaised, changed: f.timeMessageChanged, id: f.floodAreaID }))
}

// ---- each gauge's figures ----
const wanted = new Map()
for (const p of Object.values(places)) for (const x of [...p.gauges, ...(p.free ? [p.free] : [])]) wanted.set(x.ref, { charts: true })
for (const g of inCounty) if (!wanted.has(g.ref)) wanted.set(g.ref, { charts: false })
const byRef = new Map(gauges.map((g) => [g.ref, g]))
const ymd = (d) => d.toISOString().slice(0, 10)
const sinceYear = ymd(new Date(now - 366 * 86400e3))
const since4 = new Date(now - 28 * 86400e3).toISOString().slice(0, 19) + 'Z'

async function figures(ref, { charts }) {
  const g = byRef.get(ref)
  const live = (await json(`${FM}/id/measures/${g.measure}/readings?since=${since4}&_sorted&_limit=10000`)).items
    .filter((r) => typeof r.value === 'number').map((r) => [r.dateTime, r.value]).sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const out = { ...g, live: null, history: null, year: null, check: null }
  if (!live.length) return out
  const [lt, lv] = live[live.length - 1]
  const t0 = new Date(lt) - 86400e3
  const day = live.filter(([t]) => new Date(t) > t0).map(([, v]) => v)
  const before = live.filter(([t]) => new Date(t) <= t0).pop()
  out.live = { time: lt, value: lv, mean24: day.reduce((a, b) => a + b, 0) / day.length, change24: before ? lv - before[1] : null }
  if (!g.archive) return out
  const [hi, lo] = await Promise.all(['max', 'min'].map((k) =>
    json(`${HY}/id/measures/${g.archive}-level-${k}-86400-m-qualified/readings?_limit=200000`)
      .then((d) => d.items).catch(() => [])))
  // Not filtered on "completeness": the archive marks almost every day before about 2015
  // "Incomplete", though its highest and lowest are there (older readings were kept less often).
  const good = (r) => typeof r.value === 'number' && r.quality !== 'Suspect' && r.quality !== 'Missing'
  const loBy = new Map(lo.filter(good).map((r) => [r.date, r.value]))
  const days = hi.filter(good).filter((r) => loBy.has(r.date)).map((r) => [r.date, r.value, loBy.get(r.date)])
  out.history = historyStats(days, out.live.mean24)
  if (charts) {
    const y = (await json(`${HY}/id/measures/${g.archive}-level-i-900-m-qualified/readings?mineq-date=${sinceYear}&_limit=200000`)).items
      .filter((r) => typeof r.value === 'number').map((r) => [r.dateTime, r.value])
    // Same datum? The archive's 15-minute level should equal the live reading (data tests, finding 5).
    const liveAt = new Map(live.map(([t, v]) => [t.slice(0, 16), v]))
    const shared = y.filter(([t]) => liveAt.has(t.slice(0, 16)))
    out.check = { shared: shared.length, differ: shared.filter(([t, v]) => Math.abs(v - liveAt.get(t.slice(0, 16))) > 0.0005).length }
    // Hourly averages for the last year (UTC hours), the live readings filling in after the
    // archive; kept as a start hour and one value an hour (null where there's none).
    const all = new Map(y.map(([t, v]) => [t.slice(0, 16), v]))
    for (const [t, v] of live) all.set(t.slice(0, 16), v)
    const hours = new Map()
    for (const [t, v] of all) { const h = t.slice(0, 13); const a = hours.get(h) ?? [0, 0]; a[0] += v; a[1]++; hours.set(h, a) }
    const keys = [...hours.keys()].sort()
    const start = new Date(keys[0] + ':00:00Z')
    const n = Math.round((new Date(keys[keys.length - 1] + ':00:00Z') - start) / 3600e3) + 1
    const values = new Array(n).fill(null)
    for (const [h, [s, c]] of hours) values[Math.round((new Date(h + ':00:00Z') - start) / 3600e3)] = Math.round((s / c) * 1000) / 1000
    out.year = { start: start.toISOString(), values }
  }
  return out
}

// ---- history: the comparisons, worked out here so the mock-up's data stays small ----
const DOY = (date) => { // day of a non-leap year, 0 to 364 (February 29th counts as the 28th)
  const [, m, d] = date.split('-').map(Number)
  const t = Date.UTC(2025, m - 1, m === 2 && d === 29 ? 28 : d)
  return Math.round((t - Date.UTC(2025, 0, 1)) / 86400e3)
}
const near = (a, b) => Math.min(Math.abs(a - b), 365 - Math.abs(a - b)) <= 7
const quant = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
const round3 = (x) => Math.round(x * 1000) / 1000
function historyStats(days, value) {
  // days: [date, highest, lowest]; the usual level of a day is the middle of the two.
  const thisYear = now.getUTCFullYear()
  const past = days.filter(([d]) => Number(d.slice(0, 4)) < thisYear).map(([d, h, l]) => ({ d, y: Number(d.slice(0, 4)), doy: DOY(d), mid: (h + l) / 2, h, l }))
  if (past.length < 365 * 3) return null
  const byDoy = Array.from({ length: 365 }, () => [])
  for (const x of past) byDoy[x.doy].push(x.mid)
  // The usual levels for each day of the year: 10%, 25%, 50%, 75% and 90% of days within a week either side.
  const bands = byDoy.map((_, i) => {
    const v = []
    for (let k = -7; k <= 7; k++) v.push(...byDoy[(i + k + 365) % 365])
    v.sort((a, b) => a - b)
    return v.length ? [0.1, 0.25, 0.5, 0.75, 0.9].map((q) => round3(quant(v, q))) : null
  })
  const today = DOY(now.toISOString().slice(0, 10))
  const win = []
  for (let k = -7; k <= 7; k++) win.push(...byDoy[(today + k + 365) % 365])
  const pct = (v) => (100 * win.filter((x) => x < v).length) / win.length
  const p = pct(value)
  const word = p < 10 ? 'very low' : p < 25 ? 'low' : p <= 75 ? 'normal' : p <= 90 ? 'high' : 'very high'
  // "The highest (lowest) for this time of year since [year]": the latest past year with a
  // day as high (low), within a week either side of today's date.
  let since = null
  if (p > 75 || p < 25) {
    const years = [...new Set(past.map((x) => x.y))].sort((a, b) => b - a)
    const hit = years.find((y) => past.some((x) => x.y === y && near(x.doy, today) && (p > 75 ? x.mid >= value : x.mid <= value)))
    since = { way: p > 75 ? 'highest' : 'lowest', year: hit ?? null }
  }
  // The same day last year (or the nearest day within three), and how it compared then.
  const ly = `${thisYear - 1}${now.toISOString().slice(4, 10)}`
  const cand = past.filter((x) => x.y === thisYear - 1 && Math.abs(DOY(x.d) - DOY(ly)) <= 3).sort((a, b) => Math.abs(DOY(a.d) - DOY(ly)) - Math.abs(DOY(b.d) - DOY(ly)))[0]
  let lastYear = null
  if (cand) {
    const w = []
    for (const x of past) if (x.y !== thisYear - 1 && near(x.doy, cand.doy)) w.push(x.mid)
    const q = (100 * w.filter((x) => x < cand.mid).length) / w.length
    lastYear = { date: cand.d, mid: round3(cand.mid), word: q < 10 ? 'very low' : q < 25 ? 'low' : q <= 75 ? 'normal' : q <= 90 ? 'high' : 'very high' }
  }
  const hi = past.reduce((a, b) => (b.h > a.h ? b : a))
  return {
    from: past[0].d, years: new Set(past.map((x) => x.y)).size, window: win.length,
    pct: Math.round(p), word, since, lastYear,
    record: { value: hi.h, date: hi.d }, bands,
  }
}
const done = await pool([...wanted], 4, async ([ref, opt], i) => {
  const f = await figures(ref, opt)
  process.stdout.write(`\r${i + 1} of ${wanted.size}`)
  return f
})
console.log()
for (const f of done) if (f.check && f.check.differ) console.log('DATUM MISMATCH?', f.ref, f.name, f.check)

writeFileSync(new URL('./mock-data.json', import.meta.url), JSON.stringify({
  note: 'A real snapshot of Environment Agency data for the design mock-ups, made by fetch-mock-data.mjs. Provisional ("Unchecked") figures. Not for the tool itself.',
  made: now.toISOString(),
  credit: 'This uses Environment Agency flood and river level data from the real-time data API (Beta).',
  places, county: { name: COUNTY, gauges: inCounty.map((g) => g.ref) },
  gauges: Object.fromEntries(done.map((f) => [f.ref, f])),
}))
console.log('written', Object.keys(places), inCounty.length, 'in', COUNTY)
