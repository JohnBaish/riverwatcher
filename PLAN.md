# Riverwatcher — build plan

What gets built, in what order. `SPEC.md` says what each part does. Each stage is built on its
own branch and merged to `main` only when John says (notes and documents may be merged without
asking, HOUSE-STYLE §10). Each stage ends with a browser check at 1200px and at 390px with touch
emulation, in light and dark, saying what couldn't be checked, and a dated entry in `CLAUDE.md`.

**Nothing is built until John has agreed `SPEC.md`** (its §13 questions answered).

## Stage 0 — spec and plan (now)

`SPEC.md` and this file, from the data tests, John's answers, the lock research and option B
revised. Done when John agrees the spec.

## Stage 1 — the gauge list and its history (no page yet)

1. Set up the project as Hindcaster's: Vite, React and TypeScript, the same tool versions, `npm
   run check` (Node runs the checks directly; no test framework), lint, type check.
   **John's job:** create the data repo, `JohnBaish/riverwatcher-data` (public, empty), and add it
   to the session.
2. **The rules as plain functions** (in `scripts/lib/`), reusing Hindcaster's EA handling where
   it fits: which gauges count (SPEC §3), near-duplicates, the held list, "for the time of year"
   (§4), "Steady", and the comparisons. Each with checks, including real cases from the tests
   (Caversham, Sonning, Reading, Greta Bridge, the Kennet's join).
3. **`npm run gauges`:** the gauge list: the EA's stations, the archive match, OS Open Rivers
   positions and joins (from `design/mockups/river-positions.py`, rewritten in TypeScript),
   counties and regions from OS Boundary-Line (Hindcaster's `build-areas.ts`), the held list.
   Writes `design/gauge-review.md` for John: the held list, gauges with no river name, gauges far
   from any river, lakes, and odd cases.
4. **`npm run history`:** each gauge's history file from the archive (SPEC §6.4). The first full
   run takes hours (about two requests per gauge), so it runs in GitHub Actions ("Run workflow"),
   carrying on where it stopped if interrupted.
5. **The backfill:** the past year's daily levels (one archive request per date) and the last four
   weeks of hourly readings (one live request per gauge, once).

Done when the checks pass, the review list has been through John, and every reporting gauge has
its figures or a stated reason why not.

## Stage 2 — the collector

1. `scripts/collect.ts` and `.github/workflows/collect.yml`: every hour, the latest readings and
   the flood warnings, `data/latest.json`, and after midnight the day's file (SPEC §5, §6). Logs
   each run (what came in, how many gauges are silent, how long it took) in `data/runs/`.
2. A monthly workflow: the gauge list and the history topped up (as Hindcaster's `gauges.yml`).
3. **John's jobs:** the cron-job.org job (hourly), with a GitHub access key limited to this repo;
   noting the key's expiry date below.
4. Watch a few days: run times, file sizes against SPEC §6's estimates, the repo's growth.

## Stage 3 — the postcode view

1. Mock-up check first: the page from `design/mockups/options.html` ("B revised") rebuilt with
   the app's own parts, shown to John at both widths, light and dark.
2. The page: the place strip, flood warnings, the summary, the river cards, the chosen gauge in
   detail with its chart and comparisons (SPEC §7), the postcode box, dark mode, the safety net
   (HOUSE-STYLE §5). The figures split into parts loaded when needed, as Hindcaster's
   (`src/lib/load.ts`), so a postcode view loads only its five gauges' history.
3. Every sentence the page can make checked in `npm run check` (HOUSE-STYLE §11: every
   generated sentence), and real postcodes swept in the browser (RG4, CA12, a coastal one, a
   border one, the Isles of Scilly).

## Stage 4 — county, region and England

The chooser, as Hindcaster's, and the area views (SPEC §8).

## Stage 5 — finishing and launch

1. "About these figures" and the credits (SPEC §9, §10), once John has edited them.
2. Favicon options and the link-preview image, shown to John first (HOUSE-STYLE §7).
3. Search: title, description, `robots.txt`, `sitemap.xml` (`SEO-HANDOVER.md`).
4. **John's jobs:** the Vercel project, `riverwatcher.baish.net`, Web Analytics, Search Console.
5. A `/fresh-look` review; the fixes John chooses.
6. The tracker, the baish.net hub card (in clockwheel, with John's OK) and the overview PDF.

## Stage 6 — flow for lock reaches (after launch, if John agrees: SPEC question 4)

A mock-up first, then: flow history for the flow gauges, each held gauge paired with a flow gauge
on the same river (SPEC §12.1), the flow line in the rows, the detail and the summary.

## Later

SPEC §12: downstream gauges, tidal stations, groundwater, full postcodes, Wales and Scotland.

## Dates to remember

- The cron-job.org GitHub access key: expiry date to note when it's made (stage 2).
- The Vercel deploy hook (a secret in GitHub Actions): made in stage 2.
- Re-check the free plans' limits (GitHub, cron-job.org, Vercel) before launch.
