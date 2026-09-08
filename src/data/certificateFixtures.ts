// TODO(data): replace with real Certificates API integration.
// Source-of-truth Figma file: uVUMm2ZJ6YWoc9NqjTpqWb ("✅ 2.0 - Certificates").
// Brand colors are remapped to our tokens per direction — the Figma's
// McKissock gold/green is illustrative only.
import type { Brand } from '@/context/AccountContext'

/** Which tab a certificate belongs to. */
export type CertificateStatus = 'completed' | 'external' | 'action-required'

/** The kind of action a pending certificate needs before it's issued. */
export type CertActionType =
  | 'survey'
  | 'affidavit'
  | 'proctored-exam'
  | 'document'
  | 'payment'

/**
 * State reporting status for a completed certificate — how (or whether) the CE
 * credit has been reported to the licensing state. Shown on the card's
 * "Reporting Status" line.
 *   - `reported`       → "Reported {date}" (credit sent to the state on `date`).
 *   - `pending-roster` → "Pending Roster Submission" + an info tooltip.
 *   - `non-reporting`  → "{stateAbbr} is a Non-Reporting State".
 */
export type CertReporting =
  | { status: 'reported'; date: string }
  | { status: 'pending-roster' }
  | { status: 'non-reporting'; stateAbbr: string }

/** Tooltip copy shown beside a "Pending Roster Submission" reporting status. */
export const PENDING_ROSTER_TOOLTIP = [
  'Rosters are sent electronically each business day.',
  'To ensure that your CE is reported in a timely and error-free manner, your real estate license number MUST be entered in our system in the following format: ALR.######### ACG.#########',
  'Licensees are required to submit copies of their continuing education certificates with their renewal in order to receive credit for the courses that they have taken. The submission of course rosters do not replace this process.',
]

export type Certificate = {
  id: string
  /**
   * The course this certificate was issued for — the join key the course card
   * uses to derive its footer marker.
   *
   * ⚠ OPTIONAL FOR EXACTLY ONE REASON: an `external` certificate is one the
   * learner uploaded themselves, taken elsewhere, so there is no course in this
   * system to point at. Every `completed` and `action-required` certificate
   * MUST set it — without one the card falls back to showing no marker, which
   * is honest but means the certificate is invisible on the course.
   *
   * There is deliberately no title-based fallback. The two fixture sets are
   * unrelated content and the strings will never match; a fuzzy join here would
   * fail silently and look like missing data.
   */
  courseId?: string
  title: string
  /** e.g. "Appraisal Continuing Education". */
  profession: string
  /** Full state name shown in the meta row, e.g. "South Carolina". */
  state: string
  hours: number
  badge: 'Mandatory' | 'Elective'
  /** ISO (YYYY-MM-DD) — "Course Completed" date. */
  completedDate: string
  /** ISO — "Enrolled" date (shown in the detail panel). */
  enrolledDate: string
  status: CertificateStatus
  /** Issuing provider — external certificates only. */
  externalProvider?: string
  /** The pending action — action-required certificates only. */
  action?: CertActionType
  /** Roster reporting note shown in the detail panel. */
  rosterReported?: string
  /** State CE reporting status — shown on the card's "Reporting Status" line
   *  (completed / external certificates). */
  reporting?: CertReporting
}

/** Per-action copy used by the cards (pending pill) and the detail panel
 *  (banner reason + optional explanation paragraph). `{state}` is replaced
 *  with the certificate's state. */
export const CERT_ACTION_META: Record<
  CertActionType,
  { pendingLabel: string; bannerReason: string; explanation?: string }
