// The county, region and England views (SPEC §8.2; stage 4, drafted for John): the summary,
// the most unusual high and low gauges (held gauges only on the high side), then every gauge
// folded away, highest for the time of year first (a county), or the ten highest and ten
// lowest (a region or England, as Hindcaster's), and the chosen gauge in detail.

import { useEffect, useRef, useState } from 'react'
import meta from 'virtual:riverwatcher/meta'
import { areaFloods, areaGauges, areaSummary, byRank, ends, inPlace, rankLine, rankOf, type AreaKind } from '../lib/area.ts'
import { capital, longDate, metres } from '../lib/format.ts'
import { useParts } from '../lib/load.ts'
import type { AreaChoice, PageGauge } from '../lib/pageTypes.ts'
import { useIsNarrow } from '../lib/responsive.ts'
import { saveChoice } from '../lib/route.ts'
import { points, type Point } from '../lib/series.ts'
import { changeFigure, isSilent, readingTime, shortChange, type Ctx } from '../lib/view.ts'
import { countOf } from '../lib/words.ts'
import { Detail, FloodList, JChip, Spark, Waiting } from './PostcodeView.tsx'

const ctx: Ctx = { made: meta.made, date: meta.date }
/** The most flood warnings listed in a region or England before "and N more". */
const FLOODS_SHOWN = 10
const TOP = 3
const timeOf = (g: PageGauge) => (g.now ? readingTime(meta.made, g.now.age, meta.date) : '')

/** The line under a gauge's name: its river, and its county in a region or England. */
const subOf = (g: PageGauge, kind: AreaKind) => [g.river, kind === 'county' ? null : g.county?.replace(/ ceremonial county$/, '')].filter(Boolean).join(' · ')

