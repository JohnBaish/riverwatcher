// `npm run history [<data folder>]`
//
// Each gauge's history file, data/history/<ref>.json in JohnBaish/riverwatcher-data (the
// data folder, by default ../riverwatcher-data/data), from the Hydrology archive's daily
// highest and lowest levels (SPEC §6.4; scripts/lib/history.ts has the rules). Two
// requests per gauge, one at a time with a pause between, so the first full run takes a
// few hours: it runs in GitHub Actions ("Run workflow"). It carries on where it stopped:
// a gauge whose file was made in the last REFRESH_DAYS is skipped. It stops itself after
// RW_MINUTES minutes (default 330), so the workflow can save what's done; run it again to
// carry on. data/history/index.json lists every gauge with archive history and how it went.
//
// Where a gauge's daily figures stop early (at about 275 gauges they stop years before its
// 15-minute readings do), the missing days at the end are worked out from the archive's
// 15-minute readings, a year at a time: each UTC day's highest and lowest (`filledFrom` in
// the index says from when). RW_FILL=1 does only those gauges, even if made recently.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { HY, getText, parseCsv, sleep } from './lib/ea.ts'
import { RECENT_DAYS_LEFT_OUT, buildHistory, joinDays, readDailyCsv } from './lib/history.ts'
import { daysFromReadings } from './lib/days.ts'

const dataDir = process.argv[2] ?? '../riverwatcher-data/data'
const MINUTES = Number(process.env.RW_MINUTES ?? 330)
const PAUSE_MS = Number(process.env.RW_PAUSE_MS ?? 500)
/** A file made more recently than this isn't made again (the monthly top-up, stage 2). */
const REFRESH_DAYS = Number(process.env.RW_REFRESH_DAYS ?? 25)
const started = Date.now()
const today = new Date().toISOString().slice(0, 10)

type Gauge = { ref: string; name: string; archive: string | null }
const { gauges } = JSON.parse(readFileSync(join(dataDir, 'gauges.json'), 'utf8')) as { gauges: Gauge[] }
const dir = join(dataDir, 'history')
mkdirSync(dir, { recursive: true })
const indexFile = join(dir, 'index.json')
type Entry = { status: 'ok' | 'short' | 'failed'; made: string; fromYear?: number; years?: number; lastDay?: string; days?: number; note?: string; filledFrom?: string; filledDays?: number; fillTried?: string }
const index: Record<string, Entry> = existsSync(indexFile) ? JSON.parse(readFileSync(indexFile, 'utf8')).gauges : {}
const fresh = (e: Entry | undefined) => e && e.status !== 'failed' && Date.parse(today) - Date.parse(e.made) < REFRESH_DAYS * 86400e3

// RW_ONLY=<ref,ref> does just those (for trying it out).
const only = process.env.RW_ONLY?.split(',')
const cutoff = new Date(Date.parse(today) - RECENT_DAYS_LEFT_OUT * 86400e3).toISOString().slice(0, 10)
/** Daily figures that stop more than this before the cutoff are filled in. */
const FILL_AFTER_DAYS = 30
const lastDaily = (e: Entry | undefined) => e?.lastDay ?? e?.note?.match(/to (\d{4}-\d\d-\d\d)$/)?.[1]
const needsFill = (e: Entry | undefined) => !!e && e.status !== 'failed' && !e.fillTried && (!lastDaily(e) || Date.parse(cutoff) - Date.parse(lastDaily(e)!) > FILL_AFTER_DAYS * 86400e3)
const fill = process.env.RW_FILL === '1'
const todo = gauges.filter((g) => g.archive && (fill ? needsFill(index[g.ref]) : !fresh(index[g.ref])) && (!only || only.includes(g.ref)))
console.log(`${gauges.filter((g) => g.archive).length} gauges with archive history; ${todo.length} to do.`)

