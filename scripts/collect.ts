// `npm run collect [<data folder>] [<state file>]`
//
// The hourly collector (SPEC §5, §6; PLAN stage 2), run by the data repo's Collect workflow,
// started by cron-job.org. Each run:
// 1. every gauge's latest reading (one request), added to its hourly samples (the state file,
//    kept in GitHub's Actions cache between runs, not in git);
// 2. the flood warnings in force (one request, plus one for each flood area not seen before,
//    whose position is kept in data/flood-areas.json);
// 3. data/latest.json: each gauge's latest level and time, its 24-hour average and change, and
//    the flood warnings;
// 4. once a day, after UTC midnight (and each hour after until it's done): yesterday's day file from all of its 15-minute readings
//    (about 38 pages of the EA's bulk list), the flat and stuck gauges from the last four weeks
//    (data/quiet.json), and day files older than 400 days removed;
// 5. a line in data/runs/YYYY-MM.json: what came in, how long it took.
// If the state file is missing (the cache was lost), the 24-hour figures are worked out from
// the day files and fill in again over the next day.

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { FM, getJson, getText, lastPart, parseCsv, sleep } from './lib/ea.ts'
import { hourlyAverages, usualOfReadings } from './lib/days.ts'
import { addSamples, fetchDayRows, flatOrStuck, floodsInForce, isSilent, latestLine, mm, todayHours, readingsByMeasure, type LatestLine, type State } from './lib/collect.ts'

const dataDir = process.argv[2] ?? '../riverwatcher-data/data'
const stateFile = process.argv[3] ?? join(dataDir, '..', 'state', 'recent.json')
const started = Date.now()
const now = new Date()
/** The day file's bulk download stops by this many minutes into the run (and tries again
 *  next hour), so the workflow's own limit can't cut a run short before it saves. */
const DAY_FILE_MINUTES = Number(process.env.RW_DAY_MINUTES ?? 20)
const KEEP_DAYS = 400
const PAGE_ROWS = 10_000
const log: Record<string, unknown> = { at: now.toISOString() }

type Gauge = { ref: string; measure: string; archive: string | null; typical: [number, number] | null }
const { gauges } = JSON.parse(readFileSync(join(dataDir, 'gauges.json'), 'utf8')) as { gauges: Gauge[] }
const byMeasure = new Map(gauges.map((g) => [g.measure, g.ref]))
const ymd = (t: number) => new Date(t).toISOString().slice(0, 10)
const readJson = <T>(f: string, fallback: T): T => (existsSync(f) ? (JSON.parse(readFileSync(f, 'utf8')) as T) : fallback)

// ---- 1. the latest readings ----
const latestBody = await getJson<{ items: { measure: string; dateTime: string; value: unknown }[] }>(`${FM}/data/readings?latest&_limit=20000`)
const latest = new Map<string, { time: string; value: number }>()
for (const r of latestBody?.items ?? []) {
  const ref = byMeasure.get(lastPart(r.measure))
  if (ref && typeof r.value === 'number' && !Number.isNaN(Date.parse(r.dateTime))) latest.set(ref, { time: r.dateTime, value: r.value })
}
let state = readJson<State | null>(stateFile, null)
log.stateFound = !!state
if (!state) {
  // The cache was lost: start again from the last two day files' hourly averages.
  state = { made: now.toISOString(), samples: {} }
  for (const k of [2, 1]) {
    const d = readJson<{ gauges: Record<string, { h?: (number | null)[] }> } | null>(join(dataDir, 'days', `${ymd(now.getTime() - k * 86400e3)}.json`), null)
    for (const [ref, v] of Object.entries(d?.gauges ?? {})) (v.h ?? []).forEach((x, hour) => {
      if (x !== null) state!.samples[ref] = { ...state!.samples[ref], [`${ymd(now.getTime() - k * 86400e3)}T${String(hour).padStart(2, '0')}`]: x }
    })
  }
}
state = addSamples(state, latest, now)
mkdirSync(dirname(stateFile), { recursive: true })
writeFileSync(stateFile, JSON.stringify(state))

// ---- 2. flood warnings ----
const areasFile = join(dataDir, 'flood-areas.json')
const areas = readJson<Record<string, [number, number]>>(areasFile, {})
const floodItems = (await getJson<{ items: Parameters<typeof floodsInForce>[0] }>(`${FM}/id/floods`))?.items ?? []
let newAreas = 0
for (const f of floodItems) {
  if (!f.floodAreaID || areas[f.floodAreaID] || (f.severityLevel ?? 9) > 3) continue
  const a = await getJson<{ items: { lat?: number; long?: number } }>(`${FM}/id/floodAreas/${f.floodAreaID}`)
  if (typeof a?.items?.lat === 'number' && typeof a.items.long === 'number') { areas[f.floodAreaID] = [a.items.lat, a.items.long]; newAreas++ }
  await sleep(300)
}
if (newAreas) writeFileSync(areasFile, JSON.stringify(areas) + '\n')
const floods = floodsInForce(floodItems, areas)

// ---- 3. latest.json ----
const lines: Record<string, LatestLine> = {}
let silent = 0
for (const g of gauges) {
  const line = latestLine(state.samples[g.ref], latest.get(g.ref), now)
  if (line) lines[g.ref] = line
  if (isSilent(latest.get(g.ref)?.time, now)) silent++
}
writeFileSync(join(dataDir, 'latest.json'), JSON.stringify({
  note: 'Each gauge\'s latest reading (Riverwatcher, scripts/collect.ts): [level mm, minutes between the reading and made, average of the last 24 hours mm, change in 24 hours mm]. Levels in whole millimetres above the gauge\'s own zero. floods: warnings in force (level 1 severe, 2 warning, 3 alert).',
  made: now.toISOString(),
  credit: 'This uses Environment Agency flood and river level data from the real-time data API (Beta).',
  gauges: lines,
  floods,
}) + '\n')
Object.assign(log, { readings: latest.size, gauges: Object.keys(lines).length, silent, floods: floods.length, newAreas })

