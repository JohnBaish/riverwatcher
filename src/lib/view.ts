// The postcode view's rules (SPEC §7; stage 3): which gauges are shown, how they're grouped by
// river, and every sentence the page makes from them. Plain functions with no browser
// needed, so `npm run check` tests them (scripts/check-page.ts).

import { timeOfYear, type Word } from '../../scripts/lib/history.ts'
import { capital, clock, dateYear, metres, milesBetween, monthYear, weekday } from './format.ts'
import type { PageGauge } from './pageTypes.ts'

/** The nearest five within 10 miles (SPEC §7.4). */
export const NEAR_MILES = 10
export const NEAREST = 5
/** No reading for more than six hours: silent (SPEC §3.3; the collector's SILENT_HOURS). */
export const SILENT_MINUTES = 6 * 60

export type Item = { g: PageGauge; miles: number; extra: boolean }

const hasJudgement = (g: PageGauge) => g.j.basis !== 'none'
export const isSilent = (g: PageGauge) => !g.now || g.now.age > SILENT_MINUTES
/** Held by a lock, weir or pumping, and not high just now. */
export const heldSteady = (g: PageGauge) => g.j.basis === 'held' && g.j.word === null
const freeFlowing = (g: PageGauge) => g.held === null && hasJudgement(g)

/** The nearest five within 10 miles: gauges with a judgement first; gauges with no history or
 *  range only make up the numbers, and flat or stuck ones are left out (SPEC §3.7). When
 *  every one is held, the nearest free-flowing gauge within 10 miles is added (SPEC §7.4). */
export function nearestGauges(gauges: PageGauge[], at: [number, number]): Item[] {
  const near = gauges
    .filter((g) => !g.quiet)
    .map((g) => ({ g, miles: milesBetween(at, [g.lat, g.long]), extra: false }))
    .filter((x) => x.miles <= NEAR_MILES)
    .sort((a, b) => a.miles - b.miles)
  const judged = near.filter((x) => hasJudgement(x.g)).slice(0, NEAREST)
  const items = [...judged, ...near.filter((x) => !hasJudgement(x.g)).slice(0, NEAREST - judged.length)].sort((a, b) => a.miles - b.miles)
  if (items.length && items.every((x) => x.g.held !== null)) {
    const free = near.find((x) => freeFlowing(x.g))
    if (free) items.push({ ...free, extra: true })
  }
  return items
}

// ---- grouping by river ----

const key = (name: string) => name.toLowerCase().replace(/^river /, '').trim()
/** "River Thames" → "the Thames"; other names as they are ("Bourne Brook"). */
export const theRiver = (name: string) => (/^River /.test(name) ? `the ${name.replace(/^River /, '')}` : name)

export type Group = {
  name: string
  items: Item[]
  nearest: number
  extra: boolean
  /** Where this river joins another shown: "Joins the Thames between Caversham Lock and Sonning Lock." */
  joins: string | null
  /** Rivers shown that join this one, and where (distance to the sea, km). */
  inflows: { name: string; km: number }[]
}

/** Grouped by river (nearest river first), each listed upstream to downstream (SPEC §7.4). */
export function riverGroups(items: Item[]): Group[] {
  const by = new Map<string, Group>()
  for (const it of items) {
    const name = it.g.river ?? it.g.name
    const k = key(name)
    if (!by.has(k)) by.set(k, { name, items: [], nearest: Infinity, extra: false, joins: null, inflows: [] })
    by.get(k)!.items.push(it)
  }
  const groups = [...by.values()]
  for (const gr of groups) {
    // Upstream first (further from the sea), so the list reads the way the water flows.
    gr.items.sort((a, b) => (b.g.toSeaKm ?? 0) - (a.g.toSeaKm ?? 0))
    gr.nearest = Math.min(...gr.items.map((i) => i.miles))
    gr.extra = gr.items.every((i) => i.extra)
  }
  groups.sort((a, b) => Number(a.extra) - Number(b.extra) || a.nearest - b.nearest)
  for (const gr of groups) {
    const j = gr.items.find((i) => i.g.joins)?.g.joins
    if (!j) continue
    const main = groups.find((m) => m !== gr && key(m.name) === key(j.river))
    if (!main) continue
    const above = main.items.filter((i) => (i.g.toSeaKm ?? 0) > j.toSeaKm)
    const below = main.items.filter((i) => (i.g.toSeaKm ?? 0) <= j.toSeaKm)
    const a = above[above.length - 1], b = below[0]
    gr.joins = a && b ? `Joins ${theRiver(main.name)} between ${a.g.name} and ${b.g.name}.`
      : a ? `Joins ${theRiver(main.name)} below ${a.g.name}.` : `Joins ${theRiver(main.name)} above ${b.g.name}.`
    main.inflows.push({ name: gr.name, km: j.toSeaKm })
  }
  return groups
}

