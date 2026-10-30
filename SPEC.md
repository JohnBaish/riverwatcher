# Riverwatcher — specification

**River levels nearby, with historical comparisons.** A free-to-use personal project by John
Baish, at `riverwatcher.baish.net`.

This file is the design, for John to agree before anything is built. `PLAN.md` says what gets
built in what order. `HOUSE-STYLE.md` (copied from `JohnBaish/clockwheel`, which holds the
master copy) covers everything shared with the other tools: colours, type, buttons, phone
rules, dark mode, hosting and ways of working. Where this file is silent, follow the house
style; where they disagree, ask John.

It draws on: John's research notes (`design/research-notes-2026-10-25.md`), the data tests
(`design/data-tests-2026-10-30.md`), John's answers on the page's content
(`design/content-answers-2026-10-30.md`), the research on locks
(`design/locks-research-2026-10-30.md`) and the agreed design, option B revised
(`design/mockups/options.html`, online at https://claude.ai/artifact/SK5qN1PJKSYwgqqJXEpNDG).

**Status, Friday October 30th 2026.** **Agreed** means John has said yes. **Proposed** means
Claude's draft, for John to confirm, change or turn down. Section 13 lists the questions and
John's answers; all are answered.

---

## 1. What it does (Agreed)

A visitor enters a postcode (or picks a county, a region or England) and sees the river gauges
nearby: each one's latest level, whether it is high or low **for the time of year**, how it has
moved over the last two weeks to a year, and how it compares with the same gauge's past years.
Gauges are grouped by river and listed in the river's order. Flood warnings in force nearby are
shown at the top.

Its point is comparison: the EA's own pages give the level, but not whether it is unusual for
the time of year.

**Not in the first version:** tidal and groundwater gauges, rainfall, and river flow (§12).
England only, as the Environment Agency covers England.

## 2. Data sources (Agreed)

All Environment Agency open data under the Open Government Licence, no registration, plus
Ordnance Survey open data.

### 2a. EA real-time flood-monitoring API

`environment.data.gov.uk/flood-monitoring`. The latest level for every gauge in one request
(`/data/readings?latest`, which the EA's documentation recommends instead of asking each
gauge in turn), the gauge list with each gauge's measures and its EA "typical range"
(`/id/stations`), the last four weeks of 15-minute readings per gauge, and flood warnings in
force (`/id/floods`, with each warning's flood area from `/id/floodAreas`). Readings are
provisional. The EA asks for: "This uses Environment Agency flood and river level data from the
real-time data API (Beta)."

### 2b. EA Hydrology API (the archive)

`environment.data.gov.uk/hydrology`. Each gauge's daily highest and lowest level, back to the
1990s at most gauges (1976 at Portinscale). Matched to a live gauge by the same reference
(`wiskiID` or `stationReference`). One request gives every gauge's daily figures for a date (about
2,360 stations, 0.8 MB, five seconds; tested October 30th). Recent days are "Unchecked". Every day
before about 2015 is marked "Incomplete" even when its highest and lowest are there, so
completeness is ignored and only "Suspect" and "Missing" days are left out (data tests). A
record starts in the first year with most of its days present: some gauges have a stray early
reading (Roe Bridge on the Brock has one day in 1919, then nothing for decades). Checked October
30th, all 2,184 river gauges with history: 1,088 start before 2000, 365 before 1980, 153 since
2020; the earliest full record is the Severn at Montford, from 1952.

### 2c. Ordnance Survey

- **OS Open Names**, through Lightreader's `src/data/outcodes.json`: the middle of each of
  England's 2,210 postcode districts. Credits: the OS, Royal Mail and National Statistics lines.
- **OS Open Rivers** (38 MB, downloaded when the gauge list is built, not kept): every river in
  Great Britain and which way it flows. Gives each gauge's place along its river and where a
  tributary joins. Credit: "Contains Ordnance Survey data © Crown copyright and database right
  2026".
- **OS Boundary-Line**, as in Hindcaster's `scripts/build-areas.ts`: each gauge's ceremonial
  county and region.

## 3. The gauges (Proposed, from the data tests)

1. **A river gauge** has no tidal or groundwater measure and has a level measure with the
   qualifier "Stage" in m, mASD or mAOD (2,972 reporting on October 30th; all but one have only
   one such measure). "Downstream Stage" measures aren't used (no archive history; locks
   research, finding 11).
