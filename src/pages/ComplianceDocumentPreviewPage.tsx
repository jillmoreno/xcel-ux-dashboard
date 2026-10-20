import { useMemo, useState, type CSSProperties } from 'react'
import { ComplianceDocumentModal } from '@/components/courses/ComplianceDocumentModal'
import { PillTabs } from '@/components/ui/PillTabs'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import {
  COMPLIANCE_DOCUMENTS,
  REGULATED_JURISDICTIONS,
  STEPS_BY_SHAPE,
  MOMENT_LABEL,
  acknowledgementFor,
  stepsFor,
  type ComplianceDocumentConfig,
  type CoverageStatus,
  type DocumentMoment,
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
 * ⚠ IT CARRIES ITS OWN TOOLBAR, and that is why the route left `AppLayout`
 * on 2026-10-20. Inside the shell it inherited the prototype chrome — the
 * demo bar and the DESIGN bar, whose controls are Atlas's fonts, pacing and
 * readiness axes. None of them say anything about a compliance document, and
 * the ones that would (which state, which shape, which language) could not go
 * there: the design bar is shared chrome a designer must not edit. So the
 * page grew the controls it actually needs and left the ones it never did.
 *
 * Behind `compliance-document-modal-preview`. The flag defaults ON on this
 * branch, which is what makes the branch build show the work;
 * `promote-to-prototype` is where it would be decided whether it ships.
 */

/** How the board is grouped. The filters are independent of this. */
type GroupBy = 'shape' | 'state' | 'moment'

const GROUP_TABS: { id: GroupBy; label: string }[] = [
  { id: 'shape', label: 'By shape' },
  { id: 'state', label: 'By state' },
  { id: 'moment', label: 'By moment' },
]

const MOMENT_ORDER: DocumentMoment[] = [
  'checkout',
  'before-course',
  'before-first-lesson',
  'before-exam',
  'during-exam',
  'after-exam',
  'at-completion',
]

/** Full names, so a filter does not read as a column of postcodes. */
const STATE_NAME: Record<string, string> = {
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  FL: 'Florida',
  GA: 'Georgia',
  IL: 'Illinois',
  IN: 'Indiana',
  KY: 'Kentucky',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  NV: 'Nevada',
  NJ: 'New Jersey',
  NY: 'New York',
  OH: 'Ohio',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  WI: 'Wisconsin',
  WV: 'West Virginia',
  Generic: 'Generic (non-state)',
}

const stateName = (code: string) => STATE_NAME[code] ?? code

const COVERAGE = new Map(REGULATED_JURISDICTIONS.map((j) => [j.state, j]))

/** What a state with no document on the board is told to say. */
const COVERAGE_LABEL: Record<CoverageStatus, string> = {
  'documented': 'Documented',
  'needed': 'Needed',
  'none-required': 'No document required',
}

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
  const [groupBy, setGroupBy] = useState<GroupBy>('shape')
  const [stateFilter, setStateFilter] = useState('all')
  const [query, setQuery] = useState('')

  /** Every state in the set, in filter order: states alphabetically, Generic
   *  last because it is not one. */
  /** ⚠ EVERY REGULATED JURISDICTION, not every state we happen to hold a file
   *  for. A board built from the documents can only ever show what exists,
   *  which is the one thing a coverage question is not asking. */
  const states = useMemo(() => {
    const seen = new Set([
      ...REGULATED_JURISDICTIONS.map((j) => j.state),
      ...COMPLIANCE_DOCUMENTS.map((d) => d.state),
    ])
    return [...seen].sort((a, b) => {
      if (a === 'Generic') return 1
      if (b === 'Generic') return -1
      return stateName(a).localeCompare(stateName(b))
    })
  }, [])

  /* The search reads everything a reviewer might half-remember — the title,
     the subject, the state's full name, the kind, and the FILE NAME, which is
     often the only thing someone has in front of them. */
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    return COMPLIANCE_DOCUMENTS.filter((d) => {
      if (stateFilter !== 'all' && d.state !== stateFilter) return false
      if (!q) return true
      return [d.title, d.subject, stateName(d.state), d.complianceType, d.sourceFile]
        .join(' ')
        .toLowerCase()
        .includes(q)
    })
  }, [query, stateFilter])

  /** One grouping function, three axes — the board's shape is a view, not a
   *  second copy of the data. */
  const grouped = useMemo(() => {
    const by = (key: string, label: string) => ({ key, label, docs: [] as ComplianceDocumentConfig[] })
    const groups: ReturnType<typeof by>[] = []
    const order =
      groupBy === 'shape'
        ? SHAPE_ORDER.map((sh) => by(sh, SHAPE_LABEL[sh]))
        : groupBy === 'moment'
          ? MOMENT_ORDER.map((m) => by(m, MOMENT_LABEL[m]))
          : states.map((st) => by(st, stateName(st)))
    for (const g of order) groups.push(g)
    const index = new Map(groups.map((g) => [g.key, g]))
    for (const d of matches) {
      const key = groupBy === 'shape' ? d.shape : groupBy === 'moment' ? d.moment : d.state
      index.get(key)?.docs.push(d)
    }
    /* ⚠ EMPTY GROUPS SURVIVE WHEN GROUPED BY STATE, and only then. A state
       with nothing on it is the answer to "what is missing" — dropping it
       makes the board show coverage it does not have. But under a SEARCH the
       same rule turns nineteen empty headings into noise around the one hit,
       so a query collapses it back. A state filter does not: narrowing to
       Mississippi and seeing its gap is the point. */
    const keepEmpty = groupBy === 'state' && query.trim() === ''
    return groups.filter(
      (g) =>
        g.docs.length > 0 ||
        (keepEmpty &&
          COVERAGE.has(g.key) &&
          /* ⚠ THE STATE FILTER NARROWS THE EMPTY ONES TOO. Without this,
             picking Colorado kept eighteen other states on the board purely
             because they have no documents — the filter would have widened
             the page instead of narrowing it. */
          (stateFilter === 'all' || g.key === stateFilter)),
    )
  }, [groupBy, matches, states, query, stateFilter])

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

        {/* ── the compliance toolbar ─────────────────────────────────────
            ⚠ NOT THE DESIGN BAR. The controls that matter here are which
            state, which shape and which language — none of which could live
            on shared chrome a designer must not edit. Grouping and filtering
            are independent on purpose: "every Florida document" and "grouped
            by moment" are different questions and a reviewer asks both. */}
        <div style={TOOLBAR}>
          <PillTabs
            items={GROUP_TABS}
            active={groupBy}
            onChange={setGroupBy}
            label="Group the documents by"
            size="compact"
          />
          {/* The total beside the strip, never per-pill counts — the house
              rule for every segmented filter in this app. */}
          <span style={TOOLBAR_COUNT}>
            {matches.length} of {COMPLIANCE_DOCUMENTS.length}
          </span>
          <div style={TOOLBAR_RIGHT}>
            <SearchInput
              label="Search documents"
              placeholder="Search title, state or file name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: 260 }}
            />
            <Select
              label="Filter by state"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All states' },
                ...states.map((st) => ({ value: st, label: stateName(st) })),
              ]}
              style={{ minWidth: 190 }}
            />
            {/* ⚠ THE LANGUAGE IS THE COURSE'S, NOT THE LEARNER'S — see the
                note on `language` above. It sits here now rather than over
                the Notice section, because two shapes are bilingual and a
                control attached to one of them was lying about its scope. */}
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
          </div>
        </div>

        {grouped.length === 0 && (
          <p style={EMPTY} role="status">
            Nothing matches {query.trim() ? `“${query.trim()}”` : 'that filter'}
            {stateFilter !== 'all' ? ` in ${stateName(stateFilter)}` : ''}.
          </p>
        )}

        {grouped.map((group) => (
          <section key={group.key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={SECTION_HEAD}>
              <h2 style={SECTION_TITLE}>{group.label}</h2>
              <span style={SECTION_META}>
                {group.docs.length > 0 ? (
                  <>
                    {group.docs.length} {group.docs.length === 1 ? 'document' : 'documents'}
                    {groupBy === 'shape' && group.key in STEPS_BY_SHAPE
                      ? ` · ${STEPS_BY_SHAPE[group.key as DocumentShape].join(' → ')}`
                      : ''}
                  </>
                ) : (
                  COVERAGE_LABEL[COVERAGE.get(group.key)?.status ?? 'needed']
                )}
              </span>
            </div>
            <div style={GRID}>
              {group.docs.map((doc) => (
                <DocumentButton
                  key={doc.id}
                  doc={doc}
                  showState={groupBy !== 'state'}
                  onOpen={() => setOpenId(doc.id)}
                />
              ))}
              {/* ⚠ A PARTIAL GAP IS STILL A GAP. Minnesota, Mississippi and New
                  York all hold documents AND are missing one the state
                  requires — rendering the note only on an EMPTY state hid
                  exactly the three hardest cases behind the files that do
                  exist. It sits beside them instead. */}
              {groupBy === 'state' &&
                (group.docs.length === 0 || COVERAGE.get(group.key)?.status === 'needed') && (
                  <CoverageGap state={group.key} />
                )}
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

/**
 * THE BLANK SPACE, AND WHAT IT SAYS.
 *
 * ⚠ "NEEDED" AND "NONE REQUIRED" ARE NOT THE SAME BLANK. Four states ask the
 * learner for nothing — Arkansas, Indiana, Michigan and New Jersey — and
 * printing "needed" on those would invent four documents and bury the four
 * that really are missing. The status comes from the state's own profile, and
 * the note says which it is and why, because a gap with no reason attached is
 * one somebody closes by guessing.
 */
function CoverageGap({ state }: { state: string }) {
  const coverage = COVERAGE.get(state)
  if (!coverage) return null
  const needed = coverage.status === 'needed'
  return (
    <div style={needed ? GAP_NEEDED : GAP_NONE} role="note">
      <span style={needed ? GAP_TAG_NEEDED : GAP_TAG_NONE}>{COVERAGE_LABEL[coverage.status]}</span>
      <span style={GAP_NOTE}>{coverage.note}</span>
    </div>
  )
}

function DocumentButton({
  doc,
  onOpen,
  showState,
}: {
  doc: ComplianceDocumentConfig
  onOpen: () => void
  /** False when the board is already grouped by state — the pill would then
   *  repeat its own section heading on every card in it. */
  showState: boolean
}) {
  const steps = stepsFor(doc)
  return (
    <button type="button" onClick={onOpen} style={CARD}>
      <span style={CARD_TOP}>
        {showState && <span style={STATE_PILL}>{doc.state}</span>}
        <span style={TIMING}>{MOMENT_LABEL[doc.moment]}</span>
      </span>
      <span style={CARD_TYPE}>{doc.complianceType}</span>
      <span style={CARD_TITLE}>{doc.title}</span>
      <span style={CARD_META}>
        {steps.length} {steps.length === 1 ? 'step' : 'steps'}
        {doc.bilingual ? ' · bilingual' : ''}
        {acknowledgementFor(doc) === 'signature' ? ' · signed' : ''}
        {acknowledgementFor(doc) === 'none' ? ' · shown only' : ''}
        {doc.proctorFirst ? ' · proctor first' : ''}
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

/* Sticky, because the board is long enough that a filter you cannot see is a
   filter you forget you set. */
const TOOLBAR: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 2,
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  flexWrap: 'wrap',
  padding: '12px 0',
  background: 'var(--color-surface-page)',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const TOOLBAR_COUNT: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-tertiary)',
  whiteSpace: 'nowrap',
}

const TOOLBAR_RIGHT: CSSProperties = {
  marginLeft: 'auto',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  flexWrap: 'wrap',
}

const EMPTY: CSSProperties = {
  margin: 0,
  padding: '28px 0',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
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

/* Dashed, because the shape of a card with nothing in it should read as a
   space left open rather than as a card that failed to load. */
const GAP_BASE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '14px 16px',
  borderRadius: 'var(--radius-lg)',
  borderWidth: 1,
  borderStyle: 'dashed',
}

const GAP_NEEDED: CSSProperties = {
  ...GAP_BASE,
  borderColor: 'var(--color-warning-300)',
  background: 'var(--color-warning-100)',
}

const GAP_NONE: CSSProperties = {
  ...GAP_BASE,
  borderColor: 'var(--color-border-subtle)',
  background: 'transparent',
}

const GAP_TAG: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 10,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
}

const GAP_TAG_NEEDED: CSSProperties = { ...GAP_TAG, color: 'var(--color-warning-800)' }
const GAP_TAG_NONE: CSSProperties = { ...GAP_TAG, color: 'var(--color-text-tertiary)' }

const GAP_NOTE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  lineHeight: '17px',
  color: 'var(--color-text-secondary)',
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
