import { useState } from "react";
import {
  ASSISTANCE_TYPES,
  ASSISTANCE_TYPE_LABEL,
  recordAssistanceRequest,
  type AssistanceTypeId,
} from "@/lib/assistance-requests";
import { FreeAlternatives } from "@/components/complexity";

/**
 * Demand signal only: capture whether the user wants help and what kind.
 * No provider is named, and no timeframe is promised.
 */
export function AssistanceInterest({
  programId,
  programName,
  parcelId = null,
  parcelAddress = null,
  showFreeAlternatives = true,
  className = "",
}: {
  programId: string;
  programName: string;
  parcelId?: string | null;
  parcelAddress?: string | null;
  showFreeAlternatives?: boolean;
  className?: string;
}) {
  const [selected, setSelected] = useState<AssistanceTypeId | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState<AssistanceTypeId | null>(null);

  function submit(type: AssistanceTypeId) {
    recordAssistanceRequest({
      programId,
      programName,
      type,
      parcelId,
      parcelAddress,
      note,
    });
    setSubmitted(type);
  }

  if (submitted) {
    return (
      <div className={`border-2 border-primary bg-secondary p-4 ${className}`}>
        <p className="rule-label">Request noted</p>
        <p className="mt-2 text-sm leading-relaxed text-foreground">
          Your interest in {ASSISTANCE_TYPE_LABEL[submitted].toLowerCase()} for {programName} has
          been recorded. Someone will follow up.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Nothing is committed and no provider has been assigned. You can change or add a request
          at any time.
        </p>
        <button
          onClick={() => {
            setSubmitted(null);
            setSelected(null);
            setNote("");
          }}
          className="mt-3 border border-primary px-3 py-1.5 text-xs text-primary hover:bg-paper"
        >
          Request a different kind of help
        </button>
      </div>
    );
  }

  return (
    <div className={`border border-border bg-paper-deep p-4 ${className}`}>
      <p className="rule-label">Would you like assistance with this?</p>
      <p className="mt-2 text-sm leading-relaxed text-foreground">
        Tell us what kind of help would be useful for {programName}. These are different kinds of
        work, so pick the one you actually need.
      </p>

      <ul className="mt-3 space-y-2">
        {ASSISTANCE_TYPES.map((t) => {
          const on = selected === t.id;
          return (
            <li key={t.id}>
              <button
                onClick={() => setSelected(on ? null : t.id)}
                aria-pressed={on}
                className={`w-full border px-3 py-2 text-left transition-colors ${
                  on ? "border-primary bg-secondary" : "border-border hover:border-primary"
                }`}
              >
                <span className="block text-sm font-medium text-foreground">{t.label}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {t.detail}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {selected && (
        <div className="mt-3">
          <label
            htmlFor={`assist-note-${programId}`}
            className="rule-label block"
          >
            Anything specific? (optional)
          </label>
          <textarea
            id={`assist-note-${programId}`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Timing, scope, what you have already done."
            className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <button
            onClick={() => submit(selected)}
            className="mt-2 w-full border border-primary bg-primary px-4 py-2.5 text-sm tracking-wide text-primary-foreground hover:bg-primary-deep"
          >
            Send this request
          </button>
        </div>
      )}

      {showFreeAlternatives && <FreeAlternatives programId={programId} className="mt-4" />}
    </div>
  );
}