/** The rivers joining between two rows of a group: "The Kennet joins here". */
export const joinsBetween = (gr: Group, a: Item, b: Item) =>
  gr.inflows.filter((f) => (a.g.toSeaKm ?? 0) > f.km && (b.g.toSeaKm ?? 0) <= f.km).map((f) => `${capital(theRiver(f.name))} joins here`)

// ---- the judgement ----

export type Chip = { text: string; kind: 'very-low' | 'low' | 'normal' | 'high' | 'very-high' | 'held' | 'range' | 'plain' }

const heldBy = (g: PageGauge) => (g.held === 'drain' ? 'pumping' : 'a lock or weir')
const kindOf = (w: Word) => w.replace(' ', '-') as Chip['kind']

/** The words beside each gauge (SPEC §4; the agreed design). */
export function chip(g: PageGauge, c: Ctx): Chip {
  const toy = timeOfYear(c.date)
  if (isSilent(g)) return { text: g.now ? `No reading since ${since(g.now.age, c)}` : 'No reading', kind: 'plain' }
  const j = g.j
  if (j.basis === 'history') return { text: `${capital(j.word)} for ${toy}`, kind: kindOf(j.word) }
  if (j.basis === 'held') return j.word ? { text: `${capital(j.word)} for ${toy}`, kind: kindOf(j.word) } : { text: `Held steady by ${heldBy(g)}`, kind: 'held' }
  if (j.basis === 'typical') return { text: `${capital(j.word)} its usual range`, kind: 'range' }
  return { text: 'No long record to compare.', kind: 'plain' }
}

/** When a reading was: "4.15pm", or "Thursday 4.15pm" before today. `made` is when the
 *  figures were made; `age` the minutes before it. */
export function readingTime(made: string, age: number, date: string): string {
  const t = new Date(Date.parse(made) - age * 60000)
  const sameDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(t) === date
  return sameDay ? clock(t) : `${weekday(t)} ${clock(t)}`
}
/** When the figures were made (ISO) and the UK date they're for. */
export type Ctx = { made: string; date: string }
const since = (age: number, c: Ctx) => readingTime(c.made, age, c.date)

// ---- movement ----

/** "Steady: up 1 cm", "Down 3 cm"; less than 2 cm is "Steady" (SPEC §7.4). Null when unknown. */
export function changeText(ch: number | null): string | null {
  if (ch === null) return null
  const cm = Math.round(ch / 10)
  const dir = cm > 0 ? `up ${cm} cm` : cm < 0 ? `down ${-cm} cm` : 'no change'
  return Math.abs(ch) < 20 ? `Steady: ${dir}` : capital(dir)
}
/** The table's "Last 24 hours": "Steady", "Up 3 cm". */
export const shortChange = (ch: number | null) => (ch === null ? null : Math.abs(ch) < 20 ? 'Steady' : changeText(ch))

/** "0.26 m at 10.45am. Steady: up 1 cm in the last 24 hours." */
export function figureLine(g: PageGauge, c: Ctx): string | null {
  if (!g.now) return null
  if (isSilent(g)) return `No reading since ${since(g.now.age, c)}. The last was ${metres(g.now.v)}.`
  const ch = changeText(g.now.ch)
  return `${metres(g.now.v)} at ${since(g.now.age, c)}.${ch ? ` ${ch} in the last 24 hours.` : ''}`
}

/** The line under a held gauge's figures (SPEC §7.5; drains drafted for John). */
export function heldNote(g: PageGauge): string | null {
  if (g.held === null) return null
  if (g.held === 'drain') return 'The level in this drain is usually set by pumping, so it rises in very wet weather but says little about low water.'
  return 'The level here is held by a weir, so it rises in very wet weather but says little about low water.'
}

// ---- the comparisons (SPEC §7.5) ----

export function comparisons(g: PageGauge, c: Ctx): [string, string][] {
  const toy = timeOfYear(c.date)
  const out: [string, string][] = []
  const j = g.j
  if (j.basis === 'history' && g.fromYear && !isSilent(g)) {
    const p = j.percent
    out.push(['This time of year', p >= 50
      ? (p >= 99.5 ? `Higher than on any ${toy} day since ${g.fromYear}.` : `Higher than on ${Math.round(p)}% of ${toy} days since ${g.fromYear}.`)
      : (p <= 0.5 ? `Lower than on any ${toy} day since ${g.fromYear}.` : `Lower than on ${Math.round(100 - p)}% of ${toy} days since ${g.fromYear}.`)])
  }
  if (g.since && !isSilent(g)) out.push(['Since', g.since.year ? `The ${g.since.way} for the time of year since ${g.since.year}.` : `The ${g.since.way} for the time of year since records began in ${g.fromYear}.`])
  if (j.basis === 'typical' && g.typical) out.push(['Usual range', `The Environment Agency gives ${metres(g.typical[0])} to ${metres(g.typical[1])} as this gauge's usual range, all year round. It has no long record to compare with past years.`])
  if (j.basis === 'none') out.push(['No long record', "This gauge has no long record, and the Environment Agency gives no usual range for it, so its level can't be compared with past years."])
  if (g.yearAgo) out.push(['A year ago', g.yearAgo.word ? `${metres(g.yearAgo.v)}, ${g.yearAgo.word} for the time of year.` : `${metres(g.yearAgo.v)}.`])
  if (g.record) out.push(['Highest on record', `${metres(g.record.v)}, on ${dateYear(g.record.date)}.`])
  if (g.gaps.length) out.push(['History incomplete', g.gaps.map((x) => `No records from ${monthYear(x.from)} to ${x.to ? monthYear(x.to) : 'now'}.`).join(' ')])
  return out
}

