// `npm run backfill [<data folder>]`
//
// Fills in the day files before the collector (stage 2) starts making its own (SPEC §6.2,
// §6.5; PLAN stage 1.5): data/days/YYYY-MM-DD.json in JohnBaish/riverwatcher-data, for the
// last 400 days.
//
// 1. Each past day's usual level for every gauge, from the Hydrology archive: one request
//    per date gives every gauge's daily highest and lowest (about 2,000 gauges, a few
//    seconds each). The archive runs about three weeks behind.
// 2. The last four weeks' readings, from the live feed, one request per gauge (about 2,900,
//    with a pause between): each UTC hour's average, and for days the archive doesn't
//    have yet, the usual level (the middle of the day's highest and lowest reading).
//
// A day file: { date, gauges: { <ref>: { u: usual level, h?: [24 hourly averages] } } },
// levels in whole millimetres, hours 0 to 23 UTC (null where there was no reading). A day
// is a UTC day, so a clock-change day needs nothing special. `u` comes from the archive
// where it has the day. Carries on where it stopped: dates already in a file from the
// archive aren't asked again, and the live part is skipped once done
// (data/days/backfill.json). Stops itself after RW_MINUTES (default 330).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { FM, HY, getJson, getText, parseCsv, sleep } from './lib/ea.ts'
import { readDailyCsv } from './lib/history.ts'
import { hourlyAverages, usualOfReadings } from './lib/days.ts'

const dataDir = process.argv[2] ?? '../riverwatcher-data/data'
const MINUTES = Number(process.env.RW_MINUTES ?? 330)
const PAUSE_MS = Number(process.env.RW_PAUSE_MS ?? 300)
const KEEP_DAYS = Number(process.env.RW_KEEP_DAYS ?? 400)
const LIVE_DAYS = 28
const started = Date.now()
const now = new Date()
const out = () => (Date.now() - started) / 60000 > MINUTES

type Gauge = { ref: string; measure: string; archive: string | null }
const { gauges } = JSON.parse(readFileSync(join(dataDir, 'gauges.json'), 'utf8')) as { gauges: Gauge[] }
const byArchive = new Map(gauges.filter((g) => g.archive).map((g) => [g.archive!, g.ref]))
const dir = join(dataDir, 'days')
mkdirSync(dir, { recursive: true })
type DayFile = { date: string; made: string; from: string[]; gauges: Record<string, { u?: number; h?: (number | null)[] }> }
const fileOf = (date: string) => join(dir, `${date}.json`)
const read = (date: string): DayFile | null => (existsSync(fileOf(date)) ? JSON.parse(readFileSync(fileOf(date), 'utf8')) : null)
const write = (d: DayFile) => writeFileSync(fileOf(d.date), JSON.stringify(d) + '\n')
const ymd = (t: number) => new Date(t).toISOString().slice(0, 10)
const mm = (x: number) => Math.round(x * 1000)

// ---- 1. the archive, one date at a time ----
let archiveDays = 0
for (let k = KEEP_DAYS; k >= 1 && !out(); k--) {
  const date = ymd(now.getTime() - k * 86400e3)
  const had = read(date)
  if (had?.from.includes('archive')) continue
  const text = await getText(`${HY}/data/readings.csv?observedProperty=waterLevel&period=86400&date=${date}&_limit=20000`)
  await sleep(PAUSE_MS)
  const rows = text ? parseCsv(text) : []
  const of = (k: 'max' | 'min') => {
    const per = new Map<string, Record<string, string>[]>()
    for (const r of rows) {
      const m = /\/measures\/(.+)-level-(max|min)-86400-m-qualified$/.exec(r.measure ?? '')
      if (!m || m[2] !== k) continue
      const ref = byArchive.get(m[1])
      if (ref) per.set(ref, [...(per.get(ref) ?? []), r])
    }
    return per
  }
  const highs = of('max'), lows = of('min')
  const day: DayFile = had ?? { date, made: now.toISOString(), from: [], gauges: {} }
  let n = 0
  for (const [ref, hr] of highs) {
    const h = readDailyCsv(hr, Math.max).get(date)
    const l = lows.get(ref) && readDailyCsv(lows.get(ref)!, Math.min).get(date)
    if (h === undefined || !l) continue
    day.gauges[ref] = { ...day.gauges[ref], u: mm((h + l) / 2) }
    n++
  }
  // The archive has nothing yet for its last few weeks: those days are left to the live part.
  if (!n) continue
  day.from = [...new Set([...day.from, 'archive'])]
  write(day)
  archiveDays++
}
console.log(`Archive: ${archiveDays} days written.`)

// ---- 2. the last four weeks from the live feed ----
const doneFile = join(dir, 'backfill.json')
if (existsSync(doneFile)) {
  console.log('The live part was done before.')
} else if (!out()) {
  const since = new Date(now.getTime() - LIVE_DAYS * 86400e3).toISOString().slice(0, 19) + 'Z'
  const perDay = new Map<string, Map<string, { h: (number | null)[]; u: number | null }>>()
  let asked = 0, failed = 0
  for (const g of gauges) {
    if (out()) break
    try {
      const body = await getJson<{ items: { dateTime: string; value: unknown }[] }>(`${FM}/id/measures/${g.measure}/readings?since=${since}&_sorted&_limit=10000`)
      const readings = (body?.items ?? []).filter((r) => typeof r.value === 'number').map((r) => [r.dateTime, r.value as number] as [string, number])
      for (const [date, h] of hourlyAverages(readings)) {
        const m = perDay.get(date) ?? new Map()
        m.set(g.ref, { h: h.map((x) => (x === null ? null : mm(x))), u: usualOfReadings(readings, date) })
        perDay.set(date, m)
      }
    } catch { failed++ }
    asked++
    if (asked % 250 === 0) console.log(`Live: ${asked} of ${gauges.length} (${failed} failed)`)
    await sleep(PAUSE_MS)
  }
  if (asked === gauges.length) {
    const today = ymd(now.getTime())
    for (const [date, m] of perDay) {
      if (date >= today) continue // today isn't over
      const day = read(date) ?? { date, made: now.toISOString(), from: [], gauges: {} }
      for (const [ref, v] of m) {
        const had = day.gauges[ref] ?? {}
        day.gauges[ref] = { ...(had.u !== undefined ? { u: had.u } : v.u !== null ? { u: mm(v.u) } : {}), h: v.h }
      }
      day.from = [...new Set([...day.from, 'live'])]
      write(day)
    }
    writeFileSync(doneFile, JSON.stringify({ done: now.toISOString(), gauges: asked, failed, days: perDay.size }) + '\n')
    console.log(`Live: ${asked} gauges asked, ${failed} failed; ${perDay.size} days.`)
  } else console.log(`Live: stopped after ${asked} of ${gauges.length}; run again to do it all.`)
}

