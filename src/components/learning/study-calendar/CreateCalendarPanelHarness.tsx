import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Toast } from '@/components/ui/Toast'
import { AddCalendarEmptyState } from './AddCalendarEmptyState'
import { CreateCalendarPanel } from './CreateCalendarPanel'
import { DEFAULT_STUDY_DAYS } from './CreateCalendarModal/StudyDaysToggle'
import { STUDY_CALENDAR_TODAY } from '@/data/studyCalendarFixtures'
import type { CreateCalendarFormState } from './CreateCalendarModal/CreateCalendarModal'

/**
 * Panel-flavored variant of the Create Calendar demo. Mirrors
 * `CreateCalendarDemoHarness` (the modal flow) but renders inside the
 * shared right-anchored slide-over pattern instead of a centered modal.
 * The underlying empty state stays mounted so reviewers see what the
 * tab looks like before / after the panel.
 *
 * Behavior contract:
 *   - Empty state surfaces a "Create calendar" CTA that opens the
 *     panel on demand (NOT auto-opened on mount — distinct from the
 *     modal demo which opens immediately).
 *   - On Save: log payload, fire toast, close panel, reset form.
 *   - On × / Esc / Cancel: close silently, leave form state intact so
 *     reopening continues where the reviewer left off.
 *   - No persistence whatsoever.
 */
const INITIAL_FORM_STATE: CreateCalendarFormState = {
  assignedCalendarId: '',
  omitNyseHolidays: false,
  // Pre-fill with the canonical demo "today" so the field never reads
  // blank — replaces the older "Defaults to today if left blank" helper
  // text by making the default explicit in the UI itself.
  startDate: STUDY_CALENDAR_TODAY,
  studyDays: DEFAULT_STUDY_DAYS,
  // Blank by default — most learners don't know their exam date when
  // they first set up the calendar. The availability filter stays
  // open until the learner picks one.
  targetExamDate: '',
}

export function CreateCalendarPanelHarness({ pathId }: { pathId?: string } = {}) {
  const [searchParams] = useSearchParams()
  // Auto-open the panel when the URL carries `?openPanel=create` —
  // lets capture / demo flows show the panel without a click.
  const [isPanelOpen, setIsPanelOpen] = useState(
    () => searchParams.get('openPanel') === 'create',
  )
  const [formState, setFormState] = useState<CreateCalendarFormState>(
    INITIAL_FORM_STATE,
  )
  const [toastOpen, setToastOpen] = useState(false)

  const handleChange = useCallback(
    (patch: Partial<CreateCalendarFormState>) => {
      setFormState((prev) => ({ ...prev, ...patch }))
    },
    [],
  )

  const handleSave = useCallback((state: CreateCalendarFormState) => {
    console.info('demo:create-calendar-panel:save', state)
    setToastOpen(true)
    setIsPanelOpen(false)
    setFormState(INITIAL_FORM_STATE)
  }, [])

  const handleClose = useCallback(() => {
    setIsPanelOpen(false)
  }, [])

  return (
    <>
      <AddCalendarEmptyState onCreateCalendar={() => setIsPanelOpen(true)} />
      <CreateCalendarPanel
        open={isPanelOpen}
        onClose={handleClose}
        onSave={handleSave}
        formState={formState}
        onChange={handleChange}
        pathId={pathId}
      />
      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        tone="success"
        title="Study plan created"
        duration={2500}
      >
        Demo save — your settings weren&rsquo;t persisted.
      </Toast>
    </>
  )
}