// ---- 3a. today.json: today's hours so far, for the charts (one line per gauge) ----
const today = ymd(now.getTime())
const todayLines = gauges.map((g) => [g.ref, todayHours(state!.samples[g.ref], today, now.getUTCHours() + 1)] as const).filter(([, h]) => h.some((x) => x !== null))
writeFileSync(join(dataDir, 'today.json'), `{"note":"Today's hours so far (UTC): each gauge's sample for each hour, mm (scripts/collect.ts). Replaced by the day file after midnight.","date":"${today}","made":"${now.toISOString()}","gauges":{\n${todayLines.map(([ref, h]) => `${JSON.stringify(ref)}:${JSON.stringify(h)}`).join(',\n')}\n}}\n`)

// ---- 4. once a day (and each hour after, until it's done): yesterday's day file ----
const daysDir = join(dataDir, 'days')
mkdirSync(daysDir, { recursive: true })
const yesterday = ymd(now.getTime() - 86400e3)
type DayFile = { date: string; made: string; from: string[]; gauges: Record<string, { u?: number; h?: (number | null)[] }> }
const yFile = join(daysDir, `${yesterday}.json`)
const yDay = readJson<DayFile | null>(yFile, null)
if (!yDay?.from.includes('collector')) {
  // Each page is tried up to four times (waits of 5, 10 and 15 seconds; at most about 8½
  // minutes, so a page started just before DAY_FILE_MINUTES still ends inside the workflow's
  // 30); if one still fails, the day file waits for the next hour's run and this run
  // finishes normally.
  const { rows, pages, finished, stopped } = await fetchDayRows(
    (offset) => getText(`${FM}/data/readings.csv?parameter=level&startdate=${yesterday}&enddate=${yesterday}&_limit=${PAGE_ROWS}&_offset=${offset}`, 4),
    parseCsv, PAGE_ROWS, () => (Date.now() - started) / 60000 < DAY_FILE_MINUTES, () => sleep(500))
  log.dayFile = { date: yesterday, pages, rows: rows.length, finished, ...(stopped ? { stopped } : {}) }
  if (!finished) console.log(`::warning::The day file for ${yesterday} isn't finished (${stopped}); the next run will try again.`)
  if (finished) {
    const per = readingsByMeasure(rows, new Set(byMeasure.keys()))
    const day: DayFile = yDay ?? { date: yesterday, made: now.toISOString(), from: [], gauges: {} }
    for (const [measure, readings] of per) {
      const ref = byMeasure.get(measure)!
      const h = hourlyAverages(readings).get(yesterday)
      if (!h) continue
      const u = usualOfReadings(readings, yesterday)
      day.gauges[ref] = { ...(u !== null ? { u: mm(u) } : {}), h: h.map((x) => (x === null ? null : mm(x))) }
    }
    day.made = now.toISOString()
    day.from = [...new Set([...day.from.filter((f) => f !== 'live'), 'collector'])]
    writeFileSync(yFile, JSON.stringify(day) + '\n')

    // Flat or stuck over the last four weeks.
    const hours = new Map<string, number[]>()
    for (let k = 28; k >= 1; k--) {
      const d = readJson<DayFile | null>(join(daysDir, `${ymd(now.getTime() - k * 86400e3)}.json`), null)
      for (const [ref, v] of Object.entries(d?.gauges ?? {})) for (const x of v.h ?? []) if (x !== null) (hours.get(ref) ?? hours.set(ref, []).get(ref)!).push(x)
    }
    const quiet: Record<string, string> = {}
    // Only gauges with neither history nor a typical range (John, October 31st).
    const levelOnly = new Set(gauges.filter((g) => !g.archive && !g.typical).map((g) => g.ref))
    for (const [ref, h] of hours) { if (!levelOnly.has(ref)) continue; const q = flatOrStuck(h); if (q) quiet[ref] = q }
    writeFileSync(join(dataDir, 'quiet.json'), JSON.stringify({
      note: 'Gauges with neither history nor a typical range left out as flat (no change of more than 2 cm in four weeks) or stuck (the same hourly figure more than 90% of the time), from the last 28 day files (SPEC §3.7).',
      made: now.toISOString(), gauges: quiet,
    }) + '\n')
    log.quiet = Object.keys(quiet).length

    // Day files older than KEEP_DAYS go.
    const oldest = ymd(now.getTime() - KEEP_DAYS * 86400e3)
    let removed = 0
    for (const f of readdirSync(daysDir)) if (/^\d{4}-\d\d-\d\d\.json$/.test(f) && f.slice(0, 10) < oldest) { rmSync(join(daysDir, f)); removed++ }
    log.removed = removed
  }
}

// ---- 5. the run log ----
log.seconds = Math.round((Date.now() - started) / 1000)
const runsDir = join(dataDir, 'runs')
mkdirSync(runsDir, { recursive: true })
const runsFile = join(runsDir, `${now.toISOString().slice(0, 7)}.json`)
const runs = readJson<Record<string, unknown>[]>(runsFile, [])
runs.push(log)
writeFileSync(runsFile, JSON.stringify(runs, null, 0).replace(/},{/g, '},\n{') + '\n')
console.log(JSON.stringify(log))
