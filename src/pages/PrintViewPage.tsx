import { useSearchParams } from 'react-router-dom'
import { studyCalendarFor } from '@/data/studyCalendarFixtures'
import { WeekGridView } from '@/components/learning/study-calendar/WeekGridView'
import { TaskListTable } from '@/components/learning/study-calendar/TaskListTable'
import { PrintDocumentShell } from '@/components/layout/PrintDocumentShell'

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
 * ⚠ THE CHROME MOVED OUT ON 2026-11-02 — toolbar, page shadow, filename and
 * the three actions now live in `PrintDocumentShell`, which Transcripts prints
 * through as well. Nothing here changed visually; what is left in this file is
 * the one decision that is this page's own, which calendar to draw, and where
 * Close lands.
 */
export function PrintViewPage() {
  const [searchParams] = useSearchParams()
  const pathId = searchParams.get('pathId') ?? undefined
  const view = parseView(searchParams.get('view'))
  const calendar = studyCalendarFor(pathId)

  const heading =
    view === 'tasks'
      ? `Task List — ${calendar.examName}`
      : `Study Calendar — ${calendar.examName}`

  return (
    <PrintDocumentShell
      filename={`${heading}.pdf`}
      heading={heading}
      /* Back to the Learning Path this printed from, not the Dashboard — see
         `closeTo` on the shell for why the fallback carries the weight. */
      closeTo={pathId ? `/my-learning/path?id=${encodeURIComponent(pathId)}` : '/my-learning/path'}
    >
      {view === 'tasks' ? (
        <TaskListTable calendar={calendar} />
      ) : (
        <WeekGridView calendar={calendar} hideWeekendToggle />
      )}
    </PrintDocumentShell>
  )
}
