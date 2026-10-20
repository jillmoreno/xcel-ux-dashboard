import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ComplianceDocumentModal } from '@/components/courses/ComplianceDocumentModal'
import {
  COMPLIANCE_DOCUMENTS,
  MOMENT_LABEL,
  STEPS_BY_SHAPE,
  stepsFor,
  type ComplianceDocumentConfig,
  type DocumentShape,
} from '@/data/complianceDocuments'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * WHAT THIS PINS, and it is the thing the adaptive rewrite exists for: the
 * steps come from the SHAPE, and each step's Next stays off until that step's
 * own fields are filled. A modal that advances on an empty affidavit is the
 * failure mode worth a test — it produces a signed compliance document with no
 * signer in it.
 *
 * The data is covered directly rather than through the UI (24 documents × six
 * shapes is a table, not a render), and the two documents that are exceptions
 * — the FL P&C Spanish correction and MN's unreadable PDF — are pinned by name
 * so neither can be quietly "fixed" back.
 */

function docById(id: string): ComplianceDocumentConfig {
  const d = COMPLIANCE_DOCUMENTS.find((x) => x.id === id)
  if (!d) throw new Error(`no such document: ${id}`)
  return d
}

function open(config: ComplianceDocumentConfig, language?: 'en' | 'es') {
  const onComplete = vi.fn()
  const onClose = vi.fn()
  render(
    <ComplianceDocumentModal
      open
      config={config}
      language={language}
      onClose={onClose}
      onComplete={onComplete}
    />,
  )
  return { onComplete, onClose }
}

/* Every step ends in a named pair: Cancel/Back on the left, Next/Confirm on
   the right. There are no arrows anywhere. */
const nextButton = () => screen.getByRole('button', { name: /^next$/i })
const confirmButton = () => screen.getByRole('button', { name: /^confirm$/i })
const backButton = () => screen.getByRole('button', { name: /^back$/i })
/** The one field never prefilled — the learner has to produce it. */
const sign = (value = 'Jordan Riley Navarro') => typeInto(/^digitally sign$/i, value)
const cancelButton = () => screen.getByRole('button', { name: /^cancel$/i })

/** Fill the three boxes a legal name is collected in, anywhere one is asked. */
function typeName(first = 'Jordan', middle = 'Riley', last = 'Navarro') {
  typeInto(/^first name$/i, first)
  typeInto(/^middle name/i, middle)
  typeInto(/^last name$/i, last)
}

