import type { Binding } from '@/lib/studyPace'
import { EXAM_BUFFER_DAYS, formatPaceDateLong } from '@/lib/studyPace'

/**
 * WHY NO STUDY PACE FITS — one wording, 2026-10-19 (Jillienne, after the
 * Atlas Home told her to extend access when her EXAM was the problem).
 *
 * ⚠ THE CARD WAS BLAMING THE WRONG CEILING, and giving advice that could not
 * work. `resolveCeiling` picks the SOONER of two deadlines — the access
 * window and the exam date — and records which one won in `binding`
 * precisely "so the UI can explain itself instead of silently switching".
 * Both cards ignored that and said "Not enough access left … Extend your
 * access to get a plan" whichever one had bound. With an exam three days out
 * and a month of access left, every word of that was false, and the one
 * instruction in it would have changed nothing.
 *
 * ⚠ THE EXAM ARM OFFERS A DIFFERENT FIX (2026-10-21). It offered none for a
 * while, on the argument that a booked exam is not something a learner can buy
 * more of and that suggesting "move your exam" would be advice about someone
 * else's calendar. The gap in that: rescheduling is the learner's own move,
 * and it is the only thing that clears this state. Access says extend your
 * access; the exam says reschedule the exam. Both are things the person
 * reading can actually do.
 *
 * ⚠ `both` TAKES THE EXAM'S SILENCE. When the two ceilings land on the same
 * day, extending access still buys nothing — the exam is there either way —
 * so offering the access fix would be the original bug in a rarer costume.
 *
 * ⚠ NO REASON MEANS ACCESS, which is not a guess: a model with no exam date
 * can only be access-bound, and that is the caller that passes nothing. It
 * is also what both cards said before this existed, so a surface that has
 * not been taught to pass a reason reads exactly as it did.
 */
export type NoPaceReason = {
  binding: Binding
  /** Days from today to the binding ceiling — the model's `daysToCeiling`.
   *  ⚠ CAN BE NEGATIVE: an exam closer than the review buffer puts the
   *  coursework deadline in the past, which is one way to reach this state. */
  days: number
  /**
   * The ceiling itself — the model's `hardEndIso`.
   *
   * ⚠ ON THE EXAM ARM THIS IS NOT THE EXAM DATE. `resolveCeiling` subtracts
   * `EXAM_BUFFER_DAYS` from it: `hardEndIso` is "the last day coursework may
   * finish", a week earlier. The first draft of this file printed it as the
   * exam and told a learner sitting an exam on May 14 that it was "today —
   * May 7". The copy below says what the date IS.
   */
  dateIso: string
}

export type NoPaceMessage = {
  /** The bold line: which deadline is the problem. */
  title: string
  /** The explanation under it. */
  note: string
  /** What to do about it — absent when there is nothing honest to suggest. */
  advice?: string
}

const ACCESS: NoPaceMessage = {
  title: 'Not enough access left',
  note: 'No study pace fits in the time remaining.',
  advice: 'Extend your access to get a plan.',
}

export function noPaceMessage(reason?: NoPaceReason): NoPaceMessage {
  if (!reason || reason.binding === 'access' || reason.binding === 'none') return ACCESS
  /* ⚠ NO COUNTDOWN. The obvious sentence is "your exam is in N days", and it
     is the wrong one twice over: the model hands over the COURSEWORK
     deadline rather than the exam, and `days` to it goes negative as soon as
     the exam is nearer than the buffer — which is most of the ways into this
     state. A date and what it means survives both. */
  return {
    title: 'Not enough time before your exam',
    note: `There isn’t enough time to complete your coursework before your exam date. Coursework has to finish by ${formatPaceDateLong(reason.dateIso)}, ${EXAM_BUFFER_DAYS} days before the exam, to leave time to review.`,
    /* ⚠ THE EXAM ARM HAS ADVICE NOW (2026-10-21, the direct wording). The note
       above this function still argues it should not: "a booked exam is not
       something a learner can buy more of, and inventing an equivalent would
       be advice about someone else's calendar." That reasoning had one gap —
       rescheduling the exam is the learner's own move, not someone else's, and
       it is the only thing that actually clears this state. Naming it beats
       naming the deadline and stopping. */
    advice: 'Consider rescheduling your exam to allow more time to finish.',
  }
}
