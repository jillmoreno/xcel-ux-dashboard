import { ADMIN_DEPARTMENTS } from '@/data/atlasAdmin/learners'
import { DEFAULT_EMAIL, EMPTY_AUDIENCE, STATES, TRAININGS, toIso, type Audience, type Schedule } from '@/data/atlasAdmin/assignments'

/**
 * ATLAS ADMIN — a rule being written (2026-10-20). What the wizard edits and
 * what Quick assign hands it: the trainings, the audience and the schedule,
 * before any of it is a rule. Quick assign reads a sentence into one of
 * these; the wizard opens on it.
 */
export type RuleDraft = {
  trainingIds: string[]
  audience: Audience
  schedule: Schedule
  email: string
  name: string
  description: string
}

export function emptyDraft(): RuleDraft {
  return {
    trainingIds: [TRAININGS[0].id],
    audience: { ...EMPTY_AUDIENCE },
    schedule: { kind: 'ongoing', start: toIso(new Date()), end: null, dueOffsetDays: 14 },
    email: DEFAULT_EMAIL,
    name: '',
    description: '',
  }
}

/** The sentences Quick assign offers under "Try asking". */
export const QUICK_EXAMPLES = [
  'Assign New Agent Onboarding to all current and future people in Florida, ongoing, due in 14 days',
  'Send State Exam Prep Sprint to new hires in New York starting next week, due in 30 days',
  'Require Insurance Ethics & Conduct for new hires only, one-time, due in 7 days',
  'Publish Annuity Suitability Training to Coleen Acker in New Jersey, ending 12/31/2027',
  'Assign Life & Health Pre-Licensing to Mike Willits, starting 11/01/26',
]

/**
 * Reads one sentence into a draft — no model behind it, just the words the
 * examples use: a training by name, a department, a state, "new hires",
 * "one-time", "due in N days", "starting next week" or a date, "ending" a
 * date. What it cannot find it leaves at the default, and the wizard shows
 * the result for the admin to correct. Returns what it recognised, too, so
 * the page can say so.
 */
export function parseRuleSentence(text: string): { draft: RuleDraft; found: string[] } {
  const draft = emptyDraft()
  const found: string[] = []
  const lower = text.toLowerCase()

  const trainings = [...TRAININGS].sort((a, b) => b.name.length - a.name.length).filter((t) => lower.includes(t.name.toLowerCase()))
  if (trainings.length) {
    draft.trainingIds = [trainings[0].id]
    found.push(trainings[0].name)
  }

  const states = STATES.filter(([code, name]) => lower.includes(name.toLowerCase()) || new RegExp(`\\b${code}\\b`).test(text)).map(([code]) => code)
  const departments = ADMIN_DEPARTMENTS.filter((d) => lower.includes(d.toLowerCase()))
  const newHires = /new hires?/.test(lower)
  if (newHires) {
    draft.audience = { ...draft.audience, kind: 'new-hires', states }
    found.push('new hires')
  } else if (departments.length) {
    draft.audience = { ...draft.audience, kind: 'filters', departments, states }
    found.push(departments.join(', '))
  } else if (states.length) {
    draft.audience = { ...draft.audience, kind: 'location', states }
  }
  if (states.length) found.push(states.join(', '))

  if (/one[- ]time/.test(lower)) {
    draft.schedule.kind = 'one-time'
    found.push('one-time')
  }
  const due = lower.match(/due in (\d+) days?/)
  if (due) {
    draft.schedule.dueOffsetDays = Number(due[1])
    found.push(`due in ${due[1]} days`)
  }
  if (/starting next week/.test(lower)) {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    draft.schedule.start = toIso(d)
    found.push('starting next week')
  }
  const start = lower.match(/starting (\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (start) {
    draft.schedule.start = dateFrom(start)
    found.push(`starting ${start[1]}/${start[2]}/${start[3]}`)
  }
  const end = lower.match(/ending (\d{1,2})\/(\d{1,2})\/(\d{2,4})/)
  if (end) {
    draft.schedule.end = dateFrom(end)
    found.push(`ending ${end[1]}/${end[2]}/${end[3]}`)
  }
  return { draft, found }
}

function dateFrom(m: RegExpMatchArray) {
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])
  return toIso(new Date(year, Number(m[1]) - 1, Number(m[2])))
}
