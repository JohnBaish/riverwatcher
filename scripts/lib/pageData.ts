// The page's figures (stage 3), made from the data repo at build time (vite.config.ts) and
// split into parts (src/lib/pageTypes.ts). Every judgement is worked out here with the
// tested rules in history.ts, so the page and `npm run check` agree.
//
// The data folder is RW_DATA, or ../riverwatcher-data/data beside this repo.

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Flood, LatestLine } from './collect.ts'
import type { HeldReason } from './gauges.ts'
import { dayOfYear, judge, levelsFor, metresOf, percentBelow, sinceYear, TABLE_STEP_DAYS, wordFor, type History, type Word } from './history.ts'
import type { PageDaily, PageGauge, PageHours, PageJudgement, PageMeta } from '../../src/lib/pageTypes.ts'

export const dataDir = () => resolve(process.env.RW_DATA ?? resolve(import.meta.dirname, '../../../riverwatcher-data/data'))

type GaugeLine = {
  ref: string; name: string; river: string | null; lat: number; long: number; typical: [number, number] | null
  held: HeldReason | null; lake: boolean; toSeaKm: number | null; joins: { river: string; toSeaKm: number } | null; county: string | null
}
type DayFile = { date: string; gauges: Record<string, { u?: number | null; h?: (number | null)[] }> }

/** The UK date of a moment (YYYY-MM-DD). */
export const ukDate = (iso: string) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date(iso))
const addDays = (date: string, n: number) => new Date(Date.parse(date) + n * 86400e3).toISOString().slice(0, 10)
/** The same date a year earlier (February 29th becomes February 28th). */
export const yearBefore = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return `${y - 1}-${String(m).padStart(2, '0')}-${String(m === 2 && d === 29 ? 28 : d).padStart(2, '0')}`
}

/** Delta-coding: each figure is the change from the previous one present. */
export function deltas(values: (number | null)[]): (number | null)[] {
  let prev: number | null = null
  return values.map((v) => {
    if (v === null) return null
    const out = prev === null ? v : v - prev
    prev = v
    return out
  })
}

/** The table's 10%, 25%, 75% and 90% levels (TABLE_PERCENTS steps 4, 10, 30, 36). */
const bandOf = (row: number[] | null): [number, number, number, number] | null => (row ? [row[4], row[10], row[30], row[36]] : null)

const isHigh = (w: Word | null) => w === 'high' || w === 'very high'
const isLow = (w: Word | null) => w === 'low' || w === 'very low'

/** One gauge's figures for the page. `level` is the average of the last 24 hours (or the
 *  latest reading when there's no average yet), in mm. */
export function pageGauge(g: GaugeLine, line: LatestLine | null, h: History | null, quiet: boolean, date: string, yearAgoLevel: number | null): PageGauge {
  const held = g.held !== null
  const level = line ? (line[2] ?? line[0]) : null
  let j: PageJudgement = { basis: 'none' }
  if (level !== null) {
    const r = judge(metresOf(level), date, h, g.typical, held)
    j = r.basis === 'history' ? { basis: 'history', word: r.word, percent: Math.round(r.percent * 10) / 10 } : r
  }
  const word = j.basis === 'history' ? j.word : null
  const since = h && level !== null && !held && (isHigh(word) || isLow(word))
    ? (() => { const way = isHigh(word) ? 'highest' as const : 'lowest' as const; return { way, year: sinceYear(h, date, metresOf(level), way) ?? 0 } })()
    : null
  let yearAgo: PageGauge['yearAgo'] = null
  if (yearAgoLevel !== null) {
    const then = yearBefore(date)
    const levels = h ? levelsFor(h, dayOfYear(then)) : null
    const w = levels ? wordFor(percentBelow(levels, metresOf(yearAgoLevel))) : null
    // At a held gauge only "high" and "very high" are said (SPEC §4.6).
    yearAgo = { v: yearAgoLevel, word: held && !isHigh(w) ? null : w }
  }
  const rows = h?.table?.filter((r): r is number[] => !!r) ?? []
  const span: [number, number] | null = rows.length
    ? [Math.min(...rows.map((r) => r[4])), Math.max(...rows.map((r) => r[36]))]
    : g.typical ? [Math.round(g.typical[0] * 1000), Math.round(g.typical[1] * 1000)] : null
  return {
    ref: g.ref, name: g.name, river: g.river, lat: g.lat, long: g.long, held: g.held, lake: g.lake,
    toSeaKm: g.toSeaKm, joins: g.joins, county: g.county, quiet,
    now: line ? { v: line[0], age: line[1], mean: line[2], ch: line[3] } : null,
    j, fromYear: h?.fromYear ?? null, since, yearAgo,
    record: h ? { v: h.record.high.value, date: h.record.high.date } : null,
    gaps: h?.gaps ?? [],
    typical: g.typical ? [Math.round(g.typical[0] * 1000), Math.round(g.typical[1] * 1000)] : null,
    span,
  }
}

