// The chooser (stage 3: the postcode box; counties, regions and England come in stage 4, SPEC
// §8.1). What's typed is worked out in the browser and never sent anywhere.

import { useState, type FormEvent } from 'react'
import { district, outwardCode } from '../lib/postcode.ts'

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
    location.hash = `#postcode/${code}`
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
      </div>
    </>
  )
}
