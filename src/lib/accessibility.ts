/**
 * Accessibility assessment.
 *
 * Eligibility answers whether the parcel qualifies. It does not answer whether
 * this organization can realistically get the money, in what timeframe, and at
 * what effort. This module assembles that second answer from five dimensions
 * the platform already tracks:
 *
 *   1. Access model        — how the money is obtained
 *   2. Organizational gate — what the applicant must be (src/lib/org-status)
 *   3. Timeline to access  — annual cycle vs rolling, plus prerequisite time
 *   4. Application difficulty — the in-house/specialist rating (src/lib/complexity)
 *   5. Disbursement structure — reimbursement is a capacity requirement
 *
 * Nothing is ever hidden. Hard-to-reach sources move down a tier and carry an
 * explanation instead of disappearing.
 */

import type { Program } from "@/lib/tulsa-map-data";
import { complexityFor, COMPLEXITY_LABEL } from "@/lib/complexity";
import { chdoRouteFor, orgFitFor, type OrgType } from "@/lib/org-status";
import { DISBURSEMENTS, type DisbursementId } from "@/lib/disbursement";

/* ------------------------------ access model ----------------------------- */

export type AccessModel =
  | "open"
  | "competitive"
  | "invitation"
  | "relationship"
  | "network";

export const ACCESS_MODELS: Record<AccessModel, { label: string; blurb: string }> = {
  open: {
    label: "Open application",
    blurb: "Published criteria. Anyone who meets them may apply.",
  },
  competitive: {
    label: "Competitive allocation",
    blurb: "Open, but scored against other applicants for a limited pool.",
  },
  invitation: {
    label: "Invitation only",
    blurb: "The funder solicits. Unsolicited proposals are not accepted.",
  },
  relationship: {
    label: "Relationship based",
    blurb: "Access follows from an existing relationship with the funder.",
  },
  network: {
    label: "Network member only",
    blurb: "Restricted to members of a specific network or intermediary.",
  },
};

/* ---------------------------------- tiers -------------------------------- */

export type Tier = 1 | 2 | 3;

export const TIERS: Record<Tier, { label: string; blurb: string }> = {
  1: {
    label: "Realistic now",
    blurb:
      "Open or competitive application, your organization already meets the gate, and the timeline fits a normal project schedule.",
  },
  2: {
    label: "Realistic with preparation",
    blurb:
      "Reachable, but a designation, a partnership, or a specialist has to come first. What stands in the way is named on each entry.",
  },
  3: {
    label: "Long-term or relationship-dependent",
    blurb:
      "Invitation-only or relationship-based capital. Worth knowing and worth building toward — not worth writing an application for this month.",
  },
};

/* -------------------------------- profiles ------------------------------- */

export type TimelineCycle = "rolling" | "annual" | "multi-year";

export type AccessTimeline = {
  cycle: TimelineCycle;
  /** How long before money could realistically arrive, once you can apply. */
  toMoney: string;
  /** Extra months a prerequisite designation or partnership adds up front. */
  prerequisite?: string;
};

export type AccessProfile = {
  model: AccessModel;
  /** Why the model is what it is, in one line. */
  modelNote: string;
  timeline: AccessTimeline;
  /** Rough scale of the award, for the effort-versus-award read. */
  awardScale: string;
  /** Said plainly when the work is heavy relative to the money. */
  effortVsAward?: string;
};

