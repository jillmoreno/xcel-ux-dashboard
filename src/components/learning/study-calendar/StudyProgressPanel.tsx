import { useState } from 'react'
import { ExamDateCard } from './ExamDateCard'
import { ProgressCard } from './ProgressCard'
import { CalendarSettingsSheet } from './CalendarSettingsSheet'
import { Toast } from '@/components/ui/Toast'
import { studyCalendarFor, type StudyCalendar } from '@/data/studyCalendarFixtures'

/**
 * STC Progress Tracker tab — overall study-plan snapshot for the active
 * Learning Path. Renders the Progress card (donut + task breakdown + pacing
 * meta) alongside the Exam Date card (time-to-exam + tear-off calendar).
 *
 * Edit on either card opens the same Calendar Settings sheet which lets the
 * learner change exam date, start date, days/week, buffer days, and NYSE
 * holiday handling.
 */
export function StudyProgressPanel({ pathId }: { pathId?: string } = {}) {
  // Per-path study plan — STC Series 63 surfaces the zero-completion
  // variant; everything else falls back to the default Series 79 plan.
  const [calendar, setCalendar] = useState<StudyCalendar>(() => studyCalendarFor(pathId))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [toastOpen, setToastOpen] = useState(false)

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          gap: 20,
          alignItems: 'stretch',
        }}
      >
        <ProgressCard calendar={calendar} onEdit={() => setSettingsOpen(true)} />
        <ExamDateCard calendar={calendar} onEdit={() => setSettingsOpen(true)} />
      </div>

      <CalendarSettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        calendar={calendar}
        pathId={pathId}
        onSave={(next) => {
          console.info('calendar:edit:save', next)
          setCalendar((c) => ({
            ...c,
            examDate: next.examDate,
            startDate: next.startDate,
            daysPerWeek: next.daysPerWeek,
            bufferDays: next.bufferDays,
            excludeNYSEHolidays: next.excludeNYSEHolidays,
          }))
          setToastOpen(true)
        }}
      />

      <Toast
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        tone="success"
        title="Study plan updated"
        duration={2500}
      >
        Your task due dates have been recalculated.
      </Toast>
    </section>
  )
}
