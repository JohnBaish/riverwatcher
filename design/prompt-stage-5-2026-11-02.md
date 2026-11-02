# Prompt: Riverwatcher stage 5

*For John to paste into a new Claude Code thread. Written by Claude Code on Monday November 2nd
2026, at the end of the thread that built stage 4.*

*Repos for the thread: `JohnBaish/riverwatcher` (code) and `JohnBaish/riverwatcher-data`
(data) to write to; `JohnBaish/clockwheel` (the house style, the baish.net hub page and the
overview), `JohnBaish/hindcaster`, `JohnBaish/lightreader` and `JohnBaish/refueller` (to read,
as models for stage 5), and `JohnBaish/baish.net-directory` (the tracker to update).*

---

Please start **stage 5 of Riverwatcher: finishing and launch**.

Read these first, in this order: `CLAUDE.md` in `JohnBaish/riverwatcher` (its reading list,
layout and log, especially the November 1st and 2nd entries), then `SPEC.md` (§9 and §10 for
this stage) and `PLAN.md` (stage 5). Everything agreed with me is in those files and the
`design/` notes they point to; where they're silent, ask me rather than guess.

Things to know before starting:

1. **Stages 1 to 4 are done and on `main`.** The postcode view (stage 3) and the chooser with the
   county, region and England views (stage 4) are built from the real data, and I've agreed all
   their wording. Nothing is public yet: there's no Vercel project.
2. **Work in PLAN's order, one step at a time, showing me before wiring anything in:**
   1. "About these figures" and the credits (SPEC §9, §10). Send me the text exactly as the page
      shows it now (`src/components/About.tsx` has moved on from SPEC §9's draft), with anything
      missing marked: SPEC §9 lists two sentences still to add, and the area views (stage 4: how
      "the most unusual" is chosen, how county and region summaries count gauges) may need one.
      I'll edit it.
   2. Favicon options and the link-preview image, as rendered previews, for me to choose
      (HOUSE-STYLE §7; Refueller and Lightreader are recent examples of how it was done).
   3. Search: title, description, `robots.txt`, `sitemap.xml`, following `SEO-HANDOVER.md`.
      Wording for me to decide.
   4. My jobs, with plain step-by-step instructions: the Vercel project, `riverwatcher.baish.net`
      (a DNS record), Web Analytics, Search Console. The Vercel deploy hook for the collector
      (PLAN's "Dates to remember") is part of this.
   5. A `/fresh-look` review, then the fixes I choose.
   6. The tracker, the baish.net hub card (in clockwheel, with my OK first) and the overview.
3. **I like being able to try things on a private page.** The stage 4 one is
   https://claude.ai/artifact/HPLho3yo9oYxEjb2tNDgNd (how it was made is in the log). Send
   pictures as file cards, not links to repo files.
4. **Keep the promises:** nothing a visitor types or chooses leaves their browser; every visitor
   loads the same files whatever they choose; no cookies.
5. **Re-check the free plans' limits** (GitHub, cron-job.org, Vercel) before launch, as PLAN says.
6. **Things to keep an eye on:** the collector runs hourly from cron-job.org (its GitHub key
   expires January 29th 2027). The Monthly workflow should first run on November 3rd at 02.23
   UTC; if GitHub doesn't start it, I re-save `monthly.yml` on github.com (PLAN). The collector
   now carries on when an EA page fails (November 2nd entry); check its runs look healthy.

Work on a branch. Notes and documents can go to `main` without asking; anything a visitor could
see waits for me (HOUSE-STYLE §10). After a merge, tidy the branch with the "Delete merged
branches" workflow yourself (trial run first). Update `CLAUDE.md` and the tracker as you go.
