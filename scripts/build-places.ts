// `npm run places <OS Open Names Data folder> [<data folder>]`: the "Near …" line for each
// gauge (scripts/lib/places.ts), into data/gauge-places.json beside the gauge list, and
// design/gauge-places-review.md, every line for John to look over. Run again after
// `npm run gauges`, so new gauges get theirs. OS Open Names comes from api.os.uk (CSV, GB);
// the download isn't kept.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { loadPlaces } from './lib/openNames.ts'
import { dataDir } from './lib/pageData.ts'
import { gaugePlace, indexPlaces, namedAfter, PLACE_EXCEPTIONS, type GaugePlace } from './lib/places.ts'
import { placeLine } from '../src/lib/format.ts'

const namesDir = process.argv[2]
if (!namesDir) throw new Error('Usage: node scripts/build-places.ts <OS Open Names Data folder> [<data folder>]')
const data = resolve(process.argv[3] ?? dataDir())

const licence = join(namesDir, '..', 'Doc', 'licence.txt')
const credit = existsSync(licence) ? /Contains OS data[^\r\n]*/.exec(readFileSync(licence, 'latin1'))?.[0] ?? null : null
const idx = indexPlaces(loadPlaces(namesDir))
type G = { ref: string; name: string; river: string | null; county: string | null; e: number; n: number }
const gauges = (JSON.parse(readFileSync(join(data, 'gauges.json'), 'utf8')) as { gauges: G[] }).gauges

const out: Record<string, GaugePlace> = {}
const rows: { g: G; line: string; p: GaugePlace; after: string | null }[] = []
let named = 0
for (const g of gauges) {
  const ex = PLACE_EXCEPTIONS[g.ref]
  const fixed = ex ? idx.all.filter((q) => q.name === ex).sort((a, b) => Math.hypot(a.x - g.e, a.y - g.n) - Math.hypot(b.x - g.e, b.y - g.n))[0] : undefined
  if (ex && !fixed) throw new Error(`No place called ${ex} for ${g.name}`)
  const p: GaugePlace | null = ex === null ? null
    : fixed ? { name: fixed.name, type: fixed.type, metres: Math.round(Math.hypot(fixed.x - g.e, fixed.y - g.n)), far: null }
    : gaugePlace(g.name, g.e, g.n, idx)
  if (!p) { named++; continue }
  out[g.ref] = p
  const after = namedAfter(g.name, g.e, g.n, idx)
  rows.push({ g, p, line: placeLine(p, true), after: after ? `${after.name} (${after.type.toLowerCase()})` : null })
}
writeFileSync(join(data, 'gauge-places.json'), JSON.stringify({
  note: 'The "Near …" line under each gauge, from OS Open Names. Made by scripts/build-places.ts in JohnBaish/riverwatcher. Gauges with no line are named after a town or village, or their nearest place repeats their name.',
  made: new Date().toISOString().slice(0, 10), credit, gauges: out,
}) + '\n')

const mi = (m: number) => (m / 1609.344).toFixed(1)
const byCounty = new Map<string, typeof rows>()
for (const r of rows) {
  const c = r.g.county ?? 'Not in England'
  const l = byCounty.get(c)
  if (l) l.push(r)
  else byCounty.set(c, [r])
}
const far = rows.filter((r) => r.p.far)
const small = rows.filter((r) => !r.p.far && r.p.type !== 'City' && r.p.type !== 'Town' && r.p.type !== 'Village')
const md = [
  '# Gauge place lines, for review',
  '',
  `Made ${new Date().toISOString().slice(0, 10)} by \`npm run places\` (scripts/build-places.ts), from OS Open Names. ${gauges.length} gauges: ${rows.length} get a line, ${named} don't (named after a town or village, or the place would repeat a word of their name).`,
  '',
  'Rule (John, November 3rd 2026): a town or city within 3 miles; else a village within 2 miles; else a suburb or hamlet within 2 miles; further than that, the nearest town or village with its distance and direction. Distances are to the place’s point in Open Names.',
  '',
  `## 1. Further than 2 miles from any village (${far.length})`,
  '',
  ...far.map((r, i) => `1.${i + 1} ${r.g.name} (${r.g.county ?? 'not in England'}): ${r.line}`),
  '',
  `## 2. A suburb or hamlet, as no town or village is near (${small.length})`,
  '',
  ...small.map((r, i) => `2.${i + 1} ${r.g.name} (${r.g.county ?? 'not in England'}): ${r.line}, ${mi(r.p.metres)} miles (${r.p.type.toLowerCase()})`),
  '',
  '## 3. Every line, county by county',
  '',
  ...[...byCounty.keys()].sort().flatMap((c, ci) => [
    `### 3.${ci + 1} ${c}`,
    '',
    ...byCounty.get(c)!.sort((a, b) => a.g.name.localeCompare(b.g.name)).map((r) => `- ${r.g.name}${r.g.river && r.g.river !== r.g.name ? ` (${r.g.river})` : ''}: ${r.line}${r.p.far ? '' : `, ${mi(r.p.metres)} mi`}${r.after ? `; named after ${r.after}` : ''}`),
    '',
  ]),
].join('\n')
writeFileSync(resolve(import.meta.dirname, '../design/gauge-places-review.md'), md)
console.log(`wrote ${join(data, 'gauge-places.json')}: ${rows.length} lines (${far.length} far, ${small.length} suburb or hamlet), ${named} gauges with none; credit: ${credit}`)
