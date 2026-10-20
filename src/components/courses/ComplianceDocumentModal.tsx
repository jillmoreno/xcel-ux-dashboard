import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Check,
  FileLinesRegular,
  IdCard,
  PenFieldRegular,
  TriangleExclamation,
  User,
  Users,
} from '@/icons'
import {
  acknowledgementFor,
  stepsFor,
  type AcknowledgementLevel,
  type ComplianceDocumentConfig,
  type CounterSignature,
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
}

/* ── per-step glyph ──────────────────────────────────────────────────────
   The icon in the header badge. There is no step EYEBROW any more — see the
   header below for why — so this carries nothing but the glyph. */
const STEP_ICON: Record<string, ReactNode> = {
  name: <User size={24} aria-hidden />,
  identity: <IdCard size={24} aria-hidden />,
  document: <FileLinesRegular size={24} aria-hidden />,
  student: <User size={24} aria-hidden />,
  proctor: <Users size={24} aria-hidden />,
}

const EXTRA_FIELD_LABEL: Record<ExtraField, string> = {
  'dob': 'Date of Birth',
  'ssn-last4': 'Last 4 of SSN',
  'ssn-full': 'Social Security Number',
  'phone': 'Phone Number',
  'exam-date': 'Exam Date',
  'full-name': 'Full Name',
  'address': 'Address',
}

const EXTRA_FIELD_PLACEHOLDER: Record<ExtraField, string> = {
  'dob': 'MM / DD / YYYY',
  'ssn-last4': '0000',
  'ssn-full': '000-00-0000',
  'phone': '(000) 000-0000',
  'exam-date': 'MM / DD / YYYY',
  /* Unused for rendering — `full-name` draws `NameFields`, three boxes. Kept
     so the record stays total over `ExtraField`. */
  'full-name': 'Full legal name',
  'address': 'Street address, city, state, zip',
}