> = {
  survey: {
    pendingLabel: 'Survey Required',
    bannerReason: 'Completion of Survey is required.',
  },
  affidavit: {
    pendingLabel: 'Affidavit Required',
    bannerReason: '{state} requires a signed affidavit.',
    explanation:
      '{state} requires you to send us a signed affidavit. Please print, sign, and fax (or mail) the following affidavit to us. Upon receipt of the signed affidavit, your certificate will either be posted to your account, or (if your state also requires an original signature) be sent via standard mail within 2 business days.',
  },
  'proctored-exam': {
    pendingLabel: 'Proctored Exam Required',
    bannerReason: 'A proctored exam is required.',
  },
  document: {
    pendingLabel: 'Document Required',
    bannerReason: 'An additional document is required.',
  },
  payment: {
    pendingLabel: 'Payment Required',
    bannerReason: 'Payment for the course is required.',
  },
}

/* ============================================================================
 * Per-brand Certificates fixtures
 *
 * Each brand's certificates mirror what that brand's learner has actually
 * completed elsewhere in the prototype, so the three surfaces agree:
 *   - `learningPathsFor(brand)` / `_CERTS_BY_BRAND` in learningFixtures.ts
 *     (the per-brand completed-course titles + hours + tier)
 *   - `myCoursesFor(brand)` in myCoursesFixtures.ts (the `myStatus:
 *     'completed'` records — reused title-for-title where one exists)
 * A learner who sees "Agency Law · 4 hrs" completed in My Courses finds the
 * same certificate here.
 *
 * Every brand carries all three statuses (action-required / completed /
 * external) and spreads the three `CertReporting` variants plus all five
 * `CertActionType`s across its set, so the status tabs, the reporting line
 * and the action panel stay demoable on every brand.
 *
 * `state` is the FULL state name (it feeds the State filter rail);
 * 'National' / 'Federal' is used where the credential isn't state-scoped.
 * `reporting.stateAbbr` needs a real state, so the `non-reporting` variant
 * is always placed on a state-scoped certificate — and the `affidavit`
 * action likewise, since its copy interpolates `{state}`.
 *
 * TODO(data): whether a given state actually reports, and which credential
 * files with which regulator, is illustrative here — the real answers come
 * from the Certificates API. STC's securities exams report to FINRA/CRD
 * rather than to a state CE roster; the reporting variants on that brand
 * are demo scaffolding for the UI, not a claim about FINRA.
 * ========================================================================== */

const RE_CE = 'Real Estate Continuing Education'
const NURSING_CE = 'Nursing Continuing Education'
const SECURITIES = 'Securities Industry Exam Prep'
const INSURANCE_PRELICENSE = 'Insurance Pre-Licensing'
const INSURANCE_CE = 'Insurance Continuing Education'

/* ── McKissock — appraisal CE (the original fixture set, unchanged) ────────
   USPAP / state appraisal CE per mckissock.com. Dates sit in the 2024 cycle
   the set was authored against; the other brands are dated to the 2026

/* ── Colibri Real Estate — NC primary licensed state, GA secondary ─────────
   Titles from `_CERTS_BY_BRAND.cre` (NC General Update / BICUP / BPOs /
   Fair Housing / luxury designation) plus the four GA electives the CRE

/* ── Elite Learning — FL biennial nursing CE, plus the secondary NY licence ─
   Titles from `_CERTS_BY_BRAND.elite` (the FL mandatory topics + electives)
   and the four completed records in `myCoursesFor('elite')`. New York is the
   learner's second, lightly-used Nursing licence (see `elite-rn-ny` in the
   membership fixtures) — it carries the specialty + infection-control certs.
   Shared with Fitzgerald, which mirrors Elite's whole learner library. */
