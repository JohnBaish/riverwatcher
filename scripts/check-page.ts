// `npm run check`, second part: the postcode view's rules and every sentence it makes
// (src/lib/view.ts, series.ts, format.ts; HOUSE-STYLE §11). Made-up gauges for the edges; if
// the data repo is beside this one, real postcodes too (RG4, CA12, TA8, TR21).

import { existsSync, readFileSync } from 'node:fs'
import { clock, dateYear, metres, milesText, monthYear } from '../src/lib/format.ts'
import type { PageGauge } from '../src/lib/pageTypes.ts'
import { bandAt, undelta } from '../src/lib/series.ts'
import {
  changeText, chip, comparisons, figureLine, heldNote, joinsBetween, nearestGauges, readingTime, riverGroups, riverSentence, shortChange, summary, theRiver,
  type Ctx, type Item,
} from '../src/lib/view.ts'
import { areaFloods, areaGauges, areaSummary, byRank, ends, inProse, rankLine, rankOf, yearsUnusual } from '../src/lib/area.ts'
import { deltas, historyFits, liveBand, ukDate, yearBefore } from './lib/pageData.ts'
import type { History } from './lib/history.ts'

let passed = 0
const failures: string[] = []
const eq = (name: string, got: unknown, want: unknown) => {
  if (JSON.stringify(got) === JSON.stringify(want)) passed++
  else failures.push(`${name}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)
}

// ---- wording ----
eq('9.30am', clock(new Date('2026-10-31T09:30:00Z')), '9.30am')
eq('3pm in summer time', clock(new Date('2026-07-01T14:00:00Z')), '3pm')
eq('midday', clock(new Date('2026-10-31T12:00:00Z')), 'midday')
eq('midnight', clock(new Date('2026-10-31T00:00:00Z')), 'midnight')
eq('a date', dateYear('2024-01-07'), 'January 7th 2024')
eq('11th, 12th, 13th', ['2024-01-11', '2024-01-12', '2024-01-13', '2024-01-22'].map(dateYear), ['January 11th 2024', 'January 12th 2024', 'January 13th 2024', 'January 22nd 2024'])
eq('month and year', monthYear('2003-08-04'), 'August 2003')
eq('metres', metres(254), '0.25 m')
eq('negative metres', metres(-43), '-0.04 m')
eq('less than 1 mile', milesText(0.4), 'less than 1 mile')
eq('1 mile', milesText(1.2), '1 mile')
eq('4 miles', milesText(3.8), '4 miles')
eq('the Thames', theRiver('River Thames'), 'the Thames')
eq('Bourne Brook as it is', theRiver('Bourne Brook'), 'Bourne Brook')
eq('UK date after midnight in summer', ukDate('2026-07-01T23:30:00Z'), '2026-07-02')
eq('a year before', yearBefore('2026-10-31'), '2025-10-31')
eq('a year before February 29th', yearBefore('2028-02-29'), '2027-02-28')

// ---- movement ----
eq('steady, up 1 cm', changeText(10), 'Steady: up 1 cm')
eq('steady, no change', changeText(4), 'Steady: no change')
eq('steady at 19 mm', changeText(-19), 'Steady: down 2 cm')
eq('2 cm is not steady', changeText(20), 'Up 2 cm')
eq('down 13 cm', changeText(-130), 'Down 13 cm')
eq('unknown', changeText(null), null)
eq('the table: Steady', shortChange(-15), 'Steady')
eq('the table: Up 3 cm', shortChange(30), 'Up 3 cm')

// ---- the charts' figures ----
eq('delta-coding round trip', undelta(deltas([500, 510, null, 505, 505])), [500, 510, null, 505, 505])
const bands: [number, number, number, number][] = [[0, 10, 20, 30], [100, 110, 120, 130]]
eq('a band read between steps', bandAt(bands, 0, 2, false), [40, 50, 60, 70])
eq('a band on a step', bandAt(bands, 0, 5, false), [100, 110, 120, 130])
eq('the whole table wraps round the year', bandAt(bands, 0, 365 + 5, true), [100, 110, 120, 130])

// ---- a history in a different zero point from the live gauge ----
eq('the live band: recent levels widened', liveBand([300, 500]), [-500, 1300])
eq('a steady gauge still gets room', liveBand([68900, 68950]), [68100, 69750])
const hist = (mid: number) => ({ table: [Array.from({ length: 41 }, (_, i) => mid - 200 + i * 10)] }) as unknown as History
eq('a history that fits', historyFits(hist(400), liveBand([300, 500])), true)
eq("Kings Road Bridge: the archive at 0.1 m, the gauge at 68.9 m", historyFits(hist(110), liveBand([68900, 68950])), false)

// ---- sentences, on made-up gauges ----
const c: Ctx = { made: '2026-10-31T10:04:00Z', date: '2026-10-31' }
const base: PageGauge = {
  ref: 'X', name: 'Weston', river: 'River Test', lat: 51, long: -1, held: null, lake: false, toSeaKm: 50, joins: null, county: null, region: null, quiet: false,
  now: { v: 1210, age: 20, mean: 1200, ch: -50 }, j: { basis: 'history', word: 'normal', percent: 55.2 }, fromYear: 2002,
  since: null, heldSince: null, yearAgo: { v: 840, word: 'normal' }, record: { v: 5350, date: '2015-12-05' }, gaps: [], typical: null, span: [800, 2000],
}
const g = (o: Partial<PageGauge>): PageGauge => ({ ...base, ...o })
eq('chip: normal', chip(base, c), { text: 'Normal for late October', kind: 'normal' })
eq('chip: very high', chip(g({ j: { basis: 'history', word: 'very high', percent: 95 } }), c), { text: 'Very high for late October', kind: 'very-high' })
eq('chip: held', chip(g({ held: 'name', j: { basis: 'held', word: null } }), c), { text: 'Held steady by a lock or weir', kind: 'held' })
eq('chip: held but high', chip(g({ held: 'thames', j: { basis: 'held', word: 'high' } }), c), { text: 'High for late October', kind: 'high' })
eq('chip: a drain', chip(g({ held: 'drain', j: { basis: 'held', word: null } }), c), { text: 'Held steady by pumping', kind: 'held' })
eq('chip: the typical range', chip(g({ j: { basis: 'typical', word: 'above' } }), c), { text: 'Above its usual range', kind: 'range' })
eq('chip: no record (a plain line)', chip(g({ j: { basis: 'none' } }), c), { text: 'No long record to compare.', kind: 'plain' })
eq('chip: silent since yesterday', chip(g({ now: { v: 1210, age: 60 * 20, mean: null, ch: null } }), c), { text: 'No reading since Friday 2.04pm', kind: 'plain' })
eq('reading time today', readingTime(c.made, 20, c.date), '9.44am')
eq('figure line', figureLine(base, c), '1.21 m at 9.44am. Down 5 cm in the last 24 hours.')
eq('figure line, steady', figureLine(g({ now: { v: 6730, age: 20, mean: 6739, ch: 2 } }), c), '6.73 m at 9.44am. Steady: no change in the last 24 hours.')
eq('figure line, no change known', figureLine(g({ now: { v: 6730, age: 20, mean: null, ch: null } }), c), '6.73 m at 9.44am.')
eq('figure line, silent', figureLine(g({ now: { v: 6730, age: 400, mean: null, ch: null } }), c), 'No reading since 3.24am. The last was 6.73 m.')
eq('held note at a lock', heldNote(g({ held: 'navigation' })), 'The level here is held by a weir, so it rises in very wet weather but says little about low water.')
eq('held note at a drain', heldNote(g({ held: 'drain' })), 'The level in this drain is usually set by pumping, so it rises in very wet weather but says little about low water.')
eq('no held note', heldNote(base), null)

eq('comparisons, normal with a gap', comparisons(g({ gaps: [{ from: '2023-05-01', to: '2024-05-06' }] }), c), [
  ['This time of year', 'Higher than on 55% of late October days since 2002.'],
  ['A year ago', '0.84 m, normal for the time of year.'],
  ['Highest on record', '5.35 m, on December 5th 2015.'],
  ['History incomplete', 'No records from May 2023 to May 2024.'],
])
eq('comparisons, low, the lowest since', comparisons(g({ j: { basis: 'history', word: 'very low', percent: 4.4 }, since: { way: 'lowest', year: 2022 }, yearAgo: null, gaps: [{ from: '2025-08-01', to: null }] }), c), [
  ['This time of year', 'Lower than on 96% of late October days since 2002.'],
  ['Since', 'The lowest for the time of year since 2022.'],
  ['Highest on record', '5.35 m, on December 5th 2015.'],
  ['History incomplete', 'No records from August 2025 to now.'],
])
eq('comparisons, since records began', comparisons(g({ j: { basis: 'history', word: 'very high', percent: 99.8 }, since: { way: 'highest', year: 0 }, yearAgo: null, record: null }), c), [
  ['This time of year', 'Higher than on any late October day since 2002.'],
  ['Since', 'The highest for the time of year since records began in 2002.'],
])
eq('comparisons, held: no percentage or "since"', comparisons(g({ held: 'thames', j: { basis: 'held', word: null }, yearAgo: { v: 6720, word: null } }), c), [
  ['A year ago', '6.72 m.'],
  ['Highest on record', '5.35 m, on December 5th 2015.'],
])
eq('comparisons, the typical range', comparisons(g({ j: { basis: 'typical', word: 'within' }, typical: [132, 3100], fromYear: null, yearAgo: null, record: null }), c), [
  ['Usual range', "The Environment Agency gives 0.13 m to 3.10 m as this gauge's usual range, all year round. It has no long record to compare with past years."],
])
eq('comparisons, no record', comparisons(g({ j: { basis: 'none' }, fromYear: null, yearAgo: null, record: null }), c), [
  ['No long record', "This gauge has no long record, and the Environment Agency gives no usual range for it, so its level can't be compared with past years."],
])

// ---- the nearest five and the groups ----
const at: [number, number] = [51, -1]
const place = (ref: string, name: string, river: string | null, miles: number, o: Partial<PageGauge> = {}) => g({ ref, name, river, lat: 51 + miles / 69.05, long: -1, ...o })
const many = [
  place('a', 'A Lock', 'River Thames', 1, { held: 'thames', j: { basis: 'held', word: null }, toSeaKm: 200 }),
  place('b', 'B Lock', 'River Thames', 2, { held: 'thames', j: { basis: 'held', word: 'very high' }, toSeaKm: 190 }),
  place('c', 'C Lock', 'River Kennet', 3, { held: 'navigation', j: { basis: 'held', word: null }, toSeaKm: 197, joins: { river: 'River Thames', toSeaKm: 195 } }),
  place('d', 'D', 'River Loddon', 6, { joins: { river: 'River Thames', toSeaKm: 185 }, toSeaKm: 190 }),
  place('e', 'E', 'Some Brook', 4, { j: { basis: 'none' } }),
  place('f', 'F', 'Flat Brook', 0.5, { j: { basis: 'none' }, quiet: true }),
  place('g', 'G', 'Far River', 12),
]
const near = nearestGauges(many, at)
eq('the nearest: judged first, quiet and far left out', near.map((i) => i.g.ref), ['a', 'b', 'c', 'e', 'd'])
eq('no free-flowing gauge added when one is in', near.some((i) => i.extra), false)
const allHeld = nearestGauges([...many.slice(0, 3), place('d', 'D', 'River Loddon', 9, { joins: { river: 'River Thames', toSeaKm: 185 }, toSeaKm: 190 }), ...many.slice(0, 3).map((x, k) => ({ ...x, ref: `h${k}`, lat: x.lat + 0.01 }))], at)
eq('every one held: the nearest free-flowing added', allHeld.filter((i) => i.extra).map((i) => i.g.ref), ['d'])
const groups = riverGroups(near)
eq('groups, nearest river first', groups.map((gr) => gr.name), ['River Thames', 'River Kennet', 'Some Brook', 'River Loddon'])
eq('upstream to downstream', groups[0].items.map((i) => i.g.ref), ['a', 'b'])
eq('where the Kennet joins', groups[1].joins, 'Joins the Thames between A Lock and B Lock.')
eq('the Loddon joins below', groups[3].joins, 'Joins the Thames below B Lock.')
eq('"The Kennet joins here"', joinsBetween(groups[0], groups[0].items[0], groups[0].items[1]), ['The Kennet joins here'])
eq('the Thames sentence', riverSentence(groups[0], c), 'The Thames is very high for late October at B Lock, and held steady by a lock or weir elsewhere.')
eq('the Kennet sentence', riverSentence(groups[1], c), "The Kennet is held steady by a lock or weir here, and isn't high for late October.")
eq('no record', riverSentence(groups[2], c), 'Some Brook has no long record to compare with here.')
eq('one free-flowing gauge', riverSentence(groups[3], c), 'The Loddon at D is normal for late October.')
const mixed = riverGroups([{ g: place('p', 'P', 'River Eden', 1, { j: { basis: 'history', word: 'normal', percent: 60 } }), miles: 1, extra: false }, { g: place('q', 'Q', 'River Eden', 2, { j: { basis: 'history', word: 'high', percent: 80 } }), miles: 2, extra: false }])
eq('a span of words next to each other', riverSentence(mixed[0], c), 'The Eden is normal to high for late October.')
const apart = riverGroups([{ g: place('t1', 'Team Valley', 'River Team', 1, { toSeaKm: 9, j: { basis: 'history', word: 'very low', percent: 9.9 } }), miles: 1, extra: false }, { g: place('t2', 'Gateshead St Omers Haugh', 'River Team', 2, { toSeaKm: 3, j: { basis: 'history', word: 'very high', percent: 100 } }), miles: 2, extra: false }])
eq('words further apart: each gauge named (option C)', riverSentence(apart[0], c), 'The Team is very low at Team Valley and very high at Gateshead St Omers Haugh, for late October.')
const three = riverGroups([1, 2, 3].map((k) => ({ g: place(`u${k}`, `U${k}`, 'River Ure', k, { toSeaKm: 10 - k, j: { basis: 'history' as const, word: (k === 3 ? 'high' : 'low') as 'high' | 'low', percent: k === 3 ? 80 : 20 } }), miles: k, extra: false })))
eq('three gauges, two words apart', riverSentence(three[0], c), 'The Ure is low at U1 and U2, and high at U3, for late October.')
const drain: Item[] = [{ g: place('r', 'North Drain', 'North Drain', 1, { held: 'drain', j: { basis: 'held', word: 'high' } }), miles: 1, extra: false }]
eq('no "North Drain at North Drain"', riverSentence(riverGroups(drain)[0], c), 'North Drain is high for late October.')
const pumped: Item[] = [{ g: place('s', 'Bradney', 'Kings Sedgemoor Drain', 1, { held: 'drain', j: { basis: 'held', word: null } }), miles: 1, extra: false }, { g: place('t', 'Dunball', 'Kings Sedgemoor Drain', 2, { held: 'drain', j: { basis: 'held', word: null } }), miles: 2, extra: false }]
eq('drains held by pumping', riverSentence(riverGroups(pumped)[0], c), "Kings Sedgemoor Drain is held steady by pumping here, and isn't high for late October.")
const typ: Item[] = [{ g: place('u', 'Uggleton', 'River Ugg', 1, { j: { basis: 'typical', word: 'within' } }), miles: 1, extra: false }]
eq('the usual range', riverSentence(riverGroups(typ)[0], c), 'The Ugg at Uggleton is within its usual range.')
const silent: Item[] = [{ g: place('v', 'V', 'River Vee', 1, { now: { v: 100, age: 500, mean: null, ch: null } }), miles: 1, extra: false }]
eq('every gauge silent', riverSentence(riverGroups(silent)[0], c), 'The Vee has sent no reading for more than six hours.')
eq('the summary', summary('RG4', groups.slice(0, 2), c), "Near RG4: the Thames is very high for late October at B Lock, and held steady by a lock or weir elsewhere. The Kennet is held steady by a lock or weir here, and isn't high for late October.")
eq('a summary starting with a name', summary('TA8', riverGroups(drain), c), 'Near TA8: North Drain is high for late October.')
eq('no gauges', summary('TR21', [], c), 'There are no river gauges within 10 miles of TR21.')

// ---- the area views (stage 4), on made-up gauges ----
const ag = (ref: string, o: Partial<PageGauge>) => g({ ref, name: ref, county: 'Berkshire', region: 'South East England', ...o })
const hj = (word: 'very low' | 'low' | 'normal' | 'high' | 'very high', percent: number) => ({ j: { basis: 'history' as const, word, percent } })
const area = [
  ag('A', { ...hj('very high', 97), since: { way: 'highest', year: 2020 } }), ag('B', { ...hj('high', 80), since: { way: 'highest', year: 0 } }),
  ag('C', hj('normal', 50)), ag('D', hj('normal', 60)), ag('E', { ...hj('low', 20), since: { way: 'lowest', year: 2010 } }),
  ag('F', { held: 'name', j: { basis: 'held', word: null } }), ag('G', { held: 'thames', j: { basis: 'held', word: 'very high', percent: 99 }, heldSince: 2014 }),
  ag('H', { j: { basis: 'typical', word: 'within' } }), ag('I', { now: { v: 1, age: 600, mean: null, ch: null } }),
  ag('Q', { quiet: true }), ag('W', { county: 'Wiltshire', region: 'South West England' }), ag('Z', { county: null, region: null }),
]
eq('area: a county leaves out quiet gauges and other counties', areaGauges(area, 'county', 'Berkshire').map((x) => x.ref), ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'])
eq('area: England leaves out the gauges over the border', areaGauges(area, 'england').map((x) => x.ref).includes('Z'), false)
eq('area: held steady and silent gauges are not ranked', [rankOf(area[5]), rankOf(area[8])], [null, null])
eq('area: years since it was last this high (records began in 2002)', [yearsUnusual(area[1], c.date), yearsUnusual(area[0], c.date), yearsUnusual(area[6], c.date), yearsUnusual(area[2], c.date)], [24, 6, 12, null])
eq('area: the longest since first, a high held gauge among them', byRank(areaGauges(area, 'county', 'Berkshire'), c.date).map((x) => x.ref), ['B', 'G', 'A', 'D', 'C', 'E', 'H', 'F', 'I'])
eq('area: the most unusual, held gauges only high', ends(areaGauges(area, 'county', 'Berkshire'), 3, c.date), { high: [area[1], area[6], area[0]], low: [area[4]] })
// The fault John spotted: 0% everywhere, settled by the alphabet. Now the longer record wins.
const lows = [ag('Zoons', { ...hj('very low', 0), fromYear: 2022, since: { way: 'lowest', year: 0 } }), ag('Stourton', { ...hj('very low', 0), fromYear: 1967, since: { way: 'lowest', year: 0 } }), ag('Mid', { ...hj('very low', 3), since: { way: 'lowest', year: 2001 } })]
eq('area: lowest since 1967 before lowest since 2001 before lowest since 2022', ends(lows, 3, c.date).low.map((x) => x.ref), ['Stourton', 'Mid', 'Zoons'])
eq('area: the summary', areaSummary('Berkshire', areaGauges(area, 'county', 'Berkshire'), c),
  ['Rivers in Berkshire are mostly normal or high for late October.', 'Three of the six gauges with long records are high or very high, and one is low or very low.',
    "One is held steady by a lock or weir, so it's only counted when high.", 'One more has no long record to compare.', 'One has sent no reading for more than six hours.'])
eq('area: most normal', areaSummary('Berkshire', [ag('a', hj('normal', 50)), ag('b', hj('normal', 40)), ag('c', hj('high', 80))], c),
  ['Most rivers in Berkshire are normal for late October.', 'One of the three gauges with long records is high or very high, and none is low.'])
eq('area: none high or low', areaSummary('West Midlands', [ag('a', hj('normal', 50)), ag('b', hj('normal', 40))], c),
  ['Most rivers in the West Midlands are normal for late October.', 'None of the two gauges with long records is high or low.'])
eq('area: one gauge', areaSummary('Rutland', [ag('a', hj('low', 20))], c), ['The one river gauge in Rutland with a long record is low for late October.'])
eq('area: none with a long record', areaSummary('Bristol', [ag('a', { j: { basis: 'typical', word: 'within' } })], c),
  ['The one river gauge in Bristol has no long record to compare with late October.'])
eq('area: none with a long record, four', areaSummary('Rutland', [1, 2, 3, 4].map((i) => ag(`r${i}`, { j: { basis: 'none' } })), c),
  ['None of the four river gauges in Rutland has a long record to compare with late October.'])
eq('area: no gauges', areaSummary('Bristol', [], c), ["There are no river gauges in Bristol in Riverwatcher's list."])
eq('area: more low than high is not "normal or high"', areaSummary('Devon', [ag('a', hj('normal', 50)), ag('b', hj('normal', 50)), ag('c', hj('low', 20)), ag('d', hj('high', 80)), ag('e', hj('low', 15))], c)[0],
  'Rivers in Devon are mostly normal or low for late October.')
eq('area: on the Isle of Wight', areaSummary('Isle of Wight', [ag('a', hj('low', 20))], c)[0], 'The one river gauge on the Isle of Wight with a long record is low for late October.')
eq('area: thousands with a comma', areaSummary('England', Array.from({ length: 1001 }, (_, i) => ag(`n${i}`, hj('normal', 50))), c)[1], 'None of the 1,001 gauges with long records is high or low.')
eq('area: "the" in a sentence', [inProse('Isle of Wight'), inProse('Berkshire')], ['the Isle of Wight', 'Berkshire'])
eq('area: the rank line', rankLine(area[0], c), 'The highest for the time of year since 2020.')
eq('area: the rank line, since records began', rankLine(area[1], c), 'The highest for the time of year since records began in 2002.')
eq('area: the rank line, held', rankLine(area[6], c), "Held by a lock or weir, so it's only counted when high.")
const fl = (lat: number, long: number) => ({ id: 'f', area: 'X', severity: 'Flood alert', lat, long, raised: null, changed: null }) as unknown as Parameters<typeof areaFloods>[0][number]
eq('area: a flood warning goes with its nearest gauge', areaFloods([fl(51, -1.01)], area, (x) => x.county === 'Berkshire').length, 1)

// ---- real postcodes, when the data repo is beside this one ----
const dataDir = new URL('../../riverwatcher-data/data/', import.meta.url)
if (existsSync(new URL('gauges.json', dataDir))) {
  const { pageData } = await import('./lib/pageData.ts')
  const p = pageData()
  const o = JSON.parse(readFileSync(new URL('../src/data/outcodes.json', import.meta.url), 'utf8')).outcodes as Record<string, [number, number, string]>
  const view = (code: string) => riverGroups(nearestGauges(p.gauges, [o[code][0], o[code][1]]))
  const rg4 = view('RG4')
  eq('RG4: the Thames, the Kennet, then the Loddon added', rg4.map((gr) => [gr.name, gr.extra]), [['River Thames', false], ['River Kennet', false], ['River Loddon', true]])
  eq('RG4: the Thames upstream to downstream', rg4[0].items.map((i) => i.g.name), ['Mapledurham Lock', 'Reading', 'Caversham Lock', 'Sonning Lock'])
  eq('RG4: the Kennet joins between Caversham Lock and Sonning Lock', rg4[1].joins, 'Joins the Thames between Caversham Lock and Sonning Lock.')
  eq("RG4: Reading's record", comparisons(rg4[0].items[1].g, { made: p.meta.made, date: p.meta.date }).find(([k]) => k === 'Highest on record')?.[1], '7.54 m, on January 7th 2024.')
  const ca12 = view('CA12')
  eq('CA12: the Greta joins the Derwent above Portinscale', ca12.find((gr) => gr.name === 'River Greta')?.joins, 'Joins the Derwent above Portinscale.')
  eq('CA12: Derwentwater has its own card', ca12.some((gr) => gr.name === 'Derwentwater'), true)
  eq('TR21: no gauges within 10 miles', view('TR21').length, 0)
  // Every sentence the page can make for every postcode district: none says "undefined",
  // "null" or "NaN", or is empty.
  let bad = 0
  for (const code of Object.keys(o)) {
    const gs = view(code)
    const ctx = { made: p.meta.made, date: p.meta.date }
    const texts = [summary(code, gs, ctx), ...gs.flatMap((gr) => [gr.joins ?? '', ...gr.items.flatMap((i) => [chip(i.g, ctx).text, figureLine(i.g, ctx) ?? '', ...comparisons(i.g, ctx).flat()])])]
    if (texts.some((t) => /undefined|null|NaN/.test(t))) bad++
  }
  eq('every district: no "undefined", "null" or "NaN"', bad, 0)

  // Every county and region, and England: the summary and every gauge's lines make sense.
  const actx = { made: p.meta.made, date: p.meta.date }
  let badArea = 0
  const views: [string, ReturnType<typeof areaGauges>][] = [
    ...p.meta.counties.map((a) => [a.name, areaGauges(p.gauges, 'county', a.os)] as [string, ReturnType<typeof areaGauges>]),
    ...p.meta.regions.map((a) => [a.name, areaGauges(p.gauges, 'region', a.os)] as [string, ReturnType<typeof areaGauges>]),
    ['England', areaGauges(p.gauges, 'england')],
  ]
  for (const [name, gs] of views) {
    const texts = [...areaSummary(name, gs, actx), ...gs.map((x) => rankLine(x, actx) ?? '')]
    if (texts.some((t) => /undefined|null|NaN/.test(t))) badArea++
  }
  eq('every area: no "undefined", "null" or "NaN"', badArea, 0)
  eq('47 counties with gauges, nine regions', [p.meta.counties.length, p.meta.regions.length], [47, 9])
  eq('England counts every gauge with a region', areaGauges(p.gauges, 'england').length, p.gauges.filter((x) => x.region && !x.quiet).length)
}

console.log(`${passed} passed${failures.length ? `, ${failures.length} failed:\n  ${failures.join('\n  ')}` : ''}`)
if (failures.length) process.exit(1)
