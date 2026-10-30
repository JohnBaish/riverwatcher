// Where each gauge sits along its river, from OS Open Rivers (Ordnance Survey, Open
// Government Licence; downloaded when the gauge list is built, not kept). Rewritten from
// design/mockups/river-positions.py.
//
// Each stretch of river ("watercourse link") runs from one node to the next, the way the
// water flows. The distance to the sea from a node is the shortest way downstream to a
// node with nothing below it (a river mouth, or where a river ends inland). A gauge is put
// on its nearest stretch (preferring one with the EA's river name, within 600 m), and its
// distance to the sea is the distance left to the end of that stretch plus the end's
// distance to the sea. A bigger distance is further upstream. Following the way down from
// the gauge gives the rivers' names in order, so a tributary shows which river it joins,
// and where (the distance to the sea of the meeting point).

import { join } from 'node:path'
import { readDbf, readLines } from './shapefile.ts'

/** How far a gauge may be from its stretch, and how much nearer a stretch with the
 *  gauge's own river name counts as (so it wins over an unnamed ditch just beside it). */
export const SNAP_LIMIT_M = 600
export const NAMED_BONUS_M = 150

export type Link = { name: string; start: string; end: string; form: string; length: number; xy: Float64Array }

/** One step down the network: along a stretch the way it's drawn ("link"), along one drawn
 *  the wrong way round ("reverse"), or across a gap to another stretch ("bridge"). `link`
 *  is the stretch whose name the step carries. */
export type Step = { to: string; length: number; link: number; kind: 'link' | 'reverse' | 'bridge' }

/** How much dearer a stretch is to use against the way it's drawn: only where nothing else
 *  connects (about 750 places where two stretches meet and the one leaving is drawn the
 *  wrong way). */
export const REVERSE_COST = 5

export type Network = {
  links: Link[]
  /** Distance to the sea from each node, in metres. */
  toSea: Map<string, number>
  /** The next step down from each node, on the shortest way to the sea. */
  down: Map<string, Step>
  /** Every stretch leaving each node (more than one where a river splits round an island). */
  outs: Map<string, number[]>
  /** Dead ends that are neither at the sea nor near another river. */
  lateEnds: Set<string>
  /** The stretches passing through each 2 km square, for finding the nearest. */
  grid: Map<string, number[]>
}

const CELL = 2000

/** Nodes closer than this are the same place. */
export const NODE_MERGE_M = 1.5

function* nearby(grid: Map<string, number[]>, x: number, y: number) {
  const seen = new Set<number>()
  const cx0 = Math.floor(x / CELL), cy0 = Math.floor(y / CELL)
  for (let cx = cx0 - 1; cx <= cx0 + 1; cx++)
    for (let cy = cy0 - 1; cy <= cy0 + 1; cy++)
      for (const i of grid.get(`${cx},${cy}`) ?? []) if (!seen.has(i)) { seen.add(i); yield i }
}

/** The nearest point on a line to (x, y): how far, how far along, and the line's length. */
function nearestOn(xy: Float64Array, x: number, y: number) {
  let total = 0
  for (let k = 2; k < xy.length; k += 2) total += Math.hypot(xy[k] - xy[k - 2], xy[k + 1] - xy[k - 1])
  let best = { d: Infinity, along: 0, total }
  let acc = 0
  for (let k = 2; k < xy.length; k += 2) {
    const [x1, y1, x2, y2] = [xy[k - 2], xy[k - 1], xy[k], xy[k + 1]]
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy)
    const t = len ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (len * len))) : 0
    const d = Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))
    if (d < best.d) best = { d, along: acc + t * len, total }
    acc += len
  }
  return best
}

/** Open Rivers' "River Kennet", the EA's "River Kennet" and "Kennet" all compare as "kennet". */
export const normRiver = (s: string | null | undefined) => String(s ?? '').toLowerCase().replace(/\briver\b/g, '').replace(/\s+/g, ' ').trim()

