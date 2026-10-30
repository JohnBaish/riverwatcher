# Riverwatcher: research notes

Oct 25, 2026 · @John

## Scope

Riverwatcher would report current river levels for England from open Environment Agency (EA) data, with a look close to Hindcaster. The user picks a place by postcode and sees the nearest gauges.

The main purpose is comparison: how today's river compares with the last few weeks and with longer history. The address will be riverwatcher.baish.net.

Tidal and groundwater stations are out of scope for now, and rainfall is not included. Flow is in: level shown for every gauge, with flow added where a station measures it. Flow may suit comparisons better on lock-controlled stretches, where level is partly managed.

## The data

Two free EA APIs cover what Riverwatcher needs: one for now, one for history. Both are open data under the Open Government Licence with no registration. The EA asks for this attribution: "This uses Environment Agency flood and river level data from the real-time data API (Beta)."

|  | Real-time flood-monitoring API | Hydrology API |
| --- | --- | --- |
| Address | environment.data.gov.uk/flood-monitoring | environment.data.gov.uk/hydrology |
| Best for | Latest readings, updated about every 15 minutes; flood warnings and alerts | Long-term archive, quality-checked data with quality flags |
| Scale | Stations, measures, readings | Over 4 billion readings from about 8,000 stations |
| Station IDs | Short references such as 2200TH | Newer GUID-style IDs, with links back to the old references |
| Limits | Beta service; default 500 items per call | Soft limit of 100,000 rows per call; the EA asks bulk users to keep concurrent requests modest |

The real-time API has no forecast river-level feed, so any "what happens next" would have to be derived, not fetched.

Two cautions, held with less certainty: real-time readings are provisional and can contain glitches or gaps, and stations measure level against different reference points (for example stage datum or ordnance datum), so raw numbers should not be compared between stations.

## Design options

Four ways to build it, from simplest to heaviest.

| Option | What it is | Strength | Risk or cost |
| --- | --- | --- | --- |
| 1. Static front end calling the EA directly | A plain site with no backend, like a typical static site | Quickest to build and host | Browser cross-origin access not yet tested; no caching; raw data quirks land in front-end code |
| 2. Static front end plus thin serverless layer | A few small functions (for example on Vercel) that cache, tidy the data and handle station search | Protects against API changes; polite to the EA | A little more to maintain |
| 3. Own ingest and database | A scheduled job polls every 15 minutes and stores readings | You own the history; enables alerts | Database, scheduler and upkeep; largely unnecessary while the archive API exists |
| 4. Hybrid (recommended) | Option 2, with live readings from the real-time API and context from the hydrology archive | Answers "is that high or low for now?" | Two APIs with different ID schemes to reconcile |

## Recommendation

Build option 4: live readings plus archive context. A bare number such as 1.43 m means little to most people, while "higher than most readings for this time of year" is the part the government site does not really offer.

Suggested first version:

1. Enter a postcode and find nearby river gauges.
2. Show the latest reading and a clean chart of the last few days.
3. Place the reading in that station's own history, using the hydrology archive.
4. Add flood warnings for the area as a secondary layer.

Station-first browsing (pick a gauge from a list) is the simpler fallback if postcode lookup proves fiddly.

## Worked example: near RG4

Two live readings from the Thames at Reading show what the API returns, but not whether either is high or low. I searched a 15 km radius around approximate RG4 coordinates (51.475, -0.97), which I could not confirm.

| Station | River | Measure | Latest reading (25 Oct 2026, UTC) |
| --- | --- | --- | --- |
| Caversham Lock (2201TH) | Thames | Level, 0.19 m above stage datum | 07:15 |
| Reading (2200TH) | Thames | Flow, 11.3 m3/s | 07:15 |

Other river gauges in the search included Blakes Lock and Calcot Bridge on the Kennet, Twyford on the Loddon, and Sonning and Mapledurham locks on the Thames. I did not fetch their readings.

Stage level is a height above an arbitrary local zero, not a depth, and lock gauges sit on a weir-controlled stretch. Without typical-range or archive context, the level figure cannot be judged. That gap is the case for the hybrid design.

The search also returned four rain gauges, which report every 15 minutes.

## Postcode lookup

Picking the nearest gauge by postcode is feasible, with four wrinkles found in the live data:

- **Geocoding is separate.** The postcode must first become latitude and longitude. A free postcode lookup service is needed; my test request to one failed, so this is untested. A full postcode places users better than an outcode such as RG4.
- **No distance sorting.** The API returns stations within a radius, but not in distance order. The app must calculate distances and sort.
- **Mixed and duplicate stations.** One search returned rivers, a groundwater site, rain gauges and legacy duplicate records (several for the Loddon at Sheepbridge). The app must filter by type and dedupe.
- **Several measures per station.** Many gauges offer multiple level measures (stage, downstream stage, different units, even an odd "m/s" one). The app needs a rule for choosing one.

## Open questions and next steps

- [ ] Test whether a browser can call the EA real-time API directly (decides option 1 versus 2)
- [ ] Choose and test a free postcode-to-coordinates service
- [ ] Decide the rule for picking one level measure per station
- [ ] Check how much flow history the archive holds for Reading-area gauges
- [ ] Check how Hindcaster's house style and wording rules carry over
- [ ] Test the hydrology archive for a Reading gauge, including how its IDs map to the real-time references

## Sources

Live EA queries opened on 25 October 2026:

- [Stations within 15 km of RG4](https://environment.data.gov.uk/flood-monitoring/id/stations?dist=15&lat=51.475&long=-0.97)
- [Caversham Lock level measure](https://environment.data.gov.uk/flood-monitoring/id/measures/2201TH-level-stage-i-15_min-mASD)
- [Reading flow measure](https://environment.data.gov.uk/flood-monitoring/id/measures/2200TH-flow--Mean-15_min-m3_s)

Seen in search results only, not opened in full:

- [EA hydrology API reference](https://environment.data.gov.uk/hydrology/doc/reference)
- [Epimorphics: the hydrology archive API](https://www.epimorphics.com/access-ea-hydrology-archive-via-api/)
- [EA flood-monitoring API overview and attribution](https://ckan.publishing.service.gov.uk/dataset/environment-agency-flood-monitoring1)
- [River-wise releases, noting no forecast feed in the real-time API](https://github.com/TheWillMiller/river-wise/releases)
- [Flood Warning System docs, on differing level reference points](https://alicebarbe.github.io/England-Flood-Warnings-and-Visualizations/)
