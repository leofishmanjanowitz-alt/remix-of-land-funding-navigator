# Roadmap

- [x] Real OpenStreetMap basemap on /map via Leaflet, with FEMA National Flood Hazard Layer as a live toggle
- [x] Remove the fake mock parcel squares from the real basemap (parcels are now found via the search bar)
- [x] Answer: which source supports toggleable FEMA floodplain layers (done in chat — any of them, via FEMA's free public tile service)
- [x] Wire layer toggles (FEMA floodplain, TIF, QCT, OZ, etc.) onto the chosen basemap
- [x] Keep map layers below search feedback and add a clearly visible AI assistant button
- [x] Move parcel address lookup into the AI assistant and remove the map search bar
- [x] Real published Tulsa layers: city floodplains and zoning — live ArcGIS with saved-copy fallback (display only; TIF now comes from county parcel records in the database)
- [x] PostGIS database for parcels and overlays (TIF, QCT, DDA, Opportunity Zones, USDA rural, city limits, council districts), with pull dates and vintages
- [x] Parcel search and click-to-select on the map, parcel readout from the database, pick list for several matches
- [x] Every overlay toggles on the map, with a legend; chat lookup uses the same search
- [ ] Zoning and floodplain as database overlays, so they can feed parcel results
- [ ] Sources for NMTC, housing trust fund area, design overlays and census indicators
- [ ] Reports for real parcels (need zoning)
