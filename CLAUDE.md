# Riverwatcher — working notes

**River levels in England, compared with recent weeks and longer history.** A
sister tool to Clockmaker and Backtimer (`JohnBaish/clockwheel`), Flowcharter,
Hindcaster, Lightreader and Refueller, for `riverwatcher.baish.net`. You enter a
postcode and it offers the nearest river gauges, from open Environment Agency
(EA) data.

Read these first, in this order:

1. `design/research-notes-2026-10-25.md`: the research from John's Claude chat,
   kept unchanged. Its design recommendation (a serverless layer) is set aside
   (see below), its worked example's readings are illustrations only, and some
   of its sources were seen only in search results.
2. `design/data-tests-2026-10-30.md`: what the EA's APIs really do, tested, and
   John's answers. Then `design/content-answers-2026-10-30.md`: the main page's
   content, as agreed so far.
3. `HOUSE-STYLE.md`: the shared look and ways of working. Copied from
   clockwheel on 2026-10-30 (commit `674122d`; last re-copied 2026-11-01 at `a6cb099`), with `SEO-HANDOVER.md`,
   `.claude/skills/fresh-look/` and `.gitignore`. Clockwheel holds the master
   copies; if they change, re-copy them and note it here.
4. The tracker: `projects/riverwatcher.md` in `JohnBaish/baish.net-directory`.

**`SPEC.md` and `PLAN.md`** (agreed by John, October 30th). Read them before anything else.

Design options (step 3): `design/mockups/options.html`, one page with options A, B and C
for RG4, CA12 and Berkshire, from a real EA snapshot (`mock-data.json`, made by
`fetch-mock-data.mjs`; `build-options.mjs` puts it into `options.src.html`). Open Rivers positions: `river-positions.py` (OS Open Rivers, downloaded from api.os.uk, not
kept). Online as a
private page: https://claude.ai/artifact/SK5qN1PJKSYwgqqJXEpNDG (republish after a
rebuild). Previews in `design/previews/options-*.png`.

Key points:

- John is not a developer. Explain plainly and briefly, say what he needs to
  do, and use British spelling. He decides the wording.
- Agree before building anything. **Don't build the tool until John has agreed
  the spec.** Order agreed on October 30th: (1) data tests (done); (2) the main
  page's content and wording, asked in numbered batches; (3) design options A,
  B and C from Hindcaster's real parts, with live data, at 1200px and 390px;
  (4) spec and staged plan.
- Each stage on a branch, merged only when John says (notes and documents may
  be merged without asking, HOUSE-STYLE §10). A dated log entry for every change.
- Check in a real browser at 1200px and at 390px with touch emulation, and say
  what couldn't be checked.
- **Nothing a visitor types or chooses leaves their browser.** Data comes from a
  collector in GitHub Actions, started by cron-job.org, stored in the repo
  (John: "B, definitely"). Postcodes are looked up in bundled district centres.
- **No made-up figures**, in examples and mock-ups too. The research notes'
  October 25th readings are illustrations only.
- "Less than", never "under"; "more than", never "over" for amounts. Times as
  "9.30am". Dates month first ("October 30th"). HOUSE-STYLE §15.
- Reuse Hindcaster's code where it fits, especially its EA handling
  (`scripts/lib/rainBulk.ts`, `scripts/lib/lastYear.ts`), and Lightreader's
  `src/data/outcodes.json`.
