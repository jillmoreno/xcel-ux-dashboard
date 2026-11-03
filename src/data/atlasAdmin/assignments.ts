import { ADMIN_DEPARTMENTS, type Learner } from './learners'

/**
 * ATLAS ADMIN — ASSIGNMENT RULES (2026-10-20, feat/atlas-admin).
 *
 * The reference's /assignments workspace: rules that enrol an audience in a
 * program or course on a schedule. Same shape and the same headline figures
 * (156 rules, about 11,500 enrolled), drawn from a fixed seed.
 *
 * ⚠ ONE DEPARTURE FROM THE REFERENCE: its catalogue and rule names are a
 * bank's (HELOCs, teller onboarding, BSA/AML) — demo content from another
 * product. These are an insurance agency's: pre-licensing, exam prep, CE and
 * compliance, so a rule reads like something this admin would actually set.
 * And an audience is matched against the store's roster, so "Will receive
 * assignment" is a real count, not a fixed 199.
 */

export type TrainingKind = 'program' | 'course'

export type Training = {
  id: string
  kind: TrainingKind
  name: string
  /** A program's category, or a course's subject. */
  category: string
  /** Courses only. */
  minutes?: number
  /** Programs only — the courses inside, with their type and due offset. */
  courses?: { name: string; type: 'Required' | 'Optional' | 'Elective'; dueDays: number }[]
}

export const PROGRAMS: Training[] = [
  ['New Agent Onboarding', 'Onboarding'],
  ['Life & Health Pre-Licensing', 'Pre-Licensing'],
  ['Property & Casualty Pre-Licensing', 'Pre-Licensing'],
  ['Florida 2-15 Life, Health & Annuities', 'Pre-Licensing'],
  ['New York Life Agent Path', 'Pre-Licensing'],
  ['State Exam Prep Sprint', 'Exam Prep'],
  ['Personal Lines Fundamentals', 'Specialty'],
  ['Commercial Lines Fundamentals', 'Specialty'],
  ['Annuity Suitability Training', 'Compliance'],
  ['Continuing Education: 24-Hour Renewal', 'Continuing Education'],
  ['Agency Leadership Essentials', 'Leadership'],
  ['Customer Experience: First 90 Days', 'Culture'],
].map(([name, category], i) => ({
  id: `prg-${i + 1}`,
  kind: 'program' as const,
  name,
  category,
  courses: [
    { name: `${name}: Orientation`, type: 'Required' as const, dueDays: 7 },
    { name: 'Insurance Ethics & Conduct', type: 'Required' as const, dueDays: 14 },
    { name: 'Policy Provisions & Riders', type: 'Required' as const, dueDays: 24 },
    { name: 'Practice Exam Set A', type: 'Optional' as const, dueDays: 38 },
    { name: 'Client Conversations that Build Trust', type: 'Elective' as const, dueDays: 52 },
  ],
}))

export const COURSES: Training[] = [
  ['Insurance Ethics & Conduct', 'Compliance', 45],
  ['Anti-Money Laundering for Insurers', 'Compliance', 60],
  ['Annuity Best Interest (4-Hour)', 'Compliance', 240],
  ['Long-Term Care Partnership (8-Hour)', 'Continuing Education', 480],
  ['Flood Insurance (NFIP) Update', 'Continuing Education', 180],
  ['Data Privacy for Agents', 'Security', 35],
].map(([name, category, minutes], i) => ({ id: `crs-${i + 1}`, kind: 'course' as const, name: name as string, category: category as string, minutes: minutes as number }))

export const TRAININGS: Training[] = [...PROGRAMS, ...COURSES]

export function trainingById(id: string) {
  return TRAININGS.find((t) => t.id === id)
}

export type AudienceKind = 'all' | 'new-hires' | 'location' | 'filters'

export const STATES = [
  ['NY', 'New York'],
  ['NJ', 'New Jersey'],
  ['PA', 'Pennsylvania'],
  ['FL', 'Florida'],
] as const

export type Audience = {
  kind: AudienceKind
  /** Locations (state codes), for `new-hires`, `location` and `filters`. */
  states: string[]
  /** Departments, for `filters`. */
  departments: string[]
  /** Excluded departments and learner ids. */
  excludeDepartments: string[]
  excludeLearners: string[]
  /** Always included, whatever the filters (unless excluded). */
  includeLearners: string[]
}

