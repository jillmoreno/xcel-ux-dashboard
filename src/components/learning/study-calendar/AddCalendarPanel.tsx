import { CalendarSettingsSheet } from './CalendarSettingsSheet'
import {
  STUDY_CALENDAR_TODAY,
  type StudyCalendar,
} from '@/data/studyCalendarFixtures'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (next: {
    examDate: string
    startDate: string
    daysPerWeek: number
    bufferDays: number
    excludeNYSEHolidays: boolean
  }) => void
}

/**
 * First-setup variant of the Edit Calendar slide-over. Wraps
 * `CalendarSettingsSheet` with a blank-defaults `StudyCalendar` and
 * "Add" copy overrides so reviewers see the same panel pattern but with
 * the affordance to *create* a calendar from scratch.
 *
 * Defaults: today as start date, blank exam date (validation immediately
 * prompts the user to pick one), 5 days/week, no buffer, NYSE holidays
 * excluded. Save is owned by the parent — typically a demo-flow harness
 * that fires a toast without persisting.
 */
const BLANK_CALENDAR: StudyCalendar = {
  id: 'series-79-add-pending',
  name: 'Series 79 · Pending Plan',
  examName: 'Series 79 Investment Banking Representative',
  examDate: '',
  startDate: STUDY_CALENDAR_TODAY,
  daysPerWeek: 5,
  bufferDays: 0,
  excludeNYSEHolidays: true,
  locked: false,
  tasks: [],
}

export function AddCalendarPanel({ open, onClose, onSave }: Props) {
  return (
    <CalendarSettingsSheet
      open={open}
      onClose={onClose}
      calendar={BLANK_CALENDAR}
      onSave={onSave}
      title="Add study calendar"
      description="Set your study schedule — task due dates will be generated when you save."
      primaryLabel="Add calendar"
      startDateHint="Defaults to today"
    />
  )
}