- Build dark mode in from the start (HOUSE-STYLE §2, §16).
- **Project tracker:** when something significant changes (a stage finished, a decision made, something goes live or is parked), update this project's file and its line in `INDEX.md` in `JohnBaish/baish.net-directory`, following that repo's README, straight to its `main` (John's standing permission, even when this session was given its own branch). Before committing there, run `node site/check-tracker.mjs` in that repo and fix anything it lists. Also at the end of each session (John).

## Layout (stage 1)

- **Code here, data in `JohnBaish/riverwatcher-data`** (public; `data/`). Scripts take the
  data folder as an argument, by default `../riverwatcher-data/data`.
- `scripts/lib/`: `ea.ts` (fetching, CSV), `gauges.ts` (which stations count,
  near-duplicates, names, the held list and `NAVIGATIONS`), `rivers.ts` (OS Open Rivers:
  the network repaired, each gauge's place and joins), `areas.ts` (county and region,
  from Hindcaster's `build-areas.ts`), `shapefile.ts` (from Hindcaster, with polylines),
  `history.ts` (the time-of-year table, records, "since", the judgement, Steady),
  `days.ts` (hourly averages, a day's usual level).
- `npm run gauges <Open Rivers data folder> <Boundary-Line folder> [<data>]`:
  `data/gauges.json` and `design/gauge-review.md`. `RW_CACHE=<folder>` reuses the EA
  lists. Both OS downloads come from api.os.uk (ESRI Shapefile, GB) and aren't kept.
- `npm run history [<data>]` and `npm run backfill [<data>]`: `data/history/` and
  `data/days/`, resumable; run by the data repo's History workflow ("Run workflow",
  choose the code branch).
- **The page (stage 3):** `src/` as Hindcaster's; figures from the data repo at build time
  (`scripts/lib/pageData.ts`, served as parts by `vite.config.ts`); view rules in
  `src/lib/view.ts`; `npm run dev` / `build` need the data repo beside this one (or `RW_DATA`).
- `npm run check` (`scripts/check-rules.ts`, then `scripts/check-page.ts`): the rules, with real history fixtures in
  `design/fixtures/history/`, and the gauge list's rivers when the data repo is beside
  this one.

Scope (decided by John):

- River levels only: no tidal, groundwater or rainfall.
- No flow at this stage (October 30th): come back later to whether it's worth
  having and what it would look like.
- Flood warnings in the first version, if easy (they look it: finding 11).

## Log

### 2026-11-01 — "Delete merged branches" workflow (straight to `main`)

A "Delete merged branches" workflow (`.github/workflows/tidy-branches.yml`, Run workflow only, nothing scheduled): deletes only branches fully merged into `main`, never `main`, and only if a branch hasn't moved since it was checked; "Only list" (ticked by default) changes nothing; named unmerged branches can be added, each kept as an `archive/<name>` tag first. Added because cloud sessions can't delete branches (John: automate it, with no danger to the websites; the sites build from `main`, and deletions made by the job start no other workflows). Tested against a pretend GitHub here: the trial changed nothing; the real run deleted the merged branch and the named one (kept as a tag), and refused `main`. House style re-copied from clockwheel (§10 mentions it).

### 2026-11-01 — house style re-copied (notes only, straight to `main`)

From clockwheel `a6cb099` (was `9edeea5`). New since then: §10 asks sessions to delete a branch as soon as it's merged,
keep unmerged ones only for work worth returning to, tag dead unmerged work before deleting, check with full history,
and list branches for John to delete, as cloud sessions can't (John); and the October 31st to November 1st changes from
the Refueller session (§1 and §16 describe the baish.net overview in two parts; §15 lists Lightreader's 24-hour times).
No app code changed.

### 2026-10-31 — the prompt for stage 4; option C merged (notes only)

John said merge (option C, fast-forward, checks 114 + 85 first) and to start stage 4 tomorrow in a
new thread: `design/prompt-stage-4-2026-10-31.md` is what he pastes in.

### 2026-10-31 — the summary names gauges when their words are far apart (option C; merged)

John chose C: a river's gauges keep the span when their words are next to each other ("normal to
high"); two or more steps apart, each is named ("The Team is very low at Team Valley and very high
at Gateshead St Omers Haugh, for late October."). `riverSentence` in `src/lib/view.ts`; SPEC §7.3;
checks 114 + 85. NE30 and SW1A at 1200px and 390px, light and dark: no errors, no sideways scroll.

### 2026-10-31 — stage 3 approved; last checks (notes only)

**John** tried the private page: "This looks great. Really good. I have no amends at this stage."
Last stage 3 sweep (PLAN 3.3): PL1, NE30, CH1, TD15 (border), HR3 (border), SW1A, HU1 (drains),
PE13 (fens), TR21 (Scilly) and TR18 (coast) at 1200px and 390px with touch, light and dark (40
views): no errors, no sideways scroll, both fonts loaded; every summary read through. **For John
(not urgent):** where a river's gauges differ a lot the summary says "very low to very high"
(the Team near NE30, Beverley Brook near SW1A); true, but it reads oddly.

### 2026-10-31 — the postcode view as a private page (notes only)

At John's request: the real build (from `main`, data at 7.10pm) published as a private page,
https://claude.ai/artifact/4dtJG2SmggjVjhq4PgsvJt, for him to try. Made with
`npx vite build --base ./`, the page's wrapper tags dropped (the artifact adds its own) and a
preview-only line that opens a first visit on RG4. It doesn't update itself: rebuild and
republish to show newer figures. Untested here: whether the artifact frame keeps the page's own
`#postcode/RG4` addresses (if not, choosing a place still works through the box).

### 2026-10-31 — chart bands all at the same strength (option A)

John chose A: the chart's five bands (and the key's swatches) at the same strength, so "very high"
and "very low" are the deepest, as on the labels. `global.css`; SPEC §7.6. Pictures
`design/previews/chart-colours-*.png`. Merged to `main` at John's word.

### 2026-10-31 — the archive cleaned; today's hours; merged to `main` (branch `claude/inspiring-hypatia-60x279`)

**John:** fix the "two zero points" fault; point 2 ends "No long record to compare."; 7 (a year ago
at a held gauge: the level only) right; 8 keep the promise (every visitor loads the same files);
9 yes (today's hours); the key's colours looked the wrong way round; then "merge please".

**What:** `cleanDays` in `scripts/lib/history.ts` (SPEC §4.8): stuck stretches, stretches on
another zero point than today's, and impossible figures are left out before a history is built
(`stuckDays`, `steps`, `otherZero`, `plausibleBounds`; history files gain `otherZero` and
`bounds`, the index `otherZero` and `droppedDays`; a gauge left "short" has its old file removed).
`scripts/lib/pageData.ts`: `liveBand` and `historyFits` set aside a history that doesn't fit what
the gauge reads now; day-file figures outside the plausible levels are left out. The collector
writes `data/today.json` (`todayHours`, the hours so far, one line per gauge), and the charts'
hourly parts end with it. The key's swatches use the chart's own shading. Checks 114 + 83.

**Measured, to set the rules:** every gauge's archive daily figures fetched (2,108, none failed)
and the rules run over them. The first impossible-figure limit (4 times out) would have removed
real floods (Morpeth, September 25th 2012; Wakefield, Storm Christoph): real floods reach about
12 times, every figure 20 times out was impossible, so 20 it is, plus loggers' stand-in values.
The first step rule cut Melton Park's 18 good years for a two-year fault, and read stuck stretches
as changes; fixed. Known limit: Melton Park's two years at -0.27 m (2021 to 2023) stay in its
history (the step into them isn't sharp enough to find).

**Rebuilt:** 215 gauges' histories (`build-history.ts` with `RW_ONLY`, run here, 30 minutes):
210 ok, 5 now too short; records now real floods (Maidenhead 3.74 m in February 2014, Walton
3.50 m in July 2007, Corbridge 5.76 m in Storm Desmond). Pushed to the data repo's `main`. 18
gauges' whole archive is on another zero point; the page uses their typical range.

**For John:** the chart's outer bands are paler (as agreed), so "very high" reads weaker than
"high"; the key now matches the chart, and two ways to change it are offered.

**Merged:** the branch fast-forwarded into `main` at John's word, so the collector writes
`today.json` from its next run. `main` also carries the stage 3 page, not yet reviewed by John
(nothing is visible: no Vercel project until stage 5).

### 2026-10-31 — cron-job.org set up; the key's expiry noted (notes only)

John set up the hourly cron-job.org job (first run 6.10pm today); its GitHub access key expires
on January 29th 2027 (PLAN.md, "Dates to remember"). Tracker updated.

### 2026-10-31 — stage 3.1: the postcode view built, for John to look at (branch `claude/inspiring-hypatia-60x279`, not merged)

**John:** start stage 3 (`design/prompt-stage-3-2026-10-31.md`): show the agreed design rebuilt
with the app's own parts and the real data before wiring anything in.

**What:** the page, from Hindcaster's parts (top bar, strip with Change, date, summary card,
chooser, footer, dark mode following the device, the safety net; `organic.css`, `theme.ts`,
`ThemeSwitch.tsx`, `responsive.ts`, `words.ts`, `route.ts` copied) and Lightreader's
`outcodes.json`. `scripts/lib/pageData.ts` makes the figures at build time from the data repo
(`RW_DATA`, or `../riverwatcher-data/data`), judging every gauge with `history.ts`'s `judge`,
`sinceYear` and `levelsFor`; `vite.config.ts` serves them as parts (as Hindcaster's): `meta`
built in; `gauges`, `hours` (two weeks hourly), `hours42` and `daily` loaded when needed
(`src/lib/load.ts`). The view's rules and sentences in `src/lib/view.ts` (the nearest five,
river groups and joins, chips, figure line, comparisons, summary), the chart's figures in
`series.ts`, the chart in `components/Chart.tsx`, the view in `PostcodeView.tsx`.
`npm run check` now also runs `scripts/check-page.ts` (79 checks, including every postcode
district's sentences for "undefined", "null" or "NaN").

**Drafted for John (not agreed):** "Held steady by pumping" (drains); the drain line under the
figures; "No long record to compare with" (a plain line, for gauges with no history or range);
"No reading since Friday 2.04pm"; "History incomplete: No records from May 2023 to May 2024.";
"There are no river gauges within 10 miles of TR21."; three sentences in "About these figures";
a year ago at a held gauge gives the level only (the held rule), not "normal".

**Found:** (1) 12 gauges' histories mix two zero points (Kings Road Bridge reads 68.9 m, its
history includes days near 0 m; Maidenhead's 90% level is 22 m), so their judgements are wrong:
a stage 1 fault to fix before launch. (2) The charts stop at midnight UTC and jump to the latest
reading, as today's hourly figures aren't in the data repo (the collector keeps them in its cache).
(3) Sizes: every visitor loading the same files means about 1 MB compressed for the first view
(gauges 203 KB, two weeks hourly 821 KB), 1.6 MB more for six weeks, 1.75 MB for 10 weeks or
more. Per-gauge files would be about 20 KB but tell the server which gauges were looked at.
Question for John.

**Verified:** `npx tsc -b`, lint (no warnings), `npm run check` (100 + 79), build. Chromium
against `vite preview`, RG4, CA12, TA8, TR21 and LA22 at 1200px and 390px with touch, light and
dark (20 views): no errors, no sideways scroll, both fonts loaded. Also: the periods (six weeks,
10 weeks, a year), the tooltip, choosing another gauge, the period kept after a reload, the
chooser (a word, a Welsh postcode, TR21), a returning visitor. Pictures
`design/previews/stage3-*.png`. **Couldn't check:** a real phone; a flood warning (none in
force today).

### 2026-10-31 — the prompt for stage 3 (notes only)

`design/prompt-stage-3-2026-10-31.md`: what John pastes into a new thread to start stage 3 (this
thread had grown very long). The stage 3 branch started here was empty and was removed.

### 2026-10-31 — stage 2: the collector (branch `stage-2-collector`)

**John:** "please merge and continue" (stage 1 merged; stage 2 started).

**What:** `scripts/collect.ts` and its rules in `scripts/lib/collect.ts` (checks 100). Every
hour: every gauge's latest reading (one request), the flood warnings (one, plus one per new
flood area, kept in `data/flood-areas.json`), `data/latest.json` ([level, minutes old, 24-hour
average, change], mm). The hourly samples for the last 48 hours are kept in GitHub's Actions
cache, not git; if lost, they're rebuilt from the day files. Once a day, after UTC midnight:
yesterday's day file from the EA's bulk list (38 pages of 10,000, about 12 minutes; the
all-gauges list takes a date, not `since`), `data/quiet.json` (flat or stuck, only gauges with
no history or range, as John decided), day files older than 400 days removed. `data/runs/`
logs each run. The workflows are drafted in `design/workflows/`: `collect.yml` is in the data
repo (no schedule; started by cron-job.org or by hand); `monthly.yml` (a schedule) waits for
John. `design/cron-job-org-steps.md`: John's steps.

**Found on the way:** `latest.json` was 122 KB with dates (SPEC §6.1 estimated 35 KB); minutes
before the run bring it to 72 KB (26 KB compressed). The flat test first took in lock gauges
(86); limited to gauges with no history or range: 23.

**Verified:** a trial here against the real EA, then two runs in GitHub Actions (code from this
branch): run 1, 12 minutes, no cache, made the October 30th day file from 374,490 readings
(2,885 gauges), quiet 23, one old day file removed; run 2, 4 seconds, the cache found. Every
gauge's line in `latest.json`; 19 to 23 silent; no flood warnings in force this morning, so
that part is untested against a real warning.

**John:** merge (done: `main` brought in the house-style re-copy first, both log entries kept,
checks 100); the Monthly workflow yes (in the data repo, on the 3rd at 02.23 UTC); cron-job.org
when he can. Until then the collector runs only by hand.

### 2026-10-31 — house style re-copied (notes only, straight to `main`)

From clockwheel `9edeea5`: §10 asks sessions to run `node site/check-tracker.mjs` in
`JohnBaish/baish.net-directory` before committing tracker changes, and gives John's standing
permission to commit tracker changes straight to that repo's `main`, even when a session was
given its own branch. The tracker line in the key points above says the same. No app code changed.

### 2026-10-31 — Twyford, Barnwell and Scots Float; the archive's gaps (branch `stage-1-gauges`)

**John** asked about the gauges whose history stops early.
- **Twyford** (John: go ahead): its live gauge is the archive's "Twyford Main" (from September
  2010; 15-minute readings identical), not the suspended "Twyford" (1994 to 2011), whose levels
  differ by 8 to 24 cm where they overlap, so not joined (`ARCHIVE_INSTEAD`). Its daily figures
  still stop in August 2023.
- **Matches checked by readings:** of the 13 gauges matched by name though their positions
  disagree, 11 agree to the millimetre; two were wrong and are refused (`ARCHIVE_REFUSED`):
  Barnwell FSR (32.6 m live, the archive's Lower Barnwell 21.4 m, 3.6 km away) and Scots Float
  Sluice E6380, whose archive record is really the other side of the sluice, E6381 (given to it).
  The held test now reads the EA's own name too (E6381's archive name drops "Sluice").
- **Found:** the archive's daily highest and lowest stop early at about 275 gauges (33 before
  2024, 243 in early 2024), while their 15-minute readings usually go on to now (22 of the 32
  checked to October 2026, 6 partly; Wilfholme, Didsbury and Knapp Mill have neither since
  2003, 2022 and 2023). Proposed to John: work out the missing days from the 15-minute readings.
