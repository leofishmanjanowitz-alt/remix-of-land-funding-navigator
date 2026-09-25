import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

const HERO_PHOTOS = [
  "/images/hero/hero-1.jpg",
  "/images/hero/hero-2.jpg",
  "/images/hero/hero-3.jpg",
  "/images/hero/hero-4.jpg",
];

/** Full-bleed crossfading photo backdrop with a dark scrim for legible white text. */
function PhotoBackdrop() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((i) => (i + 1) % HERO_PHOTOS.length), 5000);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <>
      <div className="absolute inset-0 z-0 bg-[oklch(0.278_0.022_221)]" aria-hidden="true">
        {HERO_PHOTOS.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "low"}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      <div
        className="absolute inset-0 z-[1] bg-[linear-gradient(90deg,oklch(0.2_0.02_221/0.78)_0%,oklch(0.2_0.02_221/0.5)_50%,oklch(0.2_0.02_221/0.28)_100%),linear-gradient(180deg,oklch(0.2_0.02_221/0.18),oklch(0.2_0.02_221/0.5))]"
        aria-hidden="true"
      />
      <div className="absolute bottom-6 left-1/2 z-[2] flex -translate-x-1/2 gap-2.5">
        {HERO_PHOTOS.map((src, i) => (
          <button
            key={src}
            type="button"
            aria-label={`Show image ${i + 1}`}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={`h-[9px] w-[9px] cursor-pointer rounded-full transition-[background-color,transform] duration-300 ${
              i === active ? "scale-115 bg-accent" : "bg-white/45 hover:bg-white/70"
            }`}
          />
        ))}
      </div>
    </>
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
    <section className="relative flex min-h-[calc(92vh-68px)] items-center overflow-hidden text-white">
      <PhotoBackdrop />
      <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 py-24 md:py-32">
        <p className="text-[13px] font-medium tracking-[0.22em] text-white/75 uppercase">
          Parcel-level funding research
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl leading-[1.08] tracking-[-0.5px] text-white [text-shadow:0_2px_28px_rgb(0_0_0/0.3)] md:text-[58px]">
          Find out what public funding a parcel qualifies for{" "}
          <span className="text-primary">before you buy it.</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
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
            className="h-12 w-full rounded-lg border sm:w-auto sm:flex-1 border-white/20 bg-white px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-[3px] focus:ring-ring/25"
          />
          <button
            type="submit"
            className="h-12 cursor-pointer rounded-lg bg-primary px-[26px] text-base font-medium text-primary-foreground transition-colors hover:bg-primary-hover active:translate-y-px"
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
    <section className="band-soft border-b border-border">
      <div className="mx-auto max-w-2xl px-6 py-28">
        <div className="glass rounded-[20px] p-10 shadow-panel">
          <p className="rule-label">Step 2 of 2</p>
          <h1 className="mt-5 font-heading font-bold text-3xl text-foreground">Check your email</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            We sent a confirmation link to{" "}
            <span className="font-medium text-foreground">{email || "your inbox"}</span>. Open it to
            unlock the parcel map. The link expires in 24 hours.
          </p>
          <button
            onClick={onBack}
            className="mt-6 text-sm text-primary-deep underline underline-offset-4"
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
              className="mt-4 border border-accent px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent hover:text-accent-foreground rounded-md"
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
    <section className="band-soft">
      <div className="mx-auto max-w-6xl px-6 py-[88px]">
        <p className="rule-label">How it works</p>
        <div className="mt-12 grid gap-[22px] md:grid-cols-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="glass rounded-2xl p-8 transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-card"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 font-heading text-sm font-bold text-accent">
                {s.n}
              </span>
              <h2 className="mt-5 text-2xl text-foreground">{s.title}</h2>
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
    <section className="bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-[88px]">
        <p className="rule-label">Who this is for</p>
        <h2 className="mt-5 max-w-2xl text-3xl tracking-[-0.3px] text-foreground md:text-[34px]">
          Built for the people who actually assemble affordable housing capital stacks.
        </h2>
        <div className="mt-12 grid gap-[22px] md:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.title} className="rounded-2xl border border-border bg-paper p-[26px]">
              <h3 className="text-lg text-foreground">{a.title}</h3>
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
    <section className="band-soft border-b border-border">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-[88px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
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