/** A river's end within this distance of the high-water line is where it meets the sea. */
export const COAST_M = 500
/** Inland, a dead end is bridged to the same river up to this far, or any river up to BRIDGE_ANY_M. */
export const BRIDGE_SAME_INLAND_M = 1000
export const BRIDGE_ANY_INLAND_M = 300
/** At the sea's edge: the same river within 150 m, any within 20 m. */
export const BRIDGE_SAME_SEA_M = 150
export const BRIDGE_ANY_SEA_M = 20

/** The high-water line's points, by 1 km square, for asking whether a point is at the coast. */
export function coastIndex(lines: Float64Array[]): Map<string, number[]> {
  const idx = new Map<string, number[]>()
  for (const xy of lines) for (let k = 0; k < xy.length; k += 2) {
    const key = `${Math.floor(xy[k] / 1000)},${Math.floor(xy[k + 1] / 1000)}`
    const a = idx.get(key) ?? []
    a.push(xy[k], xy[k + 1])
    idx.set(key, a)
  }
  return idx
}
const atCoast = (coast: Map<string, number[]>, x: number, y: number) => {
  const cx = Math.floor(x / 1000), cy = Math.floor(y / 1000)
  for (let i = cx - 1; i <= cx + 1; i++) for (let j = cy - 1; j <= cy + 1; j++) {
    const p = coast.get(`${i},${j}`) ?? []
    for (let k = 0; k < p.length; k += 2) if (Math.hypot(p[k] - x, p[k + 1] - y) <= COAST_M) return true
  }
  return false
}

/** OS Open Rivers' network from its `data` folder; `coast` is the high-water line
 *  (OS Boundary-Line's Data/GB/high_water_polyline, through coastIndex). */
/** OS gives a Welsh name first in Wales ("Afon Hafren", with "River Severn" second): the
 *  English one is used. */
export const englishName = (name1: string, name2: string) => (name2 && /^(afon|nant)\b/i.test(name1) ? name2 : name1)

/** A side channel shorter than this isn't the river a tributary joins (the Mole "joins" the
 *  Ember, a channel of its own, before the Thames). */
export const JOIN_MIN_KM = 3

