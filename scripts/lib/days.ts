// A day's figures from a gauge's readings, for the day files (SPEC §6.2). Days and hours
// are UTC.

/** Each UTC hour's average reading, per UTC date: 24 values a day, null for an hour with
 *  no reading. `readings` as [time, value]. */
export function hourlyAverages(readings: [string, number][]): Map<string, (number | null)[]> {
  const sums = new Map<string, [number, number][]>()
  for (const [t, v] of readings) {
    const iso = new Date(t).toISOString()
    const date = iso.slice(0, 10), hour = Number(iso.slice(11, 13))
    const day = sums.get(date) ?? Array.from({ length: 24 }, () => [0, 0] as [number, number])
    day[hour][0] += v
    day[hour][1]++
    sums.set(date, day)
  }
  return new Map([...sums].map(([date, day]) => [date, day.map(([s, n]) => (n ? s / n : null))]))
}

/** At least half a day of 15-minute readings to give a day's usual level. */
export const MIN_DAY_READINGS = 48

/** The day's usual level from its readings: the middle of its highest and lowest, as the
 *  archive's (SPEC §4.1), or null with fewer than MIN_DAY_READINGS readings. */
export function usualOfReadings(readings: [string, number][], date: string): number | null {
  const v = readings.filter(([t]) => new Date(t).toISOString().slice(0, 10) === date).map(([, x]) => x)
  if (v.length < MIN_DAY_READINGS) return null
  return (Math.max(...v) + Math.min(...v)) / 2
}
