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

export type DocumentTiming = 'pre-course' | 'post-final'

export type DocumentShape =
  | 'notice'
  | 'signed-tc'
  | 'enrollment-agreement'
  | 'affidavit-single'
  | 'affidavit-two-party'
  | 'needs-review'

export type ExtraField = 'dob' | 'ssn-last4' | 'ssn-full' | 'phone' | 'exam-date'

export interface EnrollmentAgreementSection {
  heading: string
  body: string
}

export interface ComplianceDocumentConfig {
  id: string
  /** Two-letter state, or 'Generic' for the brand-level fallbacks. */
  state: string
  timing: DocumentTiming
  shape: DocumentShape
  title: string

  /* ── notice only ── */
  bilingual?: boolean
  bodyEn?: string
  bodyEs?: string

  /* ── signed-tc / affidavit-single body ── */
  body?: string

  /* ── enrollment-agreement only ── */
  agency?: string
  sections?: EnrollmentAgreementSection[]
  acknowledgments?: string[]
  /** OH — the Registration Form needs a typed/physical signature, not a tick. */
  wetSignature?: boolean

  /* ── affidavit-two-party only ── */
  studentBody?: string
  proctorBody?: string
  relationshipOptions?: string[]

  /* ── post-final shapes ── */
  extraFields?: ExtraField[]

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
  'enrollment-agreement': ['name', 'license', 'document'],
  'affidavit-single': ['identity', 'document'],
  'affidavit-two-party': ['student', 'proctor'],
  'needs-review': ['document'],
}

