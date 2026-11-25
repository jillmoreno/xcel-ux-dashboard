import { useMemo, useState, type CSSProperties } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown, FileCertificateRegular } from '@/icons'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAccount } from '@/context/AccountContext'
import { useAtlasAccountPages } from './useAtlasAccountPages'
import { ATLAS_FIRST_CELL, ATLAS_NAME_CELL, ATLAS_TABLE_CARD, ATLAS_TD, ATLAS_TH, ATLAS_THEAD } from './atlasAccountTableStyles'
import {
  certificateStatus,
  certificateValidUntilFor,
  formatTranscriptDate,
  prelicensingTranscriptsFor,
  showingLabel,
  type TranscriptRecord,
} from '@/data/transcriptFixtures'

/**
 * CERTIFICATES & TRANSCRIPTS, TO THE PRD — 2026-11-25, Jillienne. A COPY of
 * `TranscriptsPanel` as Eric left it on 2026-11-19, taken to the Certificates
 * and Transcripts PRD (Chi Wang, Atlas Platform Space, §3a the table, §3b the
 * certificate and its statuses). The original is never edited; the flag
 * `transcripts-certificate-statuses` chooses between the two at both call
 * sites in `PlatformShell` — `?section=certificates` (the nav row) and
 * `?section=transcripts` (the profile dropdown) — so nobody collides with his
 * layout.
 *
 * Six changes, each against the PRD:
 *
 *   1. NO SEARCH, NO FILTERS, NO DOWNLOAD TRANSCRIPT — all three are "Later or
 *      elsewhere" in the PRD for 12 January. The count stays: with the filters
 *      gone it is the only thing that says how much history there is. The print
 *      route and its sheet stand; this page just stops linking to them
 *      (Archive row `transcripts-search-filters-export`).
 *   2. THE PROGRAM OPENS THE COURSE (§3a field 1) — a link to `/courses/{id}`,
 *      the nearest route this prototype has to "Learner Home"; a row with no
 *      course is text. The mismatch is an open question on the handoff.
 *   3. ONE EMPTY STATE, before the first completion, linking to My Courses —
 *      the "no results" case left with the search and the filters.
 *   4. FIVE CERTIFICATE STATUSES in the Certificate cell (§3b's three plus
 *      Address required and Voided), derived by `certificateStatus`. Valid
 *      until stays INSIDE the cell as Eric drew it on 2026-11-19 — a deliberate
 *      divergence from §3a field 8's separate column, flagged on the handoff.
 *   5. REAL EXPIRY from the states' rules (`stateCertificateRules.ts`) in place
 *      of the invented five months and the three no-expiry ids.
 *   6. CHI'S SUB-HEADING at the top; the "not official" disclaimer gone, not
 *      reworded — it told a learner this page was no substitute for a signed
 *      certificate, on a page that now hands her the certificate (Archive row
 *      `transcripts-not-official-disclaimer`, with the copy).
 *
 * The rows are the PRD's pre-licensing history (`prelicensingTranscriptsFor`),
 * a sibling of the CE list the original and the print route still read.
 */