export const ACCESS_PROFILES: Record<string, AccessProfile> = {
  cdbg: {
    model: "competitive",
    modelNote:
      "The City publishes criteria and takes applications, but requests are scored against other subrecipients inside a fixed annual entitlement.",
    timeline: {
      cycle: "annual",
      toMoney:
        "Applications follow the City's Annual Action Plan cycle; award to first reimbursement typically runs 9 to 14 months.",
    },
    awardScale: "Mid-six figures for a typical housing subrecipient award.",
  },
  home: {
    model: "competitive",
    modelNote:
      "Open to for-profit and nonprofit developers, scored by the Participating Jurisdiction against the other requests in the round.",
    timeline: {
      cycle: "annual",
      toMoney:
        "One funding round a year. Commitment to closing generally lands 8 to 12 months after the round closes.",
    },
    awardScale: "Gap financing, commonly several hundred thousand to low seven figures.",
  },
  "home-chdo": {
    model: "competitive",
    modelNote:
      "Same allocation and the same scoring, but the field is limited to organizations the Participating Jurisdiction has certified — a smaller field for a reserved pool.",
    timeline: {
      cycle: "annual",
      toMoney:
        "Follows the general HOME round once you may apply into the reserve.",
      prerequisite:
        "Certification by the City of Tulsa is a multi-month process — plan on several months before an application into the reserve is even possible.",
    },
    awardScale: "A reserved share of the jurisdiction's HOME allocation.",
  },
  lihtc: {
    model: "competitive",
    modelNote:
      "A scored state allocation round. Points, not eligibility, decide who is funded.",
    timeline: {
      cycle: "annual",
      toMoney:
        "One 9% round a year, with a further 18 to 24 months from award through closing and equity pay-in.",
    },
    awardScale: "The largest single source in most affordable deals.",
  },
  usda515: {
    model: "open",
    modelNote:
      "A direct loan program with published underwriting standards rather than a scored competition against local peers.",
    timeline: {
      cycle: "rolling",
      toMoney: "Underwriting to loan closing typically runs 9 to 14 months.",
    },
    awardScale: "Long-term mortgage debt, not subsidy.",
    effortVsAward:
      "USDA handbook underwriting and a rural-specific appraisal and environmental sequence, for debt rather than equity. On a small deal this is often more process than the capital justifies.",
  },
  tif: {
    model: "open",
    modelNote:
      "Application to the Tulsa Development Authority under an approved project plan; not scored against a competing field, but negotiated.",
    timeline: {
      cycle: "rolling",
      toMoney:
        "Approval can come inside a year, but nothing is paid until the project is on the tax roll — repayment then runs 10 to 20 years.",
    },
    awardScale: "Reimbursement of eligible project costs from captured increment.",
    effortVsAward:
      "A financial advisor's but-for projection and an authority approval, for money that arrives only after stabilization. It closes a long-term gap, not a construction gap.",
  },
  htf: {
    model: "competitive",
    modelNote: "A local scored round with published priority areas and tiers.",
    timeline: {
      cycle: "annual",
      toMoney: "Awards wired 45 to 60 days after the annual cycle closes.",
    },
    awardScale: "Local gap financing, generally low-to-mid six figures.",
  },
  brownfields: {
    model: "open",
    modelNote:
      "Assessment and cleanup dollars are requested from PartnerTulsa's locally administered pool on a rolling basis rather than through a national competition.",
    timeline: {
      cycle: "rolling",
      toMoney:
        "A Phase I can be scheduled within weeks; Phase II and cleanup reimbursements follow the consultant's schedule, typically 3 to 9 months.",
    },
    awardScale: "Assessment work and modest cleanup dollars.",
  },
  htc: {
    model: "open",
    modelNote:
      "Certification applications are reviewed on their merits by SHPO and the National Park Service, not ranked against other applicants.",
    timeline: {
      cycle: "rolling",
      toMoney:
        "Part 1 and Part 2 review runs several months each; credit equity does not pay in fully until Part 3 is issued after completion.",
    },
    awardScale: "20% of qualified rehabilitation expenditures.",
    effortVsAward:
      "A preservation consultant, a three-part federal review, and a rehabilitation scope written to the Secretary's Standards. On a small building the documentation cost eats a meaningful share of the credit.",
  },
};

/* --------------------- sources that are not parcel-tested ----------------- */

/**
 * Capital that never appears in an eligibility list because it has no parcel
 * test at all — it has a relationship test. A developer who has heard of these
 * is better served seeing them in tier three with the reason.
 */
export type RelationshipSource = {
  id: string;
  name: string;
  agency: string;
  what: string;
  model: AccessModel;
  path: string;
};

export const RELATIONSHIP_SOURCES: RelationshipSource[] = [
  {
    id: "local-foundation",
    name: "Local foundation program-related investment",
    agency: "Tulsa-area private and community foundations",
    what:
      "Below-market predevelopment and acquisition capital, usually placed with organizations the foundation already funds.",
    model: "invitation",
    path:
      "The obstacle is that these funders do not accept unsolicited proposals. The step that removes it is an introduction: work through an intermediary already active locally — a CDFI lender, PartnerTulsa, or a peer developer in their portfolio — and build the relationship over a year before there is a deal on the table.",
  },
  {
    id: "network-intermediary",
    name: "National intermediary member capital",
    agency: "Housing Partnership Network / NeighborWorks-type intermediaries",
    what:
      "Flexible acquisition lines and equity available to member organizations of the network.",
    model: "network",
    path:
      "The obstacle is membership. The step that removes it is applying to the network, which reviews organizational track record and financial statements and admits members on its own schedule — a year-scale effort, not a deal-scale one.",
  },
];

