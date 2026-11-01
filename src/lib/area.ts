// The county, region and England views' rules (SPEC §8.2; stage 4): which gauges count, how
// they're ranked for the time of year, the summary, and the flood warnings in an area. Plain
// functions with no browser needed, so `npm run check` tests them (scripts/check-page.ts).
// The wording here is drafted for John (stage 4); the postcode view's rules are in view.ts.

import { timeOfYear, type Word } from '../../scripts/lib/history.ts'
import type { Flood } from '../../scripts/lib/collect.ts'
import { capital, milesBetween } from './format.ts'
import type { PageGauge } from './pageTypes.ts'
import { heldSteady, isSilent, type Ctx } from './view.ts'
import { countOf, numberWord } from './words.ts'

export type AreaKind = 'county' | 'region' | 'england'

/** The gauges in an area: every gauge with that county or region (nine gauges just over the
 *  borders have neither, so only count in postcode views), leaving out the flat or stuck ones
 *  (SPEC §3.7). England is every gauge with a region. */
export function areaGauges(gauges: PageGauge[], kind: AreaKind, os?: string): PageGauge[] {
  return gauges.filter((g) => !g.quiet && (kind === 'england' ? g.region !== null : kind === 'county' ? g.county === os : g.region === os))
}

/** How high a gauge is for the time of year (0 to 100), when it can be ranked: free-flowing
 *  gauges with history either way; held gauges only when high (SPEC §8.2). Null otherwise. */
export function rankOf(g: PageGauge): number | null {
  if (isSilent(g)) return null
  if (g.j.basis === 'history') return g.j.percent
  if (g.j.basis === 'held' && g.j.word) return g.j.percent ?? (g.j.word === 'very high' ? 95 : 85)
  return null
}

/** How long it has been since the gauge was last as high (or low) for the time of year, in
 *  years: from its "since" year, or its whole record when it's the highest (lowest) since
 *  records began. This is what "the most unusual" means in an area (John, November 1st,
 *  option B): a gauge at its lowest since 1967 comes before one at its lowest since 2022,
 *  so short records don't crowd out long ones. Null for a gauge that isn't high or low. */
export function yearsUnusual(g: PageGauge, date: string): number | null {
  if (isSilent(g) || !g.fromYear) return null
  const thisYear = Number(date.slice(0, 4))
  const year = g.since ? g.since.year : g.heldSince
  if (year === null) return null
  return thisYear - (year === 0 ? g.fromYear : year)
}

const side = (g: PageGauge): 'high' | 'low' | null => {
  const w = g.j.basis === 'history' || g.j.basis === 'held' ? g.j.word : null
  return w === 'high' || w === 'very high' ? 'high' : w === 'low' || w === 'very low' ? (g.j.basis === 'history' ? 'low' : null) : null
}

/** Highest for the time of year first: the high gauges, most unusual first (`yearsUnusual`,
 *  then the percentage); then the rest by percentage; then the low gauges, least unusual
 *  first, so the most unusual low gauge is last. After them, gauges with no ranking: those
 *  outside or within the EA's typical range (above, within, below), held steady, no long
 *  record, silent. */
export function byRank(gauges: PageGauge[], date: string): PageGauge[] {
  const later = (g: PageGauge) => {
    if (isSilent(g)) return 5
    if (g.j.basis === 'typical') return g.j.word === 'above' ? 0 : g.j.word === 'within' ? 1 : 2
    if (heldSteady(g)) return 3
    return 4
  }
  const band = (g: PageGauge) => (side(g) === 'high' ? 0 : side(g) === 'low' ? 2 : 1)
  const years = (g: PageGauge) => yearsUnusual(g, date) ?? 0
  return [...gauges].sort((a, b) => {
    const ra = rankOf(a), rb = rankOf(b)
    if (ra !== null && rb !== null) {
      const ba = band(a), bb = band(b)
      if (ba !== bb) return ba - bb
      if (ba === 0 && years(a) !== years(b)) return years(b) - years(a)
      if (ba === 2 && years(a) !== years(b)) return years(a) - years(b)
      return rb - ra || a.name.localeCompare(b.name)
    }
    if (ra !== null) return -1
    if (rb !== null) return 1
    return later(a) - later(b) || a.name.localeCompare(b.name)
  })
}

