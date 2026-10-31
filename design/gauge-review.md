# Riverwatcher: the gauge list, for review

Made by `npm run gauges` on Saturday, 31 October 2026, from the Environment Agency's live station list and archive, OS Open Rivers and OS Boundary-Line. The list itself is `data/gauges.json` in `JohnBaish/riverwatcher-data`.

## In numbers

1. **3,204** EA stations are river gauges by SPEC §3.1 (no tidal or groundwater measure; a "Stage" level in m, mASD or mAOD).
2. **2,954** of them sent a reading in the last 7 days; 250 are left out (section 9).
3. **2** backups and **64** near-duplicates left out (section 8), leaving **2,888** gauges.
4. **2,108** have daily history in the archive; 358 more have only the EA's all-year typical range; **422** have neither, so Riverwatcher could show their level but not whether it's high or low (section 6).
5. **520** are held by a lock or weir (section 2); **53** are on lakes or reservoirs (section 5).
6. **2,810** are placed on OS Open Rivers; 78 aren't within 600 m of a river (section 4).
7. **2,879** are in England; 9 are just over the border or out to sea (section 7).

## 1. Names

The EA gives 449 gauges' names in capitals, usually with a site code ("GS", "WITS", "RL"). Where the archive has a plain name for the same gauge, that's used ("RIVER KENNET AT THEALE" is "Theale"); otherwise the name is put in ordinary capitals and the codes dropped. A sample:

| EA name | Shown as | River |
| --- | --- | --- |
| Aylesford Stream Medway GS | Aylesford Stream Medway |  |
| Botley Mill Stream RL | Botley Mill Stream | River Hamble |
| Lyminster RL | Lyminster | Black Ditch |
| Wombourne LVL | Wombourne | Wom Brook |
| Woodfield Road FD | Woodfield Road | Crawter's Brook |
| Adderley (Cheadle) LVL | Adderley (Cheadle) | River Tean |
| BRIDPORT GUNDRY UPSTREAM | Bridport Gundry Upstream | River Brit |
| WINTERBOURNE STEEPLETON | Winterbourne Steepleton | South Winterborne |
| PAR HIGHWAY | Par Highways | Treffry Canal |
| BODMIN CROCKWELL STREET | Bodmin Crockwell Street |  |
| SOMERTON | Somerton | River Cary |
| WESTOVER PS | Westover Ps | River Parrett |
| BATH TWERTON GATE RADIAL | Twerton Gate | River Avon |
| Barcombe USGS | Barcombe | River Ouse |
| BARNSTAPLE RALEIGH MEADOW | Barnstaple | River Yeo |
| WESTHAMPNETT MILL RL | Westhampnett Mill | River Lavant |
| KYME EAU SLUICE CHAPEL HILL | Kyme Eau Sluice Chapel Hill | River Slea |
| BOSSINGTON GS | Bossington |  |
| BUDBRIDGE GS | Budbridge | Candover Stream |
| BRATOFT ROAD BRIDGE GS WITS | Bratoft Road Bridge | Cowcroft Drain |
| WELLINGBOROUGH EMBANKMENT GS WITS | Wellingborough Embankment | River Nene |
| EUSTON RECTORY GS | Euston Rectory | The Black Bourn |
| LETHERINGHAM MILL SLUICE | Letheringham Mill Sluice | River Deben |
| RATTLESDEN RESERVOIR SLUICE | Rattlesden Reservoir Sluice | Rattlesden River |
| BURNHAM GS NORFOLK | Burnham Gs Norfolk | River Burn |
| BRAMPTON SLUICE AUTOMATION | Brampton Sluice | River Great Ouse |
| GLEVERING MILL SLUICE | Glevering Mill Sluice | River Deben |
| MANTHORPE GS WITS | Manthorpe | East Glen River |
| KING STREET GS STOWE | King Street Gs Stowe |  |
| STOURMOUTH PS | Stourmouth Ps | Goshall Stream |
| NEWBOROUGH SYPHON GS GSM | Newborough Syphon | River Welland |
| BRANSTON DELPH PENSTOCK GSM | Branston Delph Penstock | South Delph |
| TL86 171 BOREHOLE GSM THOMAS BOLE CLOSE BURY ST EDMUNDS DO NOT POLL MANUALLY | Tl86 171 Borehole Gsm Thomas Bole Close Bury St Edmunds Do Not Poll Manually | River Linnet |
| FRESHNEY TILTING GATE GRIMSBY WITS | Freshney Tilting Gate Grimsby | River Freshney |
| NORTH KILLINGHOLME OUTFALL WITS | North Killingholme Outfall |  |
| OAK WEIR RL | Oak Weir Telemetry | River Medway |
| PADHOLME PS | Padholme Ps | River Nene |
| SAND SYKE PS WITHAM WASHLANDS WITS | Sand Syke Ps Witham Washlands | River Brant |
| SOUTH EFFORD MARSH | South Efford Marsh |  |
| EXETER PINHOE TRADING ESTATE | Pinhoe Trading Estate | Pin Brook |

**River names.** 2,283 come from the EA's live list, 162 from the archive, 358 from OS Open Rivers (the nearest named stretch), and **85 have none** (all below).

| Gauge | EA name | County | Nearest stretch (m) |
| --- | --- | --- | --- |
| Aylesford Stream Medway | Aylesford Stream Medway GS | Kent | 6 |
| Field End Road | Field End Road FD | Greater London | 5 |
| Clayton |  | West Sussex |  |
| Taplow Control Structure |  | Berkshire | 3 |
| Crawters Brook | Crawters Brook RL | Surrey |  |
| Chiswell | CHISWELL | Dorset |  |
| Duckaller Weir C | DUCKALLER WEIR C GS | Devon | 7 |
| Staplake | STAPLAKE GS | Devon |  |
| Membury | MEMBURY | Devon |  |
| Birmingham Perry Beeches Beeches Road |  | West Midlands ceremonial county | 2 |
| Newcastle-Under-Lyme Lower Milehouse Lane |  | Staffordshire |  |
| Porthleven | PORTHLEVEN | Cornwall | 1 |
| Bodmin Priory Pond | BODMIN PRIORY POND | Cornwall | 12 |
| Bodmin Crockwell Street | BODMIN CROCKWELL STREET | Cornwall | 2 |
| Bodmin Cummings Garage | BODMIN CUMMINGS GARAGE | Cornwall |  |
| Kenwith Outfall Ps | KENWITH OUTFALL PS | Devon | 39 |
| Kenwith Valley | KENWITH VALLEY | Devon | 0 |
| Corsham Aquaduct | CORSHAM AQUEDUCT | Wiltshire | 4 |
| Cribbs Causeway Reservoir | CRIBBS CAUSEWAY RESERVOIR | Gloucestershire |  |
| Rye Meads Effluent at Rye Meads | RYE MEADS EFFLUENT AT RYE MEADS | Hertfordshire | 7 |
| Seagry Gate | SEAGRY | Wiltshire | 28 |
| Kiora Radial Gates |  | Essex | 11 |
| Frodsham PS |  | Merseyside |  |
| Bottoms Reservoir |  | Derbyshire | 13 |
| Pennington PS |  | Greater Manchester | 335 |
| Crummock Water |  | Cumbria | 16 |
| Silloth |  | Cumbria |  |
| Freshfield Bank | Freshfield Bank RL | East Sussex | 4 |
| Waightshale | Waightshale RL | Isle of Wight | 2 |
| Valley Road | Valley Road RL | Hampshire | 0 |
| Whiteley | Whiteley RL | Hampshire | 76 |
| Whiteley | Whiteley RL | Hampshire | 76 |
| Highlands Road | Highlands Road RL | Hampshire |  |
| Highlands Road | Highlands Road RL | Hampshire |  |
| The Wharf Bridge | The Wharf Bridge RL | West Sussex | 0 |
| Churchill Road | Churchill Road RL | Surrey |  |
| St Andrews Close |  | Kent |  |
| Postling Road | Postling Road RL | Kent |  |
| Goxhill Outfall Sluice | GOXHILL OUTFALL SLUICE | Lincolnshire | 10 |
| Salterns | SALTERNS PS | Hampshire |  |
| Bossington | BOSSINGTON GS | Hampshire | 1 |
| Nunn Mills Sluice Automation Northampton | NUNN MILLS SLUICE AUTOMATION NORTHAMPTON | Cambridgeshire |  |
| Nunn Mills Sluice Automation Northampton | NUNN MILLS SLUICE AUTOMATION NORTHAMPTON | Cambridgeshire |  |
| Eye Brook Reservoir Caldecott | EYE BROOK RESERVOIR CALDECOTT WITS | Leicestershire | 12 |
| Newnham | NEWNHAM GS WITS | Northamptonshire | 7 |
| Dallington Fsr Northampton | DALLINGTON FSR NORTHAMPTON WITS | Northamptonshire |  |
| Rase South Branch Fsr Mkt Rasen | RASE SOUTH BRANCH FSR MKT RASEN WITS | Lincolnshire | 16 |
| Hellesdon Mill Sluice Norwich | HELLESDON MILL SLUICE NORWICH | Norfolk | 68 |
| Upton Mill Gs Northants | UPTON MILL GS NORTHANTS | Northamptonshire | 68 |
| Horstead | HORSTEAD GS | Norfolk | 88 |
| Towcester Sluice | TOWCESTER SLUICE AUTOMATION | Cambridgeshire |  |
| Crabbs Bridge Gs Gsm Hatfield Peverel | CRABBS BRIDGE GS GSM HATFIELD PEVEREL DUAL COMMS | Essex |  |
| Wrentham | WRENTHAM GS | Suffolk | 38 |
| Emsworth Mill Pond Sluices | EMSWORTH MILL POND SLUICES | Hampshire | 3 |
| Water Eaton Brook Gs Bletchley | WATER EATON BROOK GS BLETCHLEY WITS | Buckinghamshire | 2 |
| Paston Brook Gs Peterborough | PASTON BROOK GS PETERBOROUGH | Cambridgeshire |  |
| King Street Gs Stowe | KING STREET GS STOWE | Lincolnshire | 2 |
| Dunston Beck | DUNSTON BECK GS | Lincolnshire | 0 |
| Louth South Fsr | LOUTH SOUTH FSR | Lincolnshire | 4 |
| Steeple Bumpstead Ls | STEEPLE BUMPSTEAD LS GSM | Essex | 235 |
| Wissett Ls | WISSETT LS | Suffolk | 28 |
| Tl66 089 Borehole Gsm Snailwell Do Not Poll Manually | TL66 089 BOREHOLE GSM SNAILWELL DO NOT POLL MANUALLY | Cambridgeshire |  |
| Clipston Fsr | CLIPSTON FSR WITS | Northamptonshire | 48 |
| Bozeat Fsr | BOZEAT FSR WITS | Northamptonshire |  |
| Oakham Fsr | OAKHAM FSR WITS | Rutland |  |
| Bransby Catchwater Ps | BRANSBY CATCHWATER PS GSM | Lincolnshire | 7 |
| Habrough Marsh Drain Outfall Immingham | HABROUGH MARSH DRAIN OUTFALL IMMINGHAM WITS | Lincolnshire | 4 |
| New Cut Drain Outfall Grimsby | NEW CUT DRAIN OUTFALL GRIMSBY WITS | Lincolnshire |  |
| New Holland Outfall | NEW HOLLAND OUTFALL  WITS | Lincolnshire | 0 |
| North Killingholme Outfall | NORTH KILLINGHOLME OUTFALL WITS | Lincolnshire | 11 |
| Oldfleet Drain Outfall Gsm Grimsby | OLDFLEET DRAIN OUTFALL GSM GRIMSBY | Lincolnshire |  |
| Oldfleet Drain Thoresby | OLDFLEET DRAIN THORESBY GS WITS | Lincolnshire | 2 |
| Ruckinge Dyke | RUCKINGE DYKE RL | Kent | 330 |
| North Point Ps | NORTH POINT PS | East Sussex | 43 |
| Till Washland Control Saxilby | TILL WASHLAND CONTROL SAXILBY WITS | Lincolnshire | 18 |
| Till Washland Control Saxilby | TILL WASHLAND CONTROL SAXILBY WITS | Lincolnshire | 18 |
| Coombe Bridge | COOMBE BRIDGE GS | East Sussex |  |
| Corby Stocks Lane Bridge | CORBY STOCKS LANE BRIDGE WITS | Northamptonshire |  |
| South Efford Marsh | SOUTH EFFORD MARSH | Devon | 9 |
| Ottery Sm Kennaway Rd | OTTERY SM KENNAWAY RD | Devon | 536 |
| Leabridge | LEABRIDGE GS | East Sussex | 56 |
| Shaldon Ringmore | SHALDON RINGMORE | Devon | 26 |
| Fairburn Sluices |  | North Yorkshire | 35 |
| Featherstone Priordale Road |  | West Yorkshire | 0 |
| Scarborough Light House |  | North Yorkshire |  |

