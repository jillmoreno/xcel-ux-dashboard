/**
 * Onboarding Flow — per-brand wizard content (the standalone "Onboarding Flow"
 * prototype tile, `/onboarding-flow`).
 *
 * This is the single source of truth for what the new-user setup wizard shows,
 * across ALL FOUR brands (CRE, McKissock, Elite, STC) — goal options, license /
 * registration types, states, interests, curated interest courses, and learning
 * modalities. Every selector is keyed by `brand` AND `EducationType`
 * (Qualifying/Exam-prep vs. Continuing Education) so the same wizard can demo a
 * pre-licensing journey and a renewal journey per brand.
 *
 * The Elite (Healthcare) CE content is kept byte-for-byte compatible with the
 * previous Elite-only fixtures so the dashboard hand-off (`personaFromSetup` in
 * dashboardProgressFixtures.ts) still enriches identically.
 *
 * TODO(data): license types, state lists, interest taxonomies, and the curated
 * interest-course shelves are representative demo content authored from public
 * domain knowledge — swap for the real catalog / licensing service when wired.
 */
import type { Brand } from '@/context/AccountContext'

/**
 * Which kind of education the learner is here for.
 *
 *   - `qe`        Qualifying Education / pre-licensing — get licensed.
 *   - `exam-prep` Exam preparation as a journey in its own right.
 *   - `ce`        Continuing Education — renew / stay current.
 *
 * `exam-prep` was added for XCEL (2026-09-04), the first brand where all three
 * are distinct products. On every OTHER brand exam prep is bundled into `qe`,
 * so their `exam-prep` entries in the maps below ALIAS their `qe` value rather
 * than duplicating content — the alias is the decision, not laziness. A brand
 * only OFFERS the types listed in `EDUCATION_TYPES_BY_BRAND`, so those aliases
 * are unreachable; they exist because the maps are exhaustive.
 */
export type EducationType = 'qe' | 'exam-prep' | 'ce'

export type SetupCourseDelivery = 'online' | 'video' | 'podcast' | 'webinar' | 'in-person'

export type SetupGoalOption = {
  id: string
  /** Key into the wizard's icon registry (kept out of the data layer so this
   *  file stays component-free / react-refresh clean). */
  iconKey: string
  title: string
  caption: string
}

export type SetupCourseTileData = {
  id: string
  topic: string
  title: string
  delivery: SetupCourseDelivery
  hrs: string
  rating: number
}

export type SetupModalityOption = { id: string; iconKey: string; label: string }

/** The education types a brand supports + how each is labeled (for the demo bar
 *  QE/CE toggle). Every brand in scope supports both; the labels are brand-true
 *  (Real Estate "Pre-Licensing", Appraisal "Qualifying Ed", Healthcare "Exam
 *  Prep", Securities "Exam Prep"). */
export type EducationTypeMeta = { type: EducationType; label: string; caption: string }

const EDUCATION_TYPES_BY_BRAND: Record<Brand, EducationTypeMeta[]> = {
  cre: [
    { type: 'qe', label: 'Pre-Licensing', caption: 'Get your real estate license' },
    { type: 'ce', label: 'Continuing Ed', caption: 'Renew & stay current' },
  ],
  mckissock: [
    { type: 'qe', label: 'Qualifying Ed', caption: 'Become / advance as an appraiser' },
    { type: 'ce', label: 'Continuing Ed', caption: 'USPAP & renewal CE' },
  ],
  elite: [
    { type: 'qe', label: 'Exam Prep', caption: 'Certification & exam prep' },
    { type: 'ce', label: 'Continuing Ed', caption: 'Renew & stay current' },
  ],
  fitzgerald: [
    { type: 'qe', label: 'Exam Prep', caption: 'NP certification prep' },
    { type: 'ce', label: 'Continuing Ed', caption: 'Renew & stay current' },
  ],
  stc: [
    { type: 'qe', label: 'Exam Prep', caption: 'Pass your securities exam' },
    { type: 'ce', label: 'Continuing Ed', caption: 'Regulatory & Firm Element CE' },
  ],
  // XCEL is the first brand offering all THREE — pre-licensing, exam prep and
  // CE are separate products here. The labels are the site's own ("Study Tools
  // & Reviews" is its marketing name for the exam-prep set).
  xcel: [
    { type: 'qe', label: 'Pre-Licensing', caption: 'Get your insurance license' },
    { type: 'exam-prep', label: 'Exam Prep', caption: 'Study tools & reviews' },
    { type: 'ce', label: 'Continuing Ed', caption: 'Renew & stay compliant' },
  ],
}

export function educationTypesFor(brand: Brand): EducationTypeMeta[] {
  return EDUCATION_TYPES_BY_BRAND[brand] ?? EDUCATION_TYPES_BY_BRAND.elite
}

