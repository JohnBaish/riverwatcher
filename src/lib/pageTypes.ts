// The page's figures (stage 3), made from the data repo at build time by
// scripts/lib/pageData.ts and served as parts by the plugin in vite.config.ts. Levels are in
// whole millimetres above each gauge's own zero, as in the data files.

import type { Flood } from '../../scripts/lib/collect.ts'
import type { HeldReason } from '../../scripts/lib/gauges.ts'
import type { Word } from '../../scripts/lib/history.ts'

/** Built into the page: when the figures were made, and the flood warnings in force. */
export type PageMeta = {
  /** When the collector made latest.json (ISO, UTC). */
  made: string
  /** The UK date the figures are for (YYYY-MM-DD). */
  date: string
  floods: Flood[]
}

/** How a gauge's level compares (SPEC §4), worked out at build time with history.ts's
 *  `judge` from the average of the last 24 hours. */
export type PageJudgement =
  | { basis: 'history'; word: Word; percent: number }
  | { basis: 'held'; word: 'high' | 'very high' | null }
  | { basis: 'typical'; word: 'below' | 'within' | 'above' }
  | { basis: 'none' }

export type PageGauge = {
  ref: string
  name: string
  river: string | null
  lat: number
  long: number
  held: HeldReason | null
  lake: boolean
  toSeaKm: number | null
  joins: { river: string; toSeaKm: number } | null
  county: string | null
  /** Flat or stuck, with no history or range: left out (SPEC §3.7). */
  quiet: boolean
  /** The latest reading: level, and minutes between it and `made`; null if none. */
  now: { v: number; age: number; mean: number | null; ch: number | null } | null
  j: PageJudgement
  /** The first year of the record, when it has history. */
  fromYear: number | null
  /** "The highest (lowest) for the time of year since [year]", only when high or low and
   *  not held: the year, or 0 for "since records began". */
  since: { way: 'highest' | 'lowest'; year: number } | null
  /** The usual level on the same date a year ago, and its word (null where not said). */
  yearAgo: { v: number; word: Word | null } | null
  record: { v: number; date: string } | null
  gaps: { from: string; to: string | null }[]
  typical: [number, number] | null
  /** The chart's height covers at least this: the lowest 10% and highest 90% levels at any
   *  time of year, or the typical range. */
  span: [number, number] | null
}

/** Hourly averages (mm) from `start` (UTC hour, "2026-10-17T00"), one an hour, delta-coded:
 *  each figure is the change from the previous one present (the first is the level). The
 *  same for every visitor. Bands: for each gauge with history, the table's 10%, 25%, 75% and
 *  90% levels at table steps `bandFrom`, `bandFrom + 5` … (day of the year). */
export type PageHours = { start: string; hours: number; g: Record<string, (number | null)[]>; bandFrom: number; bands: Record<string, ([number, number, number, number] | null)[]> }

/** Daily levels for the last year, delta-coded as `PageHours`, from `start` (a UTC date),
 *  and every gauge's whole band table (every fifth day of the year). */
export type PageDaily = { start: string; days: number; g: Record<string, (number | null)[]>; bands: Record<string, ([number, number, number, number] | null)[]> }
