# Prompt: Riverwatcher stage 3

*For John to paste into a new Claude Code thread. Written by Claude Code on Saturday October
31st 2026, at the end of the thread that built stages 1 and 2.*

*Repos for the thread: `JohnBaish/riverwatcher` (code) and `JohnBaish/riverwatcher-data`
(data) to write to; `JohnBaish/hindcaster`, `JohnBaish/lightreader`, `JohnBaish/clockwheel` and
`JohnBaish/baish.net-directory` (to read, and the tracker to update).*

---

Please start **stage 3 of Riverwatcher: the postcode view**.

Read these first, in this order: `CLAUDE.md` in `JohnBaish/riverwatcher` (its reading list,
layout and log, especially the two stage 1 entries and the stage 2 entry), then `SPEC.md`
and `PLAN.md` there. Stage 3 is in `PLAN.md`. Everything agreed with me is in those files and
the `design/` notes they point to; where they're silent, ask me rather than guess.

Things to know before starting:

1. **Show me before wiring anything in** (PLAN stage 3.1): the agreed design ("B revised" in
   `design/mockups/options.html`, online at https://claude.ai/artifact/SK5qN1PJKSYwgqqJXEpNDG)
   rebuilt with the app's own parts and the real data, at 1200px and 390px, light and dark.
2. **The data is ready** in `JohnBaish/riverwatcher-data` (`data/gauges.json`,
   `data/history/`, `data/days/`, `data/latest.json`, `data/quiet.json`). The page reads it at
   build time; the Vercel build will need the data repo cloned (it's public). Keep what a
   postcode view loads small (PLAN 3.2): only its gauges' history, loaded when needed, as
   Hindcaster's `src/lib/load.ts`.
3. **Decisions since the spec was agreed** (all in SPEC.md and the log): fen drains and rhynes
   are held; "History incomplete" names the gap (SPEC §4.7, the `gaps` in each history file);
   gauges with no history or typical range only make up the nearest five, with a plain line
   instead of the judgement, and flat or stuck ones are left out (SPEC §3.7,
   `data/quiet.json`); Reading's record is 7.54 m on January 7th 2024. The wording of these
   new lines is mine to decide: draft it and show me.
4. **The rules are already written and checked** in `scripts/lib/` (`history.ts`: the
   judgement, "since", Steady; `collect.ts`; `gauges.ts`). Reuse them in the page rather than
   writing them again.
5. **Reuse Hindcaster's page parts** (top bar, place strip, summary card, cards, footer, dark
   mode following the device, the safety net) and Lightreader's `src/data/outcodes.json` for
   postcodes.
6. **The collector** may or may not be running hourly yet (I'm setting up cron-job.org); if
   not, `data/latest.json` is from the last run by hand, which is fine for building.

Work on a branch. Notes and documents can go to `main` without asking; anything else waits for
me (HOUSE-STYLE §10). Send me files as file cards, not links (links to repo files don't open
in my app). Update `CLAUDE.md` and the tracker as you go.
