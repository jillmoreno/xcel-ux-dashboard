import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileLinesRegular,
  IdCard,
  PenFieldRegular,
  TriangleExclamation,
  User,
  Users,
} from '@/icons'
import {
  STEPS_BY_SHAPE,
  type ComplianceDocumentConfig,
  type ExtraField,
} from '@/data/complianceDocuments'

/**
 * THE COMPLIANCE DOCUMENT MODAL — one shell, six document shapes.
 *
 * The visual style is the one approved on `PreCourseRequirementsWizard`: a dark
 * navy header with a light-blue step title, a white rounded card under it, a
 * soft-tinted circular icon avatar, a segmented progress bar and circular
 * grey → action Back/Next buttons.
 *
 * ⚠ WHAT CHANGED IS THE FLOW, NOT THE LOOK. That wizard was a fixed three-step
 * sequence (Confirm Name → Confirm License → Affidavit). The 24 real documents
 * in the `_XCEL-PE Affidavits and EAs` set do not fit it — six shapes, different
 * step counts, different fields, and in two cases a second signer. So the steps
 * come from `STEPS_BY_SHAPE[config.shape]` and every step reconfigures from the
 * config. Six documents, one component; a seventh document of a known shape is
 * a row in `complianceDocuments.ts` and no code at all.
 *
 * ⚠ IT RESETS BY REMOUNTING, NOT BY EFFECT. Every answer the learner gives
 * lives in this component's local state, so the caller owns when that state is
 * thrown away: mount it when the document opens and unmount it when it closes
 * (`{open && <ComplianceDocumentModal … />}`), keyed by `config.id` if one
 * mount ever serves two documents. Holding it mounted with `open={false}`
 * keeps the previous answers in the fields — which is why the preview harness
 * does neither.
 *
 * ⚠ NOT WIRED INTO ANYTHING. The only place this renders is
 * `ComplianceDocumentPreviewPage` (`/compliance-documents`), behind
 * `compliance-document-modal-preview`. It is deliberately not reachable from
 * Compass, Membership or the end-to-end demo's own `AffidavitModal` — those
 * are separate decisions, not this branch's.
 */

type Props = {
  open: boolean
  onClose: () => void
  onComplete: () => void
  config: ComplianceDocumentConfig
  /**
   * Which language a bilingual document is presented in. Only `notice` reads
   * it, and only when `bilingual`.
   *
   * ⚠ THE CALLER DECIDES, NOT THE LEARNER, and the modal has no toggle for
   * it. In the real system the course's own language picks the document — the
   * English notice goes with an English course — so a control inside the
   * signing flow would let a learner sign a document in a language the course
   * never attached. That attachment logic is not built yet (see
   * `ComplianceDocumentConfig.language`); until it is, the caller passes this,
   * and the preview harness is what stands in for the course.
   */
  language?: 'en' | 'es'
  /** Where "Look up my license number" points. Omitted → the hint is not drawn. */
  licenseLookupUrl?: string
}

/* ── per-step chrome ──────────────────────────────────────────────────────
   The eyebrow over the title and the glyph in the avatar. The `document`
   step's title depends on the SHAPE (an affidavit and a notice are not the
   same word), so it is resolved separately below. */
const STEP_CHROME: Record<string, { title: string; icon: ReactNode }> = {
  name: { title: 'Confirm Your Name', icon: <User size={24} aria-hidden /> },
  license: { title: 'Confirm Your License', icon: <IdCard size={24} aria-hidden /> },
  identity: { title: 'Confirm Your Identity', icon: <IdCard size={24} aria-hidden /> },
  document: { title: 'Review & Agree', icon: <FileLinesRegular size={24} aria-hidden /> },
  student: { title: 'Student Declaration', icon: <User size={24} aria-hidden /> },
  proctor: { title: 'Proctor Declaration', icon: <Users size={24} aria-hidden /> },
}