- **John agreed:** fill the gaps (`RW_FILL=1` in `build-history.ts`, the workflow's "fill";
  run 3); trial: Twyford 567 days filled (11 years), Coalburn Beck 8,155 (34 years).
- **John decided (A):** gauges whose gaps can't be filled say "History incomplete" and name
  the gap (SPEC §4.7). **(B11):** fen drains and rhynes are held (SPEC §4.6), and "About these
  figures" must say so (SPEC §9). Rule: a drainage word in the river's name, in the drained
  counties only (`DRAINED_COUNTIES`); 76 held this way, 520 held in all. "Dike" and "dyke"
  elsewhere are usually hill streams; "Cut" and "Leam" are rivers. **(B10):** open; John asked
  whether the 422 gauges with neither history nor typical range give usable information.
  Four weeks of live readings fetched (and 149 ordinary gauges to compare): they move like
  rivers (median four-week range 28 cm against 38 cm; 81% moved 10 cm or more; 11 flat, 19
  repeating one reading). Advice to John: keep them, prefer judged gauges in the nearest five,
  a plain line instead of the judgement, leave out the flat or stuck ones. **John agreed all of
  it** (SPEC §3.7; `design/level-only-2026-10-31.md`, with the 24 that would be left out now).
- **Run 2** (backfill, 02.56 to 04.57 UTC) stopped at its two-hour limit in the live part and,
  as that part only saved at the end, kept nothing. `backfill.ts` now saves every 100 gauges
  (three at a time) and carries on from `data/days/backfill.json`, which also remembers archive
  dates that had nothing yet (to be asked again by the monthly top-up). Trial: two runs on five
  gauges, the second doing nothing again. Run 3 (fill) started 04.57; a backfill run queued.