export function ComplianceDocumentModal({
  open,
  onClose,
  onComplete,
  config,
  language = 'en',
}: Props) {
  /* Memoised because `stepsFor` builds a fresh array for a `proctorFirst`
     document, and `step` is derived from it — an unstable reference there
     defeats the memoisation of every gate below it. */
  const steps = useMemo(() => stepsFor(config), [config])
  const [stepIndex, setStepIndex] = useState(0)

  /* `name` is shared by the `name`, `identity` and `student` steps — the same
     person asked the same thing, and a shape never carries two of them. */
  /* One record per NAME rather than a field per part: the learner's own, the
     name they re-enter on a signed-tc document, and the proctor's. */
  const [name, setName] = useState<Record<string, string>>({})
  const [studentName, setStudentName] = useState<Record<string, string>>({})
  const [legalNameConfirmed, setLegalNameConfirmed] = useState(false)
  const [agreed, setAgreed] = useState(false)
  /* ⚠ SIGNATURES ARE NEVER PREFILLED. Everything else on a document is
     pre-filled from what we already know (the PRD's signature model, T-22:
     "pre-fill what we know, have the learner confirm it, then type their
     name"). The signature is the one field the learner has to produce
     themselves — a pre-filled signature is not a signature. */
  const [signature, setSignature] = useState('')
  const [proctorSignature, setProctorSignature] = useState('')
  const [extras, setExtras] = useState<Record<string, string>>({})
  const [relationship, setRelationship] = useState('')
  const [proctorValues, setProctorValues] = useState<Record<string, string>>({})
  const [proctorName, setProctorName] = useState<Record<string, string>>({})
  const [proctorAttested, setProctorAttested] = useState(false)

  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const isLast = stepIndex === steps.length - 1
  const needsReview = config.shape === 'needs-review'

  const extraFields = useMemo(() => config.extraFields ?? [], [config.extraFields])
  const ack = acknowledgementFor(config)

  /* ⚠ PREFILL, THEN CONFIRM — the PRD's signature model (T-22). The name the
     learner gave a step earlier shows through on the document; typing there
     overrides it. Merged rather than copied into state, so there is no effect
     to keep in step and no moment where the two disagree. */
  const documentName = useMemo(
    () => ({ ...name, ...studentName }),
    [name, studentName],
  )

  /**
   * ⚠ THE PROCTOR CANNOT BE THE LEARNER — "the proctor's name can't match the
   * learner's" (PRD §4.2 row 7). A monitor who is the examinee is the single
   * thing the proctor requirement exists to prevent, and it is the one that
   * an honest mistake produces: the learner reaches the proctor step, sees
   * name boxes, and fills in their own.
   *
   * Compared on the whole name, case- and space-insensitively, because
   * "jordan navarro" and "Jordan  Navarro" are the same person.
   */
  const proctorIsLearner = useMemo(() => {
    const flat = (v: string) => v.trim().toLowerCase().replace(/\s+/g, ' ')
    const learner = flat(joinName(name))
    const proctor = flat(joinName(proctorName))
    /* ⚠ IT HAS TO HOLD IN BOTH ORDERS. With `proctorFirst` the monitor is
       entered before the learner, so a check that only reads the proctor's
       side would be comparing against an empty name and pass every time —
       and then the learner could type the proctor's name with nothing to
       catch it. Either side being empty means there is nothing to compare
       yet; once both exist, the clash is the same clash whichever arrived
       first. */
    if (!learner || !proctor) return false
    return proctor === learner || flat(proctorSignature) === learner
  }, [name, proctorName, proctorSignature])

  /* ── what each step needs before Next turns on ───────────────────────── */
  const canAdvance = useMemo(() => {
    // `needs-review` is never completable — there is no content to agree to.
    if (needsReview) return false
    switch (step) {
      case 'name':
        return nameComplete(name) && legalNameConfirmed
      case 'identity':
        /* The identity fields gate here for the same reason they do on the
           two-party student step: a roster the state rejects is not a
           completion. */
        return (
          nameComplete(name) && extraFields.every((f) => (extras[f] ?? '').trim() !== '')
        )
      case 'document':
        /* What the document asks for, at the PRD's three levels. 'none' is
           not an oversight: a notice the regulator only requires us to SHOW
           has nothing to gate on, and inventing a tick for it trains learners
           to click past the ones that matter. */
        if (ack === 'none') return true
        if (!agreed) return false
        if (ack === 'signature' && signature.trim() === '') return false
        return config.shape !== 'signed-tc' || nameComplete(documentName)
      case 'student':
        return (
          nameComplete(name) &&
          extraFields.every((f) => (extras[f] ?? '').trim() !== '') &&
          agreed &&
          signature.trim() !== '' &&
          !proctorIsLearner
        )
      case 'proctor':
        return (
          relationship !== '' &&
          /* `full-name` is the three-part name; everything else is one box. */
          (config.proctorFields ?? []).every((f) =>
            f === 'full-name' ? nameComplete(proctorName) : (proctorValues[f] ?? '').trim() !== '',
          ) &&
          proctorAttested &&
          proctorSignature.trim() !== '' &&
          !proctorIsLearner
        )
      default:
        return false
    }
  }, [
    needsReview,
    step,
    name,
    legalNameConfirmed,
    ack,
    config.shape,
    documentName,
    signature,
    proctorSignature,
    proctorIsLearner,
    agreed,
    extraFields,
    extras,
    relationship,
    config.proctorFields,
    proctorValues,
    proctorName,
    proctorAttested,
  ])

  /* The warning triangle for the one document with no content, a pen for the
     one that is signed rather than ticked, and the step's own glyph for
     everything else. */
  const avatarIcon = needsReview ? (
    <TriangleExclamation size={24} aria-hidden />
  ) : step === 'document' && ack === 'signature' ? (
    <PenFieldRegular size={24} aria-hidden />
  ) : (
    STEP_ICON[step] ?? <FileLinesRegular size={24} aria-hidden />
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
      <div style={SHELL}>
      {/* ── the navy header ───────────────────────────────────────────── */}
      <div style={HEADER}>
        <div aria-hidden style={HEADER_AVATAR}>
          {avatarIcon}
        </div>
        <div style={HEADER_TEXT}>
            {/* THE HEADING IS THE DOCUMENT'S KIND — the six names the
              SharePoint set uses — and the line under it is that document
              MINUS its kind, so the two never say the same words twice.
              "Pre-Course Notice" over "Florida — Property & Casualty",
              not over "Florida — Property & Casualty Pre-Course Notice".

              ⚠ THERE IS NO EYEBROW. It named the step ("REVIEW THE NOTICE"),
              which on a one-step document is a third line saying what the
              heading already says. Where a step genuinely needs naming the
              body does it — the two-party shape labels its Student and
              Proctor declarations inside their own panels — and the progress
              strip still counts the steps. */}
          <h2 style={HEADER_TITLE}>{config.complianceType}</h2>
          <p style={HEADER_META}>{config.subject}</p>
        </div>
      </div>

      {/* ── the white card ────────────────────────────────────────────── */}
      <div style={CARD}>
        <div style={{ width: '100%' }}>
          {step === 'name' && (
            <StepName
              name={name}
              onName={(part, value) => setName((n) => ({ ...n, [part]: value }))}
              confirmed={legalNameConfirmed}
              onConfirmed={setLegalNameConfirmed}
            />
          )}

          {step === 'identity' && (
            <StepIdentity
              config={config}
              name={name}
              onName={(part, value) => setName((n) => ({ ...n, [part]: value }))}
              extras={extras}
              onExtra={(key, value) => setExtras((e) => ({ ...e, [key]: value }))}
            />
          )}

          {step === 'document' && (
            <StepDocument
              config={config}
              language={language}
              name={documentName}
              onName={(part, value) => setStudentName((n) => ({ ...n, [part]: value }))}
              signature={signature}
              onSignature={setSignature}
              agreed={agreed}
              onAgreed={setAgreed}
            />
          )}

          {step === 'student' && (
            <StepStudent
              config={config}
              name={name}
              onName={(part, value) => setName((n) => ({ ...n, [part]: value }))}
              extras={extras}
              onExtra={(key, value) => setExtras((e) => ({ ...e, [key]: value }))}
              agreed={agreed}
              onAgreed={setAgreed}
              signature={signature}
              onSignature={setSignature}
              isProctor={proctorIsLearner}
            />
          )}

          {step === 'proctor' && (
            <StepProctor
              config={config}
              relationship={relationship}
              onRelationship={setRelationship}
              fields={proctorValues}
              onField={(key, value) => setProctorValues((v) => ({ ...v, [key]: value }))}
              name={proctorName}
              onName={(part, value) => setProctorName((n) => ({ ...n, [part]: value }))}
              attested={proctorAttested}
              onAttested={setProctorAttested}
              signature={proctorSignature}
              onSignature={setProctorSignature}
              isLearner={proctorIsLearner}
            />
          )}
        </div>

        {/* ── progress + the two circular buttons ─────────────────────── */}
        <div style={FOOTER}>
          {/* ⚠ THE STEP STRIP ONLY EXISTS WHERE THERE ARE STEPS. On a
              one-step document a single filled segment over "Step 1 of 1" is
              a bar that was never going to move. */}
          {steps.length > 1 && (
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
          )}

          {/* ⚠ NAMED BUTTONS EVERYWHERE, NO ARROWS. A chevron says "there is
              more this way" and nothing else; it cannot say whether pressing
              it signs a compliance document or just turns a page. The pair is
              always secondary-then-primary, and each half says what it does:
              leaving is Cancel on the first step and Back after it, and
              committing is Next until the last step, where it is Confirm. */}
          <div style={ACTIONS}>
            <Button variant="secondary" onClick={goBack}>
              {stepIndex === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button variant="primary" onClick={goNext} disabled={!canAdvance}>
              {isLast ? 'Confirm' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
      </div>
    </Modal>
  )
}

/* ── steps ────────────────────────────────────────────────────────────── */

function StepName({
  name,
  onName,
  confirmed,
  onConfirmed,
}: {
  name: Record<string, string>
  onName: (part: NamePart, value: string) => void
  confirmed: boolean
  onConfirmed: (v: boolean) => void
}) {
  return (
    <div style={STACK}>
      <p style={LEAD}>
        Your name has to match the name on the government-issued ID you will present at the
        examination centre.
      </p>
      <NameFields values={name} onChange={onName} />
      <Checkbox
        checked={confirmed}
        onChange={(e) => onConfirmed(e.target.checked)}
        label="This is my legal name as it appears on my ID"
      />
    </div>
  )
}

function StepIdentity({
  config,
  name,
  onName,
  extras,
  onExtra,
}: {
  config: ComplianceDocumentConfig
  name: Record<string, string>
  onName: (part: NamePart, value: string) => void
  extras: Record<string, string>
  onExtra: (key: string, value: string) => void
}) {
  return (
    <div style={STACK}>
      <p style={LEAD}>
        Confirm who is making this declaration. This is the name that goes on the affidavit.
      </p>
      <NameFields values={name} onChange={onName} />
      {/* ⚠ THESE WERE SILENTLY DROPPED. `extraFields` rendered only on the
          two-party student step, so every single-signer affidavit that asks
          for one — California's date of birth and SSN last four, Illinois'
          full SSN, Ohio's exam date, phone and SSN, New York's exam date —
          collected nothing at all. The flow completed and the fields the
          state's roster needs were simply never asked for. */}
      {(config.extraFields ?? []).map((f) => (
        <Field
          key={f}
          label={EXTRA_FIELD_LABEL[f]}
          value={extras[f] ?? ''}
          onChange={(v) => onExtra(f, v)}
          placeholder={EXTRA_FIELD_PLACEHOLDER[f]}
        />
      ))}
    </div>
  )
}

function StepDocument({
  config,
  language,
  name,
  onName,
  signature,
  onSignature,
  agreed,
  onAgreed,
}: {
  config: ComplianceDocumentConfig
  language: 'en' | 'es'
  name: Record<string, string>
  onName: (part: NamePart, value: string) => void
  signature: string
  onSignature: (v: string) => void
  agreed: boolean
  onAgreed: (v: boolean) => void
}) {
  const ack = acknowledgementFor(config)
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
          {/* These documents are multi-paragraph — the Florida notices close
              with a separate sentence about what clicking the button means.
              One `<p>` would run that into the body as a wall of text. */}
          <DocumentBody body={body} />
        </div>
        {/* ⚠ THE LABEL IS THE ONE THE DOCUMENT NAMES. Florida's notice ends
            "By clicking the 'I Agree' button below" in English and "Al
            seleccionar el botón 'Acepto'" in Spanish — so on the Spanish arm
            a button reading "I Agree" is a document referring to a control
            that is not on screen. */}
        <Checkbox
          checked={agreed}
          onChange={(e) => onAgreed(e.target.checked)}
          label={language === 'es' ? 'Acepto' : 'I Agree'}
        />
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
        <SignOff
          ack={ack}
          label="I have read and agree to this Enrollment Agreement"
          agreed={agreed}
          onAgreed={onAgreed}
          signature={signature}
          onSignature={onSignature}
          counterSignature={config.counterSignature}
        />
      </div>
    )
  }

  /* ── signed-tc: body, name, typed signature, attest ──────────────────── */
  if (config.shape === 'signed-tc') {
    /* Bilingual where the source document is — the XCEL Generic one prints
       its English acknowledgement and then its Spanish — single-language
       otherwise. */
    const tcBody = config.bilingual
      ? language === 'es'
        ? config.bodyEs
        : config.bodyEn
      : config.body
    return (
      <div style={STACK}>
        <div style={DOCUMENT_PANEL}>
          <DocumentBody body={tcBody} />
        </div>
        {/* The source documents ask for the name again on the document
            itself — "Student Full Name" on its own signature line, which is
            three boxes here like every other legal name. */}
        {/* Prefilled from the name step and still editable — the source
            documents ask for the name again on the document itself. */}
        <NameFields values={name} onChange={onName} />
        <SignOff
          ack={ack}
          label="I Agree / I Attest"
          agreed={agreed}
          onAgreed={onAgreed}
          signature={signature}
          onSignature={onSignature}
        />
      </div>
    )
  }

  /* ── affidavit-single: body + attest ─────────────────────────────────── */
  return (
    <div style={STACK}>
      <div style={DOCUMENT_PANEL}>
        <DocumentBody body={config.body} />
      </div>
      <SignOff
        ack={ack}
        label="I attest that the statement above is true"
        agreed={agreed}
        onAgreed={onAgreed}
        signature={signature}
        onSignature={onSignature}
      />
    </div>
  )
}