export function educationTypeLabel(brand: Brand, type: EducationType): string {
  return educationTypesFor(brand).find((t) => t.type === type)?.label ?? 'Continuing Ed'
}

/** The brand's default education type on first entry. */
export function defaultEducationType(brand: Brand): EducationType {
  // STC's flagship journey is exam prep and XCEL's is pre-licensing; everyone
  // else defaults to renewal (CE).
  return brand === 'stc' || brand === 'xcel' ? 'qe' : 'ce'
}

/**
 * Every brand except XCEL bundles exam preparation INTO its qualifying-education
 * product, so their `exam-prep` content is an ALIAS of their `qe` content
 * rather than a second authored set. That is the decision, made once here
 * instead of restated in eighteen map entries — and those aliases are
 * unreachable anyway, because a brand only offers the types listed in
 * `EDUCATION_TYPES_BY_BRAND`.
 *
 * `overrides` is for the brand that DOES sell exam prep separately.
 */
type ByQeCe<T> = Record<Brand, { qe: T; ce: T }>
function withExamPrep<T>(
  byQeCe: ByQeCe<T>,
  overrides: Partial<Record<Brand, T>> = {},
): Record<Brand, Record<EducationType, T>> {
  return Object.fromEntries(
    (Object.keys(byQeCe) as Brand[]).map((b) => [
      b,
      { ...byQeCe[b], 'exam-prep': overrides[b] ?? byQeCe[b].qe },
    ]),
  ) as Record<Brand, Record<EducationType, T>>
}

/* ─── Goal step ──────────────────────────────────────────────────────────── */

