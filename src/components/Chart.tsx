// A gauge's chart (SPEC §7.6; the agreed design, option B revised): the level over the chosen
// period, on the five judgement zones for each day (only the high ones at a held gauge), with
// a tooltip on hover or touch. Its height always covers the gauge's normal range over the
// whole year, so a small wobble looks small.

import { useRef, useState, type PointerEvent } from 'react'
import { clock, metres, shortDate } from '../lib/format.ts'
import type { PageGauge } from '../lib/pageTypes.ts'
import { CHART_LEFT, chartWidth, heights, type Band, type Point, type Weeks } from '../lib/series.ts'

function niceTicks(lo: number, hi: number, n: number): number[] {
  const span = hi - lo || 100, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0)!
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(v)
  return out
}


type Props = { g: PageGauge; weeks: Weeks; made: string; pts: Point[]; bands: [number, Band][]; latest: Point | null; narrow: boolean }

export function Chart({ g, weeks, made, pts, bands, latest, narrow }: Props) {
  const [hover, setHover] = useState<Point | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const W = chartWidth(narrow), H = narrow ? 220 : 230
  const all = latest ? [...pts, latest] : pts
  if (!all.length) return <p className="muted">No readings to chart.</p>
  const t1 = Date.parse(made), t0 = t1 - weeks * 7 * 86400e3
  const [lo, hi] = heights(g, all)
  // The Environment Agency's top of normal range, an absolute height, as a dashed line on
  // charts with the time-of-year bands (John, November 3rd). Where it's above the chart's usual
  // height it's said in words instead, so the chart isn't squashed. Charts without bands
  // already show the whole range as two grey dashed lines.
  const top = g.typical && bands.length ? g.typical[1] : null
  const topAbove = top !== null && top > hi
  const L = CHART_LEFT, R = 10, T = 10, B = 26
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - L - R)
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B)
  const f = (n: number) => n.toFixed(1)
  const ticks = niceTicks(lo, hi, 4)
  const zone = (lower: (b: Band) => number, upper: (b: Band) => number, c: string) => (
    // Clipped to the plotting area (the last day's band runs past now).
    <path key={c} className={`z ${c}`} d={`M${bands.map(([t, b]) => `${f(x(t))},${f(y(lower(b)))}`).join('L')}L${[...bands].reverse().map(([t, b]) => `${f(x(t))},${f(y(upper(b)))}`).join('L')}Z`} />
  )
  const held = g.held !== null
  const zones = !bands.length ? null : held
    ? [zone((b) => b[2], (b) => b[3], 'z-high'), zone((b) => b[3], () => hi, 'z-vhigh')]
    : [zone(() => lo, (b) => b[0], 'z-vlow'), zone((b) => b[0], (b) => b[1], 'z-low'), zone((b) => b[1], (b) => b[2], 'z-normal'), zone((b) => b[2], (b) => b[3], 'z-high'), zone((b) => b[3], () => hi, 'z-vhigh')]
  const nTicks = narrow ? 3 : 5
  /** A label for a dashed range line, put where it covers least of the river's line: at the right
   *  or left end, above or below its line (the preferred side first), inside the plotting area. */
  const rangeLabel = (v: number, text: string, prefer: 'above' | 'below') => {
    const w = text.length * 6.3, sides = prefer === 'above' ? (['above', 'below'] as const) : (['below', 'above'] as const)
    let best: { score: number; x: number; base: number; anchor: 'start' | 'end' } | null = null
    for (const end of ['right', 'left'] as const) for (const side of sides) {
      const base = side === 'above' ? y(v) - 5 : y(v) + 14
      const top = base - 11, bottom = base + 2
      if (top < T || bottom > H - B) continue
      const x1 = end === 'right' ? W - R - 4 - w : L + 4, x2 = x1 + w
      let score = 0
      for (const p of all) {
        const px = x(p[0]), py = y(p[1])
        if (px >= x1 - 3 && px <= x2 + 3 && py >= top - 3 && py <= bottom + 3) score += p === latest ? 20 : 1
      }
      if (!best || score < best.score) best = { score, x: end === 'right' ? W - R - 4 : L + 4, base, anchor: end === 'right' ? 'end' : 'start' }
    }
    const b = best ?? { x: W - R - 4, base: y(v) - 5, anchor: 'end' as const }
    return <text className="topline-t" x={b.x} y={b.base} textAnchor={b.anchor}>{text}</text>
  }
  const line = pts.length ? `M${pts.map(([t, v]) => `${f(x(t))},${f(y(v))}`).join('L')}` : ''

  function onMove(e: PointerEvent<SVGRectElement>) {
    const box = svg.current!.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    let best = all[0]
    for (const p of all) if (Math.abs(x(p[0]) - px) < Math.abs(x(best[0]) - px)) best = p
    setHover(best)
  }
  const isLatest = hover && latest && hover[0] === latest[0]
  const when = hover ? (weeks <= 6 || isLatest ? `${shortDate(new Date(hover[0]))}, ${clock(new Date(hover[0]))}` : shortDate(new Date(hover[0]))) : ''
  const label = `${g.name}: the level over the last ${weeks === 52 ? 'year' : `${weeks} weeks`}`

  return (
    <div className="chart-wrap">
      <svg ref={svg} className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        {ticks.map((v) => (
          <g key={v}>
            <line className="grid" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />
            <text className="axis-t" x={L - 6} y={y(v) + 4} textAnchor="end">{(v / 1000).toFixed(2)}</text>
          </g>
        ))}
        <clipPath id={`clip-${g.ref}`}><rect x={L} y={T} width={W - L - R} height={H - T - B} /></clipPath>
        <g clipPath={`url(#clip-${g.ref})`}>{zones}</g>
        {/* A gauge with no long record: both ends of the Environment Agency's normal range, in
            the same colour and style as the top line on other charts, each labelled (John,
            November 3rd). Each label goes where it covers least of the river's line. */}
        {!bands.length && g.typical && <>
          <line className="topline" x1={L} x2={W - R} y1={y(g.typical[1])} y2={y(g.typical[1])} />
          {rangeLabel(g.typical[1], `Top of normal range, ${metres(g.typical[1])}`, 'above')}
          <line className="topline" x1={L} x2={W - R} y1={y(g.typical[0])} y2={y(g.typical[0])} />
          {rangeLabel(g.typical[0], `Bottom of normal range, ${metres(g.typical[0])}`, 'below')}
        </>}
        {Array.from({ length: nTicks + 1 }, (_, i) => {
          const t = t0 + ((t1 - t0) * i) / nTicks
          return <text key={i} className="axis-t" x={x(t)} y={H - 6} textAnchor={i === 0 ? 'start' : i === nTicks ? 'end' : 'middle'}>{shortDate(new Date(t))}</text>
        })}
        {top !== null && !topAbove && <>
          <line className="topline" x1={L} x2={W - R} y1={y(top)} y2={y(top)} />
          {rangeLabel(top, `Top of normal range, ${metres(top)}`, 'above')}
        </>}
        {topAbove && <text className="topline-t" x={W - R - 4} y={T + 13} textAnchor="end">↑ Top of normal range, {metres(top!)}, is above the chart</text>}
        {line && <path className="line" d={line} />}
        {latest && <circle className="end" cx={x(latest[0])} cy={y(latest[1])} r={5} />}
        {hover && (
          <>
            <line className="cross" x1={x(hover[0])} x2={x(hover[0])} y1={T} y2={H - B} />
            <circle className="hdot" cx={x(hover[0])} cy={y(hover[1])} r={4} />
          </>
        )}
        {/* A mouse shows the tooltip while it's over the chart. A finger "leaves" as soon as it
            lifts, so on a touch screen the tooltip stays until the next tap (fresh look 4.1). */}
        <rect x={L} y={0} width={W - L - R} height={H} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHover(null) }} />
      </svg>
      {hover && (
        // Kept inside the chart at either end (fresh look 6.7).
        <div className={`tip${x(hover[0]) > W * 0.7 ? ' tip-left' : x(hover[0]) < W * 0.3 ? ' tip-right' : ''}`} style={{ left: `${(x(hover[0]) / W) * 100}%`, top: `${(y(hover[1]) / H) * 100}%` }}>
          {when}: {metres(hover[1])}{isLatest ? ' (latest)' : weeks > 6 ? ' (middle of the day’s range)' : ''}
        </div>
      )}
    </div>
  )
}