function StepStudent({
  config,
  name,
  onName,
  extras,
  onExtra,
  agreed,
  onAgreed,
  signature,
  onSignature,
  isProctor,
}: {
  config: ComplianceDocumentConfig
  name: Record<string, string>
  onName: (part: NamePart, value: string) => void
  extras: Record<string, string>
  onExtra: (key: string, value: string) => void
  agreed: boolean
  onAgreed: (v: boolean) => void
  signature: string
  onSignature: (v: string) => void
  /** True when the learner's details match the proctor's. */
  isProctor: boolean
}) {
  return (
    <div style={STACK}>
      <Declaration label="Student Declaration" body={config.studentBody} />
      <NameFields values={name} onChange={onName} />
      {(config.extraFields ?? []).map((f) => (
        <Field
          key={f}
          label={EXTRA_FIELD_LABEL[f]}
          value={extras[f] ?? ''}
          onChange={(v) => onExtra(f, v)}
          placeholder={EXTRA_FIELD_PLACEHOLDER[f]}
        />
      ))}
      <SignOff
        ack="signature"
        label="I attest to the student declaration above"
        agreed={agreed}
        onAgreed={onAgreed}
        signature={signature}
        onSignature={onSignature}
        error={
          isProctor
            ? 'An examinee cannot be their own proctor. This name matches the monitor’s.'
            : undefined
        }
      />
    </div>
  )
}

