# Prompt: Riverwatcher stage 4

*For John to paste into a new Claude Code thread. Written by Claude Code on Saturday October
31st 2026, at the end of the thread that built stage 3.*

*Repos for the thread: `JohnBaish/riverwatcher` (code) and `JohnBaish/riverwatcher-data`
(data) to write to; `JohnBaish/hindcaster`, `JohnBaish/lightreader`, `JohnBaish/clockwheel` and
`JohnBaish/baish.net-directory` (to read, and the tracker to update).*

---

Please start **stage 4 of Riverwatcher: the county, region and England views, and the full
chooser**.

Read these first, in this order: `CLAUDE.md` in `JohnBaish/riverwatcher` (its reading list,
layout and log, especially the October 31st entries), then `SPEC.md` (§8 for this stage) and
`PLAN.md`. Everything agreed with me is in those files and the `design/` notes they point to;
where they're silent, ask me rather than guess.

Things to know before starting:

1. **Stage 3 is done and on `main`.** The postcode view is built from Hindcaster's parts and the
   real data, and I approved it with no changes. Reuse its pieces: `src/lib/view.ts` (chips,
   sentences, river groups), `src/components/PostcodeView.tsx` and `Chart.tsx`, and the data
   parts made by `scripts/lib/pageData.ts`.
2. **Show me before wiring anything in.** Mock up the area views first with the app's own parts
   and the real data, at 1200px and 390px, light and dark. I like being able to try things on a
   private page (the stage 3 one is https://claude.ai/artifact/4dtJG2SmggjVjhq4PgsvJt; how it
   was made is in the log). Send pictures as file cards, not links to repo files.
3. **The chooser is Hindcaster's** (postcode box, a county list, a region list, and England;
   `src/components/Chooser.tsx` there), with the addresses after "#" as Hindcaster's.
4. **Each gauge already has its county and region** in `data/gauges.json` (48 counties, 9
   regions, from OS Boundary-Line). Nine gauges just over the Welsh and Scottish borders have
   none: they still count for postcode views, but not for any area.
5. **Keep the promise:** every visitor loads the same files whatever they choose (decided by me,
   October 31st).
6. **Agreed wording to reuse:** held gauges only count on the high side; option C for rivers
   whose gauges differ (a span for words next to each other, each gauge named otherwise); "No long
   record to compare."; the chart bands all at the same strength. New wording (the area summary,
   headings, notes) is mine to decide: draft it and show me.
7. **The collector runs hourly** (cron-job.org, from October 31st; its key expires January 29th
   2027). The monthly top-up runs on November 3rd with the new archive cleaning rules.

Work on a branch. Notes and documents can go to `main` without asking; anything else waits for
me (HOUSE-STYLE §10). Update `CLAUDE.md` and the tracker as you go.
