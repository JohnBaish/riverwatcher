// The postcode view (SPEC §7; the agreed design, option B revised): flood warnings, the
// summary river by river, the nearest gauges grouped by river, and the chosen one in detail.

import { useEffect, useMemo, useRef, useState } from 'react'
import meta from 'virtual:riverwatcher/meta'
import { clock, longDate, metres, milesBetween, milesText, weekday } from '../lib/format.ts'
import { useParts, type Loaded } from '../lib/load.ts'
import { district } from '../lib/postcode.ts'
import type { PageGauge } from '../lib/pageTypes.ts'
import { useIsNarrow } from '../lib/responsive.ts'
import { bandDays, hourly, PERIODS, points, type Point, type Weeks } from '../lib/series.ts'
import {
  chip, comparisons, figureLine, heldNote, isSilent, joinsBetween, NEAR_MILES, nearestGauges, readingTime, riverGroups, shortChange, summary,
  changeFigure, type Ctx, type Group, type Item,
} from '../lib/view.ts'
import { Chart, Key } from './Chart.tsx'
import { saveChoice } from '../lib/route.ts'
import { numberWord } from '../lib/words.ts'
import type { Flood } from '../../scripts/lib/collect.ts'

const ctx: Ctx = { made: meta.made, date: meta.date }
const WEEKS_KEY = 'riverwatcher.weeks'

function savedWeeks(): Weeks {
  try {
    const w = Number(localStorage.getItem(WEEKS_KEY))
    return (PERIODS as readonly number[]).includes(w) ? (w as Weeks) : 2
  } catch {
    return 2
  }
}

export function Waiting<T>({ loaded, children }: { loaded: Loaded<T>; children: (value: T) => React.ReactNode }) {
  if (loaded.state === 'ready') return <>{children(loaded.value)}</>
  if (loaded.state === 'loading') return <p className="muted loading">Loading the river levels…</p>
  return (
    <div className="card load-failed" role="alert">
      <p>The river levels couldn't be loaded. Check your connection, then try again.</p>
      <button className="btn btn-secondary" type="button" onClick={() => location.reload()}>Try again</button>
    </div>
  )
}

export function JChip({ g }: { g: PageGauge }) {
  const c = chip(g, ctx)
  if (c.kind === 'plain') return <span className="jplain">{c.text}</span>
  return <span className={`jchip ${c.kind}`}>{c.text}</span>
}

/** The latest reading's time. */
const timeOf = (g: PageGauge) => (g.now ? readingTime(meta.made, g.now.age, meta.date) : '')
const latestPoint = (g: PageGauge): Point | null => (g.now ? [Date.parse(meta.made) - g.now.age * 60000, g.now.v] : null)

/** The two-week line in each row. */
export function Spark({ g, pts }: { g: PageGauge; pts: Point[] }) {
  if (!pts.length) return null
  const W = 120, H = 32, t1 = Date.parse(meta.made), t0 = t1 - 14 * 86400e3
  const all = [...pts, ...(latestPoint(g) ? [latestPoint(g)!] : [])]
  let lo = Math.min(...all.map((p) => p[1])), hi = Math.max(...all.map((p) => p[1]))
  if (g.span) { lo = Math.min(lo, g.span[0]); hi = Math.max(hi, g.span[1]) }
  const pad = (hi - lo) * 0.1 || 20
  lo -= pad; hi += pad
  const x = (t: number) => ((t - t0) / (t1 - t0)) * W, y = (v: number) => 2 + (1 - (v - lo) / (hi - lo)) * (H - 4)
  return <svg className="spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true"><path d={`M${pts.map(([t, v]) => `${x(t).toFixed(1)},${y(v).toFixed(1)}`).join('L')}`} /></svg>
}

function Floods({ at }: { at: [number, number] }) {
  return <FloodList floods={meta.floods.filter((f) => f.lat !== null && f.long !== null && milesBetween(at, [f.lat, f.long]) <= NEAR_MILES)} />
}