function StepProctor({
  config,
  relationship,
  onRelationship,
  fields,
  onField,
  name,
  onName,
  attested,
  onAttested,
  signature,
  onSignature,
  isLearner,
}: {
  config: ComplianceDocumentConfig
  relationship: string
  onRelationship: (v: string) => void
  fields: Record<string, string>
  onField: (key: string, value: string) => void
  name: Record<string, string>
  onName: (part: NamePart, value: string) => void
  attested: boolean
  onAttested: (v: boolean) => void
  signature: string
  onSignature: (v: string) => void
  /** True when the proctor's details match the learner's. */
  isLearner: boolean
}) {
  return (
    <div style={STACK}>
      <Declaration label="Proctor Declaration" body={config.proctorBody} />
      {/* ⚠ THE PROCTOR'S OWN DETAILS, not the student's. Wisconsin wants a
          name, address and phone from the monitor while asking the student
          for nothing extra — so these come from `proctorFields`, never from
          `extraFields`. */}
      {(config.proctorFields ?? []).map((f) =>
        /* The proctor's name is the same three boxes the student gets — a
           monitor's legal name is no less a legal name. */
        f === 'full-name' ? (
          <NameFields key={f} values={name} onChange={onName} />
        ) : (
          <Field
            key={f}
            label={EXTRA_FIELD_LABEL[f]}
            value={fields[f] ?? ''}
            onChange={(v) => onField(f, v)}
            placeholder={EXTRA_FIELD_PLACEHOLDER[f]}
          />
        ),
      )}
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
      <SignOff
        ack="signature"
        label="I attest to the proctor declaration above"
        agreed={attested}
        onAgreed={onAttested}
        signature={signature}
        onSignature={onSignature}
        error={
          isLearner
            ? 'A proctor cannot be the examinee. This name matches the student’s.'
            : undefined
        }
      />
    </div>
  )
}

