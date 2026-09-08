import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { Modal } from '@/components/ui/Modal'
import { CalendarDay, Download, Printer } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { GridView } from './GridView'
import { TaskListView } from './TaskListView'
import { WeekGridView } from './WeekGridView'
import { StudyCalendarEmptyState } from './StudyCalendarEmptyState'
import { StudyCalendarLockedState } from './StudyCalendarLockedState'
import { CreateCalendarDemoHarness } from './CreateCalendarDemoHarness'
import { CreateCalendarPanelHarness } from './CreateCalendarPanelHarness'
import { hasStudyCalendarFor, studyCalendarFor } from '@/data/studyCalendarFixtures'
import { learningPathsFor } from '@/data/learningFixtures'

/** URL-driven view mode. Mirrors the two buttons in the view toggle.
 *  The third surface — the full week-grid calendar — has been promoted
 *  out of the toggle into a "View Calendar" modal action. */
type CalendarView = 'daily' | 'all-tasks'

const VIEWS: PillTabItem<CalendarView>[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'all-tasks', label: 'All Tasks' },
]

function parseView(raw: string | null): CalendarView {
  return raw === 'all-tasks' ? raw : 'daily'
}

/**
 * STC Study Calendar tab — task-level views (Daily / All Tasks /
 * Calendar). Three branches:
 *
 *   - **Non-Member STC**       → `StudyCalendarLockedState` overlays a
 *                                dimmed Daily preview with the
 *                                "Get STC membership" upsell.
 *   - **Member, no calendar**  → `StudyCalendarEmptyState`.
 *   - **Member, has calendar** → real panel.
 *
 * The view toggle (`?calView=daily|all-tasks|calendar`, default `daily`)
 * is URL-driven so a refresh / share-link preserves the active view.
 * Other URL params (e.g., `id`) are preserved on update; history
 * replaces rather than pushes so the back button still returns to the
 * previous page.
 *
 * Overall progress + exam-date snapshot lives on the **Progress Tracker**
 * tab via `StudyProgressPanel`. This panel is the action surface where
 * the learner picks the next task; the snapshot lives next door.
 */
export function StudyCalendarPanel({ pathId }: { pathId?: string } = {}) {
  const { brand, membership } = useAccount()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = parseView(searchParams.get('calView'))
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)

  // Demo-flow short-circuit: when the active path is the STC Create
  // Calendar demo, swap the entire panel for the harness — the harness
  // owns its own modal + empty-state combo and bypasses the regular
  // member / non-member / empty / locked branches. The check runs
  // BEFORE all other branches so the demo never reaches the
  // membership gate or the locked overlay.
  const activePath = useMemo(() => {
    const all = learningPathsFor(brand)
    return all.find((p) => p.id === pathId) ?? null
  }, [brand, pathId])
  if (
    activePath?.kind === 'demo' &&
    activePath.demoFlow === 'create-calendar' &&
    pathId
  ) {
    return <CreateCalendarDemoHarness pathId={pathId} />
  }
  if (
    activePath?.kind === 'demo' &&
    activePath.demoFlow === 'create-calendar-panel' &&
    pathId
  ) {
    return <CreateCalendarPanelHarness pathId={pathId} />
  }
  const setView = (next: CalendarView) => {
    setSearchParams(
      (prev) => {
        const merged = new URLSearchParams(prev)
        if (next === 'daily') merged.delete('calView')
        else merged.set('calView', next)
        return merged
      },
      { replace: true },
    )
  }

  // Re-derive the calendar when the active path changes. Memoized on
  // pathId so each path that has a calendar gets its own copy — the
  // Series 63 path is intentionally rewritten to a zero-progress
  // variant inside `studyCalendarFor`.
  const hasCalendar = hasStudyCalendarFor(brand, pathId)
  const calendar = useMemo(
    () => (hasCalendar ? studyCalendarFor(pathId) : null),
    [hasCalendar, pathId],
  )

  // Non-Member STC — render the locked-state overlay over a dimmed
  // Daily preview so reviewers see what they're getting when they
  // upgrade.
  if (brand === 'stc' && membership === 'non-member') {
    const previewCalendar = calendar ?? studyCalendarFor(pathId)
    return (
      <StudyCalendarLockedState
        preview={<GridView calendar={previewCalendar} />}
      />
    )
  }

  // Member STC on a path without a calendar — empty state.
  if (!calendar) return <StudyCalendarEmptyState />

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toolbar — view toggle + Download/Print. The whole row is
          tagged with `cre-study-calendar-print-hide` so when the
          learner prints from inside the Study Calendar tab, the printed
          sheet shows the calendar grid alone (no view-toggle chrome). */}
      <div
        className="cre-study-calendar-print-hide"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <PillTabs items={VIEWS} active={view} onChange={setView} label="Calendar view" />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 20 }}>
          <LinkAction
            icon={<CalendarDay size={14} aria-hidden />}
            label="View Calendar"
            onClick={() => setCalendarModalOpen(true)}
          />
          <LinkAction icon={<Download size={14} aria-hidden />} label="Download" />
          <LinkAction icon={<Printer size={14} aria-hidden />} label="Print" />
        </div>
      </div>

      {/* `cre-study-calendar-views` lets the print stylesheet target
          interactive chrome (the view toggle + Download/Print links
          above) and hide it when printing. */}
      <div className="cre-study-calendar-views">
        {view === 'daily' && <GridView calendar={calendar} />}
        {view === 'all-tasks' && <TaskListView calendar={calendar} />}
      </div>

      <Modal
        open={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        title="Study Calendar"
        width={1120}
      >
        <div style={{ padding: '20px 24px 24px' }}>
          <WeekGridView
            calendar={calendar}
            hideWeekendToggle
            headerActions={
              <>
                <LinkAction icon={<Download size={14} aria-hidden />} label="Download" />
                <LinkAction icon={<Printer size={14} aria-hidden />} label="Print" />
              </>
            }
          />
        </div>
      </Modal>
    </section>
  )
}

function LinkAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="cre-link-action cre-study-calendar-print-hide"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: 0,
        background: 'transparent',
        border: 'none',
        color: 'var(--color-action)',
        fontFamily: 'var(--font-body)',
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {icon}
      {label}
    </button>
  )
}

