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

function open(config: ComplianceDocumentConfig) {
  const onComplete = vi.fn()
  const onClose = vi.fn()
  render(
    <ComplianceDocumentModal
      open
      config={config}
      onClose={onClose}
      onComplete={onComplete}
    />,
  )
  return { onComplete, onClose }
}

const nextButton = () => screen.getByRole('button', { name: /next|finish/i })
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
      if (d.shape === 'notice') {
        expect(d.bodyEn, d.id).toBeTruthy()
        if (d.bilingual) expect(d.bodyEs, d.id).toBeTruthy()
      }
      if (d.shape === 'signed-tc' || d.shape === 'affidavit-single') {
        expect(d.body, d.id).toBeTruthy()
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

describe('the step sequence comes from the shape', () => {
  it('names a step list for every shape the data uses', () => {
    for (const d of COMPLIANCE_DOCUMENTS) {
      expect(STEPS_BY_SHAPE[d.shape]?.length, d.id).toBeGreaterThan(0)
    }
  })

  it('renders "Step 1 of N" for N = the shape\'s step count', () => {
    for (const shape of Object.keys(STEPS_BY_SHAPE) as DocumentShape[]) {
      const doc = COMPLIANCE_DOCUMENTS.find((d) => d.shape === shape)
      if (!doc) continue
      open(doc)
      expect(
        screen.getByText(`Step 1 of ${STEPS_BY_SHAPE[shape].length}`),
        shape,
      ).toBeInTheDocument()
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
  it('heads the modal with the document kind, with the specific document under it', () => {
    open(docById('oh-post'))
    expect(screen.getByRole('heading', { name: 'Post Final Affidavit' })).toBeInTheDocument()
    /* `Modal` also renders the title into a visually-hidden span to keep
       `aria-labelledby` valid under `hideChrome`, so the document name matches
       twice. The drawn one is the paragraph. */
    const named = screen.getAllByText('Ohio — Pre & Post Final Affidavit')
    expect(named.some((el) => el.tagName === 'P')).toBe(true)
  })

  it('asks a notice for nothing but "I Agree", and toggles its languages', () => {
    const { onComplete } = open(docById('fl-notice-lh'))
    expect(screen.queryByLabelText(/first name/i)).toBeNull()
    expect(screen.queryByLabelText(/signature/i)).toBeNull()

    expect(screen.getByText(/Department of Financial Services/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Español' }))
    expect(screen.getByText(/Departamento de Servicios Financieros/)).toBeInTheDocument()

    expect(nextButton()).toBeDisabled()
    fireEvent.click(screen.getByLabelText('I Agree'))
    fireEvent.click(nextButton())
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('never lets a `needs-review` document be completed', () => {
    const { onComplete } = open(docById('mn-post-pdf'))
    expect(screen.getByText(/content pending manual review/i)).toBeInTheDocument()
    expect(screen.getByText(/custom\/embedded font encoding/i)).toBeInTheDocument()
    expect(nextButton()).toBeDisabled()
    fireEvent.click(nextButton())
    expect(onComplete).not.toHaveBeenCalled()
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