/**
 * THE TICK AND THE SIGNATURE, at whatever level the document asks for.
 *
 * ⚠ `none` RENDERS NOTHING, and that is the point. A notice the regulator
 * only requires us to SHOW has nothing to agree to; inventing a checkbox for
 * it is friction that meets no rule and teaches learners to click past the
 * ones that do.
 */
function SignOff({
  ack,
  label,
  agreed,
  onAgreed,
  signature,
  onSignature,
  error,
  counterSignature,
}: {
  ack: AcknowledgementLevel
  label: string
  agreed: boolean
  onAgreed: (v: boolean) => void
  signature: string
  onSignature: (v: string) => void
  error?: string
  counterSignature?: CounterSignature
}) {
  if (ack === 'none') return null
  return (
    <>
      <Checkbox checked={agreed} onChange={(e) => onAgreed(e.target.checked)} label={label} />
      {ack === 'signature' && (
        <div>
          <label style={{ display: 'block' }}>
            <span style={FIELD_LABEL}>Digitally Sign</span>
            <input
              type="text"
              value={signature}
              placeholder="Type your full name to sign"
              onChange={(e) => onSignature(e.target.value)}
              aria-invalid={error ? true : undefined}
              style={{
                ...INPUT,
                fontFamily: 'var(--font-signature)',
                fontSize: 24,
                borderColor: error ? 'var(--color-warning-600)' : 'var(--color-border-subtle)',
              }}
            />
          </label>
          {error && (
            <p role="alert" style={SIGN_ERROR}>
              {error}
            </p>
          )}
        </div>
      )}
      {/* ⚠ THE SCHOOL'S SIGNATURE, ALREADY APPLIED — not a field. Nevada's
          agreement is only the document the state asks for when it carries
          both signatures, but the learner cannot produce XCEL's half and must
          not be asked to. Drawn as signed so the page reads as a contract
          rather than a form. */}
      {counterSignature && (
        <div>
          <span style={FIELD_LABEL}>Countersigned</span>
          <div
            style={COUNTERSIGNED}
            aria-label={`Countersigned by ${counterSignature.signatory}, ${counterSignature.role}`}
          >
            <span style={COUNTERSIGNED_NAME}>{counterSignature.signatory}</span>
            <span style={COUNTERSIGNED_ROLE}>{counterSignature.role}</span>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * THE DOCUMENT BODY, as the source documents are actually shaped.
 *
 * Blocks are separated by a blank line. A block is one of three things, and
 * the markers are the smallest set that renders every document in the set:
 *
 *   `## Student Notice:`   a run-in heading the document prints in bold
 *   `- ` lines             a bullet list; `  - ` nests one level under it
 *   anything else          a paragraph
 *
 * ⚠ IT IS NOT MARKDOWN AND MUST NOT GROW INTO IT. These are legal documents
 * rendered verbatim; the only reason any markup exists is that Illinois'
 * Terms & Conditions prints a heading, a numbered-steps list and a nested
 * clause, and flattening those into paragraphs changes what the document
 * says. Anything needing more structure than this is an
 * `enrollment-agreement`, which has real `sections`.
 */
function DocumentBody({ body }: { body?: string }) {
  const blocks = (body ?? '')
    .split('\n\n')
    .map((b) => b.trim())
    .filter(Boolean)

  return (
    <>
      {blocks.map((block, i) => {
        if (block.startsWith('## ')) {
          return (
            <p key={i} style={{ ...SECTION_HEADING, marginTop: i === 0 ? 0 : 14 }}>
              {block.slice(3)}
            </p>
          )
        }
        if (block.startsWith('- ')) {
          return <BulletList key={i} block={block} first={i === 0} />
        }
        return (
          <p key={i} style={{ ...DOCUMENT_BODY, marginTop: i === 0 ? 0 : 10 }}>
            {block}
          </p>
        )
      })}
    </>
  )
}

/** A bullet block, with at most one level of nesting (`  - `). */
function BulletList({ block, first }: { block: string; first: boolean }) {
  const items: { text: string; nested: boolean }[] = []
  for (const line of block.split('\n')) {
    const nested = line.startsWith('  - ')
    const text = line.replace(/^\s*- /, '').trim()
    if (text) items.push({ text, nested })
  }
  return (
    <ul style={{ ...BULLETS, marginTop: first ? 0 : 10 }}>
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            ...BULLET,
            marginLeft: item.nested ? 16 : 0,
            listStyleType: item.nested ? 'circle' : 'disc',
          }}
        >
          {item.text}
        </li>
      ))}
    </ul>
  )
}