/* ------------------------------- assessment ------------------------------ */

export type DimensionId = "model" | "gate" | "timeline" | "difficulty" | "disbursement";

export const DIMENSION_LABEL: Record<DimensionId, string> = {
  model: "Access model",
  gate: "Organizational gate",
  timeline: "Timeline to access",
  difficulty: "Application difficulty",
  disbursement: "Disbursement structure",
};

export type DimensionReading = {
  dimension: DimensionId;
  /** The short value of this dimension for this program. */
  value: string;
  /** Whether this dimension is what holds the entry out of tier one. */
  constraining: boolean;
  /** The reasoning, shown when the user opens "why is this not tier one". */
  detail: string;
};

export type AccessAssessment = {
  tier: Tier;
  profile: AccessProfile | null;
  readings: DimensionReading[];
  /** One or two plain sentences: the obstacle, and the step that removes it. */
  path: string | null;
  effortVsAward: string | null;
  /** True when no organization profile was given and a default was assumed. */
  assumedOrg: boolean;
};

/** The most common case, used when the user has not told us who they are. */
export const DEFAULT_ORG: OrgType = "nonprofit";

export function assessAccess(
  program: Pick<Program, "id" | "status">,
  org: OrgType | null,
  chdoDesignated = false,
): AccessAssessment {
  const assumedOrg = org === null;
  const effectiveOrg = org ?? DEFAULT_ORG;
  const profile = ACCESS_PROFILES[program.id] ?? null;
  const complexity = complexityFor(program.id);
  const readings: DimensionReading[] = [];
  const paths: string[] = [];
  let tier: Tier = 1;
  const demote = (t: Tier) => {
    if (t > tier) tier = t;
  };

  /* 1 — access model */
  if (profile) {
    const model = ACCESS_MODELS[profile.model];
    const closed =
      profile.model === "invitation" ||
      profile.model === "relationship" ||
      profile.model === "network";
    if (closed) demote(3);
    readings.push({
      dimension: "model",
      value: model.label,
      constraining: closed,
      detail: profile.modelNote,
    });
  }

  /* 2 — organizational gate */
  if (program.id === "home-chdo") {
    const route = chdoRouteFor(effectiveOrg, chdoDesignated) ?? "certify";
    if (route === "designated") {
      readings.push({
        dimension: "gate",
        value: "CHDO designation held",
        constraining: false,
        detail:
          "Your organization already holds the certification the reserve requires, so the gate is satisfied.",
      });
    } else if (route === "certify") {
      demote(2);
      readings.push({
        dimension: "gate",
        value: "CHDO certification required",
        constraining: true,
        detail:
          "The reserve is restricted to nonprofits the Participating Jurisdiction has certified. Your organization type can pursue that certification; it does not hold it today.",
      });
      paths.push(
        "The obstacle is that only certified CHDOs may apply into the reserve. The step that removes it is certification by the City of Tulsa as Participating Jurisdiction — board composition evidence, service area, and capacity documentation — which takes several months and will not unlock money on a near-term deal.",
      );
    } else {
      demote(2);
      readings.push({
        dimension: "gate",
        value: "Partnership route only",
        constraining: true,
        detail:
          "A for-profit or governmental entity cannot hold CHDO status in its own name, so the reserve is reachable only through a certified organization that owns, develops, or sponsors the housing.",
      });
      paths.push(
        "The obstacle is that your organization cannot itself be certified. The step that removes it is engaging a CHDO the City of Tulsa has already certified and setting its role — owner, developer, or sponsor — in the development agreement before you rely on the reserve.",
      );
    }
  } else {
    const fit = orgFitFor(program.id, effectiveOrg);
    if (fit?.level === "partner") {
      demote(2);
      readings.push({
        dimension: "gate",
        value: "Partnership required",
        constraining: true,
        detail: fit.detail,
      });
      paths.push(
        program.id === "brownfields"
          ? "The obstacle is that this pool runs to nonprofit and public applicants, so a for-profit developer cannot request it directly. The step that removes it is a nonprofit partner or public entity as the applicant of record, with your role set out in the development agreement before assessment work begins."
          : `The obstacle is the applicant test, not the parcel. ${fit.detail}`,
      );
    } else if (fit?.level === "designation") {
      readings.push({
        dimension: "gate",
        value: "Open to you; a designation adds more",
        constraining: false,
        detail: fit.detail,
      });
    } else {
      readings.push({
        dimension: "gate",
        value: "Your organization type qualifies",
        constraining: false,
        detail:
          fit?.detail ??
          "No organizational status stands between your organization type and this application.",
      });
    }
  }

  /* 3 — timeline */
  if (profile) {
    const t = profile.timeline;
    if (t.prerequisite) demote(2);
    readings.push({
      dimension: "timeline",
      value:
        t.cycle === "annual"
          ? "Annual cycle"
          : t.cycle === "rolling"
            ? "Rolling availability"
            : "Multi-year",
      constraining: Boolean(t.prerequisite),
      detail: t.prerequisite ? `${t.toMoney} ${t.prerequisite}` : t.toMoney,
    });
    if (t.prerequisite) paths.push(t.prerequisite);
  }

  /* 4 — application difficulty */
  if (complexity) {
    const hard = complexity.level === "specialist-required";
    if (hard) demote(2);
    readings.push({
      dimension: "difficulty",
      value: COMPLEXITY_LABEL[complexity.level],
      constraining: hard,
      detail: complexity.reason,
    });
    if (hard) {
      paths.push(
        "The obstacle is that this is rarely completed in-house. The step that removes it is retaining the specialist before the cycle opens, and checking the no-cost help listed on this program first.",
      );
    }
  }

  /* 5 — disbursement structure */
  const disb: DisbursementId | undefined = (program as Partial<Program>).disbursement;
  if (disb) {
    const meta = DISBURSEMENTS[disb];
    const carries = disb === "reimbursement";
    readings.push({
      dimension: "disbursement",
      value: meta.label,
      constraining: false,
      detail: carries
        ? "Reimbursement is an organizational capacity requirement as much as a cash-flow attribute: you pay the contractor and the consultant first and are repaid on a draw cycle, so you need working capital or a line of credit to use this money at all."
        : meta.summary,
    });
  }

  /* parcel-level ineligibility is not an accessibility question */
  if (program.status === "Not eligible") tier = 3;

  return {
    tier,
    profile,
    readings,
    path: paths.length ? paths.join(" ") : null,
    effortVsAward: profile?.effortVsAward ?? null,
    assumedOrg,
  };
}

