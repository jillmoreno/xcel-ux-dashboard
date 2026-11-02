import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Printer, X } from '@/icons'
import { PrototypeBar } from '@/components/layout/PrototypeBar'

/**
 * THE PDF-VIEWER CHROME — the dark toolbar, the page shadow, the way out.
 *
 * ⚠ EXTRACTED FROM `PrintViewPage` ON 2026-11-02, unchanged, when Transcripts
 * needed a print view of its own. Every value below is that page's; this is a
 * lift, not a redesign, and the Study Calendar renders identically through it.
 * The reason to share rather than copy is the one `StatusRow` and `CourseMeta`
 * already record: two print views that drift apart are two different products
 * pretending to be one.
 *
 * It mimics a browser's own PDF viewer — Chrome/Edge/Firefox styling — so a
 * new tab reads as a DOCUMENT rather than another app route. That is why the
 * three colours are hardcoded: they are PDF.js's, not this product's, and a
 * brand token here would make the chrome follow the Brand control, which is
 * exactly wrong for something imitating the browser.
 *
 * Download and Print both call `window.print()`; the browser's own dialog is
 * what actually saves the PDF, so there is one real action behind two labels.
 * That is deliberate — a learner looking for "download" and a learner looking
 * for "print" are both served, and neither is lied to.
 */
export function PrintDocumentShell({
  filename,
  heading,
  closeTo,
  children,
}: {
  /** The tab title and the toolbar's filename, e.g. `Transcript — Jordan Navarro.pdf`. */
  filename: string
  /** The document's own `<h1>`, printed at the top of the page. */
  heading: string
  /**
   * WHERE CLOSE LANDS WHEN THE TAB WILL NOT CLOSE ITSELF.
   *
   * ⚠ THE FALLBACK IS THE LOAD-BEARING HALF. These tabs are opened with
   * `noopener`, so most browsers refuse `window.close()` — without somewhere to
   * navigate, Close would do nothing at all. It is a per-caller route because
   * the document came from somewhere specific, and the browser focusing
   * whichever sibling tab was last active is how a learner ends up on the
   * Dashboard wondering what happened.
   */
  closeTo: string
  children: ReactNode
}) {
  const navigate = useNavigate()

  useEffect(() => {
    document.title = filename
  }, [filename])

  const handleClose = () => {
    // Attempt the self-dismiss first so a browser that allows it closes
    // cleanly, then defer a tick so that close (if it won) beats the
    // navigation, which would otherwise flicker the fallback page in.
    window.close()
    setTimeout(() => navigate(closeTo, { replace: true }), 0)
  }

  return (
    <div style={{ minHeight: '100vh', background: VIEWER_BG, display: 'flex', flexDirection: 'column' }}>
      {/* The way back out of a chrome-less tab (house → gateway home).
          Print-hidden so it never lands in the saved PDF. */}
      <div className="cre-print-hide cre-study-calendar-print-hide">
        <PrototypeBar />
      </div>

      <header className="cre-print-hide cre-study-calendar-print-hide" style={toolbarStyle}>
        <div style={filenameStyle}>
          <span aria-hidden style={pdfBadgeStyle}>
            PDF
          </span>
          <span style={filenameTextStyle}>{filename}</span>
        </div>
        <div style={toolbarActionsStyle}>
          <ToolbarAction icon={<Download size={18} aria-hidden />} label="Download" onClick={() => window.print()} />
          <ToolbarAction icon={<Printer size={18} aria-hidden />} label="Print" onClick={() => window.print()} />
          <ToolbarAction icon={<X size={18} aria-hidden />} label="Close" onClick={handleClose} />
        </div>
      </header>

      {/* The document page — a white card with a shadow, centred in the grey
          viewer body, as a PDF page renders inside PDF.js. */}
      <div style={viewerBodyStyle}>
        <div style={documentPageStyle}>
          <h1 style={headingStyle}>{heading}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}

function ToolbarAction({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={toolbarActionStyle}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.12)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {icon}
    </button>
  )
}

/* ─── PDF-viewer chrome colours (intentionally hardcoded — these are Chrome
       PDF.js's, not this product's; see the note at the top) ────────────── */
const TOOLBAR_BG = '#323639'
const TOOLBAR_FG = '#e8eaed'
const VIEWER_BG = '#525659'

const toolbarStyle: CSSProperties = {
  background: TOOLBAR_BG,
  color: TOOLBAR_FG,
  height: 48,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  borderBottom: '1px solid rgba(0,0,0,0.4)',
}

const filenameStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  color: TOOLBAR_FG,
}

const pdfBadgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#d93025',
  color: '#fff',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.05em',
  padding: '2px 5px',
  borderRadius: 2,
  flexShrink: 0,
}

const filenameTextStyle: CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const toolbarActionsStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
}

const toolbarActionStyle: CSSProperties = {
  width: 36,
  height: 36,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'transparent',
  border: 'none',
  borderRadius: 4,
  color: TOOLBAR_FG,
  cursor: 'pointer',
  transition: 'background 120ms ease',
}

const viewerBodyStyle: CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  padding: '24px 24px 64px',
  overflowY: 'auto',
}

const documentPageStyle: CSSProperties = {
  width: '100%',
  maxWidth: 1100,
  background: 'var(--color-surface-card)',
  borderRadius: 4,
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  padding: '40px 48px 56px',
}

const headingStyle: CSSProperties = {
  margin: '0 0 24px',
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}