/** A bordered sub-section with a left accent stroke — the two-party shape's
 *  way of showing that one signer's words are not the other's. */
function Declaration({ label, body }: { label: string; body?: string }) {
  return (
    <div style={DECLARATION}>
      <p style={DECLARATION_LABEL}>{label}</p>
      <DocumentBody body={body} />
    </div>
  )
}

/**
 * A LEGAL NAME IS THREE FIELDS, NOT ONE — 2026-10-20, asked for directly.
 *
 * ⚠ MIDDLE NAME IS OPTIONAL, and that is a correctness decision rather than a
 * kindness. Required, it blocks everyone who has no middle name from
 * finishing any document in the set — and the escape they would reach for,
 * typing "N/A", writes a false value onto a signed compliance record. Asking
 * is right; insisting is not.
 *
 * `REQUIRED_NAME_PARTS` is what the gate reads, so the two cannot drift: a
 * part added to `NAME_PARTS` is drawn but not demanded until it is named
 * here too.
 */
const NAME_PARTS = ['first', 'middle', 'last'] as const
type NamePart = (typeof NAME_PARTS)[number]

const REQUIRED_NAME_PARTS: readonly NamePart[] = ['first', 'last']

const NAME_PART_PLACEHOLDER: Record<NamePart, string> = {
  first: 'First name',
  middle: 'Middle name',
  last: 'Last name',
}

