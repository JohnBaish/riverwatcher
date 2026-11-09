// "Share chart" (John, November 9th 2026, as in Refueller): a picture of a gauge's chart, with a heading, a line or two about
// it, the key and the credit line, always in the light colours, made on the visitor's device. On a touch screen it goes to the
// phone's own share sheet; on a computer it's copied (or saved, where the browser won't copy). Nothing is sent anywhere until
// the visitor chooses where it goes.
import { metres, shortDate } from './format.ts'
import type { PageGauge } from './pageTypes.ts'
import { heights, type Band, type Point } from './series.ts'

/** The light colours (organic.css and global.css), whatever the page's own mode. */
const C = {
  bg: '#f5ead8', text: '#201e1d', muted: '#645c50', grid: 'rgba(32,30,29,0.16)', accent: '#c67139', range: '#8c491a',
  j: { vlow: '#8c491a', low: '#d1824c', normal: '#c0b6a5', high: '#6d98c2', vhigh: '#2c5885' },
}
const ZONE_ALPHA = 0.3
export const CREDIT = 'riverwatcher.baish.net · This uses Environment Agency flood and river level data from the real-time data API (Beta). Contains public sector information licensed under the Open Government Licence v3.0.'

const W = 1200
const PAD = 50
const FIG = 'Figtree, system-ui, sans-serif'

function niceTicks(lo: number, hi: number, n: number): number[] {
  const span = hi - lo || 100, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= step0)!
  const out: number[] = []
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(v)
  return out
}

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w
    if (ctx.measureText(t).width > width && line) { lines.push(line); line = w } else line = t
  }
  if (line) lines.push(line)
  return lines
}

type KeyItem = { label: string; kind: 'line' | 'dash' | keyof typeof C.j }
const ZONES: [keyof typeof C.j, string][] = [['vlow', 'Very low'], ['low', 'Low'], ['normal', 'Normal'], ['high', 'High'], ['vhigh', 'Very high']]

/** The key, as under the chart on the page (Chart.tsx `Key`). */
function keyFor(g: PageGauge, hasBands: boolean, topLine: boolean): KeyItem[] {
  const k: KeyItem[] = [{ label: 'Level', kind: 'line' }]
  if (hasBands) {
    const zs = g.held !== null ? ZONES.slice(3) : ZONES
    zs.forEach(([c, w], i) => k.push({ label: i === zs.length - 1 ? `${w} for the time of year` : w, kind: c }))
    if (topLine) k.push({ label: 'Environment Agency’s top of normal range', kind: 'dash' })
  } else if (g.typical) k.push({ label: 'Environment Agency’s normal range', kind: 'dash' })
  return k
}

export type ChartPicture = {
  g: PageGauge; weeks: number; made: string; pts: Point[]; bands: [number, Band][]; latest: Point | null
  heading: string; sub: string[]
}

