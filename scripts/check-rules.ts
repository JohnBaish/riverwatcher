// `npm run check`: the gauge and history rules (scripts/lib/gauges.ts, rivers.ts,
// history.ts), with made-up cases for the edges and real ones from the data tests and the
// agreed mock-up (Caversham, Sonning, Reading, Greta Bridge, Keswick Campsite, Twyford,
// Blakes Lock; the Kennet's join). The real history files in design/fixtures/history/
// were built by `npm run history` on October 30th 2026. If the gauge list is beside this
// repo (../riverwatcher-data/data/gauges.json), its rivers are checked too.

import { existsSync, readFileSync } from 'node:fs'
import {
  dropNearDuplicates, heldReason, isBackup, isLake, namesAgree, navigationHeads, riverKey, riverMeasure, shownName, tidyName, type Station,
} from './lib/gauges.ts'
import {
  average24, buildHistory, cleanDays, lastStep, dayOfYear, incompleteGaps, judge, joinDays, levelsFor, movement, percentBelow, readDailyCsv, recordStart, sinceYear, timeOfYear, wordFor,
  type Day, type History,
} from './lib/history.ts'
import { englishName, normRiver } from './lib/rivers.ts'
import { daysFromReadings, hourlyAverages, usualOfReadings } from './lib/days.ts'
import { addSamples, flatOrStuck, floodsInForce, isSilent, latestLine, readingsByMeasure } from './lib/collect.ts'

