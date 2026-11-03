import { useMemo, useState, type CSSProperties } from 'react'
import { ChevronDown, Download, FileText } from '@/icons'
import { ExportTranscriptSheet } from './ExportTranscriptSheet'
import { EmptyState } from '@/components/ui/EmptyState'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { SearchInput } from '@/components/ui/SearchInput'
import { useAccount } from '@/context/AccountContext'
import { useAtlasAccountPages } from './useAtlasAccountPages'
import {
  filterTranscripts,
  formatTranscriptDate,
  searchTranscripts,
  showingLabel,
  transcriptGroups,
  transcriptsFor,
  transcriptYear,
  type TranscriptFilter,
  type TranscriptRecord,
} from '@/data/transcriptFixtures'

/**
 * TRANSCRIPTS — the account section's course history, 2026-11-02.
 *
 * Implements Figma `I3NdgJJrSQ5A5oBRC3fStO` node `2009:28153`. (That frame is
 * named "Licenses_All" in the file and sits in a section of licence screens;
 * it is the Transcripts page, and the disclaimer below is its copy verbatim,
 * curly quotes and all.) Cross-checked against the live page at
 * `/account/transcripts`.
 *
 * It replaces `AccountSectionPlaceholder`, which said "Transcripts — not built
 * yet" and was the honest answer until today.
 *
 * ── What it is, against the two pages it sits beside ──────────────────────
 *
 * Certificates is PROOF: one card per issued document, with a reporting
 * status. My Courses is WHAT IS LEFT TO DO. This is the HISTORY — every
 * completion, including the ones that earned no certificate and never will
 * (the zero-hour platform how-tos the design's own data shows). The disclaimer
 * says so out loud, which is why it leads the page rather than sitting in a
 * footnote: these are not official transcripts, and a learner who treats them
 * as one will be turned away by a board.
 *
 * ── Two places this follows the repo rather than the Figma ────────────────
 *
 * ⚠ THE TABLE SORTS, and the design's headers are plain text. Both of this
 * repo's other account tables sort every column (`GiftRecipientsTable`,
 * `PurchasesLedgerPanel`), and the second one's note says why they must read
 * as one component. A history is sorted by nature — "what did I finish in
 * 2025", "which course was 24 hours" — and the alternative is a Sort dropdown
 * the design does not have either. The visual is the design's; the affordance
 * is the repo's. Flagged on the dev handoff rather than settled silently.
 *
 * ⚠ THE COLOURS ARE TOKENS, not the Figma's literals. The frame is dressed in
 * McKissock's palette — #8aa007 for the active pill, #F59233 for the two
 * actions — and this app is XCEL's, with a Brand control that reskins it. So
 * the pills are the shared `PillTabs` and the actions take `--color-action`;
 * on the XCEL skin that reads brick rather than orange, which is correct and
 * is not a fidelity miss.
 */