/** Clear the `name` step a two-step document opens on. */
function toDocumentStep() {
  typeName()
  fireEvent.click(screen.getByLabelText(/legal name/i))
  fireEvent.click(nextButton())
}
const typeInto = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('the document set', () => {
  it('is all 24, in the six shapes, with no duplicate ids', () => {
    expect(COMPLIANCE_DOCUMENTS).toHaveLength(24)
    expect(new Set(COMPLIANCE_DOCUMENTS.map((d) => d.id)).size).toBe(24)

    const count = (shape: DocumentShape) =>
      COMPLIANCE_DOCUMENTS.filter((d) => d.shape === shape).length
    expect(count('notice')).toBe(2)
    expect(count('signed-tc')).toBe(4)
    expect(count('enrollment-agreement')).toBe(4)
    expect(count('affidavit-single')).toBe(9)
    expect(count('affidavit-two-party')).toBe(4)
    expect(count('needs-review')).toBe(1)
  })

  it('gives every document the content its own shape renders', () => {
    for (const d of COMPLIANCE_DOCUMENTS) {
      expect(d.subject, d.id).toBeTruthy()
      // The subject must not repeat the kind the heading already shows.
      expect(d.subject.includes(d.complianceType), d.id).toBe(false)
      if (d.shape === 'notice') {
        expect(d.bodyEn, d.id).toBeTruthy()
        if (d.bilingual) expect(d.bodyEs, d.id).toBeTruthy()
      }
      /* A `## ` heading is a block inside the body, so a bilingual document
         either heads both languages or neither — one alone would print the
         wrong language's heading over the right body. */
      if (d.bilingual) {
        expect(d.bodyEn?.startsWith('## '), d.id).toBe(d.bodyEs?.startsWith('## '))
      }
      /* A bilingual document carries the pair; a single-language one carries
         `body`. Either is complete; neither is optional. */
      if (d.shape === 'signed-tc' || d.shape === 'affidavit-single') {
        if (d.bilingual) {
          expect(d.bodyEn, d.id).toBeTruthy()
          expect(d.bodyEs, d.id).toBeTruthy()
        } else {
          expect(d.body, d.id).toBeTruthy()
        }
      }
      if (d.shape === 'enrollment-agreement') {
        expect(d.sections?.length, d.id).toBeGreaterThan(0)
        expect(d.acknowledgments?.length, d.id).toBeGreaterThan(0)
      }
      if (d.shape === 'affidavit-two-party') {
        expect(d.studentBody, d.id).toBeTruthy()
        expect(d.proctorBody, d.id).toBeTruthy()
        expect(d.relationshipOptions?.length, d.id).toBeGreaterThan(0)
      }
    }
  })

  /* The heading is the TYPE now, so an unstamped document would head a modal
     with `undefined`. The type is also a different axis from the shape, which
     is the thing most likely to get "tidied" into one field later. */
  it('gives all 24 a compliance type, and keeps it independent of the shape', () => {
    for (const d of COMPLIANCE_DOCUMENTS) {
      expect(d.complianceType, d.id).toBeTruthy()
    }
    // One type spanning two shapes, and one shape spanning two types — either
    // direction collapsing would break both of these.
    const postFinal = COMPLIANCE_DOCUMENTS.filter((d) => d.complianceType === 'Post Final Affidavit')
    expect(new Set(postFinal.map((d) => d.shape)).size).toBeGreaterThan(1)
    const single = COMPLIANCE_DOCUMENTS.filter((d) => d.shape === 'affidavit-single')
    expect(new Set(single.map((d) => d.complianceType)).size).toBeGreaterThan(1)
  })

  /* Every row names the file it was read from, and every one of the six
     names is used by at least one document — the check that caught Ohio,
     which had been filed as a Post Final Affidavit until the file list showed
     it is "Pre & Post" and so the only 'Final Affidavit' in the set. */
  it('ties every document to its source file, and uses all six type names', () => {
    const files = COMPLIANCE_DOCUMENTS.map((d) => d.sourceFile)
    expect(files.every((f) => /\.(docx|pdf)$/.test(f))).toBe(true)
    expect(new Set(files).size).toBe(24)

    const used = new Set(COMPLIANCE_DOCUMENTS.map((d) => d.complianceType))
    for (const name of [
      'Final Affidavit',
      'Terms and Conditions',
      'Pre-Course Notice',
      'Pre-Final Affidavit',
      'Post Final Affidavit',
      'Enrollment Agreement',
    ] as const) {
      expect(used, name).toContain(name)
    }
  })

  /* ⚠ THE FIELD EXISTS BECAUSE FLORIDA BROKE THE LAST ONE. `timing` was
     'pre-course' | 'post-final'; Florida's affidavit is signed BEFORE the
     course exam and the state has no post-exam requirement at all, so neither
     value was true of it. Six documents sit at that moment. */
  it('places every document at one of the PRD’s moments', () => {
    for (const d of COMPLIANCE_DOCUMENTS) {
      expect(MOMENT_LABEL[d.moment], d.id).toBeTruthy()
    }
    // Florida's is before the exam, not after the course.
    expect(docById('fl-post').moment).toBe('before-exam')
    expect(COMPLIANCE_DOCUMENTS.filter((d) => d.moment === 'before-exam')).toHaveLength(5)

    /* The old split cannot express the set: these four moments all existed
       inside what used to be one value. */
    const moments = new Set(COMPLIANCE_DOCUMENTS.map((d) => d.moment))
    expect(moments).toContain('checkout')
    expect(moments).toContain('before-course')
    expect(moments).toContain('before-first-lesson')
    expect(moments).toContain('at-completion')

    /* ⚠ `during-exam` IS A MOMENT WITH NO DOCUMENT — a proctor is present and
       checks identity, but nothing is signed. Kept so the list is the PRD's
       rather than a subset fitted to today's files. */
    expect(moments).not.toContain('during-exam')
    expect(MOMENT_LABEL['during-exam']).toBeTruthy()
  })

  it('leaves `version` unset everywhere — there is no source of truth for it yet', () => {
    expect(COMPLIANCE_DOCUMENTS.every((d) => d.version === undefined)).toBe(true)
  })

  /* ⚠ THE DEFECT IS CONFIRMED, not reported. Reading the file showed its
     Spanish paragraph IS the Life & Health one word for word — NAIFA and the
     Life, Health and Variable Annuity manual, on a Property & Casualty
     notice. The English here is verbatim; the Spanish is a translation of
     that English, and this is what stops it being "corrected" back. */
  it('carries corrected Spanish for the FL Property & Casualty notice', () => {
    const pc = docById('fl-notice-pc')
    // The English is the document's own, and names the right association.
    expect(pc.bodyEn).toContain('FAIA')
    expect(pc.bodyEn).toContain('General Lines')
    expect(pc.bodyEn).not.toContain('NAIFA')
    // The Spanish must match it rather than the Life & Health notice.
    expect(pc.bodyEs).toContain('FAIA')
    expect(pc.bodyEs).toContain('Líneas Generales')
    expect(pc.bodyEs).not.toContain('NAIFA')
    expect(pc.bodyEs).not.toContain('Salud y Vida')
  })

  it("keeps MN's unreadable PDF as a note, not invented content", () => {
    const mn = docById('mn-post-pdf')
    expect(mn.shape).toBe('needs-review')
    expect(mn.needsReviewNote).toBeTruthy()
    expect(mn.body).toBeUndefined()
  })
})