const NAME_PART_LABEL: Record<NamePart, string> = {
  first: 'First Name',
  middle: 'Middle Name (optional)',
  last: 'Last Name',
}

/** The three boxes, in order. `values`/`onChange` are keyed by part. */
function NameFields({
  values,
  onChange,
}: {
  values: Record<string, string>
  onChange: (part: NamePart, value: string) => void
}) {
  return (
    <>
      {NAME_PARTS.map((part) => (
        <Field
          key={part}
          label={NAME_PART_LABEL[part]}
          value={values[part] ?? ''}
          onChange={(v) => onChange(part, v)}
          /* The label carries "(optional)"; the placeholder is the plain
             noun, or the box reads it twice. */
          placeholder={NAME_PART_PLACEHOLDER[part]}
        />
      ))}
    </>
  )
}

/** True once every REQUIRED part is filled — the middle name is not one. */
function nameComplete(values: Record<string, string>): boolean {
  return REQUIRED_NAME_PARTS.every((part) => (values[part] ?? '').trim() !== '')
}

/** The three parts as one line, for the signature and for display. */
function joinName(values: Record<string, string>): string {
  return NAME_PARTS.map((part) => (values[part] ?? '').trim())
    .filter(Boolean)
    .join(' ')
}

/** The repo has no shared text-input primitive, so this is the local one —
 *  Checkbox and Modal are reused; there is nothing to reuse here. */
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label style={{ display: 'block' }}>
      <span style={FIELD_LABEL}>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={INPUT}
      />
    </label>
  )
}

/* ── styles ───────────────────────────────────────────────────────────── */

/**
 * THE CTA COLOUR IS THE ATLAS HOME'S BLUE, and it is set ONCE here rather
 * than threaded through every button.
 *
 * `--color-compass-page-button` (#3d5a73) is the token Atlas Home's own
 * buttons use, so this tracks that surface instead of pinning a hex that
 * would drift the first time Atlas is retinted.
 *
 * ⚠ IT RE-POINTS `--color-action` FOR THE SUBTREE, which is the whole point:
 * the shared `ui/Button`, the `Checkbox` tick, the Next arrow and the filled
 * progress segments all read that token, so they move together and the modal
 * has ONE action colour. Overriding them one at a time is how three of the
 * five end up brick and nobody notices.
 */
