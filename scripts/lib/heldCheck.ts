// Which gauges held only because of their name really behave like rivers (fresh look 2.1,
// John, November 2nd 2026, option a: "count a named gauge as held only if its level barely
// moves"). A gauge named after a mill, weir, gate or sluice is often a village (Riding Mill on
// the Tyne) or a gauging weir, where the level follows the river's flow. The test is the one
// the locks research used (design/locks-research-2026-10-30.md): over the past year, how often
// the gauge's word for the time of year (low, normal, high) agrees with the middle word of
// the free-flowing gauges with history within 20 miles. Measured on November 2nd 2026:
// free-flowing gauges agree on 65% of days (middle), the Thames locks on 51% (90% of them on
// 63% or less); gauges named after mills 66%, weirs 69%. A named gauge agreeing on at least
// RIVER_AGREEMENT of days is judged like a river. Gauges named after a lock always stay held:
// four Thames locks reached the line, and their level is known to be held.

import { dayOfYear, levelsFor, percentBelow, type History } from './history.ts'

export const RIVER_AGREEMENT = 0.64
export const NEIGHBOUR_MILES = 20
/** At least this many days measured, each with at least three neighbours. */
export const MIN_DAYS = 60

type G = { ref: string; name: string; lat: number; long: number; held: string | null }
/** One day's usual level for each gauge (mm), oldest first. */
export type DayLevels = { date: string; u: Record<string, number | null | undefined> }

const miles = (a: G, b: G) => {
  const r = (x: number) => (x * Math.PI) / 180
  const h = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.long - a.long) / 2) ** 2
  return 2 * 3958.8 * Math.asin(Math.sqrt(h))
}
const word = (p: number) => (p < 25 ? 0 : p > 75 ? 2 : 1)

/** The share of days a gauge's word agrees with its free-flowing neighbours', for every gauge
 *  that can be measured. */
export function agreement(gauges: G[], histories: Map<string, History>, days: DayLevels[], targets: G[] = gauges): Map<string, number> {
  const pct = new Map<string, (number | null)[]>()
  for (const g of gauges) {
    const h = histories.get(g.ref)
    if (!h?.table) continue
    pct.set(g.ref, days.map((d) => {
      const u = d.u[g.ref]
      if (u === null || u === undefined) return null
      const lv = levelsFor(h, dayOfYear(d.date))
      return lv ? percentBelow(lv, u / 1000) : null
    }))
  }
  const free = gauges.filter((g) => g.held === null && pct.has(g.ref))
  const out = new Map<string, number>()
  for (const g of targets) {
    const p = pct.get(g.ref)
    if (!p) continue
    const near = free.filter((x) => x.ref !== g.ref && miles(g, x) <= NEIGHBOUR_MILES).map((x) => pct.get(x.ref)!)
    if (near.length < 3) continue
    let agree = 0, n = 0
    for (let i = 0; i < days.length; i++) {
      if (p[i] === null) continue
      const v = near.map((x) => x[i]).filter((x): x is number => x !== null).sort((a, b) => a - b)
      if (v.length < 3) continue
      n++
      if (word(p[i]!) === word(v[v.length >> 1])) agree++
    }
    if (n >= MIN_DAYS) out.set(g.ref, agree / n)
  }
  return out
}

/** The gauges held only by their name (not a lock) whose level behaves like a river's. */
export function behaveLikeRivers(gauges: G[], histories: Map<string, History>, days: DayLevels[]): Set<string> {
  const named = gauges.filter((g) => g.held === 'name' && !/\blocks?\b/i.test(g.name))
  if (!named.length) return new Set()
  const a = agreement(gauges, histories, days, named)
  return new Set(named.filter((g) => (a.get(g.ref) ?? 0) >= RIVER_AGREEMENT).map((g) => g.ref))
}
