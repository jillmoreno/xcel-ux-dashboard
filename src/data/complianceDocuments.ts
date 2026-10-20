/**
 * THE COMPLIANCE DOCUMENTS — the 24 real affidavits, attestations, notices and
 * enrollment agreements in the `_XCEL-PE Affidavits and EAs` set, as data.
 *
 * ⚠ SIX SHAPES, NOT ONE FLOW. `PreCourseRequirementsWizard` — the approved
 * visual style this work comes from — was a fixed three-step flow (Confirm Name
 * → Confirm License → Affidavit). Reviewing all 24 source documents showed they
 * do not fit it: they have different step counts, different fields, and in two
 * cases a second signer entirely. So the step sequence is DERIVED from `shape`
 * (`STEPS_BY_SHAPE` below) and the modal reconfigures from a config object
 * rather than existing six times.
 *
 * ⚠ CONTENT IS CONDENSED, NOT INVENTED. Each `body` / `sections` entry is drawn
 * from the actual source file, trimmed to what the modal needs to render. One
 * document (`fl-notice-pc`) carries a CORRECTION rather than its source text —
 * see its comment. One (`mn-post-pdf`) carries no content at all, because its
 * source resisted extraction — see `needs-review`.
 */

/**
 * WHEN THE DOCUMENT IS PUT IN FRONT OF THE LEARNER — the PRD's own moments
 * (§4.2), not a two-way split.
 *
 * ⚠ IT WAS `'pre-course' | 'post-final'` AND FLORIDA BROKE IT. Florida's
 * affidavit is signed BEFORE the course exam and the state has no post-exam
 * requirement at all ("After the final exam: proctor or attestation: No
 * regulation"), so neither value was true of it. Six of the 24 sit at that
 * moment. A field that cannot say when a compliance document is signed is
 * worse than no field, because every row still carries a confident answer.
 *
 * ⚠ `during-exam` HAS NO DOCUMENT, deliberately. The PRD lists it as a moment
 * — a proctor is present and checks identity — but nothing is signed there,
 * so no row uses it. Kept so the set of moments is the PRD's rather than a
 * subset that happens to match today's files.
 */
export type DocumentMoment =
  | 'checkout'
  | 'before-course'
  | 'before-first-lesson'
  | 'before-exam'
  | 'during-exam'
  | 'after-exam'
  | 'at-completion'

/** How each moment reads on screen. */
export const MOMENT_LABEL: Record<DocumentMoment, string> = {
  'checkout': 'At checkout',
  'before-course': 'Before the course opens',
  'before-first-lesson': 'Before the first lesson',
  'before-exam': 'Before the course exam',
  'during-exam': 'During the course exam',
  'after-exam': 'After the course exam',
  'at-completion': 'At course completion',
}

export type DocumentShape =
  | 'notice'
  | 'signed-tc'
  | 'enrollment-agreement'
  | 'affidavit-single'
  | 'affidavit-two-party'
  | 'needs-review'

/** See `ComplianceDocumentConfig.acknowledgement`. */
export type AcknowledgementLevel = 'none' | 'checkbox' | 'signature'

/**
 * THE OTHER PARTY'S SIGNATURE — the school's, not the learner's.
 *
 * ⚠ IT IS NOT A FIELD. Nevada's profile requires that each student receives a
 * copy of the agreement "signed by the student AND an institution
 * representative": a contract with one signature on it is not the document
 * the state asks for. But the learner cannot produce the school's half, and
 * must not be asked to — it is applied on XCEL's side and shown as already
 * applied, which is also what makes the agreement feel like a contract rather
 * than a form.
 */
export interface CounterSignature {
  /** Who signs for the school. */
  signatory: string
  /** The capacity they sign in, as the regulation names it. */
  role: string
}

export type ExtraField =
  | 'dob'
  | 'ssn-last4'
  | 'ssn-full'
  | 'phone'
  | 'exam-date'
  /** A printed full name — the proctor's, on the four two-party affidavits. */
  | 'full-name'
  /** A street address. Ohio asks the student for one; Colorado, Connecticut
   *  and Wisconsin ask the proctor. */
  | 'address'

/**
 * THE DOCUMENT'S KIND, as the SharePoint set names it — and the modal's
 * heading.
 *
 * ⚠ IT IS NOT THE SHAPE, and the two must not be collapsed into one field.
 * `shape` is STRUCTURAL — how many steps, which fields, one signer or two —
 * and exists so the component can reconfigure itself. This is the document's
 * REAL-WORLD kind, the thing a compliance officer calls it. They cut across
 * each other: a Pre-Final Affidavit and a Post Final Affidavit are both
 * `affidavit-single`, while two documents both called Post Final Affidavit
 * can be `affidavit-single` and `affidavit-two-party`.
 */
export type ComplianceType =
  | 'Final Affidavit'
  | 'Terms and Conditions'
  | 'Pre-Course Notice'
  | 'Pre-Final Affidavit'
  | 'Post Final Affidavit'
  | 'Enrollment Agreement'

export interface EnrollmentAgreementSection {
  heading: string
  body: string
}

export interface ComplianceDocumentConfig {
  id: string
  /** Two-letter state, or 'Generic' for the brand-level fallbacks. */
  state: string
  moment: DocumentMoment
  shape: DocumentShape
  /** The document's kind — drawn as the modal's heading. See `ComplianceType`. */
  complianceType: ComplianceType
  /**
   * The file this row was read from, verbatim, in `_XCEL-PE Affidavits and
   * EAs`. It is the only way to audit a row against its source — every
   * `complianceType` here was derived from this string, so anyone checking
   * the mapping can go straight to the document rather than re-deriving it.
   */
  sourceFile: string
  /** The specific document, e.g. 'Florida — Life & Health Pre-Course Notice'.
   *  The dialog's accessible name, and what the picker lists. */
  title: string
  /**
   * The document MINUS its kind — 'Florida — Property & Casualty', 'Kentucky'.
   * Drawn under the heading, which already says the kind.
   *
   * ⚠ AUTHORED, NOT DERIVED. Stripping the type off `title` works for the
   * documents whose title happens to end in it and silently mangles the ones
   * that do not (Ohio's Registration Form never says "Enrollment Agreement"),
   * so it is a field rather than a regex.
   */
  subject: string

  /* ── bilingual documents (notice, and the generic signed-tc) ──
     ⚠ NOT NOTICE-ONLY since 2026-10-19. The XCEL Generic Terms & Conditions
     carries its English and Spanish one under the other in the same file,
     exactly as the Florida notices do, so the pair lives on the interface
     rather than on one shape. A document with `bilingual` reads
     `bodyEn`/`bodyEs`; one without reads `body`. */
  bilingual?: boolean
  bodyEn?: string
  bodyEs?: string

  /* ── single-language signed-tc / affidavit-single body ── */
  /**
   * Blocks separated by a blank line. `## ` opens a run-in heading the
   * document prints in bold, `- ` a bullet (`  - ` nests one level),
   * anything else is a paragraph — see `DocumentBody`.
   *
   * ⚠ A HEADING IS A BLOCK, NOT A FIELD. It was `headingEn`/`headingEs` for
   * one commit; Illinois' Terms & Conditions then turned up with a heading, a
   * bullet list, a nested clause AND a second heading, which a field pair
   * cannot express. One body string carries all of it, in order, in both
   * languages, with no new fields per structure the next document invents.
   */
  body?: string

  /* ── enrollment-agreement only ── */
  agency?: string
  sections?: EnrollmentAgreementSection[]
  acknowledgments?: string[]
  /**
   * WHAT THE DOCUMENT ASKS OF THE LEARNER, in the PRD's own three levels
   * (§4.2). Defaults per shape where omitted — see `acknowledgementFor`.
   *
   *   'none'      show it; no response required. The PRD's rule is "least
   *               friction that meets the rule: where a rule only requires us
   *               to state something, we show it rather than demand a
   *               checkbox". Demanding a tick nobody's regulator asked for
   *               trains learners to click past the ones that matter.
   *   'checkbox'  an attestation — a non-legal acknowledgment.
   *   'signature' an affidavit, or an attestation with signature: the tick
   *               AND a typed name.
   */
  acknowledgement?: AcknowledgementLevel
  /**
   * Shown as already signed beneath the learner's signature. Nevada is the
   * only document in the set that requires one.
   */
  counterSignature?: CounterSignature

