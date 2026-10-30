# Riverwatcher: the main page's content, John's answers

Friday October 30th 2026. Step 2 of the agreed order. Wording in quotes is
Claude's draft; square brackets stand for real figures.

## Batch 1

1. **Judgement first, then the figure** (John: as suggested). "Caversham Lock,
   River Thames: normal for late October. [0.18] m at [9.45am]."
2. **Five words, agreed:** how today compares with the same fortnight in past
   years: "very low" (lowest 10%), "low" (10% to 25%), "normal", "high"
   (highest 10% to 25%), "very high" (highest 10%). Gauges without archive
   history fall back on the EA's all-year typical range ("within its usual
   range").
3. **Recent weeks: the visitor chooses** two, four, six, 10 or 26 weeks, or a
   year (John: "if possible"). The chart has the usual band for each day shaded
   behind it, and a line such as "Up [12] cm in the last 24 hours" or "Steady".
   Feasible: the live feed keeps only about four weeks (checked: readings from
   October 1st), but the archive's 15-minute levels are up to date, so the
   longer choices come from the archive, made by the collector.
4. **Longer history: all four, if the design has room:** "Higher than on [37]% of
   late-October days since [1995]"; "The highest for this time of year since
   [2014]"; the same day last year; the highest on record, with its date.
5. **The nearest five gauges within 10 miles**, each with its distance in whole
   miles and its river (agreed).
6. **Units:** metres to two decimals, changes in centimetres, and "Height above
   the gauge's own zero, not the depth of the river." (agreed).
7. Locks and weirs: dropped (the level does move: data tests, finding 10).
8. **Flood warnings** within 10 miles at the top, linking to the government's
   page; **with none, nothing at all.**
9. **The same choice of views as Hindcaster** (postcode, county, region,
   England), if feasible. Feasible: Hindcaster's `scripts/build-areas.ts` places
   points in ceremonial counties and regions from OS Boundary-Line. An area view
   would compare gauges by the time-of-year judgement, never by their heights
   (each gauge has its own zero).

## Batch 2

1. **Heading and tagline:** "River levels nearby, with historical comparisons"
   (John's wording).
2. **Hourly updates**, each gauge showing "Latest reading [9.45am]"; a gauge
   silent for more than six hours shows no judgement, just "No reading since
   [Thursday 4.15pm]", and stays in the list. John asked whether hourly is safe
   on the free services: checked (see the log entry of this date in `CLAUDE.md`).
3. **Say "Steady", but always give the figure:** "Steady: up [1] cm in the last
   24 hours" (exact wording to settle with the design).
4. **The chart starts on two weeks**, and the page remembers the visitor's last
   choice. John will review this.
5. **Area views as proposed:** a count of judgements ("Most rivers in Berkshire
   are normal for late October. [5] of [38] gauges are high or very high."), the
   most unusual high and low gauges Hindcaster-style, then every gauge folded.
6. **A one-sentence round-up for the postcode view:** John would like to see it
   in the designs.
7. **Agreed:** "Riverwatcher isn't a flood warning service. For warnings, see
   GOV.UK's Check for flooding or call Floodline on 0345 988 1188." (Floodline
   number checked on GOV.UK, October 30th.)
8. **Credits at the foot of the page:** the EA's sentence from its own
   documentation, "This uses Environment Agency flood and river level data from
   the real-time data API (Beta)."; the Open Government Licence line for the
   archive; the OS, Royal Mail and National Statistics lines for postcodes.
9. **"About these figures": Claude drafts it** once the design is chosen.

## Batch 3: option B revised (October 30th)

John: "This is great. Really good."

1. **Order within a river:** upstream to downstream, with the nearest gauge marked, as built
   ("you're showing what I had in mind").
2. **When every nearby gauge is held by a lock or weir**, add the nearest free-flowing gauge
   within 10 miles in its own river card: to try.
3. **The chart's height always covers the gauge's usual yearly range:** yes.
4. **The chart's shading in the five judgement colours:** clearer; keep it.
5. **A lake gets its own card under its name** (Derwentwater at Lodore): yes.
6. **The summary river by river:** looks good.

Also: "Height above the gauge's own zero, not the depth of the river." moves out of the
charts into "About these figures" (still to write); in the key, "for the time of year" now
sits with "Very high" so they read together. Whether to centre the key: Claude suggested
keeping it left-aligned (it lines up with the text above, and wrapped rows look ragged when
centred on a phone), for John to decide.
