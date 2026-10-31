import react from '@vitejs/plugin-react'
import { join } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import { dataDir, pageData, SOURCES, type PageData } from './scripts/lib/pageData.ts'

/** The page's figures as parts (src/lib/pageTypes.ts), as Hindcaster's: `meta` is built into
 *  the page; `gauges`, `hours`, `hours42` and `daily` become their own files, loaded when a
 *  view first needs them. The same files for every visitor, whatever they choose. Made from
 *  the data repo on every build (scripts/lib/pageData.ts), so each data commit makes Vercel
 *  rebuild the site with the new figures. */
function riverwatcherData(): Plugin {
  const PREFIX = 'virtual:riverwatcher/'
  const PARTS = ['meta', 'gauges', 'hours', 'hours42', 'daily'] as const
  let cached: PageData | null = null
  return {
    name: 'riverwatcher-data',
    resolveId(id) {
      return id.startsWith(PREFIX) && (PARTS as readonly string[]).includes(id.slice(PREFIX.length)) ? `\0${id}` : null
    },
    load(id) {
      if (!id.startsWith(`\0${PREFIX}`)) return null
      for (const f of SOURCES) this.addWatchFile(join(dataDir(), f))
      cached ??= pageData()
      const part = cached[id.slice(PREFIX.length + 1) as keyof PageData]
      // JSON.parse of a string is quicker for the browser than the same data as JavaScript.
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(part))})`
    },
    watchChange(id) {
      if (SOURCES.some((f) => id.endsWith(f))) cached = null
    },
  }
}

export default defineConfig({
  plugins: [react(), riverwatcherData()],
  // Keep the libraries' licence notices in the built scripts, as their licences ask.
  build: { rolldownOptions: { output: { comments: { legal: true } } } },
})