export function readNetwork(dataDir: string, coast: Map<string, number[]>): Network {
  const rows = readDbf(join(dataDir, 'WatercourseLink.dbf'))
  // OS's own word for each node: "outlet" (where a river ends), "source", "junction" …
  const nodeForm = new Map(readDbf(join(dataDir, 'HydroNode.dbf')).map((r) => [r.identifier, r.formOfNode]))
  const lines = readLines(join(dataDir, 'WatercourseLink'))
  if (rows.length !== lines.length) throw new Error(`Open Rivers: ${rows.length} rows but ${lines.length} lines`)
  const links: Link[] = rows.map((r, i) => {
    let xy = lines[i]
    let [start, end] = [r.startNode, r.endNode]
    // Three stretches are drawn against the flow: turn them round.
    if (r.flow === 'in opposite direction') {
      ;[start, end] = [end, start]
      const rev = new Float64Array(xy.length)
      for (let k = 0; k < xy.length; k += 2) { rev[xy.length - 2 - k] = xy[k]; rev[xy.length - 1 - k] = xy[k + 1] }
      xy = rev
    }
    return { name: englishName(r.name1, r.name2), start, end, form: r.form, length: Number(r.length) || 0, xy }
  })
  // Nodes at the same spot (within NODE_MERGE_M) are one node: in places the map gives a
  // river's next stretch a different node at the same point, which would end it.
  const at = new Map<string, { id: string; x: number; y: number }[]>()
  const same = new Map<string, string>()
  const canon = (id: string, x: number, y: number) => {
    const cx = Math.floor(x), cy = Math.floor(y)
    for (let i = cx - 2; i <= cx + 2; i++) for (let j = cy - 2; j <= cy + 2; j++)
      for (const p of at.get(`${i},${j}`) ?? []) if (Math.hypot(p.x - x, p.y - y) <= NODE_MERGE_M) {
        if (p.id !== id) same.set(id, p.id)
        return p.id
      }
    at.set(`${cx},${cy}`, [...(at.get(`${cx},${cy}`) ?? []), { id, x, y }])
    return id
  }
  for (const l of links) {
    l.start = canon(l.start, l.xy[0], l.xy[1])
    l.end = canon(l.end, l.xy[l.xy.length - 2], l.xy[l.xy.length - 1])
  }
  for (const [id, first] of same) if (nodeForm.get(id) === 'outlet' && nodeForm.get(first) !== 'outlet') nodeForm.set(first, nodeForm.get(first) ?? 'junction')
  const out = new Map<string, number[]>()
  const into = new Map<string, number[]>()
  links.forEach((l, i) => {
    out.set(l.start, [...(out.get(l.start) ?? []), i])
    into.set(l.end, [...(into.get(l.end) ?? []), i])
  })
  const grid = new Map<string, number[]>()
  links.forEach((l, i) => {
    const seen = new Set<string>()
    for (let k = 2; k < l.xy.length; k += 2) {
      const [x1, y1, x2, y2] = [l.xy[k - 2], l.xy[k - 1], l.xy[k], l.xy[k + 1]]
      for (let cx = Math.floor(Math.min(x1, x2) / CELL); cx <= Math.floor(Math.max(x1, x2) / CELL); cx++)
        for (let cy = Math.floor(Math.min(y1, y2) / CELL); cy <= Math.floor(Math.max(y1, y2) / CELL); cy++) {
          const key = `${cx},${cy}`
          if (seen.has(key)) continue
          seen.add(key)
          grid.set(key, [...(grid.get(key) ?? []), i])
        }
    }
  })

  // Dead ends. A river really ends where it reaches the sea: on a tidal stretch, or within
  // COAST_M of the high-water line. Any other dead end is taken to be a gap in the map, and
  // carries on along the nearest river stretch (not a canal, and not one that ends in a dead
  // end itself), from the nearest point on it to its end, within BRIDGE_ANY_INLAND_M, or
  // BRIDGE_SAME_INLAND_M for the same river name (at Sandford-on-Thames the Thames's next
  // stretch starts 55 m away; at Oxford and Abingdon stretches drawn backwards end 70 and
  // 89 m from their own river, at nodes OS marks as outlets). Those left (a river ending in a swallow hole,
  // or a gap too wide) are ends too, but only after everything that reaches the sea.
  const bridgesTo = new Map<string, Step[]>() // keyed by the node the bridge leads to
  const ends = new Set<string>()
  const lateEnds = new Set<string>()
  const isDead = (node: string) => !out.has(node)
  // Whether the water from `from` comes back to `n` within a few stretches (a bridge there
  // would only go round in a loop).
  const leadsTo = (from: string, n: string) => {
    let frontier = [from]
    const seen = new Set(frontier)
    for (let step = 0; step < 40 && frontier.length; step++) {
      const next: string[] = []
      for (const f of frontier) for (const j of out.get(f) ?? []) {
        const e = links[j].end
        if (e === n) return true
        if (!seen.has(e)) { seen.add(e); next.push(e) }
      }
      frontier = next
    }
    return false
  }
  for (const n of into.keys()) {
    if (out.has(n)) continue
    const incoming = into.get(n)!.map((i) => links[i])
    const l0 = incoming[0]
    const ex = l0.xy[l0.xy.length - 2], ey = l0.xy[l0.xy.length - 1]
    const sea = incoming.some((l) => l.form === 'tidalRiver') || atCoast(coast, ex, ey)
    // At the sea's edge a gap is looked for more closely (the tidal Thames has one at
    // Isleworth, at a node OS marks as an outlet).
    const [sameLimit, anyLimit] = sea ? [BRIDGE_SAME_SEA_M, BRIDGE_ANY_SEA_M] : [BRIDGE_SAME_INLAND_M, BRIDGE_ANY_INLAND_M]
    let best: { score: number; d: number; j: number; rest: number } | null = null
    for (const j of nearby(grid, ex, ey)) {
      const l = links[j]
      if (l.form === 'canal' || l.end === n || l.start === n || (isDead(l.end) && nodeForm.get(l.end) !== 'outlet') || leadsTo(l.end, n)) continue
      const hit = nearestOn(l.xy, ex, ey)
      const same = incoming.some((x) => x.name && normRiver(x.name) === normRiver(l.name))
      if (hit.d > (same ? sameLimit : anyLimit)) continue
      // The same river wins over a closer other one unless the other is very close.
      const score = same ? hit.d - anyLimit : hit.d
      if (!best || score < best.score) best = { score, d: hit.d, j, rest: Math.max(0, hit.total - hit.along) * (hit.total ? (l.length || hit.total) / hit.total : 1) }
    }
    if (best) {
      const step: Step = { to: links[best.j].end, length: best.d + best.rest, link: best.j, kind: 'bridge' }
      bridgesTo.set(step.to, [...(bridgesTo.get(step.to) ?? []), { ...step, to: n }])
    } else if (sea) ends.add(n)
    else lateEnds.add(n)
  }

  // Upstream from every true end (a river mouth, or where a river really ends inland),
  // cheapest first (a simple binary heap). Costs choose the way; lengths are what's kept.
  const toSea = new Map<string, number>()
  const cost = new Map<string, number>()
  const down = new Map<string, Step>()
  const heap: [number, string][] = []
  const push = (d: number, n: string) => {
    heap.push([d, n])
    for (let i = heap.length - 1; i > 0;) {
      const p = (i - 1) >> 1
      if (heap[p][0] <= heap[i][0]) break
      ;[heap[p], heap[i]] = [heap[i], heap[p]]
      i = p
    }
  }
  const pop = () => {
    const top = heap[0]
    const lastItem = heap.pop()!
    if (heap.length) {
      heap[0] = lastItem
      for (let i = 0; ;) {
        const a = 2 * i + 1, b = a + 1
        let m = i
        if (a < heap.length && heap[a][0] < heap[m][0]) m = a
        if (b < heap.length && heap[b][0] < heap[m][0]) m = b
        if (m === i) break
        ;[heap[m], heap[i]] = [heap[i], heap[m]]
        i = m
      }
    }
    return top
  }
  for (const n of ends) { toSea.set(n, 0); cost.set(n, 0); push(0, n) }
  const LATE = 1e12
  // Stretches drawn the wrong way round are used only for what can't be reached otherwise:
  // first the way down as drawn (and across gaps); then, keeping everything found so far,
  // against the drawing too.
  const fixed = new Set<string>()
  const run = (reverse: boolean) => {
    while (heap.length) {
      const [c, n] = pop()
      if (c > (cost.get(n) ?? Infinity)) continue
      const here = toSea.get(n)!
      const tryUp = (up: string, step: Step, extra: number) => {
        if (fixed.has(up)) return
        const nc = c + extra
        if (nc < (cost.get(up) ?? Infinity)) { cost.set(up, nc); toSea.set(up, here + step.length); down.set(up, step); push(nc, up) }
      }
      for (const i of into.get(n) ?? []) tryUp(links[i].start, { to: n, length: links[i].length, link: i, kind: 'link' }, links[i].length)
      for (const b of bridgesTo.get(n) ?? []) tryUp(b.to, { to: n, length: b.length, link: b.link, kind: 'bridge' }, b.length)
      if (reverse) for (const i of out.get(n) ?? []) {
        if (links[i].form === 'canal') continue
        tryUp(links[i].end, { to: n, length: links[i].length, link: i, kind: 'reverse' }, links[i].length * REVERSE_COST)
      }
    }
  }
  const settle = () => { for (const n of toSea.keys()) fixed.add(n) }
  const again = () => { for (const n of toSea.keys()) push(cost.get(n)!, n) }
  run(false)
  settle(); again(); run(true)
  // Pieces of the map that still reach no end (their gaps only lead to each other) end at
  // their own dead ends.
  // Then the dead ends that aren't at the sea and couldn't be bridged, for what's left.
  settle()
  for (const n of lateEnds) if (!toSea.has(n)) { toSea.set(n, 0); cost.set(n, LATE); push(LATE, n) }
  run(false)
  settle(); again(); run(true)
  settle()
  for (const n of into.keys()) if (!out.has(n) && !toSea.has(n)) { lateEnds.add(n); toSea.set(n, 0); cost.set(n, 2 * LATE); push(2 * LATE, n) }
  run(false)
  settle(); again(); run(true)
  return { links, toSea, down, outs: out, grid, lateEnds }
}