- **Run 3** (fill, 04.57 to 05.57 UTC): 405 gauges filled, 344,846 days; history now 2,097
  gauges (was 1,967), 11 too short (was 142). **Run 4** (backfill, 05.58 to 07.39): the live
  four weeks for all 2,888 gauges, none failed; 401 day files, 18 MB; history 56 MB. Then 18
  gauges whose daily figures stop for months and start again this autumn were filled from
  their last daily figure before the cutoff (run here): little came back, as their 15-minute
  readings have the same gaps.
- **Gaps measured** (weeks with no records, before September 1st 2026): 1,124 of 2,097 gauges
  have a gap of three months or more somewhere, mostly long ago; within the last five years,
  433 (three months or more), 250 (six), 87 (a year); 38 reach the present. Only Wilfholme,
  Didsbury and Knapp Mill stop more than two years ago. **John agreed** Claude's definition of
  "History incomplete": a gap of a year or more in the last five years, or three months or
  more to the end (SPEC §4.7; `incompleteGaps` in `history.ts`, `npm run gaps` for files made
  before it): 99 gauges (38 whose record stops, 67 with a gap in the middle). Checks 90.
- **Merged to `main`** at John's word ("please merge and continue"). Stage 1 done.

### 2026-10-30 — stage 1: the gauge list, the history and the backfill (branch `stage-1-gauges`)