let passed = 0
const failures: string[] = []
function check(name: string, ok: boolean, detail = '') {
  if (ok) passed++
  else failures.push(`${name}${detail ? `: ${detail}` : ''}`)
}
const eq = (name: string, got: unknown, want: unknown) => check(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`)

// ---- which stations are river gauges ----
const m = (id: string, qualifier: string, unitName = 'mASD', parameter = 'level') => ({ '@id': `http://x/id/measures/${id}`, parameter, qualifier, unitName })
const st = (measures: ReturnType<typeof m>[]): Station => ({ stationReference: 'X', label: 'X', measures })
const at = (t: Record<string, number>) => (k: string) => t[k]
eq('a Stage level is a river gauge', riverMeasure(st([m('a', 'Stage')]), at({}))?.['@id'], 'http://x/id/measures/a')
eq('a tidal station is not', riverMeasure(st([m('a', 'Stage'), m('b', 'Tidal Level', 'mAOD')]), at({})), null)
eq('a groundwater station is not', riverMeasure(st([m('a', 'Groundwater', 'mAOD')]), at({})), null)
eq('Downstream Stage alone is not used', riverMeasure(st([m('a', 'Downstream Stage')]), at({})), null)
eq('a level in "---" is not', riverMeasure(st([m('a', 'Stage', '---')]), at({})), null)
eq('of two, the one reading most recently', riverMeasure(st([m('a', 'Stage', 'mASD'), m('b', 'Stage', 'mAOD')]), at({ a: 1, b: 2 }))?.['@id'], 'http://x/id/measures/b')
eq('of two with no readings, mASD first', riverMeasure(st([m('b', 'Stage', 'mAOD'), m('a', 'Stage', 'mASD')]), at({}))?.['@id'], 'http://x/id/measures/a')

// ---- near-duplicates ----
check('a backup is a backup', isBackup('Thames at Kingston (Backup)') && isBackup('TEMPSFORD ROXTON GS BACKUP') && !isBackup('Backwater'))
{
  const g = (ref: string, name: string, river: string | null, e: number, archive: string | null) => ({ ref, name, river, e, n: 0, archive })
  const r = dropNearDuplicates([g('A', 'Long name here', 'R', 0, null), g('B', 'Short', 'R', 50, 'arch'), g('C', 'Other', 'R', 150, null), g('D', 'Same spot', 'S', 10, null)])
  eq('within 100 m on the same river, the one with history kept', r.kept.map((x) => x.ref).sort(), ['B', 'C', 'D'])
  eq('and the other dropped for it', r.dropped.map((x) => `${x.gauge.ref}>${x.for.ref}`), ['A>B'])
}

// ---- names ----
eq('capitals tidied, codes dropped', tidyName('MANTHORPE GS WITS'), 'Manthorpe')
eq('small words kept small', tidyName('RIVER CHERWELL  AT  ENSLOW'), 'River Cherwell at Enslow')
eq('mixed-case names keep their case but lose codes', tidyName('Crawters Brook RL'), 'Crawters Brook')
eq('ordinary names untouched', tidyName('Caversham Lock'), 'Caversham Lock')
eq('the archive name for a name in capitals', shownName('RIVER KENNET AT THEALE', 'Theale'), 'Theale')
check('same site, codes aside', namesAgree('BLAKES LOCK G.STN', 'Blakes Lock'))
check('different sites', !namesAgree('UPHILL RHYNE TERRACE TILTING WEIR', 'Sampford Brett Screen') && !namesAgree('Rainfall station', 'Wannock Mill'))
eq('Welsh names in English', englishName('Afon Hafren', 'River Severn'), 'River Severn')
eq('English names as they are', englishName('River Wye', ''), 'River Wye')
check('lakes, not streams called "Water"', isLake(null, 'Derwent Reservoir', null) && isLake('Lake Windermere', 'Bowness', null) && !isLake('Wooler Water', 'Wooler', 'inlandRiver') && !isLake('Atherton Lake Brook', 'Howe Bridge', 'inlandRiver'))
check('river names compare without "River"', normRiver('River Kennet') === normRiver('kennet'))

// ---- held by a lock or weir ----
const held = (name: string, river: string | null, long: number, toSeaKm: number | null = null, head?: number, form: string | null = 'inlandRiver') => heldReason({ name, river, long, form, toSeaKm }, head)
eq('Caversham Lock: by its name', held('Caversham Lock', 'River Thames', -0.96), 'name')
eq('Reading: on the Thames below Lechlade', held('Reading', 'River Thames', -0.97), 'thames')
eq('Cricklade: on the Thames above Lechlade, free', held('Cricklade', 'River Thames', -1.87), null)
eq('Greta Bridge: free ("Bridge" isn\'t a structure)', held('Greta Bridge', 'River Greta', -3.15), null)
eq('a canal', held('Par Highways', 'Treffry Canal', -4.7), 'canal')
eq('a fen drain in the lowlands', heldReason({ name: 'Wainfleet', river: 'Steeping River Catchwater Drain', county: 'Lincolnshire', long: 0.2, form: null, toSeaKm: null }, undefined), 'drain')
eq('a "dike" in the hills is a stream', heldReason({ name: 'Grimescar', river: 'Grimescar Dike', county: 'West Yorkshire', long: -1.8, form: null, toSeaKm: null }, undefined), null)
eq('the River Leam is a river', heldReason({ name: 'Eathorpe', river: 'River Leam', county: 'Warwickshire', long: -1.4, form: null, toSeaKm: null }, undefined), null)
eq('Reading Calcot Bridge: on the Kennet navigation, below its head at Newbury', held('Reading Calcot Bridge', 'River Kennet', -1.05, 108.4, 134.9), 'navigation')
eq('Marlborough: on the Kennet above it', held('Marlborough', 'River Kennet', -1.73, 170, 134.9), null)
{
  const gs = [
    { name: 'Newbury', river: 'River Kennet', outlet: 'T', toSeaKm: 134.9 },
    { name: 'Blakes Lock', river: 'River Kennet', outlet: 'T', toSeaKm: 99.3 },
    { name: 'Locks Weir', river: 'River Ribble', outlet: 'R', toSeaKm: 104.8 },
    { name: 'Stoke Lock', river: 'River Itchen', outlet: 'S', toSeaKm: 20.9 },
    { name: 'Upper Lock', river: 'River Medway', outlet: 'M', toSeaKm: 70 },
    { name: 'Lower Lock', river: 'River Medway', outlet: 'M', toSeaKm: 60 },
  ]
  const heads = navigationHeads(gs)
  eq('a named head wins over a lock', heads.get(riverKey('River Kennet', 'T'))?.gauge, 'Newbury')
  eq('otherwise the highest lock', heads.get(riverKey('River Medway', 'M'))?.gauge, 'Upper Lock')
  check('not on rivers that aren\'t navigations (the Ribble, the Itchen)', !heads.has(riverKey('River Ribble', 'R')) && !heads.has(riverKey('River Itchen', 'S')))
}

// ---- the time of year ----
eq('the five words at their edges', [9.9, 10, 24.9, 25, 75, 75.1, 90, 90.1].map(wordFor), ['very low', 'low', 'low', 'normal', 'normal', 'high', 'high', 'very high'])
eq('early, mid and late', ['2026-10-01', '2026-10-10', '2026-10-11', '2026-10-20', '2026-10-21', '2026-02-28'].map(timeOfYear), ['early October', 'early October', 'mid October', 'mid October', 'late October', 'late February'])
eq('February 29th counts as the 28th', dayOfYear('2024-02-29'), dayOfYear('2025-02-28'))
eq('steady under 2 cm', [0.019, -0.019, 0.02, -0.03].map(movement), ['steady', 'steady', 'up', 'down'])
eq('the last 24 hours\' average', average24([['2026-10-29T10:00:00Z', 9], ['2026-10-29T12:00:00Z', 1], ['2026-10-30T11:00:00Z', 3]], '2026-10-30T11:00:00Z'), 2)
{
  // A stray early reading doesn't start the record (Roe Bridge on the Brock: 1919).
  const days: Day[] = [{ date: '1919-05-01', high: 1, low: 1 }]
  for (let y = 2001; y <= 2005; y++) for (let d = 0; d < 365; d += 1) {
    const date = new Date(Date.UTC(y, 0, 1 + d)).toISOString().slice(0, 10)
    days.push({ date, high: 1 + (y - 2000) / 10, low: 1 + (y - 2000) / 10 - 0.2 })
  }
  eq('a record starts in its first year with most days', recordStart(days), 2001)
  const h = buildHistory('T', 'T', days, '2026-10-30')!
  eq('years counted', [h.fromYear, h.years], [2001, 5])
  const lv = levelsFor(h, dayOfYear('2026-03-15'))!
  // The usual levels in March are 1.0, 1.1, 1.2, 1.3 and 1.4 (one value a year).
  check('the table spans the years', Math.abs(lv[0] - 1.0) < 0.001 && Math.abs(lv[lv.length - 1] - 1.4) < 0.001, JSON.stringify([lv[0], lv[40]]))
  // 1.2 is the level of a fifth of the days, from 40% to 60% of them.
  check('a level in the middle', percentBelow(lv, 1.2) >= 40 && percentBelow(lv, 1.2) <= 60, String(percentBelow(lv, 1.2)))
  eq('below everything, above everything', [percentBelow(lv, 0.5), percentBelow(lv, 2)], [0, 100])
  eq('the highest since: the latest year as high', sinceYear(h, '2026-03-15', 1.35, 'highest'), 2005)
  eq('the lowest since', sinceYear(h, '2026-03-15', 1.05, 'lowest'), 2001)
  eq('none as high', sinceYear(h, '2026-03-15', 9, 'highest'), null)
  eq('the record', [h.record.high.value, h.record.low.value], [1500, 900])
  eq('a record that ended in 2005 is incomplete from 2006', h.gaps, [{ from: '2006-01-01', to: null }])
  {
    const wk = (year: number, from: number, to: number) => ({ year, high: Array.from({ length: 52 }, (_, w) => (w >= from && w < to ? 1 : null)), low: [] })
    const full = (year: number) => wk(year, 0, 52)
    // 2010 to 2026 full, but nothing from week 10 of 2022 to week 20 of 2023 (more than a year, recent).
    const ws = [...[2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021].map(full), wk(2022, 0, 10), wk(2023, 20, 52), full(2024), full(2025), wk(2026, 0, 35)]
    eq('a recent gap of more than a year', incompleteGaps(ws, 2010, '2026-09-01').map((g) => g.from.slice(0, 7)), ['2022-03'])
    // The same gap in 2012 is too long ago to say.
    eq('an old gap isn\'t said', incompleteGaps([full(2010), full(2011), wk(2012, 0, 10), wk(2013, 20, 52), ...[2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025].map(full), wk(2026, 0, 35)], 2010, '2026-09-01'), [])
    // A record that stops in March 2026: a gap to the end.
    eq('a record that stops', incompleteGaps([...[2020, 2021, 2022, 2023, 2024, 2025].map(full), wk(2026, 0, 9)], 2020, '2026-09-01').map((g) => [g.from.slice(0, 7), g.to]), [['2026-03', null]])
    eq('a gap of seven months isn\'t said', incompleteGaps([...[2020, 2021, 2022, 2023, 2024].map(full), wk(2025, 0, 20), wk(2026, 0, 35)], 2020, '2026-09-01').length, 0)
  }
  check('too little history gives none', buildHistory('T', 'T', days.filter((d) => d.date < '2003-01-01'), '2026-10-30') === null)
  eq('held: only high said', [judge(1.0, '2026-03-15', h, null, true), judge(1.45, '2026-03-15', h, null, true)].map((j) => (j.basis === 'held' ? j.word : 'x')), [null, 'very high'])
  eq('no history: the EA\'s typical range', judge(2, '2026-03-15', null, [0.5, 1.5], false), { basis: 'typical', word: 'above' })
  eq('neither: no judgement', judge(2, '2026-03-15', null, null, false), { basis: 'none' })
}
{
  const rows = [
    { date: '2026-01-01', value: '0.5', quality: 'Good', completeness: 'Incomplete' },
    { date: '2026-01-01', value: '0.7', quality: 'Good', completeness: 'Complete' },
    { date: '2026-01-02', value: '9', quality: 'Suspect', completeness: 'Complete' },
    { date: '2026-01-03', value: '', quality: 'Missing', completeness: 'Incomplete' },
  ]
  eq('two highs on one date: the higher; Suspect and Missing left out; completeness ignored', [...readDailyCsv(rows, Math.max)], [['2026-01-01', 0.7]])
  eq('a day needs both, even if its lowest is a little above its highest', joinDays(new Map([['a', 1], ['b', 2], ['c', 7.44]]), new Map([['a', 0.5], ['c', 7.443]])), [{ date: 'a', high: 1, low: 0.5 }, { date: 'c', high: 7.44, low: 7.443 }])
}

// ---- cleaning the archive: a change of zero point, impossible days ----
{
  // Six years of a made-up river: a seasonal swing of 0.6 m, a wet winter 0.8 m higher, a
  // two-week flood to 3 m, and the first two years 20 m out (a different zero point).
  const daysOf = (shift: (date: string, i: number) => number) => {
    const out: Day[] = []
    for (let i = 0; i < 6 * 365; i++) {
      const date = new Date(Date.UTC(2015, 0, 1) + i * 86400e3).toISOString().slice(0, 10)
      const base = 0.6 + 0.3 * Math.cos((2 * Math.PI * i) / 365) + 0.05 * Math.sin(i * 1.7) + shift(date, i)
      out.push({ date, high: base + 0.1, low: base - 0.1 })
    }
    return out
  }
  const maps = (days: Day[]) => [new Map(days.map((d) => [d.date, d.high])), new Map(days.map((d) => [d.date, d.low]))] as const
  const wet = (date: string) => (date >= '2019-11-01' && date < '2020-03-01' ? 0.8 : 0)
  const flood = (date: string) => (date >= '2018-02-01' && date < '2018-02-15' ? 2.4 : 0)
  const plain = daysOf((d) => wet(d) + flood(d))
  eq('no change of zero point in a wet winter and a flood', lastStep(plain), null)
  const [ph, pl] = maps(plain)
  const c0 = cleanDays(ph, pl)
  eq('the flood and the wet winter are kept', [c0.from, c0.dropped], [null, 0])
  const shifted = daysOf((d) => (d < '2017-01-01' ? 20 : 0) + wet(d) + flood(d))
  eq('a change of zero point found', lastStep(shifted), '2017-01-01')
  const [sh, sl] = maps(shifted)
  const c1 = cleanDays(sh, sl)
  eq('the days before it left out', [c1.from, [...c1.highs.keys()][0], c1.dropped], ['2017-01-01', '2017-01-01', 0])
  const twice = daysOf((d) => (d < '2016-06-01' ? 4 : d < '2018-06-01' ? 2 : 0))
  eq('two changes: the last one counts', lastStep(twice), '2018-06-01')
  const stuckAt = daysOf((d) => (d >= '2019-01-01' && d < '2020-01-01' ? NaN : 0)).map((d) => (Number.isNaN(d.high) ? { ...d, high: -1.25, low: -1.25 } : d))
  const [kh, kl] = maps(stuckAt)
  const c3 = cleanDays(kh, kl)
  eq('a stuck year is missing figures, not a change of zero point', [c3.from, c3.highs.has('2019-06-01'), c3.highs.has('2018-06-01'), c3.highs.has('2020-06-01')], [null, false, true, true])
  const slow = daysOf((d, i) => (d >= '2018-01-01' ? Math.max(-1.5, -(i - 1096) * 0.03) : 0))
  eq('a level drawn down over weeks is not a change of zero point', lastStep(slow), null)
  const [th, tl] = maps(plain)
  th.set('2019-02-28', 32.01)
  tl.set('2016-05-05', -9)
  const c2 = cleanDays(th, tl)
  eq('impossible days left out (Walton\'s 32 m)', [c2.highs.has('2019-02-28'), c2.lows.has('2019-02-28'), c2.lows.has('2016-05-05'), c2.dropped], [false, false, false, 2])
  check('the flood\'s highest kept', c2.highs.get('2018-02-10')! > 2.9)
  const h = buildHistory('T', 'T', joinDays(c2.highs, c2.lows), '2026-10-30', { highs: c2.highs, lows: c2.lows })!
  check('the record is the flood, not the impossible day', h.record.high.date >= '2018-02-01' && h.record.high.date < '2018-02-15', JSON.stringify(h.record.high))
}

// ---- day files ----
{
  const r: [string, number][] = [['2026-10-25T00:00:00Z', 1], ['2026-10-25T00:30:00Z', 3], ['2026-10-25T23:45:00Z', 5], ['2026-10-26T00:15:00Z', 7]]
  const h = hourlyAverages(r)
  eq('hourly averages by UTC hour, a day each', [h.get('2026-10-25')![0], h.get('2026-10-25')![1], h.get('2026-10-25')![23], h.get('2026-10-26')![0]], [2, null, 5, 7])
  eq('a clock-change day still has 24 hours', h.get('2026-10-25')!.length, 24)
  const full: [string, number][] = Array.from({ length: 96 }, (_, i) => [new Date(Date.UTC(2026, 9, 25, 0, 15 * i)).toISOString(), i === 10 ? 2 : i === 50 ? 0.5 : 1])
  eq('a day\'s usual level from its readings: the middle of highest and lowest', usualOfReadings(full, '2026-10-25'), 1.25)
  eq('not from less than half a day', usualOfReadings(full.slice(0, 40), '2026-10-25'), null)
  const rows = full.map(([t, v]) => ({ dateTime: t.slice(0, 19), value: String(v), quality: 'Unchecked' }))
  rows.push({ dateTime: '2026-10-25T12:00:00', value: '9', quality: 'Suspect' })
  eq('a day from the archive\'s 15-minute readings, Suspect left out', [...daysFromReadings(rows)], [['2026-10-25', { high: 2, low: 0.5 }]])
  eq('and not from less than half a day', daysFromReadings(rows.slice(0, 40)).size, 0)
}

// ---- the collector ----
{
  const now = new Date('2026-10-31T12:10:00Z')
  const st = addSamples({ made: '', samples: { A: { '2026-10-29T08': 100, '2026-10-30T11': 200, '2026-10-30T12': 210 } } }, new Map([['A', { time: '2026-10-31T12:00:00Z', value: 0.25 }], ['B', { time: '2026-10-31T13:00:00Z', value: 1 }]]), now)
  eq('samples older than 48 hours go; a reading from the future is ignored', st.samples, { A: { '2026-10-30T11': 200, '2026-10-30T12': 210, '2026-10-31T12': 250 } })
  const full: Record<string, number> = {}
  for (let h = 0; h <= 24; h++) full[new Date(Date.parse('2026-10-30T12:00:00Z') + h * 3600e3).toISOString().slice(0, 13)] = 1000 + h * 10
  eq('the latest line: level, minutes old, 24-hour average, change in 24 hours', latestLine(full, { time: '2026-10-31T12:00:00Z', value: 1.24 }, now), [1240, 10, 1125, 240])
  eq('no average from too few samples, no change without a sample a day before', latestLine({ '2026-10-31T11': 5 }, { time: '2026-10-31T12:00:00Z', value: 0.005 }, now), [5, 10, null, null])
  check('silent after six hours', isSilent('2026-10-31T06:00:00Z', now) && !isSilent('2026-10-31T06:15:00Z', now) && isSilent(null, now))
  eq('flood warnings in force, most severe first, with their area\'s position', floodsInForce([
    { floodAreaID: 'x', severityLevel: 3, severity: 'Flood alert', description: 'River Eden' },
    { floodAreaID: 'y', severityLevel: 4, severity: 'Warning no longer in force', description: 'Old' },
    { floodAreaID: 'z', severityLevel: 2, severity: 'Flood warning', description: 'Keswick' },
  ], { z: [54.6, -3.1] }).map((f) => [f.area, f.level, f.lat]), [['Keswick', 2, 54.6], ['River Eden', 3, null]])
  const week = (f: (i: number) => number) => Array.from({ length: 24 * 28 }, (_, i) => f(i))
  eq('flat: no change of more than 2 cm in four weeks', flatOrStuck(week((i) => 500 + (i % 3) * 5)), 'flat')
  eq('stuck: the same figure nearly every hour', flatOrStuck(week((i) => (i % 20 === 0 ? 900 : 500))), 'stuck')
  eq('a river that moves is neither', flatOrStuck(week((i) => 500 + Math.round(200 * Math.sin(i / 30)))), null)
  eq('too few hours to say', flatOrStuck([1, 1, 1]), null)
  eq('a day\'s readings by measure, repeats once', [...readingsByMeasure([
    { dateTime: '2026-10-30T00:00:00Z', measure: 'http://x/id/measures/M1', value: '0.5' },
    { dateTime: '2026-10-30T00:00:00Z', measure: 'http://x/id/measures/M1', value: '0.5' },
    { dateTime: '2026-10-30T00:15:00Z', measure: 'http://x/id/measures/M2', value: '1' },
    { dateTime: '2026-10-30T00:30:00Z', measure: 'http://x/id/measures/M1', value: '' },
  ], new Set(['M1']))], [['M1', [['2026-10-30T00:00:00Z', 0.5]]]])
}

// ---- real gauges, against the agreed mock-up (4.41pm, October 30th 2026, worked out day
// by day without a table). The table reads between steps five days apart, so a percentage
// may differ by a few points where levels change fast with the season (Caversham: 50%
// against 46%), and the mock-up left all of 2026 out where the history keeps January to
// August; the words should agree. ----
const fixture = (ref: string) => JSON.parse(readFileSync(new URL(`../design/fixtures/history/${ref}.json`, import.meta.url), 'utf8')) as History
const real: [string, string, number, number, string, boolean][] = [
  // ref, name, the last 24 hours' average, the mock-up's percentage and word, held
  ['2201TH', 'Caversham Lock', 0.1779, 46, 'normal', true],
  ['2301TH', 'Sonning Lock', 0.2557, 98, 'very high', true],
  ['2200TH', 'Reading', 6.7345, 72, 'normal', true],
  ['750832', 'Greta Bridge', 1.2855, 61, 'normal', false],
  ['750917', 'Keswick Campsite', 1.1274, 77, 'high', false],
  ['2298TH', 'Blakes Lock', 0.0068, 1, 'very low', true],
]
for (const [ref, name, value, pct, word, isHeld] of real) {
  const h = fixture(ref)
  const p = percentBelow(levelsFor(h, dayOfYear('2026-10-30'))!, value)
  check(`${name}: about ${pct}% (${word})`, Math.abs(p - pct) <= 5 && wordFor(p) === word, `got ${p.toFixed(1)}% ${wordFor(p)}`)
  const j = judge(value, '2026-10-30', h, null, isHeld)
  if (isHeld) eq(`${name}: held, so ${word === 'very high' || word === 'high' ? word : 'held steady'}`, j.basis === 'held' ? j.word : 'x', word === 'very high' || word === 'high' ? word : null)
}
eq('Keswick Campsite: the highest for the time of year since 2025', sinceYear(fixture('750917'), '2026-10-30', 1.1274, 'highest'), 2025)
// The mock-up said 7.44 m on January 8th 2024: it only counted days with both figures, and
// January 7th 2024 has no lowest.
eq('Reading: highest on record 7.54 m on January 7th 2024', fixture('2200TH').record.high, { value: 7540, date: '2024-01-07' })
eq('Greta Bridge: highest on record December 5th 2015 (Storm Desmond)', fixture('750832').record.high.date, '2015-12-05')
eq('Twyford: the archive\'s levels stop in 2011', fixture('2490TH').lastDay.slice(0, 4), '2011')

// ---- the gauge list's rivers, if it's here ----
const listFile = new URL('../../riverwatcher-data/data/gauges.json', import.meta.url)
if (existsSync(listFile)) {
  type G = { ref: string; archive: string | null; name: string; river: string | null; toSeaKm: number | null; system: number | null; joins: { river: string; toSeaKm: number } | null; held: string | null; county: string | null }
  const gs = (JSON.parse(readFileSync(listFile, 'utf8')) as { gauges: G[] }).gauges
  const by = (ref: string) => gs.find((g) => g.ref === ref)!
  const [cav, son, rdg, blakes, twy, greta, port, kes] = ['2201TH', '2301TH', '2200TH', '2298TH', '2490TH', '750832', '751007', '750917'].map(by)
  check('the Thames is one river from Ewen to Teddington', new Set(gs.filter((g) => g.river === 'River Thames' && g.toSeaKm !== null).map((g) => g.system)).size === 1)
  check('Caversham is 180 to 200 km from the sea along the Thames', cav.toSeaKm! > 180 && cav.toSeaKm! < 200, String(cav.toSeaKm))
  check('Reading, Caversham Lock, then Sonning Lock downstream', rdg.toSeaKm! > cav.toSeaKm! && cav.toSeaKm! > son.toSeaKm!)
  check('the Kennet joins the Thames between Caversham Lock and Sonning Lock', blakes.joins?.river === 'River Thames' && blakes.joins.toSeaKm < cav.toSeaKm! && blakes.joins.toSeaKm > son.toSeaKm!, JSON.stringify(blakes.joins))
  check('the Loddon joins the Thames below Sonning Lock', twy.joins?.river === 'River Thames' && twy.joins.toSeaKm < son.toSeaKm!)
  check('the Greta joins the Derwent above Portinscale', greta.joins?.river === 'River Derwent' && kes.joins?.river === 'River Derwent' && greta.joins.toSeaKm > port.toSeaKm!)
  check('the Thames and the Derwent don\'t join anything (they reach the sea)', cav.joins === null && port.joins === null)
  eq('held as agreed: Caversham, Sonning, Reading, Blakes Lock; not Greta Bridge, Twyford', [cav, son, rdg, blakes, greta, twy].map((g) => !!g.held), [true, true, true, true, false, false])
  eq('counties', [cav.county, greta.county], ['Berkshire', 'Cumbria'])
  eq('Twyford\'s archive is Twyford Main', twy.archive, '1f60373d-2b3c-4c41-b4be-0950dd97e068_w1TH')
  check('every major river in one piece', ['River Trent', 'River Severn', 'River Aire', 'River Nene', 'River Medway', 'River Kennet', 'River Witham'].every((r) => new Set(gs.filter((g) => g.river === r && g.toSeaKm !== null).map((g) => g.system)).size === 1))
} else console.log('(The gauge list isn\'t beside this repo, so its rivers weren\'t checked.)')

console.log(`${passed} passed${failures.length ? `, ${failures.length} failed:` : '.'}`)
for (const f of failures) console.log(`  FAILED ${f}`)
if (failures.length) process.exit(1)
