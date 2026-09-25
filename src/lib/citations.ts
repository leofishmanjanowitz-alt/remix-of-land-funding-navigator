/**
 * Central citation registry.
 * Every sourced claim in the app references a Source by id; numbering is
 * assigned per panel or per document by the CitationScope component.
 * Every source also carries the level of government that issued it.
 */

import type { Level } from "./jurisdictions";

export type Source = {
  id: string;
  /** Full citation in Chicago note style. */
  note: string;
  /** Issuing body. */
  issuer: string;
  url: string;
  /** Date accessed, already formatted. */
  accessed: string;
  /** Level of government that issues this source. */
  level: Level;
  /** One line on what this level contributes to the requirement. */
  role?: string | undefined;
};

const ACCESSED = "August 31, 2026";

function s(
  id: string,
  note: string,
  issuer: string,
  url: string,
  level: Level = "federal",
  role?: string,
  accessed: string = ACCESSED,
): Source {
  return { id, note, issuer, url, accessed, level, role };
}


/* --------------------------- zoning code sources -------------------------- */

type ZoningSections = {
  district: string;
  uses: string;
  height: string;
  lot: string;
  chapter: string;
};

const ZONING_SECTIONS: Record<string, ZoningSections> = {
  "RS-3": { chapter: "Chapter 5", district: "§ 5.020", uses: "§ 5.030, Table 5-2", height: "§ 5.040-A", lot: "§ 5.040-B" },
  "RS-5": { chapter: "Chapter 5", district: "§ 5.020", uses: "§ 5.030, Table 5-2", height: "§ 5.040-A", lot: "§ 5.040-C" },
  "RM-1": { chapter: "Chapter 5", district: "§ 5.050", uses: "§ 5.060, Table 5-4", height: "§ 5.070-A", lot: "§ 5.070-B" },
  "RM-2": { chapter: "Chapter 5", district: "§ 5.050", uses: "§ 5.060, Table 5-4", height: "§ 5.070-A", lot: "§ 5.070-C" },
  "MX1-P": { chapter: "Chapter 15", district: "§ 15.020", uses: "§ 15.030, Table 15-1", height: "§ 15.040-A", lot: "§ 15.040-D" },
  "MX2-U": { chapter: "Chapter 15", district: "§ 15.020", uses: "§ 15.030, Table 15-1", height: "§ 15.040-B", lot: "§ 15.040-D" },
  CH: { chapter: "Chapter 15", district: "§ 15.010", uses: "§ 15.020, Table 15-2", height: "§ 15.050-A", lot: "§ 15.050-C" },
  AG: { chapter: "Chapter 5", district: "§ 5.010", uses: "§ 5.015, Table 5-1", height: "§ 5.018-A", lot: "§ 5.018-B" },
};

const ZONING_PAGES: Record<string, number> = {
  "RS-3": 112,
  "RS-5": 116,
  "RM-1": 124,
  "RM-2": 128,
  "MX1-P": 301,
  "MX2-U": 306,
  CH: 288,
  AG: 104,
};

function zoningSource(code: string, kind: keyof Omit<ZoningSections, "chapter">, label: string): Source {
  const sec = ZONING_SECTIONS[code] ?? ZONING_SECTIONS["RS-3"]!;
  const page = ZONING_PAGES[code] ?? 112;
  return s(
    `tz-${kind}-${code}`,
    `City of Tulsa, Zoning Code, Title 42, ${sec.chapter}, ${sec[kind]} (${label}, ${code}), amended 2025, ${page}, https://www.tulsaplanning.org/zoning-code/.`,
    "City of Tulsa Planning Office (INCOG)",
    "https://www.tulsaplanning.org/zoning-code/",
    "local",
    "Sets the dimensional and use standard as adopted by the city.",
  );

}

export function zoningSourceIds(code: string) {
  return {
    district: `tz-district-${code}`,
    uses: `tz-uses-${code}`,
    height: `tz-height-${code}`,
    lot: `tz-lot-${code}`,
  };
}

function buildZoningSources(): Source[] {
  const out: Source[] = [];
  for (const code of Object.keys(ZONING_SECTIONS)) {
    out.push(
      zoningSource(code, "district", "district establishment"),
      zoningSource(code, "uses", "permitted use table"),
      zoningSource(code, "height", "maximum building height"),
      zoningSource(code, "lot", "minimum lot area"),
    );
  }
  return out;
}

/* ------------------------------ all sources ------------------------------ */

