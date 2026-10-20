import { useMemo, useState, type CSSProperties } from 'react'
import { ComplianceDocumentModal } from '@/components/courses/ComplianceDocumentModal'
import {
  COMPLIANCE_DOCUMENTS,
  STEPS_BY_SHAPE,
  MOMENT_LABEL,
  acknowledgementFor,
  type ComplianceDocumentConfig,
  type DocumentShape,
} from '@/data/complianceDocuments'
import { useFeatureFlag } from '@/context/FeatureFlagContext'

/**
 * `/compliance-documents` — the preview harness for `ComplianceDocumentModal`,
 * and the ONLY place that component is rendered.
 *
 * Built the way `/atlas-header-preview` is (2026-10-13): a page of its own,
 * outside the product's pages, so a component can be reviewed without being
 * wired into anything. Nothing on Compass, Membership or the end-to-end demo
 * changes to open this — where the modal eventually gets triggered from is a
 * separate decision, and this branch does not take it.
 *
 * ⚠ IT IS A PICKER, NOT A STACK. `/review` exists for comparing one
 * component's variants side by side and is the right tool when the question is
 * "which of these two". Here there are 24 documents in six shapes and the
 * question is "does each shape render" — one at a time, chosen from a list, is
 * how you answer that.
 *
 * Behind `compliance-document-modal-preview`. The flag defaults ON on this
 * branch, which is what makes the branch build show the work;
 * `promote-to-prototype` is where it would be decided whether it ships.
 */

const SHAPE_LABEL: Record<DocumentShape, string> = {
  'notice': 'Notice',
  'signed-tc': 'Signed T&C',
  'enrollment-agreement': 'Enrollment Agreement',
  'affidavit-single': 'Affidavit — single party',
  'affidavit-two-party': 'Affidavit — two party',
  'needs-review': 'Needs review',
}

const SHAPE_ORDER: DocumentShape[] = [
  'notice',
  'signed-tc',
  'enrollment-agreement',
  'affidavit-single',
  'affidavit-two-party',
  'needs-review',
]