const _ELITE_CERTS: Certificate[] = [
  // ── Completed ──────────────────────────────────────────────────────────
  {
    // Matches `mc-elite-medical-errors`.
    id: 'cert-elite-medical-errors',
    courseId: 'mc-elite-medical-errors',
    title: 'Prevention of Medical Errors',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 2,
    badge: 'Mandatory',
    completedDate: '2026-03-12',
    enrolledDate: '2026-03-04',
    status: 'completed',
    reporting: { status: 'reported', date: '2026-03-14' },
  },
  {
    // Matches `mc-elite-hiv-aids`.
    id: 'cert-elite-hiv-aids',
    courseId: 'mc-elite-hiv-aids',
    title: 'HIV/AIDS — One-Time Florida Requirement',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 1,
    badge: 'Mandatory',
    completedDate: '2026-02-02',
    enrolledDate: '2026-01-20',
    status: 'completed',
    reporting: { status: 'reported', date: '2026-02-04' },
  },
  {
    // Matches `mc-elite-pharm-update`.
    id: 'cert-elite-pharm-update',
    courseId: 'mc-elite-pharm-update',
    title: 'Pharmacology Update for Nurses',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 5,
    badge: 'Elective',
    completedDate: '2026-01-28',
    enrolledDate: '2025-12-19',
    status: 'completed',
    reporting: { status: 'pending-roster' },
  },
  {
    // Matches `mc-elite-domestic-violence`.
    id: 'cert-elite-domestic-violence',
    courseId: 'mc-elite-domestic-violence',
    title: 'Domestic Violence Awareness',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 2,
    badge: 'Elective',
    completedDate: '2026-03-01',
    enrolledDate: '2026-02-15',
    status: 'completed',
    reporting: { status: 'reported', date: '2026-03-03' },
  },
  {
    id: 'cert-elite-peds-specialty',
    title: 'Pediatric Nursing Specialty Collection',
    profession: 'Specialty Certification',
    state: 'New York',
    hours: 4,
    badge: 'Elective',
    completedDate: '2026-02-20',
    enrolledDate: '2026-01-12',
    status: 'completed',
    reporting: { status: 'non-reporting', stateAbbr: 'NY' },
  },

  // ── Externally completed ───────────────────────────────────────────────
  {
    id: 'cert-elite-ext-bls',
    title: 'BLS Provider — CPR and AED',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 4,
    badge: 'Mandatory',
    completedDate: '2025-11-18',
    enrolledDate: '2025-11-04',
    status: 'external',
    externalProvider: 'American Heart Association',
    reporting: { status: 'reported', date: '2025-11-21' },
  },
  {
    id: 'cert-elite-ext-infection-control',
    title: 'Infection Control and Barrier Precautions',
    profession: NURSING_CE,
    state: 'New York',
    hours: 2,
    badge: 'Mandatory',
    completedDate: '2025-12-08',
    enrolledDate: '2025-11-25',
    status: 'external',
    externalProvider: 'NYSED-Approved Provider',
    reporting: { status: 'non-reporting', stateAbbr: 'NY' },
  },

  // ── Action required ────────────────────────────────────────────────────
  {
    id: 'cert-elite-ar-sepsis-survey',
    title: 'Sepsis: Recognition & Response',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 3,
    badge: 'Elective',
    completedDate: '2026-04-08',
    enrolledDate: '2026-03-16',
    status: 'action-required',
    action: 'survey',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-elite-ar-fl-laws-affidavit',
    courseId: 'lp-elite-fl-laws',
    title: 'Florida Laws and Rules for Nurses',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 2,
    badge: 'Mandatory',
    completedDate: '2026-04-04',
    enrolledDate: '2026-03-10',
    status: 'action-required',
    action: 'affidavit',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-elite-ar-impairment-document',
    courseId: 'lp-elite-impairment',
    title: 'Recognizing Impairment in the Workplace',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 2,
    badge: 'Mandatory',
    completedDate: '2026-03-27',
    enrolledDate: '2026-03-02',
    status: 'action-required',
    action: 'document',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-elite-ar-trafficking-payment',
    courseId: 'lp-elite-human-trafficking',
    title: 'Human Trafficking Awareness',
    profession: NURSING_CE,
    state: 'Florida',
    hours: 2,
    badge: 'Mandatory',
    completedDate: '2026-03-24',
    enrolledDate: '2026-02-27',
    status: 'action-required',
    action: 'payment',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-elite-ar-rn-bc-proctor',
    title: 'RN-BC Pediatric Specialty Recertification',
    profession: 'Specialty Certification',
    state: 'New York',
    hours: 6,
    badge: 'Mandatory',
    completedDate: '2026-04-01',
    enrolledDate: '2026-02-09',
    status: 'action-required',
    action: 'proctored-exam',
    rosterReported: 'Non-Reporting State',
  },
]