/** The most unusual high and low gauges: the `n` high gauges (held gauges included) and the
 *  `n` low gauges (free-flowing only) that are the longest since they were last this high or
 *  low (`yearsUnusual`). */
export function ends(gauges: PageGauge[], n: number, date: string): { high: PageGauge[]; low: PageGauge[] } {
  const ranked = byRank(gauges, date).filter((g) => rankOf(g) !== null)
  const high = ranked.filter((g) => side(g) === 'high').slice(0, n)
  const low = ranked.filter((g) => side(g) === 'low').reverse().slice(0, n)
  return { high, low }
}

/** An area's name inside a sentence: "the West Midlands", "the Isle of Wight"; most need
 *  nothing ("Berkshire"). Headings keep the bare name (as Hindcaster's). */
const THE = new Set(['West Midlands', 'Isle of Wight', 'East Riding of Yorkshire', 'East Midlands', 'East of England', 'West Midlands region'])
export const inProse = (name: string) => (THE.has(name) ? `the ${name}` : name)
/** "in Berkshire", "on the Isle of Wight". */
export const inPlace = (name: string) => (name === 'Isle of Wight' ? 'on the Isle of Wight' : `in ${inProse(name)}`)

export type AreaCounts = {
  /** Free-flowing gauges with history, and held gauges that are high: the ones judged. */
  judged: number
  words: Record<Word, number>
  /** Held steady (not high just now), split by what holds them. */
  steady: number
  steadyDrains: number
  /** Gauges with no long record (only the EA's typical range, or nothing). */
  noRecord: number
  silent: number
}

export function counts(gauges: PageGauge[]): AreaCounts {
  const c: AreaCounts = { judged: 0, words: { 'very low': 0, low: 0, normal: 0, high: 0, 'very high': 0 }, steady: 0, steadyDrains: 0, noRecord: 0, silent: 0 }
  for (const g of gauges) {
    if (isSilent(g)) c.silent++
    else if (g.j.basis === 'history') { c.judged++; c.words[g.j.word]++ }
    else if (g.j.basis === 'held' && g.j.word) { c.judged++; c.words[g.j.word]++ }
    else if (heldSteady(g)) { c.steady++; if (g.held === 'drain') c.steadyDrains++ }
    else c.noRecord++
  }
  return c
}

/** A count opening a sentence: "Seven", "18". */
const opening = (n: number) => capital(numberWord(n))

/** The area summary (SPEC §8.2, drafted for John): "Most rivers in Berkshire are normal for
 *  late October. Seven of the 43 gauges with long records are high or very high, and 15 are
 *  low or very low. 18 are held steady by locks or weirs, so they're only counted when high." */