export function ComplianceDocumentPreviewPage() {
  const enabled = useFeatureFlag('compliance-document-modal-preview').enabled
  const [openId, setOpenId] = useState<string | null>(null)
  /* ⚠ THE HARNESS STANDS IN FOR THE COURSE. The modal has no language
     control — in the real system the course's own language picks which
     document is attached, and that logic is not built yet. This is the
     stand-in for it, so a reviewer can still see both halves of a bilingual
     notice without the signing flow growing a control it should not have. */
  const [language, setLanguage] = useState<'en' | 'es'>('en')
  const [completed, setCompleted] = useState<string | null>(null)

  const grouped = useMemo(
    () =>
      SHAPE_ORDER.map((shape) => ({
        shape,
        docs: COMPLIANCE_DOCUMENTS.filter((d) => d.shape === shape),
      })).filter((g) => g.docs.length > 0),
    [],
  )

  const open = COMPLIANCE_DOCUMENTS.find((d) => d.id === openId) ?? null

  if (!enabled) {
    return (
      <main style={PAGE}>
        <div style={SHELL}>
          <h1 style={TITLE}>Compliance Document Modal</h1>
          <p style={LEAD}>
            This preview is behind the <code style={CODE}>compliance-document-modal-preview</code>{' '}
            feature flag, which is currently off. Turn it on from the robot menu (UI/UX Demo Tools
            → Feature Flag), or add <code style={CODE}>?ff=compliance-document-modal-preview:on</code>{' '}
            to this URL.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main style={PAGE}>
      <div style={SHELL}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={EYEBROW}>Preview · not wired into any flow</p>
          <h1 style={TITLE}>Compliance Document Modal</h1>
          <p style={LEAD}>
            All {COMPLIANCE_DOCUMENTS.length} documents in the{' '}
            <code style={CODE}>_XCEL-PE Affidavits and EAs</code> set, in the six content shapes
            they fall into. One modal shell reconfigures from each row — pick one to open it.
          </p>
          {completed && (
            <p style={DONE} role="status">
              Completed “{completed}” — the modal called <code style={CODE}>onComplete</code>.
            </p>
          )}
        </header>

        {grouped.map(({ shape, docs }) => (
          <section key={shape} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={SECTION_HEAD}>
              <h2 style={SECTION_TITLE}>{SHAPE_LABEL[shape]}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={SECTION_META}>
                  {docs.length} {docs.length === 1 ? 'document' : 'documents'} ·{' '}
                  {STEPS_BY_SHAPE[shape].join(' → ')}
                </span>
                {/* Only the notices are bilingual, so the control belongs to
                    their section rather than the top of the page. */}
                {docs.some((d) => d.bilingual) && (
                  <div style={LANG_TOGGLE} role="group" aria-label="Document language">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      aria-pressed={language === 'en'}
                      style={language === 'en' ? LANG_ON : LANG_OFF}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('es')}
                      aria-pressed={language === 'es'}
                      style={language === 'es' ? LANG_ON : LANG_OFF}
                    >
                      Español
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div style={GRID}>
              {docs.map((doc) => (
                <DocumentButton key={doc.id} doc={doc} onOpen={() => setOpenId(doc.id)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {open && (
        <ComplianceDocumentModal
          /* Keyed by the document, and mounted only while one is open — the
             modal keeps its answers in local state and resets by remounting. */
          key={open.id}
          open
          config={open}
          language={language}
          onClose={() => setOpenId(null)}
          onComplete={() => {
            setCompleted(open.title)
            setOpenId(null)
          }}
        />
      )}
    </main>
  )
}

function DocumentButton({
  doc,
  onOpen,
}: {
  doc: ComplianceDocumentConfig
  onOpen: () => void
}) {
  const steps = STEPS_BY_SHAPE[doc.shape]
  return (
    <button type="button" onClick={onOpen} style={CARD}>
      <span style={CARD_TOP}>
        <span style={STATE_PILL}>{doc.state}</span>
        <span style={TIMING}>{MOMENT_LABEL[doc.moment]}</span>
      </span>
      <span style={CARD_TYPE}>{doc.complianceType}</span>
      <span style={CARD_TITLE}>{doc.title}</span>
      <span style={CARD_META}>
        {steps.length} {steps.length === 1 ? 'step' : 'steps'}
        {doc.bilingual ? ' · bilingual' : ''}
        {acknowledgementFor(doc) === 'signature' ? ' · signed' : ''}
        {acknowledgementFor(doc) === 'none' ? ' · shown only' : ''}
        {doc.shape === 'needs-review' ? ' · not completable' : ''}
      </span>
    </button>
  )
}

/* ── styles ───────────────────────────────────────────────────────────── */

const PAGE: CSSProperties = {
  minHeight: '100vh',
  background: 'var(--color-surface-page)',
  padding: '48px 24px 80px',
}

const SHELL: CSSProperties = {
  maxWidth: 880,
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 32,
}

const EYEBROW: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 500,
  fontSize: 30,
  lineHeight: '38px',
  color: 'var(--color-text-primary)',
}

const LEAD: CSSProperties = {
  margin: 0,
  maxWidth: 640,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-secondary)',
}

const DONE: CSSProperties = {
  margin: 0,
  padding: '8px 12px',
  alignSelf: 'flex-start',
  borderRadius: 'var(--radius-md)',
  background: 'color-mix(in srgb, var(--color-primary-100) 50%, transparent)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-primary-500)',
}

const CODE: CSSProperties = {
  fontFamily: 'var(--font-stamp)',
  fontSize: 12,
  color: 'var(--color-text-primary)',
}

const SECTION_HEAD: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
  paddingBottom: 8,
  borderBottom: '1px solid var(--color-border-subtle)',
}

const SECTION_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 15,
  color: 'var(--color-text-primary)',
}

const SECTION_META: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}

/* Lifted out of the modal — see the note on `language` above. */
const LANG_TOGGLE: CSSProperties = {
  display: 'inline-flex',
  padding: 3,
  gap: 3,
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
}

const LANG_OFF: CSSProperties = {
  padding: '4px 12px',
  border: 'none',
  borderRadius: 'var(--radius-pill)',
  background: 'transparent',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
}

const LANG_ON: CSSProperties = {
  ...LANG_OFF,
  background: 'var(--color-surface-card)',
  color: 'var(--color-text-primary)',
}

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
  gap: 12,
}

const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 8,
  padding: '14px 16px',
  textAlign: 'left',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  cursor: 'pointer',
}

const CARD_TOP: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
}

const STATE_PILL: CSSProperties = {
  padding: '2px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 11,
  color: 'var(--color-text-secondary)',
}

const TIMING: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}

/* The document's KIND, which the modal now leads with — on the card too, so
   the mapping can be checked at a glance without opening all 24. */
const CARD_TYPE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-500)',
}

const CARD_TITLE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}

const CARD_META: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  color: 'var(--color-text-tertiary)',
}
