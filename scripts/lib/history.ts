// Each gauge's history, from the Hydrology archive's daily highest and lowest levels, and
// the rules that compare a level with it (SPEC §4, §6.4, §7.5). Plain functions, tested
// by `npm run check`.
//
// "The usual level" for a day is the middle of its highest and lowest level (the archive
// has no daily average level). A gauge's history file keeps, for every fifth day of the
// year, where the usual levels of all past years' days within a week either side fall
// (the level below which 0%, 2.5%, 5% … 100% of them lie); the highest and lowest usual
// level of each week of each year (for "the highest for the time of year since …"); and
// its records.

/** One day from the archive. `high` and `low` in metres. */
export type Day = { date: string; high: number; low: number }

/** The archive's CSV rows ("measure","dateTime","date","value","completeness","quality",
 *  "qcode") for one measure, as date → value. Completeness is ignored (the archive marks
 *  almost every day before about 2015 "Incomplete" though its figures are there); days
 *  marked Suspect or Missing, or with no number, are left out. Where a date has two rows,
 *  `pick` chooses (the higher of two highs, the lower of two lows). */
export function readDailyCsv(rows: Record<string, string>[], pick: (a: number, b: number) => number): Map<string, number> {
  const out = new Map<string, number>()
  for (const r of rows) {
    if (r.quality === 'Suspect' || r.quality === 'Missing' || r.value === '' || r.value === undefined) continue
    const v = Number(r.value)
    if (!Number.isFinite(v) || !/^\d{4}-\d\d-\d\d$/.test(r.date ?? '')) continue
    const had = out.get(r.date)
    out.set(r.date, had === undefined ? v : pick(had, v))
  }
  return out
}

/** Days with both a highest and a lowest level, in date order. The archive's two daily
 *  figures seem not always to cover quite the same period: on some days the "lowest" is a
 *  little above the "highest" (Reading, January 8th 2024: 7.443 m and 7.44 m). Those days
 *  are kept; their usual level is still the middle of the two. */
export function joinDays(highs: Map<string, number>, lows: Map<string, number>): Day[] {
  const days: Day[] = []
  for (const [date, high] of highs) {
    const low = lows.get(date)
    if (low !== undefined) days.push({ date, high, low })
  }
  return days.sort((a, b) => (a.date < b.date ? -1 : 1))
}

export const usual = (d: Day) => (d.high + d.low) / 2

/** Day of a 365-day year, 0 to 364 (February 29th counts as February 28th). */
export function dayOfYear(date: string): number {
  const [, m, d] = date.split('-').map(Number)
  const t = Date.UTC(2025, m - 1, m === 2 && d === 29 ? 28 : d)
  return Math.round((t - Date.UTC(2025, 0, 1)) / 86400e3)
}

/** A record starts in the first year with most of its days present (more than half):
 *  some gauges have a stray early reading (Roe Bridge on the Brock: one day in 1919, then
 *  nothing for decades). Days before that year are left out. */
export const START_YEAR_DAYS = 183
export function recordStart(days: Day[]): number | null {
  const perYear = new Map<number, number>()
  for (const d of days) perYear.set(Number(d.date.slice(0, 4)), (perYear.get(Number(d.date.slice(0, 4))) ?? 0) + 1)
  const years = [...perYear].filter(([, n]) => n >= START_YEAR_DAYS).map(([y]) => y).sort((a, b) => a - b)
  return years[0] ?? null
}

/** The days a week either side of a date (15 days in all). */
export const WINDOW_DAYS = 7
/** The table's steps: every fifth day of the year; the level below which each 2.5% of the
 *  window's days lie. */
export const TABLE_STEP_DAYS = 5
export const TABLE_PERCENTS = Array.from({ length: 41 }, (_, i) => i * 2.5)
/** At least three years of history (SPEC §4.5), each with most of its days, and a window
 *  with days from at least three years. */
export const MIN_YEARS = 3
/** The most recent days aren't used (they're still "Unchecked", and today would be
 *  compared with itself). */
export const RECENT_DAYS_LEFT_OUT = 60

export type History = {
  ref: string
  archive: string
  made: string
  /** The first year of the record, and how many years have most of their days. */
  fromYear: number
  years: number
  lastDay: string
  /** For day of the year 0, 5, 10 … 360: the levels at TABLE_PERCENTS, or null where the
   *  window has too few years. All levels in the file are whole millimetres. */
  table: (number[] | null)[] | null
  /** For each year from `fromYear`: the highest and lowest usual level in each week of the
   *  year (weeks 0 to 51; days 364 count in week 51), or null where there are no days. */
  weeks: { year: number; high: (number | null)[]; low: (number | null)[] }[]
  record: { high: { value: number; date: string }; low: { value: number; date: string } }
}

