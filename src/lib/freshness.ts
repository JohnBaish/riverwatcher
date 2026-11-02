// How fresh the figures are, by the visitor's own clock (fresh look 5.2, John, November 2nd
// 2026: his choice of fix left to Claude). The page is rebuilt every hour with new figures; if
// collecting stops (a failed run, an expired key), the page would otherwise go on showing old
// figures with only a time and no day.

import { clock, longDate, weekday } from './format.ts'

/** Figures older than this are called out. */
export const STALE_HOURS = 3

const ukDate = (t: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(t)

/** The top bar's "Updated …": the time alone on the same UK day as the visitor, the weekday
 *  within the last week ("Sunday 3.54pm"), otherwise the date ("October 26th, 3.54pm"). */
export function updatedText(made: string, now: Date): string {
  const t = new Date(made)
  if (ukDate(t) === ukDate(now)) return clock(t)
  if (now.getTime() - t.getTime() < 6 * 86400e3) return `${weekday(t)} ${clock(t)}`
  return `${longDate(t).replace(/^\w+ /, '')}, ${clock(t)}`
}

/** The warning when the figures are more than STALE_HOURS old; null when they're fresh. */
export function staleText(made: string, now: Date): string | null {
  const t = new Date(made)
  if (now.getTime() - t.getTime() <= STALE_HOURS * 3600e3) return null
  return `These figures were collected at ${clock(t)} on ${longDate(t)}, and Riverwatcher hasn't been able to update them since. Please check again later.`
}