## 2. Held by a lock or weir

A gauge counts as held for the first of these that applies:

- **Named after a lock, weir, sluice, mill, gate or staunch:** 306
- **On a canal or navigation:** 16
- **On a fen drain, rhyne or similar, in the drained lowlands (John, October 31st):** 76
- **On the non-tidal Thames below Lechlade:** 12
- **On a navigation, from its head down:** 110

A gauge with a downstream level as well isn't held on that account alone (a change from SPEC §3.4: many are gauging weirs or culverts, where the level follows the flow): 128 such gauges aren't held.

**Navigations** (from a list of navigable rivers checked by Claude; each is held from its head down: a named gauge where the navigation starts, otherwise the highest gauge named after a lock, staunch or sluice):

| River | Head | Km to the sea | Gauges held from there down |
| --- | --- | --- | --- |
| River Aire | Leeds Crown Point | 107.4 | 14 |
| River Ancholme | Brandy Wharf | 31.9 | 2 |
| River Avon | Stratford | 156.3 | 7 |
| River Avon | Pulteney Weir | 41.9 | 9 |
| River Cam | Jesus Lock Sluice Auto Cambridge | 80.3 | 4 |
| River Chelmer | Chelmsford Gates Sluice | 36.6 | 3 |
| River Don | Rotherham | 90.7 | 8 |
| River Glen | Fletland Mill Sluice Baston | 41.3 | 3 |
| River Great Ouse | Bedford | 124.7 | 20 |
| River Kennet | Newbury | 226.4 | 3 |
| River Medway | Town Lock | 68.8 | 14 |
| River Nene | Nunn Mills Sluice Automation Northampton | 150.6 | 21 |
| River Ouse | Naburn Lock | 80.5 | 6 |
| River Severn | Worcester (Barbourne) | 116.0 | 14 |
| River Soar | Pillings Lock | 186.2 | 3 |
| River Stort | Bishops Stortford, Grange Paddocks | 54.7 | 4 |
| River Thames | St Johns Lock | 305.3 | 54 |
| River Trent | Cranfleet Lock | 163.9 | 9 |
| River Wey | River Wey at Unstead Sluice | 149.7 | 8 |
| River Witham | Bargate Weir | 63.9 | 10 |

Every held gauge, by river:

- **(no river name):** Upton Mill Gs Northants (name), Seagry Gate (name), Hellesdon Mill Sluice Norwich (name), Emsworth Mill Pond Sluices (name), Duckaller Weir C (name), Goxhill Outfall Sluice (name), Nunn Mills Sluice Automation Northampton (name), Nunn Mills Sluice Automation Northampton (name), Towcester Sluice (name)
- **Alphin Brook:** Exeter Alphington Mill Lane (name)
- **Amwell Loop:** Tumbling Bay Weir (name)
- **Back Brook:** Coley Mill (name)
- **Back Delfin:** Wholsea Grange (canal)
- **Baildon Dyke:** Skelmanthorpe Park Gate (name)
- **Barge Canal:** Plaza Grill (canal)
- **Barlings Eau:** Langworth (drain), Incident Deployable Atu (drain)
- **Barmston Main Drain:** Lissett New Bridge (drain)
- **Beam River:** Beam Auto Sluice (name)
- **Beverley and Barmston Drain:** Wilfholme PS (drain), Beverley Waterside Pumping Station (drain), Hull High Flags (drain)
- **Bielby Beck:** Thornton Lock (name)
- **Billing Brook:** Billing Lock (name)
- **Bottisham Lode:** Bottisham Ps (drain)
- **Bourne Eau:** Mays Sluice (name), Bourne Eau Ps (drain)
- **Bradiford Water:** Plaistow Mill (name)
- **Burstwick Drain:** Burstwick Hall Road Bridge (drain), Hedon Thorn Road Bridge (drain), Salt end (drain)
- **Candover Stream:** Borough Bridge weir (name)
- **Car Dyke:** Metheringham Delph Sluice (name)
- **Catchwater Drain:** Tumby Woodside (drain), Mareham le Fen (drain)
- **Colne Brook:** Horton Mill (name), Wraysbury Mill (name)
- **Counter Drain:** Welches Dam (drain)
- **Cow Bank Drain:** Burgh Sluice Doors Gibraltar (name)
- **Cowcroft Drain:** Bratoft Road Bridge (drain)
- **Cuckmere River:** Milton Lock (name)
- **Currymoor Drain:** Currymoor Pumping Station (drain)
- **Danes Stream:** Milford Flood Bar (name)
- **Dun Navigation Canal:** Doncaster Strawberry Island Temp (canal)
- **East Drain:** Ferriby Sluice East Drain Outfall (name)
- **East Fen Catchwater:** Toynton Fenside (drain)
- **East Halton Beck:** East Halton Skitter Sluice (name)
- **East Okement River:** Okehampton Mill Road (name)
- **Fleet Drain:** Hessle (drain)
- **Fosdyke Canal:** Fosdyke Jetty (canal)
- **Fossdyke Navigation:** Burton Marina (canal), Odder Bridge (canal)
- **Foston Beck:** Foston Mill (name)
- **Fray's River:** Old Mill House Penstock (name)
- **Frays River:** Uxbridge, Fountains Mill (name)
- **Garren Brook:** Marstow Mill (name)
- **Grand Union Canal:** Warwick Rothwell Road (canal)
- **Great Eau:** Claythorpe Great Eau (drain), Cloves Bridge Gs Saltfleetby All Saints (drain), Great Eau Outfall Sluice Saltfleet (name)
- **Great Stour:** Brown Mill (name), Horton weir (name), West Gate Gardens (name)
- **Harpers Brook:** Old Mill Bridge, Lowick (name)
- **Haven Drain:** Winterton Beck Outfall Sluice Winteringham (name)
- **Haverings New Sewer:** Havering Tidal Sluice (name)
- **Head Dike:** Five Willow Wath Bridge Gs South Kyme (drain)
- **Hilton Brook:** Sutton Mill (name)
- **Holderness Drain:** Bransholme Great Culvert Pumping Station (drain), East Hull Hedon Road (drain), Holderness Drain Outfall PS (drain), Tickton PS (drain)
- **Huish Level Rhyne:** Westover Pumping Station (drain)
- **Jubilee Flood Relief Channel:** Jubilee River at Manor Farm Weir (name), Jubilee River at Slough Road Weir (name)
- **Keyingham Drain:** Stone Creek (drain)
- **Kings Sedgemoor Drain:** Bradney (drain), Dunball (drain)
- **Letcombe Brook:** Dandridge Mill (name)
- **Levisham Beck:** Levisham Mill (name)
- **Longload Main Drain:** Huish Episcopi Pumping Station (drain)
- **Longstongs Delph:** Sandhill Beck Gs Gsm Fiskerton (drain)
- **Louth Canal:** Louth Tilting Gate Sluice (name), Thoresby,Louth Canal (canal), Tetney Outfall (canal)
- **Lowfield Drain:** Newark Balderton (drain)
- **Lukely Brook:** Carisbrook Mill (name)
- **Main Drain:** Anderby Creek Sluice (name)
- **Manchester ship canal:** Ferry Lane, Warrington (canal)
- **Manchester Ship Canal:** Ince PS (canal)
- **Mar Dyke:** Mardyke Sluice Purfleet (name)
- **Market Weighton Canal:** North America (canal)
- **Maud Foster Drain:** Maud Foster Sluice Boston (name)
- **Maud Foster/Stonebridge Drain:** Sibsey (drain), Cowbridge (drain)
- **Mickley Dyke:** Hempholme Pumping Station (drain)
- **Middle Drain:** Middle Drain Outfall Immingham (drain)
- **Mill Avon:** Abbey Mill GATE (name)
- **Mill Beck:** Norton Mill Beck Screen (name)
- **Monk Dyke:** Riston Pumping Station (drain)
- **Morton's Leam:** Stanground Sluice Peterborough (name), Rings End Sluice (name)
- **Nailsworth Stream:** Egypt Mill (name)
- **New Mill Dike:** New Mill Holmfirth Road (name)
- **Newknock Channel:** Scots Float Sluice (name)
- **North Beck Drain:** Stallingborough (drain), North Beck Outfall Immingham (drain)
- **North Drain:** North Drain (drain)
- **North Walsham and Dilham Canal:** Honing Lock (name)
- **Northmoor Main Drain:** Northmoor Drain (drain), Northmoor Ps (drain)
- **Old Bedford River:** Old Bedford Sluice Salters Lode (name)
- **Old River Witham:** Branston Island Sluice (name)
- **Ouse Dyke:** Carlton (drain)
- **Pennington Brook:** Leigh Pennington Mill Bridge (name)
- **Pointon Lode:** Pointon Lode (drain)
- **Poulton Drain:** Covenham St. Mary (drain)
- **Rainham Creek:** Frog Island Tidal Sluice (name)
- **Rattlesden River:** Rattlesden Reservoir Sluice (name)
- **Riding Gate Brook:** Riding Gate Brook (name)
- **Rippingale Running Dike:** Rippingale Running Dyke (drain)
- **Rive Ditch:** West Byfleet Bridge (canal)
- **River Adur:** Sakeham Weir (name)
- **River Aire:** Leeds Crown Point (navigation), Leeds Crown Point Flood Alleviation Scheme (navigation), Leeds Knostrop Weir Flood Alleviation Scheme (name), Oulton Lemonroyd (navigation), Lowther Washlands Compartment B (navigation), Mickletown Ings (navigation), Castleford (navigation), Ferrybridge Lock (name), Knottingley Bank Dole Lock (name), Beal Weir Bridge (name), Birkin Holme Washlands (navigation), Chapel Haddlesey (navigation), Carlton Bridge (navigation), Airmyn (navigation)
- **River Allen:** Walford Mill (name)
- **River Ancholme:** Brandy Wharf (navigation), Brigg (navigation)
- **River Anton:** Andover Town Mill (name)
- **River Arrow:** Titley Mill (name)
- **River Arun:** Provender Mill (name)
- **River Avon:** Stratford (navigation), Bidford on Avon (navigation), Evesham (navigation), Pershore (navigation), Avon Weir (name), Eckington Sluice (name), Avon Mill (name), Bredon (navigation), Upper Pound (navigation), Chippenham Gate (name), Melksham Gate (name), Pulteney Weir (name), Bath Destructor Bridge (navigation), Twerton Gate (name), Saltford (navigation), Keynsham, Rivermead (navigation), Bristol Netham Lock (name), Netham Weir (name), Bristol Bedminster St Johns Lane Upstream (navigation), Ashton Vale (navigation), Knapp Mill (name)
- **River Bain:** Horncastle Victoria Mill (name), Fulsby Lock R Bain (name)
- **River Bela:** Beetham Weir (name)
- **River Beult:** Cheveney Gate (name)
- **River Bollin:** Old Mill Lane (name), Bollington Mill (name)
- **River Calder:** Whalley Weir (name)
- **River Cam:** Haslingfield Burnt Mill Number 2 (name), Jesus Lock Sluice Auto Cambridge (name), Cambridge Jesus Lock (name), Cambridge Baits Bite (navigation), Bottisham Sluice (name)
- **River Can:** Beach's Mill (name)
- **River Chelmer:** Chelmsford Gates Sluice (name), Sandford Mill Sluice Chelmsford (name), Ulting Fgs (navigation)
- **River Cherwell:** Enslow Weir A (name)
- **River Churnet:** Flint Mill (name)
- **River Colne:** Huntsmoor Weir (name), Stanwell Gate 1 (Lake Offtake) (name), Stanwell Mill (name), East Mill Sluice Colchester (name)
- **River Deben:** Letheringham Mill Sluice (name), Glevering Mill Sluice (name)
- **River Delph:** Welmore Lake Sluice (name)
- **River Derwent:** Mowthorpe Weir Head (name), Norton Mill Beck PS (name), Blackhall Mill (name), Seaton Mill, Barepot, Workington (name)
- **River Don:** Rotherham (navigation), Rotherham Forge Island (navigation), Kilnhurst Lower (navigation), Mexborough Lock (name), Sprotbrough (navigation), Doncaster (navigation), Kirk Bramwith (navigation), Fishlake (navigation)
- **River Dour:** Crabble Mill (name)
- **River East Allen:** Allen Mill Bridge (name)
- **River Eau:** Scotter (drain)
- **River Eden:** Haxted Mill (name)
- **River Ehen:** Bleach Green Weir (name)
- **River Erewash:** Shipley Gate (name)
- **River Evenlode:** Cassington Weir A (name)
- **River Exe:** Trews Weir (name)
- **River Eye:** Brentingby Dam GATE (name)
- **River Freshney:** Freshney Tilting Gate Grimsby (name)
- **River Frome:** Louds Mill (name)
- **River Frome (Severn):** Ebley Mill (name)
- **River Gaunless:** Ramshaw Mill (name)
- **River Gipping:** Hawks Mill Sluice Needham Market (name), Horseshoe Sluice (name)
- **River Glen:** Fletland Mill Sluice Baston (name), Kates Bridge (navigation), Surfleet Sluice (name)
- **River Great Ouse:** Bedford (navigation), Bedford (navigation), Cardington (navigation), Castle Mill (name), Roxton (navigation), Eaton Socon (navigation), St Neots (navigation), Offord (navigation), Offord Grafham Intake Sidelooker (navigation), Brampton Sluice (name), Godmanchester (navigation), Houghton (navigation), Hemingford (navigation), St Ives (navigation), Brownshill (navigation), Earith (navigation), Soham Lode (navigation), Sutton Gault (navigation), Ely (navigation), Welney Causeway (navigation)
- **River Hamble:** Botley Mill Stream (name)
- **River Holme:** Queen's Mill (name)
- **River Irk:** Collyhurst Weir (name)
- **River Irwell:** Throstle Mill (name), Holt Mill Bridge (name), Ramsbottom Weir (name), Adelphi Weir (name)
- **River Isle:** Ashford Mill (name)
- **River Itchen:** City Mill (name), Wharf Mill (name), Highbridge weir (name), Allbrook weir (name), Stoke Lock (name), Woodmill Gate (name)
- **River Kennet:** Newbury (navigation), Reading Calcot Bridge (navigation), Blakes Lock (name)
- **River Lark:** Barton Mills Sluice (name)
- **River Lavant:** Westhampnett Mill (name)
- **River Lea:** Feildes Weir (name)
- **River Loddon:** Longbridge Mill (name), Sindlesham Mill (name)
- **River Lune:** Skerton Weir (name)
- **River Maun:** Field Mill (name)
- **River Medway:** Town Lock (name), Hartlake (navigation), Oak Weir Telemetry (name), Little Mill (name), Branbridges (navigation), Yalding Mill Lane (name), Yalding Upstream (navigation), Yalding Hampstead Lock (name), Teston (navigation), East Farleigh Gate Upstream (name), East Farleigh (navigation), Maidstone (navigation), Allington Marina (navigation), Allington Lock (name)
- **River Mersey:** Woolston Weir temp (name), Ashton Weir (name)
- **River Mimram:** Fulling Mill (name)
- **River Neet:** Woolstone Mill (name)
- **River Nene:** Geldharts Mill (name), Duston Mill (name), St Andrews Mill (name), Nunn Mills Sluice Automation Northampton (name), Bedford Road Sluice Northampton (name), Bedford Road Sluice (name), Northampton Washlands (navigation), Nene Valley (navigation), Clifford Hill Lock Sluice Gsm Northampton (name), Cogenhoe (navigation), Hardwater Mill Sluice Great Doddington (name), Wellingborough Embankment (navigation), Lower Ringstead Sluice (name), Islip Sluice (name), Lilford (navigation), Elton Sluice (name), Wansford Sluice (name), Wansford A47 No1 (navigation), Wansford (navigation), Water Newton Sluice (name), Orton Sluice (name), Padholme Ps (navigation), Little Bridge (navigation), Dog in A Doublet Sluice (name)
- **River Orwell:** Handford Sluice (name)
- **River Ouse:** Naburn Lock (name), Cawood (navigation), Selby Wistow Sluices (navigation), Selby Westmill (navigation), Goole (navigation), Blacktoft (navigation)
- **River Parrett:** Oath Lock (name)
- **River Rede:** Otterburn Mill (name)
- **River Rhee:** Haslingfield Burnt Mill (name)
- **River Ribble:** Locks Weir (name), Arnford Weir (name)
- **River Roding:** Shonks Mill Bridge (name)
- **River Rother:** Woodhouse Mill (name), Iping Mill (name), Crowhurst Weir (name), Scots Float (name)
- **River Sence:** Temple Mill (name)
- **River Severn:** Worcester (Barbourne) (navigation), Diglis (navigation), Kempsey Yacht Club (navigation), Saxons Lode (navigation), Mythe Bridge (navigation), Deerhurst Flood Plain Level (navigation), Deerhurst (navigation), Haw Bridge (navigation), Ashleworth (navigation), Sandhurst (navigation), Gloucester (navigation), Minsterworth (navigation), Epney (navigation), Sharpness (navigation)
- **River Skell:** Alma Weir (name)
- **River Slea:** Cranwell Line Sluice (name), Slea Tilting Gate (name), Leasingham Mill (name), Kyme Eau Sluice Chapel Hill (name)
- **River Soar:** Pillings Lock (name), Pillings GATE (name), Kegworth (navigation), Freemans Weir (name)
- **River Sprint:** Sprint Mill, Kendal (name)
- **River Stort:** Bishops Stortford, Grange Paddocks (navigation), Sawbridgeworth (navigation), Harlow Mill (name), Roydon, Glen Faba (navigation)
- **River Taw:** Coldridge Park Mill Bridge (name)
- **River Teise:** Bartley Mill (name)
- **River Thames:** St Johns Lock (name), Buscot Lock (name), Grafton Lock (name), Radcot Lock (name), Rushey Lock (name), Shifford Lock (name), Northmoor Lock (name), Farmoor (thames), Pinkhill Lock (name), Eynsham Lock (name), Kings Lock (name), Godstow Lock (name), Osney Lock (name), Iffley Lock (name), Sandford-on-Thames (thames), Abingdon Lock (name), Culham Lock (name), Sutton Courtenay (thames), Clifton Lock (name), Days Lock (name), Benson Lock (name), Cleeve Lock (name), Goring Lock (name), Whitchurch Lock (name), Mapledurham Lock (name), Reading (thames), Caversham Lock (name), Sonning Lock (name), Shiplake Lock (name), Marsh Lock (name), Hambleden Lock (name), Hurley Lock (name), Temple Lock (name), Marlow Lock (name), Cookham Lock (name), Boulters Lock (name), Maidenhead (thames), Bray Lock (name), Boveney Lock (name), Romney Lock (name), Windsor Park (thames), Old Windsor Lock (name), Bell Weir (name), Staines (thames), Penton Hook (thames), Chertsey Lock (name), Shepperton Lock (name), Walton (thames), Sunbury Lock (name), Molesey Lock (name), Thames Ditton Island (thames), Kingston (thames), Trowlock Island (thames), Teddington Lock (name)
- **River Thet:** Thetford Coffee Mill Sluice (name)
- **River Till:** Heaton Mill (name)
- **River Tillingham:** Tillingham Gate (name)
- **River Trent:** Cranfleet Lock (name), Clifton Bridge (navigation), Colwick (navigation), Gunthorpe (navigation), Farndon (navigation), North Muskham (navigation), Carlton on Trent (navigation), Torksey (navigation), Gainsborough (navigation)
- **River Tyne:** Riding Mill (name)
- **River Uck:** Uckfield Mill upstream (name), Isfield weir (name)
- **River Ure:** Westwick Weir (name)
- **River Wallington:** North Fareham weir (name)
- **River Wandle:** River Wandle at Ravensbury Mill (name)
- **River Waring:** HORNCASTLE BATHS SLUICE WITS under test (name)
- **River Waveney:** Syleham Mill Sluice (name), Mendham Sluice (name), Bungay Sluice (name), Wainford Sluice (name), Ellingham Mill Sluice (name)
- **River Weaver:** Hayhurst Bridge (canal)
- **River Welland:** Hudds Mill (name)
- **River Wensum:** Bintree Mill Sluice (name), Costessey Mill (name), New Mills Norwich Sluice (name)
- **River Wey:** Passfield Mill (name), Westbrook Mill (name), River Wey at Unstead Sluice (name), Guildford (navigation), River Wey at Stoke Mill (name), Old Woking (navigation), Newark Weir (name), River Wey at Byfleet Mill (name), Brooklands (navigation), Weybridge (navigation)
- **River Wharfe:** Flint Mill (name)
- **River Wissey:** Wissey Sluice (name)
- **River Witham:** Witham Washland Sluice - Washland (name), Bargate Weir (name), Sewells Walk Lincoln (navigation), Great Gowt Sluice (name), Brayford Pool (navigation), Stamp End Sluice (name), Fiskerton Sluice (name), Bardney (navigation), Kirkstead Bridge (navigation), Chapel Hill (navigation), Langrick Bridge (navigation)
- **River Yare:** Cringleford Sluice (name), Keswick Mill Sluice (name), Trowse Mill Sluice (name)
- **River Yealm:** Ivybridge Lee Mill (name)
- **River Yeo:** Pen Mill (name)
- **Roam Drain:** Hempholme PS (drain)
- **Royal Military Canal:** Glenfield Gate West Hythe Dam Level (name), Glenfield Gate Upstream Level (name), Hundred House Bridge (canal)
- **Saltmoor Main Drain:** Baltmoor Wall Saltmoor Barrier (drain), Saltmoor Drain (drain)
- **Scrapsgate Drain:** Scraps Gate (name)
- **Scurf Dyke:** Scurf Dyke (drain)
- **Setting Dyke:** North Hull Birdsall Avenue (drain), North Hull National Avenue (drain)
- **Sherston Avon:** St Johns Weir (name)
- **Sincil Dyke:** Lincoln Monson Street (drain)
- **Skeffling Drain:** Skeffling Pumping Station (drain)
- **South Delph:** Branston Delph Penstock (drain)
- **South Forty Foot Drain:** Billingborough Ousemere (drain), Dowsby Fen (drain), Swaton (drain), Donington Bridge (drain)
- **St Neot River:** Colliford Weir (name)
- **Stanground Lode:** Stanground Lode Gs Yaxley (drain)
- **Stanmoor Main Drain:** Stanmoor Drain (drain)
- **Steeping River:** HAVENHOUSE SLUICE AUTO WITS under test (name)
- **Stock Moor Rhyne:** Stockmoor (drain)
- **Stocksfield Burn:** Stocksfield Ridley Mill (name)
- **Swavesey Drain:** Webbs Hole Sluice (name)
- **The Beck:** Barrow Haven Outfall Sluice (name)
- **The Gores:** Horseshoe Corner Tidal Sluice (name)
- **The Haven:** Boston Grand Sluice (name)
- **Thorngumbald Drain:** Thorngumbald Pumping Station (drain)
- **Treffry Canal:** Par Highways (canal)
- **Trib (fowey):** Siblyback Weir (name)
- **Trusthorpe Pumping Drain:** Woldgrift Drain Outfall Mablethorpe (drain)
- **Uphill Great Rhyne:** Uphill Rhyne Terrace Tilting Weir (name)
- **Upper Brook:** Abbey Mill (name)
- **Waren Burn:** Waren Mill (name)
- **Warnham Mill Pond:** Warnham Mill Gate (name)
- **Weighton Lock:** Broomfleet Weighton Lock (name)
- **West Beck:** Wansford Snakeholm Lock (name)
- **West Common Stream:** Witch Inn Sluice (name)
- **West Drain:** Scabcroft Weir upstream (name)
- **West Fen Catchwater Drain:** New York (drain), Revesby (drain)
- **West Glen River:** Greatford Sluice (name)
- **West Moor Drain:** Midelney (drain)
- **Western Drain:** Hessle Western Drain (drain), Hull Hessle Astral Close (drain)
- **Westonzoyland Engine Rhyne:** Westonzoyland (drain)
- **Willoughby High Drain:** Chapel St Leonards (drain)
- **Winestead Drain:** Winestead Booster Pumping Station (drain), Patrington Haven Outstrays (drain)
- **Wold Grift Drain:** Alford (drain), Bilsby (drain)
- **Woodbridge Brook:** Crabb Mill (name)
- **Wooler Water:** Coldgate Mill (name)
- **Wraysbury River:** Stanwell Gate 2 (Airport Way) (name), Pound Mill, Staines (name)

