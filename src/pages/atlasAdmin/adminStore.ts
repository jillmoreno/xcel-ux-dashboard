import { createContext, useContext } from 'react'
import type { Learner } from '@/data/atlasAdmin/learners'
import type { Invite } from '@/data/atlasAdmin/invites'
import type { AssignmentRule } from '@/data/atlasAdmin/assignments'

/**
 * ATLAS ADMIN — the session's shared state (2026-10-19). What one page does
 * that another page shows: an invite sent from Students lists on Invites;
 * a toast raised anywhere shows over the shell. In memory only — a reload
 * starts from the fixtures, which is what a demo wants.
 */

/** Where the admin app is mounted. */
export const ADMIN_BASE = '/atlas-admin'

/** The signed-in admin's address — the Progress report's "you". */
export const ADMIN_EMAIL = 'eric@summitins.com'

export const DAYS = ['Mondays', 'Tuesdays', 'Wednesdays', 'Thursdays', 'Fridays'] as const
export const TIMES = ['7am', '8am', '9am', '12pm', '5pm'] as const

export type ProgressReportSettings = { active: boolean; day: string; time: string; people: string[] }

export type AdminInvite = {
  id: string
  email: string
  name: string | null
  department: string
  lines: string[]
  tier: 'Standard' | 'Premier'
  note: string | null
  sentAt: string // ISO
  via: 'email' | 'link' | 'qr'
}

/** Something done to a learner this session — a nudge, a call, an email. */
export type AdminTouch = { id: string; learnerId: string; kind: 'nudge' | 'call' | 'email' | 'exam-date'; note: string | null; at: string }

export type AdminEvent = { id: number; at: string; event: string; path: string }

export type AddedDepartment = { name: string; lead: string }

export type AdminStore = {
  /** The roster, with this session's edits (an exam date set, a report
   *  toggle) applied over the fixture. */
  learners: Learner[]
  updateLearner: (id: string, patch: Partial<Learner>) => void
  touches: AdminTouch[]
  addTouch: (touch: Omit<AdminTouch, 'id' | 'at'>) => void
  /** Every invite — the fixture's, with this session's sends on top. */
  invites: Invite[]
  addInvites: (invites: Omit<AdminInvite, 'id' | 'sentAt'>[]) => void
  resendInvite: (id: string) => void
  /** The onboarding Progress report — shared by Reports and Notifications. */
  progressReport: ProgressReportSettings
  setProgressReport: (patch: Partial<ProgressReportSettings>) => void
  /** Settings → Product Configs → Sample roster. Off, the roster is the
   *  empty first-run office. */
  sampleRoster: boolean
  setSampleRoster: (on: boolean) => void
  /** Departments created this session (Department comparison → Create a
   *  department) — on top of the fixture's, with no learners yet. */
  addedDepartments: AddedDepartment[]
  addDepartment: (dept: AddedDepartment) => void
  /** Assignment rules — the fixture's, with this session's creates and edits. */
  rules: AssignmentRule[]
  saveRule: (rule: AssignmentRule) => void
  /** The public company label on invite URLs — Product offering edits it. */
  companyLabel: string
  setCompanyLabel: (label: string) => void
  /** This session's product events — Portal analytics lists them. */
  events: AdminEvent[]
  logEvent: (event: string, path: string) => void
  /** Seats bought — Licenses → Add seats raises it. */
  seatsPurchased: number
  addSeats: (n: number) => void
  toast: string | null
  showToast: (message: string) => void
}

export const AdminStoreContext = createContext<AdminStore | null>(null)

export function useAdminStore(): AdminStore {
  const store = useContext(AdminStoreContext)
  if (!store) throw new Error('useAdminStore must be used inside AtlasAdminApp')
  return store
}

/** A company label as it appears in an invite URL. */
export function companySlug(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