const LIST: Source[] = [
  ...buildZoningSources(),

  s(
    "assessor-record",
    "Tulsa County Assessor, \"Parcel Record Search,\" property record card, 2026, https://www.assessor.tulsacounty.org/.",
    "Tulsa County Assessor",
    "https://www.assessor.tulsacounty.org/",
    "local",
    "County record of the parcel as assessed.",
  ),
  s(
    "assessor-value",
    "Tulsa County Assessor, \"2026 Assessment Roll,\" fair cash value and assessed value schedule, https://www.assessor.tulsacounty.org/assessor-property-search.php.",
    "Tulsa County Assessor",
    "https://www.assessor.tulsacounty.org/assessor-property-search.php",
    "local",
    "County valuation used for local underwriting.",
  ),

  s(
    "ov-tif",
    "Tulsa Development Authority, \"Increment District No. 6 Project Plan,\" boundary exhibit A, 2019, 5, https://www.tulsadevelopmentauthority.org/.",
    "Tulsa Development Authority",
    "https://www.tulsadevelopmentauthority.org/",
    "quasi",
    "Public trust that administers the district and approves reimbursements.",
  ),
  s(
    "ov-qct",
    "U.S. Department of Housing and Urban Development, Office of Policy Development and Research, \"Qualified Census Tracts and Difficult Development Areas,\" 2026 designations, https://www.huduser.gov/portal/datasets/qct.html.",
    "U.S. Department of Housing and Urban Development",
    "https://www.huduser.gov/portal/datasets/qct.html",
    "federal",
    "Federal designation that fixes the geography.",
  ),
  s(
    "ov-usda",
    "U.S. Department of Agriculture, Rural Development, \"Property Eligibility — Multi-Family Housing,\" eligibility area map, https://eligibility.sc.egov.usda.gov/.",
    "USDA Rural Development",
    "https://eligibility.sc.egov.usda.gov/",
    "federal",
    "Federal boundary determination.",
  ),
  s(
    "ov-fema",
    "Federal Emergency Management Agency, \"Flood Insurance Rate Map, Tulsa County, Oklahoma,\" panel 40143C, Zone AE, https://msc.fema.gov/portal/home.",
    "Federal Emergency Management Agency",
    "https://msc.fema.gov/portal/home",
    "federal",
    "Federal flood hazard mapping.",
  ),
  s(
    "ov-zoning",
    "City of Tulsa, \"Zoning (TulsaZoning_OpenData),\" open data feature service, https://gis2-cityoftulsa.opendata.arcgis.com/.",
    "City of Tulsa",
    "https://gis2-cityoftulsa.opendata.arcgis.com/",
    "local",
    "City zoning of record, published as open GIS data.",
  ),
  s(
    "ov-oz",
    "U.S. Department of the Treasury, Community Development Financial Institutions Fund, \"Qualified Opportunity Zone Designations,\" tract 40143000200, https://www.cdfifund.gov/opportunity-zones.",
    "U.S. Department of the Treasury, CDFI Fund",
    "https://www.cdfifund.gov/opportunity-zones",
    "federal",
    "Federal tract designation.",
  ),
  s(
    "ov-htf",
    "City of Tulsa, \"Affordable Housing Trust Fund Priority Area Map,\" adopted 2024, https://www.cityoftulsa.org/.",
    "City of Tulsa",
    "https://www.cityoftulsa.org/",
    "local",
    "Locally adopted priority geography.",
  ),

  s(
    "pg-cdbg",
    "U.S. Department of Housing and Urban Development, \"Criteria for National Objectives,\" 24 C.F.R. § 570.208 (2026), https://www.ecfr.gov/current/title-24/section-570.208.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/section-570.208",
    "federal",
    "Establishes the rule: a CDBG activity must meet a national objective.",
  ),
  s(
    "cdbg-hud-guidance",
    "U.S. Department of Housing and Urban Development, Office of Community Planning and Development, \"Guide to National Objectives and Eligible Activities for Entitlement Communities,\" chap. 3, https://www.hudexchange.info/programs/cdbg-entitlement/.",
    "HUD Office of Community Planning and Development (HUD Exchange)",
    "https://www.hudexchange.info/programs/cdbg-entitlement/",
    "federal",
    "Interprets the rule: how HUD expects the area benefit test to be documented.",
  ),
  s(
    "cdbg-tulsa-conplan",
    "City of Tulsa, \"Consolidated Plan 2025–2029 and Citizen Participation Plan,\" Community Development Department, https://www.cityoftulsa.org/government/departments/community-development/.",
    "City of Tulsa Community Development Department",
    "https://www.cityoftulsa.org/government/departments/community-development/",
    "local",
    "Administers the rule here: Tulsa's own cycle, priorities, and public hearing steps.",
  ),
  s(
    "cdbg-ohfa-layering",
    "Oklahoma Housing Finance Agency, \"2026 Affordable Housing Tax Credit Qualified Allocation Plan,\" threshold review requirements, § [section number — placeholder, verify against the adopted plan], https://www.ohfa.org/.",
    "Oklahoma Housing Finance Agency (public trust)",
    "https://www.ohfa.org/",
    "quasi",
    "Adds a condition: if credits layer onto CDBG, OHFA's threshold review applies on top.",
  ),
  s(
    "pg-home",
    "U.S. Department of Housing and Urban Development, \"Property Standards,\" 24 C.F.R. § 92.251 (2026), https://www.ecfr.gov/current/title-24/section-92.251.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/section-92.251",
    "federal",
    "Establishes the federal property standard.",
  ),
  s(
    "pg-lihtc",
    "Internal Revenue Code, \"Low-Income Housing Credit,\" 26 U.S.C. § 42, https://www.law.cornell.edu/uscode/text/26/42.",
    "Office of the Law Revision Counsel, U.S. House of Representatives",
    "https://www.law.cornell.edu/uscode/text/26/42",
    "federal",
    "Establishes the credit and its eligibility tests.",
  ),
  s(
    "st-lihtc",
    "Oklahoma Affordable Housing Act, Okla. Stat. tit. 68, § 2357.403, https://law.justia.com/codes/oklahoma/title-68/section-68-2357-403/.",
    "Oklahoma Legislature",
    "https://law.justia.com/codes/oklahoma/title-68/section-68-2357-403/",
    "state",
    "State statute creating the Oklahoma credit layered beneath the federal one.",
  ),
  s(
    "pg-usda515",
    "USDA Rural Development, \"Direct Multi-Family Housing Loans and Grants,\" 7 C.F.R. pt. 3560 (2026), https://www.ecfr.gov/current/title-7/part-3560.",
    "USDA Rural Development",
    "https://www.ecfr.gov/current/title-7/part-3560",
    "federal",
    "Establishes the Section 515 program requirements.",
  ),
  s(
    "pg-tif",
    "Oklahoma Local Development Act, Okla. Stat. tit. 62, § 853, https://law.justia.com/codes/oklahoma/title-62/section-62-853/.",
    "Oklahoma Legislature",
    "https://law.justia.com/codes/oklahoma/title-62/section-62-853/",
    "state",
    "State authorization for increment financing.",
  ),
  s(
    "pg-htf",
    "City of Tulsa, \"Affordable Housing Trust Fund Program Guidelines,\" § 4.2 [section — placeholder, verify against the adopted guidelines], 2025, https://www.cityoftulsa.org/.",
    "City of Tulsa",
    "https://www.cityoftulsa.org/",
    "local",
    "Local guidelines that govern awards.",
  ),
  s(
    "qg-tha",
    "Tulsa Housing Authority, \"Admissions and Continued Occupancy Policy,\" https://www.tulsahousing.org/.",
    "Tulsa Housing Authority (public housing authority)",
    "https://www.tulsahousing.org/",
    "quasi",
    "Adds occupancy conditions where authority-assisted units are involved.",
  ),

  s(
    "ch-cdbg",
    "U.S. Department of Housing and Urban Development, \"Citizen Participation Plan; Local Governments,\" 24 C.F.R. § 570.301 (2026), https://www.ecfr.gov/current/title-24/section-570.301.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/section-570.301",
    "federal",
    "Requires the local citizen participation process.",
  ),
  s(
    "ch-lihtc",
    "Oklahoma Housing Finance Agency, \"2026 Qualified Allocation Plan,\" https://www.ohfa.org/; see also 26 U.S.C. § 42(m).",
    "Oklahoma Housing Finance Agency (public trust)",
    "https://www.ohfa.org/",
    "quasi",
    "Scores and allocates the credit in Oklahoma.",
  ),
  s(
    "ch-home",
    "U.S. Department of Housing and Urban Development, \"Qualification as Affordable Housing: Rental Housing,\" 24 C.F.R. § 92.252 (2026), https://www.ecfr.gov/current/title-24/section-92.252.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/section-92.252",
    "federal",
    "Sets rent and occupancy limits.",
  ),
  s(
    "ch-usda",
    "USDA Rural Development, \"Eligible Rural Areas,\" 7 C.F.R. § 3560.11 (2026), https://www.ecfr.gov/current/title-7/section-3560.11.",
    "USDA Rural Development",
    "https://www.ecfr.gov/current/title-7/section-3560.11",
    "federal",
    "Defines the rural area test.",
  ),
  s(
    "ch-tif",
    "Oklahoma Local Development Act, Okla. Stat. tit. 62, § 854, https://law.justia.com/codes/oklahoma/title-62/section-62-854/.",
    "Oklahoma Legislature",
    "https://law.justia.com/codes/oklahoma/title-62/section-62-854/",
    "state",
    "State procedure for adopting a project plan.",
  ),
  s(
    "ch-fema",
    "U.S. Department of Housing and Urban Development, \"Decision Making Process,\" 24 C.F.R. § 55.20 (2026), https://www.ecfr.gov/current/title-24/section-55.20.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/section-55.20",
    "federal",
    "Eight-step floodplain decision process.",
  ),
  s(
    "ch-zoning",
    "City of Tulsa, Zoning Code, Title 42, Chapter 5, \"Residential Districts,\" amended 2025, https://www.tulsaplanning.org/zoning-code/.",
    "City of Tulsa Planning Office (INCOG)",
    "https://www.tulsaplanning.org/zoning-code/",
    "local",
    "Local district standards.",
  ),
  s(
    "ch-oz",
    "Internal Revenue Code, \"Special Rules for Capital Gains Invested in Opportunity Zones,\" 26 U.S.C. § 1400Z-2, https://www.law.cornell.edu/uscode/text/26/1400Z-2.",
    "Office of the Law Revision Counsel, U.S. House of Representatives",
    "https://www.law.cornell.edu/uscode/text/26/1400Z-2",
    "federal",
    "Federal deferral and exclusion rules.",
  ),
  s(
    "ch-htf",
    "City of Tulsa, \"Affordable Housing Trust Fund Guidelines,\" 2025, https://www.cityoftulsa.org/.",
    "City of Tulsa",
    "https://www.cityoftulsa.org/",
    "local",
    "Local award terms and scoring tiers.",
  ),
  s(
    "ch-index",
    "Collective Impact, \"Source Index,\" internal reference library, 2026, https://www.ecfr.gov/.",
    "Collective Impact",
    "https://www.ecfr.gov/",
    "local",
    "Internal index of the sources above.",
  ),

  s(
    "rp-conplan",
    "City of Tulsa, \"Consolidated Plan 2025–2029,\" https://www.cityoftulsa.org/.",
    "City of Tulsa Community Development Department",
    "https://www.cityoftulsa.org/",
    "local",
    "Local plan that sets the annual cycle.",
  ),
  s(
    "rp-part58",
    "U.S. Department of Housing and Urban Development, \"Environmental Review Procedures for Entities Assuming HUD Environmental Responsibilities,\" 24 C.F.R. pt. 58 (2026), https://www.ecfr.gov/current/title-24/part-58.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/part-58",
    "federal",
    "Federal environmental review requirement.",
  ),
  s(
    "rp-qap-cycle",
    "Oklahoma Housing Finance Agency, \"2026 Affordable Housing Tax Credit Application Cycle Calendar,\" https://www.ohfa.org/.",
    "Oklahoma Housing Finance Agency (public trust)",
    "https://www.ohfa.org/",
    "quasi",
    "Sets the state allocation round dates.",
  ),

  s(
    "ul-section8-il",
    "U.S. Department of Housing and Urban Development, Office of Policy Development and Research, \"FY 2026 Income Limits Documentation System: Tulsa, OK HUD Metro FMR Area,\" effective April 1, 2026, https://www.huduser.gov/portal/datasets/il.html.",
    "U.S. Department of Housing and Urban Development",
    "https://www.huduser.gov/portal/datasets/il.html",
    "federal",
    "Publishes the Section 8 income limits that CDBG and most local programs read from.",
  ),
  s(
    "ul-mtsp",
    "U.S. Department of Housing and Urban Development, \"FY 2026 Multifamily Tax Subsidy Project Income Limits,\" effective April 1, 2026, https://www.huduser.gov/portal/datasets/mtsp.html.",
    "U.S. Department of Housing and Urban Development",
    "https://www.huduser.gov/portal/datasets/mtsp.html",
    "federal",
    "The separate limit series that governs Low-Income Housing Tax Credit units.",
  ),
  s(
    "ul-home-rent",
    "U.S. Department of Housing and Urban Development, \"HOME Rent Limits, 2026,\" HUD Exchange, https://www.hudexchange.info/programs/home/home-rent-limits/.",
    "HUD Office of Community Planning and Development (HUD Exchange)",
    "https://www.hudexchange.info/programs/home/home-rent-limits/",
    "federal",
    "HOME High and Low rents, published as their own schedule.",
  ),
  s(
    "ul-usda-il",
    "USDA Rural Development, \"Multi-Family Housing Income Limits,\" 7 C.F.R. § 3560.152, https://www.rd.usda.gov/programs-services/multifamily-housing-programs.",
    "USDA Rural Development",
    "https://www.rd.usda.gov/programs-services/multifamily-housing-programs",
    "federal",
    "Sets the very low- and low-income tests for Section 515 tenancy.",
  ),
  s(
    "ul-htf-limits",
    "City of Tulsa, \"Affordable Housing Trust Fund Program Guidelines,\" income targeting table [table number — placeholder, verify against the adopted guidelines], 2025, https://www.cityoftulsa.org/.",
    "City of Tulsa",
    "https://www.cityoftulsa.org/",
    "local",
    "Local targeting band applied on top of the federal schedule.",
  ),
  s(
    "ul-fmr",
    "U.S. Department of Housing and Urban Development, \"FY 2026 Fair Market Rent Documentation System: Tulsa, OK HUD Metro FMR Area,\" effective October 1, 2025, https://www.huduser.gov/portal/datasets/fmr.html.",
    "U.S. Department of Housing and Urban Development",
    "https://www.huduser.gov/portal/datasets/fmr.html",
    "federal",
    "Federal rent benchmark from which the local authority sets its standard.",
  ),
  s(
    "ul-tha-ps",
    "Tulsa Housing Authority, \"Housing Choice Voucher Payment Standards,\" effective January 1, 2026, https://www.tulsahousing.org/.",
    "Tulsa Housing Authority (public housing authority)",
    "https://www.tulsahousing.org/",
    "quasi",
    "The figure the authority will actually pay, which may sit above or below the federal FMR.",
  ),
  s(
    "ul-tha-ua",
    "Tulsa Housing Authority, \"Utility Allowance Schedule,\" HUD Form 52667, effective January 1, 2026, https://www.tulsahousing.org/.",
    "Tulsa Housing Authority (public housing authority)",
    "https://www.tulsahousing.org/",
    "quasi",
    "Determines how much of the gross rent limit the owner may actually collect.",
  ),

  s(
    "ra-hcv",
    "U.S. Department of Housing and Urban Development, \"Section 8 Housing Choice Voucher Program,\" 24 C.F.R. pt. 982, administered locally by the Tulsa Housing Authority, https://www.tulsahousing.org/.",
    "Tulsa Housing Authority (public housing authority)",
    "https://www.tulsahousing.org/",
    "quasi",
    "The authority administers the tenant-based subsidy and sets the payment standard.",
  ),
  s(
    "ra-pbv",
    "U.S. Department of Housing and Urban Development, \"Project-Based Voucher Program,\" 24 C.F.R. pt. 983, https://www.hud.gov/program_offices/public_indian_housing/programs/hcv/project.",
    "U.S. Department of Housing and Urban Development",
    "https://www.hud.gov/program_offices/public_indian_housing/programs/hcv/project",
    "federal",
    "Federal rule establishing unit-attached subsidy and its contract terms.",
  ),
  s(
    "ra-esg",
    "U.S. Department of Housing and Urban Development, \"Emergency Solutions Grants Program,\" 24 C.F.R. pt. 576, rapid re-housing component, HUD Exchange, https://www.hudexchange.info/programs/esg/.",
    "HUD Office of Community Planning and Development (HUD Exchange)",
    "https://www.hudexchange.info/programs/esg/",
    "federal",
    "Establishes rapid re-housing assistance; the city and Continuum of Care administer it locally.",
  ),
  s(
    "ra-liheap",
    "Oklahoma Department of Human Services, \"Low Income Home Energy Assistance Program,\" state plan, https://oklahoma.gov/okdhs/services/liheap.html.",
    "Oklahoma Department of Human Services",
    "https://oklahoma.gov/okdhs/services/liheap.html",
    "state",
    "State agency administering the federal energy assistance block grant.",
  ),
  s(
    "ra-deposit",
    "Restore Hope Ministries, \"Rental and Deposit Assistance,\" program page [terms not verified — placeholder], https://www.restorehope.org/.",
    "Restore Hope Ministries (local nonprofit partner)",
    "https://www.restorehope.org/",
    "local",
    "Locally administered move-in assistance; terms are not yet loaded.",
  ),
  s(
    "ra-supportive",
    "Oklahoma Department of Mental Health and Substance Abuse Services, \"Permanent Supportive Housing,\" services funding [allocation not verified — placeholder], https://oklahoma.gov/odmhsas.html.",
    "Oklahoma Department of Mental Health and Substance Abuse Services",
    "https://oklahoma.gov/odmhsas.html",
    "state",
    "State service dollars that accompany, but do not replace, rent subsidy.",
  ),
  s(
    "hb-ohfa",
    "Oklahoma Housing Finance Agency, \"Homebuyer Downpayment Assistance,\" program term sheet [assistance percentage not verified — placeholder], https://www.ohfa.org/homebuyers/.",
    "Oklahoma Housing Finance Agency",
    "https://www.ohfa.org/homebuyers/",
    "quasi",
    "State finance agency setting purchase price limits and assistance terms.",
  ),
  s(
    "hb-tulsa-home",
    "U.S. Department of Housing and Urban Development, \"Homeownership: Resale and Recapture Provisions,\" 24 C.F.R. § 92.254(a)(5), as implemented by the City of Tulsa, https://www.cityoftulsa.org/.",
    "City of Tulsa Community Development Department",
    "https://www.cityoftulsa.org/",
    "local",
    "Local implementation of the federal resale or recapture requirement.",
  ),
  s(
    "hb-fhlb",
    "Federal Home Loan Bank of Topeka, \"Homeownership Set-aside Programs,\" member bank guide [per-household amount not verified — placeholder], https://www.fhlbtopeka.com/products-services/homeownership-set-aside-programs.",
    "Federal Home Loan Bank of Topeka",
    "https://www.fhlbtopeka.com/products-services/homeownership-set-aside-programs",
    "quasi",
    "Set-aside funds distributed through member banks, subject to a retention agreement.",
  ),
  s(
    "hb-nonprofit",
    "Habitat for Humanity, \"Homeownership Program,\" affiliate terms [covenant terms not verified — placeholder], https://www.habitat.org/.",
    "Habitat for Humanity (nonprofit provider)",
    "https://www.habitat.org/",
    "local",
    "Nonprofit provider with its own resale covenant.",
  ),

  s(
    "ov-tif-36th",
    "Tulsa Development Authority, \"36th Street North & Peoria Increment District Project Plan,\" boundary exhibit [district number — placeholder, verify with TDA], https://www.tulsadevelopmentauthority.org/.",
    "Tulsa Development Authority",
    "https://www.tulsadevelopmentauthority.org/",
    "quasi",
    "Second active increment district, administered separately from downtown.",
  ),
  s(
    "ov-dda",
    "U.S. Department of Housing and Urban Development, Office of Policy Development and Research, \"Difficult Development Areas,\" 2026 designations, https://www.huduser.gov/portal/datasets/qct.html.",
    "U.S. Department of Housing and Urban Development",
    "https://www.huduser.gov/portal/datasets/qct.html",
    "federal",
    "Federal designation carrying the same 30% basis boost as a QCT.",
  ),
  s(
    "ov-nmtc",
    "Community Development Financial Institutions Fund, \"New Markets Tax Credit Program — Low-Income Community Census Tract Eligibility,\" 26 U.S.C. § 45D(e), https://www.cdfifund.gov/programs-training/programs/new-markets-tax-credit.",
    "U.S. Department of the Treasury, CDFI Fund",
    "https://www.cdfifund.gov/programs-training/programs/new-markets-tax-credit",
    "federal",
    "Federal statute setting the poverty and income tests for a low-income community.",
  ),
  s(
    "ov-district1",
    "City of Tulsa, \"City Council District 1 Boundary,\" adopted council district map, https://www.cityoftulsa.org/government/city-council/.",
    "City of Tulsa City Council",
    "https://www.cityoftulsa.org/government/city-council/",
    "local",
    "Council district used as the geography for local homebuyer assistance.",
  ),
  s(
    "ov-nio",
    "City of Tulsa, Zoning Code, Title 42, \"Neighborhood Infill Overlay,\" § 20.030 [section number — placeholder, verify against the adopted code], https://www.tulsaplanning.org/zoning-code/.",
    "City of Tulsa Planning Office (INCOG)",
    "https://www.tulsaplanning.org/zoning-code/",
    "local",
    "Overlay that relaxes lot, setback, and building type standards to allow more housing.",
  ),
  s(
    "ov-nco",
    "City of Tulsa, Zoning Code, Title 42, \"Neighborhood Character Overlay,\" § 20.040 [section number — placeholder, verify against the adopted code], https://www.tulsaplanning.org/zoning-code/.",
    "City of Tulsa Planning Office (INCOG)",
    "https://www.tulsaplanning.org/zoning-code/",
    "local",
    "Overlay protecting an established neighborhood pattern and scale.",
  ),
  s(
    "ov-hp",
    "City of Tulsa, Zoning Code, Title 42, \"Historic Preservation Overlay,\" § 20.050 [section number — placeholder, verify against the adopted code], administered by the Tulsa Preservation Commission, https://www.tulsapreservationcommission.org/.",
    "Tulsa Preservation Commission",
    "https://www.tulsapreservationcommission.org/",
    "local",
    "Local design review of exterior changes; separate from any federal listing.",
  ),
  s(
    "pg-htc",
    "National Park Service, \"Historic Preservation Certifications,\" 36 C.F.R. pt. 67, and Internal Revenue Code, 26 U.S.C. § 47, https://www.nps.gov/subjects/taxincentives/index.htm.",
    "National Park Service / Internal Revenue Service",
    "https://www.nps.gov/subjects/taxincentives/index.htm",
    "federal",
    "Federal rehabilitation credit; requires certification, which local overlay status does not provide.",
  ),
  s(
    "st-shpo",
    "Oklahoma State Historic Preservation Office, \"Federal Rehabilitation Tax Credit — Part 1 Evaluation of Significance,\" https://www.okhistory.org/shpo/.",
    "Oklahoma State Historic Preservation Office",
    "https://www.okhistory.org/shpo/",
    "state",
    "State office that reviews certification applications before they reach the Park Service.",
  ),
  s(
    "cb-acs-poverty",
    "U.S. Census Bureau, \"American Community Survey 5-Year Estimates, Table S1701: Poverty Status in the Past 12 Months,\" Tulsa County tracts, https://data.census.gov/.",
    "U.S. Census Bureau",
    "https://data.census.gov/",
    "federal",
    "The measured poverty rate behind the 20% NMTC test.",
  ),
  s(
    "cb-acs-mfi",
    "U.S. Census Bureau, \"American Community Survey 5-Year Estimates, Table B19113: Median Family Income,\" Tulsa County tracts, https://data.census.gov/.",
    "U.S. Census Bureau",
    "https://data.census.gov/",
    "federal",
    "Tract median family income compared with the area median.",
  ),
  s(
    "cb-acs-unemp",
    "U.S. Census Bureau, \"American Community Survey 5-Year Estimates, Table S2301: Employment Status,\" Tulsa County tracts, https://data.census.gov/.",
    "U.S. Census Bureau",
    "https://data.census.gov/",
    "federal",
    "Unemployment measure used in distress and targeted-population screens.",
  ),
  s(
    "cb-nmtc",
    "Community Development Financial Institutions Fund, \"NMTC Low-Income Community Census Tract Mapping Tool,\" current ACS release, https://www.cdfifund.gov/mapping-system.",
    "U.S. Department of the Treasury, CDFI Fund",
    "https://www.cdfifund.gov/mapping-system",
    "federal",
    "The Fund's determination of which tracts pass either test in the current release.",
  ),
  s(
    "cs-ttown",
    "City of Tulsa, \"T-Town Catalog: Pre-Approved Building Plans\" [catalog contents, administering body, and permitting benefit not verified — confirm with the City of Tulsa Planning Office], https://www.cityoftulsa.org/.",
    "City of Tulsa Planning Office",
    "https://www.cityoftulsa.org/",
    "local",
    "Local pre-approval of stock plans, which is what shortens plan review.",
  ),
  s(
    "cs-partnertulsa-permit",
    "PartnerTulsa, \"Development permitting assistance\" [scope of assistance not verified — confirm with PartnerTulsa], https://partnertulsa.org/.",
    "PartnerTulsa",
    "https://partnertulsa.org/",
    "quasi",
    "Quasi-governmental navigation help through the municipal permitting process.",
  ),
  s(
    "pg-brownfields",
    "U.S. Environmental Protection Agency, \"Brownfields Assessment, Revolving Loan Fund, and Cleanup Grants,\" Small Business Liability Relief and Brownfields Revitalization Act, 42 U.S.C. \u00a7 9604(k), https://www.epa.gov/brownfields.",
    "U.S. Environmental Protection Agency",
    "https://www.epa.gov/brownfields",
    "federal",
    "Federal authority and eligible-use rules for assessment and cleanup grants.",
  ),
  s(
    "lo-partnertulsa-bf",
    "PartnerTulsa, \"Brownfields program \u2014 local administration and intake\" [staff contact, intake process, and coverage area not verified \u2014 confirm with PartnerTulsa], https://partnertulsa.org/.",
    "PartnerTulsa",
    "https://partnertulsa.org/",
    "quasi",
    "The body that actually runs intake and reimbursement locally, rather than EPA.",
  ),
  s(
    "lo-cdbg-meeting",
    "City of Tulsa, \"Annual CDBG application meeting notice\" [meeting date, format, and whether attendance is a strict prerequisite not verified \u2014 confirm with the Community Development Department], https://www.cityoftulsa.org/.",
    "City of Tulsa Community Development Department",
    "https://www.cityoftulsa.org/",
    "local",
    "Local gate: the posted meeting that precedes the application round.",
  ),
  s(
    "lo-cdbg-review",
    "City of Tulsa, \"CDBG citizen review and funding recommendation process\" [composition of the review body and scoring method not verified \u2014 confirm with the Community Development Department], https://www.cityoftulsa.org/.",
    "City of Tulsa Community Development Department",
    "https://www.cityoftulsa.org/",
    "local",
    "Who reads and scores the application once it is filed.",
  ),
  s(
    "og-chdo",
    "Community Housing Development Organization definition, 24 C.F.R. \u00a7 92.2 (HOME Investment Partnerships Program), https://www.ecfr.gov/current/title-24/part-92.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/part-92",
    "federal",
    "Federal definition of the nonprofit designation, including board and capacity tests.",
  ),
  s(
    "og-chdo-setaside",
    "Set-aside for community housing development organizations, 24 C.F.R. \u00a7 92.300 [minimum percentage not verified against the current text \u2014 confirm before publishing], https://www.ecfr.gov/current/title-24/part-92.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/part-92",
    "federal",
    "The reserved share of a Participating Jurisdiction's HOME allocation. HOME only \u2014 not CDBG.",
  ),
  s(
    "og-chdo-pj",
    "City of Tulsa, \"HOME Participating Jurisdiction \u2014 CHDO certification and reserve\" [local certification process and round schedule not verified \u2014 confirm with the Community Development Department], https://www.cityoftulsa.org/.",
    "City of Tulsa Community Development Department",
    "https://www.cityoftulsa.org/",
    "local",
    "The jurisdiction that actually certifies a CHDO and administers the reserve.",
  ),
  s(
    "og-chdo-roles",
    "Owner, developer, and sponsor \u2014 definitions applicable to community housing development organizations, 24 C.F.R. \u00a7 92.300(a) and \u00a7 92.2, https://www.ecfr.gov/current/title-24/part-92.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/part-92",
    "federal",
    "The three distinct CHDO roles in a deal, each with different control and ownership consequences.",
  ),
  s(
    "og-chdo-directory",
    "City of Tulsa, \"Certified CHDOs \u2014 current list maintained by the Participating Jurisdiction\" [organization list not verified \u2014 confirm the current roster with the Community Development Department], https://www.cityoftulsa.org/.",
    "City of Tulsa Community Development Department",
    "https://www.cityoftulsa.org/",
    "local",
    "The PJ maintains the roster of certified CHDOs; it is the practical starting point for finding a partner.",
  ),
  s(
    "og-chdo-capacity",
    "Community housing development organization capacity and board composition requirements, 24 C.F.R. \u00a7 92.2 (definition, paragraphs on board representation and demonstrated capacity), https://www.ecfr.gov/current/title-24/part-92.",
    "U.S. Department of Housing and Urban Development",
    "https://www.ecfr.gov/current/title-24/part-92",
    "federal",
    "Board composition and staff capacity tests a nonprofit must document to be certified.",
  ),
  s(
    "og-501c3",
    "Exemption from tax on corporations, certain trusts, etc., 26 U.S.C. \u00a7 501(c)(3), https://www.irs.gov/charities-non-profits/charitable-organizations.",
    "Internal Revenue Service",
    "https://www.irs.gov/charities-non-profits/charitable-organizations",
    "federal",
    "Tax-exempt status relied on by nonprofit eligibility lanes, including Brownfields.",
  ),
  s(
    "og-cdfi",
    "Community Development Financial Institutions Program certification, 12 C.F.R. Part 1805, https://www.cdfifund.gov/programs-training/certification/cdfi.",
    "CDFI Fund, U.S. Department of the Treasury",
    "https://www.cdfifund.gov/programs-training/certification/cdfi",
    "federal",
    "Certification standard for community development lenders and investors.",
  ),
  s(
    "og-cde",
    "New Markets Tax Credit \u2014 qualified community development entity, 26 U.S.C. \u00a7 45D(c), https://www.cdfifund.gov/programs-training/programs/new-markets-tax-credit.",
    "CDFI Fund, U.S. Department of the Treasury",
    "https://www.cdfifund.gov/programs-training/programs/new-markets-tax-credit",
    "federal",
    "Entity status required to hold and place a New Markets allocation.",
  ),
  s(
    "og-pha",
    "Tulsa Housing Authority, agency status and development partnerships, under the U.S. Housing Act of 1937 and 24 C.F.R. Part 903 [partnership terms not verified], https://www.tulsahousing.org/.",
    "Tulsa Housing Authority",
    "https://www.tulsahousing.org/",
    "quasi",
    "The local authority through which voucher and public-housing resources reach a project.",
  ),
  s(
    "og-tribal",
    "Native American Housing Assistance and Self-Determination Act, 25 U.S.C. \u00a7 4101 et seq., https://www.hud.gov/program_offices/public_indian_housing/ih.",
    "U.S. Department of Housing and Urban Development, Office of Native American Programs",
    "https://www.hud.gov/program_offices/public_indian_housing/ih",
    "federal",
    "Funding track reserved to tribes and tribally designated housing entities.",
  ),
  s(
    "og-clg",
    "Certified Local Government program, 54 U.S.C. \u00a7 302501, administered in Oklahoma by the State Historic Preservation Office, https://www.okhistory.org/shpo/.",
    "Oklahoma State Historic Preservation Office",
    "https://www.okhistory.org/shpo/",
    "state",
    "Certification held by the jurisdiction that shapes local historic review and pass-through grants.",
  ),
  s(
    "og-experience",
    "Oklahoma Housing Finance Agency, Qualified Allocation Plan \u2014 developer experience and financial capacity thresholds [current unit counts, net worth, and liquidity minimums not verified \u2014 confirm against the current plan], https://www.ohfa.org/.",
    "Oklahoma Housing Finance Agency",
    "https://www.ohfa.org/",
    "quasi",
    "Funder-set qualification floors that bind regardless of tax status.",
  ),
  s(
    "ta-hpn-accelerator",
    "Housing Partnership Network, \"Developer Accelerator\" \u2014 no-cost training cohort for emerging affordable housing developers [current cohort schedule, eligibility, and Tulsa availability not verified \u2014 confirm with the program], https://housingpartnership.net/.",
    "Housing Partnership Network",
    "https://housingpartnership.net/",
    "quasi",
    "Free capacity building that substitutes for paid application coaching.",
  ),
  s(
    "ta-tedc-education",
    "Tulsa Economic Development Corporation, developer education and technical assistance programming [course list, cost, and schedule not verified \u2014 confirm with TEDC], https://tedcnet.com/.",
    "Tulsa Economic Development Corporation",
    "https://tedcnet.com/",
    "quasi",
    "Local no-cost education on financing and predevelopment.",
  ),
  s(
    "ta-shpo-staff",
    "Oklahoma State Historic Preservation Office, pre-submission review assistance for federal rehabilitation tax credit applications [extent of staff review not verified \u2014 confirm with SHPO], https://www.okhistory.org/shpo/.",
    "Oklahoma State Historic Preservation Office",
    "https://www.okhistory.org/shpo/",
    "state",
    "Free state staff review of draft Part 1 and Part 2 material before submission.",
  ),
];



export const SOURCES: Record<string, Source> = Object.fromEntries(
  LIST.map((x) => [x.id, x]),
);

export function getSource(id: string): Source | null {
  return SOURCES[id] ?? null;
}
