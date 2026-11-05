// The county, region and England views (SPEC §8.2; stage 4, drafted for John): the summary,
// the most unusual high and low gauges (held gauges only on the high side), then every gauge
// folded away, highest for the time of year first (a county), or up to ten high and ten low
// gauges (a region or England), and the chosen gauge in detail.

import { useEffect, useState, type ReactNode } from 'react'
import meta from 'virtual:riverwatcher/meta'
import { areaFloods, areaGauges, areaSummary, byRank, ends, IN_COMBINATION, inArea, inPlace, listLabel, rankLine, TEN, type AreaKind } from '../lib/area.ts'
import { capital, longDate, metres, placeLine } from '../lib/format.ts'
import { useParts } from '../lib/load.ts'
import type { AreaChoice, PageGauge } from '../lib/pageTypes.ts'
import { useIsNarrow } from '../lib/responsive.ts'
import { saveChoice } from '../lib/route.ts'
import { points, type Point } from '../lib/series.ts'
import { changeFigure, isSilent, isSteady, readingTime, shortChange, type Ctx } from '../lib/view.ts'
import { countOf } from '../lib/words.ts'
import { CollectedLine, Detail, FloodList, JChip, Spark, Waiting } from './PostcodeView.tsx'

const ctx: Ctx = { made: meta.made, date: meta.date }
const TOP = 3
/** Which list a gauge was chosen from: a gauge can be in more than one, and its details open
 *  under the row that was tapped (John, November 3rd). */
type ListId = 'high' | 'low' | 'all' | 'tenHigh' | 'tenLow' | 'none'
type Choice = { ref: string; list: ListId }
const timeOf = (g: PageGauge) => (g.now ? readingTime(meta.made, g.now.age, meta.date) : '')

/** The line under a gauge's name: its river, and its county in a region or England. */
const subOf = (g: PageGauge, kind: AreaKind) =>
  capital([g.river, g.place && placeLine(g.place, false), kind === 'county' ? null : g.county?.replace(/ ceremonial county$/, '')].filter(Boolean).join(' · '))

