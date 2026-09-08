import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { studyCalendarFor } from '@/data/studyCalendarFixtures'
import { WeekGridView } from '@/components/learning/study-calendar/WeekGridView'
import { TaskListTable } from '@/components/learning/study-calendar/TaskListTable'
import { PrototypeBar } from '@/components/layout/PrototypeBar'
import { Download, Printer, X } from '@/icons'

type PrintViewKind = 'calendar' | 'tasks'

function parseView(raw: string | null): PrintViewKind {
  return raw === 'tasks' ? 'tasks' : 'calendar'
}

/**
 * Browser-style PDF viewer for the Study Calendar grid or Task List.
 * Opened in a new tab from the Study Calendar tab's View Calendar /
 * View Task List actions — the dark toolbar + page-shadow chrome
 * mimics a native browser PDF viewer (Chrome / Edge / Firefox style)
 * so the new tab reads as a document, not a regular app route.
 *
 * Sits OUTSIDE the AppLayout in `App.tsx` so the new tab opens without
 * the app's own header / nav / cart chrome.
 *
 * Toolbar actions:
 *   - Filename on the left (mirrors the browser's PDF.js title).
 *   - Download + Print fire `window.print()` — the browser's native
 *     dialog handles Save-as-PDF.
 *   - Close attempts `window.close()` first (works when the browser
 *     considers this tab script-opened) and, as a fallback, navigates
 *     the current tab back to the Learning Path the print view came
 *     from. Without the fallback the user can end up on the Dashboard
 *     because the browser focuses whichever sibling tab was most
 *     recently active — not necessarily the Learning Path.
 */
export function PrintViewPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const pathId = searchParams.get('pathId') ?? undefined
  const view = parseView(searchParams.get('view'))
  const calendar = studyCalendarFor(pathId)

  const heading =
    view === 'tasks'
      ? `Task List — ${calendar.examName}`
      : `Study Calendar — ${calendar.examName}`
  const filename = `${heading}.pdf`

  useEffect(() => {
    document.title = filename
  }, [filename])

  const handleClose = () => {
    // Try to self-dismiss the tab. `window.open` was called with
    // `noopener,noreferrer`, so most browsers refuse this — that's
    // why the fallback navigation below exists. We still attempt it
    // first so a browser that does allow it can close cleanly.
    window.close()
    // Defer one tick so close() (if it succeeded) wins the race
    // before React Router runs a navigation that would otherwise
    // flicker the new page in.
    setTimeout(() => {
      const target = pathId
        ? `/my-learning/path?id=${encodeURIComponent(pathId)}`
        : '/my-learning/path'
      navigate(target, { replace: true })
    }, 0)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: VIEWER_BG,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Prototype header — gives a way back out of the chrome-less PDF
          tab (house → gateway home). Print-hidden so it never lands in
          the saved PDF. */}
      <div className="cre-study-calendar-print-hide">
        <PrototypeBar />
      </div>

      {/* PDF viewer toolbar — dark gray bar with the filename on the
          left and Download / Print / Close actions on the right.
          `cre-study-calendar-print-hide` keeps it off the printed PDF. */}
      <header className="cre-study-calendar-print-hide" style={toolbarStyle}>
        <div style={filenameStyle}>
          <span aria-hidden style={pdfBadgeStyle}>
            PDF
          </span>
          <span style={filenameTextStyle}>{filename}</span>
        </div>
        <div style={toolbarActionsStyle}>
          <ToolbarAction
            icon={<Download size={18} aria-hidden />}
            label="Download"
            onClick={() => window.print()}
          />
          <ToolbarAction
            icon={<Printer size={18} aria-hidden />}
            label="Print"
            onClick={() => window.print()}
          />
          <ToolbarAction
            icon={<X size={18} aria-hidden />}
            label="Close"
            onClick={handleClose}
          />
        </div>
      </header>

      {/* Document page — white card with a subtle shadow, centered in
          the gray viewer body. Mirrors how a PDF page renders inside
          Chrome's PDF.js viewer. */}
      <div style={viewerBodyStyle}>
        <div style={documentPageStyle}>
          <h1 style={headingStyle}>{heading}</h1>
          {view === 'tasks' ? (
            <TaskListTable calendar={calendar} />
          ) : (
            <WeekGridView calendar={calendar} hideWeekendToggle />
          )}
        </div>
      </div>
    </div>
  )
}

function ToolbarAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      style={toolbarActionStyle}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background =
          'rgba(255, 255, 255, 0.12)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
      }}
    >
      {icon}
    </button>
  )
}

/* ─── PDF-viewer chrome colors (intentionally hardcoded — matches
       Chrome PDF.js styling rather than brand tokens) ────────────── */
const TOOLBAR_BG = '#323639'
const TOOLBAR_FG = '#e8eaed'
const VIEWER_BG = '#525659'

const toolbarStyle: React.CSSProperties = {
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

const filenameStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  minWidth: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
  color: TOOLBAR_FG,
}

const pdfBadgeStyle: React.CSSProperties = {
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

const filenameTextStyle: React.CSSProperties = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const toolbarActionsStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 2,
}

const toolbarActionStyle: React.CSSProperties = {
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

const viewerBodyStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  justifyContent: 'center',
  padding: '24px 24px 64px',
  overflowY: 'auto',
}

const documentPageStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 1100,
  background: 'var(--color-surface-card)',
  borderRadius: 4,
  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  padding: '40px 48px 56px',
}

const headingStyle: React.CSSProperties = {
  margin: '0 0 24px',
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 22,
  lineHeight: '28px',
  color: 'var(--color-text-primary)',
}
