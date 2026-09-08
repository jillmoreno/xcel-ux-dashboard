import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Star, StarSolid } from '@/icons'
import {
  CATEGORY_LABELS,
  TYPE_LABELS,
  type LibraryResource,
} from '@/data/membership/libraryFixtures'

/**
 * Shared shell for every variant of `/resources/:id`. Renders the
 * back link, title row (with right-aligned Download + Feedback
 * text-links), description paragraph, and meta row (type badge ·
 * star rating · "Topic: X" · optional tag pill). Children slot in
 * as the variant-specific body (Video player, Article view,
 * Infographic PDF mock, etc.).
 *
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ < Back                                                      │
 *   │                                                              │
 *   │ Title                              [↓ Download]  [★ Feedback]│
 *   │                                                              │
 *   │ Description paragraph that may wrap to 2 lines …             │
 *   │                                                              │
 *   │ [Type] │ ★ 4.5 │ Topic: X │ [tag]                            │
 *   │                                                              │
 *   │ ┌────────────────────────────────────────────────────────┐ │
 *   │ │                  (variant body)                         │ │
 *   │ └────────────────────────────────────────────────────────┘ │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Source-of-truth Figma: `YHxxKYdMoUXSc3JZcYt4tV` → node `20:3889`
 * (Learning Resources Viewer). The shell tokens mirror the Figma
 * Healthcare tokens (#1758B6 primary on nav, #02568F cta blue on
 * Back / Download / Feedback links, neutral-800 for the type badge
 * border).
 */
type Props = {
  resource: LibraryResource
  children: ReactNode
  /** Embedded in the Dashboard Rebrand shell (the in-shell resource viewer):
   *  drops the standalone page background + outer cap (the shell column owns
   *  those), and turns the back link into an in-shell "Back to Learning
   *  Library" control driven by `onBack` instead of a route. */
  embedded?: boolean
  /** In-shell back handler — closes the viewer and returns to the library
   *  section. When set (embedded), the back link becomes a button. */
  onBack?: () => void
}

export function ResourceDetailShell({ resource, children, embedded = false, onBack }: Props) {
  // Title-row Download text-link resolves to the resource's real
  // file URL when it ships one (`pdfUrl` wins over `downloadUrl` so
  // PDFs always download as PDFs). When neither is set the link
  // stays a stub button — no action, no nav.
  const downloadHref = resource.pdfUrl ?? resource.downloadUrl

  return (
    <div style={embedded ? embeddedPageStyle : pageStyle}>
      <div style={embedded ? undefined : containerStyle}>
        <div style={contentStyle}>
          {onBack ? (
            <button type="button" onClick={onBack} style={backButtonStyle}>
              <ArrowLeft size={16} aria-hidden />
              Back to Resource Library
            </button>
          ) : (
            <Link to="/membership?tab=library" style={backLinkStyle}>
              <ArrowLeft size={16} aria-hidden />
              Back
            </Link>
          )}

          <header style={headerStyle}>
            <div style={titleRowStyle}>
              <h1 style={titleStyle}>{resource.title}</h1>
              <div style={titleActionsStyle}>
                {downloadHref ? (
                  <a
                    href={downloadHref}
                    download
                    style={textLinkStyle}
                    aria-label="Download this resource"
                  >
                    <Download size={16} aria-hidden />
                    Download
                  </a>
                ) : (
                  <button
                    type="button"
                    style={textLinkStyle}
                    aria-label="Download this resource"
                  >
                    <Download size={16} aria-hidden />
                    Download
                  </button>
                )}
                <button type="button" style={textLinkStyle} aria-label="Give feedback on this resource">
                  <Star size={16} aria-hidden />
                  Feedback
                </button>
              </div>
            </div>

            <div style={metaRowStyle}>
              <span style={typeBadgeStyle}>{TYPE_LABELS[resource.type]}</span>
              <span aria-hidden style={dividerStyle} />
              <span style={ratingStyle} aria-label={`Rating ${resource.rating.toFixed(1)} out of 5`}>
                <StarSolid
                  size={14}
                  aria-hidden
                  style={{ color: 'var(--color-warning-500)' }}
                />
                {resource.rating.toFixed(1)}
              </span>
              <span aria-hidden style={dividerStyle} />
              <span style={topicStyle}>
                Topic: {CATEGORY_LABELS[resource.category]}
              </span>
              {resource.tag && (
                <>
                  <span aria-hidden style={dividerStyle} />
                  <span style={tagBadgeStyle}>{resource.tag}</span>
                </>
              )}
            </div>

            <p style={descriptionStyle}>{resource.description}</p>
          </header>

          <div style={bodySlotStyle}>{children}</div>
        </div>
      </div>
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const pageStyle: CSSProperties = {
  // Page surface — matches the Figma's neutral-075 background that
  // sits behind the variant body card.
  background: 'var(--color-surface-page)',
  minHeight: 'calc(100vh - 80px)',
  paddingBottom: 64,
}

// Embedded (in-shell) — no standalone background / min-height / outer cap; the
// shell content column already owns those. The `ResourceLauncherView` wrapper
// supplies the 40px column gutter.
const embeddedPageStyle: CSSProperties = {
  width: '100%',
}

const backButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  marginBottom: 24,
}

const containerStyle: CSSProperties = {
  // Outer cap mirrors the rest of the membership pages
  // (`MembershipLandingPage`, `LibraryPanel`, etc.) so wide viewports
  // don't bleed beyond the platform's canonical 1440 grid. Centered
  // via `margin: 0 auto` — on viewports > 1440 the page background
  // shows through on either side.
  maxWidth: 1440,
  margin: '0 auto',
  padding: '24px 24px 0',
}

const contentStyle: CSSProperties = {
  // Inner content cap matches the Figma's canonical body width
  // (1233px from node `20:3889`). Every element — back link,
  // title row, meta, description, body — shares this same wrapper
  // so the header content stays aligned with the body card edge.
  // On viewports > 1281px (1233 + 48 padding) the inner content
  // sits left-aligned inside the outer container, leaving a
  // breathing gutter on the right (matches the Figma's asymmetric
  // gutter at 1680).
  maxWidth: 1233,
  width: '100%',
}

const backLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  color: 'var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  textDecoration: 'none',
  marginBottom: 24,
}

const headerStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginBottom: 24,
}

const titleRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 24,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 20,
  fontWeight: 600,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
  flex: 1,
  minWidth: 0,
}

const titleActionsStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 24,
  flexShrink: 0,
}

const textLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  background: 'transparent',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  color: 'var(--color-cta-500)',
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '24px',
}

const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 16,
}

const typeBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 32,
  padding: '0 12px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid var(--color-neutral-800)',
  background: 'transparent',
  color: 'var(--color-neutral-800)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const dividerStyle: CSSProperties = {
  width: 1,
  height: 22,
  background: 'var(--color-border-subtle)',
  display: 'inline-block',
}

const ratingStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: '20px',
  color: 'var(--color-text-primary)',
}

const topicStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 400,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
}

const tagBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  height: 32,
  padding: '0 12px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-neutral-100)',
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 400,
  lineHeight: '22px',
  color: 'var(--color-text-primary)',
  // No standalone max-width — the parent `contentStyle` already
  // caps the description (and everything else in the header) at the
  // Figma's 1233 content width.
}

const bodySlotStyle: CSSProperties = {
  // The body slot fills the inner content wrapper (1233 max) — no
  // separate cap needed here. Variant bodies (Video, Article,
  // Infographic, etc.) inherit the same width so the title row + body
  // card edges stay aligned across every viewport.
  width: '100%',
}