**John** agreed the spec and created `JohnBaish/riverwatcher-data`; start stage 1.

**What:** Vite, React and TypeScript set up as Hindcaster's (same versions, a placeholder
page), and the layout above. Downloads checked against OS's checksums (Open Rivers
October 2026, Boundary-Line).
- **The gauge list:** 3,204 river gauges by SPEC §3.1; 2,954 reported in the last week;
  2 backups and 64 near-duplicates left out: **2,888**. 2,109 have archive history, 358
  only the EA's typical range, 421 neither.
- **Archive matches** need the same name or to be within 1 km: four matches by reference
  alone were different stations (Uphill Rhyne took Sampford Brett's history, 29 km away).
  Where the names agree but the lists disagree on the position, the one on the gauge's
  own river is used (Canal Road and Warwick Old Budbrooke Road from the archive).
- **Names:** all-capital labels take the archive's name or are tidied ("MANTHORPE GS
  WITS" → "Manthorpe"); river names from the EA, then the archive, then Open Rivers.
- **OS Open Rivers had to be repaired** to give each river one order from source to sea:
  nodes at the same spot merged (within 1.5 m); a river ends only at the sea (a tidal
  stretch or within 500 m of Boundary-Line's high-water line) unless a gap can be bridged;
  other dead ends are gaps, bridged to a stretch within 300 m (1 km on the same river,
  150 m at the sea's edge), never to one that flows back; stretches drawn backwards used
  only where nothing else reaches; Welsh names in English. Now the Thames (Ewen 339 km to
  the sea, Caversham 191), Trent, Severn, Great Ouse, Aire, Nene, Medway, Kennet and
  Witham are each one river in order; 19 smaller cases stay in pieces (review §3).
- **Held** (SPEC §3.4 changed, the list being Claude's): a downstream measure alone no
  longer counts (136 such gauges are gauging weirs or culverts, where the level follows
  the flow); "Locks" isn't a lock (Locks Weir on the Ribble). Navigations come from a
  checked list (`NAVIGATIONS`), each held from its head down: the Thames, the Medway,
  the Great Ouse from Bedford, the Nene, the Kennet from Newbury, the Severn from
  Worcester, the Aire from Leeds, and others. 443 held.
- **History:** for every fifth day of the year, the levels below which each 2.5% of past
  days (a week either side) lie, in whole millimetres; each week's highest and lowest; the
  records. About 26 KB for a 30-year gauge. Against exact day-by-day sums at Caversham, the
  table is 0.6 points out on average (worst 3.1), and the word never differs (1,098 tests).
  The last 60 days aren't used. "Since" uses the three weeks round the date.
- **Day files** are UTC days (24 UTC hours), so clock changes need nothing. A live day's
  usual level matched the archive's to the millimetre on 15 of 18 days tried.

**Found:**
- **Reading's record is 7.54 m on January 7th 2024**, not the mock-up's 7.44 m on the 8th:
  the archive's "lowest" is sometimes a little above its "highest" for the same date, and
  January 7th has no lowest. Such days are kept now; SPEC §7.5 corrected.
- The Loddon at Twyford's archive levels stop in June 2011 (review §11 lists all such).
- Six of the agreed mock-up's figures checked against the history files, all within 5
  points, same word (Caversham 50% against 46%: the table reads between steps five days
  apart while levels rise fast in late October).

**Checks:** `npm run check` 79 passed; breaking the "low" edge and the Thames rule on
purpose made them fail. `tsc -b`, lint and build clean. No page yet, so nothing in a
browser.

**Run 1** of the data repo's History workflow (20.18 to 23.54 UTC, green): **history done**,
1,967 gauges with a file and 142 too short (less than three years), none failed; 54 MB in all
(about 27 KB each; SPEC §6.4 estimated 35 MB). Day files: the archive's 382 dates (September
25th 2025 to October 11th 2026) in its two hours, about 19 seconds a date (6 measured here),
so the live four weeks weren't reached; run 2 (backfill only) started October 31st. The review
remade with the history: 33 gauges' archive levels stop more than two years ago (§11).

### 2026-10-30 — the prompt for stage 1 (notes only)

`design/prompt-stage-1-2026-10-30.md`: what John pastes into a new thread to start stage 1, once
he has agreed the spec and created `JohnBaish/riverwatcher-data`.

### 2026-10-30 — the key agreed; the data repo to be public (branch `claude/hopeful-cerf-uld21e`)

John: the key aligned to the chart is "great" (SPEC question 6 closed; all of §13 answered). He
asked whether the data repo should be public or private: public, on Claude's advice (unlimited free
Actions minutes, Vercel reads it with no key, the EA data is open under the OGL; a README carries
the credit). SPEC §6 and §13 updated.

### 2026-10-30 — flow for locks after launch; the key aligned to the chart (branch `claude/hopeful-cerf-uld21e`)

John agreed flow for lock reaches as stage 6, after launch, with a mock-up first. On the key, he
found left-aligned too far left: it now starts at the chart's own left edge (46/640 of its width on a
computer, 46/360 on a phone), in line with the first date; three-way comparison in
`design/previews/key-compare-*.png`. His wording for "About these figures" on when records start.
Swept again (48 views); private page republished.

### 2026-10-30 — house style re-copied (notes only, straight to `main`)

From clockwheel `674122d`, which now records this repo's two dark-mode findings as house rules: §2
finer text smoothing in dark mode, §3 never bold Caprasimo. The mock-up already follows both.

### 2026-10-30 — John's answers to SPEC §13; "About these figures" edited (branch `claude/hopeful-cerf-uld21e`)

John: the data in its own repo; the managed-reaches list is Claude's; flood warnings measured to
each area's middle; ten highest and lowest for region and England; one OS credit line; his
changes to "About these figures". Open: flow for lock reaches (Claude's advice in SPEC §12.1,
suggested as stage 6 after launch) and the key (left-aligned and centred pictures sent). Checked
for the new "on record" sentence: the first year of all 2,184 river gauges' histories (1,088
before 2000, 365 before 1980, 153 since 2020; the earliest full record the Severn at Montford,
1952; Roe Bridge's single 1919 reading is a stray, so a record starts in its first year with most
days). Counted for flow: 239 of 535 held gauges have a flow gauge on the same river within 15 km;
the Thames 52 of 56. Also wrote John a prompt for a new thread to put the sharper dark text on the
other sites and in the house style (sent to him, not in this repo).