/** Levels are kept as whole millimetres in the file, to keep it small. */
const mm = (x: number) => Math.round(x * 1000)
export const metresOf = (x: number) => x / 1000
const quantile = (sorted: number[], p: number) => {
  // Linear between the two nearest values.
  const i = (p / 100) * (sorted.length - 1)
  const lo = Math.floor(i), hi = Math.ceil(i)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo)
}
export const weekOf = (doy: number) => Math.min(51, Math.floor(doy / 7))

/** A gauge's history from its days, as built on `today` (YYYY-MM-DD). Null when it has
 *  less than MIN_YEARS of history. */
export function buildHistory(ref: string, archive: string, all: Day[], today: string, records?: { highs: Map<string, number>; lows: Map<string, number> }): History | null {
  const cutoff = new Date(Date.parse(today) - RECENT_DAYS_LEFT_OUT * 86400e3).toISOString().slice(0, 10)
  const start = recordStart(all.filter((d) => d.date < cutoff))
  if (start === null) return null
  const days = all.filter((d) => d.date < cutoff && Number(d.date.slice(0, 4)) >= start)
  const perYear = new Map<number, number>()
  for (const d of days) perYear.set(Number(d.date.slice(0, 4)), (perYear.get(Number(d.date.slice(0, 4))) ?? 0) + 1)
  const fullYears = [...perYear.values()].filter((n) => n >= START_YEAR_DAYS).length
  if (fullYears < MIN_YEARS || !days.length) return null

  const byDoy: { v: number; y: number }[][] = Array.from({ length: 365 }, () => [])
  for (const d of days) byDoy[dayOfYear(d.date)].push({ v: usual(d), y: Number(d.date.slice(0, 4)) })
  const table: (number[] | null)[] = []
  for (let doy = 0; doy < 365; doy += TABLE_STEP_DAYS) {
    const w: number[] = []
    const ys = new Set<number>()
    for (let k = -WINDOW_DAYS; k <= WINDOW_DAYS; k++) for (const x of byDoy[(doy + k + 365) % 365]) { w.push(x.v); ys.add(x.y) }
    w.sort((a, b) => a - b)
    table.push(ys.size >= MIN_YEARS ? TABLE_PERCENTS.map((p) => mm(quantile(w, p))) : null)
  }

  const weekMap = new Map<number, { high: (number | null)[]; low: (number | null)[] }>()
  for (const d of days) {
    const y = Number(d.date.slice(0, 4))
    const e = weekMap.get(y) ?? { high: Array(52).fill(null), low: Array(52).fill(null) }
    const w = weekOf(dayOfYear(d.date)), u = mm(usual(d))
    if (e.high[w] === null || u > e.high[w]!) e.high[w] = u
    if (e.low[w] === null || u < e.low[w]!) e.low[w] = u
    weekMap.set(y, e)
  }
  // The records from every day's highest and lowest, paired or not.
  const inRecord = ([date]: [string, number]) => date < cutoff && Number(date.slice(0, 4)) >= start
  const highs = records ? [...records.highs].filter(inRecord).map(([date, v]) => ({ date, v })) : days.map((d) => ({ date: d.date, v: d.high }))
  const lows = records ? [...records.lows].filter(inRecord).map(([date, v]) => ({ date, v })) : days.map((d) => ({ date: d.date, v: d.low }))
  const hi = highs.reduce((a, b) => (b.v > a.v ? b : a))
  const lo = lows.reduce((a, b) => (b.v < a.v ? b : a))
  return {
    ref, archive, made: today, fromYear: start, years: fullYears, lastDay: days[days.length - 1].date,
    table,
    weeks: [...weekMap].sort(([a], [b]) => a - b).map(([year, v]) => ({ year, ...v })),
    record: { high: { value: mm(hi.v), date: hi.date }, low: { value: mm(lo.v), date: lo.date } },
  }
}

// ---- comparing a level with the history ----

/** The levels at TABLE_PERCENTS for a day of the year, between the two nearest table
 *  steps; null if either is missing. */
export function levelsFor(h: History, doy: number): number[] | null {
  if (!h.table) return null
  const n = h.table.length
  const i = Math.floor(doy / TABLE_STEP_DAYS), f = (doy % TABLE_STEP_DAYS) / TABLE_STEP_DAYS
  const a = h.table[i % n], b = h.table[(i + 1) % n]
  if (!a || !b) return (a ?? b)?.map(metresOf) ?? null
  return a.map((x, k) => metresOf(x + (b[k] - x) * f))
}