const ZONES: [string, string][] = [['vlow', 'Very low'], ['low', 'Low'], ['normal', 'Normal'], ['high', 'High'], ['vhigh', 'Very high']]

/** The key, aligned with the chart's own left edge (John, October 30th). */
export function Key({ g, narrow, hasBands, topLine }: { g: PageGauge; narrow: boolean; hasBands: boolean; topLine: boolean }) {
  const pad = `${((CHART_LEFT / chartWidth(narrow)) * 100).toFixed(2)}%`
  if (hasBands) {
    const zs = g.held !== null ? ZONES.slice(3) : ZONES
    return (
      <div className="legend" style={{ paddingLeft: pad }}>
        <span><i className="li-line" />Level</span>
        {zs.map(([c, w], i) => (
          <span key={c} className={i === zs.length - 1 ? 'nowrap' : undefined}><i className={`lz lz-${c}`} />{w}{i === zs.length - 1 ? ' for the time of year' : ''}</span>
        ))}
        {topLine && <span className="nowrap"><i className="li-top" />Environment Agency’s top of normal range</span>}
      </div>
    )
  }
  if (g.typical) return <div className="legend" style={{ paddingLeft: pad }}><span><i className="li-line" />Level</span><span className="nowrap"><i className="li-top" />Environment Agency’s normal range</span></div>
  return <div className="legend" style={{ paddingLeft: pad }}><span><i className="li-line" />Level</span></div>
}
