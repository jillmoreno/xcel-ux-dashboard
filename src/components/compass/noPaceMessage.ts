import type { Binding } from '@/lib/studyPace'

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
   * ⚠ NOTHING PRINTS THIS, and that is deliberate (2026-10-21) — see the
   * copy below. It stays on the shape, as `days` does, because it is what
   * every caller already has to hand and the moment this copy wants a date
   * again it is the only one that is safe to print.
   *
   * ⚠ IT IS NOT THE EXAM DATE. `resolveCeiling` subtracts `EXAM_BUFFER_DAYS`
   * from it: `hardEndIso` is "the last day coursework may finish", a week
   * earlier. The first draft of this file printed it as the exam and told a
   * learner sitting an exam on May 14 that it was "today — May 7". Anything
   * that prints it has to say what the date IS.
   */
  dateIso: string
  /**
   * DAYS TO THE EXAM ITSELF — 2026-11-03, for "Your Exam is in 32 days."
   *
   * ⚠ IT IS NOT `days`, AND IT MUST NOT BE DERIVED FROM IT. `days` counts to
   * the COURSEWORK deadline, which `resolveCeiling` sets a review buffer
   * earlier than the exam. The two differ by exactly `EXAM_BUFFER_DAYS` today,
   * so `days + 7` would be right — and it is still the wrong way to get this
   * number. That inference is the bug this file was written after: a first
   * draft printed the coursework deadline as the exam and told a learner
   * sitting on May 14 that it was "today — May 7". A buffer that ever becomes
   * per-course, or a ceiling that stops being the exam's, breaks the
   * derivation silently and prints a confident wrong date. So the caller,
   * which has the exam date in its hand, passes the count.
   *
   * ⚠ OPTIONAL, AND ABSENT MEANS SAY NOTHING. A caller that has not been
   * taught to pass it gets the note without the first sentence, rather than a
   * count invented out of the one that is here.
   */
  examDays?: number
}

export type NoPaceMessage = {
  /** The bold line: which deadline is the problem. */
  title: string
  /** The explanation under it. */
  note: string
  /** What to do about it — absent when there is nothing honest to suggest. */
  advice?: string
}

/**
 * THE ACCESS ARM COUNTS DOWN — 2026-11-03, Jillienne's wording: "Not Enough
 * Time Remaining / Your access expires in <33 days>. / Extend your access."
 *
 * ⚠ THE NUMBER IS THE POINT OF THE REWRITE. The old middle line — "No study
 * pace fits in the time remaining" — restated the heading without saying how
 * much time that was, so a learner had to go and look. `reason.days` is the
 * count to the binding ceiling and on this arm the ceiling IS the access
 * window, so it is the days until access ends and nothing has to be derived.
 *
 * ⚠ THE EXAM ARM STILL PRINTS NO COUNT, and must not start. Its `days` is to
 * the COURSEWORK deadline rather than the exam, and goes negative as soon as
 * the exam is nearer than the review buffer — see the note on `dateIso`.
 */
/**
 * ONE TITLE FOR BOTH ARMS — 2026-11-03, Jillienne, selecting the exam arm's
 * heading and replacing it with this one.
 *
 * ⚠ THE TITLE IS NO LONGER WHAT DISTINGUISHES THEM, and that is the thing to
 * keep hold of. This file exists because the card used to blame the wrong
 * ceiling (2026-10-19), and two different headings were how a learner could
 * tell at a glance which deadline had bound them. That job now belongs
 * entirely to the NOTE and the ADVICE — "Your access expires in 32 days" with
 * "Extend your access", against "There isn't enough time to complete your
 * coursework before your exam date" with "Consider rescheduling your exam".
 *
 * So the two arms must keep saying different things BELOW the heading. If a
 * later edit ever makes the notes converge as well, the original bug is back
 * with nothing on screen to reveal it.
 */
const NO_PACE_TITLE = 'Not Enough Time Remaining'
const ACCESS_ADVICE = 'Extend your access.'

function accessMessage(reason?: NoPaceReason): NoPaceMessage {
  const days = reason?.days
  return {
    title: NO_PACE_TITLE,
    /* ⚠ FOUR SHAPES, BECAUSE "in 0 days" AND "in 1 days" BOTH READ AS BUGS,
       and a count we do not have must not be invented. The last arm is the
       old copy, kept for exactly that case: it is true, it makes no numeric
       claim, and it is what this card said before the count existed. A caller
       that has not been taught to pass a reason therefore reads as it always
       did rather than inventing a deadline. */
    note:
      days == null || days < 0
        ? 'No study pace fits in the time remaining.'
        : days === 0
          ? 'Your access expires today.'
          : `Your access expires in ${days} ${days === 1 ? 'day' : 'days'}.`,
    advice: ACCESS_ADVICE,
  }
}

/** "Your Exam is in 32 days. " — or nothing at all when there is no count to
 *  give. Returns a trailing space so the caller can concatenate either way.
 *
 *  ⚠ A PAST EXAM SAYS NOTHING. `examDays` can be negative (a date left behind
 *  in the store), and "in -3 days" is worse than silence; the second sentence
 *  still stands on its own. Zero is "today", for the same reason the access
 *  branch and the course head both refuse to print a literal zero. */
function examCountSentence(examDays?: number): string {
  if (examDays == null || examDays < 0) return ''
  if (examDays === 0) return 'Your Exam is today. '
  return `Your Exam is in ${examDays} ${examDays === 1 ? 'day' : 'days'}. `
}

export function noPaceMessage(reason?: NoPaceReason): NoPaceMessage {
  if (!reason || reason.binding === 'access' || reason.binding === 'none') {
    return accessMessage(reason)
  }
  /* ⚠ NO DATES AND NO COUNTDOWN ON THIS ARM (2026-10-21, Jillienne's own
     wording — two sentences, and this is both of them).

     The countdown was never an option: the model hands over the COURSEWORK
     deadline rather than the exam, and `days` to it goes negative as soon as
     the exam is nearer than the buffer, which is most of the ways into this
     state.

     The DATE was shown until this change — "Coursework has to finish by
     November 1, 7 days before the exam, to leave time to review." It is
     accurate and it is a third sentence of arithmetic in front of someone
     who has just been told their plan does not fit. The two sentences left
     say the problem and the one move that fixes it; the buffer is the
     model's business, not the card's. ⚠ If it comes back, print
     `reason.dateIso` and say it is the COURSEWORK deadline — never the
     exam. */
  return {
    title: NO_PACE_TITLE,
    /* Two sentences since 2026-11-03 (Jillienne's wording): the exam's own
       countdown, then why it is a problem. The count leads because it is the
       fact the learner does not already have — they know their coursework is
       unfinished; what they are working out is how long they have. */
    note: `${examCountSentence(reason.examDays)}There is not enough time to complete the coursework in the time remaining.`,
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
