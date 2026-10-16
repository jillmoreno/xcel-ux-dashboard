/**
 * HUB RESOURCES — the Hub's own documents, as a section (2026-10-15).
 *
 * A read-only list over `HUB_DOCS`. There is no Add button and no kebab on
 * purpose: these are files in the repository, so the list changes with a
 * commit, not on the page. That is the whole difference between this section
 * and Resources, which is a board anyone writes to — and the reason it reads
 * as a shelf rather than an inbox.
 *
 * Styled on this page's own `--ux-*` palette rather than the brand tokens, the
 * same call `LinksPanel` makes, so it re-skins with the four schemes and four
 * appearances without an `ARCHIVE_BRIDGE` wrapper at the call site.
 *
 * Each row opens in a NEW TAB. The documents are full-page static files with
 * their own stylesheet and their own rail; opening one in this tab would
 * replace the dashboard with something that has no way back to it but the
 * browser's own Back button.
 */
import type { CSSProperties } from 'react'
import { ArrowUpRightFromSquare, FileText } from '@/icons'
import { HUB_DOCS, type HubDoc } from '@/data/hubDocs'

const listStyle: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  border: '1px solid var(--ux-border)',
  borderRadius: 12,
  overflow: 'hidden',
  background: 'var(--ux-card)',
}

const itemStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '38px minmax(0,1fr) auto',
  gap: 14,
  alignItems: 'start',
  padding: '16px 16px',
  borderBottom: '1px solid var(--ux-border-subtle)',
}

/** The document mark. A plain glyph in a tinted square rather than a
 *  screenshot: these three pages look alike at thumbnail size — a wall of
 *  grey text — so a picture of one would tell a reader nothing a label does
 *  not. Same reasoning as `GeneratedThumb`'s, reaching a different answer
 *  because the subject is different. */
const markStyle: CSSProperties = {
  width: 38,
  height: 38,
  borderRadius: 9,
  display: 'grid',
  placeItems: 'center',
  background: 'var(--ux-chip)',
  color: 'var(--ux-text-2)',
}

const titleStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 650,
  color: 'var(--ux-text)',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
}

const audienceStyle: CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 9px',
  borderRadius: 999,
  border: '1px solid var(--ux-border)',
  color: 'var(--ux-text-3)',
  margin: '6px 0 0',
}

const blurbStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 13.5,
  lineHeight: 1.5,
  color: 'var(--ux-text-2)',
  maxWidth: '62ch',
}

const metaStyle: CSSProperties = {
  margin: '8px 0 0',
  fontSize: 12,
  color: 'var(--ux-text-3)',
}

const pdfStyle: CSSProperties = {
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--ux-text-3)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  border: '1px solid var(--ux-border)',
  borderRadius: 999,
  padding: '4px 11px',
}

/** `2026-10-15` → `15 Oct 2026`. Parsed by hand rather than through
 *  `new Date(iso)`, which reads a bare date as UTC and prints the day before
 *  it west of Greenwich — the same trap `qaNoteStore` documents. */
function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return ''
  const month = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ][m - 1]
  return `${d} ${month} ${y}`
}

function DocRow({ doc, last }: { doc: HubDoc; last: boolean }) {
  return (
    <li style={last ? { ...itemStyle, borderBottom: 'none' } : itemStyle}>
      <span style={markStyle} aria-hidden>
        <FileText size={17} />
      </span>
      <div style={{ minWidth: 0 }}>
        <a href={doc.href} target="_blank" rel="noreferrer" style={titleStyle}>
          {doc.title}
          <ArrowUpRightFromSquare size={11} aria-hidden />
        </a>
        <div>
          <span style={audienceStyle}>{doc.audience}</span>
        </div>
        <p style={blurbStyle}>{doc.blurb}</p>
        <p style={metaStyle}>Updated {dateLabel(doc.updated)}</p>
      </div>
      {doc.pdf && (
        <a href={doc.pdf} download style={pdfStyle}>
          PDF
        </a>
      )}
    </li>
  )
}

export function HubResourcesPanel() {
  return (
    <ul style={listStyle}>
      {HUB_DOCS.map((doc, i) => (
        <DocRow key={doc.id} doc={doc} last={i === HUB_DOCS.length - 1} />
      ))}
    </ul>
  )
}