/** The `document` step's eyebrow, which is the document's own kind. */
const DOCUMENT_STEP_TITLE: Record<string, string> = {
  'notice': 'Review the Notice',
  'signed-tc': 'Terms & Conditions',
  'enrollment-agreement': 'Enrollment Agreement',
  'affidavit-single': 'Review the Affidavit',
  'needs-review': 'Content Pending Review',
}

const EXTRA_FIELD_LABEL: Record<ExtraField, string> = {
  'dob': 'Date of Birth',
  'ssn-last4': 'Last 4 of SSN',
  'ssn-full': 'Social Security Number',
  'phone': 'Phone Number',
  'exam-date': 'Exam Date',
}

const EXTRA_FIELD_PLACEHOLDER: Record<ExtraField, string> = {
  'dob': 'MM / DD / YYYY',
  'ssn-last4': '0000',
  'ssn-full': '000-00-0000',
  'phone': '(000) 000-0000',
  'exam-date': 'MM / DD / YYYY',
}

export function ComplianceDocumentModal({
  open,
  onClose,
  onComplete,
  config,
  language = 'en',
  licenseLookupUrl,
}: Props) {
  const steps = STEPS_BY_SHAPE[config.shape]
  const [stepIndex, setStepIndex] = useState(0)

  /* One declarant's answers. `first`/`last` are shared by `name`, `identity`
     and `student` — they are the same person being asked the same thing, and a
     shape never carries two of those steps. */
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [legalNameConfirmed, setLegalNameConfirmed] = useState(false)
  const [license, setLicense] = useState('')
  const [studentName, setStudentName] = useState('')
  const [signature, setSignature] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [wetSignatureName, setWetSignatureName] = useState('')
  const [extras, setExtras] = useState<Record<string, string>>({})
  const [relationship, setRelationship] = useState('')
  const [proctorAttested, setProctorAttested] = useState(false)

  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const isLast = stepIndex === steps.length - 1
  const needsReview = config.shape === 'needs-review'

  const extraFields = useMemo(() => config.extraFields ?? [], [config.extraFields])

  /* ── what each step needs before Next turns on ───────────────────────── */
  const canAdvance = useMemo(() => {
    // `needs-review` is never completable — there is no content to agree to.
    if (needsReview) return false
    switch (step) {
      case 'name':
        return first.trim() !== '' && last.trim() !== '' && legalNameConfirmed
      case 'license':
        return license.trim() !== ''
      case 'identity':
        return first.trim() !== '' && last.trim() !== ''
      case 'document':
        /* The Ohio Registration Form wants a signature rather than a tick, so
           on that one variant the typed name IS the gate. Everywhere else the
           attest checkbox is. The acknowledgment list above it is a reading
           list, not a set of gates — the attestation covers it. */
        return config.wetSignature ? wetSignatureName.trim() !== '' : agreed
      case 'student':
        return (
          first.trim() !== '' &&
          last.trim() !== '' &&
          extraFields.every((f) => (extras[f] ?? '').trim() !== '') &&
          agreed
        )
      case 'proctor':
        return relationship !== '' && proctorAttested
      default:
        return false
    }
  }, [
    needsReview,
    step,
    first,
    last,
    legalNameConfirmed,
    license,
    config.wetSignature,
    wetSignatureName,
    agreed,
    extraFields,
    extras,
    relationship,
    proctorAttested,
  ])

  const eyebrow =
    step === 'document'
      ? DOCUMENT_STEP_TITLE[config.shape] ?? STEP_CHROME.document.title
      : STEP_CHROME[step]?.title ?? config.title

  /* The warning triangle for the one document with no content, a pen for the
     one that is signed rather than ticked, and the step's own glyph for
     everything else. */
  const avatarIcon = needsReview ? (
    <TriangleExclamation size={24} aria-hidden />
  ) : step === 'document' && config.wetSignature ? (
    <PenFieldRegular size={24} aria-hidden />
  ) : (
    STEP_CHROME[step]?.icon ?? <FileLinesRegular size={24} aria-hidden />
  )

  function goBack() {
    if (stepIndex === 0) {
      onClose()
      return
    }
    setStepIndex((i) => i - 1)
  }

  function goNext() {
    if (!canAdvance) return
    if (isLast) {
      onComplete()
      return
    }
    setStepIndex((i) => i + 1)
  }

  return (
    /* ⚠ THE BACKDROP CLOSES IT (2026-10-19, asked for on the preview), which
       is a deliberate reversal of the shape this was specced with.
       `disableBackdropClose` exists for config flows where tossing someone's
       input would feel hostile — and with `hideChrome` there is no ✕, so Esc
       was the only way out for anyone who did not think to look for one. A
       review modal nobody can dismiss by clicking away is the worse of the
       two failures. Closing still discards the answers; see the remount note
       above. */
    <Modal open={open} onClose={onClose} title={config.title} hideChrome width={460}>
      {/* ── the navy header ───────────────────────────────────────────── */}
      <div style={HEADER}>
        <div aria-hidden style={HEADER_AVATAR}>
          {avatarIcon}
        </div>
        <div style={HEADER_TEXT}>
          <p style={HEADER_EYEBROW}>{eyebrow}</p>
        {/* THE HEADING IS THE DOCUMENT'S KIND, not its per-state title — the
            six names the SharePoint set uses. What a learner needs from a
            heading is "what am I being asked to sign", and "Post Final
            Affidavit" answers that where "Ohio — Pre & Post Final Affidavit"
            makes them read a line of administrative naming first. The
            specific document is the line under it, and it still carries the
            state, so two Florida notices remain tellable apart. */}
          <h2 style={HEADER_TITLE}>{config.complianceType}</h2>
          <p style={HEADER_META}>{config.title}</p>
        </div>
      </div>

      {/* ── the white card ────────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={{ width: '100%' }}>
          {step === 'name' && (
            <StepName
              first={first}
              last={last}
              onFirst={setFirst}
              onLast={setLast}
              confirmed={legalNameConfirmed}
              onConfirmed={setLegalNameConfirmed}
            />
          )}

          {step === 'identity' && (
            <StepIdentity first={first} last={last} onFirst={setFirst} onLast={setLast} />
          )}

          {step === 'license' && (
            <StepLicense value={license} onChange={setLicense} lookupUrl={licenseLookupUrl} />
          )}

          {step === 'document' && (
            <StepDocument
              config={config}
              language={language}
              first={first}
              last={last}
              studentName={studentName}
              onStudentName={setStudentName}
              signature={signature}
              onSignature={setSignature}
              agreed={agreed}
              onAgreed={setAgreed}
              wetSignatureName={wetSignatureName}
              onWetSignatureName={setWetSignatureName}
            />
          )}

          {step === 'student' && (
            <StepStudent
              config={config}
              first={first}
              last={last}
              onFirst={setFirst}
              onLast={setLast}
              extras={extras}
              onExtra={(key, value) => setExtras((e) => ({ ...e, [key]: value }))}
              agreed={agreed}
              onAgreed={setAgreed}
            />
          )}

          {step === 'proctor' && (
            <StepProctor
              config={config}
              relationship={relationship}
              onRelationship={setRelationship}
              attested={proctorAttested}
              onAttested={setProctorAttested}
            />
          )}
        </div>

        {/* ── progress + the two circular buttons ─────────────────────── */}
        <div style={FOOTER}>
          {/* ⚠ A ONE-STEP DOCUMENT GETS NAMED BUTTONS, NOT ARROWS. Arrows
              promise a sequence — they say "there is a previous and a next"
              — and on a single-step document both halves of that are a lie:
              there is nowhere back to go and nothing after. Cancel and
              Confirm say what the two actions actually do. The arrows stay
              wherever there IS a sequence to move through. */}
          {steps.length === 1 ? (
            <div style={SINGLE_ACTIONS}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={goNext} disabled={!canAdvance}>
                Confirm
              </Button>
            </div>
          ) : (
            /* Two or more steps: the arrows, with the progress strip between
               them. Everything here is reachable only when there IS a
               sequence, so none of it needs its own length check. */
            <>
              <button type="button" onClick={goBack} aria-label="Back" style={BACK_BUTTON}>
                <ChevronLeft size={18} aria-hidden />
              </button>

              <div style={PROGRESS}>
                <div style={SEGMENTS} role="presentation">
                  {steps.map((s, i) => (
                    <span
                      key={s}
                      style={{
                        ...SEGMENT,
                        background:
                          i <= stepIndex ? 'var(--color-action)' : 'var(--color-neutral-200)',
                      }}
                    />
                  ))}
                </div>
                <span style={STEP_LABEL}>
                  Step {stepIndex + 1} of {steps.length}
                </span>
              </div>

              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                aria-label={isLast ? 'Finish' : 'Next'}
                style={canAdvance ? NEXT_BUTTON_ON : NEXT_BUTTON_OFF}
              >
                {isLast ? (
                  <Check size={18} strokeWidth={3} aria-hidden />
                ) : (
                  <ChevronRight size={18} aria-hidden />
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  )
}

/* ── steps ────────────────────────────────────────────────────────────── */

function StepName({
  first,
  last,
  onFirst,
  onLast,
  confirmed,
  onConfirmed,
}: {
  first: string
  last: string
  onFirst: (v: string) => void
  onLast: (v: string) => void
  confirmed: boolean
  onConfirmed: (v: boolean) => void
}) {
  return (
    <div style={STACK}>
      <p style={LEAD}>
        Your name has to match the name on the government-issued ID you will present at the
        examination centre.
      </p>
      <Field label="First Name" value={first} onChange={onFirst} placeholder="First name" />
      <Field label="Last Name" value={last} onChange={onLast} placeholder="Last name" />
      <Checkbox
        checked={confirmed}
        onChange={(e) => onConfirmed(e.target.checked)}
        label="This is my legal name as it appears on my ID"
      />
    </div>
  )
}

function StepIdentity({
  first,
  last,
  onFirst,
  onLast,
}: {
  first: string
  last: string
  onFirst: (v: string) => void
  onLast: (v: string) => void
}) {
  return (
    <div style={STACK}>
      <p style={LEAD}>
        Confirm who is making this declaration. This is the name that goes on the affidavit.
      </p>
      <Field label="First Name" value={first} onChange={onFirst} placeholder="First name" />
      <Field label="Last Name" value={last} onChange={onLast} placeholder="Last name" />
    </div>
  )
}

function StepLicense({
  value,
  onChange,
  lookupUrl,
}: {
  value: string
  onChange: (v: string) => void
  lookupUrl?: string
}) {
  return (
    <div style={STACK}>
      <p style={LEAD}>
        Enter the license or NAPB number your state has on file for you.
      </p>
      <Field label="License / NAPB Number" value={value} onChange={onChange} placeholder="e.g. W123456" />
      {lookupUrl && (
        <a href={lookupUrl} target="_blank" rel="noreferrer" style={LOOKUP_LINK}>
          Look up my license number
        </a>
      )}
    </div>
  )
}

function StepDocument({
  config,
  language,
  first,
  last,
  studentName,
  onStudentName,
  signature,
  onSignature,
  agreed,
  onAgreed,
  wetSignatureName,
  onWetSignatureName,
}: {
  config: ComplianceDocumentConfig
  language: 'en' | 'es'
  first: string
  last: string
  studentName: string
  onStudentName: (v: string) => void
  signature: string
  onSignature: (v: string) => void
  agreed: boolean
  onAgreed: (v: boolean) => void
  wetSignatureName: string
  onWetSignatureName: (v: string) => void
}) {
  /* ── needs-review: a placeholder, never a completable step ───────────── */
  if (config.shape === 'needs-review') {
    return (
      <div style={STACK}>
        <div style={WARNING_PANEL}>
          <p style={WARNING_HEADING}>Content pending manual review</p>
          <p style={WARNING_BODY}>{config.needsReviewNote}</p>
        </div>
      </div>
    )
  }

  /* ── notice: body text and "I Agree", and nothing else ───────────────── */
  if (config.shape === 'notice') {
    const body = language === 'es' ? config.bodyEs : config.bodyEn
    return (
      <div style={STACK}>
        <div style={DOCUMENT_PANEL}>
          <p style={DOCUMENT_BODY}>{body}</p>
        </div>
        <Checkbox checked={agreed} onChange={(e) => onAgreed(e.target.checked)} label="I Agree" />
      </div>
    )
  }

  /* ── enrollment-agreement: the long one ──────────────────────────────── */
  if (config.shape === 'enrollment-agreement') {
    return (
      <div style={STACK}>
        {config.agency && <p style={EYEBROW}>{config.agency}</p>}
        <div style={{ ...DOCUMENT_PANEL, maxHeight: 220, overflowY: 'auto' }}>
          {(config.sections ?? []).map((s) => (
            <div key={s.heading} style={{ marginBottom: 14 }}>
              <p style={SECTION_HEADING}>{s.heading}</p>
              <p style={DOCUMENT_BODY}>{s.body}</p>
            </div>
          ))}
        </div>
        {/* A reading list, not a set of gates — the attestation below covers
            all of them, which is how the source documents are structured. */}
        <ul style={ACK_LIST}>
          {(config.acknowledgments ?? []).map((a) => (
            <li key={a} style={ACK_ITEM}>
              <span aria-hidden style={ACK_CHECK}>
                <Check size={12} strokeWidth={3} />
              </span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
        {config.wetSignature ? (
          <>
            <p style={LEAD}>
              This Registration Form is signed, not confirmed. Type your full legal name below in
              place of your physical signature.
            </p>
            <Field
              label="Student Signature"
              value={wetSignatureName}
              onChange={onWetSignatureName}
              placeholder="Type your full legal name"
              signatureStyle
            />
          </>
        ) : (
          <Checkbox
            checked={agreed}
            onChange={(e) => onAgreed(e.target.checked)}
            label="I have read and agree to this Enrollment Agreement"
          />
        )}
      </div>
    )
  }

  /* ── signed-tc: body, name, typed signature, attest ──────────────────── */
  if (config.shape === 'signed-tc') {
    return (
      <div style={STACK}>
        <div style={DOCUMENT_PANEL}>
          <p style={DOCUMENT_BODY}>{config.body}</p>
        </div>
        {/* Prefilled from the `name` step the shape already ran, and still
            editable — the source documents ask for the name again on the
            document itself. */}
        <Field
          label="Student Name"
          value={studentName === '' ? `${first} ${last}`.trim() : studentName}
          onChange={onStudentName}
          placeholder="Your full name"
        />
        <Field
          label="Signature"
          value={signature}
          onChange={onSignature}
          placeholder="Type your full name to sign"
          signatureStyle
        />
        <Checkbox
          checked={agreed}
          onChange={(e) => onAgreed(e.target.checked)}
          label="I Agree / I Attest"
        />
      </div>
    )
  }

  /* ── affidavit-single: body + attest ─────────────────────────────────── */
  return (
    <div style={STACK}>
      <div style={DOCUMENT_PANEL}>
        <p style={DOCUMENT_BODY}>{config.body}</p>
      </div>
      <Checkbox
        checked={agreed}
        onChange={(e) => onAgreed(e.target.checked)}
        label="I attest that the statement above is true"
      />
    </div>
  )
}

function StepStudent({
  config,
  first,
  last,
  onFirst,
  onLast,
  extras,
  onExtra,
  agreed,
  onAgreed,
}: {
  config: ComplianceDocumentConfig
  first: string
  last: string
  onFirst: (v: string) => void
  onLast: (v: string) => void
  extras: Record<string, string>
  onExtra: (key: string, value: string) => void
  agreed: boolean
  onAgreed: (v: boolean) => void
}) {
  return (
    <div style={STACK}>
      <Declaration label="Student Declaration" body={config.studentBody} />
      <Field label="First Name" value={first} onChange={onFirst} placeholder="First name" />
      <Field label="Last Name" value={last} onChange={onLast} placeholder="Last name" />
      {(config.extraFields ?? []).map((f) => (
        <Field
          key={f}
          label={EXTRA_FIELD_LABEL[f]}
          value={extras[f] ?? ''}
          onChange={(v) => onExtra(f, v)}
          placeholder={EXTRA_FIELD_PLACEHOLDER[f]}
        />
      ))}
      <Checkbox
        checked={agreed}
        onChange={(e) => onAgreed(e.target.checked)}
        label="I attest to the student declaration above"
      />
    </div>
  )
}

function StepProctor({
  config,
  relationship,
  onRelationship,
  attested,
  onAttested,
}: {
  config: ComplianceDocumentConfig
  relationship: string
  onRelationship: (v: string) => void
  attested: boolean
  onAttested: (v: boolean) => void
}) {
  return (
    <div style={STACK}>
      <Declaration label="Proctor Declaration" body={config.proctorBody} />
      <div>
        <p style={FIELD_LABEL}>Relationship to Examinee</p>
        {/* The option set varies by state — Ohio carries six, California and
            Illinois four — so it is read from the config, never hardcoded. */}
        <div style={CHIP_ROW} role="group" aria-label="Relationship to examinee">
          {(config.relationshipOptions ?? []).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => onRelationship(o)}
              aria-pressed={relationship === o}
              style={relationship === o ? CHIP_ON : CHIP_OFF}
            >
              {o}
            </button>
          ))}
        </div>
      </div>
      <Checkbox
        checked={attested}
        onChange={(e) => onAttested(e.target.checked)}
        label="I attest to the proctor declaration above"
      />
    </div>
  )
}

/** A bordered sub-section with a left accent stroke — the two-party shape's
 *  way of showing that one signer's words are not the other's. */
function Declaration({ label, body }: { label: string; body?: string }) {
  return (
    <div style={DECLARATION}>
      <p style={DECLARATION_LABEL}>{label}</p>
      <p style={DOCUMENT_BODY}>{body}</p>
    </div>
  )
}

/** The repo has no shared text-input primitive, so this is the local one —
 *  Checkbox and Modal are reused; there is nothing to reuse here. */
function Field({
  label,
  value,
  onChange,
  placeholder,
  signatureStyle,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Draws the value in the heading serif, so a typed signature reads as one. */
  signatureStyle?: boolean
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={FIELD_LABEL}>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{
          ...INPUT,
          ...(signatureStyle
            ? { fontFamily: 'var(--font-heading-serif)', fontSize: 18 }
            : null),
        }}
      />
    </label>
  )
}

/* ── styles ───────────────────────────────────────────────────────────── */

const HEADER: CSSProperties = {
  background: 'var(--color-nav-shared-navy)',
  padding: '22px 28px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}

/* The step's glyph, in the header beside the type and the document it names.
   ⚠ IT IS NOT THE `--color-primary-500` ON `--color-primary-100` of
   `EnrollmentConfirmationModal`'s avatar, and it cannot be: that pairing is
   built to sit on a white card, and the teal falls to roughly 2:1 against this
   navy. It takes the header's OWN accent instead — the same
   `--color-info-300` as the eyebrow above it — so the badge belongs to the
   header rather than looking like a white-card component dropped onto it. */
const HEADER_AVATAR: CSSProperties = {
  width: 48,
  height: 48,
  flexShrink: 0,
  borderRadius: 'var(--radius-pill)',
  background: 'color-mix(in srgb, var(--color-info-300) 18%, transparent)',
  color: 'var(--color-info-300)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/* `minWidth: 0` so a long document name wraps inside the column instead of
   pushing the badge off the header. */
const HEADER_TEXT: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
}

const HEADER_EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-info-300)',
}

const HEADER_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 20,
  lineHeight: '28px',
  color: 'var(--color-fixed-light)',
}

const HEADER_META: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-fixed-light)',
  opacity: 0.68,
}

