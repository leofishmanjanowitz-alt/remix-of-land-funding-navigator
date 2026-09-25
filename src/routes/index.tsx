import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Collective Impact — Find funding for an affordable housing parcel" },
      {
        name: "description",
        content:
          "Enter an address and see which federal, state, and local programs can fund affordable housing on that parcel, with zoning limits and next steps.",
      },
      { property: "og:title", content: "Collective Impact — Parcel funding eligibility" },
      {
        property: "og:description",
        content:
          "Federal, state, and local affordable housing funding eligibility, answered at an address.",
      },
    ],
  }),
  component: Index,
});

type Stage = "form" | "sent";

function Index() {
  const [stage, setStage] = useState<Stage>("form");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {stage === "form" ? (
          <Hero email={email} setEmail={setEmail} onSubmit={() => setStage("sent")} />
        ) : (
          <CheckEmail
            email={email}
            onBack={() => setStage("form")}
            onConfirm={() => navigate({ to: "/map" })}
          />
        )}
        <HowItWorks />
        <Audiences />
        <WhyThisExists />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero({
  email,
  setEmail,
  onSubmit,
}: {
  email: string;
  setEmail: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <section className="survey-grid border-b border-border bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="rule-label">Parcel-level funding research</p>
        <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.12] text-primary md:text-6xl">
          Find out what public funding a parcel qualifies for before you buy it.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          Collective Impact reads federal, state, and local housing programs against a single piece
          of land — tax credits, block grants, trust funds, tax increment districts — and tells you
          which ones apply and what they require.
        </p>

        <form
          className="mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) onSubmit();
          }}
        >
          <label className="sr-only" htmlFor="hero-email">
            Work email
          </label>
          <input
            id="hero-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@housingauthority.gov"
            className="h-12 flex-1 border border-input bg-background px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-ring"
          />
          <button
            type="submit"
            className="h-12 border border-primary bg-primary px-6 text-sm font-medium tracking-wide text-primary-foreground transition-colors hover:bg-primary-deep"
          >
            Get map access
          </button>
        </form>
      </div>
    </section>
  );
}

function CheckEmail({
  email,
  onBack,
  onConfirm,
}: {
  email: string;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="survey-grid border-b border-border bg-paper">
      <div className="mx-auto max-w-2xl px-6 py-28">
        <div className="border border-border bg-card p-10">
          <p className="rule-label">Step 2 of 2</p>
          <h1 className="mt-5 font-serif text-3xl text-primary">Check your email</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email || "your inbox"}</span>. Open it to
            unlock the parcel map. The link expires in 24 hours.
          </p>
          <button
            onClick={onBack}
            className="mt-6 text-sm text-primary underline underline-offset-4"
          >
            Use a different email address
          </button>

          <div className="mt-10 border-t border-dashed border-accent pt-6">
            <p className="rule-label">Prototype shortcut</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No email is actually sent in this prototype. Use the button below to skip verification
              and open the map with sample parcel data.
            </p>
            <button
              onClick={onConfirm}
              className="mt-4 border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Simulate email confirmation
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Enter an address",
    body: "Type any address or parcel number. We pull the lot dimensions, current zoning, overlay districts, and federal designations attached to that record.",
  },
  {
    n: "02",
    title: "See eligible funding and zoning",
    body: "Every federal, state, and local program is tested against the parcel. You get eligible, conditional, and ruled-out programs side by side with the reason for each.",
  },
  {
    n: "03",
    title: "Get a report with next steps",
    body: "Export a memo listing the capital stack, affordability requirements, application deadlines, and the specific action needed to keep each program in play.",
  },
];

function HowItWorks() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="rule-label">How it works</p>
        <div className="mt-12 grid gap-px border border-border bg-border md:grid-cols-3">
          {STEPS.map((s) => (
            <div key={s.n} className="bg-background p-10">
              <span className="font-mono text-sm text-accent">{s.n}</span>
              <h2 className="mt-5 font-serif text-2xl text-primary">{s.title}</h2>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const AUDIENCES = [
  {
    title: "Mission-driven developers",
    body: "Underwrite a site in an afternoon instead of a month. Know the realistic subsidy ceiling before you put money at risk.",
  },
  {
    title: "CDCs and nonprofits",
    body: "Compete for competitive rounds without a full-time compliance staff. Every eligibility finding cites the rule behind it.",
  },
  {
    title: "Local government housing departments",
    body: "Answer developer questions about city-owned and tax-delinquent land consistently, and see where local dollars stretch federal ones.",
  },
];

function Audiences() {
  return (
    <section className="border-b border-border bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <p className="rule-label">Who this is for</p>
        <h2 className="mt-6 max-w-2xl font-serif text-3xl text-primary md:text-4xl">
          Built for the people who actually assemble affordable housing capital stacks.
        </h2>
        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="border-t-2 border-primary pt-6">
              <h3 className="font-serif text-xl text-foreground">{a.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhyThisExists() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div>
          <p className="rule-label">Why this exists</p>
        </div>
        <div className="max-w-2xl space-y-5 text-lg leading-relaxed text-foreground">
          <p>
            The money to build affordable housing already exists. It is spread across dozens of
            programs run by different agencies, each with its own rules about income limits, site
            location, unit counts, and deadlines.
          </p>
          <p>
            Today, finding out which of those programs a specific piece of land qualifies for means
            reading hundreds of pages of regulation and calling agency staff one at a time. Small
            organizations lose deals because that work takes weeks they do not have.
          </p>
          <p>
            We keep the rules current and apply them to the parcel for you, so the question
            &ldquo;what can we build here, and who pays for it?&rdquo; has an answer the same day
            you ask it.
          </p>
        </div>
      </div>
    </section>
  );
}