/** The band a believable level falls in, from what a gauge reads now: its lowest and highest
 *  recent levels widened by LIVE_SPANS times their spread (at least LIVE_MIN_MM). Generous: it
 *  catches a different zero point (metres or tens of metres out), not a flood. */
export const LIVE_SPANS = 4
export const LIVE_MIN_MM = 200
export function liveBand(values: number[]): [number, number] {
  const lo = Math.min(...values), hi = Math.max(...values)
  const span = Math.max(hi - lo, LIVE_MIN_MM)
  return [lo - LIVE_SPANS * span, hi + LIVE_SPANS * span]
}
/** A history fits when the middle of its levels for the time of year lies within the band. */
export function historyFits(h: History, band: [number, number]): boolean {
  const mids = (h.table ?? []).filter((r): r is number[] => !!r).map((r) => r[20])
  if (!mids.length) return true
  const m = mids.sort((a, b) => a - b)[Math.floor(mids.length / 2)]
  return m >= band[0] && m <= band[1]
}
/** Gauges whose history was set aside by `historyFits` in the last build (for the notes). */
export const unfitting: string[] = []

export type PageData = { meta: PageMeta; gauges: PageGauge[]; hours: PageHours; hours42: PageHours; daily: PageDaily }

/** The files the parts are made from, for the plugin to watch. */
export const SOURCES = ['gauges.json', 'latest.json', 'quiet.json', 'today.json']

/** Hourly figures for the charts: two weeks (the default period) in one part, six weeks in
 *  another, loaded only when four or six weeks are chosen. Longer periods use the daily part. */
export const HOURS_DAYS = 14

