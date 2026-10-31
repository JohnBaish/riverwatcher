# Riverwatcher: starting the collector every hour (cron-job.org)

For John. The same arrangement as Hindcaster's (October 18th 2026): cron-job.org asks GitHub
to start the data repo's Collect workflow once an hour. Two parts: a GitHub access key, then
the job.

## 1. A GitHub access key, for the data repo only

1. On github.com: your picture (top right) → **Settings** → **Developer settings** (bottom of
   the left-hand list) → **Personal access tokens** → **Fine-grained tokens** →
   **Generate new token**.
2. **Token name:** `riverwatcher cron-job.org`.
3. **Expiration:** 90 days is the longest GitHub suggests; note the date it gives (Claude will
   put it in PLAN.md's dates to remember).
4. **Repository access:** "Only select repositories" → **JohnBaish/riverwatcher-data**.
5. **Permissions** → Repository permissions → **Actions: Read and write**. Leave everything
   else as it is.
6. **Generate token**, and copy it. Paste it only into cron-job.org (step 2.6), never into a
   chat.

## 2. The job on cron-job.org

1. Sign in (the same account as Hindcaster's jobs) → **Create cronjob**.
2. **Title:** `Riverwatcher collect`.
3. **URL:** `https://api.github.com/repos/JohnBaish/riverwatcher-data/actions/workflows/collect.yml/dispatches`
4. **Execution schedule:** every hour, at **10 minutes past** (the "every hour" option with
   minute 10, or the custom schedule `10 * * * *`).
5. Open **Advanced**. **Request method:** `POST`.
6. **Headers:** add four. Each goes in two boxes, the name in "Key" and the rest in "Value":

   | Key | Value |
   |---|---|
   | `Accept` | `application/vnd.github+json` |
   | `Authorization` | `Bearer ` followed by the token from step 1 |
   | `X-GitHub-Api-Version` | `2022-11-28` |
   | `Content-Type` | `application/json` |

7. **Request body:** `{"ref":"main"}`
8. Save, then use **Test run**: it should answer `204 No Content`, and a new Collect run should
   appear under the Actions tab of `JohnBaish/riverwatcher-data` within a minute.

Tell Claude when it's done; Claude will check the first few hours of runs.