2. **Near-duplicates:** backup gauges are left out; of gauges on the same river within 100 m,
   one is kept, preferring one with archive history (2,895 left).
3. **Silent gauges:** no reading for more than six hours: no judgement, "No reading since
   [Thursday 4.15pm]", and the gauge stays in the list (Agreed).
4. **Held by a lock or weir** (Agreed; the list is Claude's, John doesn't need to see it): a gauge whose level is
   held by a structure. A gauge is held if it is named after a lock, weir, sluice, mill or gate;
   or has a downstream gauge too; or is on a list of managed reaches checked by hand (the
   non-tidal Thames below Lechlade, and the EA's other navigations: the Medway, the Great Ouse,
   the Nene, the Stour, the Welland, the Ancholme, the Glen and the Black Sluice Navigation,
   and any others found). Names alone miss gauges in a lock reach: the "Reading" gauge's level
   barely follows the Thames's flow.
5. **Place along the river:** each gauge is put on its nearest stretch in OS Open Rivers
   (preferring one with the EA's river name, within 600 m) and given its distance to the sea
   along the river. A tributary's route shows which river it joins, and where.
6. **County and region:** from OS Boundary-Line, as Hindcaster's gauges.

## 4. "For the time of year" (Proposed rules; the five words Agreed)

1. **The usual level for a day** is the middle of that day's highest and lowest level (the
   archive has no daily average level; all 2,141 matched river gauges have both).
2. **Today's level** is the average of the last 24 hours' readings.
3. **The comparison:** today's level against the usual levels of every past year's days within
   a week either side of today's date.
4. **The five words** (Agreed): very low (lowest 10%), low (10% to 25%), normal, high (highest
   10% to 25%), very high (highest 10%), written "Normal for late October". "Early", "mid" and
   "late" are days 1 to 10, 11 to 20 and 21 onwards.
5. **At least three years of history** are needed; otherwise the EA's typical range (exceeded
   95% and 5% of the time, all year round): "Below / Within / Above its usual range".
6. **Held gauges** (Agreed, October 30th): only "High" or "Very high" for the time of year is
   said; otherwise "Held steady by a lock or weir". Their time-of-year percentage and "since"
   lines are left out.

## 5. Updates (Agreed: hourly)

The collector runs every hour, started by cron-job.org through GitHub's API (as Hindcaster),
with "Run workflow" by hand too. Each run: the latest readings (one EA request), the flood
warnings (one request, plus one per new flood area), and a data commit; Vercel rebuilds the site
from it. Once a day it also writes the day's file (§6). Once a month a separate workflow rebuilds
the gauge list and tops up each gauge's history from the archive.

Free plans checked by web search on October 30th (re-check before launch): GitHub's standard
runners are free in a public repo; cron-job.org allows a job every minute; Vercel's free plan
allows 100 deployments a day and one build at a time (24 hourly builds fit).

## 6. Storing data (Proposed: the repo's size is the real limit)

Every hourly commit stays in git's history for good, so the data must be small and mostly
written once.

1. **`data/latest.json`**, rewritten each hour: each gauge's latest reading, its time, its average
   and change over 24 hours, compact (roughly 35 KB; an estimate, to measure in stage 2).
2. **`data/days/YYYY-MM-DD.json`**, written once, after midnight: each gauge's 24 hourly
   averages and the day's usual level (roughly 300 KB before compression; an estimate). Kept for 400 days, for
   the charts and "a year ago".
3. **`data/gauges.json`**, monthly: the gauge list with its rules (§3).
4. **`data/history/<gauge>.json`**, monthly: each gauge's usual levels for the time of year
   (every fifth day of the year, smoothed), its highest and lowest usual level for each week of
   each past year (for "the highest since"), and its record (roughly 15 KB each, 35 MB in
   all; an estimate).
5. **Backfill at the start:** the past year's daily levels from the archive (one request per
   date), and the last four weeks of hourly readings from the live feed (one request per gauge,
   once, at a gentle pace).