function Rows({ gauges, kind, list, chosen, onSelect, narrow, spark, detail }: { gauges: PageGauge[]; kind: AreaKind; list: ListId; chosen: Choice | null; onSelect: (c: Choice) => void; narrow: boolean; spark: (g: PageGauge) => Point[]; detail: ReactNode }) {
  const isSel = (g: PageGauge) => chosen?.ref === g.ref && chosen.list === list
  if (narrow) {
    return (
      <div className="card river-group"><div className="b-rows">
        {gauges.map((g) => (
          <div key={g.ref}>
          <button type="button" className="b-row" aria-pressed={isSel(g)} data-chosen={isSel(g) || undefined} onClick={() => onSelect({ ref: g.ref, list })}>
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
          {isSel(g) && detail}
          </div>
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
          {gauges.flatMap((g) => [
            <tr key={g.ref} aria-selected={isSel(g)} data-chosen={isSel(g) || undefined} tabIndex={0} onClick={() => onSelect({ ref: g.ref, list })} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect({ ref: g.ref, list }) } }}>
              <td><b className={isSel(g) ? 'gname-chosen' : undefined}>{g.name}</b><div className="gsub">{subOf(g, kind)}</div></td>
              <td><JChip g={g} /></td>
              <td className="mono"><b>{g.now ? metres(g.now.v) : '–'}</b><div className="note">{timeOf(g)}</div></td>
              <td>{g.now && !isSilent(g) ? <>{shortChange(g.now.ch) ?? '–'}{g.now.ch !== null && isSteady(g.now.ch) && <div className="note">{changeFigure(g.now.ch)}</div>}</> : '–'}</td>
              <td><Spark g={g} pts={spark(g)} /></td>
            </tr>,
            ...(isSel(g) ? [<tr className="detail-row" key={`${g.ref}-detail`}><td colSpan={5}>{detail}</td></tr>] : []),
          ])}
        </tbody>
      </table>
    </div>
  )
}

/** One side of "the most unusual": up to three gauges, each a button to see it in detail. */
function EndCard({ title, gauges, empty, kind, list, chosen, onSelect, detail }: { title: string; gauges: PageGauge[]; empty: string; kind: AreaKind; list: ListId; chosen: Choice | null; onSelect: (c: Choice) => void; detail: ReactNode }) {
  const isSel = (g: PageGauge) => chosen?.ref === g.ref && chosen.list === list
  return (
    <div className="card end-card">
      <div className="card-kicker">{title}</div>
      {gauges.length === 0 ? <p className="muted">{empty}</p> : (
        <ol className="end-list">
          {gauges.map((g) => (
            <li key={g.ref}>
              <button type="button" className="end-item" aria-pressed={isSel(g)} data-chosen={isSel(g) || undefined} onClick={() => onSelect({ ref: g.ref, list })}>
                <span className="gname">{g.name}</span>
                <span className="gsub">{subOf(g, kind)}</span>
                <span className="b-chip"><JChip g={g} /></span>
                {rankLine(g, ctx) && <span className="note">{rankLine(g, ctx)}</span>}
              </button>
              {isSel(g) && detail}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function Area({ kind, name, os, refs }: { kind: AreaKind; name: string; os?: string; refs?: string[] }) {
  const narrow = useIsNarrow(720)
  const loaded = useParts(['gauges', 'hours'])
  const [selected, setSelected] = useState<Choice | null>(null)
  // A combination's name lists counties, so sentences say "in this combined area" (John).
  const where = kind === 'combination' ? IN_COMBINATION : inPlace(name)
  return (
    <>
      <div className="card strip">
        <h2>{name}</h2>
        <a className="btn btn-secondary" href="#choose" data-noprint>Change</a>
      </div>
      <div className="page-head">
        <div className="card-kicker">River levels {kind === 'england' ? 'across England' : where}, with historical comparisons</div>
        <h2>{longDate(new Date(meta.made))}</h2>
        <CollectedLine />
      </div>
      <Waiting loaded={loaded}>
        {({ gauges: all, hours }) => {
          const gauges = areaGauges(all, kind, os, refs)
          const floods = areaFloods(meta.floods, all, (g) => inArea(g, kind, os, refs))
          // A county or a combined area lists every gauge; a region or England, the ten
          // highest and lowest.
          const wide = kind === 'region' || kind === 'england'
          const top = ends(gauges, TOP, meta.date)
          const ranked = byRank(gauges, meta.date)
          // Only gauges that really are high or low, at most ten (John, November 2nd, option B).
          const real = ends(gauges, Infinity, meta.date)
          const highest = real.high.slice(0, TEN), lowest = real.low.slice(0, TEN)
          const first = top.high[0] ?? top.low[0] ?? ranked[0]
          // Until one is tapped, the first of the most unusual is shown, under its own entry.
          const choice: Choice | null = selected && gauges.some((g) => g.ref === selected.ref) ? selected
            : first ? { ref: first.ref, list: top.high[0] ? 'high' : top.low[0] ? 'low' : 'none' } : null
          const chosen = choice ? gauges.find((g) => g.ref === choice.ref) ?? null : null
          const select = (c: Choice) => {
            setSelected(c)
            // The chosen entry to the top, its details just below it (John, November 3rd).
            requestAnimationFrame(() => document.querySelector('[data-chosen]')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
          }
          const spark = (g: PageGauge) => points(g, 2, meta.made, hours)
          const detail = chosen ? <Detail key={`${chosen.ref}-${choice!.list}`} g={chosen} sub="" narrow={narrow} inline /> : null
          // The two "most unusual" cards sit side by side on a computer, too narrow for the
          // details, so there they open just below the pair, with the gauge's name, line and
          // label back on, as they're away from the entry (John, November 3rd); on a phone, under
          // the entry. With nothing high or low, the first gauge's details stay below the cards.
          const fullDetail = chosen ? <Detail key={`${chosen.ref}-full`} g={chosen} sub={subOf(chosen, kind) || capital(chosen.county ?? '')} narrow={narrow} /> : null
          const endOnPhone = narrow && (choice?.list === 'high' || choice?.list === 'low')
          const belowEnds = choice && !endOnPhone && (choice.list === 'high' || choice.list === 'low' || choice.list === 'none')
          const rows = (gs: PageGauge[], list: ListId) => <Rows gauges={gs} kind={kind} list={list} chosen={choice} onSelect={select} narrow={narrow} spark={spark} detail={detail} />
          return (
            <>
              <FloodList floods={floods} fold={kind === 'county' ? 'alerts' : 'both'} />
              <section className="source">
                <div className="section-head"><h3>Summary</h3></div>
                <div className="card roundup"><p>{areaSummary(name, gauges, ctx, where).join(' ')}</p></div>
              </section>
              {gauges.length > 0 && (
                <section className="source">
                  <div className="section-head"><h3>The most unusual for the time of year</h3><span className="note">{narrow ? 'Tap' : 'Choose'} a gauge to see it in detail.</span></div>
                  <div className="ends">
                    <EndCard title="Highest" gauges={top.high} kind={kind} list="high" chosen={choice} onSelect={select} detail={endOnPhone ? detail : null}
                      empty={`No river gauge ${where} is high for the time of year.`} />
                    <EndCard title="Lowest" gauges={top.low} kind={kind} list="low" chosen={choice} onSelect={select} detail={endOnPhone ? detail : null}
                      empty={`No river gauge ${where} is low for the time of year.`} />
                  </div>
                  {belowEnds && fullDetail}
                  {!wide && (
                    <details className="all-gauges">
                      <summary>All {countOf(gauges.length, 'gauge')} {where}, with the highest for the time of year first</summary>
                      {rows(ranked, 'all')}
                    </details>
                  )}
                  {wide && highest.length > 0 && (
                    <details className="all-gauges">
                      <summary>{listLabel(real.high.length, 'high')}</summary>
                      {rows(highest, 'tenHigh')}
                    </details>
                  )}
                  {wide && lowest.length > 0 && (
                    <details className="all-gauges">
                      <summary>{listLabel(real.low.length, 'low')}</summary>
                      {rows(lowest, 'tenLow')}
                    </details>
                  )}
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
  const a = kind === 'england' || kind === 'combination' ? null : list.find((x) => x.slug === slug)
  const combo = kind === 'combination' ? meta.combinations.find((x) => x.slug === slug) : undefined
  useEffect(() => {
    if (kind === 'england') saveChoice({ kind: 'england' })
    else if (kind === 'combination' && combo) saveChoice({ kind, slug: combo.slug })
    else if (a && kind !== 'combination') saveChoice({ kind, slug: a.slug })
  }, [kind, a, combo])
  if (kind === 'england') return <Area kind="england" name="England" />
  if (kind === 'combination') {
    if (!combo) return <NotFound text="There's no combined area with that name in Riverwatcher's list." />
    return <Area key={combo.slug} kind="combination" name={combo.name} refs={combo.refs} />
  }
  if (!a) return <NotFound text={`There's no ${kind} with that name in Riverwatcher's list.`} />
  return <Area key={a.slug} kind={kind} name={a.name} os={a.os} />
}