**Drains.** A drainage word in the river's name (drain, rhyne, lode, delph, eau, dyke, dike, catchwater) counts only in Lincolnshire, Cambridgeshire, Norfolk, Suffolk, Somerset, East Riding of Yorkshire, Nottinghamshire. Held as drains: 76. Not held, being elsewhere (usually streams, or urban drains):

Stocklake (Broughton Lane Drain, Buckinghamshire); Craven Arms (Field Drain, Shropshire); Hayes Basin (Field Drain, Shropshire); Richard White Radial Gates (Nazeing Drain, Essex); Meadgate Sluices (Nazeing Drain, Essex); Oldbury (Oldbury Naite Rhyne, Gloucestershire); Poulton Cottam Hall Field Grid (Horsebridge Dyke, Lancashire); Preesall Pumping Station, Cockers Dyke (Cockers Dyke, Lancashire); Kirkbride (Monks Dyke, Cumbria); Brewery Grill (Oxlease Drain, Hampshire); Stifford Mardyke (Mar Dyke, Essex); Mardyke Sluice Purfleet (Mar Dyke, Essex), held by its name; Scraps Gate (Scrapsgate Drain, Kent), held by its name; White Water Dyke (White Water Dyke, Kent); Raunds North Street Bridge (Hog Dyke, Northamptonshire); Catcliffe Drain (Catcliffe Drain, South Yorkshire); Grimesthorpe (Bagley Dike, South Yorkshire); Wath upon Dearne (Brook Dike, South Yorkshire); Skelmanthorpe Park Gate (Baildon Dyke, West Yorkshire), held by its name; Fishlake Woodhouse Ings (Temporary) (Green Dyke, South Yorkshire); Bentley Ings Screen (Fowler Bridge Drain, South Yorkshire); New Mill Holmfirth Road (New Mill Dike, West Yorkshire), held by its name; Huddersfield Willow Lane (Grimescar Dike, West Yorkshire); Huddersfield York Avenue (Allison Dyke, West Yorkshire); Hensall Ings (Wheelan Dyke, North Yorkshire); Roall Ings (Roall Dyke, North Yorkshire); Pontefract Wash Dike (Wash Dike, West Yorkshire); Ferrybridge Fishergate (Wash Dike, West Yorkshire); York Foss Barrier (Browney Dyke, North Yorkshire).

