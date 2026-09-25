import { Cite, CiteStack } from "@/components/citation";
import { ContactBlock, ContactDisclaimer } from "@/components/contact-block";
import { DisbursementBadge } from "@/components/disbursement";
import { BEST_FOR, actionPlanFor, type ActionPlan } from "@/lib/action-plans";
import { contactById } from "@/lib/contacts";
import { ComplexityNote, FreeAlternatives } from "@/components/complexity";
import type { Program } from "@/lib/tulsa-map-data";

export type AddTaskInput = { title: string; dueDate?: string; contact?: string };

/* ------------------------------- selector -------------------------------- */

export function ProgramSelector({
  programs,
  chosen,
  onChoose,
  resolvePlan = actionPlanFor,
  className = "",
}: {
  programs: Program[];
  chosen: string | null;
  onChoose: (id: string) => void;
  resolvePlan?: (id: string) => ActionPlan | null;
  className?: string;
}) {
  const eligible = programs.filter((p) => p.status !== "Not eligible");

  return (
    <div className={className}>
      <p className="text-sm leading-relaxed text-foreground">
        Pick one program and get its complete action plan — who runs it here, who to call, what you
        must be, and every step in order — free.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Choose the one that fits the project in front of you, not the first in the list. You keep
        the plan and the tasks it generates.
      </p>

      <ul className="mt-4 border-t border-border">
        {eligible.map((p) => {
          const hasPlan = Boolean(resolvePlan(p.id));
          const isChosen = chosen === p.id;
          return (
            <li key={p.id} className="border-b border-border py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.agency}</p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {BEST_FOR[p.id] ??
                      "Fit depends on the project; open the plan to see the terms."}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <button
                  onClick={() => onChoose(p.id)}
                  disabled={isChosen}
                  className={`border px-3 py-1.5 text-xs tracking-wide transition-colors ${
                    isChosen
                      ? "border-primary bg-primary text-primary-foreground"
                      : hasPlan
                        ? "border-accent text-accent hover:bg-secondary"
                        : "border-border text-muted-foreground hover:border-accent hover:text-accent"
                  } rounded-md`}
                >
                  {isChosen ? "Selected" : hasPlan ? "Get this plan free" : "Preview this plan"}
                </button>
                <span className="tabular-nums text-[11px] text-muted-foreground">
                  {hasPlan ? "Full plan ready" : "Plan available with a subscription"}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------- full plan ------------------------------- */

export function ActionPlanView({
  plan,
  onAddTask,
  onChangeProgram,
  className = "",
}: {
  plan: ActionPlan;
  onAddTask: (input: AddTaskInput) => void;
  onChangeProgram: () => void;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div>
          <p className="rule-label">Your free action plan</p>
          <h4 className="mt-1 font-heading font-bold text-xl leading-snug text-foreground">
            {plan.programName}
          </h4>
        </div>
        <button
          onClick={onChangeProgram}
          className="shrink-0 border border-border px-2.5 py-1 tabular-nums text-[11px] text-muted-foreground hover:border-accent hover:text-accent rounded-md"
        >
          Change program
        </button>
      </div>

      {plan.unverified && (
        <p className="mt-3 border border-dashed border-accent px-3 py-2 text-xs leading-relaxed text-accent rounded-lg">
          {plan.unverified}
        </p>
      )}

      <Block title="Who administers it here">
        <p className="text-sm font-medium text-foreground">
          {plan.administeredLocallyBy}
          <CiteStack ids={plan.administeredSourceIds} />
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {plan.administeredNote}
        </p>
      </Block>

      <Block title="Who to contact">
        <ul className="space-y-3">
          {plan.contacts.map((c) => {
            const record = c.contactId ? contactById(c.contactId) : null;
            return (
              <li key={c.body + c.person}>
                {record ? (
                  <ContactBlock contact={record}>{c.method}</ContactBlock>
                ) : (
                  <div className="border border-border bg-card px-3 py-2 rounded-lg">
                    <p className="text-sm font-medium text-foreground">{c.person}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.body} · {c.role}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground">{c.method}</p>
                  </div>
                )}
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  <span className="rule-label mr-2">Why</span>
                  {c.role}
                  <CiteStack ids={c.sourceIds} />
                </p>
                {c.note && (
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{c.note}</p>
                )}
                <button
                  onClick={() =>
                    onAddTask({
                      title: `Contact ${record?.name ?? c.person} — ${c.body}`,
                      contact: c.body,
                    })
                  }
                  className="mt-2 border border-accent px-2.5 py-1 text-xs text-accent hover:bg-secondary rounded-md"
                >
                  Add to task list
                </button>
              </li>
            );
          })}
        </ul>
        <ContactDisclaimer className="mt-3" />
      </Block>

      <Block title="What you must be">
        <ul className="space-y-3">
          {plan.mustBe.map((m) => (
            <li key={m.requirement} className="border-l-2 border-primary pl-3">
              <p className="text-sm font-medium text-foreground">
                {m.requirement}
                <CiteStack ids={m.sourceIds} />
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{m.detail}</p>
            </li>
          ))}
        </ul>
      </Block>

      <Block title="Required steps, in sequence">
        <ol className="border-t border-border">
          {plan.steps.map((s) => (
            <li key={s.order} className="border-b border-border py-4">
              <div className="flex gap-3">
                <span className="tabular-nums text-xs text-accent">
                  {String(s.order).padStart(2, "0")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {s.title}
                    <CiteStack ids={s.sourceIds} />
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
                  <p className="mt-1 tabular-nums text-[11px] text-muted-foreground">
                    {s.duration}
                  </p>
                  <button
                    onClick={() =>
                      onAddTask(
                        s.contact ? { title: s.title, contact: s.contact } : { title: s.title },
                      )
                    }
                    className="mt-2 border border-accent px-2.5 py-1 text-xs text-accent hover:bg-secondary rounded-md"
                  >
                    Add to task list
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Block>

      <Block title="Fixed dates">
        <dl className="border-t border-border">
          {plan.dates.map((d) => (
            <div key={d.label} className="border-b border-border py-3">
              <dt className="tabular-nums text-xs text-accent">{d.date}</dt>
              <dd className="mt-1">
                <p className="text-sm font-medium text-foreground">
                  {d.label}
                  <CiteStack ids={d.sourceIds} />
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.detail}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">
                  <span className="rule-label mr-2">If missed</span>
                  {d.ifMissed}
                </p>
                <button
                  onClick={() =>
                    onAddTask({
                      title: d.label,
                      dueDate: d.date,
                      contact: plan.administeredLocallyBy,
                    })
                  }
                  className="mt-2 border border-accent px-2.5 py-1 text-xs text-accent hover:bg-secondary rounded-md"
                >
                  Add reminder
                </button>
              </dd>
            </div>
          ))}
        </dl>
      </Block>

      <Block title="How the money arrives">
        <DisbursementBadge id={plan.disbursement} />
        <p className="mt-2 text-sm leading-relaxed text-foreground">{plan.disbursementPlain}</p>
      </Block>

      <Block title="What it covers">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="rule-label">
              Eligible uses
              <CiteStack ids={plan.coverageSourceIds} />
            </p>
            <ul className="mt-2 space-y-1.5">
              {plan.covers.map((c) => (
                <li key={c} className="flex gap-2 text-sm text-foreground">
                  <span className="text-primary-deep">▪</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="rule-label">Not covered</p>
            <ul className="mt-2 space-y-1.5">
              {plan.doesNotCover.map((c) => (
                <li key={c} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="text-accent">▫</span>
                  {c}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Block>

      {plan.roles && (
        <Block title={plan.roles.title}>
          <p className="text-sm leading-relaxed text-foreground">
            {plan.roles.intro}
            <CiteStack ids={plan.roles.sourceIds} />
          </p>
          <ul className="mt-3 border-t border-border">
            {plan.roles.items.map((r) => (
              <li key={r.role} className="border-b border-border py-3">
                <p className="text-sm font-medium text-foreground">{r.role}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{r.what}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  <span className="rule-label mr-2">Implication</span>
                  {r.implication}
                </p>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {plan.directory && (
        <Block title={plan.directory.title}>
          <p className="text-sm leading-relaxed text-foreground">
            {plan.directory.intro}
            <CiteStack ids={plan.directory.sourceIds} />
          </p>
          <ul className="mt-3 border-t border-border">
            {plan.directory.entries.map((d) => (
              <li key={d.name} className="border-b border-border py-3">
                <p className="text-sm font-medium text-foreground">{d.name}</p>
                <p className="mt-0.5 tabular-nums text-[11px] text-muted-foreground">
                  {d.serviceArea}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.focus}</p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{d.note}</p>
                <button
                  onClick={() =>
                    onAddTask({
                      title: `Contact ${d.name} about a CHDO partnership`,
                      contact: d.name,
                    })
                  }
                  className="mt-2 border border-accent px-2.5 py-1 text-xs text-accent hover:bg-secondary rounded-md"
                >
                  Add to task list
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-3 border border-dashed border-accent px-3 py-2 text-xs leading-relaxed text-accent rounded-lg">
            {plan.directory.caveat}
          </p>
        </Block>
      )}

      <Block title="How hard the application is">
        <ComplexityNote programId={plan.programId} />
        <FreeAlternatives programId={plan.programId} className="mt-4" />
      </Block>

      <Block title="Common reasons applications fail">
        <ul className="space-y-3">
          {plan.failureModes.map((f) => (
            <li key={f.reason} className="border-l-2 border-accent pl-3">
              <p className="text-sm font-medium text-foreground">{f.reason}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.detail}</p>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

/* ------------------------------ locked plan ------------------------------ */

export function LockedPlan({
  programName,
  onChangeProgram,
  onUpgrade,
  className = "",
}: {
  programName: string;
  onChangeProgram: () => void;
  onUpgrade: () => void;
  className?: string;
}) {
  return (
    <div className={`border border-accent/20 bg-accent/5 p-5 ${className} rounded-2xl`}>
      <p className="rule-label">Included with a subscription</p>
      <h4 className="mt-1 font-heading font-bold text-xl leading-snug text-foreground">
        Action plan — {programName}
      </h4>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        Your free plan covers one program end to end. A subscription opens the action plans for the
        remaining programs on this parcel, the stacking analysis showing how they combine, and the
        saved parcel dashboard.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={onUpgrade}
          className="border border-primary bg-primary px-4 py-2 text-sm tracking-wide text-primary-foreground hover:bg-primary-hover rounded-md"
        >
          See subscription
        </button>
        <button
          onClick={onChangeProgram}
          className="border border-accent px-4 py-2 text-sm text-accent hover:bg-paper rounded-md"
        >
          Pick a different program
        </button>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Prototype — pricing is a placeholder and no payment is processed.
      </p>
    </div>
  );
}

/* ------------------------------ upgrade card ----------------------------- */

export function PlanUpgradeCard({
  remaining,
  onUpgrade,
  className = "",
}: {
  remaining: number;
  onUpgrade: () => void;
  className?: string;
}) {
  return (
    <div className={`border border-border bg-paper-deep p-4 ${className} rounded-2xl`}>
      <p className="rule-label">What a subscription adds</p>
      <ul className="mt-2 space-y-1.5 text-sm text-foreground">
        <li className="flex gap-2">
          <span className="text-primary-deep">▪</span> Action plans for the other {remaining}{" "}
          {remaining === 1 ? "program" : "programs"} on this parcel
        </li>
        <li className="flex gap-2">
          <span className="text-primary-deep">▪</span> Stacking analysis — how these programs
          combine, and where they conflict
        </li>
        <li className="flex gap-2">
          <span className="text-primary-deep">▪</span> Saved parcel dashboard across every site you
          research
        </li>
      </ul>
      <button
        onClick={onUpgrade}
        className="mt-3 w-full border border-primary bg-primary px-4 py-2.5 text-sm tracking-wide text-primary-foreground hover:bg-primary-hover rounded-md"
      >
        See subscription
      </button>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h5 className="rule-label border-b border-border pb-1.5">{title}</h5>
      <div className="mt-3">{children}</div>
    </section>
  );
}