export function areaSummary(name: string, gauges: PageGauge[], c: Ctx): string[] {
  const where = inPlace(name)
  const toy = timeOfYear(c.date)
  const k = counts(gauges)
  const out: string[] = []
  if (!gauges.length) return [`There are no river gauges ${where} in Riverwatcher's list.`]
  if (k.judged) {
    const high = k.words.high + k.words['very high']
    const low = k.words.low + k.words['very low']
    const half = k.judged / 2
    const top = (['normal', 'high', 'low', 'very high', 'very low'] as Word[]).find((w) => k.words[w] > half)
    const first = top ? `Most rivers ${where} are ${top} for ${toy}.`
      : high > half ? `Most rivers ${where} are high or very high for ${toy}.`
      : low > half ? `Most rivers ${where} are low or very low for ${toy}.`
      // "Mostly normal or high" only when more are high than low, so it can't hide a long
      // list of low gauges (Devon, November 1st: 47 normal, 45 low, two high).
      : high > low && k.words.normal + high > half ? `Rivers ${where} are mostly normal or high for ${toy}.`
      : low > high && k.words.normal + low > half ? `Rivers ${where} are mostly normal or low for ${toy}.`
      : `Rivers ${where} are mixed for ${toy}.`
    out.push(first)
    const of = k.judged === 1 ? 'The one gauge with a long record' : `${opening(high)} of the ${countOf(k.judged, 'gauge')} with long records`
    if (k.judged === 1) {
      const w = (Object.keys(k.words) as Word[]).find((x) => k.words[x])!
      out[0] = `The one river gauge ${where} with a long record is ${w} for ${toy}.`
    } else if (high && low) {
      out.push(`${of} ${high === 1 ? 'is' : 'are'} high or very high, and ${numberWord(low)} ${low === 1 ? 'is' : 'are'} low or very low.`)
    } else if (high) {
      out.push(`${of} ${high === 1 ? 'is' : 'are'} high or very high, and none is low.`)
    } else if (low) {
      out.push(`${opening(low)} of the ${countOf(k.judged, 'gauge')} with long records ${low === 1 ? 'is' : 'are'} low or very low, and none is high.`)
    } else {
      out.push(`None of the ${countOf(k.judged, 'gauge')} with long records is high or low.`)
    }
  } else {
    const n = gauges.length - k.silent - k.steady
    out.push(n === 1 ? `The one river gauge ${where} has no long record to compare with ${toy}.` : `None of the ${countOf(n, 'river gauge')} ${where} has a long record to compare with ${toy}.`)
  }
  if (k.steady) {
    const by = k.steadyDrains === k.steady ? 'pumping' : k.steadyDrains ? 'locks, weirs or pumping' : k.steady === 1 ? 'a lock or weir' : 'locks or weirs'
    out.push(`${opening(k.steady)} ${k.steady === 1 ? 'is' : 'are'} held steady by ${by}, so ${k.steady === 1 ? "it's" : "they're"} only counted when high.`)
  }
  if (k.noRecord && k.judged) out.push(`${opening(k.noRecord)} more ${k.noRecord === 1 ? 'has' : 'have'} no long record to compare.`)
  if (k.silent) out.push(`${opening(k.silent)} ${k.silent === 1 ? 'has' : 'have'} sent no reading for more than six hours.`)
  return out
}

/** The line under a gauge in "the most unusual": what it's ranked by, "The lowest for the time
 *  of year since records began in 1967." or "The highest for the time of year since 2014.";
 *  for a held gauge, why only its highs count (its "since" year isn't shown, SPEC §4.6). */
export function rankLine(g: PageGauge, c: Ctx): string | null {
  void c
  if (g.j.basis === 'held') return g.j.word ? `Held by ${g.held === 'drain' ? 'pumping' : 'a lock or weir'}, so it's only counted when high.` : null
  if (!g.since || isSilent(g)) return null
  return g.since.year ? `The ${g.since.way} for the time of year since ${g.since.year}.` : `The ${g.since.way} for the time of year since records began in ${g.fromYear}.`
}

/** The flood warnings in an area: those whose flood area's middle is nearest to a gauge in it
 *  (the warnings carry no county). Drafted for John: an approximation near a boundary. */
export function areaFloods(floods: Flood[], all: PageGauge[], inArea: (g: PageGauge) => boolean): Flood[] {
  const located = all.filter((g) => g.region !== null)
  return floods.filter((f) => {
    if (f.lat === null || f.long === null) return false
    let best: PageGauge | null = null, d = Infinity
    for (const g of located) {
      const m = milesBetween([f.lat, f.long], [g.lat, g.long])
      if (m < d) { d = m; best = g }
    }
    return !!best && inArea(best)
  })
}