export type TierGroup<T> = {
  tier: Tier;
  items: { item: T; assessment: AccessAssessment }[];
};

export function groupByTier<T extends Pick<Program, "id" | "status">>(
  programs: T[],
  org: OrgType | null,
  chdoDesignated = false,
): TierGroup<T>[] {
  const groups: TierGroup<T>[] = [
    { tier: 1, items: [] },
    { tier: 2, items: [] },
    { tier: 3, items: [] },
  ];
  for (const item of programs) {
    const assessment = assessAccess(item, org, chdoDesignated);
    groups[assessment.tier - 1]!.items.push({ item, assessment });
  }
  return groups;
}

/** One-line rationale for a tier-one source, used by the report summary. */
export function focusRationale(
  program: Pick<Program, "id" | "name" | "status">,
  assessment: AccessAssessment,
): string {
  const p = assessment.profile;
  const difficulty = assessment.readings.find((r) => r.dimension === "difficulty");
  const model = p ? ACCESS_MODELS[p.model].label.toLowerCase() : "open application";
  const timing = p?.timeline.toMoney ?? "";
  return `${model.charAt(0).toUpperCase()}${model.slice(1)}, no organizational gate in the way${
    difficulty ? `, ${difficulty.value.toLowerCase()}` : ""
  }. ${timing}`.trim();
}

/** Tier-one sources in priority order: soonest and least encumbered first. */
export function focusOrder<T extends Pick<Program, "id" | "status">>(
  items: { item: T; assessment: AccessAssessment }[],
): { item: T; assessment: AccessAssessment }[] {
  const score = (a: AccessAssessment) => {
    const cycle = a.profile?.timeline.cycle;
    let s = cycle === "rolling" ? 0 : cycle === "annual" ? 1 : 2;
    const d = a.readings.find((r) => r.dimension === "difficulty")?.value ?? "";
    if (d.startsWith("Specialist recommended")) s += 0.5;
    if (d.startsWith("Specialist typically")) s += 1;
    if (a.profile?.model === "competitive") s += 0.25;
    return s;
  };
  return [...items].sort((a, b) => score(a.assessment) - score(b.assessment));
}
