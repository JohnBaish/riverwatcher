# Riverwatcher's launch: John's steps (stage 5, step 4)

Written November 2nd 2026 from the other tools' set-ups. Vercel's own pages can't be opened from
Claude's sessions, so if a button has moved or been renamed, tell Claude what you see.

The order matters: **A** first, then Claude checks the preview with you; **B to E** only after
you've said merge.

## A. The Vercel project (now)

1. On vercel.com, **Add New… → Project**. Choose **JohnBaish/riverwatcher** from the list. If it
   isn't listed, use "Adjust GitHub App Permissions" and add it.
2. Leave every setting as it is (Framework: Vite). The repo's `vercel.json` sets the build: it
   fetches the latest figures from `JohnBaish/riverwatcher-data` each time, then builds the page.
3. Press **Deploy**. **This first build will fail**, as `main` doesn't have `vercel.json` yet.
   That's expected and harmless (Refueller's and Hindcaster's first builds failed the same way).
4. Tell Claude. Claude pushes to the working branch, which makes a preview address
   (`riverwatcher-git-claude-sweet-hamilton-oje25t-john-baish.vercel.app`) for you to try.

## B. riverwatcher.baish.net (after the merge)

1. In the **riverwatcher** project (not another one: Hindcaster's domain once went to the wrong
   project and showed Flowcharter), **Settings → Domains → Add**, type `riverwatcher.baish.net`.
2. Vercel shows a **CNAME** record to make. At names.co.uk, add it as you did for Refueller:
   name `riverwatcher`, type CNAME, value exactly as Vercel gives it.
3. Wait until Vercel says **Valid Configuration**. If your phone says the address can't be found
   at first, give it a little while: it can remember that the address didn't exist.

## C. Web Analytics (after the merge)

In the riverwatcher project, **Analytics → Enable** (Web Analytics, the free one). The page
already has the code; it sends the address without the part after "#", so no postcode is ever
included.

## D. The deploy hook (after the merge): the hourly rebuild

The figures are collected into `JohnBaish/riverwatcher-data`, but Vercel builds from
`JohnBaish/riverwatcher`, so it needs telling when new figures arrive.

1. In the riverwatcher project, **Settings → Git → Deploy Hooks**. Name: `collector`. Branch:
   `main`. Press **Create Hook**. Copy the address it shows. **It's a secret: don't paste it into
   the chat.**
2. On github.com, open **JohnBaish/riverwatcher-data → Settings → Secrets and variables →
   Actions → New repository secret**. Name: `VERCEL_DEPLOY_HOOK`. Paste the address. **Add secret**.
3. Tell Claude. Claude adds the step that uses it to the data repo's Collect workflow (it needs
   write access to that repo for this session) and checks the next hourly run rebuilt the site.

If Vercel has no Deploy Hooks section on the free plan, tell Claude: there's another way.

## E. Search Console (once riverwatcher.baish.net works)

1. Check `https://riverwatcher.baish.net/robots.txt` and `/sitemap.xml` open as plain text, not
   the page.
2. In Search Console, your **baish.net** domain property (it covers every subdomain):
   **Sitemaps → Add** `https://riverwatcher.baish.net/sitemap.xml`.
3. **URL Inspection** → `https://riverwatcher.baish.net/` → **Test live URL** → **Request
   indexing**.