## 3. Rivers joining

A check on OS Open Rivers: each tributary should join the river it really joins. A sample of the biggest:

| River → joins | Gauges |
| --- | --- |
| River Aire → River Ouse | 26 |
| River Trent → Whitton Channel | 19 |
| River Witham → The Haven | 18 |
| River Calder → River Aire | 18 |
| River Wey → River Thames | 17 |
| River Avon → Swash Channel | 16 |
| River Welland → Welland Outfall | 14 |
| River Derwent → Rusholme Reach | 14 |
| River Irwell → Manchester Ship Canal | 13 |
| River Don → River Ouse | 13 |
| River Wharfe → River Ouse | 13 |
| River Avon → River Severn | 12 |
| River Itchen → Southampton Water | 12 |
| River Tame → River Trent | 12 |
| River Colne → River Thames | 11 |
| River Test → Southampton Water | 11 |
| River Rother → River Don | 11 |
| River Ouse → Whitton Channel | 11 |
| River Avon → River Stour | 10 |
| River Cherwell → River Thames | 9 |
| River Teme → River Severn | 9 |
| River Pinn → River Colne | 9 |
| Great Stour → River Stour | 8 |
| River Mole → River Ember | 8 |
| River Derwent → River Trent | 8 |
| River Wandle → River Thames | 8 |
| River Mersey → Manchester Ship Canal | 8 |
| River Waveney → River Yare | 8 |
| River Dearne → River Don | 8 |
| River Thame → River Thames | 7 |
| River Dove → River Trent | 7 |
| River Ravensbourne → River Thames | 7 |
| River Cam → River Great Ouse | 7 |
| River Ure → River Ouse | 7 |
| River Swale → River Ure | 7 |
| River Gaunless → River Wear | 6 |
| River Wye → River Severn | 6 |
| River Stour → River Severn | 6 |
| River Chelt → River Severn | 6 |
| River Kennet → River Thames | 6 |

**319 gauges sit on a stretch with a different name from the EA's river name** (often a mill stream, a side channel or a small tributary just beside the main river; the EA's name is kept). The first 40:

| Gauge | EA's river | Stretch it sits on | Metres |
| --- | --- | --- | --- |
| Hartburn | River Hartburn | Hart Burn | 16 |
| Haltwhistle | River Tyne | River South Tyne | 36 |
| Tanfield | River Team | Houghwell Burn | 6 |
| Hexham Wydon Water | Wydon Burn | Halgut Burn | 146 |
| Wearhead | Killhope Burn | North Grain | 12 |
| Oakley Cross Beck | Oakley Cross Beck | River Gaunless | 574 |
| Lingfield Eden Brook | Eden Tributary Medway | Eden Brook | 55 |
| Yarkhill | River Frome (Wye) | River Frome | 7 |
| Bishops Frome | River Frome (Wye) | River Frome | 5 |
| Bromyard | River Frome (Wye) | River Frome | 1 |
| Knolls Bridge, Chester | Finchett's Gutter | Backford Brook | 5 |
| Clifton Drive | Finchett's Gutter | Sealand Main Drain | 3 |
| Kestrel Drive | Dorcan Brook | Dorcan Stream | 23 |
| Vexour Bridge | Eden Tributary Medway | River Eden | 16 |
| Sellindge | East Stour Trib Great Stour | East Stour River | 0 |
| Minns Estate | Seacourt Stream | Wytham Stream | 35 |
| Hinksey Lake | Hinksey Stream | Eastwyke Ditch | 76 |
| Weston Turville | Wendover Springs | Wendover Brook | 6 |
| Churchill Avenue | Southcourt Brook | Stoke Brook | 534 |
| Offenham | Badsey Brook | Broadway Brook | 189 |
| Ebley Mill | River Frome (Severn) | River Frome | 12 |
| Llanyblodwel | River Tanat | Afon Tanat | 10 |
| Castle Foregate | Bagley Brook | River Severn | 235 |
| Sharpness | River Severn | Gloucester and Sharpness Canal | 19 |
| Brimscombe | River Frome (Severn) | River Frome | 3 |
| Bodiam Avenue | Daniels Brook | Daniel's Brook | 3 |
| Hungerford Shalbourne | River Shalbourne | Shalbourne Stream | 2 |
| Windyridge Road | Wymans Brook | Wyman's Brook | 0 |
| Childswickham | Badsey Brook | Bunches Brook | 3 |
| Broadway Flood Storage Area | Badsey Brook | Bunches Brook | 13 |
| Yalding Mill Lane | River Medway | River Beult | 11 |
| Kings Somborne | Somborne Stream | Sombourne Stream | 1 |
| Port Isaac | Coastal Stream | Port Isaac Stream | 5 |
| Chalford | River Frome (Severn) | River Frome | 1 |
| Sandhurst | River Severn | Broadboard Brook | 1 |
| Sandhurst | Hatherley Brook | Broadboard Brook | 1 |
| Lydney | River Lyd | The Lyd | 1 |
| Hereford - Ledbury Road | Yazor Brook | Eign Brook | 2 |
| Mor Brook | Moors River | Mor Brook | 3 |
| Prestbury Road | Wymans Brook | Wyman's Brook | 1 |

**Rivers in more than one piece.** OS Open Rivers has gaps that couldn't be joined up, so these rivers' gauges (in the same county) are in separate pieces and won't be put in order across the gap. 19 cases (some are really two rivers with one name):

River North Tyne (Northumberland); Finchett's Gutter (Cheshire); River Avon (Wiltshire); River Blackwater (Hampshire); River Gade (Hertfordshire); River Soar (Leicestershire); River Sence (Leicestershire); River Char (Dorset); River Yeo (Devon); River Axe (Somerset); River Allen (Cornwall); River Weaver (Cheshire); Trout Beck (Cumbria); River Arun (West Sussex); Fossdyke Navigation (Lincolnshire); River Lark (Suffolk); River Waveney (Suffolk); Sea Cut (North Yorkshire); Beverley and Barmston Drain (East Riding of Yorkshire).

## 4. Far from any river

78 gauges have no OS Open Rivers stretch within 600 m, so they can't be put in river order (they'd be listed after the others):

| Gauge | River | County |
| --- | --- | --- |
| Derwent Reservoir | Derwent Reservoir | Durham |
| Lower Stratton | River Cole | Wiltshire |
| Abingdon Peachcroft | Radley Park Ditch | Oxfordshire |
| Ewelme | Ewelme Brook | Oxfordshire |
| Field Court Drive | Dimore Brook | Gloucestershire |
| Brownwich Pond | Brownwich Stream | Hampshire |
| Clayton |  | West Sussex |
| Cleobury Mortimer | Pudding Brook | Shropshire |
| Markyate | River Ver | Hertfordshire |
| Princes Drive FWS | The Rythe | Surrey |
| Crawters Brook |  | Surrey |
| Woodfield Road | Crawter's Brook | West Sussex |
| Eastbourne Harbour | Tide | East Sussex |
| Hampstead Suburb | Mutton Brook | Greater London |
| Kenton Lane | Wealdstone Brook | Greater London |
| Worcester Park | Beverley Brook | Greater London |
| Motspur Park | Beverley Brook | Greater London |
| Morden Park | Pyl Brook | Greater London |
| Waddon Ponds | River Wandle | Greater London |
| Thornton Heath | Norbury Brook | Greater London |
| Abercairn Road | River Graveney | Greater London |
| Carlton | Ouse Dyke | Nottinghamshire |
| Stafford | Rising Brook | Staffordshire |
| Warminster Folly Lane | River Allen | Wiltshire |
| Chiswell |  | Dorset |
| Monsoon Drain Bridge | English Channel | Dorset |
| Staplake |  | Devon |
| Membury |  | Devon |
| Newcastle-Under-Lyme Lower Milehouse Lane |  | Staffordshire |
| Belper | Coppice Brook | Derbyshire |
| Woodborough | Woodborough Brook | Nottinghamshire |
| Wollaton | Tottle Brook | Nottinghamshire |
| Bradwell | Bradwell Brook | Derbyshire |
| Bodmin Cummings Garage |  | Cornwall |
| Perryfoot Farm, Castleton | Little Bull Pit Swallet | Derbyshire |
| Oadby | Wash Brook | Leicestershire |
| Tideswell | Tideswell Brook | Derbyshire |
| Cribbs Causeway Reservoir |  | Gloucestershire |
| Frodsham PS |  | Merseyside |
| Crow Tree Farm Brook | Unnamed Watercourse | Greater Manchester |
| Dyers lane | Sandy Brook | Lancashire |
| Silloth |  | Cumbria |
| Highlands Road |  | Hampshire |
| Highlands Road |  | Hampshire |
| Churchill Road |  | Surrey |
| St Andrews Close |  | Kent |
| Postling Road |  | Kent |
| Salterns |  | Hampshire |
| Denton | River Nene | Northamptonshire |
| Nunn Mills Sluice Automation Northampton |  | Cambridgeshire |
| Nunn Mills Sluice Automation Northampton |  | Cambridgeshire |
| Dallington Fsr Northampton |  | Northamptonshire |
| Towcester Sluice |  | Cambridgeshire |
| Crabbs Bridge Gs Gsm Hatfield Peverel |  | Essex |
| Filton Southmead Road | River Trym | Bristol |
| Welton Beck | Welton Beck | Lincolnshire |
| Paston Brook Gs Peterborough |  | Cambridgeshire |
| Warden Bay | Warden Bay Stream | Kent |
| Tl66 089 Borehole Gsm Snailwell Do Not Poll Manually |  | Cambridgeshire |
| Bozeat Fsr |  | Northamptonshire |
| Oakham Fsr |  | Rutland |
| New Cut Drain Outfall Grimsby |  | Lincolnshire |
| Oldfleet Drain Outfall Gsm Grimsby |  | Lincolnshire |
| Greatstone | New Romney Sewage Arm | Kent |
| Coombe Bridge |  | East Sussex |
| Corby Stocks Lane Bridge |  | Northamptonshire |
| Sidmouth Higher Woolbrook Road | Wool Brook | Devon |
| Higher Brixham Horsepool Street | Higher Brixham Watercourse | Devon |
| Paignton Kings Ash Road | Clennon Valley Watercourse | Devon |
| Portland Causeway Ditch | English Channel | Dorset |
| Stanks Screen | Cock Beck | West Yorkshire |
| Scarborough Light House |  | North Yorkshire |
| Tickton PS | Holderness Drain | East Riding of Yorkshire |
| Paull | North Sea | East Riding of Yorkshire |
| Thorngumbald Pumping Station | Thorngumbald Drain | East Riding of Yorkshire |
| South Cave Beverley Road | South Cave Beck | East Riding of Yorkshire |
| Hartlepool Valley Drive | Burn Valley Beck | Durham |
| Billingham Pennington Close | Cowbridge Beck | Durham |

