// `npm run fill-days [<data folder>]`
//
// Fills in the day files' usual levels where the archive's daily figures left a gap (fresh
// look 2.2, John, November 2nd 2026). The archive's daily lowest level is missing for far more
// gauges than its highest (November 2nd 2025: highest for 2,014 gauges, lowest for 1,279), and a
// day's usual level needs both, so "a year ago" and the longer charts were missing for most
// gauges. For each gauge with an archive match and days without a usual level, one request
// gets its 15-minute readings over the whole span (at most 40,000, about 416 days), and each
// missing UTC day with at least MIN_DAY_READINGS good readings gets the middle of its highest and
// lowest, as the history's fill does (Suspect and Missing readings left out).
//
// Carries on where it stopped (data/days/fill-days.json lists the gauges done). Three gauges at
// a time, with a pause between. Stops itself after RW_MINUTES (default 330).

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { HY, getText, parseCsv, sleep } from './lib/ea.ts'
import { daysFromReadings } from './lib/days.ts'

const dataDir = process.argv[2] ?? '../riverwatcher-data/data'
const MINUTES = Number(process.env.RW_MINUTES ?? 330)
const PAUSE_MS = Number(process.env.RW_PAUSE_MS ?? 300)
const only = process.env.RW_ONLY?.split(',')
const started = Date.now()
const out = () => (Date.now() - started) / 60000 > MINUTES

type Gauge = { ref: string; archive: string | null }
type DayFile = { date: string; made?: string; from: string[]; gauges: Record<string, { u?: number | null; h?: (number | null)[] }> }
const { gauges } = JSON.parse(readFileSync(join(dataDir, 'gauges.json'), 'utf8')) as { gauges: Gauge[] }
const dir = join(dataDir, 'days')
const dates = readdirSync(dir).filter((f) => /^\d{4}-\d\d-\d\d\.json$/.test(f)).map((f) => f.slice(0, 10)).sort()
const days = new Map<string, DayFile>(dates.map((d) => [d, JSON.parse(readFileSync(join(dir, `${d}.json`), 'utf8')) as DayFile]))
const changed = new Set<string>()

const progressFile = join(dir, 'fill-days.json')
type Progress = { done: string[]; filled: number; failed: number }
const progress: Progress = existsSync(progressFile) ? JSON.parse(readFileSync(progressFile, 'utf8')) : { done: [], filled: 0, failed: 0 }
const doneSet = new Set(progress.done)

function save() {
  for (const d of changed) {
    const f = days.get(d)!
    f.from = [...new Set([...f.from, 'archive-15min'])]
    writeFileSync(join(dir, `${d}.json`), JSON.stringify(f) + '\n')
  }
  changed.clear()
  writeFileSync(progressFile, JSON.stringify(progress) + '\n')
}

// The last three days are left to the collector, which writes them itself.
const older = dates.slice(0, -3)
const missingFor = (ref: string) => older.filter((d) => days.get(d)!.gauges[ref]?.u == null)
const todo = gauges.filter((g) => g.archive && !doneSet.has(g.ref) && (!only || only.includes(g.ref)))
console.log(`${todo.length} gauges to look at, ${dates.length} day files (${dates[0]} to ${dates[dates.length - 1]}).`)

let next = 0, n = 0
await Promise.all([0, 1, 2].map(async () => {
  while (next < todo.length && !out()) {
    const g = todo[next++]
    const missing = missingFor(g.ref)
    try {
      if (missing.length) {
        const t = await getText(`${HY}/id/measures/${g.archive}-level-i-900-m-qualified/readings.csv?mineq-date=${missing[0]}&maxeq-date=${missing[missing.length - 1]}&_limit=40000`)
        await sleep(PAUSE_MS)
        const got = daysFromReadings(t ? parseCsv(t) : [])
        for (const d of missing) {
          const v = got.get(d)
          if (!v) continue
          const f = days.get(d)!
          f.gauges[g.ref] = { ...f.gauges[g.ref], u: Math.round(((v.high + v.low) / 2) * 1000) }
          changed.add(d)
          progress.filled++
        }
      }
      progress.done.push(g.ref)
    } catch {
      progress.failed++
    }
    if (++n % 100 === 0) {
      save()
      console.log(`${n} of ${todo.length}; ${progress.filled} days filled, ${progress.failed} failed; ${((Date.now() - started) / 60000).toFixed(0)} minutes`)
    }
  }
}))
save()
console.log(`Done ${progress.done.length} gauges; ${progress.filled} days filled, ${progress.failed} failed.`)
