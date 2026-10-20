import type { Learner } from './learners'

/**
 * ATLAS ADMIN — THE ORGANIZATION (2026-10-20, feat/atlas-admin).
 *
 * What the reference's /organization, /teams and /licenses pages share:
 * offices, job roles and seats. Its own data is a bank's (Personal Banker,
 * Loan Officer, branches in California and Chicago); these are an insurance
 * agency's, in the four states the roster lives in, and every member count
 * is counted off the roster rather than written in.
 */

export type OrgStatus = 'active' | 'archived'

export type Location = { id: string; name: string; code: string; state: Learner['state'] | null; parent: string | null; status: OrgStatus }

/** Regions are a state; offices sit under them and split its learners. */
export const LOCATIONS: Location[] = [
  { id: 'rgn-ny', name: 'New York Metro, Region', code: 'RGN-NYM', state: 'NY', parent: null, status: 'active' },
  { id: 'ny-mh', name: 'Manhattan, Midtown', code: 'NY-MH-MT', state: 'NY', parent: 'rgn-ny', status: 'active' },
  { id: 'ny-bk', name: 'Brooklyn, Downtown', code: 'NY-BK-DB', state: 'NY', parent: 'rgn-ny', status: 'active' },
  { id: 'ny-li', name: 'Long Island, Garden City', code: 'NY-LI-GC', state: 'NY', parent: 'rgn-ny', status: 'active' },
  { id: 'rgn-nj', name: 'New Jersey, Region', code: 'RGN-NJ', state: 'NJ', parent: null, status: 'active' },
  { id: 'nj-nw', name: 'Newark, Gateway Center', code: 'NJ-NW-GC', state: 'NJ', parent: 'rgn-nj', status: 'active' },
  { id: 'rgn-pa', name: 'Pennsylvania, Region', code: 'RGN-PA', state: 'PA', parent: null, status: 'active' },
  { id: 'pa-ph', name: 'Philadelphia, Center City', code: 'PA-PH-CC', state: 'PA', parent: 'rgn-pa', status: 'active' },
  { id: 'rgn-fl', name: 'Florida, Region', code: 'RGN-FL', state: 'FL', parent: null, status: 'active' },
  { id: 'fl-mia', name: 'Miami, Brickell', code: 'FL-MIA-BR', state: 'FL', parent: 'rgn-fl', status: 'active' },
  { id: 'fl-tpa', name: 'Tampa, Westshore', code: 'FL-TPA-WS', state: 'FL', parent: 'rgn-fl', status: 'active' },
  { id: 'legacy', name: 'Legacy office, Albany (archived)', code: 'LEG-ALB', state: null, parent: null, status: 'archived' },
  { id: 'remote', name: 'Remote, United States', code: 'RMT-US', state: null, parent: null, status: 'active' },
]

export const JOB_ROLES = ['Life & Health Agent', 'P&C Agent', 'Customer Service Rep', 'Agency Producer', 'Account Manager', 'Agency Owner'] as const
export type JobRole = (typeof JOB_ROLES)[number]

/** A stable small hash of a learner id. */
function hash(id: string) {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0
  return Math.abs(h)
}

/** A learner's job role. New learners (in their first week) often have none
 *  yet — the gap the Licenses banner asks the admin to fill. */
export function jobRoleOf(l: Learner): JobRole | null {
  const h = hash(l.id)
  if (l.enrolledDaysAgo <= 7 && h % 3 !== 0) return null
  // Most of a pre-licensing roster is training to be a Life & Health agent.
  return h % 5 < 3 ? 'Life & Health Agent' : JOB_ROLES[1 + (Math.floor(h / 5) % (JOB_ROLES.length - 1))]
}

/** Which office within its state a learner works from (the region itself
 *  holds the state's learners; its offices divide them). */
export function officeOf(l: Learner): Location | null {
  const offices = LOCATIONS.filter((x) => x.parent && x.state === l.state && x.status === 'active')
  return offices.length ? offices[hash(l.id) % offices.length] : null
}

export function membersOfLocation(loc: Location, learners: readonly Learner[]) {
  if (!loc.state || loc.status === 'archived') return []
  return loc.parent ? learners.filter((l) => officeOf(l)?.id === loc.id) : learners.filter((l) => l.state === loc.state)
}

/** Seats: the agency bought this many; a started learner holds one; an
 *  invite not yet accepted holds one unredeemed. */
export const SEATS_PURCHASED = 240
