// A gauge's chart (SPEC §7.6; the agreed design, option B revised): the level over the chosen
// period, on the five judgement zones for each day (only the high ones at a held gauge), with
// a tooltip on hover or touch. Its height always covers the gauge's usual range over the
// whole year, so a small wobble looks small.

import { useRef, useState, type PointerEvent } from 'react'
import { clock, metres, shortDate } from '../lib/format.ts'
import type { PageGauge } from '../lib/pageTypes.ts'
import { CHART_LEFT, chartWidth, type Band, type Point, type Weeks } from '../lib/series.ts'

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
  let lo = Math.min(...all.map((p) => p[1])), hi = Math.max(...all.map((p) => p[1]))
  if (g.span) { lo = Math.min(lo, g.span[0]); hi = Math.max(hi, g.span[1]) }
  const pad = (hi - lo) * 0.08 || 50
  lo -= pad; hi += pad
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
        {!bands.length && g.typical && g.typical.map((v) => <line key={v} className="typ" x1={L} x2={W - R} y1={y(v)} y2={y(v)} />)}
        {Array.from({ length: nTicks + 1 }, (_, i) => {
          const t = t0 + ((t1 - t0) * i) / nTicks
          return <text key={i} className="axis-t" x={x(t)} y={H - 6} textAnchor={i === 0 ? 'start' : i === nTicks ? 'end' : 'middle'}>{shortDate(new Date(t))}</text>
        })}
        {line && <path className="line" d={line} />}
        {latest && <circle className="end" cx={x(latest[0])} cy={y(latest[1])} r={5} />}
        {hover && (
          <>
            <line className="cross" x1={x(hover[0])} x2={x(hover[0])} y1={T} y2={H - B} />
            <circle className="hdot" cx={x(hover[0])} cy={y(hover[1])} r={4} />
          </>
        )}
        <rect x={L} y={0} width={W - L - R} height={H} fill="transparent" onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)} />
      </svg>
      {hover && (
        <div className="tip" style={{ left: `${(x(hover[0]) / W) * 100}%`, top: `${(y(hover[1]) / H) * 100}%` }}>
          {when}: {metres(hover[1])}{isLatest ? ' (latest)' : weeks > 6 ? ' (day’s usual level)' : ''}
        </div>
      )}
    </div>
  )
}

const ZONES: [string, string][] = [['vlow', 'Very low'], ['low', 'Low'], ['normal', 'Normal'], ['high', 'High'], ['vhigh', 'Very high']]

/** The key, aligned with the chart's own left edge (John, October 30th). */
export function Key({ g, narrow, hasBands }: { g: PageGauge; narrow: boolean; hasBands: boolean }) {
  const pad = `${((CHART_LEFT / chartWidth(narrow)) * 100).toFixed(2)}%`
  if (hasBands) {
    const zs = g.held !== null ? ZONES.slice(3) : ZONES
    return (
      <div className="legend" style={{ paddingLeft: pad }}>
        <span><i className="li-line" />Level</span>
        {zs.map(([c, w], i) => (
          <span key={c} className={i === zs.length - 1 ? 'nowrap' : undefined}><i className={`lz lz-${c}`} />{w}{i === zs.length - 1 ? ' for the time of year' : ''}</span>
        ))}
      </div>
    )
  }
  if (g.typical) return <div className="legend" style={{ paddingLeft: pad }}><span><i className="li-line" />Level</span><span><i className="li-typ" />The Environment Agency's usual range</span></div>
  return <div className="legend" style={{ paddingLeft: pad }}><span><i className="li-line" />Level</span></div>
}
