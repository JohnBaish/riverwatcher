// A gauge's chart figures (SPEC §7.6): its level over the chosen period, and the five
// judgement zones for each day of it, from the page's parts. Plain functions, checked by
// `npm run check`.

import { dayOfYear, TABLE_STEP_DAYS } from '../../scripts/lib/history.ts'
import type { PageDaily, PageGauge, PageHours } from './pageTypes.ts'

/** The periods offered, in weeks (52 is "a year"); two weeks at first (SPEC §7.6). */
export const PERIODS = [2, 4, 6, 10, 26, 52] as const
export type Weeks = (typeof PERIODS)[number]
/** Hourly up to six weeks; daily levels beyond. */
export const hourly = (w: Weeks) => w <= 6

/** The chart's left margin, and its drawing width (the key lines up with its left edge). */
export const CHART_LEFT = 46
export const chartWidth = (narrow: boolean) => (narrow ? 360 : 640)

/** Undoes the delta-coding (scripts/lib/pageData.ts `deltas`). */
export function undelta(values: (number | null)[]): (number | null)[] {
  let prev: number | null = null
  return values.map((d) => {
    if (d === null) return null
    prev = prev === null ? d : prev + d
    return prev
  })
}

export type Point = [number, number]
export type Band = [number, number, number, number]

/** The level (mm) at each time (ms) from `from`, oldest first. */
export function points(g: PageGauge, w: Weeks, made: string, part: PageHours | PageDaily): Point[] {
  const from = Date.parse(made) - w * 7 * 86400e3
  const raw = part.g[g.ref]
  if (!raw) return []
  const values = undelta(raw)
  const out: Point[] = []
  if ('hours' in part) {
    const t0 = Date.parse(`${part.start}:00:00Z`)
    // Each hour's average, drawn at the middle of its hour.
    values.forEach((v, i) => { const t = t0 + i * 3600e3 + 1800e3; if (v !== null && t >= from) out.push([t, v]) })
  } else {
    const t0 = Date.parse(`${part.start}T12:00:00Z`)
    values.forEach((v, i) => { const t = t0 + i * 86400e3; if (v !== null && t >= from) out.push([t, v]) })
  }
  return out
}

/** The 10%, 25%, 75% and 90% levels for a day of the year, read between the two nearest
 *  table steps (as history.ts `levelsFor`). `bands` start at day `from` (whole table: 0).
 *  Null where the table has none. */
export function bandAt(bands: (Band | null)[], from: number, doy: number, whole: boolean): Band | null {
  let off = doy - from
  if (whole) off = ((off % 365) + 365) % 365
  else if (off < 0) off += 365
  const i = Math.floor(off / TABLE_STEP_DAYS), f = (off % TABLE_STEP_DAYS) / TABLE_STEP_DAYS
  const n = bands.length
  const a = bands[whole ? i % n : i], b = bands[whole ? (i + 1) % n : i + 1]
  if (!a || !b) return a ?? b ?? null
  return a.map((x, k) => x + (b[k] - x) * f) as Band
}

/** The zones' levels for each day of the period (UTC noon), from the part. */
export function bandDays(g: PageGauge, w: Weeks, made: string, part: PageHours | PageDaily): [number, Band][] {
  const bands = part.bands[g.ref]
  if (!bands) return []
  const whole = !('bandFrom' in part)
  const from = 'bandFrom' in part ? part.bandFrom : 0
  const out: [number, Band][] = []
  const t1 = Date.parse(made), t0 = t1 - w * 7 * 86400e3
  for (let t = t0; t <= t1 + 86400e3; t += 86400e3) {
    const date = new Date(t).toISOString().slice(0, 10)
    const b = bandAt(bands, from, dayOfYear(date), whole)
    if (b) out.push([t, b])
  }
  return out
}
