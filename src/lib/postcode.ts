// Looking up a postcode in the bundled list (src/data/outcodes.json, from Lightreader), so
// nothing typed is sent anywhere. Postcode-district precision: only the first half is used.

import data from '../data/outcodes.json' with { type: 'json' }

export type District = { code: string; latitude: number; longitude: number; name: string }

const OUTCODES = data.outcodes as unknown as Record<string, [number, number, string | null]>

/** The first half of a postcode, from whatever someone types: "rg4", "RG4 7HN", "rg47hn".
 *  Null if it can't be a postcode (as Hindcaster's and Lightreader's). */
export function outwardCode(typed: string): string | null {
  const t = typed.toUpperCase().replace(/\s+/g, '')
  const m = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})?$/.exec(t)
  return m ? m[1] : null
}

/** The district for an outward code, or null if it isn't one in England. */
export function district(code: string): District | null {
  const d = OUTCODES[code]
  return d ? { code, latitude: d[0], longitude: d[1], name: d[2] || code } : null
}