// ---- the summary, river by river (SPEC §7.3) ----

const ORDER: Word[] = ['very low', 'low', 'normal', 'high', 'very high']
const spanOf = (ws: Word[]) => {
  const i = ws.map((w) => ORDER.indexOf(w))
  const lo = Math.min(...i), hi = Math.max(...i)
  return lo === hi ? ORDER[lo] : `${ORDER[lo]} to ${ORDER[hi]}`
}
const list = (xs: string[]) => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const heldWords = (gs: PageGauge[]) => {
  const drains = gs.every((g) => g.held === 'drain')
  return drains ? 'pumping' : gs.length > 1 ? 'locks and weirs' : 'a lock or weir'
}

export function riverSentence(gr: Group, c: Ctx): string {
  const toy = timeOfYear(c.date)
  const cap = capital(theRiver(gr.name))
  const live = gr.items.map((i) => i.g).filter((g) => !isSilent(g))
  const free = live.filter((g) => g.j.basis === 'history')
  const highs = live.filter((g) => g.j.basis === 'held' && g.j.word)
  const steady = live.filter(heldSteady)
  const typical = live.filter((g) => g.j.basis === 'typical')
  const wordOf = (g: PageGauge) => (g.j.basis === 'history' || g.j.basis === 'held' ? g.j.word! : null)
  // "at Reading", but not "North Drain … at North Drain".
  const atName = (g: PageGauge) => (key(g.name) === key(gr.name) ? '' : ` at ${g.name}`)
  if (free.length) {
    const at = free.length === 1 ? atName(free[0]) : ''
    const also = highs.length ? `, and ${spanOf(highs.map(wordOf) as Word[])} at ${list(highs.map((g) => g.name))}` : ''
    // Words next to each other read as a span ("normal to high"); further apart, each gauge is
    // named, as a span like "very low to very high" reads oddly (John, October 31st, option C).
    const steps = free.map((g) => ORDER.indexOf(wordOf(g)!))
    if (Math.max(...steps) - Math.min(...steps) >= 2) {
      const parts = ORDER.filter((w) => free.some((g) => wordOf(g) === w)).map((w) => `${w} at ${list(free.filter((g) => wordOf(g) === w).map((g) => g.name))}`)
      const joined = parts.length < 2 ? parts.join('') : `${parts.slice(0, -1).join(', ')}${parts.some((x) => x.includes(' and ')) || parts.length > 2 ? ', and ' : ' and '}${parts[parts.length - 1]}`
      return `${cap} is ${joined}, for ${toy}${also}.`
    }
    return `${cap}${at} is ${spanOf(free.map(wordOf) as Word[])} for ${toy}${also}.`
  }
  if (highs.length) {
    const rest = steady.length ? `, and held steady by ${heldWords(steady)} elsewhere` : ''
    const where = highs.length === 1 ? atName(highs[0]) : ` at ${list(highs.map((g) => g.name))}`
    return `${cap} is ${spanOf(highs.map(wordOf) as Word[])} for ${toy}${where}${rest}.`
  }
  if (steady.length) return `${cap} is held steady by ${heldWords(steady)} here, and isn't high for ${toy}.`
  if (typical.length) {
    const words = [...new Set(typical.map((g) => (g.j.basis === 'typical' ? g.j.word : '')))]
    const at = typical.length === 1 ? atName(typical[0]) : ''
    return words.length === 1 ? `${cap}${at} is ${words[0]} its usual range.` : `${cap} is ${list(typical.map((g) => `${g.j.basis === 'typical' ? g.j.word : ''} its usual range at ${g.name}`))}.`
  }
  return live.length ? `${cap} has no long record to compare with here.` : `${cap} has sent no reading for more than six hours.`
}

/** "Near RG4: the Thames is very high … The Kennet is …" */
export function summary(code: string, groups: Group[], c: Ctx): string {
  if (!groups.length) return `There are no river gauges within ${NEAR_MILES} miles of ${code}.`
  return `Near ${code}: ` + groups.map((gr, i) => { const s = riverSentence(gr, c); return i === 0 ? s.replace(/^The /, 'the ') : s }).join(' ')
}