/** The share of past days at this time of year with a lower usual level than `value`, from
 *  0 to 100 (read between the table's levels). */
export function percentBelow(levels: number[], value: number): number {
  if (value <= levels[0]) return 0
  if (value >= levels[levels.length - 1]) return 100
  for (let k = 1; k < levels.length; k++) {
    if (value <= levels[k]) {
      const span = levels[k] - levels[k - 1]
      const f = span > 0 ? (value - levels[k - 1]) / span : 0.5
      return TABLE_PERCENTS[k - 1] + f * (TABLE_PERCENTS[k] - TABLE_PERCENTS[k - 1])
    }
  }
  return 100
}

export type Word = 'very low' | 'low' | 'normal' | 'high' | 'very high'

/** The five words (Agreed): very low (lowest 10%), low (10% to 25%), normal, high (75% to
 *  90%), very high (highest 10%). */
export function wordFor(percent: number): Word {
  return percent < 10 ? 'very low' : percent < 25 ? 'low' : percent <= 75 ? 'normal' : percent <= 90 ? 'high' : 'very high'
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
/** "late October": early, mid and late are days 1 to 10, 11 to 20 and 21 onwards. */
export function timeOfYear(date: string): string {
  const [, m, d] = date.split('-').map(Number)
  return `${d <= 10 ? 'early' : d <= 20 ? 'mid' : 'late'} ${MONTHS[m - 1]}`
}

/** The EA's typical range covers the whole year (exceeded 95% and 5% of the time). */
export type RangeWord = 'below' | 'within' | 'above'
export const rangeWord = (value: number, typical: [number, number]): RangeWord => (value < typical[0] ? 'below' : value > typical[1] ? 'above' : 'within')

export type Judgement =
  | { basis: 'history'; word: Word; percent: number; fromYear: number }
  | { basis: 'held'; word: 'high' | 'very high' | null }
  | { basis: 'typical'; word: RangeWord }
  | { basis: 'none' }

/** How a level compares (SPEC §4): with the gauge's history for the time of year if it has
 *  one; otherwise with the EA's all-year typical range. At a held gauge only "high" and
 *  "very high" are said (null means "Held steady by a lock or weir"). */
export function judge(value: number, date: string, history: History | null, typical: [number, number] | null, held: boolean): Judgement {
  const levels = history ? levelsFor(history, dayOfYear(date)) : null
  if (levels) {
    const percent = percentBelow(levels, value)
    const word = wordFor(percent)
    if (held) return { basis: 'held', word: word === 'high' || word === 'very high' ? word : null }
    return { basis: 'history', word, percent, fromYear: history!.fromYear }
  }
  if (held) return { basis: 'held', word: null }
  if (typical) return { basis: 'typical', word: rangeWord(value, typical) }
  return { basis: 'none' }
}

/** "The highest (lowest) for the time of year since [year]": the latest past year with a
 *  usual level as high (low) in the same three weeks (the week of the date and the weeks
 *  either side). Null when no past year was. `before` is the year of the date: that year
 *  and later aren't counted. */
export function sinceYear(h: History, date: string, value: number, way: 'highest' | 'lowest'): number | null {
  const w = weekOf(dayOfYear(date))
  const weeks = [w - 1, w, w + 1].map((x) => (x + 52) % 52)
  const before = Number(date.slice(0, 4))
  for (const y of [...h.weeks].reverse()) {
    if (y.year >= before) continue
    const v = mm(value)
    const hit = weeks.some((k) => (way === 'highest' ? y.high[k] !== null && y.high[k]! >= v : y.low[k] !== null && y.low[k]! <= v))
    if (hit) return y.year
  }
  return null
}

/** "Steady" for a change of less than 2 cm in 24 hours (SPEC §7.4). */
export const STEADY_M = 0.02
export function movement(change: number): 'steady' | 'up' | 'down' {
  return Math.abs(change) < STEADY_M ? 'steady' : change > 0 ? 'up' : 'down'
}

/** The average of the last 24 hours' readings (SPEC §4.2): `readings` as [time, value]. */
export function average24(readings: [string, number][], at: string): number | null {
  const t0 = Date.parse(at) - 86400e3
  const v = readings.filter(([t]) => Date.parse(t) > t0 && Date.parse(t) <= Date.parse(at)).map(([, x]) => x)
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null
}
