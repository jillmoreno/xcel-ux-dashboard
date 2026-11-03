import type { Learner } from './learners'

/**
 * ATLAS ADMIN — WHAT A LEARNER'S RECORD SAYS (2026-10-19). The reference's
 * record page reads one learner and tells the admin what to do; this derives
 * the same parts from a fixture learner, so every one of the 198 records reads
 * true to its stage rather than one hand-written example:
 *
 *   the BANNER (one sentence: what happened, and the move), the ALERTS that
 *   fired, the JOURNEY (done, now, up next), the primary NUDGE, the readiness
 *   pill, and the FACTS.
 *
 * Dates are relative to today, so the record never reads stale.
 */

export type Tone = 'red' | 'amber' | 'green' | 'slate'

export type RecordAlert = { id: string; title: string; firedDaysAgo: number; body: string; move: string }

export type JourneyStep = { label: string; state: 'done' | 'now' | 'next' | 'unknown'; detail: string }

const DAY = 24 * 60 * 60 * 1000

export function dayLabel(daysAgo: number) {
  const d = new Date(Date.now() - daysAgo * DAY)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function firstName(l: Learner) {
  return l.name.split(' ')[0]
}

/** How the learner reads at the top: the stage's one-sentence banner. */
export function bannerFor(l: Learner): { tone: Tone; text: string } {
  const first = firstName(l)
  const quiet = `Quiet for ${l.lastActiveDays} days`
  switch (l.stage) {
    case 'invite-open':
      return { tone: 'amber', text: `Invite sent ${l.enrolledDaysAgo} days ago and not opened yet. A resend or a quick text gets ${first} started.` }
    case 'never-started':
      return { tone: 'red', text: `Enrolled ${l.enrolledDaysAgo} days ago and has not launched the course. A call today is the move.` }
    case 'in-course':
      return l.lastActiveDays >= 2
        ? { tone: 'amber', text: `${l.contentPct}% through the course. ${quiet}; a check-in keeps the pace.` }
        : { tone: 'green', text: `${l.contentPct}% through the course and studying this week. Nothing to do yet.` }
    case 'prepping':
      return { tone: 'green', text: `Course done, exam prep at ${l.prepPct}%. On pace for the exam; set a date to keep it real.` }
    case 'done-no-prep':
      return {
        tone: 'red',
        text: `Finished the course and has not opened exam prep. ${quiet} (last seen ${relativeAgo(l.lastActiveDays)}). A call about the prep exams is the move.`,
      }
    case 'stalled':
      return { tone: 'red', text: `Stopped at ${l.contentPct}% of the course. ${quiet}. Call today, before access runs out.` }
    case 'ready-to-test':
      return l.examDate
        ? { tone: 'green', text: `Prepared to pass with the exam booked. Keep ${first} warm until the date.` }
        : { tone: 'amber', text: `Prepared to pass and no exam date yet. Book it while the material is fresh.` }
    case 'licensed':
      return { tone: 'green', text: `Licensed. Record the license number and the renewal date.` }
  }
}

function relativeAgo(days: number) {
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.round(days / 7)} weeks ago`
  return days < 60 ? '1 month ago' : `${Math.round(days / 30)} months ago`
}

/** The alerts that would have fired for a learner at this stage. */
export function alertsFor(l: Learner): RecordAlert[] {
  const out: RecordAlert[] = []
  if (l.stage === 'done-no-prep')
    out.push({
      id: 'no-prep',
      title: 'Course done, no prep',
      firedDaysAgo: Math.min(l.lastActiveDays, 21),
      body: 'Course 100%, exam prep 0%.',
      move: 'Send a prep nudge. Set an exam date.',
    })
  if (l.stage === 'never-started' || l.stage === 'invite-open')
    out.push({
      id: 'not-started',
      title: l.stage === 'invite-open' ? 'Invite not opened' : 'Never launched',
      firedDaysAgo: Math.max(1, l.enrolledDaysAgo - 3),
      body: l.stage === 'invite-open' ? 'The invite email has not been opened.' : 'Enrolled, and the course has never been opened.',
      move: 'Resend the invite, or call.',
    })
  if (l.stage === 'stalled')
    out.push({
      id: 'stalled',
      title: 'No recent activity',
      firedDaysAgo: Math.max(1, l.lastActiveDays - 7),
      body: `No study time in ${l.lastActiveDays} days.`,
      move: 'Call. Find out what stopped them.',
    })
  if (l.stage === 'ready-to-test' && !l.examDate)
    out.push({
      id: 'no-date',
      title: 'Ready, no exam date',
      firedDaysAgo: 3,
      body: 'Prep is at least 80% and two simulations are passed.',
      move: 'Set the exam date with them.',
    })
  if (l.lastActiveDays >= 2 && l.stage !== 'licensed' && l.stage !== 'invite-open' && l.stage !== 'never-started')
    out.push({
      id: 'quiet-2',
      title: 'Quiet 2 days',
      firedDaysAgo: Math.max(1, l.lastActiveDays - 2),
      body: 'No study time in the last two business days.',
      move: 'Check in and get them back on the study calendar.',
    })
  return out
}

/** The one-line story over the alerts, when there is more than one. */
export function alertsStory(l: Learner, count: number) {
  if (count < 2) return null
  if (l.stage === 'done-no-prep') return 'One story: went quiet after finishing the course. Handle it with one nudge.'
  if (l.stage === 'stalled') return 'One story: stopped mid-course. One call covers both.'
  return 'Related alerts. One touch covers them.'
}

/** The primary action's label — what a nudge is about at this stage. */
export function nudgeLabel(l: Learner) {
  switch (l.stage) {
    case 'invite-open':
      return 'Resend invite'
    case 'never-started':
      return 'Send start nudge'
    case 'in-course':
    case 'stalled':
      return 'Send nudge'
    case 'prepping':
    case 'done-no-prep':
      return 'Send prep nudge'
    case 'ready-to-test':
      return 'Send exam nudge'
    case 'licensed':
      return 'Send congrats'
  }
}

export function readinessPill(l: Learner): { tone: Tone; text: string } {
  if (l.stage === 'licensed') return { tone: 'green', text: 'Passed' }
  if (l.stage === 'ready-to-test') return { tone: 'green', text: `Ready · prep ${l.prepPct}%` }
  if (l.prepPct !== null && l.contentPct === 100) return { tone: 'amber', text: `Not ready · prep ${l.prepPct}%` }
  return { tone: 'slate', text: 'Not yet eligible' }
}

export function journeyFor(l: Learner): JourneyStep[] {
  const invited = l.enrolledDaysAgo + 5
  const started = l.stage !== 'invite-open' && l.stage !== 'never-started'
  const courseDone = l.contentPct === 100
  const prepped = l.stage === 'ready-to-test' || l.stage === 'licensed'
  const steps: JourneyStep[] = [
    { label: 'Invited', state: 'done', detail: dayLabel(invited) },
    {
      label: 'Account created',
      state: l.stage === 'invite-open' ? 'now' : 'done',
      detail: l.stage === 'invite-open' ? `Invite open · ${l.enrolledDaysAgo} days` : dayLabel(l.enrolledDaysAgo),
    },
    {
      label: 'Started course',
      state: started ? 'done' : l.stage === 'never-started' ? 'now' : 'next',
      detail: started ? dayLabel(Math.max(l.enrolledDaysAgo - 1, 0)) : l.stage === 'never-started' ? `Not started · ${l.enrolledDaysAgo} days here` : 'Up next',
    },
    {
      label: 'Course complete',
      state: courseDone ? 'done' : started ? 'now' : 'next',
      detail: courseDone ? `${dayLabel(Math.max(l.lastActiveDays, 3))} · 100%${l.score ? `, quiz avg ${l.score}` : ''}` : started ? `${l.contentPct}% · in progress` : 'Up next',
    },
    {
      label: 'Exam prep',
      state: prepped ? 'done' : courseDone ? 'now' : 'next',
      detail: prepped ? `${l.prepPct}%` : courseDone ? (l.prepPct ? `${l.prepPct}% · in progress` : `Not started · ${Math.max(1, Math.round(l.lastActiveDays / 7))} weeks here`) : 'Up next',
    },
    { label: 'Prepared to pass', state: prepped ? 'done' : 'next', detail: prepped ? 'Prep ≥ 80%, two simulations passed' : 'Up next' },
    {
      label: 'Exam scheduled',
      state: l.examDate ? 'done' : prepped ? 'now' : 'next',
      detail: l.examDate ? formatIso(l.examDate) : prepped ? 'No date yet' : 'Up next',
    },
    { label: 'Passed exam', state: l.stage === 'licensed' ? 'done' : 'next', detail: l.stage === 'licensed' ? formatIso(l.examDate) : 'Up next' },
    { label: 'Licensed', state: l.stage === 'licensed' ? 'done' : 'unknown', detail: l.stage === 'licensed' ? 'License on file' : 'Unknown' },
  ]
  return steps
}

export function formatIso(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Study minutes over the last 14 days — invented from the learner's
 *  activity, zero after they went quiet. */
export function dailyActivity(l: Learner): number[] {
  let seed = 0
  for (const ch of l.id) seed = (seed * 31 + ch.charCodeAt(0)) | 0
  return Array.from({ length: 14 }, (_, i) => {
    const daysAgo = 13 - i
    if (daysAgo < l.lastActiveDays || l.stage === 'never-started' || l.stage === 'invite-open') return 0
    seed = (seed * 1103515245 + 12345) | 0
    const v = (seed >>> 16) % 90
    return v < 20 ? 0 : v
  })
}

export function timeInCourse(l: Learner) {
  if (l.contentPct === null) return null
  const minutes = Math.round((l.contentPct / 100) * 40 * 60 + (l.prepPct ?? 0) * 6)
  return { h: Math.floor(minutes / 60), m: minutes % 60 }
}

export const EXAM_VENDOR: Record<Learner['state'], string> = { NY: 'PearsonVue', NJ: 'PSI', PA: 'Pearson VUE', FL: 'Pearson VUE' }
export const STATE_EXAM: Record<Learner['state'], string> = {
  NY: 'NY Life Producer Exam',
  NJ: 'NJ Life & Health Exam',
  PA: 'PA Life & Health Exam',
  FL: 'FL 2-15 Life & Health Exam',
}
