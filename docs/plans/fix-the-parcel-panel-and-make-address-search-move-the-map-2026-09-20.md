# Fix the parcel panel and make address search move the map

Two issues, both on the map page.

## 1. The parcel panel gets cut off and can't be used

At your current window width (~986px) the layout switches to the stacked
arrangement: map on top, parcel detail panel below. The page is locked to
exactly one screen tall and clips anything past the bottom edge, so the panel
stops at "Zoning code" and can't be scrolled or clicked.

Change: below the side-by-side width, the map takes a fixed height and the
page scrolls normally, so the whole panel is reachable. Nothing gets clipped.

## 2. Entering an address doesn't move or highlight the map

Right now picking an address only updates the panel — the map stays where it
is and nothing is marked, so it feels like the search did nothing.

Change: when an address is selected (from the assistant, or from a saved
parcel), the map pans and zooms to that parcel and draws a highlighted outline
with a small label, so you can see exactly where it is. Selecting a different
address moves the highlight. A "back to full view" reset stays available.

## Technical notes

`src/routes/map.tsx`

- Outer wrapper: keep `h-screen overflow-hidden` only from the side-by-side
  breakpoint up (`md:h-screen md:overflow-hidden`), use `min-h-screen` below so
  the page scrolls; map container gets a fixed `h-[60vh]` when stacked and
  `md:h-auto md:flex-1` above.
- Pass the selected parcel down to `BaseMap` as a new `focus` prop.

`src/components/basemap.tsx`

- New optional prop `focus?: { id: string; points: [number, number][]; label: string }`
  in the existing 1200x800 drawing space.
- Convert drawing coordinates to lat/lng against the existing `BOUNDS`
  (linear interpolation, same mapping the `L.svgOverlay` uses), build an
  `L.polygon` styled with the accent token via `resolveColor`, add a tooltip
  with the address, and `map.flyToBounds(polygon.getBounds().pad(1.5), { maxZoom: 17 })`.
- Remove and rebuild the highlight when `focus` changes or is cleared; clear it
  on map teardown alongside `geoRef`.

No funding logic, data, or content changes.