**The data lives in its own repo** (`JohnBaish/riverwatcher-data`, public: free Actions minutes,
no key needed to read it, and the EA data is open; John, October 30th, taking Claude's advice), so
the code repo stays small. Its README gives the EA credit. Its history can be cleared from time to time
without losing anything that matters; the collector asks Vercel to rebuild through a deploy hook
(a secret, kept in GitHub Actions).

## 7. The page (Agreed: option B revised)

From `design/mockups/options.html` ("B revised"). Built from Hindcaster's parts: its top bar,
place strip with Change, date, summary card, cards, footer and dark mode (following the device,
with the switch).

1. **The place strip** ("Near RG4 (Caversham)", Change), the kicker "River levels nearby, with
   historical comparisons" and the date.
2. **Flood warnings**, only when there are any within 10 miles (measured to the middle of each
   warning's flood area; John, October 30th): severity, area, time issued, a
   link to GOV.UK, and "Riverwatcher isn't a flood warning service. For warnings, see GOV.UK's
   Check for flooding or call Floodline on 0345 988 1188."
3. **Summary**, river by river (real figures, 4.15pm on October 30th): "Near RG4: the Thames is very high for late October at Sonning
   Lock, and held steady by locks and weirs elsewhere. The Kennet is held steady by a lock or weir
   here, and isn't high for late October. The Loddon at Twyford is high for late October." A
   river whose gauges differ gets a span ("normal to high").
4. **The nearest gauges, river by river:** the nearest five within 10 miles, grouped under each
   river's name (nearest river first), each river listed upstream to downstream, the nearest gauge
   marked "Nearest"; "The Kennet joins here" between the right gauges, and "Joins the Thames
   between Caversham Lock and Sonning Lock" on the tributary. A lake has its own card. When every
   nearby gauge is held, the nearest free-flowing gauge within 10 miles is added in its own card
   (to try). Each row: name, distance in whole miles ("less than 1 mile"), the judgement, latest
   level and time, last 24 hours ("Steady" for less than 2 cm, with the figure), a year ago, and a two-week
   line.
5. **The chosen gauge in detail** (the nearest at first; tap or choose another): the judgement,
   "0.26 m at 10.45am. Steady: up 1 cm in the last 24 hours.", A's line at a held gauge ("The level
   here is held by a weir, so it rises in very wet weather but says little about low water."),
   the chart, and the comparisons:
   - "Higher than on 61% of late October days since 2000." (Greta Bridge; not at held gauges);
   - "The highest for the time of year since 2025." (Keswick Campsite; only when high or low; not at held gauges);
   - "A year ago: 6.71 m, normal for the time of year." (Reading);
   - "Highest on record: 7.44 m, on January 8th 2024." (Reading)
6. **The chart:** two, four, six, 10 or 26 weeks or a year, starting on two weeks and remembered
   on the device (John may review). Hourly averages up to six weeks, daily averages beyond. Shaded
   in the five judgement colours for each day of the period (the outer two paler); at a held gauge
   only the high zones. Its height always covers the gauge's usual range over the whole year, so a
   small wobble looks small. The key: "Level, Very low, Low, Normal, High, Very high for the time of
   year", left-aligned to the chart's own left edge, in line with its first date (Agreed, John,
   October 30th). A tooltip on hover or touch.
7. **About these figures** (§9) and the credits at the foot (§10).

Judgement colours (Agreed): low water terracotta, high water blue, normal grey, each always with
its word; each arm checked with the dataviz validator in light and dark.

## 8. Choosing a place and the area views (Agreed in outline)

1. **The chooser**, as Hindcaster's: a postcode box (England only, "RG1" or "RG1 8FR", only the
   first half used), a county list, a region list and England. Addresses after "#", never sent to
   the server. The last choice kept on the device.
