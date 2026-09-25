import { useState } from "react";
import type { Program } from "@/lib/tulsa-map-data";
import { AssistanceInterest } from "@/components/assistance-request";

/**
 * End-of-report demand signal. Pick the program the help is for, then the kind
 * of help. No provider is named and no timeframe is promised.
 */
export function ReportAssistanceInterest({
  programs,
  parcelId,
  parcelAddress,
  className = "",
}: {
  programs: Program[];
  parcelId: string | null;
  parcelAddress: string | null;
  className?: string;
}) {
  const [programId, setProgramId] = useState<string>(programs[0]?.id ?? "");
  const program = programs.find((p) => p.id === programId) ?? programs[0];
  if (!program) return null;

  return (
    <section className={className}>
      <h3 className="rule-label border-b border-primary pb-2">
        11. Would you like assistance with any of this?
      </h3>
      <div className="mt-4">
        <label htmlFor="report-assist-program" className="rule-label block">
          Which program
        </label>
        <select
          id="report-assist-program"
          value={program.id}
          onChange={(e) => setProgramId(e.target.value)}
          className="mt-1.5 w-full border border-border bg-paper px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
        >
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <AssistanceInterest
          key={program.id}
          programId={program.id}
          programName={program.name}
          parcelId={parcelId}
          parcelAddress={parcelAddress}
          className="mt-4"
        />
      </div>
    </section>
  );
}
