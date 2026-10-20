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

/* ── per-step glyph ──────────────────────────────────────────────────────
   The icon in the header badge. There is no step EYEBROW any more — see the
   header below for why — so this carries nothing but the glyph. */
const STEP_ICON: Record<string, ReactNode> = {
  name: <User size={24} aria-hidden />,
  license: <IdCard size={24} aria-hidden />,
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
  'full-name': 'Full legal name',
  'address': 'Street address, city, state, zip',
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
  const [agreed, setAgreed] = useState(false)
  const [wetSignatureName, setWetSignatureName] = useState('')
  const [extras, setExtras] = useState<Record<string, string>>({})
  const [relationship, setRelationship] = useState('')
  const [proctorValues, setProctorValues] = useState<Record<string, string>>({})
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
        return (
          relationship !== '' &&
          (config.proctorFields ?? []).every((f) => (proctorValues[f] ?? '').trim() !== '') &&
          proctorAttested
        )
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
    config.proctorFields,
    proctorValues,
    proctorAttested,
  ])

  /* The warning triangle for the one document with no content, a pen for the
     one that is signed rather than ticked, and the step's own glyph for
     everything else. */
  const avatarIcon = needsReview ? (
    <TriangleExclamation size={24} aria-hidden />
  ) : step === 'document' && config.wetSignature ? (
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
              studentName={studentName}
              onStudentName={setStudentName}
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
              fields={proctorValues}
              onField={(key, value) => setProctorValues((v) => ({ ...v, [key]: value }))}
              attested={proctorAttested}
              onAttested={setProctorAttested}
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
  studentName,
  onStudentName,
  agreed,
  onAgreed,
  wetSignatureName,
  onWetSignatureName,
}: {
  config: ComplianceDocumentConfig
  language: 'en' | 'es'
  studentName: string
  onStudentName: (v: string) => void
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
            itself — "Student Full Name" on its own signature line. */}
        <Field
          label="Student Name"
          value={studentName}
          onChange={onStudentName}
          placeholder="Your full name"
        />
        {/* ⚠ THE SIGNATURE IS THE NAME, SIGNED — not a second thing to type.
            It mirrors Student Name in the signing hand and appears only once
            there is a name to show, so it reads as the consequence of typing
            rather than as another empty box. Typing two different strings
            into "name" and "signature" is a contradiction a compliance
            document should not be able to record. */}
        {studentName.trim() !== '' && <SignatureLine value={studentName.trim()} />}
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
        <DocumentBody body={config.body} />
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
  fields,
  onField,
  attested,
  onAttested,
}: {
  config: ComplianceDocumentConfig
  relationship: string
  onRelationship: (v: string) => void
  fields: Record<string, string>
  onField: (key: string, value: string) => void
  attested: boolean
  onAttested: (v: boolean) => void
}) {
  return (
    <div style={STACK}>
      <Declaration label="Proctor Declaration" body={config.proctorBody} />
      {/* ⚠ THE PROCTOR'S OWN DETAILS, not the student's. Wisconsin wants a
          name, address and phone from the monitor while asking the student
          for nothing extra — so these come from `proctorFields`, never from
          `extraFields`. */}
      {(config.proctorFields ?? []).map((f) => (
        <Field
          key={f}
          label={EXTRA_FIELD_LABEL[f]}
          value={fields[f] ?? ''}
          onChange={(v) => onField(f, v)}
          placeholder={EXTRA_FIELD_PLACEHOLDER[f]}
        />
      ))}
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

/** The typed name rendered back as a signature: the same box as the field
 *  above it, in the signing hand, and not editable — editing it would let the
 *  name and the signature disagree. */
function SignatureLine({ value }: { value: string }) {
  return (
    <div>
      <span style={FIELD_LABEL}>Signature</span>
      <div style={SIGNATURE_LINE} aria-label={`Signature: ${value}`}>
        {value}
      </div>
    </div>
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
  /** Draws the value in the signing hand, so a typed signature reads as one. */
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
            ? { fontFamily: 'var(--font-signature)', fontSize: 22 }
            : null),
        }}
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

/* The same box as `INPUT`, in the signing hand — it is the field above it,
   signed, so it must not read as a different kind of control. */
const SIGNATURE_LINE: CSSProperties = {
  ...INPUT,
  display: 'flex',
  alignItems: 'center',
  /* The signing hand, and larger than the field above it — script faces carry
     a smaller x-height at the same size, so 18px here read smaller than the
     14px name it mirrors. */
  fontFamily: 'var(--font-signature)',
  fontSize: 24,
  background: 'var(--color-neutral-75)',
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