export function TranscriptsPanelV2() {
  const { brand } = useAccount()
  const [params] = useSearchParams()
  const rows0 = useMemo(() => prelicensingTranscriptsFor(brand), [brand])
  const [sort, setSort] = useState<SortState>({ key: 'completedDate', dir: 'desc' })
  /* In the learning pages' layout (2026-11-03, Eric's request): the table framed by the cards' 1px rule all round, its
     column titles sitting on the header's bottom line, and that line 1px rather than 2. */
  const atlasFrame = useAtlasAccountPages()
  const cell = atlasFrame ? ATLAS_TD : BODY_CELL

  const rows = useMemo(() => {
    if (!sort.key) return rows0
    const dir = sort.dir === 'asc' ? 1 : -1
    const key = sort.key
    return [...rows0].sort((a, b) => {
      if (key === 'hours') return (hoursOf(a) - hoursOf(b)) * dir
      if (key === 'score') return (scoreOf(a) - scoreOf(b)) * dir
      if (key === 'licenseLine') return lineOf(a).localeCompare(lineOf(b)) * dir
      return String(a[key]).localeCompare(String(b[key])) * dir
    })
  }, [rows0, sort])

  const toggleSort = (key: SortKey) =>
    setSort((prev) => (prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }))
  const ariaSort = (key: SortKey): 'ascending' | 'descending' | 'none' =>
    sort.key !== key ? 'none' : sort.dir === 'asc' ? 'ascending' : 'descending'

  /* MY COURSES, INSIDE THE SHELL. The PRD's empty state links to My Courses; the product route is `/my-learning/courses`,
     and `AppLayout` blocks `/my-learning/*` from inside the rebrand with a toast — the dead end the My Courses card's
     View Certificate hit on 2026-11-23. So the link is the shell's own page, the rest of the query kept. */
  const myCoursesTo = useMemo(() => {
    const next = new URLSearchParams(params)
    next.set('section', 'courses')
    next.delete('coursePage')
    return `?${next.toString()}`
  }, [params])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* THE SUB-HEADING (Chi, 2026-11-25, verbatim) under the shell's H1. The disclaimer that led the 2026-11-19 page is
          gone, not reworded — see the file note. */}
      <p style={SUBHEADING} data-testid="transcripts-subheading">
        See how you did in every program you’ve completed, and download the certificates you need for your state exam or
        license.
      </p>

      {rows.length === 0 ? (
        /* ONE EMPTINESS (PRD §3a): before the first completion, the page says what will appear here and links to My
           Courses. "No results" went with the search and the filters. Copy is a DRAFT, handed back on the handoff. */
        <EmptyState
          title="Your certificates and transcript appear here"
          description="Finish a program and we’ll add it to this page, with the certificate you need for your state exam."
          actionLabel="Go to My Courses"
          actionTo={myCoursesTo}
        />
      ) : (
        /* THE COUNT AND THE TABLE AS ONE BLOCK, as wide as the table (2026-11-19). */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 'fit-content', maxWidth: '100%' }}>
          <span style={countStyle}>{showingLabel(rows.length)}</span>
          {/* AS WIDE AS ITS COLUMNS (2026-11-19, Eric) — the card hugs the table, the table hugs its columns; never wider than
              the page. */}
          <div style={{ ...(atlasFrame ? ATLAS_TABLE_CARD : tableWrapStyle), width: 'fit-content', maxWidth: '100%' }}>
            <table className={atlasFrame ? 'cre-atlas-table' : undefined} style={{ width: 'auto', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
              <caption className="cre-visually-hidden">Completed programs and their certificates</caption>
              <thead style={atlasFrame ? ATLAS_THEAD : undefined}>
                <tr>
                  {COLUMNS.map((col, i) => {
                    const active = sort.key === col.key
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={ariaSort(col.key)}
                        style={
                          atlasFrame
                            ? { ...ATLAS_TH, verticalAlign: 'bottom', ...(i === 0 && ATLAS_FIRST_CELL), ...col.cellStyle, ...fit(i) }
                            : { ...HEADER_CELL, ...(i === 0 && { paddingLeft: 24 }), ...col.cellStyle, ...fit(i) }
                        }
                      >
                        <button type="button" onClick={() => toggleSort(col.key)} style={headerButtonStyle}>
                          {col.label}
                          <ChevronDown
                            size={12}
                            aria-hidden
                            style={{
                              flexShrink: 0,
                              opacity: active ? 1 : 0.35,
                              transform: active && sort.dir === 'desc' ? 'rotate(180deg)' : 'none',
                              transition: 'transform 120ms ease',
                            }}
                          />
                        </button>
                      </th>
                    )
                  })}
                  {/* CERTIFICATE — the status, and the valid-until inside it (2026-11-19's cell). Not sortable. */}
                  <th scope="col" style={atlasFrame ? { ...ATLAS_TH, verticalAlign: 'bottom', ...fit(COLUMNS.length) } : { ...HEADER_CELL, ...fit(COLUMNS.length) }}>
                    Certificate
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} data-certificate-status={certificateStatus(row)}>
                    {/* THE PROGRAM OPENS THE COURSE (PRD §3a field 1). `/courses/:id` is the nearest route to "Learner
                        Home" this prototype has — see the handoff. A row with no course in the library is text, not a
                        dead link. */}
                    <th scope="row" style={atlasFrame ? { ...ATLAS_TD, ...ATLAS_FIRST_CELL, ...ATLAS_NAME_CELL, ...fit(0) } : { ...BODY_CELL, ...TITLE_CELL, ...fit(0) }}>
                      {row.courseId ? (
                        <Link to={`/courses/${row.courseId}`} style={PROGRAM_LINK} data-testid="transcript-program-link">
                          {row.title}
                        </Link>
                      ) : (
                        row.title
                      )}
                    </th>
                    <td style={{ ...cell, ...fit(1) }}>{lineOf(row)}</td>
                    <td style={{ ...cell, ...fit(2) }}>{row.state}</td>
                    {/* Centred under the word "Hours" (2026-11-19, Eric) — see HOURS_UNDER_LABEL. Zero is printed. */}
                    <td style={{ ...cell, ...NUMERIC_CELL, ...fit(3) }}>
                      <span style={HOURS_UNDER_LABEL}>{hoursOf(row)}</span>
                    </td>
                    <td style={{ ...cell, ...fit(4) }}>{formatTranscriptDate(row.completedDate)}</td>
                    <td style={{ ...cell, ...NUMERIC_CELL, ...fit(5) }}>
                      <span style={SCORE_UNDER_LABEL}>{scoreOf(row)}%</span>
                    </td>
                    <td style={{ ...cell, ...fit(COLUMNS.length) }}>
                      <CertificateCell row={row} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * THE CERTIFICATE CELL, BY STATUS (PRD §3b). The icon is the download — the certificate PDF itself — where there is one
 * to download: Ready, and Expired too (she can still keep it for her records). ⚠ NOT WIRED: there is no certificate
 * document in this repo (`certificatePdfUrl`'s own TODO(data)); the button is labelled so it reads as the action it will
 * be. Valid until sits inside the cell, after the icon, as Eric drew it (2026-11-19) — not §3a's separate column.
 */
function CertificateCell({ row }: { row: TranscriptRecord }) {
  const status = certificateStatus(row)
  const until = certificateValidUntilFor(row)
  const download = (
    <button
      type="button"
      aria-label={`Download certificate — ${row.title}`}
      title="Download certificate"
      style={{ ...RECORD_BUTTON, marginRight: 8, position: 'relative', top: -2.5 }}
    >
      <FileCertificateRegular size={16} aria-hidden />
    </button>
  )
  switch (status) {
    case 'ready':
      return (
        <>
          {download}
          <span>{until ? <>Valid till <strong style={SEMI}>{formatTranscriptDate(until)}</strong></> : 'No expiry'}</span>
        </>
      )
    case 'expired':
      return (
        <>
          {download}
          <span>
            <strong style={SEMI}>Expired {until ? formatTranscriptDate(until) : ''}</strong>
            <span style={SECONDARY}> · Retake the course to sit the exam</span>
          </span>
        </>
      )
    case 'not-required':
      /* An unregulated state: no certificate, no valid-until. The row is her record. */
      return (
        <span>
          <strong style={SEMI}>Not required</strong>
          <span style={SECONDARY}> · {row.state} doesn’t require one — this row is your record</span>
        </span>
      )
    case 'address-required':
      /* ⚠ THE ADDRESS STEP HAS NO ROUTE of its own in this prototype — it is collected in the affidavit flow after the
         exam (Afsana's; `affidavitForms.ts`), which Home opens as a modal on `?affidavit=1`. Drawn as a button that
         opens nothing until that route exists; an open question on the handoff. */
      return (
        <span>
          <button type="button" style={TEXT_ACTION} data-testid="transcript-add-address">
            Add your home address
          </button>
          <span style={SECONDARY}> to release the certificate</span>
        </span>
      )
    case 'voided':
      /* DRAFT COPY — the PRD does not define what voids a certificate (§3c's proctor case removes the row entirely, so it
         is not that). The treatment only; the trigger and the wording are an open question on the handoff, Jill's. */
      return (
        <span style={SECONDARY}>
          <strong style={{ ...SEMI, color: 'var(--color-text-primary)' }}>Voided</strong>
        </span>
      )
  }
}

/** The licence line (PRD §3a field 3), falling back to the profession the CE rows carry. */
function lineOf(row: TranscriptRecord): string {
  return row.licenseLine ?? row.profession
}
/** The state-approved hours for the line, else the course's own. */
function hoursOf(row: TranscriptRecord): number {
  return row.approvedHours ?? row.hours
}
/* SCORE: the row's own when it carries one (the PRD rows do — invented, listed on the handoff); else the 2026-11-19
   page's fixed-per-id hash, so a CE row would read the same here as there. */
function scoreOf(row: TranscriptRecord): number {
  if (row.score != null) return row.score
  let h = 2166136261
  for (const ch of row.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return 80 + ((h >>> 0) % 21)
}

type SortKey = keyof Pick<TranscriptRecord, 'title' | 'state' | 'completedDate'> | 'licenseLine' | 'hours' | 'score'
type SortState = { key: SortKey | null; dir: 'asc' | 'desc' }

/* The 2026-11-19 columns: Program · License Line · State · Hours · Completed · Final Score, then Certificate. */
const COLUMNS: { key: SortKey; label: string; cellStyle?: CSSProperties }[] = [
  { key: 'title', label: 'Program' },
  { key: 'licenseLine', label: 'License Line' },
  { key: 'state', label: 'State' },
  { key: 'hours', label: 'Hours', cellStyle: { textAlign: 'right' } },
  { key: 'completedDate', label: 'Completed' },
  { key: 'score', label: 'Final Score', cellStyle: { textAlign: 'right' } },
]

/* 40 BETWEEN COLUMNS (2026-11-19, Eric) — every column sizes to its widest content and keeps 40 after it. Program wraps at
   COURSE_NAME_W. The last column ends the table with the first cell's 20.
   ⚠ THE CERTIFICATE CELL WRAPS (2026-11-25): its statuses carry a sentence ("Not required · Texas doesn’t require one —
   this row is your record"), and set nowrap like the other narrow columns it took the page's width from Program, which
   folded to one word a line. Capped at CERT_CELL_W and allowed to wrap, it gives way instead. */
const COLUMN_GAP = 40
const COURSE_NAME_W = 260
const CERT_CELL_W = 300
const LAST_CELL_PAD = 20
function fit(i: number): CSSProperties {
  if (i === 0) return { width: COURSE_NAME_W, minWidth: COURSE_NAME_W, paddingRight: COLUMN_GAP }
  const last = i === COLUMNS.length
  if (last) return { maxWidth: CERT_CELL_W, paddingLeft: 0, paddingRight: LAST_CELL_PAD }
  return { width: '1px', whiteSpace: 'nowrap', paddingLeft: 0, paddingRight: COLUMN_GAP }
}
/** The Hours value under the middle of its label, and Final Score's under its own (2026-11-19). */
const HOURS_UNDER_LABEL: CSSProperties = { display: 'inline-block', width: 33, marginRight: 12 + 6, textAlign: 'center' }
const SCORE_UNDER_LABEL: CSSProperties = { ...HOURS_UNDER_LABEL, width: 59.5 }

/* Chi's sub-heading: the body face at 16/28 — the disclaimer's measure, so the top of the page keeps its weight. */
const SUBHEADING: CSSProperties = {
  margin: 0,
  maxWidth: 963,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}
const countStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-secondary)',
}
/* The program as a link: the name's own SemiBold, in the page-button blue so it reads as something to press, no underline
   — the row keeps the 2026-11-19 row's shape. */