describe('the XCEL Generic Terms & Conditions', () => {
  /* ⚠ A BILINGUAL `signed-tc`, which the shape did not allow until the real
     document turned up printing both languages in one file. The placeholder
     it replaced described the wrong subject entirely — attendance, academic
     integrity, refunds — where the document is about PROCTORING. */
  it('is bilingual, and both arms are the real proctoring text', () => {
    const tc = docById('xcel-generic-tc')
    expect(tc.shape).toBe('signed-tc')
    expect(tc.bilingual).toBe(true)
    expect(tc.body).toBeUndefined()

    /* `signed-tc` is ['name', 'document'], so the body is behind the name
       step — the document does not render on open. */
    open(tc, 'en')
    toDocumentStep()
    expect(screen.getByText('Acknowledgement of Terms and Conditions of Pre-licensing Course Completion')).toBeInTheDocument()
    expect(screen.getByText(/proctored, closed-book exam/)).toBeInTheDocument()
    expect(screen.getByText(/70% or better within 2 days/)).toBeInTheDocument()
    expect(screen.queryByText(/academic integrity/)).toBeNull()
    cleanup()

    open(tc, 'es')
    toDocumentStep()
    expect(screen.getByText(/Reconocimiento de los Términos y Condiciones/)).toBeInTheDocument()
    expect(screen.getByText(/examen supervisado y cerrado sin ayuda/)).toBeInTheDocument()
  })
})

describe('the Illinois documents', () => {
  /* The document that forced structure into the body: a heading, a steps
     list, a nested clause under one of them, and a second heading. */
  it('renders the Terms & Conditions as headings and bullets, not one blob', () => {
    open(docById('il-tc'))
    toDocumentStep()

    expect(
      screen.getByText('Acknowledgment of Terms and Conditions of Pre-licensing Course Completion'),
    ).toBeInTheDocument()
    expect(screen.getByText('Student Notice:')).toBeInTheDocument()
    expect(screen.getByText(/20 hours of pre-licensing education/)).toBeInTheDocument()

    const bullets = screen.getAllByRole('listitem')
    expect(bullets.map((b) => b.textContent)).toEqual([
      'Complete the self-study portion of the course including passing the final exam with a score of at least 70%',
      'Attend the entire 7.5-hour webinar',
      'Affirm that you, and only you, completed the course by submitting your electronic affidavit.',
      'The course completion affidavit is available within two days of fulfilling the course completion requirements (online course, online comprehensive final exam, and webinar).',
    ])
    // The last one is the nested clause, and it is indented rather than flat.
    expect(bullets[3].style.marginLeft).toBe('16px')
    expect(bullets[0].style.marginLeft).toBe('0px')
  })

  /* ⚠ THE CONTRADICTION IS RESOLVED, in the direction the file settled.
     Flagged on 2026-10-19 from a single page; reading the .docx confirmed it
     — one declaration, no monitor section anywhere. The full SSN is real, but
     it belongs to the roster-upload block, not to a proctor. */
  it('is single-signer, as the source document is', () => {
    const il = docById('il-post')
    expect(il.body).toContain('mandatory 7.5-hour webinar course')
    expect(il.body).toContain('unassisted by any person(s)')
    expect(il.body).toContain('The date on this affidavit is the course completion date.')

    expect(il.shape).toBe('affidavit-single')
    expect(il.extraFields).toContain('ssn-full')
    expect(il.proctorBody).toBeUndefined()
    expect(STEPS_BY_SHAPE[il.shape]).toEqual(['identity', 'document'])
  })

  /* ⚠ THE SHAPE WAS INVERTED, and this is the assertion that says so. Every
     document the brief called two-party has no proctor; all four that do were
     filed as single-signer. */
  it('puts the proctor documents in the two-party shape, and only those', () => {
    const twoParty = COMPLIANCE_DOCUMENTS.filter((d) => d.shape === 'affidavit-two-party')
    expect(twoParty.map((d) => d.state).sort()).toEqual(['CO', 'CT', 'WI', 'WV'])
    for (const d of twoParty) {
      expect(d.proctorBody, d.id).toBeTruthy()
      expect(d.relationshipOptions?.length, d.id).toBeGreaterThan(0)
    }
    // The three the brief named carry no proctor at all.
    for (const id of ['ca-post', 'il-post', 'oh-post']) {
      expect(docById(id).shape, id).toBe('affidavit-single')
      expect(docById(id).proctorBody, id).toBeUndefined()
    }
  })
})