export const COMPLIANCE_DOCUMENTS: ComplianceDocumentConfig[] = [
  /* ── notice (2) ─────────────────────────────────────────────────────────
     No name and no signature anywhere — body text and "I Agree". Both are
     bilingual, which is why the shape carries a language toggle at all. */
  {
    id: 'fl-notice-lh',
    state: 'FL',
    timing: 'pre-course',
    shape: 'notice',
    title: 'Florida — Life & Health Pre-Course Notice',
    bilingual: true,
    bodyEn:
      'This notice confirms you are enrolling in a Florida Department of Financial Services–approved Life, Health, or Life & Health pre-licensing course. Completion of this course satisfies the pre-licensing education requirement under Florida law prior to taking the state licensing examination.',
    bodyEs:
      'Este aviso confirma que usted se está inscribiendo en un curso de pre-licencia de Vida, Salud, o Vida y Salud aprobado por el Departamento de Servicios Financieros de la Florida. La finalización de este curso satisface el requisito de educación de pre-licencia bajo la ley de la Florida antes de tomar el examen estatal de licencia.',
  },
  {
    id: 'fl-notice-pc',
    state: 'FL',
    timing: 'pre-course',
    shape: 'notice',
    title: 'Florida — Property & Casualty Pre-Course Notice',
    bilingual: true,
    bodyEn:
      'This notice confirms you are enrolling in a Florida Department of Financial Services–approved Property & Casualty (General Lines) pre-licensing course, administered under FAIA program guidelines. Completion of this course satisfies the pre-licensing education requirement under Florida law prior to taking the state licensing examination.',
    /* ⚠ CORRECTED SPANISH TEXT — this is NOT what the live source document
       says. The source's Spanish paragraph is copy-pasted from the Life &
       Health notice, so it names the wrong program (NAIFA instead of FAIA) and
       the wrong license line (Life & Health instead of Property & Casualty).
       The corrected text is below.
       TODO(content): confirm the fix with Bonnie/Patrick before this replaces
       the live document. */
    bodyEs:
      'Este aviso confirma que usted se está inscribiendo en un curso de pre-licencia de Propiedad y Accidentes (Líneas Generales) aprobado por el Departamento de Servicios Financieros de la Florida, administrado bajo las pautas del programa FAIA. La finalización de este curso satisface el requisito de educación de pre-licencia bajo la ley de la Florida antes de tomar el examen estatal de licencia.',
  },

  /* ── signed-tc (4) ──────────────────────────────────────────────────────
     Student Name + Signature, then Agree/Attest. */
  {
    id: 'xcel-generic-tc',
    state: 'Generic',
    timing: 'pre-course',
    shape: 'signed-tc',
    title: 'XCEL Generic — Terms & Conditions',
    body: "By typing your name below and selecting Attest, you acknowledge that you have read and agree to XCEL Solutions' course terms and conditions, including attendance requirements, academic integrity standards, and the refund policy described in your enrollment materials.",
  },
  {
    id: 'ca-tc',
    state: 'CA',
    timing: 'pre-course',
    shape: 'signed-tc',
    title: 'California — Pre-Course Terms & Conditions',
    body: 'You acknowledge this course meets the California Department of Insurance pre-licensing education requirement. By signing below you attest the information you provide for enrollment is accurate and you agree to the attendance-monitoring requirements of your course delivery method.',
  },
  {
    id: 'il-tc',
    state: 'IL',
    timing: 'pre-course',
    shape: 'signed-tc',
    title: 'Illinois — Terms & Conditions / Pre-Course Affidavit',
    body: 'I affirm the enrollment information I have submitted is true and correct, and I understand that submitting false information may be grounds for denial of licensure by the Illinois Department of Insurance.',
  },
  {
    id: 'mn-tc',
    state: 'MN',
    timing: 'pre-course',
    shape: 'signed-tc',
    title: 'Minnesota — Terms & Conditions / Pre-Course Affidavit',
    body: 'I understand this course satisfies the Minnesota Department of Commerce pre-licensing education requirement and agree to complete all required coursework prior to scheduling my licensing examination.',
  },

  /* ── enrollment-agreement (4) ───────────────────────────────────────────
     The long ones: pricing, cancellation/refund, grievance, and a list of
     acknowledgments. Ohio is the outlier — a wet signature, not a tick. */
  {
    id: 'ky-ea',
    state: 'KY',
    timing: 'pre-course',
    shape: 'enrollment-agreement',
    title: 'Kentucky — Pre-Course Enrollment Agreement',
    agency: 'Kentucky Department of Insurance',
    sections: [
      {
        heading: 'Terms of Agreement',
        body: 'This Enrollment Agreement is between the student and XCEL Solutions for pre-licensing education approved by the Kentucky Department of Insurance. Tuition, course materials, and delivery method are as selected at enrollment.',
      },
      {
        heading: 'Cancellation & Refund Policy',
        body: 'A student may cancel enrollment by written notice prior to course start for a full refund less a processing fee. Cancellations after course access has been granted are refunded on a pro-rated basis per the schedule provided at enrollment.',
      },
      {
        heading: 'Student Grievance Process',
        body: "A student with a complaint should first contact XCEL Solutions' student services department. Unresolved grievances may be submitted in writing to the Kentucky Department of Insurance.",
      },
    ],
    acknowledgments: [
      'I understand the tuition, fees, and refund schedule described above.',
      'I understand I am responsible for scheduling my own licensing examination after course completion.',
      'I understand how to file a grievance if I am dissatisfied with my course.',
    ],
  },
  {
    id: 'nv-ea',
    state: 'NV',
    timing: 'pre-course',
    shape: 'enrollment-agreement',
    title: 'Nevada — Pre-Course Enrollment Agreement',
    agency: 'Nevada Commission on Postsecondary Education',
    sections: [
      {
        heading: 'Terms of Agreement',
        body: 'This Enrollment Agreement sets out the terms under which XCEL Solutions will provide pre-licensing instruction regulated by the Nevada Commission on Postsecondary Education.',
      },
      {
        heading: 'Cancellation Policies',
        body: 'A student may cancel enrollment by emailing XCEL Solutions at the address provided in course materials. Refunds are issued according to the schedule set out by the Commission.',
      },
      {
        heading: 'Student Grievance',
        body: 'Students with unresolved complaints may submit a letter via certified U.S. mail to the Nevada Commission on Postsecondary Education.',
      },
    ],
    acknowledgments: [
      'I understand the Commission-regulated cancellation policy described above.',
      'I understand how to escalate a grievance to the Nevada Commission on Postsecondary Education.',
    ],
  },
  {
    id: 'or-ea',
    state: 'OR',
    timing: 'pre-course',
    shape: 'enrollment-agreement',
    title: 'Oregon — Pre-Course Enrollment Agreement',
    agency: 'Oregon Higher Education Coordinating Commission',
    sections: [
      {
        heading: 'Terms of Agreement',
        body: 'This Enrollment Agreement governs pre-licensing instruction provided by XCEL Solutions under the oversight of the Oregon Higher Education Coordinating Commission.',
      },
      {
        heading: 'Cancellation & Refund Policies — Online Instructor-Led & Self-Paced/Video',
        body: 'Refunds for online instructor-led and self-paced/video courses follow a declining schedule based on the percentage of the course accessed at the time of cancellation.',
      },
      {
        heading: 'Cancellation & Refund Policies — All Modalities',
        body: 'No refund is issued once a course completion certificate has been issued or the licensing examination has been scheduled through XCEL Solutions.',
      },
    ],
    acknowledgments: [
      'I understand the modality-specific refund schedule described above.',
      'I understand no refund is available after a completion certificate is issued.',
    ],
  },
  {
    id: 'oh-reg',
    state: 'OH',
    timing: 'pre-course',
    shape: 'enrollment-agreement',
    title: 'Ohio — Prelicensing Education Student Registration Form',
    agency: 'Ohio Department of Insurance',
    /* The one variant that cannot be click-to-agree: the Registration Form
       wants a signature, so the document step ends in a typed-name field
       standing in for the physical one. */
    wetSignature: true,
    sections: [
      {
        heading: 'Cancellation & Refund Policies — Online & Self-Paced',
        body: 'Refunds for online instructor-led and self-paced/video courses follow a declining schedule based on the percentage of the course accessed at the time of cancellation.',
      },
      {
        heading: 'Cancellation & Refund Policies — Webinar & In-Person Live',
        body: 'Refunds for webinar and in-person live courses follow a declining schedule based on days of notice given before the scheduled session.',
      },
      {
        heading: 'Cancellation & Refund Policies — All Modalities',
        body: 'No refund is issued once a course completion certificate has been issued to the Ohio Department of Insurance.',
      },
    ],
    acknowledgments: [
      'I understand this Registration Form requires a physical student signature rather than an in-app confirmation.',
      'I understand the modality-specific refund schedule described above.',
    ],
  },

  /* ── affidavit-single (10) ──────────────────────────────────────────────
     One declarant, after course completion, before/during the exam. None of
     the ten real documents asks for a field beyond the name. */
  {
    id: 'ny-post',
    state: 'NY',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'New York — Post Final Affidavit',
    body: 'I declare under penalty of perjury that I personally completed all required pre-licensing coursework and that no other person completed any portion of this course on my behalf.',
    extraFields: [],
  },
  {
    id: 'ms-post',
    state: 'MS',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Mississippi — Pre-Final Affidavit',
    body: 'I attest that the coursework reflected in my completion record was completed by me, without assistance, and in accordance with Mississippi Insurance Department requirements.',
    extraFields: [],
  },
  {
    id: 'pa-post',
    state: 'PA',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Pennsylvania — Pre-Final Affidavit',
    body: 'I certify that I am the individual who completed this pre-licensing course and that the information on my completion record is accurate.',
    extraFields: [],
  },
  {
    id: 'fl-post',
    state: 'FL',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Florida — Pre-Final Affidavit',
    body: 'I attest under penalty of perjury under the laws of the State of Florida that I am the person who completed this course.',
    extraFields: [],
  },
  {
    id: 'co-post',
    state: 'CO',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Colorado — Post Final Affidavit',
    body: 'I certify that I personally completed this pre-licensing course in accordance with Colorado Division of Insurance requirements.',
    extraFields: [],
  },
  {
    id: 'ct-post',
    state: 'CT',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Connecticut — Post Final Affidavit',
    body: 'I attest, under penalty of law, that I am the individual who completed this pre-licensing course without unauthorized assistance.',
    extraFields: [],
  },
  {
    id: 'wi-post',
    state: 'WI',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Wisconsin — Post Final Affidavit',
    body: 'I certify that I personally completed the coursework required for licensure under Wisconsin Office of the Commissioner of Insurance regulations.',
    extraFields: [],
  },
  {
    id: 'wv-post',
    state: 'WV',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'West Virginia — Post Final Affidavit',
    body: 'I attest that I am the person who completed this pre-licensing course and that no other individual completed any portion on my behalf.',
    extraFields: [],
  },
  {
    id: 'mn-pre-final',
    state: 'MN',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Minnesota — Pre-Final Affidavit',
    body: 'I declare that I personally completed this course and am prepared to sit for the Minnesota licensing examination.',
    extraFields: [],
  },
  {
    id: 'xcel-generic-attestation',
    state: 'Generic',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'XCEL — General Pre-Final Attestation',
    body: 'I attest that I personally completed all coursework required for this program and that the information in my completion record is accurate.',
    extraFields: [],
  },

  /* ── affidavit-two-party (3) ────────────────────────────────────────────
     A student declaration AND a separate proctor declaration. The proctor's
     relationship-to-examinee option set varies by state, and the student side
     asks for extra identity fields that also vary. */
  {
    id: 'ca-post',
    state: 'CA',
    timing: 'post-final',
    shape: 'affidavit-two-party',
    title: 'California — Post Final Affidavit',
    relationshipOptions: ['Instructor', 'Proctor', 'School Official', 'Notary'],
    extraFields: ['dob', 'ssn-last4'],
    studentBody:
      'I declare under penalty of perjury that I personally completed this pre-licensing course without unauthorized assistance, in accordance with California Department of Insurance requirements.',
    proctorBody:
      'I declare that I personally observed the examinee identified in this affidavit and verified their identity using government-issued photo identification.',
  },
  {
    id: 'il-post',
    state: 'IL',
    timing: 'post-final',
    shape: 'affidavit-two-party',
    title: 'Illinois — Post Final Affidavit',
    relationshipOptions: ['Instructor', 'Proctor', 'School Official', 'Notary'],
    extraFields: ['ssn-full'],
    studentBody:
      'I affirm I completed this pre-licensing course personally and that the record of completion submitted to the Illinois Department of Insurance is accurate.',
    proctorBody:
      'I affirm I verified the identity of the examinee named in this affidavit prior to course completion sign-off.',
  },
  {
    id: 'oh-post',
    state: 'OH',
    timing: 'post-final',
    shape: 'affidavit-two-party',
    title: 'Ohio — Pre & Post Final Affidavit',
    relationshipOptions: ['Instructor', 'Proctor', 'School Official', 'Employer', 'Notary', 'Other'],
    extraFields: ['ssn-last4', 'phone', 'exam-date'],
    studentBody:
      'I certify that I completed this pre-licensing course in compliance with Ohio Department of Insurance requirements and that I intend to sit for the licensing examination on the date provided.',
    proctorBody:
      'I certify that I verified the identity of the examinee and witnessed completion of the affidavit requirements described above.',
  },

  /* ── needs-review (1) ───────────────────────────────────────────────────
     NOT A UI STATE anyone should reach. The source PDF resisted text
     extraction, so there is no content to render and nothing to invent. The
     modal draws the note and keeps Next permanently off. */
  {
    id: 'mn-post-pdf',
    state: 'MN',
    timing: 'post-final',
    shape: 'needs-review',
    title: 'Minnesota — Post Final Affidavit',
    needsReviewNote:
      'Source content could not be extracted. The original PDF uses a custom/embedded font encoding that defeats text extraction. Visible field labels suggest a single-party affidavit (Business Address, City, State, Zip, Phone, Date, Student Signature) but that is inference, not a confirmed read — open the source file directly in a PDF viewer before building real content for this one.',
  },
]
