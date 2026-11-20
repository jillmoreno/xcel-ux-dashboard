import { useMemo, useState, type CSSProperties } from 'react'
import { ChevronDown, Download, DownloadRegular, FileCertificateRegular, FileText } from '@/icons'
import { ExportTranscriptSheet } from './ExportTranscriptSheet'
import { EmptyState } from '@/components/ui/EmptyState'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { SearchInput } from '@/components/ui/SearchInput'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useAtlasAccountPages } from './useAtlasAccountPages'
import { AtlasFilterPills } from './AtlasFilterPills'
import { ATLAS_FIRST_CELL, ATLAS_NAME_CELL, ATLAS_TABLE_CARD, ATLAS_TD, ATLAS_TH, ATLAS_THEAD } from './atlasAccountTableStyles'
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

/** Download and View above the table — off since 2026-11-19 (Eric). */
const SHOW_TABLE_ACTIONS: boolean = false
/** The Hours value under the middle of its label — see the Hours cell. */
const HOURS_UNDER_LABEL: CSSProperties = { display: 'inline-block', width: 33, marginRight: 12 + 6, textAlign: 'center' }
/** …and Final Score's under its own — the label measures 59.5 ("Score", 30, before 2026-11-19's rename). */
const SCORE_UNDER_LABEL: CSSProperties = { ...HOURS_UNDER_LABEL, width: 59.5 }
/* 40 BETWEEN COLUMNS (2026-11-19, Eric: "reduce the space between the columns to 40 pixels between columns' widest content,
   and the next column"). Every column sizes to its widest content and keeps 40 after it, none before it — so 40 is the whole
   gap. Course Name is the one that wraps, at COURSE_NAME_W, so a long title cannot push the table past its card. The table
   and its card are as wide as the columns (the spacer cell that filled the card went the same day). The design's percentage widths (COLUMNS[].width) are kept for the
   record but no longer applied. */
const COLUMN_GAP = 40
const COURSE_NAME_W = 260
function fit(i: number): CSSProperties {
  if (i === 0) return { width: COURSE_NAME_W, paddingRight: COLUMN_GAP }
  /* The last column (Certificate) ends the table: the 20 the first cell starts with, not a 40 gap to nothing. */
  const last = i === COLUMNS.length
  return { width: '1px', whiteSpace: 'nowrap', paddingLeft: 0, paddingRight: last ? LAST_CELL_PAD : COLUMN_GAP }
}
const LAST_CELL_PAD = 20
/* VALID TILL (2026-11-19, Eric: "a valid till date configured as 11 July 2027, using three letter abbreviations for the
   months … based off of their completion date and based on a six month expiration"). Demo data: six months after the
   course was completed — so the dates vary down the page with the completions. A day the later month lacks (31 Aug + 6)
   clamps to that month's last day. "11 Jul 2027". */
// 5, not 6 (later 2026-11-19, Eric: the first row, completed 4/10/2026, "reads valid till 9/10/2026").
const CERT_VALID_MONTHS = 5
function certificateValidTill(completedIso: string): Date {
  const [y, m, d] = completedIso.split('-').map(Number)
  const target = new Date(y, m - 1 + CERT_VALID_MONTHS, 1)
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d, last))
}
/* M/D/YYYY, as the Completed column writes its dates (later 2026-11-19, Eric) — "10 Oct 2026" (three-letter months)
   before. */
