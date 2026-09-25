import { useState } from "react";

import {
  CONTACT_DISCLAIMER,
  contactById,
  formatVerified,
  isStale,
  type ContactRecord,
} from "@/lib/contacts";

/* ------------------------------ copy field ------------------------------- */

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          /* clipboard unavailable — the value is still selectable on screen */
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
      aria-label={`Copy ${label}`}
      className="shrink-0 border border-border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Field({
  label,
  value,
  href,
  note,
  copyValue,
}: {
  label: string;
  value: string;
  href?: string | undefined;
  note?: string | undefined;
  copyValue?: string | undefined;
}) {
  return (
    <div className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-start gap-2 border-b border-border/70 py-2 last:border-b-0">
      <span className="rule-label pt-0.5">{label}</span>
      <span className="min-w-0">
        {href ? (
          <a
            href={href}
            target={href.startsWith("http") ? "_blank" : undefined}
            rel={href.startsWith("http") ? "noreferrer" : undefined}
            className="break-words text-sm leading-snug text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
          >
            {value}
          </a>
        ) : (
          <span className="block break-words text-sm leading-snug text-foreground">{value}</span>
        )}
        {note && (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{note}</span>
        )}
      </span>
      <CopyButton value={copyValue ?? value} label={label} />
    </div>
  );
}

/* ----------------------------- report control ---------------------------- */

function ReportProblem({ contact }: { contact: ContactRecord }) {
  const [state, setState] = useState<"idle" | "open" | "sent">("idle");
  const [reason, setReason] = useState<string>("");

  if (state === "sent") {
    return (
      <p className="mt-2 border border-dashed border-primary px-2.5 py-1.5 text-xs leading-relaxed text-primary">
        Flagged for re-verification. We will re-confirm this contact with{" "}
        {contact.body} and update the record.
      </p>
    );
  }

  if (state === "open") {
    const options = [
      "This person no longer holds the role",
      "Email bounced or went unanswered",
      "Phone number is wrong or disconnected",
      "Link goes to the wrong page",
    ];
    return (
      <div className="mt-2 border border-border p-2.5">
        <p className="rule-label">What is out of date?</p>
        <ul className="mt-1.5 space-y-1">
          {options.map((o) => (
            <li key={o}>
              <label className="flex cursor-pointer items-start gap-2 text-xs leading-relaxed text-foreground">
                <input
                  type="radio"
                  name={`flag-${contact.id}`}
                  checked={reason === o}
                  onChange={() => setReason(o)}
                  className="mt-0.5 accent-[var(--color-primary)]"
                />
                {o}
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            disabled={!reason}
            onClick={() => setState("sent")}
            className="border border-primary px-2.5 py-1 text-xs text-primary transition-colors hover:bg-secondary disabled:border-border disabled:text-muted-foreground"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="font-mono text-[11px] text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setState("open")}
      className="mt-2 font-mono text-[11px] text-muted-foreground underline decoration-dotted underline-offset-2 hover:text-accent"
    >
      Report this contact as out of date
    </button>
  );
}

/* ------------------------------ contact block ---------------------------- */

export function ContactBlock({
  contact,
  children,
  className = "",
}: {
  contact: ContactRecord;
  /** Optional plan-specific instruction rendered under the fields. */
  children?: React.ReactNode;
  className?: string;
}) {
  const named = contact.kind === "named";
  const stale = isStale(contact);
  const telHref = contact.phone ? `tel:+1${contact.phone.replace(/\D/g, "")}` : undefined;

  return (
    <div className={`border border-border bg-card ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-border bg-secondary/50 px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-medium leading-snug text-foreground">{contact.name}</p>
          <p className="text-xs leading-snug text-muted-foreground">
            {contact.title} · {contact.body}
          </p>
        </div>
        <span
          className={`shrink-0 border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${
            named ? "border-primary text-primary" : "border-accent text-accent"
          }`}
        >
          {named ? "Named contact" : "General — department"}
        </span>
      </div>

      {!named && (
        <p className="border-b border-border px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          No specific staff person is confirmed for this program. Reach the role through the
          department line below and ask who currently handles it.
        </p>
      )}

      <div className="px-3 py-1">
        {contact.email && (
          <Field
            label="Email"
            value={contact.email}
            href={`mailto:${contact.email}`}
            note={contact.emailIsShared ? "Shared department inbox, not a personal address." : undefined}
          />
        )}
        {contact.phone && (
          <Field
            label="Phone"
            value={contact.phoneExt ? `${contact.phone} ext. ${contact.phoneExt}` : contact.phone}
            href={telHref}
            copyValue={contact.phone}
            note={contact.phoneIsMainLine ? "Main line — ask for the program by name." : undefined}
          />
        )}
        {contact.website && (
          <Field
            label="Program page"
            value={contact.websiteLabel ?? contact.website}
            href={contact.website}
            copyValue={contact.website}
          />
        )}
        {contact.address && (
          <Field label="In person" value={contact.address} note={contact.addressWhy} />
        )}
      </div>

      <div className="border-t border-border px-3 py-2">
        {children && (
          <p className="mb-2 text-sm leading-relaxed text-foreground">{children}</p>
        )}
        <p className="font-mono text-[11px] text-muted-foreground">
          Last verified {formatVerified(contact.lastVerified)}
          {contact.verifiedBy ? ` · ${contact.verifiedBy}` : ""}
        </p>
        {stale && (
          <p className="mt-1 text-xs leading-relaxed text-accent">
            {named
              ? "This named contact has not been re-confirmed recently. Verify the person still holds the role before relying on it."
              : "This department record is over a year old. Confirm the line before relying on it."}
          </p>
        )}
        <ReportProblem contact={contact} />
      </div>
    </div>
  );
}

export function ContactBlockById({
  id,
  children,
  className = "",
}: {
  id: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const contact = contactById(id);
  if (!contact) return null;
  return (
    <ContactBlock contact={contact} className={className}>
      {children}
    </ContactBlock>
  );
}

export function ContactDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-muted-foreground ${className}`}>
      {CONTACT_DISCLAIMER}
    </p>
  );
}