## 5. Lakes and reservoirs

| Gauge | River or lake | County |
| --- | --- | --- |
| Derwent Reservoir | Derwent Reservoir | Durham |
| Hinksey Lake | Hinksey Stream | Oxfordshire |
| Crondall Pond | River Hart | Hampshire |
| Brownwich Pond | Brownwich Stream | Hampshire |
| Stanwell Gate 1 (Lake Offtake) | River Colne | Greater London |
| Kings Pond | River Wey | Hampshire |
| Shirley Pond | Tanners Brook | Hampshire |
| Cerne Abbas Reservoir | River Cerne | Dorset |
| Cannock Churchbridge Hall Lane | Wash Brook | Staffordshire |
| Scalford Dam | Scalford Brook | Leicestershire |
| Foston Reservoir | Foston Brook | Derbyshire |
| Loe Pool | River Cober | Cornwall |
| Bodmin Priory Pond |  | Cornwall |
| Bodmin St Petrocs Well | Bodmin Town Leat | Cornwall |
| Sherborne Lake | River Yeo | Dorset |
| Cribbs Causeway Reservoir |  | Gloucestershire |
| Walkden The Reach | Whittle Brook | Greater Manchester |
| Torside Reservoir | Torside Reservoir | Derbyshire |
| Bottoms Reservoir |  | Derbyshire |
| Sale Waterpark | Sale Water Park | Greater Manchester |
| Pennington PS |  | Greater Manchester |
| Lower Rivington Reservoir | Lower Rivington Reservoir | Lancashire |
| Upper Rivington Reservoir | River Yarrow | Lancashire |
| Stocks Reservoir Level | River Hodder | Lancashire |
| Abbeystead Reservoir | River Wyre | Lancashire |
| Far Sawrey | Windermere | Cumbria |
| Brown Howe | Coniston Water | Cumbria |
| Ennerdale Lake | River Ehen | Cumbria |
| Thirlmere Reservoir (Spillway level = 16.55m) | Thirlmere Reservoir | Cumbria |
| Castle Howe | Bassenthwaite Lake | Cumbria |
| Haweswater Reservoir (Spillway level = 31.39m) | Haweswater Reservoir | Cumbria |
| Pooley Bridge Steamer Pier | Ullswater | Cumbria |
| Coalburn Beck | Coal Burn | Northumberland |
| Thacka Beck Reservoir | Thacka Beck | Cumbria |
| North Pond | River Hamble | Hampshire |
| Weldon Flood Storage Reservoir | Willow Brook | Northamptonshire |
| Romsey Botley Road | Tadburn Lake | Hampshire |
| Eye Brook Reservoir Caldecott |  | Leicestershire |
| Ruxley Pits Outfall | River Cray | Greater London |
| Brayford Pool | River Witham | Lincolnshire |
| Litte Bowden Flood Storage Reservoir | River Jordan | Leicestershire |
| Welmore Lake Sluice | River Delph | Norfolk |
| Rattlesden Reservoir Sluice | Rattlesden River | Suffolk |
| Emsworth Mill Pond Sluices |  | Hampshire |
| Great Easton Flood Storage Reservoir | River Welland | Leicestershire |
| Medbourne Flood Storage Reservoir | Medbourne Brook | Leicestershire |
| Ruckinge Dyke |  | Kent |
| Ardingly Shellbrook | Shell Brook | West Sussex |
| Warnham Mill Gate | Warnham Mill Pond | West Sussex |
| Meadowgate Regulator | River Rother | South Yorkshire |
| Meadowgate Lake | River Rother | South Yorkshire |
| Rother Valley Lake | Rother Washlands | South Yorkshire |
| Skipton Waller Hill Reservoir | Waller Hill Beck | North Yorkshire |

## 6. No history and no typical range

422 gauges have neither archive history nor an EA typical range. Most are the EA's operational sites, not on GOV.UK's Check for flooding. **For John:** list them with their level only, or leave them out of the nearest five unless there's nothing else? By county:

Lincolnshire 76, Northamptonshire 26, Suffolk 25, Essex 23, Cambridgeshire 21, Kent 20, Devon 20, East Sussex 18, Hampshire 17, Cornwall 16, Greater London 15, Norfolk 15, Surrey 10, West Sussex 9, Dorset 9, Isle of Wight 7, Leicestershire 7, Somerset 7, Greater Manchester 7, Cheshire 6, Buckinghamshire 6, (outside England) 6, Staffordshire 5, Derbyshire 5, Berkshire 4, North Yorkshire 4, East Riding of Yorkshire 4, Gloucestershire 3, Warwickshire 3, Lancashire 3, Rutland 3, West Yorkshire 3, Northumberland 2, Wiltshire 2, Shropshire 2, Merseyside 2, Cumbria 2, South Yorkshire 2, Oxfordshire 1, Worcestershire 1, West Midlands ceremonial county 1, Hertfordshire 1, Bedfordshire 1, Bristol 1, Durham 1.

## 7. Outside England

| Gauge | River | Latitude, longitude |
| --- | --- | --- |
| Sprouston | River Tweed | 55.611, -2.395 |
| Abermule River Station | River Severn | 52.553, -3.232 |
| Llanymynech River Station | River Vyrnwy | 52.769, -3.107 |
| Meifod River Station | River Vyrnwy | 52.707, -3.249 |
| Bryntail River Station | Afon Clywedog | 52.468, -3.600 |
| Llandrinio River Station | River Severn | 52.745, -3.040 |
| Munlyn River Station | River Severn | 52.601, -3.166 |
| Knighton | River Teme | 52.345, -3.044 |
| Canonbie | River Esk | 55.067, -2.946 |

## 8. Backups and near-duplicates left out

| Left out | Kept instead | Metres apart |
| --- | --- | --- |
| Thames at Kingston (Backup) | (a backup) |  |
| TEMPSFORD ROXTON GS BACKUP | (a backup) |  |
| Restormel | Restormel | 19 |
| Port Isaac | Port Isaac | 0 |
| Stonebridge | Stonebridge | 67 |
| Upavon West | Upavon East | 0 |
| Drove Lane 1.5 | Drove Lane | 85 |
| Woodhall Avenue | Waxwell Lane | 84 |
| Upton Tributary | Upton | 66 |
| Titchfield Canal | Titchfield | 43 |
| Cassington Weir B | Cassington Weir A | 0 |
| Porters Lock Telemetry | Oak Weir Telemetry | 0 |
| Wandle Park Side Channel | Wandle Park Main Channel | 0 |
| Woodhouse Mill Regulator | Woodhouse Mill | 74 |
| Zoons Court Flood Storage | Zoons Court | 43 |
| Swallowfield Side Channel | Swallowfield | 0 |
| Graveney at Robinson Road | Longley Road | 65 |
| Sheepbridge Weir Mill Stream | Sheepbridge | 0 |
| Hexham Tanners Row Downstream | Hexham Tanners Row upstream | 20 |
| Bucklebury | Bucklebury | 60 |
| Kempsey PS | Kempsey PS | 0 |
| Kempsey PS | Kempsey PS | 0 |
| Saltmoor Ps | Saltmoor Drain | 0 |
| Sluice Weir | Oak Weir Telemetry | 0 |
| Brede Sluice | Brede | 0 |
| Stockmoor Ps | Stockmoor | 0 |
| West Deeping | Tallington | 31 |
| Orton Sluice | Orton Sluice | 29 |
| Littlebourne | Littlebourne | 35 |
| Upwey Culvert | Upwey | 27 |
| Huntsmoor Weir | Huntsmoor Weir | 51 |
| Littleton Road | Littleton Road River | 59 |
| Fullerton Main | Fullerton Main | 52 |
| Sherman Bridge | Sherman Bridge | 0 |
| Crowhurst Weir | Crowhurst Weir | 0 |
| Lady Waths Beck | Lady Waths Beck | 0 |
| Brampton Sluice | Brampton Sluice | 35 |
| Hartlake Bridge | Hartlake | 94 |
| Ardingly Shellbrook | Ardingly Shellbrook | 0 |
| Chew Magna Reservoir | Chew Magna Level | 0 |
| Northampton Washlands | Northampton Washlands | 0 |
| Northampton Washlands | Northampton Washlands | 0 |
| Baits Bite Lock Sluice | Cambridge Baits Bite | 71 |
| Lower Ringstead Sluice | Lower Ringstead Sluice | 0 |
| Milton Lock Downstream | Milton Lock | 0 |
| Dog in A Doublet Sluice | Dog in A Doublet Sluice | 0 |
| River Cherwell at Enslow | Enslow Weir A | 7 |
| Swanage Prospect Farm Fas | Swanage Prospect Farm Fas | 0 |
| Halstead Flood Alleviation | Halstead Flood Alleviation | 0 |
| Halstead Flood Alleviation | Halstead Flood Alleviation | 0 |
| Halstead Flood Alleviation | Halstead Flood Alleviation | 0 |
| Leeds Killingbeck Inscreen | Leeds Killingbeck Dam | 0 |
| Okehampton Meldon Reservoir | Meldon | 47 |
| Bodiam Avenue Relief Channel | Bodiam Avenue | 0 |
| Fitzwilliam Sluice Greatford | Greatford Sluice | 0 |
| Sand Syke Ps Witham Washlands | Sand Syke Ps Witham Washlands | 0 |
| Swanage King Georges Field Fas | Swanage King Georges Field Fas | 0 |
| Birmingham Witton Atlas Bridge | Brookvale Road | 4 |
| Bedford Road Sluice Northampton | Bedford | 0 |
| Buckfastleigh Higher Town Bridge | Buckfastleigh Higher Town Bridge | 0 |
| River Lee at Feildes Weir (Gauged) | Feildes Weir | 51 |
| Bibury Springs at Bibury (Swan Hotel) | Bibury Springs at Bibury (Trout Farm) | 14 |
| Leeds FAS Calverley FSR Upstream Level | Leeds Calverley Bridge | 0 |
| Witham Control Sluice Washlands Waddington | Witham Washland Sluice - Washland | 0 |
| Witham Control Sluice Washlands Waddington | Witham Washland Sluice - Washland | 0 |
| Thorney Mill Road, West Drayton (Temporary) | West Drayton | 85 |