function formatValidTill(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`
}
/* THREE THAT DO NOT EXPIRE (2026-11-19, Eric: "change three of the certificate expirations to no expiry") — the two
   zero-hour "How to Add Courses" walkthroughs and the ethics assessment, the three least like a licence credit that lapses. */
const NO_EXPIRY: ReadonlySet<string> = new Set(['t-xcel-howto-ce', 't-xcel-howto-qe', 't-xcel-ethics-assessment'])
/* The Certificate and Transcripts icons: 16 FA Regular, in the page-button blue so they read as things to press. */
const RECORD_BUTTON: CSSProperties = {
  display: 'inline-flex',
  verticalAlign: 'middle',
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  color: 'var(--color-primary-500)',
}

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
     framed by the cards' 1px rule all round, its column titles sitting on
     the header's bottom line, and that line 1px rather than 2. */
  const atlasFrame = useAtlasAccountPages()
  const cell = atlasFrame ? ATLAS_TD : BODY_CELL
  // The phone frame (2026-11-10, Eric) — the first row as a card above the table there.
  const phone = useFeatureFlag('home-breakpoint').variant === 'mobile'

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
      if (key === 'score') return (transcriptScore(a) - transcriptScore(b)) * dir
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
        {/* Reworded 2026-11-19 (Eric) — "Transcripts are not …" rather than "These are not … transcripts". */}
        Transcripts are not “<strong style={{ fontWeight: 600 }}>official</strong>” and
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
      {/* THE ROW AND THE TABLE AS ONE BLOCK, as wide as the table (2026-11-19) — so Download Transcript, pushed right, ends on
          the table's right edge. */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: 'fit-content', maxWidth: '100%' }}>
      <div style={controlRowStyle}>
        {/* The count FIRST, left of All (2026-11-19, Eric) — it was after the pills. */}
        <span style={countStyle}>{showingLabel(rows.length)}</span>
        {/* The admin table header's pills under the account pages' Quick Links layout (2026-11-03). */}
        {atlasFrame ? (
          <AtlasFilterPills label="Filter transcripts" items={tabs} active={filter} onChange={setFilter} />
        ) : (
          <PillTabs label="Filter transcripts" items={tabs} active={filter} onChange={setFilter} />
        )}
        {/* "Download" and "View", not "Download All" / "View All" (2026-11-02,
            the direct ask). Shortening them is also what lets this row hold
            everything at 892px — the wrap noted above only happened at the
            longer labels. */}
        {/* OFF since 2026-11-19 (Eric: "above the certificates and transcripts table, remove the download and view links") —
            set SHOW_TABLE_ACTIONS true to bring both back. The chooser and the print page are untouched. */}
        {SHOW_TABLE_ACTIONS ? (
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
        ) : null}
        {/* DOWNLOAD TRANSCRIPT (2026-11-19, Eric) — in place of the table's Transcript column, a download icon after the label,
            flush with the table's right edge. It does what Download did — the
            chooser when there is more than one transcript, straight to the PDF when there is one. */}
        {/* No leading icon since the same day (Eric); the download icon one weight up, Light → Regular; the label in Home's text
            links' type — Exam Information, Applying for a License: Open Sans SemiBold 13/18. */}
        <button type="button" onClick={openExport} style={{ ...actionStyle, ...HOME_TEXT_LINK, marginLeft: 'auto' }}>
          {/* The label sets the button's baseline, so the row's baseline alignment puts it on the count's and the pills' line. */}
          <span style={{ alignSelf: 'baseline' }}>Download Transcript</span>
          <DownloadRegular size={16} aria-hidden />
        </button>
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
        <>
        {/* THE TOP ROW AS A CARD (2026-11-10, Eric: "use the data in the top row of the table to create a card version of it and
            place it above the table"). On the phone only: the course name, then each column's label over its value, stacked —
            in the table's own edge and corners. It follows the sort and the filter, because it is whatever row is first. */}
        {phone && SHOW_ROW_CARD ? (
          <section aria-label={`${rows[0].title} — the first transcript`} style={{ ...(atlasFrame ? ATLAS_TABLE_CARD : tableWrapStyle), ...ROW_CARD }}>
            <h3 style={ROW_CARD_TITLE}>{rows[0].title}</h3>
            <dl style={ROW_CARD_LIST}>
              {[
                ['License Line', rows[0].profession],
                ['State', rows[0].state],
                ['Hours', String(rows[0].hours)],
                ['Completed', formatTranscriptDate(rows[0].completedDate)],
                ['Final Score', `${transcriptScore(rows[0])}%`],
              ].map(([term, value]) => (
                <div key={term} className="cre-transcript-card-line" style={ROW_CARD_ITEM}>
                  <dt style={ROW_CARD_TERM}>{term}:</dt>{' '}
                  {/* Only the licence type's value on a line of its own (same day, Eric). */}
                  <dd style={{ ...ROW_CARD_VALUE, ...(term === 'License Line' && { display: 'block' }) }}>{value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
        {/* AS WIDE AS ITS COLUMNS (2026-11-19, Eric: "collapse the … table to fit its content horizontally") — the card hugs
            the table, the table hugs its columns; never wider than the page. */}
        <div style={{ ...(atlasFrame ? ATLAS_TABLE_CARD : tableWrapStyle), width: 'fit-content', maxWidth: '100%' }}>
          <table className={atlasFrame ? 'cre-atlas-table' : undefined} style={{ width: 'auto', borderCollapse: 'collapse', fontFamily: 'var(--font-body)' }}>
            <caption className="cre-visually-hidden">
              {`Completed courses — ${
                filter === 'all'
                  ? 'all years'
                  : filter === 'this-year'
                    ? `completed in ${year}`
                    : `completed before ${year}`
              }`}
            </caption>
            {/* No colgroup widths since 2026-11-19 — the columns size to their content; see FIT. */}
            <thead style={atlasFrame ? ATLAS_THEAD : undefined}>
              <tr>
                {COLUMNS.map((col, i) => {
                  const active = sort.key === col.key
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={ariaSort(col.key)}
                      /* The admin table's header under the Quick Links layout (2026-11-03) — its own padding, type and fill. */
                      style={
                        atlasFrame
                          ? { ...ATLAS_TH, verticalAlign: 'bottom', ...(i === 0 && ATLAS_FIRST_CELL), ...col.cellStyle, ...fit(i) }
                          : { ...HEADER_CELL, ...(i === 0 && { paddingLeft: 24 }), ...col.cellStyle, ...fit(i) }
                      }
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
                {/* CERTIFICATE and TRANSCRIPT (2026-11-19, Eric) — one "Records" column of both icons first, then split, one
                    icon each ("Transcripts", then "Transcript"); the Transcript column went the same day for the Download Transcript
                    button over the table. Not sortable here. Left-aligned since it took the valid-till date. */}
                {['Certificate'].map((label, k) => (
                  <th
                    key={label}
                    scope="col"
                    style={
                      atlasFrame
                        ? { ...ATLAS_TH, verticalAlign: 'bottom', ...fit(COLUMNS.length + k) }
                        : { ...HEADER_CELL, ...fit(COLUMNS.length + k) }
                    }
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {/* The course name is the only SemiBold cell (12/18), as in
                      the design — it is what the row is about. */}
                  <th scope="row" style={atlasFrame ? { ...ATLAS_TD, ...ATLAS_FIRST_CELL, ...ATLAS_NAME_CELL, ...fit(0) } : { ...BODY_CELL, ...TITLE_CELL, ...fit(0) }}>
                    {row.title}
                  </th>
                  <td style={{ ...cell, ...fit(1) }}>{row.profession}</td>
                  <td style={{ ...cell, ...fit(2) }}>{row.state}</td>
                  {/* Hours right-aligned: it is the one numeric column, and a
                      ragged-left number column is harder to compare. ZERO IS
                      PRINTED, not blanked — a non-credit completion earning no
                      hours is a fact, and an empty cell reads as missing data. */}
                  {/* Centred under the word "Hours" (2026-11-19, Eric): the label is flush right with its sort arrow after it
                      (12 + the 6 gap), so the value sits in a box the word's width (33) that far in from the right. */}
                  <td style={{ ...cell, ...NUMERIC_CELL, ...fit(3) }}>
                    <span style={HOURS_UNDER_LABEL}>{row.hours}</span>
                  </td>
                  <td style={{ ...cell, ...fit(4) }}>{formatTranscriptDate(row.completedDate)}</td>
                  <td style={{ ...cell, ...NUMERIC_CELL, ...fit(5) }}>
                    <span style={SCORE_UNDER_LABEL}>{transcriptScore(row)}%</span>
                  </td>
                  {/* ⚠ NOT WIRED YET — labelled buttons that open nothing, so each reads as an action and has the name a
                      screen reader needs; give each an onClick when the certificate and transcript views land. */}
                  {/* The icon, then when the certificate is good till (2026-11-19, Eric) — left-aligned now it carries text. */}
                  <td style={{ ...cell, ...fit(COLUMNS.length) }}>
                    {/* Plain inline, not a flex pair: the date sits on the cell's own text line — the row's baseline — and the
                        icon is set middle beside it (2026-11-19, Eric). A centred flex pair put it 1.88 high. */}
                    <button type="button" aria-label={`Certificate — ${row.title}`} title="Certificate" style={{ ...RECORD_BUTTON, marginRight: 8, position: 'relative', top: -2.5 /* 1.5 up to centre on the text, then 1 more (2026-11-19, Eric: up 2, back down 1) */ }}>
                      <FileCertificateRegular size={16} aria-hidden />
                    </button>
                    <span>
                      {/* The date SemiBold, "Valid till" Regular (2026-11-19, Eric). */}
                      {NO_EXPIRY.has(row.id) ? (
                        'No expiry'
                      ) : (
                        <>
                          Valid till <span style={{ fontWeight: 600 }}>{formatValidTill(certificateValidTill(row.completedDate))}</span>
                        </>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
      </div>

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

type SortKey =
  | keyof Pick<TranscriptRecord, 'title' | 'profession' | 'state' | 'hours' | 'enrolledDate' | 'completedDate'>
  | 'score'

/* SCORE (2026-11-19, Eric: "a column for score with random percentages between 80 and 100%"). Demo data: random-looking but
   FIXED per course — hashed from the row's id — so a learner sees the same score every visit and a re-sort does not reshuffle
   it. Whole percents, 80 to 100 inclusive. The fixtures carry no score; when they do, read it here instead. */
function transcriptScore(row: TranscriptRecord): number {
  let h = 2166136261
  for (const ch of row.id) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  return 80 + ((h >>> 0) % 21)
}

type SortState = { key: SortKey | null; dir: 'asc' | 'desc' }

/* The design's six columns and their widths (nodes 2009:28279–28284), as
   percentages of its 1101px table so they hold at any content width:
   312 / 282 / 151 / 99 / 128 / 129. */
const COLUMNS: { key: SortKey; label: string; width: string; cellStyle?: CSSProperties }[] = [
  // 4.3 and 4.7 narrower than the design's, for Score (2026-11-19).
  // "Program" and "License Line" (2026-11-19, Eric) — "Course Name" and "License Type/Profession" before.
  { key: 'title', label: 'Program', width: '24%' },
  { key: 'profession', label: 'License Line', width: '20.9%' },
  { key: 'state', label: 'State', width: '13.7%' },
  { key: 'hours', label: 'Hours', width: '9%', cellStyle: { textAlign: 'right' } },
  // "Completed", without "Date" (2026-11-19, Eric). Enrolled went the same day — the data and its sort key stay.
  { key: 'completedDate', label: 'Completed', width: '11.7%' },
  // After Completed (2026-11-19, Eric), "Final Score" since later that day; right-aligned like Hours, its value centred
  // under the label the same way.
  { key: 'score', label: 'Final Score', width: '9%', cellStyle: { textAlign: 'right' } },
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
  /* Baseline, not centre (2026-11-19, Eric): the count (14/22) and the pills' labels (13/19.5) differ in size, so centring
     left the count 0.75 low. Each item's first text baseline now lines up. */
  alignItems: 'baseline',
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
/* Home's text links (Exam Information, Applying for a License — measured 2026-11-19): Open Sans SemiBold 13/18. */
const HOME_TEXT_LINK: CSSProperties = { fontSize: 13, lineHeight: '18px', fontWeight: 600 }
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
  /* A button does not inherit these by default — the admin table's uppercase, tracked titles need them (2026-11-03). */
  textTransform: 'inherit',
  letterSpacing: 'inherit',
  cursor: 'pointer',
}

// Hidden for now (2026-11-10, Eric: "hide card for now") — true brings it back as it was.
const SHOW_ROW_CARD = false
/* The first row as a card (2026-11-10, Eric): the table's edge, 16 above the table, 16 / 20 in. */
const ROW_CARD: CSSProperties = { marginBottom: 16, paddingTop: 16, paddingRight: 20, paddingBottom: 16, paddingLeft: 20 }
const ROW_CARD_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '20px',
  fontWeight: 600,
  color: 'var(--admin-ink)',
}
const ROW_CARD_LIST: CSSProperties = { margin: '12px 0 0', display: 'flex', flexDirection: 'column' }
// Each label and its value on one line, the value straight after the colon and wrapping only when it runs out of room — no rules,
// and the label in the body type rather than the header's eyebrow (same day, Eric).
const ROW_CARD_ITEM: CSSProperties = {
  paddingTop: 4,
  paddingBottom: 4,
  fontFamily: 'var(--font-body)',
  // 11 / 14 (same day, Eric) — set in mobile.css as `.cre-transcript-card-line`, not here: an inline size is what the phone's
  // +1 rule and its 13px floor both match, and they would draw it 13.
  color: 'var(--admin-ink)', // the card's one dark text colour, the title's (same day, Eric)
}
// The label Regular and its data SemiBold (same day, Eric; was the other way round).
const ROW_CARD_TERM: CSSProperties = { display: 'inline', fontWeight: 400 }
const ROW_CARD_VALUE: CSSProperties = { display: 'inline', margin: 0, fontWeight: 600 }