describe('what the state profiles settled', () => {
  /* ⚠ THE EXAM DATE IS NOT THE SIGNING DATE. New York's profile asks for
     "name, date the exam was taken, signature"; the source document's field
     is headed "Today's Date", which is the day the affidavit is signed. The
     same day in the happy path, a different one the moment an affidavit is
     completed late. */
  it('asks New York for the date the exam was taken', () => {
    const ny = docById('ny-post')
    expect(ny.extraFields).toContain('exam-date')

    open(ny)
    typeName()
    fireEvent.click(nextButton())
    expect(screen.getByLabelText(/exam date/i)).toBeInTheDocument()
  })

  /* The four states whose profiles require a proctor affidavit are the four
     this shape serves — and Minnesota and Mississippi, which also require
     one, are the two whose documents are missing from the set. */
  it('holds a proctor document for every two-party state it claims', () => {
    for (const d of COMPLIANCE_DOCUMENTS.filter((x) => x.shape === 'affidavit-two-party')) {
      expect(d.proctorBody, d.id).toBeTruthy()
      expect(d.proctorFields?.length, d.id).toBeGreaterThan(0)
    }
    /* ⚠ MISSISSIPPI'S FILE IS NOT ITS REQUIREMENT. The state wants a proctor
       affidavit; the only MS document is a student pre-exam acknowledgment,
       so it is single-signer here and the real form is still missing. */
    const ms = docById('ms-post')
    expect(ms.shape).toBe('affidavit-single')
    expect(ms.proctorBody).toBeUndefined()
  })
})

describe('the step sequence comes from the shape', () => {
  it('names a step list for every shape the data uses', () => {
    for (const d of COMPLIANCE_DOCUMENTS) {
      expect(STEPS_BY_SHAPE[d.shape]?.length, d.id).toBeGreaterThan(0)
    }
  })

  it('renders "Step 1 of N" for N = the shape\'s step count, once there are two', () => {
    for (const shape of Object.keys(STEPS_BY_SHAPE) as DocumentShape[]) {
      const doc = COMPLIANCE_DOCUMENTS.find((d) => d.shape === shape)
      if (!doc) continue
      const steps = STEPS_BY_SHAPE[shape]
      open(doc)
      if (steps.length > 1) {
        expect(screen.getByText(`Step 1 of ${steps.length}`), shape).toBeInTheDocument()
      } else {
        expect(screen.queryByText(/^Step \d+ of \d+$/), shape).toBeNull()
      }
      cleanup()
    }
  })
})

