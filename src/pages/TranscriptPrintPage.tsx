import { useMemo, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PrintDocumentShell } from '@/components/layout/PrintDocumentShell'
import { useAccount } from '@/context/AccountContext'
import { profileFor } from '@/data/accountProfileFixtures'
import {
  filterTranscripts,
  formatTranscriptDate,
  transcriptYear,
  transcriptsFor,
  type TranscriptFilter,
} from '@/data/transcriptFixtures'

function parseFilter(raw: string | null): TranscriptFilter {
  return raw === 'this-year' || raw === 'previous-years' ? raw : 'all'
}

/**
 * THE PRINTED TRANSCRIPT — `/print/transcript`, 2026-11-02.
 *
 * Both of the Transcripts page's actions land here: Download All and View All.
 * They are one destination because there is one artefact — the browser's own
 * Print → Save as PDF is what "download" means here, and the toolbar offers
 * both words for it.
 *
 * ⚠ IT SAYS IT IS NOT OFFICIAL, IN THE DOCUMENT. The on-screen page carries
 * that disclaimer in its first paragraph; a printed page that dropped it would
 * be the exact artefact the disclaimer warns against — a transcript-looking
 * sheet with no caveat, handed to a board. So the note prints too, under the
 * heading, and it is the one thing on this page that must never be removed to
 * make room.
 *
 * ⚠ THE PRINT REFLECTS THE FILTER, via `?filter=`. A learner who narrowed to
 * "Completed This Year" and pressed Download All reasonably expects this year;
 * printing the whole history instead would be a different document from the one
 * they were looking at. The subtitle names the range so the sheet is readable
 * away from the screen that produced it.
 *
 * The search term is deliberately NOT carried: a transcript filtered to
 * whatever someone typed is not a document anyone wants, and "Download All"
 * says all.
 */
export function TranscriptPrintPage() {
  const [params] = useSearchParams()
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  const filter = parseFilter(params.get('filter'))
  const rows = useMemo(
    () => filterTranscripts(transcriptsFor(brand), filter),
    [brand, filter],
  )
  /* `personal.name` is the learner's full name — the same field the purchase
     receipt prints as "billed to", so the two documents name them identically. */
  const learner = profileFor(brand, isMember)
  const year = transcriptYear()

  const range =
    filter === 'this-year'
      ? `Completed in ${year}`
      : filter === 'previous-years'
        ? `Completed before ${year}`
        : 'All completed courses'

  /* The hour total is the number a board actually asks for, and it is the one
     thing a table of rows does not say on its own. Non-credit rows contribute
     zero, which is why they can sit in the list without distorting it. */
  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0)

  return (
    <PrintDocumentShell
      filename={`Transcript — ${learner.personal.name}.pdf`}
      heading="Course Transcript"
      closeTo="/dashboard-rebrand?section=transcripts"
    >
      <div style={metaStyle}>
        <p style={metaLineStyle}>
          <span style={metaLabelStyle}>Learner</span>
          {learner.personal.name}
        </p>
        <p style={metaLineStyle}>
          <span style={metaLabelStyle}>Range</span>
          {range}
        </p>
        <p style={metaLineStyle}>
          <span style={metaLabelStyle}>Courses</span>
          {rows.length}
        </p>
        <p style={metaLineStyle}>
          <span style={metaLabelStyle}>Total credit hours</span>
          {totalHours}
        </p>
      </div>

      {/* The disclaimer, verbatim from the page this printed from. See the
          warning at the top of this file for why it is not optional. */}
      <p style={disclaimerStyle}>
        These are not “<strong style={{ fontWeight: 600 }}>official</strong>” transcripts and
        shouldn’t be used in place of signed course completion certificates. If you have completed
        courses that are not showing, try printing them individually to see if you need to submit
        any required documents, affidavits, etc.
      </p>

      {rows.length === 0 ? (
        <p style={emptyStyle}>No completed courses in this range.</p>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Course Name', 'License Type/Profession', 'State', 'Hours', 'Date Enrolled', 'Date Completed'].map(
                (label, i) => (
                  <th
                    key={label}
                    scope="col"
                    style={{ ...headerCellStyle, ...(i === 3 ? { textAlign: 'right' } : null) }}
                  >
                    {label}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <th scope="row" style={{ ...bodyCellStyle, fontWeight: 600 }}>
                  {row.title}
                </th>
                <td style={bodyCellStyle}>{row.profession}</td>
                <td style={bodyCellStyle}>{row.state}</td>
                <td style={{ ...bodyCellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {row.hours}
                </td>
                <td style={bodyCellStyle}>{formatTranscriptDate(row.enrolledDate)}</td>
                <td style={bodyCellStyle}>{formatTranscriptDate(row.completedDate)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              {/* The total repeated at the foot, where a reader scanning the
                  rows ends up — the meta block at the top is for someone who
                  reads the sheet in order, this is for someone who adds up. */}
              <th scope="row" colSpan={3} style={footCellStyle}>
                Total credit hours
              </th>
              <td style={{ ...footCellStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                {totalHours}
              </td>
              <td style={footCellStyle} />
              <td style={footCellStyle} />
            </tr>
          </tfoot>
        </table>
      )}
    </PrintDocumentShell>
  )
}

const metaStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '4px 24px',
  marginBottom: 20,
}

const metaLineStyle: CSSProperties = {
  margin: 0,
  display: 'flex',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const metaLabelStyle: CSSProperties = {
  color: 'var(--color-text-secondary)',
}

const disclaimerStyle: CSSProperties = {
  margin: '0 0 24px',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  lineHeight: '18px',
  color: 'var(--color-text-secondary)',
}

const emptyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--font-body)',
}

const headerCellStyle: CSSProperties = {
  paddingTop: 8,
  paddingRight: 12,
  paddingBottom: 8,
  paddingLeft: 0,
  borderBottom: '2px solid var(--color-neutral-500)',
  color: 'var(--color-neutral-dark)',
  fontSize: 11,
  fontWeight: 600,
  lineHeight: '16px',
  textAlign: 'left',
}

const bodyCellStyle: CSSProperties = {
  paddingTop: 8,
  paddingRight: 12,
  paddingBottom: 8,
  paddingLeft: 0,
  borderBottom: '1px solid var(--color-neutral-light)',
  color: 'var(--color-neutral-dark)',
  fontSize: 11,
  fontWeight: 400,
  lineHeight: '16px',
  textAlign: 'left',
  verticalAlign: 'top',
}

const footCellStyle: CSSProperties = {
  paddingTop: 10,
  paddingRight: 12,
  paddingBottom: 0,
  paddingLeft: 0,
  color: 'var(--color-text-primary)',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: '16px',
  textAlign: 'left',
}