/* ── STC — securities industry exam prep ───────────────────────────────────
   Titles from `_CERTS_BY_BRAND.stc` and the three completed records in
   `myCoursesFor('stc')`. FINRA qualification exams aren't state-scoped, so
   most rows read 'National'; the NASAA state-law exam (Series 63) and the
   insurance pre-licensing outlier carry a real state, which is where the
   `non-reporting` reporting variant and the `affidavit` action live (both
   need a state to render). */
const _STC_CERTS: Certificate[] = [
  // ── Completed ──────────────────────────────────────────────────────────
  {
    id: 'cert-stc-sie',
    courseId: 'mc-stc-sie',
    title: 'SIE Exam Prep — Completion',
    profession: SECURITIES,
    state: 'National',
    hours: 25,
    badge: 'Mandatory',
    completedDate: '2025-12-05',
    enrolledDate: '2025-10-20',
    status: 'completed',
    reporting: { status: 'reported', date: '2025-12-08' },
  },
  {
    // Matches `mc-stc-s66`.
    id: 'cert-stc-s66',
    courseId: 'mc-stc-s66',
    title: 'Series 66 — Uniform Combined State Law',
    profession: SECURITIES,
    state: 'National',
    hours: 24,
    badge: 'Mandatory',
    completedDate: '2026-02-27',
    enrolledDate: '2026-01-15',
    status: 'completed',
    reporting: { status: 'pending-roster' },
  },
  {
    // Matches `mc-stc-s99`.
    id: 'cert-stc-s99',
    courseId: 'mc-stc-s99',
    title: 'Series 99 — Operations Professional',
    profession: SECURITIES,
    state: 'National',
    hours: 18,
    badge: 'Elective',
    completedDate: '2026-01-16',
    enrolledDate: '2025-11-28',
    status: 'completed',
    reporting: { status: 'reported', date: '2026-01-19' },
  },
  {
    // Matches `mc-stc-s9-10`.
    id: 'cert-stc-s9-10',
    courseId: 'mc-stc-s9-10',
    title: 'Series 9/10 — General Securities Sales Supervisor',
    profession: SECURITIES,
    state: 'National',
    hours: 30,
    badge: 'Elective',
    completedDate: '2026-01-30',
    enrolledDate: '2025-12-08',
    status: 'completed',
    reporting: { status: 'reported', date: '2026-02-02' },
  },
  {
    id: 'cert-stc-s63',
    courseId: 'mc-stc-s63',
    title: 'Series 63 — Uniform Securities Agent State Law',
    profession: SECURITIES,
    state: 'Texas',
    hours: 12,
    badge: 'Elective',
    completedDate: '2026-03-06',
    enrolledDate: '2026-02-02',
    status: 'completed',
    reporting: { status: 'non-reporting', stateAbbr: 'TX' },
  },

  // ── Externally completed ───────────────────────────────────────────────
  {
    id: 'cert-stc-ext-firm-element',
    title: 'Firm Element Continuing Education — Annual Cycle',
    profession: SECURITIES,
    state: 'National',
    hours: 4,
    badge: 'Mandatory',
    completedDate: '2025-11-14',
    enrolledDate: '2025-10-27',
    status: 'external',
    externalProvider: 'Compliance Partners Group',
    reporting: { status: 'reported', date: '2025-11-17' },
  },
  {
    id: 'cert-stc-ext-regulatory-element',
    title: 'Regulatory Element — S101 General Program',
    profession: SECURITIES,
    state: 'National',
    hours: 3,
    badge: 'Mandatory',
    completedDate: '2025-12-19',
    enrolledDate: '2025-12-01',
    status: 'external',
    externalProvider: 'FINRA',
    reporting: { status: 'pending-roster' },
  },

  // ── Action required ────────────────────────────────────────────────────
  {
    id: 'cert-stc-ar-s7-proctor',
    courseId: 'mc-stc-s7-topoff',
    title: 'Series 7 Top-Off — General Securities Representative',
    profession: SECURITIES,
    state: 'National',
    hours: 45,
    badge: 'Mandatory',
    completedDate: '2026-04-10',
    enrolledDate: '2026-02-02',
    status: 'action-required',
    action: 'proctored-exam',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-stc-ar-s24-payment',
    courseId: 'mc-stc-s24',
    title: 'Series 24 — General Securities Principal',
    profession: SECURITIES,
    state: 'National',
    hours: 30,
    badge: 'Elective',
    completedDate: '2026-03-31',
    enrolledDate: '2026-01-26',
    status: 'action-required',
    action: 'payment',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-stc-ar-s79-survey',
    courseId: 'mc-stc-s79',
    title: 'Series 79 — Investment Banking',
    profession: SECURITIES,
    state: 'National',
    hours: 22,
    badge: 'Elective',
    completedDate: '2026-04-07',
    enrolledDate: '2026-02-18',
    status: 'action-required',
    action: 'survey',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-stc-ar-s65-document',
    courseId: 'mc-stc-s65',
    title: 'Series 65 — Investment Adviser Law',
    profession: SECURITIES,
    state: 'National',
    hours: 18,
    badge: 'Elective',
    completedDate: '2026-03-20',
    enrolledDate: '2026-02-05',
    status: 'action-required',
    action: 'document',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-stc-ar-insurance-affidavit',
    title: 'Insurance Pre-Licensing — Life & Health',
    profession: INSURANCE_PRELICENSE,
    state: 'Texas',
    hours: 20,
    badge: 'Mandatory',
    completedDate: '2026-03-13',
    enrolledDate: '2026-01-08',
    status: 'action-required',
    action: 'affidavit',
    rosterReported: 'Non-Reporting State',
  },
]