## 9. Not reporting

| Gauge | Why |
| --- | --- |
| Farndon LVL | no position in the EA list |
| Druid LVL | no position in the EA list |
| Manley Hall LVL | no position in the EA list |
| Corwen LVL | no position in the EA list |
| Bala GS LVL | no position in the EA list |
| Chester Sus Bridge | no position in the EA list |
| Chester Weir  LVL | no position in the EA list |
| FENCE BRIDGE GATE RL | no position in the EA list |
| EASTERN ROAD RL | no position in the EA list |
| Blackwall USGS | no position in the EA list |
| CHURCH FARM PIT RL | no position in the EA list |
| GREATHAM BRIDGE RL | no position in the EA list |
| FERRY PS | no position in the EA list |
| HACKLINGE PS | no position in the EA list |
| HONEYCROCK PS | no position in the EA list |
| MALLING PS | no position in the EA list |
| NEWBRIDGE PS | no position in the EA list |
| PEVENSEY BRIDGE RL | no position in the EA list |
| STEDHAM MILL GATE RL | no position in the EA list |
| STAR PS | no position in the EA list |
| STAR PS | no position in the EA list |
| TUMBLERS BAY GATE RL | no position in the EA list |
| Toddbrook Reservoir | no position in the EA list |
| Ilfracombe Lambda | no position in the EA list |
| Iron Bridge | no position in the EA list |
| HACKLINGE PS | no position in the EA list |
| ASH LEVEL PS | no position in the EA list |
| Cooper Street PS | no position in the EA list |
| BLACK SLUICE PS | no position in the EA list |
| MINSTER PS | no position in the EA list |
| RECULVER PS | no position in the EA list |
| SARRE PS | no position in the EA list |
| SARRE PS | no position in the EA list |
| POLDERS PS | no position in the EA list |
| Chester Sus Bridge | no position in the EA list |
| Chick Hill | no position in the EA list |
| CANWORTHY WATER BRIDGE | no reading at all |
| Ravenstone Mill Sluice | no reading at all |
| Witham Friary | no reading at all |
| Saintbridge | no reading at all |
| Kilham's Bridge | no reading at all |
| Knighton Main | no reading at all |
| Gargrave | no reading at all |
| Chertsey Bourne | no reading at all |
| Victoria Bridge | no reading at all |
| Lostock Gralam | no reading at all |
| Fleet Weir | no reading at all |
| Limekilns | no reading at all |
| Preston-Le-Skerne | no reading at all |
| Low Street | no reading at all |
| Bourton Grounds | no reading at all |
| Frisby on the Wreake | no reading at all |
| Watton at Stone | no reading at all |
| East Budleigh Hayes Lane | no reading at all |
| Hemel Hempstead, Bury Mill | no reading at all |
| Norton Bavant | no reading at all |
| Bradbury | no reading at all |
| Keynsham, Somerdale | no reading at all |
| Sands Centre, Carlisle | no reading at all |
| Eynsford Close | no reading at all |
| Leighton Buzzard | no reading at all |
| Manaccan | no reading at all |
| Redlands Lane | no reading at all |
| Barcombe | no reading at all |
| RIVER KENNET AT THEALE | no reading at all |
| Horrabridge | no reading at all |
| Knaresborough | no reading at all |
| Boscastle New Mills | no reading at all |
| Morwick | no reading at all |
| Selby Lock | no reading at all |
| Ensbury | no reading at all |
| East Mills Weir | no reading at all |
| Melbourne Park Carlisle | no reading at all |
| Newbridge Weir A | no reading at all |
| Brede Sluice Gate | no reading at all |
| RATTLESDEN GS | no reading at all |
| Staines Moor | no reading at all |
| CARDINGTON SLUICE WITS | no reading at all |
| Arnos Park | no reading at all |
| Hedon Westlands Drain | no reading at all |
| Wycombe Wye | no reading at all |
| Kings Ripton | no reading at all |
| Boscastle Anderton Ford | no reading at all |
| Penzance Tesco | no reading at all |
| Idless Dam | no reading at all |
| WITHAM CONTROL SLUICE WASHLANDS WADDINGTON | no reading at all |
| GIPPING RESERVOIR SLUICE | no reading at all |
| MAUD FOSTER SLUICE BOSTON AUTOMATION | no reading at all |
| Sindlesham Mill FD | no reading at all |
| RIVER THAMES AT DAY'S WEIR (GAUGED) | no reading at all |
| RAVENSTONE MILL SLUICE AUTOMATION | no reading at all |
| Skenfrith LVL | no reading at all |
| CHARD JUNCTION | no reading at all |
| Crawters Brook at Hazelwick Flyover | no reading at all |
| Pyl Brook at West Barnes (Kings College) | no reading at all |
| UCKFIELD MILL RL | no reading at all |
| Walton PS | no reading at all |
| LADDEN BROOK | no reading at all |
| Mauldeth Road | no reading at all |
| Brent Reservoir | no reading at all |
| Eversley Mill | no reading at all |
| WITHAM CONTROL SLUICE WASHLANDS WADDINGTON | no reading at all |
| LEIGH PS | no reading at all |
| Hoe Stream at Woking | no reading at all |
| Tiverton Lowman | no reading at all |
| Heysham Harbour | no reading at all |
| Platt Fields | no reading at all |
| Westfields Sluice FD | no reading at all |
| Clifton Street | no reading at all |
| Kingsbury LVL | no reading at all |
| CROWHURST BRIDGE RL | no reading at all |
| Avonmouth Lighthouse TL | no reading at all |
| RIVER LODDON AT SHEEPBRIDGE FLUME | no reading at all |
| Rivington Road | no reading at all |
| Walkmill LVL | no reading at all |
| Westbrook Mill FD | no reading at all |
| Ironbower | no reading at all |
| MERRIONS RL | no reading at all |
| River Wey at Elstead Mill | no reading at all |
| Warm Brook | no reading at all |
| Feildes Weir Ultrasonic | no reading at all |
| SOUTHEASE TL | no reading at all |
| RODMELL PS | no reading at all |
| Sandwell LVL | no reading at all |
| Aberdeen | no reading at all |
| Blacktoft TL | no reading at all |
| Workington Dock | no reading at all |
| PALLINGHAM GS | no reading at all |
| Feildes Weir Ultrasonic | no reading at all |
| PADHOLME PS | no reading at all |
| DUDDINGTON SLUICE AUTOMATION DUAL COMMS | no reading at all |
| HOES BRIDGE RL | no reading at all |
| Beam Tidal Sluice FD | no reading at all |
| BLAGDON | no reading at all |
| ISFIELD GATE RL | no reading at all |
| Beaulieu Sluice Gates | no reading at all |
| SOUTH BRIDGE GS NORTHAMPTON | no reading at all |
| BRIDPORT NORTH MILLS | no reading at all |
| Wootton Fitzpaine | no reading at all |
| Loverley Farm | no reading at all |
| HEYBRIDGE LOCK TS | no reading at all |
| Sheffield Sheaf Screen | no reading at all |
| WEEDON GS | no reading at all |
| NEWPORT PAGNELL GS | no reading at all |
| PORLOCK RL | no reading at all |
| HITCHIN GS | no reading at all |
| YARDLEY HASTINGS EAST FSR GSM | no reading at all |
| Watermeads FWS | no reading at all |
| TILL WASHLAND CONTROL SAXILBY | no reading at all |
| WYMONDHAM NORTH GS | no reading at all |
| HALESWORTH GS | no reading at all |
| SAND SYKE PS WITHAM WASHLANDS | no reading at all |
| SAND SYKE PS WITHAM WASHLANDS | no reading at all |
| PLAYFORD GS | no reading at all |
| GRESSENHALL SLUICE WITS | no reading at all |
| EYE BROOK GS CALDECOTT | no reading at all |
| HELSTON BOATING LAKE | no reading at all |
| BRANT CONTROL SLUICE AUBOURN | no reading at all |
| Wansford Snakeholm Lock | no reading at all |
| HORTON GS | no reading at all |
| River Wandle at Goat Bridge  | no reading at all |
| ElementNotMappedToAnOutstation | no reading at all |
| COLNE TIDE BARRIER WIVENHOE | no reading at all |
| FREEBRIDGE TS KINGS LYNN | no reading at all |
| Bransford LVL | no reading at all |
| HEMPSTEAD MILL GATE RL | no reading at all |
| Woolley Bridge | no reading at all |
| Cape Street | no reading at all |
| RAYLEIGH LS | no reading at all |
| Norlands Lane | no reading at all |
| Newbridge Cut | no reading at all |
| HALESWORTH GS | no reading at all |
| Littleton PS | no reading at all |
| Marsh Road Sluice | no reading at all |
| Harrison Street | no reading at all |
| Islip Backup | no reading at all |
| Barnham | no reading at all |
| Brewhurst Mill | no reading at all |
| Sandhurst Horn's Ditch | no reading at all |
| Pent Firestation RL | no reading at all |
| DUDDINGTON SLUICE AUTOMATION DUAL COMMS | no reading at all |
| BLAKES LOCK G.STN | no reading at all |
| SALISBURY HARNHAM BRIDGE | no reading at all |
| Packington LVL | no reading at all |
| Glenridding | no reading at all |
| Corsham | no reading at all |
| Hessle Western Drain | no reading at all |
| LINGFIELD RACECOURSE RL | no reading at all |
| EAST MEON RL | no reading at all |
| Leeds Holbeck Flood Alleviation Scheme | no reading at all |
| Buildwas FLOW | no reading at all |
| Ducklington East FWS | no reading at all |
| Atherfield | no reading at all |
| Tenbury LVL | no reading at all |
| Horton Mill FWS | no reading at all |
| Chilbolton Main | no reading at all |
| Langley Platt | no reading at all |
| RIVER LODDON AT SHEEPBRIDGE | no reading at all |
| COUNTY BRIDGE EUSTON GS WITS DO NOT POLL | no reading at all |
| THORPE LE SOKEN GS | no reading at all |
| Farlows Bridge FWS | no reading at all |
| Skipton Eller Beck Reservoir | no reading at all |
| Sheffield Carr Brook Screen | no reading at all |
| BROOMHILL GS | no reading at all |
| Romsey Broadlands Estate | no reading at all |
| Dunswell Ennerdale Bridge | no reading at all |
| How Bank | no reading at all |
| CALSTONE | no reading at all |
| BLACK SLUICE PS BOSTON | no reading at all |
| STOCKWITH MILL GS HAGWORTHINGHAM WITS | no reading at all |
| WAINFLEET CLOUGH OUTFALL SLUICE | no reading at all |
| Beam Bridge | no reading at all |
| Jennets Lane PS | no reading at all |
| WANFORD GATE RL | no reading at all |
| River Wey (North) at Waverley Mill | no reading at all |
| BEAMINSTER THE ORCHARD RL | no reading at all |
| DOLCOATH ADIT PORTAL | no reading at all |
| VENN OTTERY LYNCH HEAD | no reading at all |
| Stocksbridge Steelworks | no reading at all |
| Sarmatian Bridge | no reading at all |
| Bolton by Bowland Hellifield Road | no reading at all |
| Cheadle Daylesford Road | no reading at all |
| Leicester Braunstone Avenue | no reading at all |
| Campbell Road RL | no reading at all |
| Oxford Castle Mill RL | no reading at all |
| The Wharf Bridge RL | no reading at all |
| Eastbury Road RL | no reading at all |
| HARTLAKE RL | no reading at all |
| Bramhall Green Bridge Lane | no reading at all |
| RUSHDEN WELLINGBOROUGH ROAD CULVERT WITS | no reading at all |
| DUNSTER SEA LANE | no reading at all |
| Ferguson Avenue RL | no reading at all |
| HONITON RIGGLES | no reading at all |
| Durley Mill Eel Pass RL | no reading at all |
| Rivermead Close Sluices Level | no reading at all |
| Bucklebury TEMP RL | no reading at all |
| BRISTOL WADE STREET | no reading at all |
| Retford Grove Lane  | no reading at all |
| Perryfoot Farm Little Bullpit Swallet | no reading at all |
| Hareshaw Burn | no reading at all |
| QUORN, MEMORIAL GARDENS | no reading at all |
| Hamm Oil Mills Temp Site - B | no reading at all |
| WIMBLEBALL | no reading at all |
| BOUNSTEAD BRIDGE FGS COLCHESTER | no reading since 2026-10-02 |
| Kings Lynn Freebridge | no reading since 2026-10-06 |
| Passenham | no reading since 2026-10-09 |
| Kings Mill | no reading since 2026-10-13 |
| Izaak Walton | no reading since 2026-10-15 |
| Cullompton Langlands | no reading since 2026-10-23 |
| Market Weighton | no reading since 2026-10-23 |

