# Extending Riverwatcher to Wales, Scotland and Northern Ireland: what we know

Written Thursday November 5th 2026, at John's request, from Claude's answer in the thread.
Northern Ireland postcodes are out for now (see below).

Almost none of this was done for Riverwatcher itself. Riverwatcher's spec (§12.5) only lists
"Wales and Scotland (Natural Resources Wales and SEPA, as explored for Hindcaster)" under
"Later". The investigation was for Hindcaster's rain gauges, in late October 2026. Several
findings carry across, but river levels themselves haven't been tested.

What Riverwatcher already has:

- Nine gauges just over the borders are in its list (the Environment Agency's own, on the
  English edge). They show in postcode views near the border, but in no county or region.

## Wales (Natural Resources Wales)

- John has a free key, and it works. The open data service ("Open Data – River Levels,
  Rainfall and Sea Data API") has 409 stations: 150 rain gauges, plus river-level and tide
  stations.
- The rain gauges are tested: 15-minute readings that arrive within about ten minutes, and a
  year of history per station in one request.
- River levels weren't tested, but they come from the same service.
- The catch is speed. The limit is 10 requests a minute, so fetching about 250 river stations
  one by one would take around 25 minutes. Riverwatcher's collector would need a separate step
  for Wales.
- The licence is the Open Government Licence, with a stated credit line.
- The Welsh rain gauge list and a design for adding them to Hindcaster sit on an unmerged
  Hindcaster branch (`claude/inspiring-cori-m3e0ar`).

Sources: Hindcaster's `design/scotland-rain-data-2026-10-25.md` (the NRW sections) and
`data/nrw/probe.json`.

## Scotland (SEPA)

- SEPA's service (`timeseries.sepa.org.uk`) works without a key, and its 282 rain gauges are
  fully tested. It also publishes river levels, but they haven't been tested.
- Licence: SEPA wrote back to John on November 4th 2026. Their rainfall data may be published,
  John's credit line is acceptable, and there's no usage limit beyond what the service can
  handle. That answer covers rainfall only, so river levels would need the same question asked.

Sources: Hindcaster's `design/scotland-rain-data-2026-10-25.md` and
`design/sepa-licence-reply-2026-11-05.md`.

## Geography (from Ordnance Survey, for Great Britain)

- Scotland's 453 postcode districts and Wales's 200 are in the same Ordnance Survey data
  Riverwatcher already uses. Postcode views would work there.
- For area views:
  - Wales has its eight preserved counties and 22 councils.
  - Scotland has 32 councils and 35 lieutenancy areas, but nothing like England's regions.
  - Combined areas could cross the borders too.

Source: Hindcaster's `design/geography-uk-2026-10-25.md`.

## Northern Ireland

- Postcodes: closed for a public site without a licence from Land & Property Services. John
  decided to leave them. The open alternative is choosing by town, village or one of the 11
  councils.
- River levels: DfI Rivers runs about 130 water-level stations, with a data viewer and
  downloads. There's no known feed a collector could use, and their site was blocked from the
  session that looked, so this is unchecked.

Source: Hindcaster's `design/northern-ireland-2026-10-25.md`.

## What would be needed for Riverwatcher

1. Test SEPA's and Natural Resources Wales's river levels: how many stations, how fresh, and
   how much history.
2. Ask SEPA whether their licence answer covers river levels too.
3. Plan the collector's extra step for Wales.
4. Find out whether DfI Rivers' levels can be reached automatically.