  /* ── affidavit-two-party only ── */
  /**
   * The PROCTOR signs first.
   *
   * ⚠ THE PAPER ORDER IS NOT THE FILLING ORDER. All four two-party forms
   * print the student's block above the monitor's, which is why the shape
   * defaults to student-then-proctor. Wisconsin's profile describes the
   * opposite sequence in practice: the proctor verifies identity and
   * completes the Affidavit of Personal Responsibility BEFORE the exam, and
   * both parties sign after it. Following the paper would ask a learner to
   * attest before the person who is meant to have verified them has.
   *
   * Set per document rather than per shape, because the other three states
   * are not known to differ.
   */
  proctorFirst?: boolean
  studentBody?: string
  proctorBody?: string
  relationshipOptions?: string[]

  /* ── identity fields ── */
  /** Asked of the STUDENT, on whichever step collects their details. */
  extraFields?: ExtraField[]
  /**
   * Asked of the PROCTOR, on the proctor step. Separate from `extraFields`
   * because the two are different people: Wisconsin wants the proctor's name,
   * address and phone while asking the student for nothing extra, and Ohio's
   * registration form asks the student for four fields and has no proctor at
   * all. One list could not express either.
   */
  proctorFields?: ExtraField[]

  /* ── placeholders, deliberately unpopulated ── */
  /**
   * ⚠ NOT WIRED YET. The real system should attach the English document to
   * English-language courses and the Spanish one to Spanish-language courses.
   * That attachment logic does not exist; `bilingual` + `bodyEn` / `bodyEs`
   * exist so a later pass has somewhere to hang it.
   */
  language?: 'en' | 'es' | 'bilingual'
  // TODO(content): no version source of truth yet. Patrick and Bonnie want
  // these documents to carry edition/version numbers; nothing tracks that
  // today, so this field is a placeholder and every row leaves it unset.
  version?: string

  /* ── needs-review only ── */
  needsReviewNote?: string
}

/**
 * THE STEP SEQUENCE IS DERIVED FROM THE SHAPE, not stored per document — so a
 * new document of a known shape is a data row and nothing else.
 */
export const STEPS_BY_SHAPE: Record<DocumentShape, string[]> = {
  'notice': ['document'],
  'signed-tc': ['name', 'document'],
  /* ⚠ NO `license` STEP. It was in the brief and is in no regulation: the
     PRD collects name, contact and hiring manager at enrolment, and SSN or
     date of birth only at completion where a state's roster needs them.
     Nothing asks a learner for a licence number before the course. */
  'enrollment-agreement': ['name', 'document'],
  'affidavit-single': ['identity', 'document'],
  'affidavit-two-party': ['student', 'proctor'],
  'needs-review': ['document'],
}

/**
 * What a shape asks for unless its row says otherwise.
 *
 * ⚠ AFFIDAVITS SIGN, ATTESTATIONS TICK. The PRD defines an affidavit as a
 * sworn statement signed with a typed name and an attestation as a checkbox,
 * so the default follows the document's kind rather than being set 24 times.
 */
const DEFAULT_ACKNOWLEDGEMENT: Record<DocumentShape, AcknowledgementLevel> = {
  'notice': 'checkbox',
  'signed-tc': 'signature',
  'enrollment-agreement': 'checkbox',
  'affidavit-single': 'signature',
  'affidavit-two-party': 'signature',
  'needs-review': 'none',
}

export function acknowledgementFor(config: ComplianceDocumentConfig): AcknowledgementLevel {
  return config.acknowledgement ?? DEFAULT_ACKNOWLEDGEMENT[config.shape]
}

/**
 * The steps this document runs, in the order it is actually filled in.
 *
 * ⚠ READ THIS, NEVER `STEPS_BY_SHAPE` DIRECTLY, anywhere a learner walks
 * through a document. The shape gives the default; `proctorFirst` is the one
 * documented departure from it, and a caller that indexes the map itself
 * silently ignores it.
 */
export function stepsFor(config: ComplianceDocumentConfig): string[] {
  const steps = STEPS_BY_SHAPE[config.shape]
  if (config.shape === 'affidavit-two-party' && config.proctorFirst) {
    return ['proctor', 'student']
  }
  return steps
}

/**
 * EVERY JURISDICTION THAT REGULATES COURSE DELIVERY — all nineteen, whether
 * or not a document exists for it.
 *
 * ⚠ A STATE WITH NO DOCUMENT IS NOT AUTOMATICALLY A GAP, and conflating the
 * two is the mistake this list exists to prevent. Arkansas, Indiana, Michigan
 * and New Jersey require nothing of the learner — their profiles are silent
 * on proctoring and attestations, and Arkansas's DOI confirmed in writing
 * that self-study is exempt. Labelling those "needed" would invent four
 * documents nobody has to produce, and bury the four that really are missing.
 *
 * ⚠ THE OTHER 33 JURISDICTIONS ARE NOT HERE. They set no pre-licensing
 * requirement at all, so there is nothing for them to be missing; the XCEL
 * baseline is their whole rule set. Listing them would be a page of "not
 * applicable" with the real coverage question hidden inside it.
 */
export type CoverageStatus = 'documented' | 'needed' | 'none-required'

export interface JurisdictionCoverage {
  state: string
  status: CoverageStatus
  /** Why — the state's own requirement, or what is missing. */
  note: string
}

export const REGULATED_JURISDICTIONS: JurisdictionCoverage[] = [
  {
    state: 'AR',
    status: 'none-required',
    note: 'The rule names a proctored exam, but a DOI email of 9 Nov 2020 confirms self-study is exempt. Nothing is asked of the learner.',
  },
  { state: 'CA', status: 'documented', note: 'Pre-course terms, and a completion declaration after the course.' },
  { state: 'CO', status: 'documented', note: 'Proctor affidavit, due the same day as the exam.' },
  { state: 'CT', status: 'documented', note: 'Proctor affidavit on the state’s own Affidavit of Personal Responsibility.' },
  { state: 'FL', status: 'documented', note: 'Study-manual notice before the course, and a pre-exam unassisted acknowledgment. No post-exam requirement.' },
  {
    state: 'GA',
    status: 'needed',
    note: 'Georgia is silent on proctoring and attestations, but its profile requires a notice listing exam sites and times. No such document is in the set.',
  },
  { state: 'IL', status: 'documented', note: 'Privacy statement and course-hours terms, plus a completion affirmation. A monitor affidavit replaces it at the 2027 renewal.' },
  { state: 'IN', status: 'none-required', note: 'Silent on enrollment agreement, proctoring and attestations.' },
  { state: 'KY', status: 'documented', note: 'Postsecondary enrollment agreement.' },
  { state: 'MI', status: 'none-required', note: 'Silent on enrollment agreement, proctoring and attestations.' },
  {
    state: 'MN',
    status: 'needed',
    note: 'The privacy statement is held. The proctor affidavit Minnesota requires is the one PDF in the set whose text cannot be extracted — the row exists, the content does not.',
  },
  {
    state: 'MS',
    status: 'needed',
    note: 'Mississippi requires a post-exam proctor affidavit carrying the proctor’s name, address and phone, from a state template. The only MS file is a student pre-exam acknowledgment the state does not ask for.',
  },
  { state: 'NV', status: 'documented', note: 'Signed enrollment agreement under postsecondary rules, countersigned by the school.' },
  {
    state: 'NJ',
    status: 'none-required',
    note: 'Its application and contract are filed at provider approval, not shown to the learner. Nothing is asked at course time.',
  },
  {
    state: 'NY',
    status: 'needed',
    note: 'The post-exam affidavit is held. New York also requires notices covering system requirements and a final-exam statement; neither is in the set.',
  },
  { state: 'OH', status: 'documented', note: 'Registration form with pre-course information, and a post-exam learner affidavit.' },
  { state: 'OR', status: 'documented', note: 'Enrollment contract under postsecondary rules.' },
  { state: 'WV', status: 'documented', note: 'Student declaration and proctor affidavit, both on one form.' },
  { state: 'WI', status: 'documented', note: 'Student and proctor both sign; the proctor completes it before the exam.' },
]

/**
 * THE OTHER 33 — every jurisdiction that sets no pre-licensing requirement.
 *
 * ⚠ THEY ARE NOT GAPS, and that is the whole reason they are listed apart
 * rather than mixed in. There is no document to be missing: the XCEL baseline
 * is their complete rule set, and a learner there can sit the state exam with
 * no training at all. Folded into the main board they would be 33 rows of
 * "not applicable" with the four real gaps buried inside them — which is why
 * they sit behind a disclosure instead.
 *
 * ⚠ SEVERAL ARE FORMER REGULATORS, and the date matters: a completion from
 * before the rule was dropped is still a record XCEL has to hold and produce,
 * so "not regulated" is a statement about today, not about the archive.
 *
 * 31 states + the District of Columbia + Guam. Guam is absent from the
 * workbook's own licensing tabs, which is why its row carries no detail.
 */