describe('Next stays off until the step is answered', () => {
  /* ⚠ THE MIDDLE NAME IS ASKED FOR BUT NOT DEMANDED. Required, it locks out
     everyone who has none — and the escape they reach for, typing "N/A",
     writes a false value onto a signed compliance record. */
  it('needs first and last, not the middle name, plus the confirmation', () => {
    open(docById('ca-tc')) // signed-tc → [name, document]
    expect(nextButton()).toBeDisabled()

    typeInto(/^first name$/i, 'Jordan')
    typeInto(/^last name$/i, 'Navarro')
    // Middle name deliberately left empty — this must not block.
    expect(nextButton(), 'confirmation still unticked').toBeDisabled()

    fireEvent.click(screen.getByLabelText(/legal name/i))
    expect(nextButton(), 'no middle name should still advance').toBeEnabled()
  })

  it('labels the middle name as optional, and still offers it', () => {
    open(docById('ca-tc'))
    expect(screen.getByLabelText(/^middle name \(optional\)$/i)).toBeInTheDocument()
  })

  it('needs first and last on an `identity` step, and nothing else', () => {
    /* Pennsylvania's affidavit asks for no identity fields — New York's and
       Ohio's do, and those are gated separately below. */
    open(docById('pa-post')) // affidavit-single → [identity, document]
    expect(nextButton()).toBeDisabled()
    typeInto(/^first name$/i, 'Jordan')
    expect(nextButton()).toBeDisabled()
    typeInto(/^last name$/i, 'Navarro')
    expect(nextButton()).toBeEnabled()
  })

  it('needs the attest tick on the affidavit itself, and then completes', () => {
    const { onComplete } = open(docById('ny-post'))
    typeName()
    // New York asks for the exam date before it will let you past identity.
    expect(nextButton(), 'exam date still empty').toBeDisabled()
    typeInto(/exam date/i, '11/02/2026')
    fireEvent.click(nextButton())

    expect(screen.getByText(/administrative sanction by the New York/i)).toBeInTheDocument()
    // Last step, so the primary is Confirm.
    expect(confirmButton()).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/i attest/i))
    /* An affidavit is a sworn statement signed with a typed name — the tick
       alone is an attestation, which is a different thing. */
    expect(confirmButton(), 'ticked but unsigned').toBeDisabled()
    sign()
    expect(confirmButton()).toBeEnabled()
    fireEvent.click(confirmButton())
    expect(onComplete).toHaveBeenCalledOnce()
  })

  /* ⚠ THERE IS NO LICENCE STEP, and this is what stops one coming back. The
     brief had enrollment agreements asking for a licence or NAPB number; no
     regulation in the PRD does. Nothing asks a learner for a licence number
     before the course — that is what the course leads to. */
  it('never asks for a licence number', () => {
    expect(STEPS_BY_SHAPE['enrollment-agreement']).toEqual(['name', 'document'])
    for (const steps of Object.values(STEPS_BY_SHAPE)) {
      expect(steps).not.toContain('license')
    }
    open(docById('ky-ea'))
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(screen.queryByLabelText(/licen[cs]e/i)).toBeNull()
  })

  it("needs a tick AND a signature on Ohio's Registration Form", () => {
    open(docById('oh-reg')) // §4.2 row 3: attestation WITH signature
    toDocumentStep()

    expect(confirmButton()).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/i have read and agree/i))
    expect(confirmButton(), 'ticked but unsigned').toBeDisabled()
    sign()
    expect(confirmButton()).toBeEnabled()
  })

  /* ⚠ A NOTICE THAT ONLY HAS TO BE SHOWN ASKS FOR NOTHING. Minnesota's is the
     only one: its source carries no signature line and no checkbox, and the
     PRD lists it as shown with no response required. Inventing a tick for it
     is friction that meets no rule. */
  it('asks nothing of a show-only document', () => {
    open(docById('mn-tc'))
    toDocumentStep()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.queryByLabelText(/^digitally sign$/i)).toBeNull()
    expect(confirmButton()).toBeEnabled()
  })

  it('asks the two-party student step for every extra field the state wants', () => {
    open(docById('co-post')) // student side wants the exam date
    typeName()
    fireEvent.click(screen.getByLabelText(/student declaration/i))
    sign()
    // Names, signature and attestation are in; Colorado's exam date is not.
    expect(nextButton()).toBeDisabled()
    typeInto(/exam date/i, '11/02/2026')
    expect(nextButton()).toBeEnabled()
  })

  /* ⚠ THE PROCTOR'S FIELDS ARE NOT THE STUDENT'S. Wisconsin asks the student
     for nothing extra and the monitor for a name, an address and a phone —
     one shared list could not say that. */
  it("gates the proctor step on the proctor's own identity fields", () => {
    open(docById('wi-post')) // proctor first — see the Wisconsin block below
    fireEvent.click(screen.getByRole('button', { name: 'Neighbor' }))
    fireEvent.click(screen.getByLabelText(/proctor declaration/i))
    expect(nextButton()).toBeDisabled()
    typeName('Sam', 'Lee', 'Okafor') // the proctor's own legal name
    typeInto(/address/i, '1 Main St, Madison, WI')
    // Proctor is the FIRST step here, so its primary is Next.
    expect(nextButton()).toBeDisabled()
    typeInto(/phone number/i, '5551234567')
    expect(nextButton(), 'proctor has not signed').toBeDisabled()
    sign('Sam Lee Okafor')
    expect(nextButton()).toBeEnabled()
  })

  it("needs a relationship from the state's own option set on the proctor step", () => {
    const { onComplete } = open(docById('wv-post'))
    typeName()
    fireEvent.click(screen.getByLabelText(/student declaration/i))
    sign()
    fireEvent.click(nextButton())

    /* West Virginia offers Licensed Agent; Wisconsin offers Neighbor in the
       same slot. Read from the config, never shared. */
    expect(screen.getByRole('button', { name: 'Licensed Agent' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Neighbor' })).toBeNull()

    typeName('Sam', 'Lee', 'Okafor')
    fireEvent.click(screen.getByLabelText(/proctor declaration/i))
    sign('Sam Lee Okafor')
    expect(confirmButton()).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Licensed Agent' }))
    expect(confirmButton()).toBeEnabled()
    fireEvent.click(confirmButton())
    expect(onComplete).toHaveBeenCalledOnce()
  })
})

describe('the two shapes with no signer', () => {
  it('heads the modal with the document kind, with the subject under it', () => {
    open(docById('oh-post'))
    expect(screen.getByRole('heading', { name: 'Final Affidavit' })).toBeInTheDocument()
    /* `Modal` also renders the title into a visually-hidden span to keep
       `aria-labelledby` valid under `hideChrome`, so the document name matches
       twice. The drawn one is the paragraph. */
    /* The line under it is the document MINUS its kind, so the header never
       says "Final Affidavit" twice. */
    expect(screen.getByText('Ohio')).toBeInTheDocument()
    /* ⚠ THE FULL NAME IS NOT LOST, it just stops being drawn: `Modal` keeps
       it as the dialog's accessible name, which is what a screen-reader user
       hears on open. Shortening the visible line must not shorten that. */
    expect(
      screen.getByRole('dialog', { name: 'Ohio — Pre & Post Final Affidavit' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(/Pre & Post Final Affidavit/).every((el) => el.tagName === 'SPAN'),
    ).toBe(true)
  })

  it('asks a notice for nothing but the tick', () => {
    const { onComplete } = open(docById('fl-notice-lh'))
    expect(screen.queryByLabelText(/first name/i)).toBeNull()
    expect(screen.queryByLabelText(/signature/i)).toBeNull()

    expect(confirmButton()).toBeDisabled()
    fireEvent.click(screen.getByLabelText('I Agree'))
    fireEvent.click(confirmButton())
    expect(onComplete).toHaveBeenCalledOnce()
  })

  /* ⚠ THE LANGUAGE IS THE CALLER'S, NOT THE LEARNER'S. A control inside the
     signing flow would let someone sign a document in a language the course
     never attached, so the modal renders what it is given and offers no way
     to change it. */
  it('renders the language it is given, and offers no way to change it', () => {
    open(docById('fl-notice-lh'), 'en')
    expect(screen.getByText(/Department of Financial Services/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Español' })).toBeNull()
    expect(screen.queryByRole('group', { name: /language/i })).toBeNull()
    cleanup()

    open(docById('fl-notice-lh'), 'es')
    expect(screen.getByText(/Departamento de Servicios Financieros/)).toBeInTheDocument()
    cleanup()

    // Unspecified falls back to English rather than rendering nothing.
    open(docById('fl-notice-lh'))
    expect(screen.getByText(/Department of Financial Services/)).toBeInTheDocument()
  })

  /* ⚠ WHAT THE FLORIDA NOTICE IS ACTUALLY ABOUT. It shipped with placeholder
     text saying it satisfied the pre-licensing education requirement; the
     real document is about the NAIFA study manual — that the exam is based on
     it, that the course does not include it, and where to buy it. A wrong
     subject reads as finished, which is what makes it worth pinning. */
  it('carries the real Florida Life & Health notice, not the placeholder', () => {
    const fl = docById('fl-notice-lh')
    expect(fl.bodyEn).toContain('NAIFA')
    expect(fl.bodyEn).toContain('Study Manual is not included with this course')
    expect(fl.bodyEn).not.toContain('satisfies the pre-licensing education requirement')
    // Authored as paragraphs, and drawn as paragraphs.
    expect(fl.bodyEn?.split('\n\n')).toHaveLength(2)
    open(fl, 'en')
    expect(screen.getByText(/By clicking the .I Agree. button below/)).toBeInTheDocument()
  })

  /* The document names its own button, in each language. On the Spanish arm a
     checkbox reading "I Agree" is a document pointing at a control that is
     not on screen. */
  it('labels the tick the way the document names it', () => {
    open(docById('fl-notice-lh'), 'en')
    expect(screen.getByLabelText('I Agree')).toBeInTheDocument()
    cleanup()
    open(docById('fl-notice-lh'), 'es')
    expect(screen.getByLabelText('Acepto')).toBeInTheDocument()
    expect(screen.queryByLabelText('I Agree')).toBeNull()
  })

  /* The corrected Spanish is only visible through the modal on the `es` arm,
     and it is the half most likely to be silently reverted. */
  it('draws the corrected Spanish for the FL Property & Casualty notice', () => {
    open(docById('fl-notice-pc'), 'es')
    expect(screen.getByText(/FAIA/)).toBeInTheDocument()
    expect(screen.queryByText(/NAIFA/)).toBeNull()
  })

  it('never lets a `needs-review` document be completed', () => {
    const { onComplete } = open(docById('mn-post-pdf'))
    expect(screen.getByText(/content pending manual review/i)).toBeInTheDocument()
    expect(screen.getByText(/Adobe Fill & Sign/i)).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
    fireEvent.click(confirmButton())
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe('the progress strip', () => {
  it('is absent on a one-step document, which ends in Cancel and Confirm', () => {
    const { onClose } = open(docById('fl-notice-lh')) // notice → ['document']
    expect(screen.queryByText(/^Step \d+ of \d+$/)).toBeNull()
    /* One step is first AND last, so it is Cancel on the left and Confirm on
       the right — never Back, and never Next. */
    expect(cancelButton()).toBeInTheDocument()
    expect(confirmButton()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^back$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^next$/i })).toBeNull()

    fireEvent.click(cancelButton())
    expect(onClose).toHaveBeenCalledOnce()
  })

  /* ⚠ THE PAIR IS NAMED FOR WHERE YOU ARE. With the licence step gone no
     shape has a middle, so Cancel/Next and Back/Confirm are the only two
     pairs the set can produce — the assertion below says that explicitly, so
     a third step arriving later is a deliberate change rather than a silent
     one. */
  it('names the buttons for the step: Cancel/Next then Back/Confirm', () => {
    expect(Math.max(...Object.values(STEPS_BY_SHAPE).map((s) => s.length))).toBe(2)

    open(docById('ky-ea')) // enrollment-agreement → name → document

    // First of two: leaving is Cancel, because there is no step behind it.
    expect(cancelButton()).toBeInTheDocument()
    expect(nextButton()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^back$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^confirm$/i })).toBeNull()

    typeName()
    fireEvent.click(screen.getByLabelText(/legal name/i))
    fireEvent.click(nextButton())

    // Last: Back and Confirm. Confirm is the only button that signs anything.
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
    expect(backButton()).toBeInTheDocument()
    expect(confirmButton()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^next$/i })).toBeNull()
  })

  it('steps back rather than closing when Back is pressed', () => {
    const { onClose } = open(docById('ca-tc'))
    toDocumentStep()
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument()
    fireEvent.click(backButton())
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('is absent on the needs-review placeholder too', () => {
    open(docById('mn-post-pdf'))
    expect(screen.queryByText(/^Step \d+ of \d+$/)).toBeNull()
  })

  it('is present as soon as there are two', () => {
    open(docById('ca-tc')) // signed-tc → ['name', 'document']
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument()
  })
})

describe('the signature', () => {
  /* ⚠ PREFILL EVERYTHING BUT THE SIGNATURE. The PRD's model (T-22) is
     pre-fill what we know, have the learner confirm it, then type their name
     — so the name boxes arrive filled from the step before and the signature
     arrives empty. A pre-filled signature is not a signature. */
  it('prefills the name from the earlier step, and never the signature', () => {
    open(docById('ca-tc'))
    typeName('Jordan', 'Riley', 'Navarro')
    fireEvent.click(screen.getByLabelText(/legal name/i))
    fireEvent.click(nextButton())

    expect(screen.getByLabelText(/^first name$/i)).toHaveValue('Jordan')
    expect(screen.getByLabelText(/^middle name/i)).toHaveValue('Riley')
    expect(screen.getByLabelText(/^last name$/i)).toHaveValue('Navarro')
    expect(screen.getByLabelText(/^digitally sign$/i)).toHaveValue('')
  })

  it('will not complete until it is signed, however much else is filled', () => {
    const { onComplete } = open(docById('ca-tc'))
    toDocumentStep()
    fireEvent.click(screen.getByLabelText(/i agree/i))
    expect(confirmButton(), 'everything but the signature').toBeDisabled()
    fireEvent.click(confirmButton())
    expect(onComplete).not.toHaveBeenCalled()

    sign()
    expect(confirmButton()).toBeEnabled()
  })

  it('is drawn in the signing hand, not the body font', () => {
    open(docById('ca-tc'))
    toDocumentStep()
    expect(screen.getByLabelText(/^digitally sign$/i).style.fontFamily).toBe(
      'var(--font-signature)',
    )
  })

  /* An edit on the document overrides the prefill rather than being locked to
     it — the source documents ask for the name again, which only means
     anything if it can differ. */
  it('lets the prefilled name be corrected on the document', () => {
    open(docById('ca-tc'))
    toDocumentStep()
    typeInto(/^first name$/i, 'Sam')
    expect(screen.getByLabelText(/^first name$/i)).toHaveValue('Sam')
    expect(screen.getByLabelText(/^last name$/i)).toHaveValue('Navarro')
  })
})

describe('Wisconsin signs in the order it is filled', () => {
  /* ⚠ THE PAPER ORDER IS NOT THE FILLING ORDER. All four two-party forms
     print the student's block above the monitor's, which is why the shape
     defaults to student-then-proctor. Wisconsin's profile has the proctor
     verify identity and complete the affidavit BEFORE the exam. Following
     the paper would ask a learner to attest before the person meant to have
     verified them has. */
  it('opens on the proctor, and only for Wisconsin', () => {
    expect(stepsFor(docById('wi-post'))).toEqual(['proctor', 'student'])
    for (const id of ['co-post', 'ct-post', 'wv-post']) {
      expect(stepsFor(docById(id)), id).toEqual(['student', 'proctor'])
    }
    // The shape's own default is untouched.
    expect(STEPS_BY_SHAPE['affidavit-two-party']).toEqual(['student', 'proctor'])

    open(docById('wi-post'))
    /* The sub-section label, not the checkbox beneath it — both say
       "proctor declaration". */
    expect(screen.getByText('Proctor Declaration')).toBeInTheDocument()
    expect(screen.queryByText('Student Declaration')).toBeNull()
  })

  /* ⚠ THE IDENTITY CHECK HAS TO HOLD IN BOTH ORDERS. Proctor-first means the
     monitor is entered before the learner, so a check reading only the
     proctor's side would compare against an empty name and pass every time —
     and the learner could then type the proctor's name with nothing to catch
     it. */
  it('still blocks a learner who types the proctor’s name, in that order', () => {
    open(docById('wi-post'))

    // Proctor first.
    typeName('Sam', 'Lee', 'Okafor')
    typeInto(/address/i, '1 Main St, Madison, WI')
    typeInto(/phone number/i, '5551234567')
    fireEvent.click(screen.getByRole('button', { name: 'Neighbor' }))
    fireEvent.click(screen.getByLabelText(/proctor declaration/i))
    sign('Sam Lee Okafor')
    expect(nextButton()).toBeEnabled()
    fireEvent.click(nextButton())

    // Now the learner claims to be the same person.
    typeName('Sam', 'Lee', 'Okafor')
    fireEvent.click(screen.getByLabelText(/student declaration/i))
    sign('Sam Lee Okafor')
    expect(confirmButton()).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/cannot be their own proctor/i)

    // A different learner completes it.
    typeName('Jordan', 'Riley', 'Navarro')
    sign('Jordan Riley Navarro')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(confirmButton()).toBeEnabled()
  })
})

describe('the proctor cannot be the examinee', () => {
  /* ⚠ "The proctor's name can't match the learner's" (PRD §4.2 row 7). A
     monitor who IS the examinee is the one thing the proctor requirement
     exists to prevent, and it is what an honest mistake produces: the learner
     reaches a step full of name boxes and fills in their own. */
  function toProctorStep() {
    open(docById('wv-post'))
    typeName()
    fireEvent.click(screen.getByLabelText(/student declaration/i))
    sign()
    fireEvent.click(nextButton())
  }

  it('blocks a proctor whose name is the learner’s, and says why', () => {
    toProctorStep()
    typeName('Jordan', 'Riley', 'Navarro') // the learner's own name
    fireEvent.click(screen.getByRole('button', { name: 'Librarian' }))
    fireEvent.click(screen.getByLabelText(/proctor declaration/i))
    sign('Jordan Riley Navarro')

    expect(confirmButton()).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent(/proctor cannot be the examinee/i)
  })

  it('ignores case and spacing when comparing', () => {
    toProctorStep()
    typeName('jordan', 'riley', 'navarro')
    fireEvent.click(screen.getByRole('button', { name: 'Librarian' }))
    fireEvent.click(screen.getByLabelText(/proctor declaration/i))
    sign('  JORDAN   Riley navarro ')
    expect(confirmButton(), 'same person, different typing').toBeDisabled()
  })

  it('allows a different person', () => {
    toProctorStep()
    typeName('Sam', 'Lee', 'Okafor')
    fireEvent.click(screen.getByRole('button', { name: 'Librarian' }))
    fireEvent.click(screen.getByLabelText(/proctor declaration/i))
    sign('Sam Lee Okafor')
    expect(screen.queryByRole('alert')).toBeNull()
    expect(confirmButton()).toBeEnabled()
  })
})

describe('getting out of it', () => {
  /* With `hideChrome` there is no ✕, so the backdrop and Esc are the only two
     ways out — and the backdrop is the one people reach for first. */
  it('closes when the backdrop is clicked', () => {
    const { onClose } = open(docById('fl-notice-lh'))
    const backdrop = document.querySelector('.cre-modal-backdrop')
    expect(backdrop).not.toBeNull()
    fireEvent.click(backdrop!)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('does not close when the click lands inside the dialog', () => {
    const { onClose } = open(docById('fl-notice-lh'))
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('the preview flag', () => {
  /* The harness is the only place the modal renders, so a missing flag means a
     page that cannot be switched off and is invisible in the panel. */
  it('is in the catalog and defaults on for this branch', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'compliance-document-modal-preview')
    expect(flag).toBeDefined()
    expect(flag?.defaultEnabled).toBe(true)
  })
})