const save = () => writeFileSync(indexFile, JSON.stringify({
  note: 'Each gauge\'s history file (scripts/build-history.ts): ok, short (less than three years of history: no file), or failed (try again). fromYear: the first year of its record; years: years with most of their days; lastDay: the latest day used; days: days with both a highest and lowest level; filledFrom, filledDays: days worked out from the 15-minute readings where the daily figures stop early.',
  made: new Date().toISOString(),
  credit: 'This uses Environment Agency flood and river level data from the real-time data API (Beta).',
  gauges: Object.fromEntries(Object.entries(index).sort(([a], [b]) => a.localeCompare(b))),
}) + '\n')

let done = 0, failed = 0
for (const g of todo) {
  if ((Date.now() - started) / 60000 > MINUTES) {
    console.log(`Stopping after ${MINUTES} minutes; run again to carry on.`)
    break
  }
  try {
    const csv = async (k: 'max' | 'min') => {
      const t = await getText(`${HY}/id/measures/${g.archive}-level-${k}-86400-m-qualified/readings.csv?_limit=200000`)
      await sleep(PAUSE_MS)
      return t === null ? [] : parseCsv(t)
    }
    const highs = readDailyCsv(await csv('max'), Math.max)
    const lows = readDailyCsv(await csv('min'), Math.min)
    // Fill in after the last daily figure from the 15-minute readings, a year at a time.
    const last = [...highs.keys()].filter((d) => lows.has(d)).sort().pop()
    let filledFrom: string | undefined, filledDays = 0, fillTried: string | undefined
    if (!last || Date.parse(cutoff) - Date.parse(last) > FILL_AFTER_DAYS * 86400e3) {
      fillTried = today
      const from = last ? new Date(Date.parse(last) + 86400e3).toISOString().slice(0, 10) : null
      // With no daily figures at all, only the last ten years are tried.
      let y = Number((from ?? `${Number(today.slice(0, 4)) - 10}-01-01`).slice(0, 4))
      for (; y <= Number(cutoff.slice(0, 4)); y++) {
        const a = from && y === Number(from.slice(0, 4)) ? from : `${y}-01-01`
        const b = y === Number(cutoff.slice(0, 4)) ? cutoff : `${y}-12-31`
        if (a > b) continue
        const t = await getText(`${HY}/id/measures/${g.archive}-level-i-900-m-qualified/readings.csv?mineq-date=${a}&maxeq-date=${b}&_limit=40000`)
        await sleep(PAUSE_MS)
        for (const [date, v] of daysFromReadings(t ? parseCsv(t) : [])) {
          if (highs.has(date) && lows.has(date)) continue
          highs.set(date, v.high)
          lows.set(date, v.low)
          filledFrom ??= date
          filledDays++
        }
      }
    }
    const days = joinDays(highs, lows)
    const h = buildHistory(g.ref, g.archive!, days, today, { highs, lows })
    if (h) {
      writeFileSync(join(dir, `${g.ref}.json`), JSON.stringify(h) + '\n')
      index[g.ref] = { status: 'ok', made: today, fromYear: h.fromYear, years: h.years, lastDay: h.lastDay, days: days.length, ...(filledDays ? { filledFrom, filledDays } : {}), ...(fillTried ? { fillTried } : {}) }
    } else {
      index[g.ref] = { status: 'short', made: today, days: days.length, ...(days.length ? { note: `${days[0].date} to ${days[days.length - 1].date}` } : {}), ...(filledDays ? { filledFrom, filledDays } : {}), ...(fillTried ? { fillTried } : {}) }
    }
  } catch (e) {
    failed++
    index[g.ref] = { status: 'failed', made: today, note: (e as Error).message.slice(0, 200) }
  }
  done++
  if (done % 50 === 0) {
    save()
    console.log(`${done} of ${todo.length} (${failed} failed), ${((Date.now() - started) / 60000).toFixed(0)} minutes`)
  }
}
save()
console.log(`Done ${done} of ${todo.length}; ${failed} failed.`)