export interface UnregulatedJurisdiction {
  code: string
  name: string
  /** When the requirement went, where it once existed. */
  note?: string
}

export const UNREGULATED_JURISDICTIONS: UnregulatedJurisdiction[] = [
  { code: 'AL', name: 'Alabama', note: 'Pre-licensing eliminated 1 Jan 2024' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'GU', name: 'Guam', note: 'Not in the workbook’s licensing tabs' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'LA', name: 'Louisiana', note: 'Pre-licensing eliminated June 2022' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland', note: 'Pre-licensing eliminated 1 Oct 2024; XCEL keeps records 4 years because producers must' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MO', name: 'Missouri', note: 'Confirmed with the state' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NH', name: 'New Hampshire', note: 'Pre-licensing eliminated 2008' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NC', name: 'North Carolina', note: 'Pre-licensing eliminated 1 Oct 2025 (SL 2025-45); the 3-year rule still covers records from before then' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OK', name: 'Oklahoma', note: 'Applicants with a criminal background file the 1033 waiver' },
  { code: 'PA', name: 'Pennsylvania', note: 'Pre-licensing eliminated 29 Apr 2025 — XCEL still holds its affidavit, and the licensing tab still names one' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee', note: 'Pre-licensing eliminated 21 Mar 2023' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington', note: 'Pre-licensing eliminated July 2023' },
  { code: 'WY', name: 'Wyoming', note: 'Pre-licensing eliminated 24 Jul 2023' },
]

export const COMPLIANCE_DOCUMENTS: ComplianceDocumentConfig[] = [
  /* ── notice (2) ────────────────────────────────────────────────────────
       No signer at all: body text and an "I Agree". Both are bilingual. */
  {
    /* Verbatim. “I acknowledged” is the source's own past tense; kept, because
       silently correcting a legal document's grammar is how a prototype and a
       signed document drift apart. */
    id: 'fl-notice-lh',
    state: 'FL',
    moment: 'before-first-lesson',
    shape: 'notice',
    title: 'Florida — Life & Health Pre-Course Notice',
    complianceType: 'Pre-Course Notice',
    sourceFile: 'FL PE-Pre Course Notice-LifeHealth.docx',
    subject: 'Florida — Life & Health',
    bilingual: true,
    bodyEn:
      'The Florida Department of Financial Services requires a study manual for life and/or health courses, NAIFA Health & Life (including Annuities & Variable Contracts). The related state licensing examination will be based upon the latest edition of the Florida Life, Health and Variable Annuity Study Manual. The Study Manual is not included with this course but it can be obtained from the National Association of Insurance and Financial Advisors-Florida (NAIFA-Florida), PO Box 14365, Tallahassee, FL 32317. (850) 422-1701, or may be ordered online at http://naifa-florida.org. The Study Manual is also available in Spanish.\n\nBy clicking the “I Agree” button below, I acknowledged the above information.',
    bodyEs:
      'El Departamento de Servicios Financieros de Florida exige un manual de estudio para los cursos de vida y/o salud, NAIFA Salud y Vida (incluyendo Anualidades y Contratos Variables). El examen de licencia estatal relacionado se basará en la última edición del Manual de estudio de vida, salud y anualidades variables de Florida. El Manual de estudio no está incluido en este curso, pero se puede obtener en la Asociación Nacional de Asesores Financieros y de Seguros de Florida (NAIFA-Florida), PO Box 14365, Tallahassee, FL 32317. (850) 422-1701, o se puede solicitar en línea en http://naifa-florida.org. El Manual de estudio también está disponible en español.\n\nAl seleccionar el botón “Acepto” a continuación, reconozco la información anterior.',
  },
  {
    /* ⚠⚠ THE SPANISH HERE IS A CORRECTION, NOT THE SOURCE — and the defect the
       brief reported is now CONFIRMED by reading the file. The source
       document's Spanish paragraph is the LIFE & HEALTH one, word for word:
       it names NAIFA and the Life, Health and Variable Annuity manual on a
       Property & Casualty notice. A learner reading the Spanish is told to
       buy the wrong book from the wrong association.

       The English above is verbatim. The Spanish is a translation OF THAT
       ENGLISH, written here so the two halves of the document finally say the
       same thing.
       TODO(content): this is the one row whose Spanish is not the document's.
       Bonnie/Patrick to confirm before it replaces the live file. */
    id: 'fl-notice-pc',
    state: 'FL',
    moment: 'before-first-lesson',
    shape: 'notice',
    title: 'Florida — Property & Casualty Pre-Course Notice',
    complianceType: 'Pre-Course Notice',
    sourceFile: 'FL PE-Pre Course Notice-PropertyCasualty.docx',
    subject: 'Florida — Property & Casualty',
    bilingual: true,
    bodyEn:
      'The Florida Department of Financial Services requires a study manual for the General Lines courses, FAIA’s Florida General Lines, Adjuster and Industrial Fire Study Manual. The related state licensing examination will be based upon the latest edition of the Florida General Lines, Adjuster and Industrial Fire Study Manual. The Study Manual is not included with this course and can be obtained from the Florida Association of Insurance Agents (FAIA), 3159 Shamrock South, Tallahassee, Florida 32309 (850) 893-4155, or may be ordered online at www.faia.com\n\nBy clicking the “I Agree” button below, I acknowledged the above information.',
    bodyEs:
      'El Departamento de Servicios Financieros de Florida exige un manual de estudio para los cursos de Líneas Generales, el Manual de estudio de Líneas Generales, Ajustadores e Incendios Industriales de Florida de FAIA. El examen de licencia estatal relacionado se basará en la última edición del Manual de estudio de Líneas Generales, Ajustadores e Incendios Industriales de Florida. El Manual de estudio no está incluido en este curso y se puede obtener en la Asociación de Agentes de Seguros de Florida (FAIA), 3159 Shamrock South, Tallahassee, Florida 32309, (850) 893-4155, o se puede solicitar en línea en www.faia.com\n\nAl seleccionar el botón “Acepto” a continuación, reconozco la información anterior.',
  },
  /* ── signed-tc (4) ─────────────────────────────────────────────────────
       A name and a signature, then agree/attest. Two of the four print both
       languages in the one file. */
  {
    id: 'xcel-generic-tc',
    state: 'Generic',
    moment: 'before-course',
    shape: 'signed-tc',
    title: 'XCEL Generic — Terms & Conditions',
    complianceType: 'Terms and Conditions',
    sourceFile: 'XCEL Generic Terms and Conditions-Pre-Course Affidavit.docx',
    subject: 'XCEL — Generic',
    bilingual: true,
    bodyEn:
      '## Acknowledgement of Terms and Conditions of Pre-licensing Course Completion\n\nI understand and acknowledge that the pre-licensing insurance course final exam must be a proctored, closed-book exam with no assistance provided. A disinterested third party must proctor the exam. The disinterested third-party proctor or monitor is an individual who has none of the following: family relationship with the student; is a direct supervisor of the student; or a person directly supervised by the student.\n\nA certificate of course completion is to be presented to the student who successfully passes the exam with a score of 70% or better within 2 days of the completion date. The pre-licensing course completion date is the date the proctor signs and dates the exam.',
    bodyEs:
      '## Reconocimiento de los Términos y Condiciones de la Finalización del Curso de Pre-licencia\n\nYo entiendo y reconozco que el examen final del curso de seguro pre-licencia debe ser un examen supervisado y cerrado sin ayuda. Un tercero desinteresado debe supervisar el examen. El supervisor o monitor de terceros desinteresados es un individuo que no tiene ninguno de los siguientes: relación familiar con el estudiante; es un supervisor directo del estudiante; o una persona directamente supervisada por el estudiante.\n\nUn certificado de finalización del curso debe ser presentado al estudiante que pase el examen con una puntuación de 70% o mejor dentro de los 2 días de la fecha de finalización. La fecha de finalización del curso de pre-licencia es la fecha en que el supervisor firma y fecha el examen.',
  },
  {
    id: 'ca-tc',
    state: 'CA',
    moment: 'before-course',
    shape: 'signed-tc',
    title: 'California — Pre-Course Terms & Conditions',
    complianceType: 'Terms and Conditions',
    sourceFile: 'CA PE-Pre-Course Terms and Conditions.docx',
    subject: 'California',
    body:
      '## Acknowledgment of Terms and Conditions of Pre-licensing Course Completion\n\nThis course is designed to fulfill the mandatory one time 12-hour Ethics and California Insurance Code education requirement. XCEL Solutions will be tracking your time spent studying in the course. STUDYING MATERIALS OFFLINE DOES NOT COUNT TOWARDS THE TIME REQUIREMENT. You will not be issued a Certificate of Completion until you certify that you have met the minimum time requirements.\n\nPlease note that according to the insurance code regulating pre-licensing education, you will be signed out of your course after 20 minutes of inactivity. Any time accumulated during the period of inactivity will be removed from your study history. Additionally, you must save your progress periodically to ensure your time is counted towards your study history. If you are timed out of a study session without having saved your progress, any time accumulated between the last time you saved your progress, and the time-out will not be included in your study history.\n\nAny student caught attempting to manipulate or falsify study time will be subject to account suspension pending further investigation. We reserve the right to share student study history with the state’s Department of Insurance in the event of a suspected regulatory violation or upon the request of the Department.\n\n## NEW INSURANCE FRAUD TRAINING REGULATION\n\nThe California Department of Insurance (CDI) recently approved the Commissioner-appointed Curriculum Board’s proposed revisions to the 12-Hour Ethics and California Insurance Code Educational Objectives (EO) to incorporate one hour of study on insurance fraud. This one-hour insurance fraud training is a part of, and not in addition to, the 12-hour prelicensing ethics and three-hour ethics training requirement. The DOI’s Enforcement Branch-Fraud Division recently launched a one-hour insurance fraud course called “Agents and Brokers Anti-Fraud Training” to meet this new ethics requirement.\n\nIMPORTANT: This course includes the new CA DOI requirement.',
  },
  {
    id: 'il-tc',
    state: 'IL',
    moment: 'checkout',
    shape: 'signed-tc',
    title: 'Illinois — Terms & Conditions / Pre-Course Affidavit',
    complianceType: 'Terms and Conditions',
    sourceFile: 'IL PE-Terms and Conditions-Pre-Course Affidavit.docx',
    subject: 'Illinois',
    body:
      '## Acknowledgment of Terms and Conditions of Pre-licensing Course Completion\n\nThe state of Illinois requires applicants to complete 20 hours of pre-licensing education for each major line of authority. 7.5 of those hours must be completed in a classroom (webinar) setting. Additionally, students must complete a comprehensive final exam with a score of at least 70% and affirm that they, and only they, completed the course.\n\nTo be eligible for a Certificate of completion, you must follow several steps:\n\n- Complete the self-study portion of the course including passing the final exam with a score of at least 70%\n- Attend the entire 7.5-hour webinar\n- Affirm that you, and only you, completed the course by submitting your electronic affidavit.\n  - The course completion affidavit is available within two days of fulfilling the course completion requirements (online course, online comprehensive final exam, and webinar).\n\n## Student Notice:\n\nStudent information will not be sold or distributed to any third party without prior written consent of the student. By selecting "I Agree" below, you agree that your course information can be shared with state testing centers, state insurance departments, and with any third-party insurance agency or company.',
  },
  {
    /* ⚠ THE FILE IS NAMED “- Copy” and there is no original beside it in the
       set. Its text is NOT a duplicate of another row — the 10-minute timeout
       and the Minnesota hour rule are its own — so the suffix looks like a
       lost original rather than a stray duplicate.
       The source also carries a Personally Identifiable Information section
       and a Minimum System Requirements list; both are site-wide policy
       rather than course terms, and neither is rendered here.
       TODO(content): confirm which file is authoritative. */
    id: 'mn-tc',
    state: 'MN',
    moment: 'checkout',
    shape: 'signed-tc',
    title: 'Minnesota — Terms & Conditions / Pre-Course Affidavit',
    complianceType: 'Terms and Conditions',
    sourceFile: 'MN PE-Terms and Conditions-Pre-Course Affidavit - Copy.docx',
    subject: 'Minnesota',
    /* ⚠ SHOWN, NOT SIGNED. Its source carries no signature line and no
       checkbox — it ends at the system requirements — and the PRD (A6, §4.2
       row 1) lists Minnesota's required notice as a privacy statement that is
       shown with no response required. The only document in the set that
       asks the learner for nothing. */
    acknowledgement: 'none',
    body:
      '## Acknowledgement of Terms and Conditions of Pre-licensing Course Completion\n\nThe state of Minnesota requires applicants to complete 20 hours of pre-licensing education for each major line of authority.\n\nApplicants seeking to become licensed as a Life producer, Health producer, Casualty Producer, Property Producer or Personal Lines Producer must complete 20 hours of pre-licensing education. XCEL Solutions will be tracking your time in the course.\n\nPlease note per insurance code regulating pre-licensing education, you will be signed out of your course after 10 minutes of inactivity, and any time accumulated between the last time you saved your progress and the time you were logged out will be removed from your study history.\n\nAny student caught attempting to manipulate or falsify his time will have his account suspended pending further investigation. The student’s study history may be shared with the state’s Department of Insurance for further investigation if it is determined that his course was submitted as “completed,” as he might have willfully violated an insurance regulation by attempting to manipulate or falsify his time.\n\nThe final exam for this course must be a proctored, closed-book exam with no assistance provided. A disinterested third party must proctor the exam. The disinterested third-party proctor or monitor is an individual who has none of the following: family relationship with the student; is a direct supervisor of the student; or a person directly supervised by the student.\n\nA certificate of course completion will be presented within 2 business days of the date the student meets the minimum hour requirements, in addition to passing the course’s final, proctored, exam with a score of 70% or better. The pre-licensing course completion date is the date a member of the compliance department verifies and determines all course and hour requirements have been met.\n\nLicense education credit will not be awarded for taking the course after it loses its status as an approved course.',
  },
  /* ── enrollment-agreement (4) ──────────────────────────────────────────
       The long ones: the programme and its fee, the state agency, cancellation
       and refund by modality, grievance, and the acknowledgments the student
       ticks. Ohio is the outlier twice over — a signature rather than a tick,
       and the only pre-course document that collects identity. */
  {
    id: 'ky-ea',
    state: 'KY',
    moment: 'checkout',
    shape: 'enrollment-agreement',
    title: 'Kentucky — Pre-Course Enrollment Agreement',
    complianceType: 'Enrollment Agreement',
    sourceFile: 'KY PE-Pre-Course Enrollment Agreement.docx',
    subject: 'Kentucky',
    agency: 'Kentucky Commission on Proprietary Education',
    sections: [
      {
        heading: 'Course Program',
        body:
          'Course Program Name: Kentucky Health Prelicensing (20hrs)\nOnline Self-study: 20-hour PE program\nCourse Fee: $199.00\nProgram Length: 30 days from purchase date.\n\nThere are no other fees or expenses associated with the cost of the course unless extensions are purchased as outlined below. Items subject to cost change.\n\nXCEL Solutions does not charge a tuition; the student will pay for each course they would like to take. All students are required to pay for the course in full before they start the course. XCEL Solutions does not offer financial aid or any other type of financing. Course fee may be paid via credit cards: Visa, MasterCard, or American Express.',
      },
      {
        heading: 'Terms of Agreement',
        body:
          '1. XCEL Solutions is open to all persons who meet the entrance requirements regardless of age, race, color, religion, national origin, disability, sex, sexual orientation or gender identity or expression.\n2. XCEL Solutions does not recognize credit from previous education and training programs. The transfer of course credit is determined by the receiving institution.\n3. XCEL Solutions does not offer outside funding\n4. Placement in a job is not guaranteed nor promised to graduates.\n5. It is advisable to contact your state regulator for information specific to becoming an Insurance Producer in your state.',
      },
      {
        heading: 'Cancellation and Refund Policies: Online Instructor-led and Online Self-Paced/Video Courses',
        body:
          '- Starting from the date of purchase, students have 30 days to request a refund.',
      },
      {
        heading: 'Webinar and In-Person Live Courses — (Not applicable to Kentucky residents)',
        body:
          '- Students have until 3 days prior to class start to request a refund.\n- Livestream and Classroom students who do not attend their scheduled class will not qualify for a refund.\n- Students can swap to a self-paced online course (when applicable) if they no longer qualify for a refund.',
      },
      {
        heading: 'All Modalities',
        body:
          '- If any course (sold individually or in a package) is accessed, the course/package is non-refundable.\n- Textbooks and shipping are non-refundable\n- Any refunds for packages that included a physical textbook will be refunded less a $24.95 refund fee.\n\nTo request a refund, please contact us at 866-559-9235.',
      },
      {
        heading: 'Student Grievance:',
        body:
          'Students aggrieved by action of XCEL or personnel of the school should attempt to resolve these issues with proper XCEL personnel. The student shall submit a written internal grievance to the following email: compliance@xcelsolutions.com. The email subject line shall be labeled, "Student Grievance". Students may also submit a letter via certified US mail to: XCEL Solutions, LLC. Attn: School Director, 218 Liberty Street, Warren, PA 16365. Students will receive a response and an offer or resolution within 10 business days. The student’s sponsor/employer may be consulted in determining the resolution.',
      },
      {
        heading: 'Filing a complaint with the Kentucky Commission on Proprietary Education:',
        body:
          'To file a complaint with Kentucky Commission on Proprietary Education, a complaint shall be in writing and shall be filed on a Form PE-24, Form to File a Complaint, accompanied, if applicable, by Form PE-25, Authorization for Release of Student Records.\n\nThe form must be mailed to: Kentucky Commission on Proprietary Education, 500 Mero Street, 4th Floor, Frankfort, Kentucky, 40601. The form can be found on CPE website - www.kcpe.ky.gov',
      },
      {
        heading: 'Existence of the Student Protection Fund',
        body:
          'Pursuant to KRS 165A.450 All licensed schools, resident, and nonresident, shall be required to contribute to a student protection fund. The fund shall be used to reimburse eligible Kentucky students, to pay off debts, including refunds to students enrolled or on leave of absence by not being enrolled for one (1) academic year or less from the school at the time of the closing, incurred due to the closing of a school, discontinuance of a program, loss of license, or loss of accreditation by a school or program.',
      },
    ],
    acknowledgments: ['I received a copy of the catalog (Kentucky School Catalog) and understand that is part of the enrollment agreement.', 'I understand this enrollment agreement constitutes a binding contract.', 'My signature below signifies that I have read and understand all aspects of this agreement, I am at least 18 years of age, and I do recognize my legal responsibilities in regard to this contract.'],
  },
  {
    id: 'nv-ea',
    state: 'NV',
    moment: 'checkout',
    shape: 'enrollment-agreement',
    title: 'Nevada — Pre-Course Enrollment Agreement',
    complianceType: 'Enrollment Agreement',
    sourceFile: 'NV PE-Pre-Course Enrollment Agreement.docx',
    subject: 'Nevada',
    agency: 'Nevada Commission on Postsecondary Education',
    /* ⚠ NEVADA SIGNS, KENTUCKY AND OREGON TICK. Table A6 lists Nevada's
       requirement as a SIGNED enrollment agreement where the other two are
       agreements without that word, and §4.2 row 2 groups all three as a
       checkbox. Where the two disagree the stricter reading wins.

       ⚠ AND IT IS COUNTER-SIGNED. The state profile is explicit: each student
       receives a copy of the agreement "signed by the student AND an
       institution representative", so a copy carrying only the learner's
       signature is not the document Nevada asks for.

       ⚠ THE SIGNATORY IS THE SCHOOL, NOT A NAMED PERSON — here. The
       regulation implies an individual, and the other state profiles do name
       a provider director; Nevada's does not, and inventing one would put a
       person's name on a contract.
       TODO(content): get the Nevada signatory's name and capacity from the
       compliance team, and decide whether it is stamped per agreement or
       held once on the provider record. */
    acknowledgement: 'signature',
    counterSignature: {
      signatory: 'XCEL Solutions, LLC',
      role: 'Institution Representative',
    },
    sections: [
      {
        heading: 'Course Program',
        body:
          'Course Program Name: Nevada Health Prelicensing (20hrs)\nOnline Self-study: 20-hour PE program\nCourse Fee: $199.00\nReporting Fee: $9.00\nProgram Length: 30 days from purchase date.\n\nThere are no other fees or expenses associated with the cost of the course unless extensions are purchased as outlined below. Items subject to cost change.\n\nXCEL Solutions does not charge a tuition; the student will pay for each course they would like to take. All students are required to pay for the course in full before they start the course. XCEL Solutions does not offer financial aid or any other type of financing. Course fee may be paid via credit cards: Visa, MasterCard, or American Express.',
      },
      {
        heading: 'Terms of Agreement',
        body:
          '1. XCEL Solutions is open to all persons who meet the entrance requirements regardless of age, race, color, religion, national origin, disability, sex, sexual orientation or gender identity or expression.\n2. XCEL Solutions does not recognize credit from previous education and training programs. The transfer of course credit is determined by the receiving institution.\n3. XCEL Solutions does not offer outside funding\n4. Placement in a job is not guaranteed nor promised to graduates.\n5. It is advisable to contact your state regulator for information specific to becoming an Insurance Producer in your state.',
      },
      {
        heading: 'Cancellation Policies:',
        body:
          'A student may cancel enrollment by emailing XCEL Solutions at support@xcelsolutions.com\n\nIf cancellation occurs within 72 hours of the date of enrollment all monies shall be refunded to the student.',
      },
      {
        heading: 'Student Grievance:',
        body:
          'Students aggrieved by action of XCEL or personnel of the school should attempt to resolve these issues with proper XCEL personnel. The student shall submit a written internal grievance to the following email: compliance@xcelsolutions.com. The email subject line shall be labeled, "Student Grievance". Students may also submit a letter via certified US mail to: XCEL Solutions, LLC. Attn: School Director, 218 Liberty Street, Warren, PA 16365. Students will receive a response and an offer or resolution within 10 business days. The student’s sponsor/employer may be consulted in determining the resolution.',
      },
      {
        heading: 'Filing a complaint with the Nevada Commission on Postsecondary:',
        body:
          'To file a complaint against a postsecondary institution subject to the laws of Nevada Commission on Postsecondary NRS and NAC Chapters 394, please fill out and submit this form to the address listed below.\n\nCommission on Postsecondary Education, 2800 E. St. Louis Avenue, Las Vegas, NV 89104. The form can be found on CPE website - www.cpe.nv.gov',
      },
    ],
    acknowledgments: ['I received a copy of the catalog (Nevada School Catalog) and understand that is part of the enrollment agreement.', 'I understand this enrollment agreement constitutes a binding contract.', 'My signature below signifies that I have read and understand all aspects of this agreement, I am at least 18 years of age, and I also had the opportunity to ask questions.'],
  },
  {
    /* ⚠ THE SOURCE ALSO ASKS FOR ETHNICITY — “Please type your Ethnicity from
       the following options”, a free-text line, last on the form. Not
       rendered: a demographic question typed as free text is a data-protection
       decision, not a layout one, and it is not this branch's to take.
       TODO(content): confirm whether Oregon still requires it and, if so,
       whether it belongs in the modal or in the account record. */
    id: 'or-ea',
    state: 'OR',
    moment: 'checkout',
    shape: 'enrollment-agreement',
    title: 'Oregon — Pre-Course Enrollment Agreement',
    complianceType: 'Enrollment Agreement',
    sourceFile: 'OR PE-Pre-Course Enrollment Agreement.docx',
    subject: 'Oregon',
    agency: 'Oregon Higher Education Coordinating Commission',
    sections: [
      {
        heading: 'Course Program',
        body:
          'Course Program Name: Oregon Health Prelicensing (20hrs)\nOnline Self-study: 20-hour PE program\nFee: $199.00\nProgram Length: 30 days from purchase date.\n\nThere are no other fees or expenses associated with the cost of the course unless extensions are purchased as outlined below. Items subject to cost change.\n\nXCEL Solutions does not charge a tuition; the student will pay for each course they would like to take. All students are required to pay for the course in full before they start the course. XCEL Solutions does not offer financial aid or any other type of financing. Course fee may be paid via credit cards: Visa, MasterCard, or American Express.',
      },
      {
        heading: 'Terms of Agreement',
        body:
          '1. XCEL Solutions is open to all persons who meet the entrance requirements regardless of age, race, color, religion, national origin, disability, sex, sexual orientation or gender identity or expression.\n2. XCEL Solutions does not recognize credit from previous education and training programs. The transfer of course credit is determined by the receiving institution.\n3. XCEL Solutions does not offer outside funding\n4. Placement in a job is not guaranteed nor promised to graduates.\n5. We do offer course extensions for missed time when a student hardship has occurred.\n6. Students must successfully complete all required reading, course assignments, quizzes, and the final exam in order for course credit and a completion certificate to be issued. If the final examination is not passed on the first attempt, additional attempts will be permitted.\n7. Students must take and pass the final examination with a minimum score of at least 70% based on the information presented throughout the course. The final exam will not become available until all required assignments have been completed.\n8. Completion certificates/transcripts will be distributed through the student’s profile upon course completion.\n9. It is advisable to contact your state regulator for information specific to becoming an Insurance Producer in your state.',
      },
      {
        heading: 'Cancellation and Refund Policies: Online Instructor-led and Online Self-Paced/Video Courses',
        body:
          '- Starting from the date of purchase, students have 30 days to request a refund.',
      },
      {
        heading: 'Webinar and In-Person Live Courses — (Not applicable to Oregon residents)',
        body:
          '- Students have until 3 days prior to class start to request a refund.\n- Livestream and Classroom students who do not attend their scheduled class will not qualify for a refund.\n- Students can swap to a self-paced online course (when applicable) if they no longer qualify for a refund.',
      },
      {
        heading: 'All Modalities',
        body:
          '- If any course (sold individually or in a package) is accessed, the course/package is non-refundable.\n- Textbooks and shipping are non-refundable\n- Any refunds for packages that included a physical textbook will be refunded less a $24.95 refund fee.\n\nTo request a refund, please contact us at 866-559-9235.',
      },
      {
        heading: 'Inquiries',
        body:
          'Any inquiry a student may have regarding this contract may be made in writing to XCEL Solutions LLC, Compliance Department, 218 Liberty Street, Warren, PA 16365 or via email compliance@xcelsolutions.com and or to the Higher Education Coordinating Commission, Private Career Schools Licensing Unit, 3225 25th Street SE, Salem, OR, or by calling (503) 947-5751.',
      },
    ],
    acknowledgments: ['I received a copy of the catalog (Oregon school catalog) and understand that is part of the enrollment agreement.', 'I understand this enrollment agreement constitutes a binding contract.', 'My signature below signifies that I have read and understand all aspects of this agreement, I am at least 18 years of age, and do recognize my legal responsibilities in regard to this contract.'],
  },
  {
    /* ⚠ THE ONLY PRE-COURSE DOCUMENT THAT COLLECTS IDENTITY. “TO BE COMPLETED
       BY STUDENT” asks for last 4 of SSN, date of birth, full residence
       address and phone alongside the signature — which is why this row
       carries `extraFields` where no other enrollment agreement does. */
    id: 'oh-reg',
    state: 'OH',
    moment: 'before-course',
    shape: 'enrollment-agreement',
    title: 'Ohio — Prelicensing Education Student Registration Form',
    complianceType: 'Enrollment Agreement',
    sourceFile: 'OH PE-Registration Form-Pre Course Enrollment Agreement.docx',
    subject: 'Ohio — Student Registration Form',
    agency: 'Ohio Department of Insurance',
    /* §4.2 row 3: "Attestation with signature" — pre-filled details, a
       checkbox confirming them, and a typed name. */
    acknowledgement: 'signature',
    sections: [
      {
        heading: 'Provider',
        body:
          'Provider Name: XCEL Solutions, LLC.\nProvider ID#: 3640\nCourse Type/Program Name: Ohio Health Prelicensing\nExam Method: Electronic\nExam Location: www.xcelsolutions.com',
      },
      {
        heading: 'Study Materials',
        body:
          '(A) Textbook Title and Author/Edition: N/A\n(B) Ohio Bulletin and Course Outline: Below\n(C) Other (explain): N/A\n(D) The Text and other materials will be the property of the Provider',
      },
      {
        heading: 'Fees',
        body:
          'Course Fee: $199.00\nSchool Fees: N/A\nOnline Self-study: 20-hour PE program\nProgram Length: 30 days from purchase date.\n\nThere are no other fees or expenses associated with the cost of the course unless extensions are purchased as outlined below. Items subject to cost change.\n\nXCEL Solutions does not charge a tuition; the student will pay for each course they would like to take. All students are required to pay for the course in full before they start the course. XCEL Solutions does not offer financial aid or any other type of financing. Course fee may be paid via credit cards: Visa, MasterCard, or American Express.',
      },
      {
        heading: 'Cancellation and Refund Policies: Online Instructor-led and Online Self-Paced/Video Courses',
        body:
          '- Starting from the date of purchase, students have 30 days to request a refund.',
      },
      {
        heading: 'Webinar and In-Person Live Courses',
        body:
          '- Students have until 3 days prior to class start to request a refund.\n- Livestream and Classroom students who do not attend their scheduled class will not qualify for a refund.\n- Students can swap to a self-paced online course (when applicable) if they no longer qualify for a refund.',
      },
      {
        heading: 'All Modalities',
        body:
          '- If any course (sold individually or in a package) is accessed, the course/package is non-refundable.\n- Textbooks and shipping are non-refundable\n- Any refunds for packages that included a physical textbook will be refunded less a $24.95 refund fee.\n\nTo request a refund, please contact us at 866-559-9235.',
      },
    ],
    acknowledgments: ['I understand this Registration Form requires a student signature rather than an in-app confirmation.', 'I understand the modality-specific refund schedule described above.'],
    extraFields: ['ssn-last4', 'dob', 'address', 'phone'],
  },
  /* ── affidavit-single (9) ──────────────────────────────────────────────
       One declarant. Three of these were filed two-party by the brief and have
       no proctor section at all; see CA, IL and OH. */
  {
    id: 'ny-post',
    state: 'NY',
    moment: 'after-exam',
    shape: 'affidavit-single',
    title: 'New York — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'NY PE-Post Final Affidavit.docx',
    subject: 'New York',
    /* ⚠ THE EXAM DATE IS NOT THE SIGNING DATE, and New York asks for the
       former: its profile requires "name, date the exam was taken,
       signature, and a statement that it was taken without assistance". The
       source document's field is headed "Today's Date", which is the day the
       affidavit is signed — the same day in the happy path and a different
       one the moment an affidavit is completed late.
       TODO(content): the form's own label should probably change too. */
    body:
      'By submitting this form, the undersigned student acknowledges that the online course examination must be completed unassisted by any person, the course material or other materials. The student also acknowledges that a violation of these standards shall result in loss of course credit and administrative sanction by the New York Department of Financial Services Insurance Department.\n\nThe student further declares that he/she has been actively engaged in one-hundred percent of the online pre-licensing course, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.',
    extraFields: ['exam-date'],
  },
  {
    id: 'ms-post',
    state: 'MS',
    moment: 'before-exam',
    shape: 'affidavit-single',
    title: 'Mississippi — Pre-Final Affidavit',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'MS PE-Pre Final Affidavit.docx',
    subject: 'Mississippi',
    /* ⚠ MISSISSIPPI'S REAL REQUIREMENT IS NOT THIS DOCUMENT. Its profile
       requires, after the exam, that "the proctor signs an affidavit or
       certification that the student completed it without help ... and gives
       their name, address and phone number to the provider. It may be
       administered and signed electronically (state template)." That form is
       NOT in the set — this one is a student pre-exam acknowledgment, which
       Mississippi does not ask for.
       TODO(content): obtain the Mississippi proctor affidavit (state
       template). Until then the state's actual rule is unrepresented. */
    body:
      'By submitting this form, the undersigned student acknowledges that the online course examination must be completed unassisted by any person, the course material or other materials. The student also acknowledges that a violation of these standards shall result in loss of course credit and administrative sanction by the Mississippi Insurance Department.\n\nThe student further declares that he/she has been actively engaged in one-hundred percent of the online pre-licensing course, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.',
    extraFields: [],
  },
  {
    id: 'pa-post',
    state: 'PA',
    moment: 'before-exam',
    shape: 'affidavit-single',
    title: 'Pennsylvania — Pre-Final Affidavit',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'PA PE-Pre Final Affidavit.docx',
    subject: 'Pennsylvania',
    body:
      'By submitting this form, the undersigned student acknowledges that the online course examination must be completed unassisted by any person, the course material or other materials. The student also acknowledges that a violation of these standards shall result in loss of course credit and administrative sanction by the Pennsylvania Department of Insurance.\n\nThe student further declares that he/she has been actively engaged in one-hundred percent of the online pre-licensing course, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.',
    extraFields: [],
  },
  {
    id: 'fl-post',
    state: 'FL',
    moment: 'before-exam',
    shape: 'affidavit-single',
    title: 'Florida — Pre-Final Affidavit',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'FL PE-Pre Final Affidavit.docx',
    subject: 'Florida',
    /* ⚠ THE ROW THAT BROKE THE OLD `timing` FIELD. Florida requires a
       pre-exam unassisted acknowledgment and has NO post-exam requirement —
       its profile reads "After the final exam: proctor or attestation: No
       regulation". Under the old two-value field this was filed `post-final`,
       which said the opposite of what the state asks for. */
    body:
      'By submitting this form, the undersigned student acknowledges that the online course examination must be completed unassisted by any person, the course material or other materials. The student also acknowledges that a violation of these standards shall result in loss of course credit and administrative sanction by the Florida Department of Financial Services.\n\nThe student further declares that he/she has been actively engaged in one-hundred percent of the online pre-licensing course, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.\n\nThe date on this affidavit is the course completion date.',
    extraFields: [],
  },
  {
    /* ⚠ SINGLE-SIGNER, NOT TWO-PARTY — this row was built for a proctor it
       does not have. There is no monitor section anywhere in the file: one
       declaration, a legal name, a signature, a date, and a roster-upload
       block asking for date of birth and the last four of the SSN. The
       proctor, the relationship question and the two-step flow were all the
       brief's invention. */
    id: 'ca-post',
    state: 'CA',
    moment: 'at-completion',
    shape: 'affidavit-single',
    title: 'California — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'CA PE-Post Final Affidavit.docx',
    subject: 'California',
    body:
      'By submitting this form, the undersigned student declares, under penalty of perjury, that he/she has completed the online pre-licensing study course for California in preparation for the licensing examination in that state, including completion of at least 52 hours for the Life and Health Insurance including Ethics and Anti-Fraud course.\n\nThe student further declares that he/she has been actively engaged in one hundred percent of the online pre-licensing course, has completed the total number of required training hours identified above, and has completed one hundred percent of the review questions for each particular section/chapter before proceeding to the next section/chapter.\n\nThe date on this affidavit is the course completion date.\n\n## Course Completion Roster upload form\n\nEducation providers are required to collect and report the following information below upon course completion.',
    extraFields: ['dob', 'ssn-last4'],
  },
  {
    /* ⚠ SINGLE-SIGNER. Flagged as a contradiction on 2026-10-19 from one page;
       the file confirms it. The full SSN is real — it is the roster-upload
       block, not an identity question on the declaration — and the proctor
       step this row used to render does not exist in the document.
       The document is headed “Illinois LIFE Prelicensing Affidavit” against
       an un-lined file name, so a per-line set may still exist. */
    id: 'il-post',
    state: 'IL',
    moment: 'at-completion',
    shape: 'affidavit-single',
    title: 'Illinois — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'IL PE-Post Final Affidavit.docx',
    subject: 'Illinois',
    body:
      'I affirm that I personally completed the entire study material of the course including one hundred percent of the online pre-licensing course and the mandatory 7.5-hour webinar course. I also affirm that I completed the comprehensive final exam unassisted by any person(s), course materials or other materials.\n\nI further acknowledge that a violation of these standards shall result in loss of course credit and administrative sanction by the Illinois Department of Insurance.\n\nThe date on this affidavit is the course completion date.\n\n## Course Completion Roster upload form\n\nEducation providers are required to collect and report the following information below upon course completion.',
    extraFields: ['ssn-full'],
  },
  {
    /* ⚠ SINGLE-SIGNER, and the only 'Final Affidavit'. The file carries its own
       note on why it is both: “This is for both Pre-and Post because of the
       different lines of authority, OH rule says both can’t be on one form
       and OCD does not have the functionality to attach 2 post final
       affidavits.” That is the sixth type name, explained by the document
       itself. Its body is headed “Ohio PROPERTY Pre-Licensing Insurance
       Affidavit”, so this file may be one line of authority's. */
    id: 'oh-post',
    state: 'OH',
    moment: 'after-exam',
    shape: 'affidavit-single',
    title: 'Ohio — Pre & Post Final Affidavit',
    complianceType: 'Final Affidavit',
    sourceFile: 'OH PE-Pre & Post Final Affidavit.docx',
    subject: 'Ohio',
    body:
      'I declare that I personally completed the entire study material of the course including one hundred percent of the online pre-licensing course. I also declare that I completed the comprehensive final exam unassisted by any person(s), course material or other materials.\n\nI further acknowledge that a violation of these standards shall result in loss of course credit and administrative sanction by the Ohio Department of Insurance.\n\nThe date on this affidavit is the course completion date.',
    extraFields: ['exam-date', 'ssn-last4', 'phone'],
  },
  {
    /* ⚠ IT DESCRIBES A PROCTOR BUT DOES NOT COLLECT ONE. The whole first half
       defines who may proctor, and the form the student signs is theirs
       alone — the proctor signs the POST FINAL affidavit instead, which is
       the unreadable PDF below. Single-signer, with the proctor rules as
       reading.

       ⚠ AND MINNESOTA DOES NOT REQUIRE IT. The state profile lists Minnesota
       as "silent on ... pre-exam attestation" — so this document is XCEL's
       own practice rather than a Minnesota rule. It is the state's PROCTOR
       affidavit, after the exam, that Minnesota actually requires, and that
       is the file that cannot be read. */
    id: 'mn-pre-final',
    state: 'MN',
    moment: 'before-exam',
    shape: 'affidavit-single',
    title: 'Minnesota — Pre-Final Affidavit',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'MN PE-Pre Final Affidavit.docx',
    subject: 'Minnesota',
    body:
      '## THIS EXAM MUST BE MONITORED BY A DISINTERESTED THIRD PARTY PROCTOR\n\n## Definition of a Proctor — 45.25 DEFINITIONS, Subd. 12\n\n"Proctor" means a person who (1) verifies a student’s identity, and (2) processes an affidavit testifying that the student received no outside assistance with the course or the examination. A proctor must not be:\n\n- a relative of the student;\n- the student’s supervisor at work;\n- a person the student supervises at work; or\n- a student who is completing the same course.\n\nAn acceptable proctor would not be: friends, family members, or individuals with any personal or financial interest in the student’s success on the exam. The exam will reset if you exit the exam without completing it.\n\n## Student Attestation:\n\nI declare that I will personally complete this exam with no assistance from any person(s), course material, or any additional source of information. This exam will be monitored by a proctor who is an impartial, disinterested third party or currently licensed agent with no family or financial relationship to me. Membership in a professional association/organization does not constitute a financial relationship.\n\nI also understand that the proctor and myself will be required to complete the POST FINAL affidavit.',
    extraFields: [],
  },
  {
    id: 'xcel-generic-attestation',
    state: 'Generic',
    moment: 'before-exam',
    shape: 'affidavit-single',
    title: 'XCEL — General Pre-Final Attestation',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'XCEL PE General Pre-Final Attestation.docx',
    subject: 'XCEL — General',
    body:
      '## THIS EXAM MUST BE MONITORED BY A DISINTERESTED THIRD PARTY PROCTOR\n\n## Definition of a Proctor:\n\nThe proctor must be a disinterested third party, with a minimum age of 18 years, who can be any person except for family members or individuals who have a financial interest in the success of the student taking the examination. Co-worker proctors must not be above or below in the student’s line of supervision.\n\n## Proctor Information and responsibilities:\n\nA proctor is a disinterested third party with no conflict of interest that must verify the identity of the student listed above (i.e., valid photo ID). The proctor must personally observe the completion of the self-study course exam to ensure it is completed without outside assistance of any kind (i.e., human, study material, notes, computer, cell phone, etc.) and physically monitor the student throughout the entire exam process and complete the POST FINAL affidavit.\n\n## Student Attestation:\n\nI declare that I will personally complete this exam with no assistance from any person(s), course material, or any additional source of information. This exam will be monitored by a proctor who is an impartial, disinterested third party or currently licensed agent with no family or financial relationship to me. Membership in a professional association/organization does not constitute a financial relationship.\n\nI also understand that the proctor and I will be required to complete the POST FINAL affidavit.',
    extraFields: [],
  },
  /* ── affidavit-two-party (4) ───────────────────────────────────────────
       ⚠ NOT THE THREE THE BRIEF NAMED. Every one of these was filed as
       single-signer and every one carries an exam-monitor block: a
       relationship question, proctor identity fields and a proctor
       declaration. The option lists differ by state, which is why they are
       read from the config. */
  {
    /* ⚠ TWO-PARTY, and it was filed as single. The file carries a full
       “To be completed and Signed by Exam Monitor” block: a relationship
       question, a proctor address, a printed name and a signature. The three
       documents the brief named as two-party (CA, IL, OH) have no proctor at
       all; these four, all filed as single, do. The shape was inverted. */
    id: 'co-post',
    state: 'CO',
    moment: 'after-exam',
    shape: 'affidavit-two-party',
    title: 'Colorado — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'CO PE-Post Final Affidavit.docx',
    subject: 'Colorado',
    studentBody:
      'I affirm that I personally completed the entire study material of the course. I also affirm that I completed the exam without assistance from any course material, other than source material, or from any person(s).\n\n## Student Certification Statement:\n\nBy submitting this form, I certify that, under the penalty of perjury, I am the person listed above and that my completion of each assignment in this course was the result of my own personal efforts, unassisted by any unauthorized individual or resource, and my work has not been altered or tampered with in any way. I understand that receiving unauthorized assistance or tampering with course results will invalidate my course credit and may be a cause of action under applicable laws and regulations sanctioned by the Colorado Division of Insurance.',
    proctorBody:
      '## To be completed and Signed by Exam Monitor\n\nI certify that I verified the identification of the student. In addition, I administered the final examination and certify that it was sealed until administration and completed without assistance or outside assistance of any kind.',
    relationshipOptions: ['Co-Worker (neither above or below the line of supervision)', 'Librarian', 'Licensed Agent'],
    extraFields: ['exam-date'],
    proctorFields: ['full-name', 'address'],
  },
  {
    id: 'ct-post',
    state: 'CT',
    moment: 'after-exam',
    shape: 'affidavit-two-party',
    title: 'Connecticut — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'CT PE-Post Final Affidavit.docx',
    subject: 'Connecticut',
    /* ⚠ THE FORM IS THE STATE'S, NOT OURS. Connecticut's profile specifies an
       "Affidavit of Personal Responsibility (form provided by the state)" —
       the same form name Wisconsin uses. The wording rendered here is the
       .docx XCEL holds; the state's own form is what a regulator expects.
       TODO(content): confirm the .docx IS the state form before this is
       treated as the real text. */
    studentBody:
      'I affirm that I personally completed the entire study material of the course. I also affirm that I completed the exam without assistance from any course material, other than source material, or from any person(s).\n\n## Student Certification Statement:\n\nBy submitting this form, I certify that, under the penalty of perjury, I am the person listed above and that my completion of each assignment in this course was the result of my own personal efforts, unassisted by any unauthorized individual or resource, and my work has not been altered or tampered with in any way. I understand that receiving unauthorized assistance or tampering with course results will invalidate my course credit and may be a cause of action under applicable laws and regulations sanctioned by the Connecticut Department of Insurance.',
    proctorBody:
      '## To be completed and Signed by Exam Monitor\n\nI certify that I verified the identification of the student. In addition, I administered the final examination and certify that it was sealed until administration and completed without assistance or outside assistance of any kind.',
    relationshipOptions: ['Co-Worker (neither above or below the line of supervision)', 'Librarian', 'Licensed Agent'],
    extraFields: ['exam-date'],
    proctorFields: ['full-name', 'address'],
  },
  {
    /* ⚠ ITS RELATIONSHIP LIST IS NOT THE OTHERS'. Wisconsin offers Neighbour
       where Colorado, Connecticut and West Virginia offer Licensed Agent —
       which is exactly why the options are read from the config per state
       rather than shared. */
    id: 'wi-post',
    state: 'WI',
    moment: 'after-exam',
    shape: 'affidavit-two-party',
    title: 'Wisconsin — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'WI PE-Post Final Affidavit.docx',
    subject: 'Wisconsin',
    /* ⚠ THE REAL SEQUENCE IS THE OTHER WAY ROUND. Wisconsin's profile has the
       proctor verify identity and complete the Affidavit of Personal
       Responsibility BEFORE the exam, and "both proctor and student sign it"
       after. This shape renders student first, then proctor — the order the
       paper form reads in, not the order it is filled in.
       Also the state's own form (the same name Connecticut uses), and the
       certificate needs "specific wording required (provider packet,
       Appendix 5)".
       Resolved 2026-10-20: `proctorFirst` puts the monitor first here and
       leaves the other three alone. */
    proctorFirst: true,
    studentBody:
      'I affirm that I personally completed the entire study material of the course. I also affirm that I completed the exam without assistance from any course material, other than source material, or from any person(s).\n\n## Student Certification Statement:\n\nBy clicking the button below, I certify that, under the penalty of perjury, I am the person listed above and that my completion of each assignment in this course was the result of my own personal efforts, unassisted by any unauthorized individual or resource, and my work has not been altered or tampered with in any way. I understand that receiving unauthorized assistance or tampering with course results will invalidate my course credit and may be a cause of action under applicable laws and regulations of my state.',
    proctorBody:
      '## To be completed and signed by Exam Monitor\n\nI declare that I personally observed the above-named individual during the completion of this examination and also observed that the candidate received no outside assistance in completing the examination. I attest that as an approved proctor I am an impartial disinterested third party or currently licensed agent with no family or financial relationship to the student per section Ins. 26.09 (3), Wis. Adm. Code.',
    relationshipOptions: ['Co-Worker (neither above or below the line of supervision)', 'Librarian', 'Neighbor'],
    extraFields: [],
    proctorFields: ['full-name', 'address', 'phone'],
  },
  {
    id: 'wv-post',
    state: 'WV',
    moment: 'after-exam',
    shape: 'affidavit-two-party',
    title: 'West Virginia — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'WV PE-Post Final Affidavit.docx',
    subject: 'West Virginia',
    studentBody:
      '## TO BE COMPLETED BY THE STUDENT\n\nI declare that I completed the exam with no assistance from any person(s), course material, or any additional source of information. This exam will be proctored by an approved proctor who is an impartial, disinterested third party with no financial relationship to the student.\n\n## Student Certification Statement:\n\nBy submitting this form, I certify that, under the penalty of perjury, I am the person listed above and that my completion of each assignment in this course was the result of my own personal efforts, unassisted by any unauthorized individual or resource, and my work has not been altered or tampered with in any way. I understand that receiving unauthorized assistance or tampering with course results will invalidate my course credit and may be a cause of action under applicable laws and regulations sanctioned by the West Virginia Offices of the Insurance Commissioner.',
    proctorBody:
      '## TO BE COMPLETED BY THE PROCTOR\n\nI certify that I am at least 18 years of age and a disinterested third party with no conflict of interest. A disinterest 3rd party is an individual with no family relationship or financial interest in the examinee’s success on the exam. Co-work proctors must not be above or below in the student’s line of supervision. I verified the identity of the student listed above on this form (i.e. valid photo id), and ensured that the exam was completed without outside assistance of any kind (i.e. human, study material, notes, computer, cell phone, etc.) and that I physically monitored the student throughout the entire exam process.',
    relationshipOptions: ['Co-Worker (neither above or below the line of supervision)', 'Librarian', 'Licensed Agent'],
    extraFields: [],
    proctorFields: ['full-name'],
  },
  /* ── needs-review (1) ──────────────────────────────────────────────────
       Not a UI state. Re-checked against the real file on 2026-10-20 and still
       unreadable; the modal draws the note and Confirm never enables. */
  {
    /* ⚠ RE-CHECKED 2026-10-20 against the real file, not inferred from the
       name. pdftotext, a raw stream decode and a ToUnicode/Differences search
       all failed for the same reason: subset fonts with no character map.
       The structure above is as far as partial decoding goes, and it is
       recorded as inference on purpose — a compliance document reconstructed
       by guessing at a cipher is worse than an empty one. */
    id: 'mn-post-pdf',
    state: 'MN',
    moment: 'after-exam',
    shape: 'needs-review',
    title: 'Minnesota — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'MN PE-Post Final Affidavit.pdf',
    subject: 'Minnesota',
    needsReviewNote:
      'Still the only document in the set whose text cannot be read. It is the only PDF among 23 .docx files, built with Adobe Fill & Sign, and its fonts are subset with NO ToUnicode map and no /Differences array — so there is nothing in the file that says which character each glyph stands for, and extraction returns mojibake rather than words. Enough decodes to see the SHAPE: it is two-party, with "Student’s Full Legal Name / License Number", a student certification, then "Proctor’s Full Legal Name" and a proctor block. That is inference from partially recovered glyphs, not a read. Open the PDF in a viewer and copy its text out by hand before building real content for this one.',
  },
]