/** The picture: heading, a line or two about the gauge, the key, the chart, and the credit line. */
export function makeImage(o: ChartPicture): HTMLCanvasElement {
  const scale = 2
  const all = o.latest ? [...o.pts, o.latest] : o.pts
  const chartH = 420
  const subH = o.sub.length * 26
  const keyTop = 112 + subH + 14
  const canvas = document.createElement('canvas')
  const probe = canvas.getContext('2d')!
  // The key may run to two lines on the picture.
  probe.font = `15px ${FIG}`
  const [lo, hi] = all.length ? heights(o.g, all) : [0, 1000]
  const top = o.g.typical && o.bands.length ? o.g.typical[1] : null
  const topAbove = top !== null && top > hi
  const key = keyFor(o.g, o.bands.length > 0, top !== null && !topAbove)
  const keyRows: KeyItem[][] = [[]]
  let kx = 0
  for (const k of key) {
    const w = 32 + probe.measureText(k.label).width + 26
    if (kx + w > W - 2 * PAD && keyRows[keyRows.length - 1].length) { keyRows.push([]); kx = 0 }
    keyRows[keyRows.length - 1].push(k)
    kx += w
  }
  const keyH = keyRows.length * 26
  const chartTop = keyTop + keyH + 12
  probe.font = `13px ${FIG}`
  const creditLines = wrap(probe, CREDIT, W - 2 * PAD)
  const H = chartTop + chartH + 30 + creditLines.length * 17 + 24
  canvas.width = W * scale
  canvas.height = H * scale
  const ctx = canvas.getContext('2d')!
  ctx.scale(scale, scale)
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = C.accent
  ctx.font = `600 13px ${FIG}`
  ctx.fillText('RIVERWATCHER', PAD, 52)
  ctx.fillStyle = C.text
  ctx.font = `34px Caprasimo, Georgia, serif`
  ctx.fillText(o.heading, PAD, 94)
  ctx.fillStyle = C.muted
  ctx.font = `17px ${FIG}`
  o.sub.forEach((s, i) => ctx.fillText(s, PAD, 124 + i * 26))

  // The key.
  keyRows.forEach((row, r) => {
    let x = PAD
    const y = keyTop + r * 26
    ctx.font = `15px ${FIG}`
    for (const k of row) {
      if (k.kind === 'line') {
        ctx.strokeStyle = C.text; ctx.lineWidth = 2.5; ctx.setLineDash([])
        ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + 24, y + 4); ctx.stroke()
      } else if (k.kind === 'dash') {
        ctx.strokeStyle = C.range; ctx.lineWidth = 2; ctx.setLineDash([6, 4])
        ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x + 24, y + 4); ctx.stroke(); ctx.setLineDash([])
      } else {
        ctx.globalAlpha = ZONE_ALPHA; ctx.fillStyle = C.j[k.kind]; ctx.fillRect(x, y - 3, 24, 14); ctx.globalAlpha = 1
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y - 2.5, 23, 13)
      }
      ctx.fillStyle = C.text
      ctx.fillText(k.label, x + 32, y + 9)
      x += 32 + ctx.measureText(k.label).width + 26
    }
  })

  // The chart, drawn as on the page (Chart.tsx), larger.
  const L = PAD + 62, R = PAD + 10, T = chartTop + 8, B = chartTop + chartH - 30
  const t1 = Date.parse(o.made), t0 = t1 - o.weeks * 7 * 86400e3
  const x = (t: number) => L + ((t - t0) / (t1 - t0)) * (W - R - L)
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (B - T)
  ctx.save()
  ctx.beginPath(); ctx.rect(L, T, W - R - L, B - T); ctx.clip()
  if (o.bands.length) {
    const zone = (lower: (b: Band) => number, upper: (b: Band) => number, c: keyof typeof C.j) => {
      ctx.globalAlpha = ZONE_ALPHA
      ctx.fillStyle = C.j[c]
      ctx.beginPath()
      o.bands.forEach(([t, b], i) => (i ? ctx.lineTo(x(t), y(lower(b))) : ctx.moveTo(x(t), y(lower(b)))))
      for (const [t, b] of [...o.bands].reverse()) ctx.lineTo(x(t), y(upper(b)))
      ctx.closePath()
      ctx.fill()
      ctx.globalAlpha = 1
    }
    if (o.g.held === null) {
      zone(() => lo, (b) => b[0], 'vlow'); zone((b) => b[0], (b) => b[1], 'low'); zone((b) => b[1], (b) => b[2], 'normal')
    }
    zone((b) => b[2], (b) => b[3], 'high'); zone((b) => b[3], () => hi, 'vhigh')
  }
  ctx.restore()
  ctx.font = `14px ${FIG}`
  ctx.textAlign = 'right'
  ctx.setLineDash([])
  for (const v of niceTicks(lo, hi, 5)) {
    ctx.strokeStyle = C.grid; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(L, y(v)); ctx.lineTo(W - R, y(v)); ctx.stroke()
    ctx.fillStyle = C.muted
    ctx.fillText(metres(v), L - 8, y(v) + 5)
  }
  const nTicks = 6
  for (let i = 0; i <= nTicks; i++) {
    const t = t0 + ((t1 - t0) * i) / nTicks
    ctx.textAlign = i === 0 ? 'left' : i === nTicks ? 'right' : 'center'
    ctx.fillText(shortDate(new Date(t)), x(t), B + 22)
  }
  // The range lines, each label where it covers least of the river's line (as on the page).
  const rangeLine = (v: number, text: string, prefer: 'above' | 'below') => {
    ctx.strokeStyle = C.range; ctx.lineWidth = 2; ctx.setLineDash([8, 5])
    ctx.beginPath(); ctx.moveTo(L, y(v)); ctx.lineTo(W - R, y(v)); ctx.stroke(); ctx.setLineDash([])
    ctx.font = `600 14px ${FIG}`
    const w = ctx.measureText(text).width
    const sides = prefer === 'above' ? (['above', 'below'] as const) : (['below', 'above'] as const)
    let best: { score: number; x: number; base: number; align: CanvasTextAlign } | null = null
    for (const end of ['right', 'left'] as const) for (const side of sides) {
      const base = side === 'above' ? y(v) - 7 : y(v) + 19
      if (base - 14 < T || base + 3 > B) continue
      const x1 = end === 'right' ? W - R - 6 - w : L + 6, x2 = x1 + w
      let score = 0
      for (const p of all) {
        const px = x(p[0]), py = y(p[1])
        if (px >= x1 - 4 && px <= x2 + 4 && py >= base - 18 && py <= base + 6) score += p === o.latest ? 20 : 1
      }
      if (!best || score < best.score) best = { score, x: end === 'right' ? W - R - 6 : L + 6, base, align: end === 'right' ? 'right' : 'left' }
    }
    const b = best ?? { x: W - R - 6, base: y(v) - 7, align: 'right' as const }
    ctx.fillStyle = C.range; ctx.textAlign = b.align
    ctx.fillText(text, b.x, b.base)
  }
  if (!o.bands.length && o.g.typical) {
    rangeLine(o.g.typical[1], `Top of normal range, ${metres(o.g.typical[1])}`, 'above')
    rangeLine(o.g.typical[0], `Bottom of normal range, ${metres(o.g.typical[0])}`, 'below')
  }
  if (top !== null && !topAbove) rangeLine(top, `Top of normal range, ${metres(top)}`, 'above')
  if (topAbove) {
    ctx.fillStyle = C.range; ctx.font = `600 14px ${FIG}`; ctx.textAlign = 'right'
    ctx.fillText(`↑ Top of normal range, ${metres(top!)}, is above the chart`, W - R - 6, T + 18)
  }
  if (o.pts.length) {
    ctx.strokeStyle = C.text; ctx.lineWidth = 2.8; ctx.lineJoin = 'round'; ctx.lineCap = 'round'
    ctx.beginPath()
    o.pts.forEach(([t, v], i) => (i ? ctx.lineTo(x(t), y(v)) : ctx.moveTo(x(t), y(v))))
    ctx.stroke()
  }
  if (o.latest) {
    ctx.fillStyle = C.accent; ctx.strokeStyle = C.bg; ctx.lineWidth = 2.5
    ctx.beginPath(); ctx.arc(x(o.latest[0]), y(o.latest[1]), 6.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  }

  // The credit line.
  ctx.textAlign = 'left'
  const ruleY = chartTop + chartH + 6
  ctx.strokeStyle = C.grid; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, ruleY); ctx.lineTo(W - PAD, ruleY); ctx.stroke()
  ctx.fillStyle = C.muted
  ctx.font = `13px ${FIG}`
  creditLines.forEach((t, i) => ctx.fillText(t, PAD, ruleY + 22 + i * 17))
  return canvas
}

export type Delivered = 'shared' | 'copied' | 'saved' | 'cancelled'
const touch = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches
/** The share button's own word: "Share" on a touch screen (the phone's share sheet), "Copy" on a computer. */
export const shareVerb = () => (touch() ? 'Share' : 'Copy')

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

/** Hands the picture over: the share sheet on a touch screen, else the clipboard, else a saved file. Call straight from the tap. */
export async function deliver(canvas: HTMLCanvasElement, filename: string, title: string): Promise<Delivered> {
  const blob = new Promise<Blob>((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('No picture'))), 'image/png'))
  if (touch()) {
    const b = await blob
    const file = new File([b], filename, { type: 'image/png' })
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title })
        return 'shared'
      } catch (e) {
        if ((e as Error).name === 'AbortError') return 'cancelled'
      }
    }
    save(b, filename)
    return 'saved'
  }
  try {
    // The picture is handed over as a promise, made inside the click, which Safari needs.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    return 'copied'
  } catch {
    save(await blob, filename)
    return 'saved'
  }
}

/** "riverwatcher-2026-11-09.png" */
export const imageName = (ms: number) => `riverwatcher-${new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date(ms))}.png`
