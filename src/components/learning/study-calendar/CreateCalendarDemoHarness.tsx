import { useCallback, useState } from 'react'
import { Toast } from '@/components/ui/Toast'
import { StudyCalendarEmptyState } from './StudyCalendarEmptyState'
import { CreateCalendarModal } from './CreateCalendarModal/CreateCalendarModal'
import { useResetCalendarOnMount } from './CreateCalendarModal/useResetCalendarOnMount'
import { DEFAULT_STUDY_DAYS } from './CreateCalendarModal/StudyDaysToggle'
import type { CreateCalendarFormState } from './CreateCalendarModal/CreateCalendarModal'

/**
 * STC Create Calendar **demo flow** scaffold.
 *
 * Renders for the `stc-create-calendar-demo` learning path only. The
 * underlying tab shows `StudyCalendarEmptyState` so when the modal
 * eventually closes, the "no calendar yet" surface is what's
 * revealed underneath — visually reading as "I haven't set one up
 * yet."
 *
 * Behavior contract:
 *
 *   - On mount (and on every path change): wipe form state, open the
 *     modal. The reviewer always sees the pristine "just opened"
 *     state.
 *   - On Save: log to console, fire a "Demo save — not persisted"
 *     toast, close the modal, reset the form. Do not auto-reopen on
 *     save — the user explicitly chose to commit.
 *   - On × / Esc: close the modal silently (no toast). Form state
 *     stays cleared.
 *   - On backdrop click: no-op (matches production; enforced via
 *     `Modal.disableBackdropClose`).
 *   - **No persistence whatsoever** — no localStorage, no API calls.
 */
const INITIAL_FORM_STATE: CreateCalendarFormState = {
  assignedCalendarId: '',
  omitNyseHolidays: false,
  startDate: '',
  studyDays: DEFAULT_STUDY_DAYS,
  // Legacy modal flow doesn't expose this field yet — kept blank
  // here for type compatibility with the shared FormState shape.
  targetExamDate: '',
}

export function CreateCalendarDemoHarness({
  pathId,
}: {
  pathId: string
}) {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [formState, setFormState] = useState<CreateCalendarFormState>(
    INITIAL_FORM_STATE,
  )
  const [toastOpen, setToastOpen] = useState(false)

  const reset = useCallback(() => {
    setFormState(INITIAL_FORM_STATE)
    setIsModalOpen(true)
    setToastOpen(false)
  }, [])

  // Re-fire `reset` on initial mount AND any time `pathId` changes.
  // Combined with React Router's route-keyed re-render, this means
  // every visit to the demo path opens a fresh modal.
  useResetCalendarOnMount(pathId, reset)

  const handleChange = useCallback(
    (patch: Partial<CreateCalendarFormState>) => {
      setFormState((prev) => ({ ...prev, ...patch }))
    },
    [],
  )

  const handleSave = useCallback((state: CreateCalendarFormState) => {
    // Demo save — never hits the network. Log the payload so a
    // reviewer can see the form's output in DevTools, surface a
    // toast to acknowledge the click, then close + reset.
    console.info('demo:create-calendar:save', state)
    setToastOpen(true)
    setIsModalOpen(false)
    setFormState(INITIAL_FORM_STATE)
  }, [])

  // Provide a stable handler so the modal's `onClose` doesn't churn
  // every render — the Modal's `useEffect` for keyboard listeners
  // would otherwise tear down + re-attach on every render.
  const handleClose = useCallback(() => {
    setIsModalOpen(false)
  }, [])

  return (
    <>
      <StudyCalendarEmptyState />
      <CreateCalendarModal
        open={isModalOpen}
        onClose={handleClose}
        onSave={handleSave}
        formState={formState}
        onChange={handleChange}
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
