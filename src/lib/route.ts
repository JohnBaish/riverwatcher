// Where the page is (as Hindcaster's): the chooser, or one view. Each has its own address after
// "#" (HOUSE-STYLE §6: the phone's Back gesture stays inside the tool), so a view can be
// bookmarked or shared: #postcode/RG4, #county/berkshire, #region/south-east-england,
// #england; #choose is the chooser. Everything after "#" stays in the browser: it is
// never sent to the server, so a typed postcode isn't either.
//
// The last choice is kept on the visitor's own device (as Hindcaster's: SPEC §8.1), so the page
// opens on it next time. STORAGE_KEY must never change once live (HOUSE-STYLE §8).

export type Route =
  | { kind: 'choose' }
  | { kind: 'postcode'; code: string }
  | { kind: 'county'; slug: string }
  | { kind: 'region'; slug: string }
  | { kind: 'england' }

export const STORAGE_KEY = 'riverwatcher.choice'

/** The route for an address's "#…" part; null when there is none, or it isn't one of ours. */
export function parseHash(hash: string): Route | null {
  const h = decodeURIComponent(hash.replace(/^#/, '')).trim()
  if (h === 'choose') return { kind: 'choose' }
  if (h === 'england') return { kind: 'england' }
  const m = /^(postcode|county|region)\/([A-Za-z0-9-]+)$/.exec(h)
  if (!m) return null
  if (m[1] === 'postcode') return { kind: 'postcode', code: m[2].toUpperCase() }
  return { kind: m[1] as 'county' | 'region', slug: m[2].toLowerCase() }
}

export function hashOf(r: Route): string {
  switch (r.kind) {
    case 'choose': return '#choose'
    case 'england': return '#england'
    case 'postcode': return `#postcode/${r.code}`
    default: return `#${r.kind}/${r.slug}`
  }
}

/** The last choice kept on this device, or null. Storage can be missing or refused
 *  (a private window, blocked site data), so every use is guarded. */
export function savedChoice(): Route | null {
  try {
    const r = parseHash(localStorage.getItem(STORAGE_KEY) ?? '')
    return r && r.kind !== 'choose' ? r : null
  } catch {
    return null
  }
}

export function saveChoice(r: Route) {
  if (r.kind === 'choose') return
  try {
    localStorage.setItem(STORAGE_KEY, hashOf(r))
  } catch {
    // Not kept: the page still works, it just opens on the chooser next time.
  }
}
