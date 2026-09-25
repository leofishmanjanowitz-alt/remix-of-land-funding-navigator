# Collective Impact

Build a web app called Collective Impact. It helps mission-driven housing developers, Community Development Corporations, and local government housing departments find out what public funding they can use to build affordable housing on a specific piece of land.

The user problem: figuring out which federal, state, and local funding programs apply to a given parcel currently requires reading hundreds of pages of regulations across dozens of agency websites. We make it answerable at an address.

Visual direction. Soft civic-tech, matching the Collective Impact site: sky-teal primary, indigo accent, white and frosted-glass card surfaces on a cool off-white background. Quicksand for headings, Poppins for body. Rounded corners (8px buttons, 16px cards), hairline borders, gentle shadows. The landing hero is a full-bleed photo slideshow under a dark scrim. Design tokens live in `src/styles.css`; components should use them rather than hardcoded colors. Small text must meet WCAG AA contrast.

Landing page sections:

Hero — headline stating that you can find out what funding a parcel qualifies for, subhead explaining it covers federal, state, and local programs, and a single email input with a "Get map access" button

Three-column explanation of the flow: enter an address, see eligible funding and zoning, get a report with next steps

A section naming the audiences served: mission-driven developers, CDCs and nonprofits, local government housing departments

A short section on why this exists, written in plain language

Footer with contact and a link to request a demo call

Email verification flow. After email submission, show a "check your email" confirmation screen. Since this is a prototype, add a visible "Simulate email confirmation" button on that screen that advances to the map. Label it clearly as a prototype shortcut.

Use mock data throughout. No backend, no real authentication.

## Development

You need Node.js 22+ and npm.

```sh
npm install
npm run dev      # http://localhost:8080
```

Other scripts:

- `npm run build` — production build; the Node server bundle is written to `.output/` (run it with `node .output/server/index.mjs`)
- `npm run lint` — ESLint
- `npm run format` — Prettier

Feature plans from earlier development are in `docs/plans/`.
