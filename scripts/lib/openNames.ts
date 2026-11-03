// Reading OS Open Names (GB, CSV): the named settlements, with their county or
// unitary authority. Copied from Hindcaster (scripts/lib/openNames.ts) on November 3rd
// 2026, for the "Near …" line under each gauge (scripts/build-places.ts).

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const SETTLEMENTS = ['City', 'Town', 'Village', 'Hamlet', 'Suburban Area', 'Other Settlement']

export type Place = {
  name: string
  type: string
  x: number
  y: number
  district: string
  county: string
}

/** One CSV line, with quoted fields (which may hold commas). */
export function splitLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"'
        i++
      } else if (c === '"') quoted = false
      else cur += c
    } else if (c === '"') quoted = true
    else if (c === ',') {
      out.push(cur)
      cur = ''
    } else cur += c
  }
  out.push(cur)
  return out
}

export function loadPlaces(dir: string): Place[] {
  const places: Place[] = []
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.csv'))) {
    for (const line of readFileSync(join(dir, file), 'utf8').replace(/^﻿/, '').split(/\r?\n/)) {
      if (!line) continue
      const f = splitLine(line)
      // Columns, by position (OS_Open_Names_Header.csv): 2 NAME1, 3 NAME1_LANG,
      // 4 NAME2, 5 NAME2_LANG, 6 TYPE, 7 LOCAL_TYPE, 8 X, 9 Y, 21 DISTRICT_BOROUGH,
      // 24 COUNTY_UNITARY.
      if (f[6] !== 'populatedPlace' || !SETTLEMENTS.includes(f[7])) continue
      const english = f[3] === 'cym' && f[5] === 'eng' && f[4] ? f[4] : f[2]
      places.push({
        name: english,
        type: f[7],
        x: Number(f[8]),
        y: Number(f[9]),
        district: f[21],
        county: f[24],
      })
    }
  }
  return places
}

/** The county shown for a place: the county or unitary authority where there is one,
 *  otherwise the borough (Leeds, Manchester…). Welsh areas come in both languages
 *  ("Wrecsam - Wrexham", "Bro Morgannwg - the Vale of Glamorgan"): the English part
 *  is used, as the page is in English. */
export function countyOf(p: Place): string | null {
  // "The City of Brighton and Hove" is shown without "The" (John, 19 October, C5).
  const name = (p.county || p.district || '').replace(/^The /, '') || null
  if (!name || !name.includes(' - ')) return name
  const english = name.split(' - ').pop()!.replace(/^the /, '')
  return english[0].toUpperCase() + english.slice(1)
}
