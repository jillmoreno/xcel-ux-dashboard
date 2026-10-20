import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { ComplianceDocumentModal } from '@/components/courses/ComplianceDocumentModal'
import {
  COMPLIANCE_DOCUMENTS,
  STEPS_BY_SHAPE,
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

const nextButton = () => screen.getByRole('button', { name: /next|finish/i })
/* A one-step document has no arrows — it gets named CTAs instead. */
const confirmButton = () => screen.getByRole('button', { name: /^confirm$/i })

/** Clear the `name` step a two-step document opens on. */
function toDocumentStep() {
  typeInto(/first name/i, 'Jordan')
  typeInto(/last name/i, 'Navarro')
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
    expect(count('affidavit-single')).toBe(10)
    expect(count('affidavit-two-party')).toBe(3)
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
      // A heading is per-language or not at all — one half would print the
      // wrong language above the right body.
      expect(Boolean(d.headingEn), d.id).toBe(Boolean(d.headingEs))
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

  it('leaves `version` unset everywhere — there is no source of truth for it yet', () => {
    expect(COMPLIANCE_DOCUMENTS.every((d) => d.version === undefined)).toBe(true)
  })

  /* The source document's Spanish paragraph is the Life & Health one, naming
     NAIFA and the wrong license line. The corrected text is what ships here,
     and this is what stops it being "corrected" back to the source. */
  it('carries the corrected Spanish for the FL Property & Casualty notice', () => {
    const pc = docById('fl-notice-pc')
    expect(pc.bodyEs).toContain('FAIA')
    expect(pc.bodyEs).toContain('Propiedad y Accidentes')
    expect(pc.bodyEs).not.toContain('NAIFA')
    expect(pc.bodyEs).not.toContain('Vida y Salud')
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
    expect(screen.getByText(/Acknowledgement of Terms and Conditions/)).toBeInTheDocument()
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
  it('needs both names AND the legal-name confirmation on a `name` step', () => {
    open(docById('ca-tc')) // signed-tc → [name, document]
    expect(nextButton()).toBeDisabled()
    typeInto(/first name/i, 'Jordan')
    typeInto(/last name/i, 'Navarro')
    // Both names in, confirmation still unticked — this is the case a looser
    // gate would let through.
    expect(nextButton()).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/legal name/i))
    expect(nextButton()).toBeEnabled()
  })

  it('needs only the two names on an `identity` step', () => {
    open(docById('ny-post')) // affidavit-single → [identity, document]
    expect(nextButton()).toBeDisabled()
    typeInto(/first name/i, 'Jordan')
    expect(nextButton()).toBeDisabled()
    typeInto(/last name/i, 'Navarro')
    expect(nextButton()).toBeEnabled()
  })

  it('needs the attest tick on the affidavit itself, and then completes', () => {
    const { onComplete } = open(docById('ny-post'))
    typeInto(/first name/i, 'Jordan')
    typeInto(/last name/i, 'Navarro')
    fireEvent.click(nextButton())

    expect(screen.getByText(/penalty of perjury/i)).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
    fireEvent.click(screen.getByLabelText(/i attest/i))
    expect(nextButton()).toBeEnabled()
    fireEvent.click(nextButton())
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('needs a licence number on the `license` step of an enrollment agreement', () => {
    open(docById('ky-ea')) // enrollment-agreement → [name, license, document]
    typeInto(/first name/i, 'Jordan')
    typeInto(/last name/i, 'Navarro')
    fireEvent.click(screen.getByLabelText(/legal name/i))
    fireEvent.click(nextButton())

    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
    typeInto(/license/i, 'W123456')
    expect(nextButton()).toBeEnabled()
  })

  it("takes a typed signature instead of a tick on Ohio's Registration Form", () => {
    open(docById('oh-reg'))
    typeInto(/first name/i, 'Jordan')
    typeInto(/last name/i, 'Navarro')
    fireEvent.click(screen.getByLabelText(/legal name/i))
    fireEvent.click(nextButton())
    typeInto(/license/i, 'W123456')
    fireEvent.click(nextButton())

    // The wet-signature variant has no agree checkbox to tick at all.
    expect(screen.queryByLabelText(/i have read and agree/i)).toBeNull()
    expect(nextButton()).toBeDisabled()
    typeInto(/student signature/i, 'Jordan Navarro')
    expect(nextButton()).toBeEnabled()
  })

  it('asks the two-party student step for every extra field the state wants', () => {
    const oh = docById('oh-post') // ssn-last4, phone, exam-date
    open(oh)
    typeInto(/first name/i, 'Jordan')
    typeInto(/last name/i, 'Navarro')
    fireEvent.click(screen.getByLabelText(/student declaration/i))
    // Names and the attestation are in; the three Ohio fields are not.
    expect(nextButton()).toBeDisabled()
    typeInto(/last 4 of ssn/i, '1234')
    typeInto(/phone number/i, '5551234567')
    expect(nextButton()).toBeDisabled()
    typeInto(/exam date/i, '11/02/2026')
    expect(nextButton()).toBeEnabled()
  })

  it("needs a relationship from the state's own option set on the proctor step", () => {
    const { onComplete } = open(docById('oh-post'))
    typeInto(/first name/i, 'Jordan')
    typeInto(/last name/i, 'Navarro')
    typeInto(/last 4 of ssn/i, '1234')
    typeInto(/phone number/i, '5551234567')
    typeInto(/exam date/i, '11/02/2026')
    fireEvent.click(screen.getByLabelText(/student declaration/i))
    fireEvent.click(nextButton())

    // Ohio's six, not a hardcoded four — Employer and Other are Ohio's alone.
    expect(screen.getByRole('button', { name: 'Employer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Other' })).toBeInTheDocument()

    fireEvent.click(screen.getByLabelText(/proctor declaration/i))
    expect(nextButton()).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Proctor' }))
    expect(nextButton()).toBeEnabled()
    fireEvent.click(nextButton())
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
    expect(screen.getByText(/custom\/embedded font encoding/i)).toBeInTheDocument()
    expect(confirmButton()).toBeDisabled()
    fireEvent.click(confirmButton())
    expect(onComplete).not.toHaveBeenCalled()
  })
})

describe('the progress strip', () => {
  it('is absent on a one-step document, and so are the arrows', () => {
    const { onClose } = open(docById('fl-notice-lh')) // notice → ['document']
    expect(screen.queryByText(/^Step \d+ of \d+$/)).toBeNull()
    /* Arrows promise a sequence. On one step there is nowhere back to go and
       nothing after, so they are replaced by what the two actions actually
       do. */
    expect(screen.queryByRole('button', { name: /^back$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /next|finish/i })).toBeNull()
    expect(confirmButton()).toBeInTheDocument()

    const cancel = screen.getByRole('button', { name: /^cancel$/i })
    fireEvent.click(cancel)
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps the arrows wherever there IS a sequence', () => {
    open(docById('ky-ea')) // enrollment-agreement → three steps
    expect(screen.getByRole('button', { name: /^back$/i })).toBeInTheDocument()
    expect(nextButton()).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^confirm$/i })).toBeNull()
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
  /* ⚠ IT IS THE NAME, SIGNED — not a second field. Two editable boxes let a
     learner type one name and sign another, which is a contradiction a
     compliance record should not be able to hold. */
  it('appears only once there is a name, and mirrors it', () => {
    open(docById('ca-tc')) // signed-tc → ['name', 'document']
    toDocumentStep()

    // Nothing to sign yet.
    expect(screen.queryByText(/^Signature$/)).toBeNull()

    typeInto(/student name/i, 'Jordan Navarro')
    expect(screen.getByText(/^Signature$/)).toBeInTheDocument()
    expect(screen.getByLabelText('Signature: Jordan Navarro')).toBeInTheDocument()

    // It follows the name rather than holding its own value.
    typeInto(/student name/i, 'Sam Okafor')
    expect(screen.getByLabelText('Signature: Sam Okafor')).toBeInTheDocument()
    expect(screen.queryByLabelText('Signature: Jordan Navarro')).toBeNull()
  })

  it('is not a second thing to type', () => {
    open(docById('ca-tc'))
    toDocumentStep()
    typeInto(/student name/i, 'Jordan Navarro')
    // One text input on this step — the name. The signature is drawn, not entered.
    const inputs = screen.getAllByRole('textbox')
    expect(inputs).toHaveLength(1)
  })

  /* Ohio's Registration Form is the exception and stays one: it needs a
     signature standing in for a PHYSICAL one, on a step that never collected
     a name of its own. */
  it("leaves Ohio's wet-signature field as a real input", () => {
    open(docById('oh-reg'))
    toDocumentStep()
    typeInto(/license/i, 'W123456')
    fireEvent.click(nextButton())
    expect(screen.getByLabelText(/student signature/i)).toBeInTheDocument()
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
