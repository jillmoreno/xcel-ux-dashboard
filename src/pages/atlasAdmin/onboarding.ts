import { ADMIN_USER } from '@/data/atlasAdmin/learners'
import { ADMIN_EMAIL } from './adminStore'

/**
 * ATLAS ADMIN — the onboarding wizard's answers (2026-10-20). Kept in the
 * store, so Save & exit and coming back from the welcome email resumes
 * where the admin left off; Clear all answers puts these back.
 */

export const STEP_IDS = ['company', 'catalog', 'groups', 'affidavit', 'enroll', 'goals', 'report'] as const
export type StepId = (typeof STEP_IDS)[number]

export type OnboardingAnswers = {
  step: number
  name: string
  email: string
  company: string
  url: string
  logo: string | null
  lookedUp: boolean
  contentTypes: string[]
  productLines: string[]
  delivery: string[]
  groupWord: string
  affidavit: 'none' | 'some'
  affidavitStates: string[]
  enroll: string[]
  goals: string[]
  cadence: 'daily' | 'weekly' | 'alert-only'
  recipients: string[]
  alerts: string[]
}

export const ALERTS = [
  ['behind', 'Someone falls behind', 'One email the moment a recruit crosses a line you set, instead of waiting for the weekly.'],
  ['finishes', 'Someone finishes', 'Course complete, how long it took against your 14 day target, and the next step to give them.'],
  ['expiring', 'A license is expiring', 'A heads up on producers in your scope at 60, 30 and 7 days out, so renewals do not lapse quietly.'],
  ['invite', 'Invite', 'Your note, the product, the price, and a pre-applied code so they land on checkout ready to go.'],
  ['day10', 'Day 10 nudge', 'Sent when they have not opened the course. Comes from you, with a magic link straight to chapter one.'],
  ['quiet7', 'Quiet 7 days', 'They have not been in the course for a week. We email them from you, then text if we have a number, so they come back before they go cold.'],
] as const

export function freshAnswers(company: string): OnboardingAnswers {
  return {
    step: 0,
    name: ADMIN_USER.name.split(' ')[0],
    email: ADMIN_EMAIL,
    company,
    url: 'https://www.summitinsurancegroup.com',
    logo: null,
    lookedUp: false,
    contentTypes: ['Prelicensing'],
    productLines: ['Life and Health'],
    delivery: ['Online self-paced'],
    groupWord: 'Teams',
    affidavit: 'none',
    affidavitStates: [],
    enroll: ['Email', 'Link'],
    goals: ['Never opened the course', 'Stalled midcourse'],
    cadence: 'weekly',
    recipients: [ADMIN_EMAIL],
    alerts: ['behind', 'finishes', 'invite', 'day10', 'quiet7'],
  }
}