/** The flood warnings given (SPEC §7.2); nothing when there are none. */
export function FloodList({ floods: near, more = 0 }: { floods: Flood[]; more?: number }) {
  if (!near.length) return null
  return (
    <section className="warnings">
      {near.map((f) => {
        const t = f.changed ?? f.raised
        const when = t ? new Date(t) : null
        const today = when && new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(when) === meta.date
        return (
          <div className="card alert" role="note" key={f.id}>
            <span className="sev">{f.severity}</span>
            <h4>{f.area}</h4>
            <p>
              {when && <>Issued at {clock(when)} {today ? 'today' : `on ${weekday(when)}`}. </>}
              <a href={`https://check-for-flooding.service.gov.uk/target-area/${encodeURIComponent(f.id)}`} target="_blank" rel="noopener noreferrer">Read it on GOV.UK</a>
            </p>
          </div>
        )
      })}
      {more > 0 && <p className="note">And {numberWord(more)} more in force here: see GOV.UK's Check for flooding.</p>}
      <p className="not-service">Riverwatcher isn't a flood warning service. For warnings, see GOV.UK's Check for flooding or call Floodline on <span className="nowrap">0345 988 1188</span>.</p>
    </section>
  )
}

function GroupCard({ gr, code, nearest, selected, onSelect, narrow, spark }: { gr: Group; code: string; nearest: Item; selected: string; onSelect: (ref: string) => void; narrow: boolean; spark: (g: PageGauge) => Point[] }) {
  const notes = [gr.items.length > 1 ? 'Upstream to downstream' : null, gr.joins, gr.extra ? `Added: the nearest gauge to ${code} not held by a lock or weir.` : null].filter(Boolean) as string[]
  const near = (it: Item) => (it === nearest ? <span className="nearest">Nearest</span> : null)
  const rows = gr.items.map((it, k) => {
    const between = k > 0 ? joinsBetween(gr, gr.items[k - 1], it) : []
    const g = it.g
    const sel = g.ref === selected
    if (narrow) {
      return (
        <div key={g.ref}>
          {between.map((t) => <div className="b-join" key={t}>{t}</div>)}
          <button type="button" className="b-row" aria-pressed={sel} onClick={() => onSelect(g.ref)}>
            <span>
              <h4 className="gname">{g.name}{near(it)}</h4>
              <span className="gsub">{milesText(it.miles)} away</span>
              <span className="b-chip"><JChip g={g} /></span>
            </span>
            <span className="mono b-fig">
              <b>{g.now ? metres(g.now.v) : '–'}</b>
              <span className="note">{g.now && !isSilent(g) ? shortChange(g.now.ch) : ''}</span>
            </span>
          </button>
        </div>
      )
    }
    return [
      ...between.map((t) => <tr className="joins" key={t}><td colSpan={6}>{t}</td></tr>),
      <tr key={g.ref} aria-selected={sel} tabIndex={0} onClick={() => onSelect(g.ref)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(g.ref) } }}>
        <td><b>{g.name}</b>{near(it)}<div className="gsub">{milesText(it.miles)} away</div></td>
        <td><JChip g={g} /></td>
        <td className="mono"><b>{g.now ? metres(g.now.v) : '–'}</b><div className="note">{timeOf(g)}</div></td>
        <td>{g.now && !isSilent(g) ? <>{shortChange(g.now.ch) ?? '–'}{g.now.ch !== null && Math.abs(g.now.ch) < 20 && <div className="note">{changeFigure(g.now.ch)}</div>}</> : '–'}</td>
        <td>{g.yearAgo ? <>{metres(g.yearAgo.v)}{g.yearAgo.word && <div className="note">{g.yearAgo.word}</div>}</> : <span className="muted">–</span>}</td>
        <td><Spark g={g} pts={spark(g)} /></td>
      </tr>,
    ]
  })
  return (
    <div className="card river-group">
      <div className="river-head"><h4>{gr.name}</h4>{notes.map((n) => <span className="note" key={n}>{n}</span>)}</div>
      {narrow ? <div className="b-rows">{rows}</div> : (
        <table className="table r-table">
          <colgroup><col className="c1" /><col className="c2" /><col className="c3" /><col className="c4" /><col className="c5" /><col className="c6" /></colgroup>
          <thead><tr><th>Gauge</th><th>For the time of year</th><th>Latest</th><th>Last 24 hours</th><th>A year ago</th><th>Two weeks</th></tr></thead>
          <tbody>{rows}</tbody>
        </table>
      )}
    </div>
  )
}


/** The chart and its key, from the part the period needs (keyed by it, so a new part
 *  starts afresh). */
function ChartBlock({ part, g, weeks, narrow }: { part: 'hours' | 'hours42' | 'daily'; g: PageGauge; weeks: Weeks; narrow: boolean }) {
  const loaded = useParts([part])
  if (loaded.state === 'loading') return <p className="muted chart-wait">Loading the chart…</p>
  if (loaded.state === 'failed') return <p className="muted chart-wait">The chart couldn't be loaded. Check your connection, then try again.</p>
  const p = loaded.value[part]
  const pts = points(g, weeks, meta.made, p)
  const bands = bandDays(g, weeks, meta.made, p)
  return <><Chart g={g} weeks={weeks} made={meta.made} pts={pts} bands={bands} latest={latestPoint(g)} narrow={narrow} /><Key g={g} narrow={narrow} hasBands={bands.length > 0} /></>
}

/** The chosen gauge in detail. `sub` is the line under its name (river and distance, or
 *  river and county in an area view). */
