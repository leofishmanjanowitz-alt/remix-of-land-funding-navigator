import { Link } from "@tanstack/react-router";

const DEMO_HREF = "mailto:demo@collectiveimpact.org?subject=Demo%20call%20request";

function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent"
      style={{ height: size, width: size }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-[55%] w-[55%]"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M17 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path d="M2 20c0-3 3-4 7-4s7 1 7 4" />
        <path d="M15 16c4 0 7 1 7 4" />
      </svg>
    </span>
  );
}

const NAV_LINK =
  "text-[15px] font-medium whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground [&.active]:text-foreground";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-[16px]">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-3 px-4 sm:gap-6 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <LogoMark />
          <span className="font-heading text-[17px] font-bold whitespace-nowrap text-foreground sm:text-[19px]">
            Collective Impact
          </span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <Link to="/map" className={NAV_LINK}>
            Parcel map
          </Link>
          <Link to="/dashboard" className={NAV_LINK}>
            Dashboard
          </Link>
          <Link to="/kpi" className={NAV_LINK}>
            Demand review
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link
            to="/map"
            className="hidden h-10 items-center rounded-md border border-input bg-paper px-[18px] text-[15px] font-medium text-foreground transition-colors hover:border-foreground/30 sm:inline-flex"
          >
            Open map
          </Link>
          <a
            href={DEMO_HREF}
            className="inline-flex h-10 items-center rounded-md bg-primary px-3.5 text-sm font-medium whitespace-nowrap sm:px-[18px] sm:text-[15px] text-primary-foreground transition-colors hover:bg-primary-hover active:translate-y-px"
          >
            Request a demo
          </a>
        </div>
      </div>
      <nav
        className="flex items-center gap-5 overflow-x-auto border-t border-border px-4 py-2.5 sm:px-6 md:hidden"
        aria-label="Primary mobile"
      >
        <Link to="/map" className={NAV_LINK}>
          Parcel map
        </Link>
        <Link to="/dashboard" className={NAV_LINK}>
          Dashboard
        </Link>
        <Link to="/kpi" className={NAV_LINK}>
          Demand review
        </Link>
      </nav>
    </header>
  );
}

const FOOTER_LINK = "text-sm text-muted-foreground transition-colors hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 pt-14 pb-10 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={30} />
            <span className="font-heading text-[19px] font-bold text-foreground">
              Collective Impact
            </span>
          </div>
          <p className="mt-4 max-w-[22rem] text-sm leading-relaxed text-muted-foreground">
            Public funding eligibility for affordable housing, answered at an address.
          </p>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold">Contact</h4>
          <ul className="mt-3.5 space-y-2.5">
            <li>
              <a className={FOOTER_LINK} href="mailto:hello@collectiveimpact.org">
                hello@collectiveimpact.org
              </a>
            </li>
            <li className="text-sm text-muted-foreground">(404) 555-0148</li>
            <li className="text-sm text-muted-foreground">Mon–Fri, 9am–5pm ET</li>
          </ul>
        </div>
        <div>
          <h4 className="font-sans text-sm font-semibold">Talk to us</h4>
          <p className="mt-3.5 text-sm leading-relaxed text-muted-foreground">
            Walk through a parcel in your jurisdiction with our team.
          </p>
          <a
            href={DEMO_HREF}
            className="mt-4 inline-flex h-10 items-center rounded-md border border-input bg-paper px-[18px] text-[15px] font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            Request a demo call
          </a>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col gap-2 border-t border-border py-6 text-[13px] text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Collective Impact</span>
          <span>Prototype — mock data, no live records</span>
        </div>
      </div>
    </footer>
  );
}
