# River level gauges at locks and weirs: research

Friday October 30th 2026, Claude Code, at John's request ("so that when you say 'locks
behave oddly' we're as informed as possible about how to handle them"). Figures are from
the EA's APIs that morning: the archive's daily highest and lowest levels and daily average
flows (quality-checked years, plus 2026, still "Unchecked"), and the live readings since
October 1st. Analysis scripts are in the session's scratch folder only.

## What's published

1. **Who sets the level.** On the Thames, a lock keeper operates the lock and manages "the
   river levels above the lock by adjusting the weir openings", 45 locks on the non-tidal
   Thames (quoted in search results from GOV.UK's withdrawn leaflet "Locks and weirs on the
   River Thames"; the PDF itself, when read, is a safety leaflet with nothing on levels). No current EA document giving each lock's target level was found.
2. **Upstream and downstream gauges.** The EA's API documentation describes the qualifier
   "Downstream Stage" as "for stations such as weirs which measure levels at two
   locations". The upstream gauge is the reach above the lock, the downstream one the reach
   below; each has its own zero (a Thames enthusiast's site calls the downstream one the
   "tail gauge pile zero"; not confirmed by the EA).
3. **The EA's "typical range"** (in each station's details, and on Check for flooding):
   "The top of the typical range band - the measurement exceeded this for 5% of the
   relevant data on record"; the bottom, the level exceeded 95% of the time (EA API
   reference). It covers the whole year, not the time of year. Check for flooding also
   says, on some stations, that "levels that are very low or below zero are normal".
4. **Deliberate lowering.** The EA lowers the River Medway "in sections between locks every
   winter for routine annual maintenance inspections" (Tonbridge and Malling council news,
   seen in search results only). Its 2026 drought outlook for navigation (GOV.UK, November 14th 2025)
   says it "may need to review or postpone winter drawdown", might "isolate lock sites to
   preserve water levels", and that people had "intentionally opened our locks, draining
   impoundments". A Thames lock-works programme each winter closes some locks (GOV.UK).
5. **Not found:** why Sonning's reach was low in June and July 2026 (no notice for Sonning;
   the Shiplake Lock closure notice of April 9th to 20th 2026 is for the reach below).

## What the data shows

6. **How many.** Of 3,208 river gauges, 371 are named after a lock (70), weir (55), sluice
   (91), mill (129) or gate (25); 224 also have a downstream gauge. Downstream gauges aren't
   only at locks: they're at culverts and bridges in towns too. 41 of the 70 "Lock" gauges
   are on the Thames, 40 of them with both sides.
7. **A lock gauge hardly moves until the river is high.** Level against flow, 1995 to 2025:

   | | Level and flow move together (1 = always) | Low flow to average | Average to high (top 10%) | High to flood (top 1%) | Up and down within a day |
   |---|---|---|---|---|---|
   | Mapledurham, Caversham, Sonning and Shiplake locks, against Reading's flow | 0.20 to 0.48 | 0 to 5 cm | −1 to +6 cm | 17 to 46 cm | 3 to 6 cm |
   | Eight free-flowing gauges, picked at random, against their own flow | 0.95 to 0.99 at six | 5 to 31 cm | 12 to 74 cm | 20 to 66 cm | under 1 cm |

   (The "together" figure is a rank correlation of daily level and daily flow. The free
   gauges: Pixton on the Exe, Blunham on the Ivel, Gunnislake on the Tamar, Wennington on
   the Wenning, Dernford on the Cam, Brimpton on the Enborne, Shillingthorpe on the West
   Glen, Bishops Frome on the Frome.)
8. **So the time-of-year judgement often disagrees with the river.** Judging each day's level
   and each day's flow "for the time of year" with the agreed five words:

   | | Same word | Opposite ends (low against high) | River very high: level high or very high | River very low: level low or very low |
   |---|---|---|---|---|
   | The four Thames locks | 32% to 42% | 5% to 9% | 48% to 74% | 31% to 60% |
   | Six of the free gauges | 62% to 84% | 0% | 96% to 99% | 77% to 100% |
   | Shillingthorpe, Bishops Frome | 43% to 46% | 0% to 10% | 31% to 32% | 30% to 58% |

   October 2026 is a real case: until the 19th, Reading's flow was in the lowest 1% to 6%
   for the time of year, while Caversham Lock's level was at about the 30th percentile
   ("normal"). Two of the eight "free" gauges agree poorly too, so a lock isn't the only
   cause; the reasons there weren't looked into (weed growth in summer is one possibility,
   unconfirmed).