### 2026-10-30 — dark mode: blurry names (branch `claude/hopeful-cerf-uld21e`)

John saw river and gauge names blurry at the edges in dark mode. The colours are the latest
(Hindcaster's agreed dark set). Found: the "Nearest" tag inherited Caprasimo at bold weight,
which Caprasimo doesn't have, so the browser faked the bold (fixed: the body font, as the other
small labels). The headings themselves are true Caprasimo 400; light text on dark looks heavier
on a Mac, so the mock-up now asks for finer smoothing in dark mode only
(`-webkit-font-smoothing: antialiased`), for John to compare. Mac only; can't be seen from this
container. If it helps, it belongs in the house style (Hindcaster has the same). Swept again (48
views); private page republished.

### 2026-10-30 — spec and plan drafted (branch `claude/hopeful-cerf-uld21e`)

`SPEC.md` (what Riverwatcher does, with Agreed and Proposed marked, and eight questions in §13)
and `PLAN.md` (stages 0 to 5). Checked while writing: the archive gives every gauge's daily
highest and lowest for a date in one request (about 2,360 stations, 0.8 MB, five seconds), and all
2,141 matched river gauges have both, so "the usual level" works everywhere; the OS Open Rivers
licence line ("Contains Ordnance Survey data © Crown copyright and database right 2026"). The
storage sizes in SPEC §6 are estimates, to measure in stage 2. Docs only.

