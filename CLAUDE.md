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
   John's answers.
3. `HOUSE-STYLE.md`: the shared look and ways of working. Copied from
   clockwheel on 2026-10-30 (commit `aa12cd6`), with `SEO-HANDOVER.md`,
   `.claude/skills/fresh-look/` and `.gitignore`. Clockwheel holds the master
   copies; if they change, re-copy them and note it here.
4. The tracker: `projects/riverwatcher.md` in `JohnBaish/baish.net-directory`.

No `SPEC.md` or `PLAN.md` yet: John wants them once he has picked a design.

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
- **Project tracker:** when something significant changes (a stage finished, a decision made, something goes live or is parked), update this project's file and its line in `INDEX.md` in `JohnBaish/baish.net-directory`, following that repo's README. Also at the end of each session (John).

Scope (decided by John):

- River levels only: no tidal, groundwater or rainfall.
- No flow at this stage (October 30th): come back later to whether it's worth
  having and what it would look like.
- Flood warnings in the first version, if easy (they look it: finding 11).

## Log

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
