/**
 * HUB RESOURCES — the Hub's own documents, as a section (2026-10-15).
 *
 * A read-only list over `HUB_DOCS`. There is no Add button on purpose: these
 * are files in the repository, so the list changes with a commit, not on the
 * page. That is the whole difference between this section and Resources,
 * which is a board anyone writes to — and the reason it reads as a shelf
 * rather than an inbox.
 *
 * THE ROWS ARE `HubRow` (2026-11-01, Jillienne: "I want ALL of the pages to
 * follow this similar UI so its consistent"). Each guide gets the row every
 * other section draws: a live miniature of the page for its thumbnail (the
 * guides are same-origin static files, so the frame the Prototypes rows use
 * works here — it was a glyph in a tinted square before, on the reasoning
 * that three walls of grey text look alike at tile size; they have headers
 * now, and a row with a picture where every other row has one is the point),
 * its title and blurb, and three tags — who it is for, when it was updated,
 * and that it is a guide. The PDF sits in the status column, where it stays
 * reachable without opening the kebab; the kebab repeats it for the keyboard
 * and adds Copy link.
 *
 * Each row opens in a NEW TAB. The documents are full-page static files with
 * their own stylesheet and their own rail; opening one in this tab would
 * replace the dashboard with something that has no way back to it but the
 * browser's own Back button.
 *
 * Styled on this page's own `--ux-*` palette rather than the brand tokens, the
 * same call `LinksPanel` makes, so it re-skins with the four schemes and four
 * appearances without an `ARCHIVE_BRIDGE` wrapper at the call site.
 */
import { useState, type CSSProperties } from 'react'
import { ArrowUpRightFromSquare, Download, FileText, Share2, User } from '@/icons'
import { Toast } from '@/components/ui/Toast'
import { HUB_DOCS, type HubDoc } from '@/data/hubDocs'
import { THUMB_H, THUMB_W } from './GeneratedThumb'
import { HubPageThumb, HubRow } from './HubRow'
import { hubListStyle, hubTagStyle } from './hubRowStyles'

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

/** The PDF, as a tag-shaped download link in the row's status column. A
 *  real `<a download>` rather than a kebab item: the file is the one thing
 *  a reader comes to this row for that the row itself does not open. */
const pdfStyle: CSSProperties = {
  ...hubTagStyle,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  textDecoration: 'none',
  color: 'var(--ux-text-2)',
}

function DocRow({ doc }: { doc: HubDoc }) {
  const [copied, setCopied] = useState(false)
  const absolute = `${window.location.origin}${doc.href}`
  const copyLink = () => {
    navigator.clipboard?.writeText(absolute).catch(() => {})
    setCopied(true)
  }
  const actions = [
    {
      id: 'open',
      label: 'Open guide',
      icon: <ArrowUpRightFromSquare size={15} aria-hidden />,
      onSelect: () => window.open(doc.href, '_blank', 'noopener,noreferrer'),
    },
    ...(doc.pdf
      ? [
          {
            id: 'pdf',
            label: 'Download PDF',
            icon: <Download size={15} aria-hidden />,
            onSelect: () => window.open(doc.pdf, '_blank', 'noopener,noreferrer'),
          },
        ]
      : []),
    { id: 'copy-link', label: 'Copy link', icon: <Share2 size={15} aria-hidden />, onSelect: copyLink },
  ]
  return (
    <HubRow
      id={`hub-doc-${doc.id}`}
      thumb={<HubPageThumb src={doc.href} width={THUMB_W} height={THUMB_H} />}
      title={doc.title}
      titleAdornment={<ArrowUpRightFromSquare size={11} aria-hidden style={{ flex: 'none', color: 'var(--ux-text-3)' }} />}
      titleSr=" — opens in a new tab"
      description={doc.blurb}
      tags={[
        { key: 'audience', text: doc.audience, icon: <User size={11} aria-hidden style={{ flex: 'none' }} />, srPrefix: 'For: ' },
        { key: 'updated', text: `Updated ${dateLabel(doc.updated)}` },
        { key: 'kind', text: 'Guide', icon: <FileText size={11} aria-hidden style={{ flex: 'none' }} /> },
      ]}
      statusWidth={84}
      status={
        doc.pdf ? (
          <a href={doc.pdf} download style={pdfStyle}>
            <Download size={11} aria-hidden style={{ flex: 'none' }} />
            PDF
          </a>
        ) : null
      }
      href={doc.href}
      external
      actions={actions}
      menuLabel={`Actions for ${doc.title}`}
    >
      <Toast open={copied} onClose={() => setCopied(false)} title="Link copied" tone="success">
        {absolute}
      </Toast>
    </HubRow>
  )
}

export function HubResourcesPanel() {
  return (
    <div style={hubListStyle}>
      {HUB_DOCS.map((doc) => (
        <DocRow key={doc.id} doc={doc} />
      ))}
    </div>
  )
}
