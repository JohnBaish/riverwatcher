# Prompt: Riverwatcher stage 1

*For John to paste into a new Claude Code thread. Written by Claude Code on Friday October 30th
2026. Before starting the thread, John creates `JohnBaish/riverwatcher-data` (public, empty).*

*Repos for the thread: `JohnBaish/riverwatcher` and `JohnBaish/riverwatcher-data` (to write to);
`JohnBaish/hindcaster`, `JohnBaish/lightreader`, `JohnBaish/clockwheel` and
`JohnBaish/baish.net-directory` (to read, and the tracker to update).*

---

I agree Riverwatcher's spec. Please start **stage 1: the gauge list and its history** (no page
yet).

Read these first, in this order: `CLAUDE.md` in `JohnBaish/riverwatcher` (its reading list and
log), then `SPEC.md` and `PLAN.md` there. Stage 1 is in `PLAN.md`. Everything agreed with me is in
those files and the `design/` notes they point to; where they're silent, ask me rather than
guess.

Things to know before starting:

1. **The data goes in `JohnBaish/riverwatcher-data`** (public), not in the code repo
   (SPEC §6). Give it a short README with the Environment Agency credit.
2. **Reuse what's already proven**: Hindcaster's EA handling and its OS Boundary-Line area
   builder (`scripts/build-areas.ts`), Lightreader's `src/data/outcodes.json`, and in this repo
   `design/mockups/fetch-mock-data.mjs` (the gauge rules, history and comparisons, as used in the
   agreed mock-up) and `design/mockups/river-positions.py` (OS Open Rivers positions and joins),
   rewritten in TypeScript.
3. **Findings that matter** (in `design/data-tests-2026-10-30.md` and `SPEC.md`): the archive
   marks almost every day before about 2015 "Incomplete", so ignore completeness; some gauges have
   a stray early reading (a record starts in its first year with most days present); the archive
   gives every gauge's daily highest and lowest for a date in one request.
4. **Downloads** (not kept in either repo): OS Open Rivers and OS Boundary-Line, from `api.os.uk`.
   If a site is blocked in this environment, tell me which to allow.
5. **The held list** (gauges held by a lock or weir, SPEC §3.4) is yours to draft; I don't need to
   see it.
6. **The long history download** runs in GitHub Actions ("Run workflow"), carrying on where it
   stopped if interrupted, at a gentle pace for the EA.

Work on a branch. Notes and documents can go to `main` without asking; anything else waits for me
(HOUSE-STYLE §10). When stage 1 is done, show me `design/gauge-review.md`, and tell me plainly what
was built, what was checked, and what couldn't be. Update `CLAUDE.md` and the tracker
(`projects/riverwatcher.md` and `INDEX.md` in `JohnBaish/baish.net-directory`) as you go.
