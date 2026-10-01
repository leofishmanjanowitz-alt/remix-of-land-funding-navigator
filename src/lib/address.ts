/**
 * Turns whatever a person types into the form Tulsa County uses for situs
 * addresses, e.g. "112 South Elgin Avenue, Tulsa OK" -> "112 S ELGIN AV".
 * Pure string work: no network, no database, no model.
 */

const STREET_TYPES: Record<string, string> = {
  AVENUE: "AV", AVE: "AV", AV: "AV",
  STREET: "ST", STR: "ST", ST: "ST",
  PLACE: "PL", PL: "PL",
  BOULEVARD: "BV", BLVD: "BV", BV: "BV",
  DRIVE: "DR", DR: "DR",
  COURT: "CT", CT: "CT",
  ROAD: "RD", RD: "RD",
  TRAIL: "TL", TRL: "TL", TL: "TL",
  WAY: "WY", WY: "WY",
  HIGHWAY: "HY", HWY: "HY", HY: "HY",
  CIRCLE: "CR", CIR: "CR", CR: "CR",
  TERRACE: "TE", TER: "TE", TE: "TE",
  LANE: "LN", LN: "LN",
  PARKWAY: "PK", PKWY: "PK", PK: "PK",
  EXPRESSWAY: "EX", EXPY: "EX", EX: "EX",
}; // prettier-ignore

const DIRECTIONS: Record<string, string> = {
  NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W", N: "N", S: "S", E: "E", W: "W",
}; // prettier-ignore

/** Trailing words that are not part of the street address. */
const TAIL_WORDS = new Set([
  "OK", "OKLAHOMA", "USA", "TULSA", "BIXBY", "OWASSO", "JENKS", "GLENPOOL", "COLLINSVILLE",
  "SKIATOOK", "SPERRY", "SAPULPA", "ARROW", "BROKEN", "SPRINGS", "SAND",
]); // prettier-ignore

export type ParsedQuery =
  | { kind: "empty" }
  | { kind: "parcel_number"; digits: string }
  | { kind: "account_number"; account: string }
  | {
      kind: "address";
      houseNumber: string | null;
      /** Direction before the street name, when one was typed. */
      predir: string | null;
      /** The street name alone, e.g. "ELGIN" or "11". */
      streetName: string;
      streetType: string | null;
      /** The whole normalized line, e.g. "112 S ELGIN AV". */
      text: string;
    };

export function parseParcelQuery(input: string): ParsedQuery {
  const raw = input.trim().toUpperCase();
  if (!raw) return { kind: "empty" };

  // County parcel numbers are 14 digits, often written with dashes or spaces.
  const compact = raw.replace(/[\s.-]/g, "");
  if (/^\d{10,14}$/.test(compact)) return { kind: "parcel_number", digits: compact };
  if (/^R\d{10,14}$/.test(compact)) return { kind: "account_number", account: compact };

  // Keep only the street line: drop everything after the first comma, unit numbers, punctuation.
  const line = (raw.split(",")[0] ?? "")
    .replace(/\b(APT|UNIT|STE|SUITE|#)\s*[A-Z0-9-]*$/g, " ")
    .replace(/[^A-Z0-9 ]/g, " ");
  let tokens = line.split(/\s+/).filter(Boolean);

  // Trailing ZIP / state / city words typed without a comma.
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1]!;
    if (/^\d{5}(\d{4})?$/.test(last) && tokens.length > 2) tokens.pop();
    else if (TAIL_WORDS.has(last) && tokens.length > 2) tokens.pop();
    else break;
  }

  let houseNumber: string | null = null;
  if (tokens[0] && /^\d+[A-Z]?$/.test(tokens[0]) && tokens.length > 1) {
    houseNumber = tokens[0];
    tokens = tokens.slice(1);
  }

  const words = tokens.map((t, i) => {
    // "11TH" -> "11": the county writes numbered streets without the suffix.
    const ordinal = /^(\d+)(ST|ND|RD|TH)$/.exec(t);
    if (ordinal) return ordinal[1]!;
    if (DIRECTIONS[t] && (i === 0 || i === tokens.length - 1)) return DIRECTIONS[t];
    // A street type only when it follows the street name ("ST LOUIS AV" keeps its "ST").
    if (STREET_TYPES[t] && i > 0) return STREET_TYPES[t];
    return t;
  });

  const text = [houseNumber, ...words].filter(Boolean).join(" ");

  // Peel the direction, quadrant and street type off to leave the street name.
  const name = [...words];
  let predir: string | null = null;
  let streetType: string | null = null;
  if (name.length > 1 && /^[NSEW]$/.test(name[0]!)) predir = name.shift()!;
  if (name.length > 1 && /^[NSEW]$/.test(name[name.length - 1]!)) name.pop();
  if (name.length > 1 && Object.values(STREET_TYPES).includes(name[name.length - 1]!))
    streetType = name.pop()!;
  const streetName = name.join(" ");

  if (!streetName) return { kind: "empty" };
  return { kind: "address", houseNumber, predir, streetName, streetType, text };
}
