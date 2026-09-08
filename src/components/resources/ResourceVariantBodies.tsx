import type { CSSProperties } from 'react'
import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Download,
  MoreVertical,
  Minus,
  Plus,
  Search,
  Grid,
  Share2,
  Printer,
  MessageCircle,
  MagnifyingGlass,
} from '@/icons'
import type { LibraryResource } from '@/data/membership/libraryFixtures'

/**
 * Six variant body components for the `/resources/:id` detail page,
 * one per `LibraryResourceType`. Each component fills the same
 * 1233-wide slot from `<ResourceDetailShell>` and uses a consistent
 * dark frame (#242424, 38px radius) wrapping a 24px-radius inner
 * surface.
 *
 * The bodies are **styled placeholders** — they look like the Figma
 * but the interactive controls (PDF page navigation, video play,
 * etc.) are non-functional stubs. Real interactivity is a follow-up.
 *
 * Source-of-truth Figma: `YHxxKYdMoUXSc3JZcYt4tV` → node `20:3889`.
 * Variant-specific node IDs documented at each component.
 */

/* ─── shared frame styles ──────────────────────────────────────────── */

const frameOuterStyle: CSSProperties = {
  background: '#242424',
  borderRadius: 38,
  padding: 14,
  width: '100%',
  height: 704,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

const frameInnerStyle: CSSProperties = {
  flex: 1,
  borderRadius: 24,
  overflow: 'hidden',
  position: 'relative',
  background: 'var(--color-neutral-100)',
}

/* ─── 0. PDF (real embedded reader) ────────────────────────────────── */
//
// Used when a `LibraryResource` carries a real `pdfUrl`. The page-
// level `renderBody` prefers this over the variant body so any
// resource with a real PDF asset gets the full browser PDF reader
// (zoom, page nav, download) — no in-app PDF.js shipping required.
//
// `<object>` is preferred over `<iframe>` because it exposes
// `type="application/pdf"` for browsers to negotiate the right
// plugin path, and falls back gracefully when the user's browser
// can't render PDFs (we render an explicit "Download" link inside
// the fallback slot).

export function PdfBody({
  pdfUrl,
  resourceTitle,
}: {
  pdfUrl: string
  resourceTitle: string
}) {
  return (
    <div style={frameOuterStyle}>
      <object
        data={pdfUrl}
        type="application/pdf"
        aria-label={`${resourceTitle} — PDF`}
        style={{
          flex: 1,
          width: '100%',
          borderRadius: 24,
          border: 'none',
          background: 'var(--color-neutral-100)',
        }}
      >
        {/* Fallback for browsers without a built-in PDF viewer —
            point the reader at a direct download instead. */}
        <div
          style={{
            ...frameInnerStyle,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              maxWidth: 360,
            }}
          >
            Your browser doesn&apos;t support inline PDF preview.
          </p>
          <a
            href={pdfUrl}
            download
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              minHeight: 44,
              padding: '0 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-action)',
              color: 'var(--color-text-inverse)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            <Download size={16} aria-hidden />
            Download PDF
          </a>
        </div>
      </object>
    </div>
  )
}

/* ─── 1. Infographic (PDF-viewer mock) ─────────────────────────────── */
//
// Figma node 2:876. Toolbar across the top (page X/Y, zoom, share /
// download / more icons), thumbnails sidebar on the left, main view
// on the right. The "pages" are mocked from the resource's image —
// every thumbnail and the main view render the same artwork (we
// don't ship per-page assets yet).

export function InfographicBody({ resource }: { resource: LibraryResource }) {
  const [page, setPage] = useState(1)
  const [zoom, setZoom] = useState(64)
  const totalPages = 5

  return (
    <div
      style={{
        ...frameOuterStyle,
        // Infographic frame is taller in the Figma because it
        // includes the toolbar + sidebar + tall portrait pages.
        height: 1380,
        padding: 0,
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 24,
      }}
    >
      <PdfToolbar
        page={page}
        totalPages={totalPages}
        zoom={zoom}
        onPageChange={setPage}
        onZoomChange={setZoom}
      />
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '180px minmax(0, 1fr)',
          gap: 16,
          padding: 16,
          background: 'var(--color-neutral-100)',
          minHeight: 0,
        }}
      >
        <PdfThumbnailRail
          page={page}
          totalPages={totalPages}
          imageUrl={resource.imageUrl}
          onSelect={setPage}
        />
        <PdfMainPage imageUrl={resource.imageUrl} />
      </div>
    </div>
  )
}

