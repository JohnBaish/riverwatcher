// Fetching from the Environment Agency's two open APIs (Open Government Licence, no key):
// the real-time flood-monitoring API and the Hydrology archive. Both reply with JSON (or
// CSV for bulk readings). A failed request is tried again, a little later each time.

export const FM = 'https://environment.data.gov.uk/flood-monitoring'
export const HY = 'https://environment.data.gov.uk/hydrology'

/** A value the APIs give as one item or a list (or leave out) as a list. */
export const list = <T>(x: T | T[] | null | undefined): T[] => (Array.isArray(x) ? x : x == null ? [] : [x])

/** The last part of an "@id" address: ".../id/measures/2201TH-level-stage-i-15_min-mASD"
 *  gives "2201TH-level-stage-i-15_min-mASD". */
export const lastPart = (id: unknown): string => String(id).split('/').pop() ?? ''

export const sleep = (ms: number) => new Promise((ok) => setTimeout(ok, ms))

/** The body of a GET request, tried up to `tries` times (waiting 5, 10, 15 seconds …).
 *  A 404 isn't tried again: it gives null. */
export async function getText(url: string, tries = 4, timeoutMs = 120_000): Promise<string | null> {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
      if (r.status === 404) return null
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.text()
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${(e as Error).message}`)
      await sleep(5000 * i)
    }
  }
}

export async function getJson<T = unknown>(url: string, tries?: number, timeoutMs?: number): Promise<T | null> {
  const t = await getText(url, tries, timeoutMs)
  return t === null ? null : (JSON.parse(t) as T)
}

/** The rows of a CSV reply, as objects keyed by the header row. The EA quotes every cell;
 *  none of the cells used here contains a comma inside quotes, but quoted commas are kept. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(Boolean)
  const cells = (line: string) => {
    const out: string[] = []
    let cur = '', q = false
    for (const ch of line) {
      if (ch === '"') q = !q
      else if (ch === ',' && !q) { out.push(cur); cur = '' }
      else cur += ch
    }
    out.push(cur)
    return out
  }
  const head = cells(lines[0] ?? '')
  return lines.slice(1).map((l) => Object.fromEntries(cells(l).map((c, i) => [head[i], c])))
}
