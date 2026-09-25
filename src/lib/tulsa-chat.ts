import type { Parcel } from "./tulsa-map-data";

export type ChatAction = {
  id: string;
  label: string;
  kind: "task" | "reminder" | "flag";
};

export type ChatAnswer = {
  text: string;
  /** Id into the citation registry (src/lib/citations.ts). */
  sourceId: string | null;
  actions: ChatAction[];
  unknown?: boolean;
};

export const FREE_QUESTIONS = 3;

const KNOWN_PROGRAMS = [
  "cdbg",
  "home",
  "lihtc",
  "tax credit",
  "515",
  "usda",
  "tif",
  "increment",
  "housing trust",
  "trust fund",
  "zoning",
  "flood",
  "fema",
  "opportunity zone",
];

export const DEFAULT_QUESTION = "How do I apply for CDBG funds?";

function cdbgAnswer(): ChatAnswer {
  return {
    text:
      "For this parcel, CDBG money doesn't come from HUD directly — it passes through the City of Tulsa, which HUD designates an Entitlement Community. The city receives an annual allocation and decides locally how to spend it, guided by its five-year Consolidated Plan.\n\nPractically, that means you apply on the city's cycle, not a federal one. Applications open once a year and are scored against the priorities in the current Consolidated Plan, so a project that matches a named priority does considerably better.\n\nOne step people miss: the citizen participation rules require a public hearing on proposed uses of the funds before the city can accept and act on applications. Attending, and speaking to your project, is effectively a prerequisite — not a formality.",
    sourceId: "ch-cdbg",
    actions: [
      { id: "cdbg-contact", label: "Add task: Contact Tulsa Community Development Department", kind: "task" },
      { id: "cdbg-hearing", label: "Set reminder: Public hearing, March 12", kind: "reminder" },
      { id: "cdbg-conplan", label: "Add task: Review Tulsa Consolidated Plan", kind: "task" },
    ],
  };
}

function unknownAnswer(topic: string): ChatAnswer {
  return {
    text: `I don't have a source loaded for ${topic}, so I'd rather say that plainly than guess at the rules. Anything I told you here would be worth exactly nothing in an application.\n\nIf it matters for this parcel, I can flag it and it goes on the list of sources to add.`,
    sourceId: null,
    unknown: true,
    actions: [{ id: `flag-${topic}`, label: `Flag missing source: ${topic}`, kind: "flag" }],
  };
}

export function buildAnswer(query: string, parcel: Parcel | null): ChatAnswer {
  const q = query.toLowerCase();
  const where = parcel ? parcel.address : "the selected parcel";

  if (q.includes("cdbg")) return cdbgAnswer();

  if (q.includes("lihtc") || q.includes("tax credit")) {
    return {
      text: `Housing tax credits for ${where} are awarded by the Oklahoma Housing Finance Agency, not by the city or HUD. OHFA scores applications once a year against its Qualified Allocation Plan, and location does real work in that score — a site in a Qualified Census Tract can carry a 30% boost in eligible basis, which changes the deal's math more than almost anything else you control.`,
      sourceId: "ch-lihtc",
      actions: [
        { id: "lihtc-qap", label: "Add task: Read current OHFA Qualified Allocation Plan", kind: "task" },
        { id: "lihtc-qct", label: "Add task: Confirm QCT status for this parcel", kind: "task" },
      ],
    };
  }

  if (q.includes("home")) {
    return {
      text: `HOME funds for ${where} also run through the City of Tulsa as a participating jurisdiction. The catch most developers hit is not the award, it's the strings: HOME-assisted units carry affordability periods of 5 to 20 years depending on the per-unit subsidy, enforced by a recorded restriction. Plan the capital stack around that period, not around closing.`,
      sourceId: "ch-home",
      actions: [
        { id: "home-period", label: "Add task: Model HOME affordability period", kind: "task" },
        { id: "home-pj", label: "Add task: Contact Tulsa HOME program staff", kind: "task" },
      ],
    };
  }

  if (q.includes("usda") || q.includes("515") || q.includes("rural")) {
    return {
      text: `Section 515 is strictly place-based. ${where} qualifies only if it sits inside a USDA-designated rural area — turn on the "USDA rural eligible" overlay to see where the boundary falls. Tulsa proper is mostly outside it, so this program usually matters for sites at the metro edge.`,
      sourceId: "ch-usda",
      actions: [{ id: "usda-check", label: "Add task: Verify USDA rural designation", kind: "task" }],
    };
  }

  if (q.includes("tif") || q.includes("increment")) {
    return {
      text: `TIF here means reimbursement, not a grant up front. The parcel has to sit inside an active increment district — Increment District No. 6 covers downtown and the Pearl — and the city reimburses eligible costs out of the new property tax increment your project generates. That timing gap is the thing to plan for.`,
      sourceId: "ch-tif",
      actions: [
        { id: "tif-project-plan", label: "Add task: Request Increment District No. 6 project plan", kind: "task" },
      ],
    };
  }

  if (q.includes("flood") || q.includes("fema")) {
    return {
      text: `Floodplain status doesn't disqualify ${where}, but it raises the cost of everything downstream: federally assisted new construction in a Special Flood Hazard Area triggers the eight-step review, elevation requirements, and flood insurance for the life of the loan. Check the FEMA overlay before you underwrite.`,
      sourceId: "ch-fema",
      actions: [{ id: "fema-firm", label: "Add task: Pull FIRM panel for this parcel", kind: "task" }],
    };
  }

  if (q.includes("zoning") || q.includes("build") || q.includes("units") || q.includes("density")) {
    return {
      text: `The "What you can build here" section above lists the housing types permitted outright under this parcel's current zoning, plus what needs a conditional approval. Treat it as a preliminary read: overlays, platting, and parking standards can all narrow it. If your program needs more density than the base district allows, a rezoning adds roughly six to nine months.`,
      sourceId: "ch-zoning",
      actions: [
        { id: "zoning-planning", label: "Add task: Pre-application meeting with Tulsa Planning", kind: "task" },
      ],
    };
  }

  if (q.includes("opportunity zone") || q.includes(" oz")) {
    return {
      text: `Opportunity Zone treatment is an investor-side benefit, not a subsidy to the project. It defers and reduces capital gains tax for equity that comes in through a Qualified Opportunity Fund, which can make your equity cheaper — but it contributes nothing to affordability on its own, and pairs awkwardly with tax credit equity.`,
      sourceId: "ch-oz",
      actions: [{ id: "oz-fund", label: "Add task: Identify Qualified Opportunity Fund partners", kind: "task" }],
    };
  }

  if (q.includes("housing trust") || q.includes("trust fund")) {
    return {
      text: `The Tulsa Affordable Housing Trust Fund is small but flexible, and it moves faster than the federal sources — usually gap financing rather than a primary layer. Awards are made by the trust's board on a rolling basis, and they favor projects that already have most of the stack committed.`,
      sourceId: "ch-htf",
      actions: [{ id: "htf-apply", label: "Add task: Review housing trust fund guidelines", kind: "task" }],
    };
  }

  if (!KNOWN_PROGRAMS.some((k) => q.includes(k))) {
    const topic = query.replace(/[?.!]+$/, "").trim();
    return unknownAnswer(topic.length > 60 ? "that program" : topic);
  }

  return {
    text: `Here's the short version for ${where}: the funding list in the panel above is ordered by how likely each source is to work on this site, and every row expands to the rule behind its status. Ask me about any one of them by name and I'll walk through how the application actually works.`,
    sourceId: "ch-index",
    actions: [],
  };
}
