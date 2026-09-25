import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="flex items-baseline gap-3">
          <span className="font-serif text-lg tracking-tight text-primary">Collective Impact</span>
          <span className="rule-label hidden sm:inline">Parcel funding records</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link to="/map" className="text-muted-foreground transition-colors hover:text-primary">
            Parcel map
          </Link>
          <Link to="/dashboard" className="text-muted-foreground transition-colors hover:text-primary">
            Dashboard
          </Link>
          <Link to="/kpi" className="text-muted-foreground transition-colors hover:text-primary">
            Demand review
          </Link>
          <a
            href="mailto:demo@collectiveimpact.org?subject=Demo%20call%20request"
            className="text-muted-foreground transition-colors hover:text-primary"
          >
            Request a demo
          </a>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-paper-deep">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg text-primary">Collective Impact</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Public funding eligibility for affordable housing, answered at an address.
          </p>
        </div>
        <div>
          <p className="rule-label">Contact</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a
                className="text-foreground underline underline-offset-4 hover:text-primary"
                href="mailto:hello@collectiveimpact.org"
              >
                hello@collectiveimpact.org
              </a>
            </li>
            <li className="text-muted-foreground">(404) 555-0148</li>
            <li className="text-muted-foreground">Mon–Fri, 9am–5pm ET</li>
          </ul>
        </div>
        <div>
          <p className="rule-label">Talk to us</p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Walk through a parcel in your jurisdiction with our team.
          </p>
          <a
            href="mailto:demo@collectiveimpact.org?subject=Demo%20call%20request"
            className="mt-4 inline-flex border border-primary px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Request a demo call
          </a>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Collective Impact</span>
          <span className="rule-label">Prototype — mock data, no live records</span>
        </div>
      </div>
    </footer>
  );
}