/* ── XCEL Solutions — insurance licensing + CE ─────────────────────────────
   Titles from `_CERTS_BY_BRAND.xcel` (the pre-licensing completions each
   line of authority requires, then the CE topics — annuity / long-term care
   / flood / ethics) and the completed `mc-xcel-annuity-training` record in
   `myCoursesFor('xcel')`. Florida is the resident licence (all three XCEL
   learning paths); Texas is a non-resident licence, which is where the
   `non-reporting` variant sits. XCEL has no membership, so nothing here is
   tier-gated. */
const _XCEL_CERTS: Certificate[] = [
  // ── Completed ──────────────────────────────────────────────────────────
  {
    id: 'cert-xcel-lh-prelicense',
    courseId: 'mc-xcel-lh-prelicense',
    title: 'Life & Health Pre-Licensing — Completion',
    profession: INSURANCE_PRELICENSE,
    state: 'Florida',
    hours: 40,
    badge: 'Mandatory',
    completedDate: '2026-04-10',
    enrolledDate: '2026-02-14',
    status: 'completed',
    reporting: { status: 'reported', date: '2026-04-13' },
  },
  {
    // Matches `mc-xcel-annuity-training`.
    id: 'cert-xcel-annuity-training',
    courseId: 'mc-xcel-annuity-training',
    title: 'Annuity Initial Training',
    profession: INSURANCE_CE,
    state: 'Florida',
    hours: 4,
    badge: 'Mandatory',
    completedDate: '2026-03-05',
    enrolledDate: '2026-02-20',
    status: 'completed',
    reporting: { status: 'reported', date: '2026-03-07' },
  },
  {
    id: 'cert-xcel-ltc-refresher',
    title: 'Long-Term Care Refresher Training',
    profession: INSURANCE_CE,
    state: 'Florida',
    hours: 4,
    badge: 'Elective',
    completedDate: '2026-02-11',
    enrolledDate: '2026-01-23',
    status: 'completed',
    reporting: { status: 'pending-roster' },
  },
  {
    id: 'cert-xcel-flood',
    title: 'Flood Insurance (NFIP) Training',
    profession: INSURANCE_CE,
    state: 'Florida',
    hours: 3,
    badge: 'Elective',
    completedDate: '2026-02-06',
    enrolledDate: '2026-01-19',
    status: 'completed',
    reporting: { status: 'reported', date: '2026-02-09' },
  },
  {
    id: 'cert-xcel-personal-lines',
    title: 'Personal Lines Pre-Licensing — Completion',
    profession: INSURANCE_PRELICENSE,
    state: 'Texas',
    hours: 20,
    badge: 'Elective',
    completedDate: '2026-01-24',
    enrolledDate: '2025-12-15',
    status: 'completed',
    reporting: { status: 'non-reporting', stateAbbr: 'TX' },
  },

  // ── Externally completed ───────────────────────────────────────────────
  {
    id: 'cert-xcel-ext-aml',
    title: 'Anti-Money Laundering (AML) Training',
    profession: INSURANCE_CE,
    state: 'Florida',
    hours: 2,
    badge: 'Mandatory',
    completedDate: '2025-12-12',
    enrolledDate: '2025-11-30',
    status: 'external',
    externalProvider: 'LIMRA',
    reporting: { status: 'reported', date: '2025-12-15' },
  },
  {
    id: 'cert-xcel-ext-medicare',
    title: 'Medicare Advantage and Part D Certification',
    profession: INSURANCE_CE,
    state: 'Florida',
    hours: 5,
    badge: 'Elective',
    completedDate: '2025-11-06',
    enrolledDate: '2025-10-21',
    status: 'external',
    externalProvider: 'AHIP',
    reporting: { status: 'pending-roster' },
  },

  // ── Action required ────────────────────────────────────────────────────
  {
    id: 'cert-xcel-ar-pc-prelicense-proctor',
    title: 'Property & Casualty Pre-Licensing — Completion',
    profession: INSURANCE_PRELICENSE,
    state: 'Florida',
    hours: 40,
    badge: 'Mandatory',
    completedDate: '2026-04-09',
    enrolledDate: '2026-02-02',
    status: 'action-required',
    action: 'proctored-exam',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-xcel-ar-ethics-affidavit',
    courseId: 'mc-xcel-ethics',
    title: 'Insurance Ethics',
    profession: INSURANCE_CE,
    state: 'Florida',
    hours: 5,
    badge: 'Mandatory',
    completedDate: '2026-04-03',
    enrolledDate: '2026-03-09',
    status: 'action-required',
    action: 'affidavit',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-xcel-ar-ltc-initial-survey',
    courseId: 'mc-xcel-ltc-training',
    title: 'Long-Term Care Initial Training',
    profession: INSURANCE_CE,
    state: 'Florida',
    hours: 8,
    badge: 'Mandatory',
    completedDate: '2026-03-26',
    enrolledDate: '2026-03-11',
    status: 'action-required',
    action: 'survey',
    rosterReported: 'Pending Roster Submission',
  },
  {
    id: 'cert-xcel-ar-personal-lines-document',
    title: 'Personal Lines Coverage Update',
    profession: INSURANCE_CE,
    state: 'Texas',
    hours: 4,
    badge: 'Elective',
    completedDate: '2026-03-18',
    enrolledDate: '2026-02-25',
    status: 'action-required',
    action: 'document',
    rosterReported: 'Non-Reporting State',
  },
  {
    id: 'cert-xcel-ar-health-marketplace-payment',
    title: 'Health Insurance Marketplace and ACA Update',
    profession: INSURANCE_CE,
    state: 'Florida',
    hours: 3,
    badge: 'Elective',
    completedDate: '2026-03-09',
    enrolledDate: '2026-02-21',
    status: 'action-required',
    action: 'payment',
    rosterReported: 'Pending Roster Submission',
  },
]

