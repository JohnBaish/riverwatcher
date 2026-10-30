# Riverwatcher: data tests and John's answers

Friday October 30th 2026, Claude Code. Tested against the Environment Agency's live
APIs between 10.10am and 10.20am UTC that morning. The EA's documentation pages
themselves weren't read; everything here comes from the APIs' own replies.
The figures are real, but the EA marks its recent data "Unchecked" (provisional).

## Findings

1. **A browser can call the EA directly.** Both the real-time API
   (`environment.data.gov.uk/flood-monitoring`) and the Hydrology archive
   (`environment.data.gov.uk/hydrology`) reply with
   `access-control-allow-origin: *`, and a page on another site fetched both in
   Chromium. Real-time replies are cached for 5 minutes, archive replies for 30.
2. **Postcodes on the device.** Lightreader's `src/data/outcodes.json` (2,210
   English postcode districts, middle of each district in latitude and
   longitude, 81 KB, from OS Open Names) covers it. Nearest working river gauge
   from each district's middle: median 1.5 miles, 90% within 4.1 miles, 119
   districts with none within 5 miles; the farthest are the Isles of Scilly
   (about 30 miles) and Walton-on-the-Naze (13 miles). postcodes.io wasn't used:
   it would send the visitor's postcode to a third party (and it's blocked from
   this container).
3. **Which gauges.** The real-time list has 5,539 stations. Leaving out any with
   a tidal or groundwater measure, and keeping a level measure with the
   qualifier "Stage", a unit of `m`, `mASD` or `mAOD`, and a reading in the last
   24 hours, gives **2,972 river gauges**. All but one have exactly one such
   measure, so no choosing rule is needed (the one exception has both mASD and
   mAOD). Units: 1,421 mASD, 1,050 m, 500 mAOD. "Downstream Stage" (below a lock
   or weir) is left out. Reading's extra measures (unit "---", and "m/s") sent
   nothing.
4. **Near-duplicates.** 204 pairs of those gauges are within 300 m of each
   other: backups ("Thames at Kingston (Backup)"), pumping stations, flood
   storage, mill streams, upstream and downstream sites. A rule is needed
   (for the spec). The bulk station list gives no station type, so the rule
   has to go on names, measures and the archive match.
5. **Live and archive IDs.** An archive station carries the live station's
   reference as `wiskiID` and `stationReference` (and `RLOIid`, which gives its
   page on Check for flooding, for example
   `check-for-flooding.service.gov.uk/station/7110`). 2,215 of the 3,208 river
   gauges matched one archive station each, none matched two. The archive's
   15-minute level at Caversham Lock equals the live "Stage" reading, value for
   value (229 of 229 shared times, October 28th to 30th); Reading's the same.
6. **How much history.** Caversham Lock (2201TH): 15-minute level from
   November 29th 1995 to the present; daily highest and lowest level, every year
   complete or nearly, but the daily figures end on October 10th to 11th 2026
   (nearly three weeks behind) and the archive has no daily average level.
   Reading (2200TH): daily average flow from August 19th 1992 to October 28th
   2026, every year complete. Station opening dates across England: 677 before
   1990, 444 in the 1990s, 732 in the 2000s, 207 in the 2010s, 155 since 2020
   (opening date, not necessarily the start of the archive's data).
7. **Typical range.** The live station details give a "typical range" and
   records (highest recent, highest and lowest on record) for 2,348 river
   gauges. Caversham Lock: typical 0.068 to 0.3 m. Some records look odd (its
   highest on record is June 2003), so they need care.
8. **Size.** A gauge's whole daily history (Reading, 34 years) is 125 KB
   compressed and took 1.1 seconds; a year of 15-minute levels is 170 KB
   compressed (7.8 MB once unpacked) and took 2.2 seconds.
9. **Flow.** Only about 80 river gauges send flow live; about 860 have daily
   flow in the archive, usually two days behind; about 240 stations measure flow
   but no level. (Not used: see answer 3.)
10. **A real comparison** (corrected the same day; see below). Reading's daily
    average flow on October 28th 2026 was 9.4 m³/s, higher than 37% of days in the
    same fortnight from 1992 to 2025, after roughly tripling since mid-October.
    Caversham Lock's upstream level rose with it, from a daily highest of about
    0.16 m (October 19th) to 0.29 m (October 23rd): higher than 17% and then 88% of
    daily highs in the same fortnight from 1995 to 2025. Its downstream gauge (the
    head of the reach below, held by Sonning) moved less, from about 1.99 m to
    2.05 m at most, and the archive holds no history for it.
    **Correction:** the first version said levels at locks "barely move", comparing
    Caversham's October 10th figure (the latest daily figure in the archive) with a
    flow rise that came after October 19th. The two dates didn't overlap. Looked at
    across the whole month, the upstream gauge moves clearly and compares well with
    its own history. Locks still damp the level, so how far this holds elsewhere
    isn't known yet.
11. **Flood warnings.** `/id/floods` lists every warning and alert in force for
    England (four at 10.20am UTC, two of them "no longer in force"), each with a
    severity, a description and a flood area (which has a position). Small enough
    for the collector to fetch with each run.

## John's answers (October 30th 2026)

1. **B, definitely:** a Hindcaster-style collector (GitHub Actions, started by
   cron-job.org, say hourly), storing data in the repo; nothing a visitor types
   or chooses leaves their browser.
2. **Yes:** postcode district centres, as in Lightreader.
3. **No flow in the design at this stage.** Note it to come back to: whether it's
   worth having, and what it would look like.
4. As 3.
5. **Flood warnings in the first version, if easy.** Finding 11 says they are.
6. **The repo is created** (`JohnBaish/riverwatcher`).

## Still to check

- Whether any of the 2,972 gauges are just over the Welsh or Scottish border.
- How often the EA corrects its provisional figures later.
- How much history the 2,215 matched gauges really hold (only two were checked).
