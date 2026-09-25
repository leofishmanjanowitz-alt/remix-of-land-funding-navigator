# Remix of Land Funding Navigator

Build a web app called Collective Impact. It helps mission-driven housing developers, Community Development Corporations, and local government housing departments find out what public funding they can use to build affordable housing on a specific piece of land.

The user problem: figuring out which federal, state, and local funding programs apply to a given parcel currently requires reading hundreds of pages of regulations across dozens of agency websites. We make it answerable at an address.

Visual direction. Municipal and civic, not consumer tech. Think plat maps, survey documents, and land records rather than a SaaS dashboard. Palette: dark survey green as primary, warm off-white paper tones as background, muted terracotta as a single accent. Typography should be serious and readable — a clean serif for headings, a workhorse sans for body. Generous whitespace. Avoid gradients, glassmorphism, rounded pill buttons, and emoji. The user is a housing director reviewing this during a workday, not a consumer browsing on a phone.

Landing page sections:

Hero — headline stating that you can find out what funding a parcel qualifies for, subhead explaining it covers federal, state, and local programs, and a single email input with a "Get map access" button

Three-column explanation of the flow: enter an address, see eligible funding and zoning, get a report with next steps

A section naming the audiences served: mission-driven developers, CDCs and nonprofits, local government housing departments

A short section on why this exists, written in plain language

Footer with contact and a link to request a demo call

Email verification flow. After email submission, show a "check your email" confirmation screen. Since this is a prototype, add a visible "Simulate email confirmation" button on that screen that advances to the map. Label it clearly as a prototype shortcut.

Use mock data throughout. No backend, no real authentication.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d3ff9663-60e7-44b2-a25e-b14802d633be).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