const _CERTS_BY_BRAND: Record<Brand, Certificate[]> = {
  xcel: _XCEL_CERTS,
}

/** All certificates for the active brand. Keyed per brand so each brand's
 *  certificates match ITS learning paths + My Courses records — see the
 *  block comment at the top of this file. Swap for a per-brand API response
 *  at the `TODO(data)` above. */
export function certificatesFor(brand: Brand): Certificate[] {
  return _CERTS_BY_BRAND[brand]
}

/* ─── The course card's certificate marker ─────────────────────────────── */

/** What the course card's footer marker says. Two arms, nothing else. */
export type CourseCertificateState = 'issued' | 'pending'

/**
 * The certificate marker for a course, or `null` when no certificate exists.
 *
 * ⚠ THE TRAP THIS FUNCTION EXISTS TO AVOID. `Certificate` has TWO different
 * states that both use the word "pending", and they mean opposite things:
 *
 *   • ISSUANCE — `status: 'action-required'`, carrying one of the five
 *     `CERT_ACTION_META` reasons. The certificate does not exist yet. THIS is
 *     what the Pending marker means.
 *   • REPORTING — `reporting: { status: 'pending-roster' }`, which sits on an
 *     ALREADY-ISSUED certificate and describes whether the credit has reached
 *     the state board. That certificate is issued; the marker must say so.
 *
 * So this keys off `status` and never off the substring "pending". Reversing
 * those two inverts the meaning on exactly the certificates a learner is most
 * likely to be checking. Pinned by `CertificateSlot.test.tsx`.
 *
 * `external` never resolves here: those carry no `courseId` by design, so they
 * cannot be reached by a course-id lookup.
 *
 * A completed course with NO certificate returns `null` and the card renders
 * nothing — not "Issued". We do not know, and guessing is the over-claim this
 * whole slice removes: the card used to assert a certificate existed purely
 * because the course had finished.
 */