export function TranscriptsPanel() {
  const { brand } = useAccount()
  const all = useMemo(() => transcriptsFor(brand), [brand])
  const [filter, setFilter] = useState<TranscriptFilter>('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortState>({ key: 'completedDate', dir: 'desc' })
  const [exporting, setExporting] = useState(false)
  /* In the learning pages' layout (2026-11-03, Eric's request): the table
     framed by the cards' 1px rule all round, and its column titles sitting on
     the header's bottom line. */
  const atlasFrame = useAtlasAccountPages()

  /*
   * ONE TRANSCRIPT OR SEVERAL — the whole of the export decision.
   *
   * A transcript is per profession and state (see `transcriptGroups`), so a
   * learner with one of each has exactly one document and must never be asked
   * which of their one document they meant. With more than one, Download opens
   * the pick-list; with exactly one, it goes straight to the sheet.
   *
   * ⚠ GROUPED FROM THE WHOLE HISTORY, not the filtered rows. A learner who has
   * narrowed to this year still owns every transcript they own — hiding the
   * Texas option because this year's filter excluded it would make the export
   * depend on a control that has nothing to do with it.
   */
  const groups = useMemo(() => transcriptGroups(all), [all])
  const printHref = (keys: readonly string[] = []) => {
    const params = new URLSearchParams()
    if (filter !== 'all') params.set('filter', filter)
    if (keys.length > 0) params.set('groups', keys.join(','))
    const q = params.toString()
    return `/print/transcript${q ? `?${q}` : ''}`
  }
  const openExport = () => {
    if (groups.length > 1) setExporting(true)
    else window.open(printHref(), '_blank', 'noopener,noreferrer')
  }

  /* FILTER, THEN SEARCH, THEN SORT — in that order, and the order is visible
     in the result count: the count below the pills reports what the learner is
     looking at, so a search inside "Completed This Year" has to narrow that
     year rather than the whole history. */
  const rows = useMemo(() => {
    const scoped = searchTranscripts(filterTranscripts(all, filter), query)
    if (!sort.key) return scoped
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...scoped].sort((a, b) => {
      const key = sort.key as SortKey
      if (key === 'hours') return (a.hours - b.hours) * dir
      return String(a[key]).localeCompare(String(b[key])) * dir
    })
  }, [all, filter, query, sort])

  const year = transcriptYear()
  const tabs: PillTabItem<TranscriptFilter>[] = [
    { id: 'all', label: 'All' },
    { id: 'this-year', label: 'Completed This Year' },
    { id: 'previous-years', label: 'Completed Previous Years' },
  ]

  const toggleSort = (key: SortKey) =>
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    )
  const ariaSort = (key: SortKey): 'ascending' | 'descending' | 'none' =>
    sort.key !== key ? 'none' : sort.dir === 'asc' ? 'ascending' : 'descending'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* THE DISCLAIMER LEADS (node 2009:28298) — verbatim, "official" in
          SemiBold. It is the first thing on the page because it is the thing a
          learner most needs to know before they rely on what follows. */}
      <p style={disclaimerStyle}>
        These are not “<strong style={{ fontWeight: 600 }}>official</strong>” transcripts and
        shouldn’t be used in place of signed course completion certificates. If you have completed
        courses that are not showing, try printing them individually to see if you need to submit
        any required documents, affidavits, etc.
      </p>

      {/* The search sits on its own row above the filters (node 2009:28287),
          at the design's 546. Its placeholder names exactly the three fields
          `searchTranscripts` looks at — see that function for why. */}
      <SearchInput
        label="Search transcripts"
        placeholder="Search by Course Name, License Type, State"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', maxWidth: 546 }}
      />

      {/* Filters left, the total beside them, the two actions right. The count
          is BESIDE the strip and not on the pills: this repo's convention is
          segmented filters with no per-pill counts and the total alongside.

          ⚠ IT FITS ON ONE ROW ONLY BECAUSE THE LABELS ARE SHORT. This shell's
          account content box is 892px at a 1440 viewport (a 208px sub-nav plus
          the narrowed account gutter) against the design's 1101, and the three
          items need 860 of it. At "Download All" / "View All" they needed 907
          and the actions wrapped. `flexWrap` is kept as the narrow fallback —
          they drop, still right-aligned, rather than crushing the pills — but
          at this width and these labels nothing wraps. Lengthening either
          label is what would bring the wrap back. */}
      <div style={controlRowStyle}>
        <PillTabs label="Filter transcripts" items={tabs} active={filter} onChange={setFilter} />
        <span style={countStyle}>{showingLabel(rows.length)}</span>
        {/* "Download" and "View", not "Download All" / "View All" (2026-11-02,
            the direct ask). Shortening them is also what lets this row hold
            everything at 892px — the wrap noted above only happened at the
            longer labels. */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* A BUTTON, because it may open a chooser rather than navigate.
              Making it a link would promise a destination it does not always
              have, and would open an empty tab behind the sheet. */}
          <button type="button" onClick={openExport} style={actionStyle}>
            <Download size={16} aria-hidden />
            Download
          </button>
          {/* View always goes straight to the document: it shows what is on
              screen, and what is on screen is every transcript. */}
          <a href={printHref()} target="_blank" rel="noreferrer" style={actionStyle}>
            <FileText size={16} aria-hidden />
            View
          </a>
        </div>
      </div>

      {rows.length === 0 ? (
        /* TWO EMPTINESSES, ONE CONTROL AWAY FROM EACH OTHER. "No transcript
           yet" is a learner who has completed nothing; "nothing matches" is a
           filter or a search hiding what is there. Telling them apart is the
           difference between "go take a course" and "clear your search", and
           the design has a frame for each case. */
        <EmptyState
          title={all.length === 0 ? 'No completed courses yet' : 'No results'}
          description={
            all.length === 0
              ? 'Courses appear here once you complete them.'
              : 'Try a different search, or choose All to see your whole history.'
          }
        />
      ) : (
        <div style={atlasFrame ? ATLAS_TABLE_WRAP : tableWrapStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <caption className="cre-visually-hidden">
              {`Completed courses — ${
                filter === 'all'
                  ? 'all years'
                  : filter === 'this-year'
                    ? `completed in ${year}`
                    : `completed before ${year}`
              }`}
            </caption>
            <colgroup>
              {COLUMNS.map((col) => (
                <col key={col.key} style={{ width: col.width }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {COLUMNS.map((col, i) => {
                  const active = sort.key === col.key
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={ariaSort(col.key)}
                      style={{ ...HEADER_CELL, ...(atlasFrame && { verticalAlign: 'bottom' }), ...(i === 0 && { paddingLeft: 24 }), ...col.cellStyle }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        style={headerButtonStyle}
                      >
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
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {/* The course name is the only SemiBold cell (12/18), as in
                      the design — it is what the row is about. */}
                  <th scope="row" style={{ ...BODY_CELL, ...TITLE_CELL }}>
                    {row.title}
                  </th>
                  <td style={BODY_CELL}>{row.profession}</td>
                  <td style={BODY_CELL}>{row.state}</td>
                  {/* Hours right-aligned: it is the one numeric column, and a
                      ragged-left number column is harder to compare. ZERO IS
                      PRINTED, not blanked — a non-credit completion earning no
                      hours is a fact, and an empty cell reads as missing data. */}
                  <td style={{ ...BODY_CELL, ...NUMERIC_CELL }}>{row.hours}</td>
                  <td style={BODY_CELL}>{formatTranscriptDate(row.enrolledDate)}</td>
                  <td style={BODY_CELL}>{formatTranscriptDate(row.completedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ExportTranscriptSheet
        open={exporting}
        onClose={() => setExporting(false)}
        groups={groups}
        onExport={(keys) => {
          setExporting(false)
          window.open(printHref(keys), '_blank', 'noopener,noreferrer')
        }}
      />
    </div>
  )
}

type SortKey = keyof Pick<
  TranscriptRecord,
  'title' | 'profession' | 'state' | 'hours' | 'enrolledDate' | 'completedDate'
>

type SortState = { key: SortKey | null; dir: 'asc' | 'desc' }

/* The design's six columns and their widths (nodes 2009:28279–28284), as
   percentages of its 1101px table so they hold at any content width:
   312 / 282 / 151 / 99 / 128 / 129. */
const COLUMNS: { key: SortKey; label: string; width: string; cellStyle?: CSSProperties }[] = [
  { key: 'title', label: 'Course Name', width: '28.3%' },
  { key: 'profession', label: 'License Type/Profession', width: '25.6%' },
  { key: 'state', label: 'State', width: '13.7%' },
  { key: 'hours', label: 'Hours', width: '9%', cellStyle: { textAlign: 'right' } },
  { key: 'enrolledDate', label: 'Date Enrolled', width: '11.6%' },
  { key: 'completedDate', label: 'Date Completed', width: '11.7%' },
]

const disclaimerStyle: CSSProperties = {
  margin: 0,
  maxWidth: 963,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}

const controlRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 20,
  flexWrap: 'wrap',
}

const countStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: '22px',
  color: 'var(--color-text-secondary)',
}

/* The two text buttons (nodes 2009:28300–28301). `--color-action` rather than
   the Figma's #F59233 — see the note at the top of the file. */
const actionStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  color: 'var(--color-action)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

/* The design's 16px top corners over a 2px header rule; the wrapper clips so
   the first header cell's background follows the radius. */
const tableWrapStyle: CSSProperties = {
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  overflow: 'hidden',
  background: 'var(--color-surface-card)',
}

const ATLAS_TABLE_WRAP: CSSProperties = {
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--atlas-card-radius, 16px)',
  overflow: 'hidden',
  background: 'var(--color-surface-card)',
}

/* The caption uses the repo's own `.cre-visually-hidden` rather than a local
   copy of the clip trick — a caption, not a visual heading, because the table
   needs a name a screen reader can announce and the filter it is showing is
   otherwise only visible as a selected pill somewhere above it. */

/* HEADER_CELL / BODY_CELL / headerButtonStyle are `GiftRecipientsTable`'s,
   copied rather than imported: that file does not export them, and the three
   account tables agreeing by VALUE is the thing to preserve. If a fourth
   arrives, lift them into a shared module instead of copying a third time. */
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

const TITLE_CELL: CSSProperties = {
  paddingLeft: 24,
  fontWeight: 600,
  color: 'var(--color-text-primary)',
}

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
  cursor: 'pointer',
}
