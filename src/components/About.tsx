// "About these figures" (SPEC §9, agreed by John on November 2nd) and the credits (§10).

export function AboutFigures() {
  return (
    <section className="card about" data-noprint>
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
        The dashed line on the charts is the top of the Environment Agency's normal range for that gauge. It's a fixed
        height, the same all year round, so it can help show whether the river is high enough to reach a path or bank you
        know. It isn't the same as "high for the time of year": a river can be very high for the season and still be well
        below it. Where the top of the normal range is well above the river's usual levels, the chart says so rather than
        drawing the line.
      </p>
      <p>
        "For the time of year" compares the last 24 hours with the same gauge's levels on the days a week either side of
        today's date, in every year on record. There's a lot of variation in when the historical records for each gauge
        start. Just under half the gauges have records from before 2000, a few go back to the 1950s, and some started only
        in the last few years; each gauge's figures say the year its record begins. Normal is the middle half of those
        days; low and high are the next 15% on each side; very low and very high are the lowest and highest 10%.
        {' '}Where a gauge's record has a long gap, its figures say "History incomplete" and when the gap was.
      </p>
      <p>
        On rivers with locks and weirs, such as the Thames, the level is kept steady for boats, so it rises in very wet
        weather but doesn't tell us much about low water. For these, Riverwatcher only says when the level is high.
        {' '}Drains and rhynes in the fens and levels are treated the same way, as their levels are usually set by pumping.
        {' '}Where a gauge has no long record, Riverwatcher uses the Environment Agency's own normal range for it, which covers
        the whole year.
        {' '}A few gauges have neither, so Riverwatcher shows how their level has moved but not whether it is high or low.
        {' '}Gauges whose level hasn't moved for weeks, or that keep repeating the same reading, are left out, as they're
        probably faulty.
      </p>
      <p>Rivers are listed upstream to downstream, using Ordnance Survey's map of rivers.</p>
      <p>
        In a county, a region, or in the England view, the summary counts only gauges that can be compared with past years.
        Those on rivers with locks and weirs, and fen drains, are only counted when they're high. "The most unusual" are the
        gauges that are higher or lower for the time of year than they have been for the longest period of time, so a river
        at its lowest since 1967 comes before one at its lowest since 2022.
      </p>
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
