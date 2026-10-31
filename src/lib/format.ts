// Wording for numbers, times and dates (HOUSE-STYLE §15: "9.30am", month first, "less
// than"). Times are shown in UK clock time.

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`

function ukParts(t: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', weekday: 'long', hourCycle: 'h23',
  }).formatToParts(t).map((x) => [x.type, x.value]))
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day), hour: Number(p.hour), minute: Number(p.minute), weekday: p.weekday as string }
}

/** "9.30am", "3pm", "midday", "midnight". */
export function clock(t: Date): string {
  const { hour, minute } = ukParts(t)
  if (minute === 0 && hour === 12) return 'midday'
  if (minute === 0 && hour === 0) return 'midnight'
  const h = hour % 12 || 12
  const ap = hour < 12 ? 'am' : 'pm'
  return minute ? `${h}.${String(minute).padStart(2, '0')}${ap}` : `${h}${ap}`
}

/** "Saturday October 31st". */
export const longDate = (t: Date) => { const p = ukParts(t); return `${p.weekday} ${MONTHS[p.month - 1]} ${ordinal(p.day)}` }
/** "Thursday" (for a time in the last week). */
export const weekday = (t: Date) => ukParts(t).weekday
/** "Oct 17", for chart dates. */
export const shortDate = (t: Date) => { const p = ukParts(t); return `${MONTHS[p.month - 1].slice(0, 3)} ${p.day}` }
/** "January 7th 2024", from YYYY-MM-DD. */
export const dateYear = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${ordinal(d)} ${y}` }
/** "August 2003", from YYYY-MM-DD. */
export const monthYear = (iso: string) => { const [y, m] = iso.split('-').map(Number); return `${MONTHS[m - 1]} ${y}` }

/** A level in metres from mm: "0.26 m". */
export const metres = (mm: number) => `${(mm / 1000).toFixed(2)} m`

/** Whole miles: "less than 1 mile", "1 mile", "4 miles". */
export const milesText = (m: number) => (m < 1 ? 'less than 1 mile' : `${Math.round(m)} mile${Math.round(m) === 1 ? '' : 's'}`)

/** The distance in miles between two points (latitude, longitude). */
export function milesBetween(a: [number, number], b: [number, number]): number {
  const r = (x: number) => (x * Math.PI) / 180
  const dLat = r(b[0] - a[0]), dLong = r(b[1] - a[1])
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLong / 2) ** 2
  return 2 * 3958.8 * Math.asin(Math.sqrt(h))
}

export const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