### 2026-10-30 — option B revised: John's answers (branch `claude/hopeful-cerf-uld21e`)

John answered batch 3 (`design/content-answers-2026-10-30.md`): all six agreed or to try.
Mock-up: the zero sentence taken out of the charts (kept for "About these figures"), and
"Very high for the time of year" kept on one line in the key. Swept again (48 views, no
errors, no sideways scroll); private page republished.

### 2026-10-30 — option B chosen and revised; locks decided (branch `claude/hopeful-cerf-uld21e`)

**John decided:** locks: B (only "high" and "very high" said at a lock or weir; otherwise
"Held steady by a lock or weir"), A's line ("The level here is held by a weir, so it rises in
very wet weather but says little about low water."), C (prefer free-flowing gauges), and D
(a flow gauge for the reach) when flow is collected, which he's now open to for this. Design:
option B, with gauges grouped by river and in river order (point 1), a chart height that
doesn't exaggerate (point 2) and clearer chart shading (point 3).

**Built in the mock-up (`opt r`, "B revised"):** gauges grouped under each river's name,
nearest river first, each listed upstream to downstream, using each gauge's distance to the
sea along OS Open Rivers (`design/mockups/river-positions.py`); "The Kennet joins here"
between the right Thames gauges, and "Joins the Thames between Caversham Lock and Sonning
Lock" (checked against the map: correct for the Kennet, the Loddon and the Greta). When all
five nearest are held by structures, the nearest free-flowing gauge is added (RG4: the Loddon
at Twyford). Each chart's height always covers its gauge's usual range over the whole year;
its shading is the five judgement colours (pale at the ends), with the five words as the
key; at a lock only the high zones show. The summary goes river by river. "Held by a
structure": named after a lock, weir, sluice, mill or gate, with a downstream gauge, or on
the non-tidal Thames below Lechlade (the Reading gauge isn't named after a lock but its level
barely follows the flow); a first rule only.

**Verified:** all four options for RG4, CA12 and Berkshire at 1200px and 390px with touch,
light and dark (48 views): no errors, no sideways scroll, fonts loaded. Private page
republished. **Couldn't check:** a real phone.

### 2026-10-30 — research: gauges at locks and weirs (branch `claude/hopeful-cerf-uld21e`)

John asked for as much as reasonable on how lock gauges behave, before choosing a design.
`design/locks-research-2026-10-30.md`: what the EA and others publish, and the data. In
short: at the four Thames locks near Reading the level barely moves until flows are in the
top 10%, and its time-of-year word agrees with Reading's flow on 32% to 42% of days
(about 80% at most free-flowing gauges); deliberate lowerings show up as "very low"; the
downstream gauge moved more at 22 of 38 Thames locks this month but has no archive history.
Options A to E for John, with a recommendation (B, A's line, and C). Docs only.

### 2026-10-30 — design options A, B and C (branch `claude/hopeful-cerf-uld21e`)

**What:** one mock-up page in Hindcaster's look (its tokens, dark values, cards, strip,
summary, footer), with a mock-up bar to switch between the options and places:
A, a card for each gauge, figures beside its chart; B, one table of the five gauges, then
the chosen one in detail; C, the five on one shared scale from lowest to highest for the
time of year, then each in detail. The postcode views have the round-up sentence, the
chart with its period buttons (remembered on the device) and the four comparisons; CA12 has
this morning's real flood alert; Berkshire shows the area view (summary, the most unusual
high and low, every gauge folded away).

