import { useEffect, useState } from "react";

/** Address / parcel-number search, drawn over the map. Submits on Enter or the button. */
export function ParcelSearchBox({
  onSearch,
  busy,
  initialValue = "",
  className = "",
}: {
  onSearch: (text: string) => void;
  busy: boolean;
  initialValue?: string;
  className?: string;
}) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => setValue(initialValue), [initialValue]);

  return (
    <form
      className={`flex items-stretch gap-2 rounded-xl border border-border bg-paper/95 p-1.5 shadow-card backdrop-blur-[16px] ${className}`}
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSearch(value);
      }}
      role="search"
    >
      <label htmlFor="parcel-search" className="sr-only">
        Search by address or parcel number
      </label>
      <input
        id="parcel-search"
        type="search"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Address or parcel number — e.g. 112 S Elgin Ave"
        className="min-w-0 flex-1 rounded-lg bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-[3px] focus:ring-ring/20"
      />
      <button
        type="submit"
        disabled={busy || !value.trim()}
        className="shrink-0 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