2. **County, region and England views:** a summary ("Most rivers in Berkshire are normal for late
   October. [Seven] of the [43] gauges with long records are high or very high, and [15] are low or
   very low. [18] are held steady by locks or weirs, so they're only counted when high."), the most
   unusual high and low gauges, Hindcaster-style (held gauges only on the high side), then every
   gauge folded away, highest for the time of year first. For a region or England, the ten highest
   and ten lowest instead of every gauge (Agreed, as Hindcaster).

## 9. "About these figures" (Proposed: Claude's draft with John's changes of October 30th)

> Riverwatcher shows river levels measured by the Environment Agency's gauges. These usually
> collect data every 15 minutes, and Riverwatcher fetches that information once an hour. Recent
> figures are provisional: the Environment Agency checks them later and sometimes corrects them.
>
> Heights are above each gauge's own zero, not the depth of the river, so the figures for
> different gauges can't be compared with each other.
>
> "For the time of year" compares the last 24 hours with the same gauge's levels on the days a week
> either side of today's date, in every year on record. There's a lot of variation in when the
> historical records for each gauge start. Just under half the gauges have records from before
> 2000, a few go back to the 1950s, and some started only in the last few years; each gauge's
> figures say the year its record begins. Normal
> is the middle half of those days; low and high are the next 15% on each side; very low and very
> high are the lowest and highest 10%.
>
> On rivers with locks and weirs, such as the Thames, the level is kept steady for boats, so it
> rises in very wet weather but doesn't tell us much about low water. For these, Riverwatcher only
> says when the level is high. Where a gauge has no long record, Riverwatcher uses the Environment
> Agency's own usual range for it, which covers the whole year.
>
> Rivers are listed upstream to downstream, using Ordnance Survey's map of rivers.

The sentences on how far back records go are John's wording (October 30th), from these figures: from the archive on October
30th, 1,088 of 2,184 river gauges' records start before 2000; the earliest full one is the Severn
at Montford, from 1952; 153 started in 2020 or later.

## 10. Credits and footer (Agreed)

At the foot of the page: "This uses Environment Agency flood and river level data from the
real-time data API (Beta)."; "Contains public sector information licensed under the Open
Government Licence v3.0."; "Contains OS data © Crown Copyright and database rights 2026.";
"Contains Royal Mail data © Royal Mail copyright and database right 2026."; "Contains National
Statistics data © Crown copyright and database right 2026." One OS line covers both Open Names
and Open Rivers (John, October 30th).

The footer as Hindcaster's: "Riverwatcher is a free-to-use personal project by John Baish. More
free tools at www.baish.net. Contact: workshop@baish.net. We don't record anything you do here,
apart from anonymous visit statistics (no cookies, no personal data) showing us how the site is
used. Your device, rather than the website, stores your last choices (location, chart period and
light or dark mode), so the page opens the same way next time."

## 11. Hosting (Agreed)

A public GitHub repo (`JohnBaish/riverwatcher`); Vercel's free plan; `riverwatcher.baish.net`;
Vercel Web Analytics; cron-job.org. Nothing a visitor types or chooses leaves their browser. The
cron-job.org access key has an expiry date to note in `PLAN.md`.

## 12. Later (not in the first version)

1. **River flow for lock reaches** (John, October 30th: worth collecting if it helps there). How
   it would work (Claude's advice, question 4): a held gauge is paired with the nearest flow gauge
   on the same river, with no tributary joining in between (from OS Open Rivers). Its row keeps
   "Held steady by a lock or weir", and adds the river's flow for the time of year, worked out the
   same way as levels: "Flow at Reading: normal for late October (Wednesday)". The summary uses it:
   "The Thames's flow at Reading is normal for late October; its locks hold the level steady."
   Agreed as stage 6, after launch, with a mock-up first (John, October 30th). Coverage (October 30th): 239 of 535 held gauges have a flow gauge on the same river within 15
   km; on the Thames, 52 of 56 (eight flow gauges, Farmoor to Walton). Most flow comes only from
   the archive's daily figures, usually two days behind (about 80 gauges send flow live), so the
   day it's for is always named.
2. **Downstream gauges** at locks, once Riverwatcher has its own history for them.
3. **Tidal stations** for coastal postcodes; **groundwater**.
4. **Full postcodes** rather than districts.
5. **Wales and Scotland** (Natural Resources Wales and SEPA, as explored for Hindcaster).

## 13. Questions for John (all answered October 30th)

1. **Where the data lives:** its own repo (John: "happy to take your advice"). §6.
2. **The list of managed reaches:** Claude drafts it; John doesn't need to see it. §3.4.
3. **Flood warnings within 10 miles:** to the middle of each flood area first. §7.2.
4. **Flow for lock reaches:** as advised in §12.1, the first stage after launch (stage 6), with a
   mock-up first (John agreed, October 30th).
5. **Region and England views:** the ten highest and ten lowest. §8.2.
6. **The key's alignment:** aligned to the chart's own left edge ("great", John, October 30th).
7. **Credits:** one OS line. §10.
8. **"About these figures":** John's changes made (§9); the new sentence on how far back records
   go is for him to check.