export type Schedule = {
  kind: 'ongoing' | 'one-time'
  /** ISO dates. */
  start: string
  end: string | null
  dueOffsetDays: number
}

export type RuleStatus = 'active' | 'archived'

export type AssignmentRule = {
  id: string
  name: string
  description: string
  trainingIds: string[]
  audience: Audience
  schedule: Schedule
  email: string
  status: RuleStatus
  /** Enrolled learners. Fixture rules carry a number; a rule made this session
   *  counts its audience. */
  students: number
  processed: boolean
}

export const EMPTY_AUDIENCE: Audience = { kind: 'all', states: [], departments: [], excludeDepartments: [], excludeLearners: [], includeLearners: [] }

export const DEFAULT_EMAIL = 'Online Course Assigned'

/** Which roster learners a rule's audience reaches. */
export function matchAudience(a: Audience, learners: readonly Learner[]) {
  const base = learners.filter((l) => {
    if (a.kind === 'new-hires' && l.enrolledDaysAgo > 30) return false
    if ((a.kind === 'location' || a.kind === 'new-hires' || a.kind === 'filters') && a.states.length && !a.states.includes(l.state)) return false
    if (a.kind === 'filters' && a.departments.length && !a.departments.includes(l.team)) return false
    return true
  })
  const ids = new Set(base.map((l) => l.id))
  a.includeLearners.forEach((id) => ids.add(id))
  const excluded = (l: Learner) => a.excludeDepartments.includes(l.team) || a.excludeLearners.includes(l.id)
  const matched = learners.filter((l) => ids.has(l.id) && !excluded(l))
  const removed = learners.filter((l) => ids.has(l.id) && excluded(l)).length
  return { matched, removed }
}

export function audienceLabel(a: Audience) {
  const where = a.states.length ? ` in ${a.states.join(', ')}` : ''
  switch (a.kind) {
    case 'all':
      return 'All learners (minus excludes)'
    case 'new-hires':
      return `New hires${where}`
    case 'location':
      return a.states.length ? `Learners${where}` : 'By location — pick a location'
    case 'filters':
      return [a.departments.length ? a.departments.join(', ') : 'Any department', a.states.length ? a.states.join(', ') : 'any location'].join(' · ')
  }
}

export function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  return toIso(new Date(y, m - 1, d + days))
}

export function formatDay(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/* ---- the fixture: 156 rules, the reference's count ---- */

function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const RULE_COUNT = 156
const ARCHIVED_COUNT = 14

function build(): AssignmentRule[] {
  const r = rng(20261020)
  const rules: AssignmentRule[] = []
  for (let i = 0; i < RULE_COUNT; i++) {
    const t = TRAININGS[i % TRAININGS.length]
    const year = 2024 + (i % 3)
    const month = i % 12
    const day = 1 + ((i * 12) % 27)
    const start = toIso(new Date(year, month, day))
    const due = 30 + Math.floor(r() * 20)
    const dated = i % 4 === 0
    const label = dated ? `${year} - ${t.name} - ${formatDay(start)}` : t.name
    const kind: AudienceKind = (['all', 'new-hires', 'location', 'filters'] as const)[i % 4]
    rules.push({
      id: `rule-${(i + 1).toString().padStart(3, '0')}`,
      name: label,
      description: '',
      trainingIds: [t.id],
      audience: {
        ...EMPTY_AUDIENCE,
        kind,
        states: kind === 'location' || kind === 'filters' ? [STATES[i % STATES.length][0]] : [],
        departments: kind === 'filters' ? [ADMIN_DEPARTMENTS[i % ADMIN_DEPARTMENTS.length]] : [],
      },
      schedule: { kind: i % 3 === 0 ? 'one-time' : 'ongoing', start, end: addDays(start, due + 22), dueOffsetDays: due },
      email: DEFAULT_EMAIL,
      status: i >= RULE_COUNT - ARCHIVED_COUNT ? 'archived' : 'active',
      students: 1 + ((i * 17) % 146),
      processed: true,
    })
  }
  return rules
}

export const ADMIN_RULES: readonly AssignmentRule[] = build()
