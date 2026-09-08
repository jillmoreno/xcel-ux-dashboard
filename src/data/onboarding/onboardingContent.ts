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
  return EDUCATION_TYPES_BY_BRAND[brand]
}

export function educationTypeLabel(brand: Brand, type: EducationType): string {
  return educationTypesFor(brand).find((t) => t.type === type)?.label ?? 'Continuing Ed'
}

/** The brand's default education type on first entry. XCEL's flagship journey
 *  is pre-licensing, so it opens on `qe` rather than on renewal. */
export function defaultEducationType(_brand: Brand): EducationType {
  return 'qe'
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
  return GOALS[brand][type]
}

/** The brand/profession's goal question. XCEL's journey starts at a licensing
 *  exam, so it asks what you are preparing FOR rather than what your goal is —
 *  the LMS asked the goal form for the real-estate brands and a generic
 *  "working toward" for the rest. Kept as a function of `brand` so a second
 *  brand re-acquires its own question here rather than at the call sites. */
export function goalQuestionFor(_brand: Brand): string {
  return 'What are you preparing for?'
}

/* ─── License step ───────────────────────────────────────────────────────── */

const LICENSE_TYPES = withExamPrep<string[]>({
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
  return LICENSE_TYPES[brand][type]
}

/** The noun the wizard uses for a "license". XCEL sells insurance producer
 *  LICENSES, so it takes the default the LMS used for every brand that was not
 *  STC ("registration") or Fitzgerald ("certification"). */
export function licenseNoun(_brand: Brand): string {
  return 'license'
}

const STATES: Record<Brand, string[]> = {
  // A representative slice — XCEL licenses in all 50 states, DC and the U.S.
  // Virgin Islands; this list is the wizard's picker, not the coverage claim.
  xcel: ['Florida', 'Texas', 'California', 'Georgia', 'New York', 'Ohio', 'Pennsylvania', 'North Carolina'],
}

/** The states the learner can pick from (for the multi-state demo control). */
export function statesFor(brand: Brand): string[] {
  return STATES[brand]
}

/** Seeded license on the account (label + default state) — drives the License
 *  step heading + the state-verification lookup link. */
export function licenseSeedFor(_brand: Brand): { label: string; state: string } {
  return { label: 'Insurance Producer License', state: 'Florida' }
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
  xcel: [
    'Annuities', 'Auto', 'Commercial Lines', 'Disability', 'Ethics', 'Flood',
    'Health', 'Homeowners', 'Life', 'Long-Term Care', 'Medicare',
    'Personal Lines', 'Property & Casualty', 'Retirement', 'State Law',
  ],
}

/** Interest tags for the setup wizard's pill-select variant. */
export function setupInterestsFor(brand: Brand): string[] {
  return INTERESTS[brand]
}

/* ─── Curated interest-course shelf (tiles) ──────────────────────────────── */

const INTEREST_COURSES = withExamPrep<SetupCourseTileData[]>({
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
  return INTEREST_COURSES[brand][type]
}

/* ─── How you learn (modalities) ─────────────────────────────────────────── */

const MODALITIES: Record<Brand, SetupModalityOption[]> = {
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
  return MODALITIES[brand]
}

/** The brand's welcome name for the setup hero ("Welcome to {name}"). */
export function onboardingBrandName(_brand: Brand): string {
  return 'XCEL Solutions'
}