/* The white card meets the navy on a SQUARE seam — no top rounding, so the
   two blocks read as one panel split by colour rather than as a card tucked
   under a header. The modal's own outer corners still round; `Modal` clips
   them (`overflow: hidden`), which is what lets these be 0 without the card
   poking out at the bottom.
   ⚠ THE -16 OVERLAP WENT WITH THE AVATAR. It existed only to pull the circle
   up onto the seam; with the glyph in the header there is nothing to straddle
   it, and the offset was just cropping 16px of navy. */
const CARD: CSSProperties = {
  position: 'relative',
  padding: '24px 28px 22px',
  background: 'var(--color-surface-card)',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const STACK: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 14, width: '100%' }

const LEAD: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-secondary)',
}

const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const DOCUMENT_PANEL: CSSProperties = {
  padding: '14px 16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-neutral-75)',
  border: '1px solid var(--color-border-subtle)',
}

const DOCUMENT_BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const SECTION_HEADING: CSSProperties = {
  margin: '0 0 4px',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-primary)',
}

const ACK_LIST: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const ACK_ITEM: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const ACK_CHECK: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  flexShrink: 0,
  marginTop: 1,
  borderRadius: 'var(--radius-pill)',
  background: 'color-mix(in srgb, var(--color-primary-100) 50%, transparent)',
  color: 'var(--color-primary-500)',
}

