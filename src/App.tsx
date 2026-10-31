import { Component, useEffect, useState, type ReactNode } from 'react'
import meta from 'virtual:riverwatcher/meta'
import { clock } from './lib/format.ts'
import { hashOf, parseHash, savedChoice, type Route } from './lib/route.ts'
import { AboutFigures, Credits } from './components/About.tsx'
import { Chooser } from './components/Chooser.tsx'
import { PostcodeView } from './components/PostcodeView.tsx'
import { ThemeSwitch } from './components/ThemeSwitch.tsx'

// Stage 3: the chooser's postcode box and the postcode view (SPEC §7, §8.1). Each has its own
// address after "#" (#choose, #postcode/RG4), never sent to the server. A returning visitor
// opens on their last choice, kept on their own device (src/lib/route.ts).

function startingRoute(): Route {
  const fromAddress = parseHash(location.hash)
  if (fromAddress) return fromAddress
  const saved = savedChoice()
  if (saved) history.replaceState(null, '', hashOf(saved))
  return saved ?? { kind: 'choose' }
}

/** The safety net (HOUSE-STYLE §5): if a view can't be shown, a message and the way back to
 *  the chooser, rather than an empty page. Keyed by the choice, so a new one starts afresh. */
class SafetyNet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="card not-found" role="alert">
        <p>Sorry, this page couldn't be shown. Choose another place, or try again later.</p>
        <a className="btn btn-secondary" href="#choose">Choose again</a>
      </div>
    )
  }
}

export default function App() {
  const [route, setRoute] = useState<Route>(startingRoute)
  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash(location.hash) ?? { kind: 'choose' })
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  return (
    <>
      <nav className="nav" data-noprint>
        <a className="nav-brand" href="#choose">Riverwatcher</a>
        <div className="nav-right">
          {route.kind !== 'choose' && <span className="tag tag-neutral">Updated {clock(new Date(meta.made))}</span>}
          <ThemeSwitch />
        </div>
      </nav>
      <main className="col screen">
        <SafetyNet key={hashOf(route)}>
          {route.kind === 'postcode' ? <PostcodeView key={route.code} code={route.code} /> : <Chooser />}
        </SafetyNet>
        {route.kind === 'postcode' && <AboutFigures />}
        <footer className="footer-notice" data-noprint>
          <Credits />
          Riverwatcher is a free-to-use personal project by John Baish. More free tools at{' '}
          <a href="https://www.baish.net/" target="_blank" rel="noopener noreferrer" className="footer-link">www.baish.net</a>.
          {' '}Contact: workshop@baish.net. We don't record anything you do here, apart from anonymous visit statistics (no
          cookies, no personal data) showing us how the site is used. Your device, rather than the website, stores your last
          choices (location, chart period and light or dark mode), so the page opens the same way next time.
        </footer>
      </main>
    </>
  )
}
