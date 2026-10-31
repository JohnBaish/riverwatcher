// The collector's rules (SPEC §5, §6; PLAN stage 2), as plain functions so `npm run check` can
// test them; `scripts/collect.ts` puts them together.
//
// Every hour the collector asks for every gauge's latest reading (one request). It keeps one
// sample an hour for each gauge for the last 48 hours (the "state", kept in GitHub's Actions
// cache between runs rather than in git, so the repo doesn't grow every hour), and from it
// works out each gauge's latest level, its average over the last 24 hours and its change.
// Once a day, after UTC midnight, yesterday's day file is made from all of yesterday's
// 15-minute readings (`hourlyAverages`, `usualOfReadings` in days.ts).

/** Levels are kept in whole millimetres, as in the day and history files. */
export const mm = (x: number) => Math.round(x * 1000)

/** A sample an hour for each gauge: UTC hour ("2026-10-31T07") → level in mm. */
export type State = { made: string; samples: Record<string, Record<string, number>> }

export const KEEP_HOURS = 48

/** A gauge is silent with no reading for more than six hours (SPEC §3.3). */
export const SILENT_HOURS = 6

/** Adds each gauge's latest reading to its hourly samples (the newest reading in an hour
 *  wins), and drops samples older than KEEP_HOURS. `latest` maps a gauge's ref to its latest
 *  reading's time and value (metres). */
export function addSamples(state: State, latest: Map<string, { time: string; value: number }>, now: Date): State {
  const samples: State['samples'] = {}
  const oldest = new Date(now.getTime() - KEEP_HOURS * 3600e3).toISOString().slice(0, 13)
  for (const [ref, s] of Object.entries(state.samples)) {
    const kept = Object.fromEntries(Object.entries(s).filter(([h]) => h >= oldest))
    if (Object.keys(kept).length) samples[ref] = kept
  }
  for (const [ref, r] of latest) {
    const hour = new Date(r.time).toISOString().slice(0, 13)
    if (hour < oldest || hour > now.toISOString().slice(0, 13)) continue
    samples[ref] = { ...samples[ref], [hour]: mm(r.value) }
  }
  return { made: now.toISOString(), samples }
}

/** One gauge's line in latest.json: [level mm, minutes between the reading and the run,
 *  average of the last 24 hours' samples mm (null with fewer than 12), change in 24 hours mm
 *  (null if there's no sample from 23 to 25 hours before)]. Minutes rather than a date keep
 *  the file small, as it's rewritten every hour. */
export type LatestLine = [number, number, number | null, number | null]

export function latestLine(samples: Record<string, number> | undefined, reading: { time: string; value: number } | undefined, now: Date): LatestLine | null {
  if (!reading) return null
  const t = Date.parse(reading.time)
  const value = mm(reading.value)
  const hours = Object.entries(samples ?? {}).map(([h, v]) => [Date.parse(`${h}:00:00Z`), v] as const)
  const last24 = hours.filter(([h]) => h > t - 24 * 3600e3 && h <= t).map(([, v]) => v)
  const mean = last24.length >= 12 ? Math.round(last24.reduce((a, b) => a + b, 0) / last24.length) : null
  const before = hours.filter(([h]) => Math.abs(h - (t - 24 * 3600e3)) <= 3600e3).sort((a, b) => Math.abs(a[0] - (t - 24 * 3600e3)) - Math.abs(b[0] - (t - 24 * 3600e3)))[0]
  return [value, Math.max(0, Math.round((now.getTime() - t) / 60000)), mean, before ? value - before[1] : null]
}

export const isSilent = (time: string | null | undefined, now: Date) => !time || now.getTime() - Date.parse(time) > SILENT_HOURS * 3600e3

/** Flood warnings in force (`/id/floods`): severity 1 severe flood warning, 2 flood warning,
 *  3 flood alert; 4 ("no longer in force") is left out. */
export type Flood = { id: string; level: number; severity: string; area: string; raised: string | null; changed: string | null; lat: number | null; long: number | null }
export function floodsInForce(items: { floodAreaID?: string; severityLevel?: number; severity?: string; description?: string; timeRaised?: string; timeMessageChanged?: string }[], areas: Record<string, [number, number]>): Flood[] {
  return items
    .filter((f) => typeof f.severityLevel === 'number' && f.severityLevel >= 1 && f.severityLevel <= 3 && f.floodAreaID)
    .map((f) => ({
      id: f.floodAreaID!, level: f.severityLevel!, severity: f.severity ?? '', area: f.description ?? '',
      raised: f.timeRaised ?? null, changed: f.timeMessageChanged ?? null,
      lat: areas[f.floodAreaID!]?.[0] ?? null, long: areas[f.floodAreaID!]?.[1] ?? null,
    }))
    .sort((a, b) => a.level - b.level || a.area.localeCompare(b.area))
}

/** Flat or stuck (SPEC §3.7; John, October 31st): over the last four weeks of hourly
 *  averages, no change of more than 2 cm, or the same figure more than 90% of the time.
 *  `hours` is the gauge's hourly averages in mm, oldest first (nulls left out). Needs at
 *  least a week of hours to say. */
export const FLAT_MM = 20
export const STUCK_SHARE = 0.9
export function flatOrStuck(hours: number[]): 'flat' | 'stuck' | null {
  if (hours.length < 7 * 24) return null
  if (Math.max(...hours) - Math.min(...hours) <= FLAT_MM) return 'flat'
  let same = 0
  for (let i = 1; i < hours.length; i++) if (hours[i] === hours[i - 1]) same++
  return same / (hours.length - 1) > STUCK_SHARE ? 'stuck' : null
}

/** The bulk list of a day's readings (`/data/readings.csv?parameter=level&startdate=…`), one
 *  row per reading: measure name → [time, value] list. */
export function readingsByMeasure(rows: Record<string, string>[], wanted: Set<string>): Map<string, [string, number][]> {
  const out = new Map<string, [string, number][]>()
  const seen = new Set<string>()
  for (const r of rows) {
    const m = (r.measure ?? '').split('/').pop() ?? ''
    if (!wanted.has(m)) continue
    const v = Number(r.value)
    if (r.value === '' || !Number.isFinite(v) || Number.isNaN(Date.parse(r.dateTime))) continue
    const key = `${m} ${r.dateTime}`
    if (seen.has(key)) continue
    seen.add(key)
    const list = out.get(m)
    if (list) list.push([r.dateTime, v])
    else out.set(m, [[r.dateTime, v]])
  }
  return out
}