const DECLARATION: CSSProperties = {
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  borderLeft: '3px solid var(--color-primary-500)',
  background: 'var(--color-neutral-75)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const DECLARATION_LABEL: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-500)',
}

const WARNING_PANEL: CSSProperties = {
  padding: '14px 16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-warning-100)',
  border: '1px solid var(--color-warning-300)',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const WARNING_HEADING: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-warning-800)',
}

const WARNING_BODY: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-warning-800)',
}

const FIELD_LABEL: CSSProperties = {
  display: 'block',
  margin: '0 0 4px',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const INPUT: CSSProperties = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  boxSizing: 'border-box',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  outline: 'none',
}

const LOOKUP_LINK: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-action)',
}

const CHIP_ROW: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }

const CHIP_OFF: CSSProperties = {
  padding: '7px 14px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const CHIP_ON: CSSProperties = {
  ...CHIP_OFF,
  background: 'var(--color-action)',
  borderColor: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
}

const FOOTER: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  paddingTop: 4,
}

/* Right-aligned, Confirm last — the order every other confirm/dismiss pair
   in this app uses, so the primary sits under the thumb on the side people
   expect it. */
const SINGLE_ACTIONS: CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 10,
}

const PROGRESS: CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 6,
}

const SEGMENTS: CSSProperties = { display: 'flex', gap: 4, width: '100%' }

const SEGMENT: CSSProperties = {
  flex: 1,
  height: 4,
  borderRadius: 'var(--radius-pill)',
}

const STEP_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
}

const ROUND_BUTTON: CSSProperties = {
  width: 44,
  height: 44,
  flexShrink: 0,
  borderRadius: 'var(--radius-pill)',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
}

const BACK_BUTTON: CSSProperties = {
  ...ROUND_BUTTON,
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-secondary)',
}

const NEXT_BUTTON_ON: CSSProperties = {
  ...ROUND_BUTTON,
  background: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
}

const NEXT_BUTTON_OFF: CSSProperties = {
  ...ROUND_BUTTON,
  background: 'var(--color-neutral-200)',
  color: 'var(--color-text-tertiary)',
  cursor: 'not-allowed',
}
