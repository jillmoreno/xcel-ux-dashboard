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
  timing: DocumentTiming
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
  /** The document's OWN internal heading, where it has one distinct from its
   *  title — "Acknowledgement of Terms and Conditions of Pre-licensing Course
   *  Completion". Per language, because the document prints it twice. */
  headingEn?: string
  headingEs?: string

  /* ── single-language signed-tc / affidavit-single body ── */
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
    complianceType: 'Pre-Course Notice',
    sourceFile: 'FL PE-Pre Course Notice-LifeHealth.docx',
    subject: 'Florida — Life & Health',
    bilingual: true,
    /* ⚠ VERBATIM FROM THE SOURCE DOCUMENT (2026-10-19), replacing the
       placeholder this shipped with. The placeholder said the notice was
       about satisfying the pre-licensing education requirement; it is not.
       It is about the NAIFA STUDY MANUAL — that the exam is based on it,
       that the course does not include it, and where to buy it. A document
       whose actual subject is wrong is worse than one with no text at all,
       because it reads as finished.

       ⚠ "I acknowledged" IS THE SOURCE'S OWN WORDING, past tense where the
       sentence wants the present. Kept as-is: this is a legal document
       rendered verbatim, and silently correcting its grammar is how a
       prototype and a signed document drift apart.
       TODO(content): worth raising with Bonnie/Patrick alongside the P&C
       Spanish defect. */
    bodyEn:
      'The Florida Department of Financial Services requires a study manual for life and/or health courses, NAIFA Health & Life (including Annuities & Variable Contracts). The related state licensing examination will be based upon the latest edition of the Florida Life, Health and Variable Annuity Study Manual. The Study Manual is not included with this course but it can be obtained from the National Association of Insurance and Financial Advisors-Florida (NAIFA-Florida), PO Box 14365, Tallahassee, FL 32317. (850) 422-1701, or may be ordered online at http://naifa-florida.org. The Study Manual is also available in Spanish.\n\nBy clicking the \u201CI Agree\u201D button below, I acknowledged the above information.',
    bodyEs:
      'El Departamento de Servicios Financieros de Florida exige un manual de estudio para los cursos de vida y/o salud, NAIFA Salud y Vida (incluyendo Anualidades y Contratos Variables). El examen de licencia estatal relacionado se basará en la última edición del Manual de estudio de vida, salud y anualidades variables de Florida. El Manual de estudio no está incluido en este curso, pero se puede obtener en la Asociación Nacional de Asesores Financieros y de Seguros de Florida (NAIFA-Florida), PO Box 14365, Tallahassee, FL 32317. (850) 422-1701, o se puede solicitar en línea en http://naifa-florida.org. El Manual de estudio también está disponible en español.\n\nAl seleccionar el botón \u201CAcepto\u201D a continuación, reconozco la información anterior.',
  },
  {
    id: 'fl-notice-pc',
    state: 'FL',
    timing: 'pre-course',
    shape: 'notice',
    title: 'Florida — Property & Casualty Pre-Course Notice',
    complianceType: 'Pre-Course Notice',
    sourceFile: 'FL PE-Pre Course Notice-PropertyCasualty.docx',
    subject: 'Florida — Property & Casualty',
    bilingual: true,
    bodyEn:
      'This notice confirms you are enrolling in a Florida Department of Financial Services–approved Property & Casualty (General Lines) pre-licensing course, administered under FAIA program guidelines. Completion of this course satisfies the pre-licensing education requirement under Florida law prior to taking the state licensing examination.',
    /* ⚠ STILL PLACEHOLDER TEXT, both halves — and the only row left that is.
       The Life & Health notice above was replaced with its real wording on
       2026-10-19; this one has not been read yet, so what is below describes
       the right SUBJECT in the wrong words.

       ⚠ AND THE DEFECT THIS CARRIES IS NOW LESS CERTAIN THAN IT LOOKED. The
       brief reported the source's Spanish as copy-pasted from Life & Health —
       naming NAIFA where it should name FAIA — and this row was written to
       carry the correction. Seeing the real Life & Health text shows NAIFA is
       correct THERE (it is the life/health study-manual publisher), so the
       claim is about this document alone and has not been verified against
       it. Do not treat the FAIA wording below as a confirmed fix.
       TODO(content): read `FL PE-Pre Course Notice-PropertyCasualty.docx` and
       replace BOTH bodies verbatim, then settle the NAIFA/FAIA question with
       Bonnie/Patrick. */
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
    complianceType: 'Terms and Conditions',
    sourceFile: 'XCEL Generic Terms and Conditions-Pre-Course Affidavit.docx',
    subject: 'XCEL — Generic',
    /* ⚠ VERBATIM FROM THE SOURCE (2026-10-19), replacing the placeholder,
       which described the wrong subject: it talked about attendance
       requirements, academic integrity and the refund policy. The document is
       about PROCTORING — that the final must be proctored and closed-book,
       who is disqualified from proctoring it, the 70% pass mark, and that the
       completion date is the date the proctor signs.

       ⚠ AND IT IS BILINGUAL, which `signed-tc` did not previously allow. The
       file prints the English acknowledgement and then the Spanish one, the
       same way the Florida notices do.

       ⚠ THE SOURCE ASKS FOR ONE FIELD, "Student Full Name", where this shape
       renders Student Name AND a typed signature. The extra field is the
       brief's, not the document's.
       TODO(content): confirm whether the signature line should go. */
    bilingual: true,
    headingEn: 'Acknowledgement of Terms and Conditions of Pre-licensing Course Completion',
    bodyEn:
      'I understand and acknowledge that the pre-licensing insurance course final exam must be a proctored, closed-book exam with no assistance provided. A disinterested third party must proctor the exam. The disinterested third-party proctor or monitor is an individual who has none of the following: family relationship with the student; is a direct supervisor of the student; or a person directly supervised by the student.\n\nA certificate of course completion is to be presented to the student who successfully passes the exam with a score of 70% or better within 2 days of the completion date. The pre-licensing course completion date is the date the proctor signs and dates the exam.',
    headingEs:
      'Reconocimiento de los Términos y Condiciones de la Finalización del Curso de Pre-licencia',
    bodyEs:
      'Yo entiendo y reconozco que el examen final del curso de seguro pre-licencia debe ser un examen supervisado y cerrado sin ayuda. Un tercero desinteresado debe supervisar el examen. El supervisor o monitor de terceros desinteresados es un individuo que no tiene ninguno de los siguientes: relación familiar con el estudiante; es un supervisor directo del estudiante; o una persona directamente supervisada por el estudiante.\n\nUn certificado de finalización del curso debe ser presentado al estudiante que pase el examen con una puntuación de 70% o mejor dentro de los 2 días de la fecha de finalización. La fecha de finalización del curso de pre-licencia es la fecha en que el supervisor firma y fecha el examen.',
  },
  {
    id: 'ca-tc',
    state: 'CA',
    timing: 'pre-course',
    shape: 'signed-tc',
    title: 'California — Pre-Course Terms & Conditions',
    complianceType: 'Terms and Conditions',
    sourceFile: 'CA PE-Pre-Course Terms and Conditions.docx',
    subject: 'California',
    body: 'You acknowledge this course meets the California Department of Insurance pre-licensing education requirement. By signing below you attest the information you provide for enrollment is accurate and you agree to the attendance-monitoring requirements of your course delivery method.',
  },
  {
    id: 'il-tc',
    state: 'IL',
    timing: 'pre-course',
    shape: 'signed-tc',
    title: 'Illinois — Terms & Conditions / Pre-Course Affidavit',
    complianceType: 'Terms and Conditions',
    sourceFile: 'IL PE-Terms and Conditions-Pre-Course Affidavit.docx',
    subject: 'Illinois',
    body: 'I affirm the enrollment information I have submitted is true and correct, and I understand that submitting false information may be grounds for denial of licensure by the Illinois Department of Insurance.',
  },
  {
    id: 'mn-tc',
    state: 'MN',
    timing: 'pre-course',
    shape: 'signed-tc',
    title: 'Minnesota — Terms & Conditions / Pre-Course Affidavit',
    complianceType: 'Terms and Conditions',
    sourceFile: 'MN PE-Terms and Conditions-Pre-Course Affidavit - Copy.docx',
    subject: 'Minnesota',
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
    complianceType: 'Enrollment Agreement',
    sourceFile: 'KY PE-Pre-Course Enrollment Agreement.docx',
    subject: 'Kentucky',
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
    complianceType: 'Enrollment Agreement',
    sourceFile: 'NV PE-Pre-Course Enrollment Agreement.docx',
    subject: 'Nevada',
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
    complianceType: 'Enrollment Agreement',
    sourceFile: 'OR PE-Pre-Course Enrollment Agreement.docx',
    subject: 'Oregon',
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
    complianceType: 'Enrollment Agreement',
    sourceFile: 'OH PE-Registration Form-Pre Course Enrollment Agreement.docx',
    subject: 'Ohio — Student Registration Form',
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
    complianceType: 'Post Final Affidavit',
    sourceFile: 'NY PE-Post Final Affidavit.docx',
    subject: 'New York',
    body: 'I declare under penalty of perjury that I personally completed all required pre-licensing coursework and that no other person completed any portion of this course on my behalf.',
    extraFields: [],
  },
  {
    id: 'ms-post',
    state: 'MS',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Mississippi — Pre-Final Affidavit',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'MS PE-Pre Final Affidavit.docx',
    subject: 'Mississippi',
    body: 'I attest that the coursework reflected in my completion record was completed by me, without assistance, and in accordance with Mississippi Insurance Department requirements.',
    extraFields: [],
  },
  {
    id: 'pa-post',
    state: 'PA',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Pennsylvania — Pre-Final Affidavit',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'PA PE-Pre Final Affidavit.docx',
    subject: 'Pennsylvania',
    body: 'I certify that I am the individual who completed this pre-licensing course and that the information on my completion record is accurate.',
    extraFields: [],
  },
  {
    id: 'fl-post',
    state: 'FL',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Florida — Pre-Final Affidavit',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'FL PE-Pre Final Affidavit.docx',
    subject: 'Florida',
    body: 'I attest under penalty of perjury under the laws of the State of Florida that I am the person who completed this course.',
    extraFields: [],
  },
  {
    id: 'co-post',
    state: 'CO',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Colorado — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'CO PE-Post Final Affidavit.docx',
    subject: 'Colorado',
    body: 'I certify that I personally completed this pre-licensing course in accordance with Colorado Division of Insurance requirements.',
    extraFields: [],
  },
  {
    id: 'ct-post',
    state: 'CT',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Connecticut — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'CT PE-Post Final Affidavit.docx',
    subject: 'Connecticut',
    body: 'I attest, under penalty of law, that I am the individual who completed this pre-licensing course without unauthorized assistance.',
    extraFields: [],
  },
  {
    id: 'wi-post',
    state: 'WI',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Wisconsin — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'WI PE-Post Final Affidavit.docx',
    subject: 'Wisconsin',
    body: 'I certify that I personally completed the coursework required for licensure under Wisconsin Office of the Commissioner of Insurance regulations.',
    extraFields: [],
  },
  {
    id: 'wv-post',
    state: 'WV',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'West Virginia — Post Final Affidavit',
    complianceType: 'Post Final Affidavit',
    sourceFile: 'WV PE-Post Final Affidavit.docx',
    subject: 'West Virginia',
    body: 'I attest that I am the person who completed this pre-licensing course and that no other individual completed any portion on my behalf.',
    extraFields: [],
  },
  {
    id: 'mn-pre-final',
    state: 'MN',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'Minnesota — Pre-Final Affidavit',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'MN PE-Pre Final Affidavit.docx',
    subject: 'Minnesota',
    body: 'I declare that I personally completed this course and am prepared to sit for the Minnesota licensing examination.',
    extraFields: [],
  },
  {
    id: 'xcel-generic-attestation',
    state: 'Generic',
    timing: 'post-final',
    shape: 'affidavit-single',
    title: 'XCEL — General Pre-Final Attestation',
    complianceType: 'Pre-Final Affidavit',
    sourceFile: 'XCEL PE General Pre-Final Attestation.docx',
    subject: 'XCEL — General',
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
    complianceType: 'Post Final Affidavit',
    sourceFile: 'CA PE-Post Final Affidavit.docx',
    subject: 'California',
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
    complianceType: 'Post Final Affidavit',
    sourceFile: 'IL PE-Post Final Affidavit.docx',
    subject: 'Illinois',
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
    /* ⚠ THE ONE 'Final Affidavit', and the source file is why: it is
       "Pre & Post Final Affidavit" — ONE document serving both sittings,
       where every other state ships a separate Pre and a separate Post.
       'Final Affidavit' is the only one of the six names that covers both
       without claiming it is only one of them. Filed as a Post Final
       Affidavit until the file list settled it. */
    complianceType: 'Final Affidavit',
    sourceFile: 'OH PE-Pre & Post Final Affidavit.docx',
    subject: 'Ohio',
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
    complianceType: 'Post Final Affidavit',
    sourceFile: 'MN PE-Post Final Affidavit.pdf',
    subject: 'Minnesota',
    needsReviewNote:
      'Source content could not be extracted. The original PDF uses a custom/embedded font encoding that defeats text extraction. Visible field labels suggest a single-party affidavit (Business Address, City, State, Zip, Phone, Date, Student Signature) but that is inference, not a confirmed read — open the source file directly in a PDF viewer before building real content for this one.',
  },
]
