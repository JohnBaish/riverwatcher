// `npm run councils <Boundary-Line folder> [<data folder>]`: each gauge's council area
// (scripts/lib/councils.ts) into data/gauge-councils.json beside the gauge list, for the
// curated combinations (SPEC §8.5). Run again after `npm run gauges`, so new gauges get theirs.
// OS Boundary-Line comes from api.os.uk (ESRI Shapefile, GB); the download isn't kept.

import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { councilOf, readCouncils } from './lib/councils.ts'
import { COMBINATIONS } from './lib/combinations.ts'
import { dataDir } from './lib/pageData.ts'

const blDir = process.argv[2]
if (!blDir) throw new Error('Usage: node scripts/build-councils.ts <Boundary-Line folder> [<data folder>]')
const data = resolve(process.argv[3] ?? dataDir())
const shapes = readCouncils(blDir)
type G = { ref: string; name: string; county: string | null; e: number; n: number }
const gauges = (JSON.parse(readFileSync(join(data, 'gauges.json'), 'utf8')) as { gauges: G[] }).gauges

const out: Record<string, string> = {}
for (const g of gauges) {
  const c = councilOf(shapes, g.e, g.n)
  if (c) out[g.ref] = c
}
const names = new Set(Object.values(out))
for (const combo of COMBINATIONS) for (const c of combo.councils) {
  if (!names.has(c)) throw new Error(`No gauge is in "${c}" (${combo.name}). Council names: ${[...new Set(shapes.map((s) => s.fields.NAME))].filter((n) => n.includes(c.split(' ')[0])).join('; ')}`)
}
writeFileSync(join(data, 'gauge-councils.json'), JSON.stringify({
  note: "Each gauge's council area (district, borough or unitary), from OS Boundary-Line. Made by scripts/build-councils.ts in JohnBaish/riverwatcher.",
  made: new Date().toISOString().slice(0, 10), gauges: out,
}) + '\n')
console.log(`${Object.keys(out).length} of ${gauges.length} gauges have a council area.`)
for (const combo of COMBINATIONS) {
  console.log(`\n${combo.name}:`)
  for (const c of combo.councils) console.log(`  ${c}: ${gauges.filter((g) => out[g.ref] === c).length} gauges`)
}
