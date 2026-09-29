import { GET_LICENSED_STEPS } from './nyProducerRequirements'

/**
 * EXAM DETAILS — the menu's rows, and the demo FAQ behind the third one.
 *
 * Split from `ExamDetailsPanel.tsx` because that file may only export
 * components (`react-refresh/only-export-components`), and because the FAQ is
 * authored content, which is what `src/data/` is for.
 */

/** Sentinel ids on the `onOpenStep` channel. ⚠ NOT `LicensingStep`s, and
 *  deliberately not added to `GET_LICENSED_STEPS` — they name sheets, not steps
 *  in the licensing sequence. `MembershipOverview` peels them off before the
 *  step lookup; miss that and they fall through to an empty sheet. */
export const EXAM_DETAILS_STEP_ID = 'exam-details'
export const EXAM_FAQ_STEP_ID = 'exam-faq'

type Row = {
  /** Sentinel or real `LicensingStep` id, passed straight back to `onSelect`. */
  id: string
  label: string
  /** One line under the label. Pulled from the step's own `detail` where a step
   *  owns the content, so the menu cannot drift from the sheet it opens. */
  detail: string
}

function stepDetail(id: string, fallback: string): string {
  return GET_LICENSED_STEPS.find((s) => s.id === id)?.detail ?? fallback
}

export function examDetailRows(): Row[] {
  return [
    {
      id: 'schedule-exam',
      /* "or reschedule" is the half that earns the row. Booking is a one-time
         act most learners have already done by the time they look; changing a
         booking is the recurring one, and it was not named anywhere. */
      label: 'How to schedule or reschedule your exam',
      detail: stepDetail('schedule-exam', 'Schedule your exam when you’re ready.'),
    },
    {
      id: 'pass-exam',
      label: 'What to expect on your exam',
      detail: stepDetail('pass-exam', '150 questions in 150 minutes. 70% to pass.'),
    },
    {
      id: EXAM_FAQ_STEP_ID,
      label: 'Common questions',
      detail: 'Rescheduling, results, retakes and what to bring.',
    },
  ]
}

/* ─── common questions ─────────────────────────────────────────────────────

   ⚠ DEMO CONTENT, and the only invented text in this flow. Rows 1 and 2 of the
   menu open XCEL's own published requirements copy; these five are written to
   make the third row show something real-shaped while the actual answers are
   sourced. They are plausible rather than authoritative — the fee, the retake
   wait and the ID rule in particular must be checked against PSI and DFS before
   this is shown to a learner. `nyProducerRequirements` is the file that owns
   real published figures; nothing here should be copied into it. */

export const EXAM_FAQ: { q: string; a: string }[] = [
  {
    q: 'Can I reschedule my exam after booking?',
    a: 'Yes. PSI allows a reschedule up to two days before your appointment at no charge. Inside that window the exam fee is forfeited and you book again as a new sitting.',
  },
  {
    q: 'When do I get my results?',
    a: 'Immediately. You get a pass or fail on screen at the test centre before you leave, and a printed score report on the way out. A fail report breaks the score down by section so you know where to study.',
  },
  {
    q: 'What happens if I do not pass?',
    a: 'You can retake it. There is no limit on attempts, but you wait at least 24 hours between sittings and pay the exam fee again each time. Your course completion stays valid.',
  },
  {
    q: 'What do I need to bring?',
    a: 'Two forms of signature ID, one of them photographic and government-issued, with the name matching your registration exactly. Your certificate of course completion is filed electronically, so you do not need to bring it.',
  },
  {
    q: 'How long is my course completion good for?',
    a: 'Your completion certificate is valid for one year from the date you finish the course. If you have not passed the state exam in that time, the coursework has to be retaken.',
  },
]

