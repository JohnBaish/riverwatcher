// "About these figures" (SPEC §9: Claude's draft with John's changes of October 30th; the
// last two paragraphs' new sentences are drafts for John, October 31st) and the credits (§10).

export function AboutFigures() {
  return (
    <section className="card about">
      <h3>About these figures</h3>
      <p>
        Riverwatcher shows river levels measured by the Environment Agency's gauges. These usually collect data every 15
        minutes, and Riverwatcher fetches that information once an hour. Recent figures are provisional: the Environment
        Agency checks them later and sometimes corrects them.
      </p>
      <p>
        Heights are above each gauge's own zero, not the depth of the river, so the figures for different gauges can't be
        compared with each other.
      </p>
      <p>
        "For the time of year" compares the last 24 hours with the same gauge's levels on the days a week either side of
        today's date, in every year on record. There's a lot of variation in when the historical records for each gauge
        start. Just under half the gauges have records from before 2000, a few go back to the 1950s, and some started only
        in the last few years; each gauge's figures say the year its record begins. Normal is the middle half of those
        days; low and high are the next 15% on each side; very low and very high are the lowest and highest 10%.
        {' '}<span className="draft">Where a gauge's record has a long gap, its figures say "History incomplete" and when the gap was.</span>
      </p>
      <p>
        On rivers with locks and weirs, such as the Thames, the level is kept steady for boats, so it rises in very wet
        weather but doesn't tell us much about low water. For these, Riverwatcher only says when the level is high.
        {' '}<span className="draft">Drains and rhynes in the fens and levels are treated the same way, as their levels are usually set by pumping.</span>
        {' '}Where a gauge has no long record, Riverwatcher uses the Environment Agency's own usual range for it, which covers
        the whole year.
        {' '}<span className="draft">A few gauges have neither, so Riverwatcher shows how their level has moved but not whether it is high or low.</span>
      </p>
      <p>Rivers are listed upstream to downstream, using Ordnance Survey's map of rivers.</p>
    </section>
  )
}

export function Credits() {
  return (
    <p className="credits">
      This uses Environment Agency flood and river level data from the real-time data API (Beta). Contains public sector
      information licensed under the Open Government Licence v3.0. Contains OS data © Crown Copyright and database rights
      2026. Contains Royal Mail data © Royal Mail copyright and database right 2026. Contains National Statistics data ©
      Crown copyright and database right 2026.
    </p>
  )
}