9. **Deliberate lowerings show up.** Counting runs of three days or more with the level more
   than 10 cm below the gauge's usual level while Reading's flow wasn't low: Caversham 18
   since 1995, Blakes Lock (Kennet) 12, Shiplake 7, Mapledurham 2, Sonning 1. Mostly
   November to March, as with the Medway's winter drawdown. Each would read "very low" in
   Riverwatcher while the river was normal.
10. **Sonning, summer 2026.** The reach above Sonning Lock fell 20 to 30 cm below its usual
    level several times between May 27th and July 17th (lowest −0.25 m on June 26th), while
    Caversham Lock upstream stayed normal and Reading's flow fell from 14 to 3 m³/s. The
    archive marks those days "Unchecked", with no fault flag. Whether it was managed
    lowering or a gauge fault can't be told from the data.
11. **The downstream side.** During this month's rise, the downstream gauge moved more at 22
    of 38 Thames locks (median range 20 cm, against 15 cm upstream). But the archive keeps
    only the upstream gauge (checked at Caversham, Sonning and Reading), so a downstream
    gauge has no past years to compare with. 86 of 295 downstream gauges have their own EA
    typical range (all-year). Teddington's downstream gauge is tidal.
12. **The same reach is measured twice.** The gauge below one lock and the gauge above the
    next measure the same stretch of water (Caversham's downstream and Sonning's upstream
    rose together this month). That could be used to check one against the other.

## Ways to handle it, for John

A. **Say so on the gauge.** Keep the judgement, and add a fixed line on any gauge at a lock or
   weir: "The level here is held by a weir, so it rises in very wet weather but says little
   about low water." Simple; the judgement still misleads at low flows.

B. **Judge only the high end at locks.** At a lock or weir, say "high" or "very high" when it
   is (right about half to three quarters of the time when the river is very high), and
   otherwise "Held steady by the weir" instead of "normal", "low" or "very low", which are
   unreliable there (finding 8). The chart and comparisons stay.

C. **Prefer free-flowing gauges.** Choose the nearest five from gauges not at locks or weirs
   where there are any within 10 miles, and show lock gauges after them, or only if there
   are fewer than five.

D. **Use a nearby flow gauge for the reach.** For the Thames, say how the river is doing from
   Reading's flow (or another flow gauge), and show lock levels as levels. That brings back
   flow, which John set aside on October 30th, so only if he wants to.

E. **Use the downstream gauge where it moves more.** It often does (finding 11), but there's no
   history to compare with; Riverwatcher's own collector would have to build one over years,
   or use the EA's all-year typical range at the 86 that have one.

**Recommendation:** B, with A's line explaining it, and C. Look again at D when flow comes
back. Not E for now.

**To settle before building:** how to tell which gauges are at locks or weirs. Names catch
most ("Lock", "Weir", "Sluice", "Mill"), and a downstream gauge is a strong sign. The data
may also show it (a lock gauge's level is flat except in floods, and goes up and down more
within a day), but that hasn't been tested across England. A list checked by hand for the
Thames (41 locks) would be reliable.

## Sources

- EA real-time flood-monitoring API reference (typical range, "Downstream Stage"):
  https://environment.data.gov.uk/flood-monitoring/doc/reference
- GOV.UK, "Locks and weirs on the River Thames" (withdrawn):
  https://assets.publishing.service.gov.uk/media/5da5c2ce40f0b631e8e148d2/WITHDRAWN-Locks_and_weirs_on_the_river_Thames.pdf
- Wikipedia, "Locks and weirs on the River Thames":
  https://en.wikipedia.org/wiki/Locks_and_weirs_on_the_River_Thames
- GOV.UK, "Drought prospects for spring 2026", navigation section:
  https://www.gov.uk/government/publications/drought-prospects-for-spring-2026/6-navigation-drought-risks-impacts-and-actions-drought-prospects-for-spring-2026
- Tonbridge and Malling Borough Council news (Medway winter drawdown):
  https://www.tmbc.gov.uk/news/article/130/united-effort-to-clean-up-tonbridge-river
- GOV.UK, Shiplake Lock repair works 2026 closure notice:
  https://www.gov.uk/government/publications/shiplake-lock-repair-works-2026-river-closure-notice
- thames.me.uk, "Monitoring the freshwater Thames" (downstream datum):
  https://thames.me.uk/s00331a.htm
- Check for flooding station pages (seen in search results; the site is blocked here).