const PROGRAM_LINK: CSSProperties = { color: 'var(--color-primary-500)', textDecoration: 'none', fontWeight: 600 }
const RECORD_BUTTON: CSSProperties = {
  display: 'inline-flex',
  verticalAlign: 'middle',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--color-primary-500)',
}
const TEXT_ACTION: CSSProperties = {
  ...RECORD_BUTTON,
  display: 'inline',
  font: 'inherit',
  fontWeight: 600,
  verticalAlign: 'baseline',
}
const SEMI: CSSProperties = { fontWeight: 600 }
const SECONDARY: CSSProperties = { color: 'var(--color-text-secondary)' }

const tableWrapStyle: CSSProperties = {
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  overflow: 'hidden',
  background: 'var(--color-surface-card)',
}
/* HEADER_CELL / BODY_CELL / headerButtonStyle are `GiftRecipientsTable`'s by value, as the original's are. */
const HEADER_CELL: CSSProperties = {
  verticalAlign: 'top',
  paddingTop: 16,
  paddingRight: 16,
  paddingBottom: 12,
  paddingLeft: 16,
  background: 'var(--color-surface-card)',
  borderBottom: '2px solid var(--color-neutral-500)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '16px',
  textAlign: 'left',
}
const BODY_CELL: CSSProperties = {
  paddingTop: 12,
  paddingRight: 16,
  paddingBottom: 12,
  paddingLeft: 16,
  borderBottom: '1px solid var(--color-neutral-light)',
  color: 'var(--color-neutral-dark)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 400,
  lineHeight: '18px',
  verticalAlign: 'middle',
  textAlign: 'left',
}
const TITLE_CELL: CSSProperties = { paddingLeft: 24, fontWeight: 600, color: 'var(--color-text-primary)' }
const NUMERIC_CELL: CSSProperties = { textAlign: 'right', fontVariantNumeric: 'tabular-nums' }
const headerButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  textTransform: 'inherit',
  letterSpacing: 'inherit',
  cursor: 'pointer',
}
