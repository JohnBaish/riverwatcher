// Loads the page's parts (src/lib/pageTypes.ts) once each, when a view first needs them, as
// Hindcaster's. The same files for every visitor and every choice: nothing about the choice
// is sent.

import { useEffect, useState } from 'react'
import type { PageDaily, PageGauge, PageHours } from './pageTypes.ts'

export type Parts = { gauges: PageGauge[]; hours: PageHours; hours42: PageHours; daily: PageDaily }
type Name = keyof Parts

const loaders: { [K in Name]: () => Promise<Parts[K]> } = {
  gauges: () => import('virtual:riverwatcher/gauges').then((m) => m.default),
  hours: () => import('virtual:riverwatcher/hours').then((m) => m.default),
  hours42: () => import('virtual:riverwatcher/hours42').then((m) => m.default),
  daily: () => import('virtual:riverwatcher/daily').then((m) => m.default),
}
const cache = new Map<Name, Promise<unknown>>()

export function load<K extends Name>(name: K): Promise<Parts[K]> {
  let p = cache.get(name)
  if (!p) {
    // A failed load isn't kept, so it can be tried again.
    p = loaders[name]().catch((e: unknown) => { cache.delete(name); throw e })
    cache.set(name, p)
  }
  return p as Promise<Parts[K]>
}

export type Loaded<T> = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; value: T }

/** The parts a view needs, loaded together. */
export function useParts<K extends Name>(names: K[]): Loaded<Pick<Parts, K>> {
  const [loaded, setLoaded] = useState<Loaded<Pick<Parts, K>>>({ state: 'loading' })
  const key = names.join(',')
  useEffect(() => {
    let live = true
    Promise.all(key.split(',').map((n) => load(n as K).then((v) => [n, v] as const)))
      .then((pairs) => { if (live) setLoaded({ state: 'ready', value: Object.fromEntries(pairs) as Pick<Parts, K> }) })
      .catch(() => { if (live) setLoaded({ state: 'failed' }) })
    return () => { live = false }
  }, [key])
  return loaded
}