export function pageData(dir = dataDir()): PageData {
  const read = <T>(f: string): T => JSON.parse(readFileSync(join(dir, f), 'utf8')) as T
  const gauges = read<{ gauges: GaugeLine[] }>('gauges.json').gauges
  const latest = read<{ made: string; gauges: Record<string, LatestLine>; floods?: Flood[] }>('latest.json')
  const quiet = existsSync(join(dir, 'quiet.json')) ? read<{ gauges: Record<string, string> }>('quiet.json').gauges : {}
  const date = ukDate(latest.made)

  const dayFiles = readdirSync(join(dir, 'days')).filter((f) => /^\d{4}-\d\d-\d\d\.json$/.test(f)).sort()
  const day = (d: string): DayFile | null => (dayFiles.includes(`${d}.json`) ? read<DayFile>(join('days', `${d}.json`)) : null)
  const histories = new Map<string, History>()
  for (const g of gauges) {
    const f = join(dir, 'history', `${g.ref}.json`)
    if (existsSync(f)) histories.set(g.ref, JSON.parse(readFileSync(f, 'utf8')) as History)
  }
  // The level each gauge reads now, from the day files with hourly figures (the live feed,
  // always in the gauge's current zero point): the band a figure must fall in to be believed.
  const recent = dayFiles.slice(-42).map((f) => read<DayFile>(join('days', f)))
  const bands = new Map<string, [number, number]>()
  for (const g of gauges) {
    const v = recent.flatMap((f) => f.gauges[g.ref]?.h ?? []).filter((x): x is number => x !== null)
    const line = latest.gauges[g.ref]
    if (line) v.push(line[0])
    if (v.length) bands.set(g.ref, liveBand(v))
  }
  // A history whose levels don't fit what the gauge reads now (the archive and the live feed
  // use different zero points) isn't used: the gauge is judged by its typical range instead.
  for (const [ref, h] of histories) {
    const band = bands.get(ref)
    if (band && !historyFits(h, band)) { histories.delete(ref); unfitting.push(ref) }
  }
  const ago = day(yearBefore(date))
  // A day file's figure outside the band (or outside the history's plausible levels) is left out.
  const fits = (ref: string, v: number | null | undefined): number | null => {
    if (v === null || v === undefined) return null
    const b = histories.get(ref)?.bounds ?? bands.get(ref)
    return b && (v < b[0] || v > b[1]) ? null : v
  }

  const pageGauges = gauges.map((g) =>
    pageGauge(g, latest.gauges[g.ref] ?? null, histories.get(g.ref) ?? null, !!quiet[g.ref], date, fits(g.ref, ago?.gauges[g.ref]?.u)))

  const doy = dayOfYear(date)
  // Today's hours so far (data/today.json, from the collector), after the last day file.
  const todayFile = existsSync(join(dir, 'today.json')) ? read<{ date: string; gauges: Record<string, (number | null)[]> }>('today.json') : null
  const lastDay = dayFiles[dayFiles.length - 1].slice(0, 10)
  const withToday = todayFile && todayFile.date === addDays(lastDay, 1)
  const lastFile = withToday ? todayFile.date : lastDay
  /** The last `n` whole UTC days of hourly figures, and the band steps covering them and a
   *  week either side. */
  const hourPart = (n: number): PageHours => {
    const dates = Array.from({ length: n }, (_, i) => addDays(lastFile, i - n + 1))
    const files = dates.map((d) => (withToday && d === todayFile.date
      ? { date: d, gauges: Object.fromEntries(Object.entries(todayFile.gauges).map(([ref, h]) => [ref, { h: [...h, ...Array<null>(24 - h.length).fill(null)] }])) }
      : day(d) ?? { date: d, gauges: {} }))
    const g: PageHours['g'] = {}
    for (const x of gauges) {
      // A day with no hourly figures (before the collector started, the archive gives only
      // each day's highest and lowest) shows its usual level at midday, so the line carries on.
      const v = files.flatMap((f) => {
        const d = f.gauges[x.ref] as { u?: number | null; h?: (number | null)[] } | undefined
        if (d?.h) return d.h
        const u = Array<number | null>(24).fill(null)
        u[12] = fits(x.ref, d?.u)
        return u
      })
      if (v.some((y) => y !== null)) g[x.ref] = deltas(v)
    }
    const bandFrom = Math.floor((doy - n - 7) / TABLE_STEP_DAYS) * TABLE_STEP_DAYS
    const steps = Array.from({ length: Math.ceil((n + 14) / TABLE_STEP_DAYS) + 2 }, (_, i) => bandFrom + i * TABLE_STEP_DAYS)
    const bands: PageHours['bands'] = {}
    for (const [ref, h] of histories) {
      if (!h.table) continue
      const len = h.table.length
      bands[ref] = steps.map((s) => bandOf(h.table![(((s / TABLE_STEP_DAYS) % len) + len) % len]))
    }
    return { start: `${dates[0]}T00`, hours: n * 24, g, bandFrom, bands }
  }
  const bandsAll: PageDaily['bands'] = {}
  for (const [ref, h] of histories) if (h.table) bandsAll[ref] = h.table.map(bandOf)

  // Daily: each day's usual level (the middle of its highest and lowest, as the history's),
  // for up to a year.
  // One entry per date, so a missing day file leaves a gap rather than shifting the dates.
  const have = dayFiles.map((f) => f.slice(0, 10)).filter((d) => d > addDays(date, -366))
  const yearDays: string[] = []
  for (let d = have[0]; d <= have[have.length - 1]; d = addDays(d, 1)) yearDays.push(d)
  const yearFiles = yearDays.map((d) => day(d) ?? { date: d, gauges: {} })
  const daily: PageDaily['g'] = {}
  for (const g of gauges) {
    const v = yearFiles.map((f) => fits(g.ref, f.gauges[g.ref]?.u))
    if (v.some((x) => x !== null)) daily[g.ref] = deltas(v)
  }

  return {
    meta: { made: latest.made, date, floods: latest.floods ?? [] },
    gauges: pageGauges,
    hours: hourPart(HOURS_DAYS),
    hours42: hourPart(42),
    daily: { start: yearDays[0], days: yearDays.length, g: daily, bands: bandsAll },
  }
}