export function Detail({ g, sub, narrow }: { g: PageGauge; sub: string; narrow: boolean }) {
  const [weeks, setWeeks] = useState<Weeks>(savedWeeks)
  const part = hourly(weeks) ? (weeks <= 2 ? 'hours' : 'hours42') : 'daily'
  const choose = (w: Weeks) => {
    setWeeks(w)
    try { localStorage.setItem(WEEKS_KEY, String(w)) } catch { /* kept for this visit only */ }
  }
  const fig = figureLine(g, ctx)
  const note = heldNote(g)
  const cmp = comparisons(g, ctx)
  return (
    <div className={`card b-detail${cmp.length ? '' : ' b-detail-one'}`} id="detail">
      <div>
        <h4 className="gname">{g.name}</h4>
        <div className="gsub">{sub}</div>
        <div className="detail-head">
          <p className="headline"><JChip g={g} /></p>
          {fig && (() => { const m = /^\d+\.\d\d m/.exec(fig)?.[0]; return <p className="figure">{m ? <><b className="mono">{m}</b>{fig.slice(m.length)}</> : fig}</p> })()}
          {note && <p className="held-note">{note}</p>}
        </div>
        <div className="periods-row">
          <span className="muted periods-label">Show the last</span>
          <span className="periods" role="group" aria-label="Period shown">
            {PERIODS.map((w) => <button type="button" key={w} aria-pressed={w === weeks} onClick={() => choose(w)}>{w === 52 ? 'year' : `${w} weeks`}</button>)}
          </span>
        </div>
        <ChartBlock key={part} part={part} g={g} weeks={weeks} narrow={narrow} />
      </div>
      {cmp.length > 0 && <ul className="cmp">{cmp.map(([k, v]) => <li key={k}><span className="k">{k}</span>{v}</li>)}</ul>}
    </div>
  )
}

export function PostcodeView({ code }: { code: string }) {
  const place = district(code)
  const narrow = useIsNarrow(720)
  const loaded = useParts(['gauges', 'hours'])
  const [selected, setSelected] = useState<string | null>(null)
  const detail = useRef<HTMLDivElement>(null)
  useEffect(() => { if (place) saveChoice({ kind: 'postcode', code }) }, [place, code])
  const at: [number, number] | null = place ? [place.latitude, place.longitude] : null
  const gauges = loaded.state === 'ready' ? loaded.value.gauges : null
  const items = useMemo(() => (gauges && at ? nearestGauges(gauges, at) : []), [gauges, at?.[0], at?.[1]]) // eslint-disable-line
  const groups = useMemo(() => riverGroups(items), [items])

  if (!place || !at) {
    return (
      <div className="card not-found" role="alert">
        <p>{code} isn't a postcode district in England. Riverwatcher covers England only.</p>
        <a className="btn btn-secondary" href="#choose">Choose again</a>
      </div>
    )
  }
  const select = (ref: string) => {
    setSelected(ref)
    if (narrow) requestAnimationFrame(() => detail.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }
  return (
    <>
      <div className="card strip">
        <h2>Near {code} ({place.name})</h2>
        <a className="btn btn-secondary" href="#choose" data-noprint>Change</a>
      </div>
      <div className="page-head">
        <div className="card-kicker">River levels nearby, with historical comparisons</div>
        <h2>{longDate(new Date(meta.made))}</h2>
      </div>
      <Floods at={at} />
      <Waiting loaded={loaded}>
        {({ hours }) => {
          const flat = groups.flatMap((gr) => gr.items)
          if (!flat.length) {
            return <div className="card roundup"><p>{summary(code, groups, ctx)}</p></div>
          }
          const nearest = flat.reduce((a, b) => (b.miles < a.miles ? b : a))
          const chosen = flat.find((i) => i.g.ref === selected) ?? nearest
          const spark = (g: PageGauge) => points(g, 2, meta.made, hours)
          return (
            <>
              <section className="source">
                <div className="section-head"><h3>Summary</h3></div>
                <div className="card roundup"><p>{summary(code, groups, ctx)}</p></div>
              </section>
              <section className="source">
                <div className="section-head"><h3>The nearest gauges, river by river</h3><span className="note">{narrow ? 'Tap' : 'Choose'} one to see it in detail.</span></div>
                {groups.map((gr) => <GroupCard key={gr.name} gr={gr} code={code} nearest={nearest} selected={chosen.g.ref} onSelect={select} narrow={narrow} spark={spark} />)}
                <div ref={detail} className="detail-anchor"><Detail key={chosen.g.ref} g={chosen.g} sub={[chosen.g.river, milesText(chosen.miles)].filter(Boolean).join(' · ')} narrow={narrow} /></div>
                <p className="data-credit">This uses Environment Agency flood and river level data from the real-time data API (Beta).</p>
              </section>
            </>
          )
        }}
      </Waiting>
    </>
  )
}
