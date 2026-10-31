// `npm run gaps [<data folder>]`: adds "History incomplete" gaps (scripts/lib/history.ts,
// `incompleteGaps`) to history files made before the rule, from the weeks they already hold.
// No downloading. New files get their gaps from `npm run history`.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { RECENT_DAYS_LEFT_OUT, incompleteGaps, type History } from './lib/history.ts'

const dir = join(process.argv[2] ?? '../riverwatcher-data/data', 'history')
const indexFile = join(dir, 'index.json')
const index = JSON.parse(readFileSync(indexFile, 'utf8'))
let n = 0, withGaps = 0
for (const f of readdirSync(dir)) {
  if (!f.endsWith('.json') || f === 'index.json') continue
  const h = JSON.parse(readFileSync(join(dir, f), 'utf8')) as History
  const cutoff = new Date(Date.parse(h.made) - RECENT_DAYS_LEFT_OUT * 86400e3).toISOString().slice(0, 10)
  const gaps = incompleteGaps(h.weeks, h.fromYear, cutoff)
  delete h.gaps
  delete index.gauges[h.ref]?.gaps
  if (gaps.length) {
    h.gaps = gaps
    if (index.gauges[h.ref]) index.gauges[h.ref].gaps = gaps
    withGaps++
  }
  writeFileSync(join(dir, f), JSON.stringify(h) + '\n')
  n++
}
writeFileSync(indexFile, JSON.stringify(index) + '\n')
console.log(`${n} history files; ${withGaps} with a gap that makes the history incomplete.`)
