// The chooser, as Hindcaster's (SPEC §8.1): a postcode, a county or region, or all of England.
// What's typed is worked out in the browser and never sent anywhere.

import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import meta from 'virtual:riverwatcher/meta'
import { district, outwardCode } from '../lib/postcode.ts'
import { hashOf, type Route } from '../lib/route.ts'
import type { AreaChoice } from '../lib/pageTypes.ts'

const go = (r: Route) => { location.hash = hashOf(r) }

/** A county or region list (Hindcaster's): chosen with a mouse or a finger, it goes straight
 *  there; with the keyboard, the arrow keys only move through the list, and Enter shows it. */
function AreaList({ id, kind, label, prompt, items }: { id: string; kind: 'county' | 'region'; label: string; prompt: string; items: AreaChoice[] }) {
  const [chosen, setChosen] = useState('')
  const byKeys = useRef(false)
  const [keyboard, setKeyboard] = useState(false)
  const onKeyDown = (e: KeyboardEvent<HTMLSelectElement>) => {
    byKeys.current = true
    setKeyboard(true)
    if (e.key === 'Enter' && chosen) { e.preventDefault(); go({ kind, slug: chosen }) }
  }
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        className="input" id={id} value={chosen}
        onKeyDown={onKeyDown} onPointerDown={() => { byKeys.current = false; setKeyboard(false) }}
        onChange={(e) => {
          setChosen(e.target.value)
          if (e.target.value && !byKeys.current) go({ kind, slug: e.target.value })
        }}
      >
        <option value="">{prompt}</option>
        {items.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
      </select>
      {chosen && keyboard && <div className="note">Press Enter to show it.</div>}
    </div>
  )
}

export function Chooser() {
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  function submit(e: FormEvent) {
    e.preventDefault()
    const code = outwardCode(typed)
    if (!typed.trim()) return setError('Type a postcode first.')
    if (!code) return setError("That doesn't look like a postcode. Try one like RG1 or RG1 8FR.")
    if (!district(code)) return setError(`Only England postcodes are accepted. ${code} isn't a postcode district in England.`)
    setError('')
    go({ kind: 'postcode', code })
  }
  return (
    <>
      <div className="chooser-head">
        <div className="card-kicker">River levels nearby, with historical comparisons</div>
        <h2>Which part of England would you like to see?</h2>
      </div>
      <div className="choose">
        <form className="card" onSubmit={submit} noValidate>
          <h3>A postcode</h3>
          <div className="field">
            <label htmlFor="pc">Your postcode, or just its first half</label>
            <div className="choose-row">
              <input
                className="input" id="pc" value={typed} autoComplete="postal-code" placeholder="RG1 or RG1 8FR"
                aria-invalid={error ? true : undefined} aria-describedby={error ? 'pc-error' : undefined}
                autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="go"
                onChange={(e) => { setTyped(e.target.value); if (error) setError('') }}
              />
              <button className="btn btn-primary" type="submit">Show</button>
            </div>
            {error && <div className="choose-error" id="pc-error" role="alert">{error}</div>}
          </div>
          <div className="note">Only the first half (RG1) is used. It stays on your device: nothing you type is sent anywhere.</div>
        </form>
        <div className="card choose-areas">
          <h3>An area</h3>
          <AreaList id="county" kind="county" label="A county" prompt="Choose a county" items={meta.counties} />
          <AreaList id="region" kind="region" label="A region" prompt="Choose a region" items={meta.regions} />
        </div>
        <div className="card choose-areas">
          <h3>All of England</h3>
          <div className="note">The highest and lowest rivers for the time of year across the whole country.</div>
          <div><button className="btn btn-secondary" type="button" onClick={() => go({ kind: 'england' })}>Show England</button></div>
        </div>
      </div>
    </>
  )
}