function Rows({ gauges, kind, selected, onSelect, narrow, spark }: { gauges: PageGauge[]; kind: AreaKind; selected: string; onSelect: (ref: string) => void; narrow: boolean; spark: (g: PageGauge) => Point[] }) {
  if (narrow) {
    return (
      <div className="card river-group"><div className="b-rows">
        {gauges.map((g) => (
          <button type="button" className="b-row" key={g.ref} aria-pressed={g.ref === selected} onClick={() => onSelect(g.ref)}>
            <span>
              <h4 className="gname">{g.name}</h4>
              <span className="gsub">{subOf(g, kind)}</span>
              <span className="b-chip"><JChip g={g} /></span>
            </span>
            <span className="mono b-fig">
              <b>{g.now ? metres(g.now.v) : '–'}</b>
              <span className="note">{g.now && !isSilent(g) ? shortChange(g.now.ch) : ''}</span>
            </span>
          </button>
        ))}
      </div></div>
    )
  }
  return (
    <div className="card river-group">
      <table className="table r-table a-table">
        <colgroup><col className="c1" /><col className="c2" /><col className="c3" /><col className="c4" /><col className="c6" /></colgroup>
        <thead><tr><th>Gauge</th><th>For the time of year</th><th>Latest</th><th>Last 24 hours</th><th>Two weeks</th></tr></thead>
        <tbody>
          {gauges.map((g) => (
            <tr key={g.ref} aria-selected={g.ref === selected} tabIndex={0} onClick={() => onSelect(g.ref)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(g.ref) } }}>
              <td><b>{g.name}</b><div className="gsub">{subOf(g, kind)}</div></td>
              <td><JChip g={g} /></td>
              <td className="mono"><b>{g.now ? metres(g.now.v) : '–'}</b><div className="note">{timeOf(g)}</div></td>
              <td>{g.now && !isSilent(g) ? <>{shortChange(g.now.ch) ?? '–'}{g.now.ch !== null && Math.abs(g.now.ch) < 20 && <div className="note">{changeFigure(g.now.ch)}</div>}</> : '–'}</td>
              <td><Spark g={g} pts={spark(g)} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** One side of "the most unusual": up to three gauges, each a button to see it in detail. */
function EndCard({ title, gauges, empty, kind, selected, onSelect }: { title: string; gauges: PageGauge[]; empty: string; kind: AreaKind; selected: string; onSelect: (ref: string) => void }) {
  return (
    <div className="card end-card">
      <div className="card-kicker">{title}</div>
      {gauges.length === 0 ? <p className="muted">{empty}</p> : (
        <ol className="end-list">
          {gauges.map((g) => (
            <li key={g.ref}>
              <button type="button" className="end-item" aria-pressed={g.ref === selected} onClick={() => onSelect(g.ref)}>
                <span className="gname">{g.name}</span>
                <span className="gsub">{subOf(g, kind)}</span>
                <span className="b-chip"><JChip g={g} /></span>
                {rankLine(g, ctx) && <span className="note">{rankLine(g, ctx)}</span>}
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Area({ kind, name, os }: { kind: AreaKind; name: string; os?: string }) {
  const narrow = useIsNarrow(720)
  const loaded = useParts(['gauges', 'hours'])
  const [selected, setSelected] = useState<string | null>(null)
  const detail = useRef<HTMLDivElement>(null)
  const where = inPlace(name)
  return (
    <>
      <div className="card strip">
        <h2>{name}</h2>
        <a className="btn btn-secondary" href="#choose" data-noprint>Change</a>
      </div>
      <div className="page-head">
        <div className="card-kicker">River levels {kind === 'england' ? 'across England' : where}, with historical comparisons</div>
        <h2>{longDate(new Date(meta.made))}</h2>
      </div>
      <Waiting loaded={loaded}>
        {({ gauges: all, hours }) => {
          const inArea = (g: PageGauge) => (kind === 'england' ? g.region !== null : kind === 'county' ? g.county === os : g.region === os)
          const gauges = areaGauges(all, kind, os)
          const floods = areaFloods(meta.floods, all, inArea)
          const wide = kind !== 'county'
          const shownFloods = wide ? floods.slice(0, FLOODS_SHOWN) : floods
          const top = ends(gauges, TOP, meta.date)
          const ranked = byRank(gauges, meta.date)
          const rankable = ranked.filter((g) => rankOf(g) !== null)
          const highest = rankable.slice(0, 10)
          const lowest = rankable.filter((g) => g.j.basis === 'history').reverse().slice(0, 10)
          const first = top.high[0] ?? top.low[0] ?? ranked[0]
          const chosen = gauges.find((g) => g.ref === selected) ?? first
          const select = (ref: string) => {
            setSelected(ref)
            requestAnimationFrame(() => detail.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
          }
          const spark = (g: PageGauge) => points(g, 2, meta.made, hours)
          const rows = (gs: PageGauge[]) => <Rows gauges={gs} kind={kind} selected={chosen?.ref ?? ''} onSelect={select} narrow={narrow} spark={spark} />
          return (
            <>
              <FloodList floods={shownFloods} more={floods.length - shownFloods.length} />
              <section className="source">
                <div className="section-head"><h3>Summary</h3></div>
                <div className="card roundup"><p>{areaSummary(name, gauges, ctx).join(' ')}</p></div>
              </section>
              {gauges.length > 0 && (
                <section className="source">
                  <div className="section-head"><h3>The most unusual for the time of year</h3><span className="note">{narrow ? 'Tap' : 'Choose'} a gauge to see it in detail.</span></div>
                  <div className="ends">
                    <EndCard title="Highest" gauges={top.high} kind={kind} selected={chosen?.ref ?? ''} onSelect={select}
                      empty={`No river gauge ${where} is high for the time of year.`} />
                    <EndCard title="Lowest" gauges={top.low} kind={kind} selected={chosen?.ref ?? ''} onSelect={select}
                      empty={`No river gauge ${where} is low for the time of year.`} />
                  </div>
                  {!wide && (
                    <details className="all-gauges">
                      <summary>All {countOf(gauges.length, 'gauge')} {where}, highest for the time of year first</summary>
                      {rows(ranked)}
                    </details>
                  )}
                  {wide && highest.length > 0 && (
                    <details className="all-gauges">
                      <summary>The ten highest for the time of year</summary>
                      {rows(highest)}
                    </details>
                  )}
                  {wide && lowest.length > 0 && (
                    <details className="all-gauges">
                      <summary>The ten lowest for the time of year</summary>
                      {rows(lowest)}
                    </details>
                  )}
                  {chosen && <div ref={detail} className="detail-anchor"><Detail key={chosen.ref} g={chosen} sub={subOf(chosen, kind) || capital(chosen.county ?? '')} narrow={narrow} /></div>}
                  <p className="data-credit">This uses Environment Agency flood and river level data from the real-time data API (Beta).</p>
                </section>
              )}
            </>
          )
        }}
      </Waiting>
    </>
  )
}

function NotFound({ text }: { text: string }) {
  return (
    <div className="card not-found" role="alert">
      <p>{text}</p>
      <a className="btn btn-secondary" href="#choose">Choose again</a>
    </div>
  )
}

export function AreaView({ kind, slug }: { kind: AreaKind; slug?: string }) {
  const list: AreaChoice[] = kind === 'county' ? meta.counties : kind === 'region' ? meta.regions : []
  const a = kind === 'england' ? null : list.find((x) => x.slug === slug)
  useEffect(() => {
    if (kind === 'england') saveChoice({ kind: 'england' })
    else if (a) saveChoice({ kind, slug: a.slug })
  }, [kind, a])
  if (kind === 'england') return <Area kind="england" name="England" />
  if (!a) return <NotFound text={`There's no ${kind} with that name in Riverwatcher's list.`} />
  return <Area key={a.slug} kind={kind} name={a.name} os={a.os} />
}