export type Place = {
  /** The Open Rivers name of the stretch the gauge is on ("" when it has none). */
  link: string
  /** Lake, inland river, tidal river or canal (Open Rivers' "form"). */
  form: string
  /** How far the gauge is from that stretch, in metres. */
  snapM: number
  toSeaKm: number
  /** Where its way down ends (a node id): gauges with the same outlet share a river system. */
  outlet: string
  /** The rivers' names on the way down, in order, the gauge's own first (up to six). */
  route: string[]
  /** The first river its own river flows into, and the meeting point's distance to the sea. */
  joins: { river: string; toSeaKm: number } | null
}

const round2 = (x: number) => Math.round(x * 100) / 100

/** A gauge's place along its river, or null when no stretch is within SNAP_LIMIT_M. */
export function place(net: Network, e: number, n: number, river: string | null): Place | null {
  const want = normRiver(river)
  let best: { score: number; d: number; i: number; along: number; total: number } | null = null
  for (const i of nearby(net.grid, e, n)) {
    const l = net.links[i]
    const hit = nearestOn(l.xy, e, n)
    const score = hit.d - (want !== '' && normRiver(l.name) === want ? NAMED_BONUS_M : 0)
    if (!best || score < best.score) best = { score, d: hit.d, i, along: hit.along, total: hit.total }
  }
  if (!best || best.d > SNAP_LIMIT_M) return null
  const l = net.links[best.i]
  const endToSea = net.toSea.get(l.end)
  if (endToSea === undefined) return null
  const scale = best.total ? (l.length || best.total) / best.total : 1
  const toSea = endToSea + (best.total - best.along) * scale

  // The way down. Where a river splits (round an island, or into a side channel), stay on
  // a stretch with the same name if there is one, otherwise take the shortest way to the
  // sea. Unnamed stretches keep the name before them. A side channel comes back to its
  // river, so the river joins another only after the last place its own name appears.
  const own = want || normRiver(l.name)
  const events: { name: string; toSea: number }[] = [{ name: l.name, toSea }]
  let current = l.name
  let node = l.end
  const visited = new Set<string>([node])
  for (;;) {
    const here = node
    const ahead = net.down.get(node)
    const same = (net.outs.get(node) ?? []).filter((j) => current && normRiver(net.links[j].name) === normRiver(current) && net.toSea.has(net.links[j].end) && !visited.has(net.links[j].end))
    const step: Step | undefined = same.length
      ? same.map((j) => ({ to: net.links[j].end, length: net.links[j].length, link: j, kind: 'link' as const })).sort((a, b) => net.toSea.get(a.to)! - net.toSea.get(b.to)!)[0]
      : ahead
    if (!step || visited.has(step.to)) break
    const nm = net.links[step.link].name
    if (nm && normRiver(nm) !== normRiver(current)) {
      events.push({ name: nm, toSea: net.toSea.get(here) ?? 0 })
      current = nm
    }
    node = step.to
    visited.add(node)
  }
  let lastOwn = -1
  events.forEach((ev, i) => { if (normRiver(ev.name) === own) lastOwn = i })
  // The river joined: the first one after the gauge's own that runs for JOIN_MIN_KM or more
  // (or the last one), named at the point where the gauge's own river ends.
  const meet = lastOwn >= 0 ? events[lastOwn + 1] : undefined
  let joined: (typeof events)[number] | undefined
  for (let i = lastOwn + 1; meet && i < events.length; i++) {
    const runs = (events[i].toSea - (events[i + 1]?.toSea ?? 0)) / 1000
    if (events[i].name && (runs >= JOIN_MIN_KM || i === events.length - 1)) { joined = events[i]; break }
  }
  const joins = meet && joined ? { river: joined.name, toSeaKm: round2(meet.toSea / 1000) } : null
  const route = events.map((ev) => ev.name).filter(Boolean)
  return {
    link: l.name, form: l.form, snapM: Math.round(best.d), toSeaKm: round2(toSea / 1000), outlet: node,
    route: route.filter((r, i) => r !== route[i - 1]).slice(0, 8), joins,
  }
}