## 10. Archive matches

An archive station counts as the same gauge when it's within 1 km, or further away but with the same name. **Refused** (different names, more than 1 km apart), so these gauges have no history:

| Live gauge | Archive station | Km apart |
| --- | --- | --- |
| Bargate Weir | Queenborough Barrier | 218.7 |
| Keynsham, Rivermead | Tellisford | 19.1 |
| SCOTS FLOAT SLUICE RL | Scots Float | 2.3 |
| BARNWELL FSR WITS | Lower Barnwell upstream | 3.6 |
| Rainfall station | Wannock Mill | 291.0 |
| UPHILL RHYNE TERRACE TILTING WEIR | Sampford Brett Screen | 29.4 |

**Same name, different places.** The position used is the one on the gauge's own river in OS Open Rivers; "not sure" means neither or both are, so the live position is used:

| Gauge | River | Km apart | Position used |  |
| --- | --- | --- | --- | --- |
| Canal Road | Timperley Brook | 80.4 | archive |  |
| Warwick Old Budbrooke Road | Gog Brook | 30.5 | archive |  |
| Northmoor Drain | Northmoor Main Drain | 17.9 | live |  |
| Glenfield Gate Upstream Level | Royal Military Canal | 7.2 | live | not sure |
| Eccleston Heskin Bridge | Syd Brook | 3.2 | live |  |
| Durranhill Pumping Station | Durranhill Beck | 2.8 | live |  |
| Fordham | River Snail | 2.7 | archive |  |
| OAK WEIR RL | River Medway | 2.3 | live | not sure |
| SCOTS FLOAT SLUICE RL | River Rother | 2.3 | live | not sure |
| Penvose | River Allen | 2.0 | live | not sure |
| Didsbury | River Mersey | 1.6 | live | not sure |
| Crow Tree Farm Brook | Unnamed Watercourse | 1.0 | live | not sure |

## 11. What each gauge has

| What it has | Gauges |
| --- | --- |
| Neither: the level only | 422 |
| History for the time of year | 1966 |
| No archive history: the EA's typical range | 358 |
| Archive history too short (less than three years): the EA's typical range instead | 101 |
| Archive history too short, and no typical range: the level only | 41 |

**Old history.** 32 gauges' archive levels stop more than two years ago, so their "time of year" rests on those years only (Twyford on the Loddon stops in 2011). For John: use them, or treat them as having no history?

| Gauge | River | Record | Last day |
| --- | --- | --- | --- |
| Coalburn Beck | Coal Burn | 1992 | 2003-07-07 |
| Wilfholme PS | River Hull | 1996 | 2003-08-10 |
| Alma Weir | River Skell | 1985 | 2010-08-11 |
| Lilford Park, Leigh | Atherton Lake Brook | 2004 | 2015-04-20 |
| Crudgington | River Strine | 1987 | 2020-06-30 |
| Gwithian | River Red | 2013 | 2020-11-11 |
| Barcombe | River Ouse | 2008 | 2021-11-30 |
| Addlestone | Addlestone Bourne | 1991 | 2021-12-01 |
| Bramley | Cranleigh Waters | 1991 | 2021-12-01 |
| Harlow Mill | River Stort | 2001 | 2021-12-01 |
| Stokesley Downstream | River Leven | 2000 | 2021-12-01 |
| Milton Lock | Cuckmere River | 2000 | 2022-02-15 |
| Didsbury Basin Stenner Lane | River Mersey | 2013 | 2022-02-20 |
| Sampford Brett | Doniford Stream | 2005 | 2022-04-21 |
| Stogumber Escott Lane | Doniford Stream | 2019 | 2022-04-22 |
| Broadeye Bridge | River Sow | 2001 | 2022-07-03 |
| Wookey | River Axe | 1995 | 2022-12-02 |
| Arthington | River Wharfe | 1991 | 2022-12-04 |
| Bleach Green Weir | River Ehen | 1977 | 2022-12-06 |
| Bessy Brook | Bessy Brook | 2011 | 2023-03-17 |
| Knapp Mill | River Avon | 1995 | 2023-05-30 |
| Stocks Reservoir Level | River Hodder | 1976 | 2023-06-20 |
| Bow Bridge Abbey Road | Poaka Beck | 2011 | 2023-07-08 |
| Burlington | River Worfe | 1999 | 2023-07-30 |
| Twyford | River Loddon | 2011 | 2023-08-22 |
| Caker Stream | Caker Stream | 1992 | 2023-10-11 |
| Robertsbridge | River Rother | 2000 | 2023-10-17 |
| Mitford | River Wansbeck | 1979 | 2023-10-20 |
| Smithills Croft Road | Dean Brook | 2012 | 2023-11-07 |
| Ellamsbridge Road, St Helens | Sutton Mill Brook | 2014 | 2023-11-11 |
| North Hull National Avenue | Setting Dyke | 2006 | 2023-11-17 |
| Broadmead Gates | Broadmead Cut | 2007 | 2023-12-11 |

## 12. Archive notes

The archive carries a note on 10 of these gauges:

- "Data is suspended for this station whilst we investigate the data quality." (2)
- "This station monitors the operation of the Jubilee Flood Relief Channel." (2)
- "This gauge is affected by abstraction and/or flow augmentation which may cause rapid fluctuations in level and flow." (1)
- "Data quality at this gauge is impacted by weed growth." (1)
- "River flow is only recorded at this station when the water level is above 0.2m and therefore daily flow data is not provided" (1)
- "Data is suspended for this station whilst we undertake maintenance." (1)
- "High flows should be treated with caution." (1)
- "Flow data temporarily 'switched off' due to inaccuracies caused by slumped bank immediately downstream of weir." (1)