export function certificateStateForCourse(
  brand: Brand,
  courseId: string,
): CourseCertificateState | null {
  return certificateStateOf(certificateForCourse(brand, courseId))
}

/**
 * The certificate RECORD for a course, or `null`.
 *
 * The Course Details sheet needs the record, not just the state — its pending
 * line names the reason (`CERT_ACTION_META[cert.action].pendingLabel`) and its
 * certificate row opens `CertificateActionPanel`, which takes a `Certificate`.
 * `certificateStateForCourse` derives from this, so there is ONE lookup and the
 * card's marker and the sheet's status zone cannot resolve to different
 * certificates.
 */
export function certificateForCourse(brand: Brand, courseId: string): Certificate | null {
  return certificatesFor(brand).find((c) => c.courseId === courseId) ?? null
}

/**
 * Where an issued certificate opens.
 *
 * ⚠ `TODO(data)`: THERE IS NO CERTIFICATE PDF IN THIS REPO. The real target is
 * a generated document — one PDF per issued certificate, served by the
 * credentialing service, something like `/api/certificates/{id}.pdf`. Until that
 * endpoint exists this returns the certificates page, which is a working
 * destination rather than a new tab onto a 404.
 *
 * So the INTERACTION is real and reviewable — link styling, new tab, the whole
 * affordance — and only the document behind it is stubbed. When the endpoint
 * lands, this function is the single place to change: the card, and anything
 * else that grows a "view certificate" link, go through it.
 *
 * Returns `null` for a certificate that is not issued. A pending certificate
 * has no document to open, which is why the card's pending marker is a plain
 * chip and not a link.
 */
export function certificatePdfUrl(cert: Certificate | null): string | null {
  if (!cert || cert.status === 'action-required') return null
  return '/my-learning/certificates'
}

/** The state half of the resolution, kept beside the record lookup so the trap
 *  documented above is stated once. */
export function certificateStateOf(cert: Certificate | null): CourseCertificateState | null {
  if (!cert) return null
  if (cert.status === 'action-required') return 'pending'
  if (cert.status === 'completed') return 'issued'
  return null
}