function PdfToolbar({
  page,
  totalPages,
  zoom,
  onPageChange,
  onZoomChange,
}: {
  page: number
  totalPages: number
  zoom: number
  onPageChange: (p: number) => void
  onZoomChange: (z: number) => void
}) {
  return (
    <div
      style={{
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        padding: '0 16px',
        borderBottom: '1px solid var(--color-border-subtle)',
        background: 'var(--color-surface-card)',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <ToolbarButton
          ariaLabel="Previous page"
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ArrowLeft size={14} aria-hidden />
        </ToolbarButton>
        <span style={pageNumberStyle}>
          {page} / {totalPages}
        </span>
        <ToolbarButton
          ariaLabel="Next page"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          <ArrowRight size={14} aria-hidden />
        </ToolbarButton>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <ToolbarButton
          ariaLabel="Zoom out"
          onClick={() => onZoomChange(Math.max(25, zoom - 12))}
        >
          <Minus size={14} aria-hidden />
        </ToolbarButton>
        <span style={pageNumberStyle}>{zoom}%</span>
        <ToolbarButton
          ariaLabel="Zoom in"
          onClick={() => onZoomChange(Math.min(200, zoom + 12))}
        >
          <Plus size={14} aria-hidden />
        </ToolbarButton>
      </div>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <ToolbarButton ariaLabel="Download document">
          <Download size={14} aria-hidden />
        </ToolbarButton>
        <ToolbarButton ariaLabel="More actions">
          <MoreVertical size={14} aria-hidden />
        </ToolbarButton>
      </div>
    </div>
  )
}

function ToolbarButton({
  children,
  ariaLabel,
  onClick,
}: {
  children: React.ReactNode
  ariaLabel: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        border: 'none',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const pageNumberStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  minWidth: 36,
  textAlign: 'center',
}

function PdfThumbnailRail({
  page,
  totalPages,
  imageUrl,
  onSelect,
}: {
  page: number
  totalPages: number
  imageUrl?: string
  onSelect: (p: number) => void
}) {
  return (
    <div
      aria-label="Document thumbnails"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        overflowY: 'auto',
        padding: 4,
      }}
    >
      {Array.from({ length: totalPages }).map((_, i) => {
        const n = i + 1
        const isActive = n === page
        return (
          <button
            key={n}
            type="button"
            onClick={() => onSelect(n)}
            aria-label={`Go to page ${n}`}
            aria-current={isActive ? 'page' : undefined}
            style={{
              padding: 0,
              border: isActive
                ? '2px solid var(--color-primary-500)'
                : '1px solid var(--color-border-subtle)',
              borderRadius: 8,
              background: imageUrl
                ? `center / cover no-repeat url("${imageUrl}")`
                : 'var(--color-neutral-200)',
              aspectRatio: '3 / 4',
              cursor: 'pointer',
            }}
          />
        )
      })}
    </div>
  )
}

function PdfMainPage({ imageUrl }: { imageUrl?: string }) {
  return (
    <div
      role="img"
      aria-label="Document page preview"
      style={{
        borderRadius: 8,
        border: '1px solid var(--color-border-subtle)',
        background: imageUrl
          ? `center / cover no-repeat url("${imageUrl}")`
          : 'var(--color-neutral-200)',
        minHeight: 0,
      }}
    />
  )
}

/* ─── 2. Video (and Webinar Recording) ─────────────────────────────── */
//
// Figma node 19:487 (Video) + 19:3545 (Webinar Recording). Both
// variants use the same dark video frame with a poster image; the
// only difference at the body level is the runtime stamp.

export function VideoBody({
  resource,
  runtime = '0:00 / 0:53',
}: {
  resource: LibraryResource
  runtime?: string
}) {
  return (
    <div style={frameOuterStyle}>
      <div
        style={{
          ...frameInnerStyle,
          background: resource.imageUrl
            ? `center / cover no-repeat url("${resource.imageUrl}")`
            : '#000',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        <VideoControls runtime={runtime} />
      </div>
    </div>
  )
}

function VideoControls({ runtime }: { runtime: string }) {
  return (
    <div
      style={{
        width: '100%',
        padding: '10px 16px',
        background:
          'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.55) 100%)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        color: '#fff',
      }}
    >
      <PlayPauseButton />
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 12,
          fontWeight: 500,
          minWidth: 80,
        }}
      >
        {runtime}
      </span>
      <div
        aria-hidden
        style={{
          flex: 1,
          height: 4,
          background: 'rgba(255, 255, 255, 0.25)',
          borderRadius: 999,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: '4%',
            height: '100%',
            background: '#fff',
          }}
        />
      </div>
      <FullscreenButton />
      <MuteButton />
    </div>
  )
}

function PlayPauseButton() {
  return (
    <button
      type="button"
      aria-label="Play"
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        color: '#fff',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        <path d="M6 4 L20 12 L6 20 Z" fill="currentColor" />
      </svg>
    </button>
  )
}

function FullscreenButton() {
  return (
    <button
      type="button"
      aria-label="Toggle fullscreen"
      style={controlIconButtonStyle}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>
    </button>
  )
}

function MuteButton() {
  return (
    <button type="button" aria-label="Mute" style={controlIconButtonStyle}>
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
        <path
          d="M4 9 H8 L13 5 V19 L8 15 H4 Z"
          fill="currentColor"
        />
      </svg>
    </button>
  )
}

const controlIconButtonStyle: CSSProperties = {
  width: 24,
  height: 24,
  background: 'transparent',
  border: 'none',
  color: '#fff',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

/* ─── 3. Article ───────────────────────────────────────────────────── */
//
// Figma node 19:3640. Same dark frame as Video but with the
// article's hero image displayed cover-fit — no video controls.

export function ArticleBody({ resource }: { resource: LibraryResource }) {
  return (
    <div style={frameOuterStyle}>
      <div
        style={{
          ...frameInnerStyle,
          background: resource.imageUrl
            ? `center / cover no-repeat url("${resource.imageUrl}")`
            : 'var(--color-neutral-200)',
        }}
        role="img"
        aria-label={`${resource.title} — article preview`}
      />
    </div>
  )
}

/* ─── 4. E-book (magazine viewer) ──────────────────────────────────── */
//
// Figma node 19:3452. A magazine-style viewer with previous / next
// page arrows and a "page 1 of N" indicator. Body is the dark frame
// with the resource's image as the page preview.

export function EbookBody({ resource }: { resource: LibraryResource }) {
  const [page, setPage] = useState(1)
  const totalPages = 11

  return (
    <div style={{ ...frameOuterStyle, padding: 0, background: 'var(--color-cta-700)' }}>
      {/* Purple title bar — book title + page indicator on the left, search on
          the right (Figma node 19:3452). */}
      <div style={ebookBarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <span style={ebookBarTitleStyle}>{resource.title}</span>
          <span aria-hidden style={ebookBarDividerStyle} />
          <span style={ebookBarPageStyle}>
            page {page} of {totalPages}
          </span>
        </div>
        <button type="button" aria-label="Search this e-book" style={ebookBarIconStyle}>
          <Search size={16} aria-hidden />
        </button>
      </div>

      {/* Reader field — the current page (portrait) centered on the lavender
          field with prev/next page arrows. */}
      <div style={ebookFieldStyle}>
        <EbookPageArrow
          direction="prev"
          disabled={page === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        />
        <div
          role="img"
          aria-label={`${resource.title} — page ${page}`}
          style={{
            ...ebookPageStyle,
            background: resource.imageUrl
              ? `center / cover no-repeat url("${resource.imageUrl}")`
              : resource.heroBackground,
          }}
        />
        <EbookPageArrow
          direction="next"
          disabled={page === totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>

      {/* Bottom toolbar — thumbnails · comment · share · print · download ·
          zoom · fullscreen. Non-functional stubs (styled placeholder). */}
      <div style={ebookToolbarStyle}>
        <EbookToolButton label="Page thumbnails"><Grid size={16} aria-hidden /></EbookToolButton>
        <EbookToolButton label="Comments"><MessageCircle size={16} aria-hidden /></EbookToolButton>
        <EbookToolButton label="Share"><Share2 size={16} aria-hidden /></EbookToolButton>
        <EbookToolButton label="Print"><Printer size={16} aria-hidden /></EbookToolButton>
        <EbookToolButton label="Download"><Download size={16} aria-hidden /></EbookToolButton>
        <EbookToolButton label="Zoom in"><MagnifyingGlass size={16} aria-hidden /></EbookToolButton>
        <EbookToolButton label="Fullscreen">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M4 9 V4 H9 M15 4 H20 V9 M20 15 V20 H15 M9 20 H4 V15"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
        </EbookToolButton>
      </div>
    </div>
  )
}

function EbookPageArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: 'prev' | 'next'
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: '50%',
        background: 'rgba(255, 255, 255, 0.72)',
        border: 'none',
        color: 'var(--color-text-primary)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {direction === 'prev' ? <ArrowLeft size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />}
    </button>
  )
}

function EbookToolButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      style={{
        width: 32,
        height: 32,
        borderRadius: 'var(--radius-sm)',
        background: 'transparent',
        border: 'none',
        color: 'var(--color-text-secondary)',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

const ebookBarStyle: CSSProperties = {
  height: 44,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '0 16px',
  background: 'var(--color-cta-600)',
  color: 'var(--color-text-inverse)',
}

const ebookBarTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const ebookBarDividerStyle: CSSProperties = {
  width: 1,
  height: 18,
  background: 'rgb(255 255 255 / 0.4)',
  flexShrink: 0,
}

const ebookBarPageStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  opacity: 0.9,
}

const ebookBarIconStyle: CSSProperties = {
  width: 32,
  height: 32,
  flexShrink: 0,
  borderRadius: 'var(--radius-sm)',
  background: 'transparent',
  border: 'none',
  color: 'var(--color-text-inverse)',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const ebookFieldStyle: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 16,
  padding: '20px 16px',
  // Lavender/periwinkle reader field (Figma). A soft brand tint over white.
  background: 'color-mix(in srgb, var(--color-primary-300) 45%, var(--color-surface-card))',
}

const ebookPageStyle: CSSProperties = {
  height: '100%',
  aspectRatio: '3 / 4',
  maxWidth: '62%',
  borderRadius: 4,
  boxShadow: '0 6px 24px rgb(9 35 72 / 0.28)',
}

const ebookToolbarStyle: CSSProperties = {
  height: 48,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  background: 'var(--color-surface-card)',
  borderTop: '1px solid var(--color-border-subtle)',
}

/* ─── 5. Template (download-only) ──────────────────────────────────── */
//
// Figma node 19:584. No preview ships for templates — the body is a
// dark frame with a centered "Preview Unavailable" message + a
// Download CTA in primary-action color.

export function TemplateBody({
  downloadUrl,
}: {
  /** Real file URL (DOCX, XLSX, etc.) to trigger on click. When
   *  omitted the body still renders the same "Preview Unavailable"
   *  surface — the Download button just stays a stub. */
  downloadUrl?: string
}) {
  return (
    <div style={frameOuterStyle}>
      <div
        style={{
          ...frameInnerStyle,
          background: 'var(--color-neutral-200)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          padding: '40px 24px',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 360 }}>
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            Preview Unavailable.
          </p>
          <p
            style={{
              margin: '6px 0 0',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              color: 'var(--color-text-secondary)',
            }}
          >
            Download this file to view it.
          </p>
        </div>
        {downloadUrl ? (
          <a href={downloadUrl} download style={downloadButtonStyle}>
            <Download size={16} aria-hidden />
            Download
          </a>
        ) : (
          <button type="button" style={downloadButtonStyle}>
            <Download size={16} aria-hidden />
            Download
          </button>
        )}
      </div>
    </div>
  )
}

const downloadButtonStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  padding: '0 20px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
  border: 'none',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}
