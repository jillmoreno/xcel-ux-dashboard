import type { Brand } from '@/context/AccountContext'

/**
 * "Your Learning at a Glance" — a Spotify-Wrapped-style learning recap for
 * the Elite member view (badge teaser + dedicated recap page). Members
 * only, Elite only for this pass.
 *
 * TODO(data): this is a placeholder fixture. The real recap should come
 * from the engagement / learning-history service (see the
 * `/api/achievements/me` precedent in CLAUDE.md) — format mix, specialties,
 * streak, peak time, and milestones would all be server-derived per user.
 */

export type ContentFormat = 'video' | 'podcast' | 'reading'

export type LearningArchetype = {
  /** Display name, e.g. "The Visual Deep-Diver". */
  label: string
  /** One-sentence description of the style. */
  blurb: string
  /** Format mix, summing to 100. Drives the bar chart + derivation. */
  mix: Record<ContentFormat, number>
}

export type TopSpecialty = { rank: number; name: string; hours: number }

export type ConsistencyStats = {
  ceHours: number
  streakWeeks: number
  peakTime: string // e.g. "8–10 PM"
  mostActiveDay: string // e.g. "Sundays"
}

export type LearningMilestones = {
  coursesCompleted: number
  certificatesEarned: number
  specialtiesExplored: number
  ceGoalCurrent: number
  ceGoalTarget: number
}

export type LearningAtAGlance = {
  /** Friendly heading context, e.g. "this year". */
  periodLabel: string
  archetype: LearningArchetype
  topSpecialties: TopSpecialty[] // expect 5, render up to 5
  consistency: ConsistencyStats
  milestones: LearningMilestones
}

/**
 * Pure, testable archetype derivation. The fixture hard-codes the result,
 * but the label/blurb are produced through this helper so the logic is
 * real when server data arrives.
 *
 * Rules:
 *   - Dominant format sets the base noun: video → "Visual", podcast →
 *     "Audio", reading → "Reader".
 *   - A high CE-hours signal (≥ 30) adds "Deep-Diver"; otherwise a strong
 *     streak (≥ 6 weeks) adds "Steady Learner"; otherwise an evening peak
 *     time adds "Night Owl"; otherwise "Explorer".
 */
const BASE_BY_FORMAT: Record<ContentFormat, string> = {
  video: 'Visual',
  podcast: 'Audio',
  reading: 'Reader',
}

const BLURB_BY_FORMAT: Record<ContentFormat, string> = {
  video:
    'You learn best by watching and doing — long, focused video sessions are your signature. You go deep before you move on.',
  podcast:
    'You learn on the move — podcasts and audio lessons are how you keep up between shifts.',
  reading:
    'You learn by reading deeply — articles and references are where you go to master a topic.',
}

function dominantFormat(mix: Record<ContentFormat, number>): ContentFormat {
  return (Object.keys(mix) as ContentFormat[]).reduce((top, f) =>
    mix[f] > mix[top] ? f : top,
  )
}

function isEvening(peakTime: string): boolean {
  // Evening if the label mentions PM and starts at 6 PM or later.
  if (!/pm/i.test(peakTime)) return false
  const hour = parseInt(peakTime, 10)
  return Number.isFinite(hour) && hour >= 6 && hour <= 11
}

export function deriveArchetype(
  mix: Record<ContentFormat, number>,
  consistency: ConsistencyStats,
): { label: string; blurb: string } {
  const base = dominantFormat(mix)
  const baseNoun = BASE_BY_FORMAT[base]
  const suffix =
    consistency.ceHours >= 30
      ? 'Deep-Diver'
      : consistency.streakWeeks >= 6
        ? 'Steady Learner'
        : isEvening(consistency.peakTime)
          ? 'Night Owl'
          : 'Explorer'
  return { label: `The ${baseNoun} ${suffix}`, blurb: BLURB_BY_FORMAT[base] }
}

/* ─── Elite (Jordan) fixture ─────────────────────────────────────────── */

const GLANCE_BY_BRAND: Record<Brand, LearningAtAGlance | null> = {
  // XCEL sells transactional course packages (Standard / Premier) + a B2B
  // Partner programme — no consumer membership, so nothing here is reachable.
  xcel: null,
}

export function learningAtAGlanceFor(brand: Brand): LearningAtAGlance | null {
  return GLANCE_BY_BRAND[brand]
}