const SHELL: CSSProperties = {
  ['--color-action' as string]: 'var(--color-compass-page-button)',
  ['--color-action-hover' as string]:
    'color-mix(in srgb, var(--color-compass-page-button) 86%, black)',
}

const HEADER: CSSProperties = {
  background: 'var(--color-nav-shared-navy)',
  /* Tight top and bottom: the badge is 48px and sets the band's height on its
     own, so vertical padding only pushes the navy taller than its content. */
  padding: '14px 28px',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
}

/* The step's glyph, in the header beside the type and the document it names.
   ⚠ IT IS NOT THE `--color-primary-500` ON `--color-primary-100` of
   `EnrollmentConfirmationModal`'s avatar, and it cannot be: that pairing is
   built to sit on a white card, and the teal falls to roughly 2:1 against
   this navy. Both tones are white off `--color-fixed-light` instead — the
   badge belongs to the navy header rather than looking like a white-card
   component dropped onto it.
   ⚠ THE DISC IS THE FAINTER OF THE TWO (10%), the glyph the brighter (50%).
   The other way round — a near-solid white disc under a half-white glyph —
   leaves the icon almost invisible against its own badge; tried on the
   preview 2026-10-20 and reversed. */
const HEADER_AVATAR: CSSProperties = {
  width: 48,
  height: 48,
  flexShrink: 0,
  borderRadius: 'var(--radius-pill)',
  background: 'color-mix(in srgb, var(--color-fixed-light) 10%, transparent)',
  color: 'color-mix(in srgb, var(--color-fixed-light) 50%, transparent)',
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

/* ⚠ NOT A FLEX COLUMN. `display: flex` on a <ul> suppresses the markers, so
   the steps render as unbulleted lines — which is exactly what the markup
   exists to avoid. Block flow with real list-item markers, spaced by margin
   rather than by gap. */
const BULLETS: CSSProperties = {
  margin: 0,
  paddingLeft: 20,
  listStyle: 'disc',
}

const BULLET: CSSProperties = {
  display: 'list-item',
  marginBottom: 5,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
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

/* Flat, filled and unfocusable — it must not read as a box awaiting input.
   The signing hand is the same as the learner's, because it IS the same
   gesture, made by the other party. */
const COUNTERSIGNED: CSSProperties = {
  ...INPUT,
  height: 'auto',
  padding: '8px 12px',
  display: 'flex',
  flexDirection: 'column',
  background: 'var(--color-neutral-75)',
}

const COUNTERSIGNED_NAME: CSSProperties = {
  fontFamily: 'var(--font-signature)',
  fontSize: 22,
  lineHeight: '30px',
  color: 'var(--color-text-primary)',
}

const COUNTERSIGNED_ROLE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}

const SIGN_ERROR: CSSProperties = {
  margin: '6px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '17px',
  color: 'var(--color-warning-800)',
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

/* One row: the step pips on the left, the buttons on the right. The pips are
   a small fixed-width marker rather than a full-width bar — they say WHERE
   YOU ARE, which needs no width, and a bar spanning the modal reads as a
   loading indicator for the document rather than a position in a sequence. */
const FOOTER: CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  paddingTop: 8,
}

/* Right-aligned, the primary last — the order every other confirm/dismiss
   pair in this app uses, so the primary sits where people expect it. */
/* `marginLeft: auto` rather than `justifyContent: space-between` on the row:
   a one-step document draws no pips, and space-between would slide the
   buttons to the left edge exactly where there is nothing beside them. */
const ACTIONS: CSSProperties = {
  marginLeft: 'auto',
  display: 'flex',
  gap: 10,
}

const PROGRESS: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 5,
}

const SEGMENTS: CSSProperties = { display: 'flex', gap: 4 }

/* Fixed, not `flex: 1` — see `FOOTER`. Short enough that three of them sit
   inside the space the label needs anyway. */
const SEGMENT: CSSProperties = {
  width: 18,
  height: 4,
  borderRadius: 'var(--radius-pill)',
}

const STEP_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
}