**Rules used for the mock-ups (to confirm in the spec):** "the usual level" for a day is
the middle of its highest and lowest level (the archive has no daily average level);
the judgement is the last 24 hours' average against those days, a week either side of the
date, in every past year; the chart's bands are the middle half and eight in 10 of those
days. Near-duplicates: backups dropped; on the same river within 100 m, one kept (300 m
merged Caversham Lock into the separate Reading gauge). A gauge's county is its nearest
postcode district's (good enough for a mock-up only). The judgement colours are new (low
water terracotta, high water blue, normal grey, always with the word), each arm checked
with the dataviz validator in light and dark.

**Found:** the archive marks almost every day before about 2015 "Incomplete" though the
day's highest and lowest are there; filtering on it had cut records back to 2011 or 2015.
At locks the level also shows how the lock is run: Sonning Lock was drawn down below zero in
June and July 2026, and reads "very high" today while the Thames's flow is middling.

**Verified:** Chromium, all three options for RG4, CA12 and Berkshire at 1200px and at
390px with touch, light and dark (36 views): no script errors, no sideways scroll, nothing
sticking out, both fonts loaded. Also the year chart, its tooltip, and the chosen period
kept after a reload. Fixed on the way: phone screenshots first came out at 980px (no
viewport tag; `build-options.mjs` now writes a complete page); chart text too small on
phones (now drawn at phone width); the Floodline number breaking across lines.

**Couldn't be checked:** a real phone; whether the GOV.UK link for a flood alert
(`check-for-flooding.service.gov.uk/target-area/<id>`) is right (that host is blocked here).

### 2026-10-30 — batch 2 answered; hourly updates checked (branch `claude/hopeful-cerf-uld21e`)

John answered batch 2 (`design/content-answers-2026-10-30.md`). Hourly updates
checked against the free plans (by web search, so second-hand; re-check before
launch): GitHub's standard runners are free in public repos; cron-job.org allows a
job every minute; Vercel's Hobby plan allows 100 deployments a day and 6,000
build minutes a month, with one build at a time (24 hourly builds a day, plus
branch previews, fits). The EA's own guidance is one call for all latest readings
every 15 minutes. **The real limit is the repo's size:** every hourly commit adds
to git history for good, so the collector must keep its hourly files small (to
design in the spec). The cron-job.org token will expire and need renewing, as
Hindcaster's.

### 2026-10-30 — the main page's content, batch 1 (branch `claude/hopeful-cerf-uld21e`)

John answered batch 1 (`design/content-answers-2026-10-30.md`): judgement first;
the five words; a choice of two weeks to a year for the chart; all four history
comparisons if room; the nearest five within 10 miles; metres and centimetres;
flood warnings only when there are some; Hindcaster's views. Checked: the live
feed keeps about four weeks, so longer charts come from the archive.

### 2026-10-30 — correction: lock levels do move (branch `claude/hopeful-cerf-uld21e`)

John asked whether Caversham's downstream gauge would move more. Checked across
October: the upstream gauge (the one chosen) rose from about 0.16 m to 0.29 m as the
Thames's flow rose, from higher than 17% to higher than 88% of daily highs for the
time of year; the downstream gauge moved less (about 1.99 m to 2.05 m) and has no
archive history. My earlier "barely moves" compared figures from dates that didn't
overlap. `design/data-tests-2026-10-30.md` finding 10 corrected.

### 2026-10-30 — data tests; repo started (branch `claude/hopeful-cerf-uld21e`)

**What:** tested the research notes' open questions against the EA's live APIs
(`design/data-tests-2026-10-30.md`). In short: a browser can call both APIs; 2,972
river gauges report now, each with one usable level measure; about 2,200 match
the archive by the same reference, and the archive's 15-minute levels equal the
live ones; Caversham Lock's level goes back to 1995 and Reading's flow to 1992;
the nearest gauge to a postcode district's middle is 1.5 miles at the median.

**John decided:** a Hindcaster-style collector (B); postcode district centres;
no flow for now; flood warnings in the first version if easy. He created the
repo. Copied in the house style files and the research notes (word for word, as
`design/research-notes-2026-10-25.md`). Tracker updated.

**Couldn't be checked:** gauges just over the Welsh or Scottish borders; how
often the EA corrects its provisional figures; the history of more than two
gauges; anything in a browser at phone width (nothing to show yet).