const GOALS = withExamPrep<SetupGoalOption[]>({
  cre: {
    qe: [
      { id: 'get-licensed', iconKey: 'renew', title: 'Get my license', caption: 'Complete pre-licensing' },
      { id: 'exam-prep', iconKey: 'award', title: 'Pass the licensing exam', caption: 'Exam prep & practice' },
      { id: 'post-license', iconKey: 'refresh', title: 'Post-license education', caption: 'First-renewal requirement' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
    ],
    ce: [
      { id: 'renew', iconKey: 'renew', title: 'Renew my license', caption: 'Track CE hours & deadline' },
      { id: 'upgrade', iconKey: 'award', title: 'Upgrade to broker', caption: 'Broker pre-licensing' },
      { id: 'ce', iconKey: 'refresh', title: 'Stay current with CE', caption: 'Keep up your requirements' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
    ],
  },
  mckissock: {
    qe: [
      { id: 'become-appraiser', iconKey: 'renew', title: 'Become an appraiser', caption: 'Qualifying education hours' },
      { id: 'advance-level', iconKey: 'award', title: 'Advance my level', caption: 'Trainee → Certified' },
      { id: 'exam-prep', iconKey: 'refresh', title: 'Prep for the exam', caption: 'National exam prep' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
    ],
    ce: [
      { id: 'renew', iconKey: 'renew', title: 'Renew my license', caption: 'Track CE hours & deadline' },
      { id: 'uspap', iconKey: 'award', title: 'Complete USPAP', caption: '7-Hour National Update' },
      { id: 'ce', iconKey: 'refresh', title: 'Stay current with CE', caption: 'Keep up your requirements' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
    ],
  },
  elite: {
    qe: [
      { id: 'certification', iconKey: 'award', title: 'Earn a certification', caption: 'CCRN · CEN · PCCN' },
      { id: 'exam-prep', iconKey: 'renew', title: 'Prep for my exam', caption: 'Review & practice' },
      { id: 'ce', iconKey: 'refresh', title: 'Stay current with CE', caption: 'Keep up your requirements' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the library' },
    ],
    ce: [
      { id: 'renew', iconKey: 'renew', title: 'Renew my license', caption: 'Track CE hours & deadline' },
      { id: 'certification', iconKey: 'award', title: 'Earn a certification', caption: 'CCRN · CEN · PCCN' },
      { id: 'ce', iconKey: 'refresh', title: 'Stay current with CE', caption: 'Keep up your requirements' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the library' },
    ],
  },
  fitzgerald: {
    qe: [
      { id: 'np-cert', iconKey: 'award', title: 'Pass my NP boards', caption: 'FNP · AGNP · PMHNP' },
      { id: 'exam-prep', iconKey: 'renew', title: 'Certification review', caption: 'Live & on-demand review' },
      { id: 'ce', iconKey: 'refresh', title: 'Stay current with CE', caption: 'Keep up your requirements' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the library' },
    ],
    ce: [
      { id: 'renew', iconKey: 'renew', title: 'Renew my certification', caption: 'Track CE hours & deadline' },
      { id: 'np-cert', iconKey: 'award', title: 'Recertify', caption: 'Continued competency' },
      { id: 'ce', iconKey: 'refresh', title: 'Stay current with CE', caption: 'Keep up your requirements' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the library' },
    ],
  },
  stc: {
    qe: [
      { id: 'pass-exam', iconKey: 'award', title: 'Pass my securities exam', caption: 'SIE · Series 7 · 63/65/66' },
      { id: 'get-licensed', iconKey: 'renew', title: 'Get licensed (SIE)', caption: 'Start your registration' },
      { id: 'advance', iconKey: 'refresh', title: 'Advance my registration', caption: 'Principal & specialty exams' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
    ],
    ce: [
      { id: 'ce', iconKey: 'renew', title: 'Complete my CE', caption: 'Regulatory & Firm Element' },
      { id: 'maintain', iconKey: 'award', title: 'Maintain my registration', caption: 'Stay in good standing' },
      { id: 'refresh', iconKey: 'refresh', title: 'Refresh a topic', caption: 'Targeted micro-courses' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
    ],
  },
  xcel: {
    qe: [
      { id: 'get-licensed', iconKey: 'renew', title: 'Get my license', caption: 'Complete pre-license education' },
      { id: 'add-line', iconKey: 'award', title: 'Add a line of authority', caption: 'L&H · P&C · Personal Lines' },
      { id: 'switch-state', iconKey: 'refresh', title: 'Get licensed in another state', caption: 'Meet a new state requirement' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
    ],
    ce: [
      { id: 'ce', iconKey: 'renew', title: 'Complete my CE', caption: 'Renew your producer license' },
      { id: 'initial-training', iconKey: 'award', title: 'Finish required training', caption: 'Annuity · long-term care · flood' },
      { id: 'refresh', iconKey: 'refresh', title: 'Refresh a topic', caption: 'Targeted refresher training' },
      { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
    ],
  },
}, {
  // XCEL's exam-prep goals are its own — a candidate reaching Parts 2–3 of the
  // 3-Part Program has already done the pre-license education.
  xcel: [
    { id: 'pass-exam', iconKey: 'award', title: 'Pass my state exam', caption: 'Simulators & review' },
    { id: 'exam-soon', iconKey: 'renew', title: 'My exam is booked', caption: 'Get ready in the time left' },
    { id: 'retake', iconKey: 'refresh', title: 'Retake my exam', caption: 'Target what I missed' },
    { id: 'explore', iconKey: 'compass', title: 'Just exploring', caption: 'Browse the catalog' },
  ],
})

/** Goal options for the setup wizard's first step (single-select tiles). */
export function goalOptionsFor(brand: Brand, type: EducationType): SetupGoalOption[] {
  return GOALS[brand]?.[type] ?? GOALS.elite[type]
}

/** The brand/profession's goal question. */
export function goalQuestionFor(brand: Brand): string {
  switch (brand) {
    case 'cre':
    case 'mckissock':
      return 'What is your goal?'
    case 'stc':
    case 'xcel':
      return 'What are you preparing for?'
    default:
      return 'What are you working toward?'
  }
}

/* ─── License step ───────────────────────────────────────────────────────── */

const LICENSE_TYPES = withExamPrep<string[]>({
  cre: {
    qe: ['Salesperson', 'Broker'],
    ce: ['Salesperson', 'Broker', 'Broker Associate'],
  },
  mckissock: {
    qe: ['Trainee', 'Licensed Residential', 'Certified Residential', 'Certified General'],
    ce: ['Licensed Residential', 'Certified Residential', 'Certified General'],
  },
  elite: {
    qe: ['RN', 'APN', 'LVN-LPN'],
    ce: ['RN', 'APN', 'LVN-LPN'],
  },
  fitzgerald: {
    qe: ['FNP', 'AGNP', 'PMHNP'],
    ce: ['FNP', 'AGNP', 'PMHNP'],
  },
  stc: {
    qe: ['SIE', 'Series 7', 'Series 63', 'Series 65', 'Series 66'],
    ce: ['Series 7', 'Series 24', 'Series 79', 'Series 99'],
  },
  // XCEL's five lines of authority (the brand file's profession axis). Exam
  // prep is aliased to `qe` here on purpose — you sit the exam for the SAME
  // line of authority you studied, so the list does not change.
  xcel: {
    qe: ['Life & Health', 'Life', 'Health', 'Property & Casualty', 'Personal Lines'],
    ce: ['Life & Health', 'Life', 'Health', 'Property & Casualty', 'Personal Lines'],
  },
})

/** License / registration type tiles for the setup wizard (profession-specific). */
export function licenseTypesFor(brand: Brand, type: EducationType): string[] {
  return LICENSE_TYPES[brand]?.[type] ?? LICENSE_TYPES.elite[type]
}

/** The noun the wizard uses for a "license" per brand (e.g. STC → "registration",
 *  Fitzgerald → "certification"). */
export function licenseNoun(brand: Brand): string {
  switch (brand) {
    case 'stc':
      return 'registration'
    case 'fitzgerald':
      return 'certification'
    default:
      return 'license'
  }
}

const STATES: Record<Brand, string[]> = {
  cre: ['California', 'Texas', 'Florida', 'Georgia', 'Colorado', 'New York', 'Illinois', 'North Carolina'],
  mckissock: ['Texas', 'Florida', 'Ohio', 'Pennsylvania', 'California', 'Georgia', 'North Carolina', 'Virginia'],
  elite: ['Florida', 'New York', 'California', 'Texas', 'Georgia', 'Illinois', 'Ohio', 'Pennsylvania'],
  fitzgerald: ['Florida', 'Georgia', 'Texas', 'California', 'New York', 'North Carolina'],
  stc: ['New York', 'Illinois', 'California', 'Texas', 'Florida', 'Massachusetts', 'New Jersey'],
  // A representative slice — XCEL licenses in all 50 states, DC and the U.S.
  // Virgin Islands; this list is the wizard's picker, not the coverage claim.
  xcel: ['Florida', 'Texas', 'California', 'Georgia', 'New York', 'Ohio', 'Pennsylvania', 'North Carolina'],
}

/** The states the learner can pick from (for the multi-state demo control). */
export function statesFor(brand: Brand): string[] {
  return STATES[brand] ?? STATES.elite
}

/** Seeded license on the account (label + default state) — drives the License
 *  step heading + the state-verification lookup link. */
export function licenseSeedFor(brand: Brand): { label: string; state: string } {
  switch (brand) {
    case 'cre':
      return { label: 'Real Estate License', state: 'California' }
    case 'mckissock':
      return { label: 'Appraiser License', state: 'Texas' }
    case 'stc':
      return { label: 'Securities Registration', state: 'New York' }
    case 'fitzgerald':
      return { label: 'NP Certification', state: 'Florida' }
    case 'xcel':
      return { label: 'Insurance Producer License', state: 'Florida' }
    default:
      return { label: 'Nursing License', state: 'New York' }
  }
}

/** State-aware license-verification lookup URL, or `null` to hide the link. */
export function licenseLookupUrl(state: string): string | null {
  const map: Record<string, string> = {
    'New York': 'https://eservices.nysed.gov/professions/verification-search',
    California: 'https://www2.dre.ca.gov/PublicASP/pplinfo.asp',
    Texas: 'https://www.trec.texas.gov/apps/license-holder-search/',
    Florida: 'https://www.myfloridalicense.com/wl11.asp',
  }
  return map[state] ?? null
}

/* ─── Interests (pills) ──────────────────────────────────────────────────── */

const INTERESTS: Record<Brand, string[]> = {
  cre: [
    'Agency Law', 'Appraisal Basics', 'Commercial', 'Contracts', 'Disclosures', 'Ethics',
    'Fair Housing', 'Finance', 'Investment', 'Marketing', 'Negotiation', 'New Construction',
    'Property Management', 'Risk Management', 'Title & Escrow',
  ],
  mckissock: [
    'Appraisal Review', 'Commercial Appraisal', 'Cost Approach', 'FHA', 'Green Building',
    'Income Approach', 'Land Valuation', 'Manufactured Housing', 'Report Writing',
    'Residential Valuation', 'Sales Comparison', 'USPAP',
  ],
  elite: [
    'Abuse', 'Acute Care', 'Acute Pain', 'Acute/Critical Care', 'Addiction', 'Adults',
    'Advanced Practice Pharmacology', 'Behavioral Health', 'Cardiac', 'Chronic Health',
    'Clinical Disorders', 'Dementia', 'Diabetes', 'Emergency', 'Ethics', 'Geriatrics',
    'Infection Control', 'Mental Health', 'Oncology', 'Pain Management', 'Pediatrics',
    'Pharmacology', "Women's Health", 'Wound Care',
  ],
  fitzgerald: [
    'Cardiology', 'Dermatology', 'Diagnostics', 'Endocrinology', 'Ethics', 'Geriatrics',
    'Pediatrics', 'Pharmacology', 'Primary Care', 'Psychiatry', "Women's Health",
  ],
  stc: [
    'AML', 'Customer Accounts', 'Debt Instruments', 'Equity Products', 'Ethics',
    'Investment Banking', 'Municipal Securities', 'Options', 'Packaged Products',
    'Regulations', 'Retirement Accounts', 'Suitability',
  ],
  xcel: [
    'Annuities', 'Auto', 'Commercial Lines', 'Disability', 'Ethics', 'Flood',
    'Health', 'Homeowners', 'Life', 'Long-Term Care', 'Medicare',
    'Personal Lines', 'Property & Casualty', 'Retirement', 'State Law',
  ],
}

/** Interest tags for the setup wizard's pill-select variant. */
export function setupInterestsFor(brand: Brand): string[] {
  return INTERESTS[brand] ?? INTERESTS.elite
}

/* ─── Curated interest-course shelf (tiles) ──────────────────────────────── */

const INTEREST_COURSES = withExamPrep<SetupCourseTileData[]>({
  cre: {
    qe: [
      { id: 'cre-qe-principles', topic: 'Pre-Licensing', title: 'Real Estate Principles', delivery: 'online', hrs: '45 hrs', rating: 4.8 },
      { id: 'cre-qe-practice', topic: 'Pre-Licensing', title: 'Real Estate Practice', delivery: 'online', hrs: '45 hrs', rating: 4.7 },
      { id: 'cre-qe-examprep', topic: 'Exam Prep', title: 'Licensing Exam Crammer', delivery: 'video', hrs: '8 hrs', rating: 4.9 },
      { id: 'cre-qe-contracts', topic: 'Contracts', title: 'Contracts & Purchase Agreements', delivery: 'online', hrs: '6 hrs', rating: 4.6 },
      { id: 'cre-qe-finance', topic: 'Finance', title: 'Real Estate Finance', delivery: 'video', hrs: '5 hrs', rating: 4.5 },
      { id: 'cre-qe-agency', topic: 'Agency', title: 'Agency Relationships', delivery: 'webinar', hrs: '3 hrs', rating: 4.6 },
    ],
    ce: [
      { id: 'cre-ce-fairhousing', topic: 'Fair Housing', title: 'Fair Housing & Anti-Discrimination', delivery: 'online', hrs: '3 CE', rating: 4.8 },
      { id: 'cre-ce-ethics', topic: 'Ethics', title: 'Ethics for Real Estate Pros', delivery: 'video', hrs: '3 CE', rating: 4.9 },
      { id: 'cre-ce-disclosures', topic: 'Disclosures', title: 'Property Disclosures Done Right', delivery: 'online', hrs: '2 CE', rating: 4.6 },
      { id: 'cre-ce-risk', topic: 'Risk', title: 'Risk Management Essentials', delivery: 'webinar', hrs: '3 CE', rating: 4.5 },
      { id: 'cre-ce-finance', topic: 'Finance', title: 'Financing Today’s Buyer', delivery: 'video', hrs: '2 CE', rating: 4.7 },
      { id: 'cre-ce-broker', topic: 'Broker', title: 'Broker Pre-Licensing Primer', delivery: 'online', hrs: '4 CE', rating: 4.4 },
    ],
  },
  mckissock: {
    qe: [
      { id: 'mck-qe-principles', topic: 'Qualifying Ed', title: 'Basic Appraisal Principles', delivery: 'online', hrs: '30 hrs', rating: 4.7 },
      { id: 'mck-qe-procedures', topic: 'Qualifying Ed', title: 'Basic Appraisal Procedures', delivery: 'online', hrs: '30 hrs', rating: 4.6 },
      { id: 'mck-qe-uspap', topic: 'USPAP', title: '15-Hour National USPAP', delivery: 'video', hrs: '15 hrs', rating: 4.8 },
      { id: 'mck-qe-residential', topic: 'Residential', title: 'Residential Market Analysis', delivery: 'online', hrs: '15 hrs', rating: 4.5 },
      { id: 'mck-qe-report', topic: 'Report Writing', title: 'Residential Report Writing', delivery: 'webinar', hrs: '15 hrs', rating: 4.6 },
      { id: 'mck-qe-sitevaluation', topic: 'Valuation', title: 'Site Valuation & Cost Approach', delivery: 'video', hrs: '15 hrs', rating: 4.4 },
    ],
    ce: [
      { id: 'mck-ce-uspap', topic: 'USPAP', title: '7-Hour National USPAP Update', delivery: 'online', hrs: '7 CE', rating: 4.9 },
      { id: 'mck-ce-income', topic: 'Income Approach', title: 'Income Approach Case Studies', delivery: 'video', hrs: '4 CE', rating: 4.7 },
      { id: 'mck-ce-fha', topic: 'FHA', title: 'FHA Appraisal Essentials', delivery: 'online', hrs: '3 CE', rating: 4.6 },
      { id: 'mck-ce-manufactured', topic: 'Housing', title: 'Appraising Manufactured Homes', delivery: 'webinar', hrs: '4 CE', rating: 4.5 },
      { id: 'mck-ce-review', topic: 'Review', title: 'Appraisal Review Fundamentals', delivery: 'video', hrs: '3 CE', rating: 4.6 },
      { id: 'mck-ce-green', topic: 'Green', title: 'Valuing Green & Energy-Efficient Homes', delivery: 'online', hrs: '3 CE', rating: 4.4 },
    ],
  },
  elite: {
    qe: [
      { id: 'elt-qe-ccrn', topic: 'Critical Care', title: 'CCRN Certification Review', delivery: 'video', hrs: '12 hrs', rating: 4.9 },
      { id: 'elt-qe-cen', topic: 'Emergency', title: 'CEN Exam Prep', delivery: 'video', hrs: '10 hrs', rating: 4.8 },
      { id: 'elt-qe-pccn', topic: 'Progressive Care', title: 'PCCN Review Course', delivery: 'online', hrs: '9 hrs', rating: 4.7 },
      { id: 'elt-qe-pharm', topic: 'Pharmacology', title: 'Pharmacology Intensive', delivery: 'online', hrs: '6 hrs', rating: 4.6 },
      { id: 'elt-qe-ecg', topic: 'Cardiac', title: 'ECG & Dysrhythmia Mastery', delivery: 'video', hrs: '5 hrs', rating: 4.7 },
      { id: 'elt-qe-practice', topic: 'Practice', title: 'Certification Practice Exams', delivery: 'online', hrs: '4 hrs', rating: 4.8 },
    ],
    ce: [
      { id: 'sic-ethics', topic: 'Ethics', title: 'Ethics & Boundaries for Nurses', delivery: 'online', hrs: '2.0 CE', rating: 4.8 },
      { id: 'sic-sepsis', topic: 'Acute/Critical Care', title: 'Sepsis Recognition & Response', delivery: 'video', hrs: '1.5 CE', rating: 4.9 },
      { id: 'sic-pharm', topic: 'Pharmacology', title: 'Pharmacology Refresher', delivery: 'online', hrs: '4.2 CE', rating: 4.7 },
      { id: 'sic-pain', topic: 'Pain Management', title: 'CE on the Go: Pain Management', delivery: 'podcast', hrs: '0.5 CE', rating: 4.9 },
      { id: 'sic-wound', topic: 'Wound Care', title: 'Wound Care Essentials', delivery: 'video', hrs: '1.5 CE', rating: 4.6 },
      { id: 'sic-infection', topic: 'Infection Control', title: '2026 Infection Control Update', delivery: 'webinar', hrs: '1.0 CE', rating: 4.5 },
    ],
  },
  fitzgerald: {
    qe: [
      { id: 'fh-qe-fnp', topic: 'FNP', title: 'FNP Certification Review', delivery: 'video', hrs: '20 hrs', rating: 4.9 },
      { id: 'fh-qe-agnp', topic: 'AGNP', title: 'AGNP Board Review', delivery: 'video', hrs: '18 hrs', rating: 4.8 },
      { id: 'fh-qe-pmhnp', topic: 'PMHNP', title: 'PMHNP Certification Review', delivery: 'online', hrs: '16 hrs', rating: 4.7 },
      { id: 'fh-qe-pharm', topic: 'Pharmacology', title: 'Advanced Pharmacology Review', delivery: 'online', hrs: '8 hrs', rating: 4.6 },
      { id: 'fh-qe-practice', topic: 'Practice', title: 'Predictor Practice Exams', delivery: 'online', hrs: '5 hrs', rating: 4.8 },
      { id: 'fh-qe-diagnostics', topic: 'Diagnostics', title: 'Diagnostic Reasoning', delivery: 'webinar', hrs: '4 hrs', rating: 4.6 },
    ],
    ce: [
      { id: 'fh-ce-pharm', topic: 'Pharmacology', title: 'Pharmacology Update', delivery: 'online', hrs: '3 CE', rating: 4.7 },
      { id: 'fh-ce-primary', topic: 'Primary Care', title: 'Primary Care Essentials', delivery: 'video', hrs: '2 CE', rating: 4.6 },
      { id: 'fh-ce-ethics', topic: 'Ethics', title: 'Ethics in Advanced Practice', delivery: 'online', hrs: '2 CE', rating: 4.8 },
      { id: 'fh-ce-derm', topic: 'Dermatology', title: 'Common Skin Conditions', delivery: 'video', hrs: '1.5 CE', rating: 4.5 },
      { id: 'fh-ce-psych', topic: 'Psychiatry', title: 'Depression & Anxiety in Primary Care', delivery: 'webinar', hrs: '2 CE', rating: 4.7 },
      { id: 'fh-ce-geriatrics', topic: 'Geriatrics', title: 'Caring for Older Adults', delivery: 'online', hrs: '1.5 CE', rating: 4.4 },
    ],
  },
  stc: {
    qe: [
      { id: 'stc-qe-sie', topic: 'SIE', title: 'SIE Exam Prep', delivery: 'online', hrs: '20 hrs', rating: 4.8 },
      { id: 'stc-qe-s7', topic: 'Series 7', title: 'Series 7 Top-Off', delivery: 'video', hrs: '40 hrs', rating: 4.9 },
      { id: 'stc-qe-s63', topic: 'Series 63', title: 'Series 63 Prep', delivery: 'online', hrs: '10 hrs', rating: 4.7 },
      { id: 'stc-qe-options', topic: 'Options', title: 'Options Strategies Deep Dive', delivery: 'video', hrs: '6 hrs', rating: 4.6 },
      { id: 'stc-qe-muni', topic: 'Municipal', title: 'Municipal Securities Deep Dive', delivery: 'online', hrs: '5 hrs', rating: 4.5 },
      { id: 'stc-qe-practice', topic: 'Practice', title: 'Adaptive Practice Exams', delivery: 'online', hrs: '8 hrs', rating: 4.9 },
    ],
    ce: [
      { id: 'stc-ce-regulatory', topic: 'Regulatory', title: 'Regulatory Element CE', delivery: 'online', hrs: '2 CE', rating: 4.7 },
      { id: 'stc-ce-firm', topic: 'Firm Element', title: 'Firm Element: Suitability', delivery: 'video', hrs: '1 CE', rating: 4.6 },
      { id: 'stc-ce-aml', topic: 'AML', title: 'Anti-Money Laundering Update', delivery: 'online', hrs: '1 CE', rating: 4.8 },
      { id: 'stc-ce-ethics', topic: 'Ethics', title: 'Ethics & Professional Conduct', delivery: 'webinar', hrs: '1 CE', rating: 4.5 },
      { id: 'stc-ce-retirement', topic: 'Retirement', title: 'Retirement Accounts Refresher', delivery: 'video', hrs: '1 CE', rating: 4.6 },
      { id: 'stc-ce-cyber', topic: 'Cybersecurity', title: 'Cybersecurity for Advisors', delivery: 'online', hrs: '1 CE', rating: 4.4 },
    ],
  },
  xcel: {
    qe: [
      { id: 'xcel-qe-lh', topic: 'Life & Health', title: 'Life & Health Pre-License Course', delivery: 'online', hrs: '40 hrs', rating: 4.8 },
      { id: 'xcel-qe-pc', topic: 'Property & Casualty', title: 'Property & Casualty Pre-License Course', delivery: 'online', hrs: '40 hrs', rating: 4.7 },
      { id: 'xcel-qe-personal', topic: 'Personal Lines', title: 'Personal Lines Pre-License Course', delivery: 'online', hrs: '20 hrs', rating: 4.6 },
      { id: 'xcel-qe-prep', topic: 'Exam Prep', title: 'Prep Review Course', delivery: 'online', hrs: '8 hrs', rating: 4.9 },
      { id: 'xcel-qe-livestream', topic: 'Exam Prep', title: 'Livestream Exam Review', delivery: 'webinar', hrs: '6 hrs', rating: 4.7 },
      { id: 'xcel-qe-cram', topic: 'Exam Prep', title: 'Exam Cram', delivery: 'video', hrs: '2 hrs', rating: 4.6 },
    ],
    ce: [
      { id: 'xcel-ce-ethics', topic: 'Ethics', title: 'Insurance Ethics', delivery: 'online', hrs: '5 CE', rating: 4.6 },
      { id: 'xcel-ce-annuity', topic: 'Annuities', title: 'Annuity Initial Training', delivery: 'online', hrs: '4 CE', rating: 4.5 },
      { id: 'xcel-ce-ltc', topic: 'Long-Term Care', title: 'Long-Term Care Initial Training', delivery: 'online', hrs: '8 CE', rating: 4.4 },
      { id: 'xcel-ce-ltc-refresh', topic: 'Long-Term Care', title: 'Long-Term Care Refresher Training', delivery: 'video', hrs: '4 CE', rating: 4.5 },
      { id: 'xcel-ce-flood', topic: 'Flood', title: 'Flood Insurance (NFIP) Training', delivery: 'online', hrs: '3 CE', rating: 4.3 },
      { id: 'xcel-ce-statelaw', topic: 'State Law', title: 'State Law & Regulations Update', delivery: 'online', hrs: '2 CE', rating: 4.4 },
    ],
  },
}, {
  // XCEL's exam-prep shelf is the study-tool set (Parts 2–3 plus the named
  // tools), not the pre-license courses.
  xcel: [
    { id: 'xcel-ep-prep', topic: 'Exam Prep', title: 'Prep Review Course', delivery: 'online', hrs: '8 hrs', rating: 4.9 },
    { id: 'xcel-ep-sim', topic: 'Exam Prep', title: 'Exam Simulators (3)', delivery: 'online', hrs: '6 hrs', rating: 4.9 },
    { id: 'xcel-ep-livestream', topic: 'Exam Prep', title: 'Livestream Exam Review', delivery: 'webinar', hrs: '6 hrs', rating: 4.7 },
    { id: 'xcel-ep-flashcards', topic: 'Exam Prep', title: '800+ Flashcards', delivery: 'online', hrs: '4 hrs', rating: 4.8 },
    { id: 'xcel-ep-lectures', topic: 'Exam Prep', title: 'On-Demand Lecture Videos', delivery: 'video', hrs: '10 hrs', rating: 4.6 },
    { id: 'xcel-ep-cram', topic: 'Exam Prep', title: 'Exam Cram', delivery: 'video', hrs: '2 hrs', rating: 4.6 },
  ],
})

/** Curated "courses of interest" shelf for the setup wizard. */
export function setupInterestCoursesFor(brand: Brand, type: EducationType): SetupCourseTileData[] {
  return INTEREST_COURSES[brand]?.[type] ?? INTEREST_COURSES.elite[type]
}

/* ─── How you learn (modalities) ─────────────────────────────────────────── */

const MODALITIES: Record<Brand, SetupModalityOption[]> = {
  cre: [
    { id: 'online', iconKey: 'online', label: 'Online' },
    { id: 'video', iconKey: 'video', label: 'Video' },
    { id: 'livestream', iconKey: 'webinar', label: 'Livestream' },
    { id: 'textbook', iconKey: 'online', label: 'Self-paced' },
    { id: 'live', iconKey: 'live', label: 'In-person' },
  ],
  mckissock: [
    { id: 'online', iconKey: 'online', label: 'Online' },
    { id: 'video', iconKey: 'video', label: 'Video' },
    { id: 'livestream', iconKey: 'webinar', label: 'Livestream' },
    { id: 'textbook', iconKey: 'online', label: 'Textbook' },
    { id: 'live', iconKey: 'live', label: 'Classroom' },
  ],
  elite: [
    { id: 'online', iconKey: 'online', label: 'Online' },
    { id: 'video', iconKey: 'video', label: 'Video' },
    { id: 'podcast', iconKey: 'podcast', label: 'Podcasts' },
    { id: 'webinar', iconKey: 'webinar', label: 'Webinars' },
    { id: 'live', iconKey: 'live', label: 'Live Q&A' },
  ],
  fitzgerald: [
    { id: 'online', iconKey: 'online', label: 'Online' },
    { id: 'video', iconKey: 'video', label: 'Video' },
    { id: 'live', iconKey: 'live', label: 'Live review' },
    { id: 'webinar', iconKey: 'webinar', label: 'Webinars' },
    { id: 'podcast', iconKey: 'podcast', label: 'Podcasts' },
  ],
  stc: [
    { id: 'online', iconKey: 'online', label: 'Online' },
    { id: 'video', iconKey: 'video', label: 'Video' },
    { id: 'live', iconKey: 'live', label: 'Live Class' },
    { id: 'practice', iconKey: 'online', label: 'Practice Exams' },
    { id: 'webinar', iconKey: 'webinar', label: 'Webinars' },
  ],
  // No podcast option — XCEL has no podcast product.
  xcel: [
    { id: 'online', iconKey: 'online', label: 'Online' },
    { id: 'video', iconKey: 'video', label: 'On-Demand Video' },
    { id: 'livestream', iconKey: 'webinar', label: 'Livestream Review' },
    { id: 'practice', iconKey: 'online', label: 'Simulators' },
    { id: 'flashcards', iconKey: 'online', label: 'Flashcards' },
  ],
}

/** Learning-modality tiles for the setup wizard (multi-select). */
export function setupModalitiesFor(brand: Brand): SetupModalityOption[] {
  return MODALITIES[brand] ?? MODALITIES.elite
}

/** The brand's welcome name for the setup hero ("Welcome to {name}"). */
export function onboardingBrandName(brand: Brand): string {
  switch (brand) {
    case 'cre':
      return 'Colibri Real Estate'
    case 'mckissock':
      return 'McKissock Learning'
    case 'elite':
      return 'Elite Learning'
    case 'fitzgerald':
      return 'Fitzgerald'
    case 'stc':
      return 'STC'
    case 'xcel':
      return 'XCEL Solutions'
    default:
      return 'your learning'
  }
}
