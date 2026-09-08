// Membership landing-page version catalog + default-version helpers.
// Mirrors src/data/dashboardVersions.ts so the membership version
// switcher behaves identically to the dashboard's.

export type MembershipVersionId = 'v1' | 'v2' | 'v3' | 'v4' | 'v5' | 'v6' | 'v7'

export type MembershipVersion = {
  id: MembershipVersionId
  name: string
  /** ISO date the version was introduced (YYYY-MM-DD). */
  date: string
  description: string
}

export const MEMBERSHIP_VERSIONS: MembershipVersion[] = [
  {
    id: 'v1',
    name: 'Original',
    date: '2026-05-27',
    description:
      'The current /membership landing page — teal hero band + sticky 4-tab nav (Recommended / Library / VIP Partner Offerings / Forums / Community) for members, upsell hero + plan tier strip for non-members.',
  },
  {
    id: 'v2',
    name: 'Redesign — Passport',
    date: '2026-06-08',
    description:
      'Starbucks-Rewards-style FHEA Passport marketing + benefits page (Elite only for now). Non-members get a join page (hero → trust strip → how it works → 9-product grid → Rubi AI band → plan comparison → VIP perks → FAQ → final CTA); members get a personalized benefits view.',
  },
  {
    id: 'v3',
    name: 'Redesign — Passport, grouped',
    date: '2026-06-16',
    description:
      'Passport benefits page with the 9-product grid broken into three labeled sections — Resource Library, Exam & Certification Prep, and Career Tools (powered by Rubi AI, accented cards). Elite only; member + non-member. Selected via ?version=v3.',
  },
  {
    id: 'v4',
    name: 'Membership-First — Sections',
    date: '2026-06-16',
    description:
      'Discoverability-first reframe (Dashboard Discoverability PRD). Membership is the frame; the spine is "Just launched for members" with NEW tags across every content type. Named benefit rows (Library · CE Podcasts · Exam Prep · AI Career Tools), a secondary "Pick up where you left off" row, and a compact progress snapshot demoted to the hero. Non-member/Lite reuses the rows with the gated "Unlock with Passport" treatment. Elite only; member + non-member. Selected via ?version=v4.',
  },
  {
    id: 'v5',
    name: 'Membership-First — Sections + Side Nav',
    date: '2026-06-16',
    description:
      'Same content as v4 with a persistent SECONDARY left side-nav rail (the "Featured" direction). The rail only fast-jumps to membership sections with no top-nav home (New for members · Resource Library · Exam & Cert Prep · AI Career Tools · Partner Offers & More) — courses, certificates, paths and podcasts stay in the top nav. Scroll-spy active state; member + non-member. Elite only. Selected via ?version=v5.',
  },
  {
    id: 'v6',
    name: 'Combined hero',
    date: '2026-06-16',
    description:
      'A new page built around a combined hero that mixes aspects audited across v1/v2/v4 per stakeholder direction: a SOLID primary-700 surface (no gradient or glow), a two-column layout, and the v2-member KPI stat cards (tenure · saved · status/renewal · upgrade) in the aside. Member view first; the body reuses the v2 member content (recap → benefits grid → recommended → VIP perks). Non-members fall back to the v2 join page. Elite only; selected via ?version=v6.',
  },
  {
    id: 'v7',
    name: 'Dark rail + KPI dashboard',
    date: '2026-06-16',
    description:
      'V5 cloned with no hero, a DARK left nav strip (primary-800) whose top carries a user profile header (avatar · email · membership badge), and a "Your Membership" overview that leads with a small KPI section (member-for · saved · status · upgrade). Same filtered side-nav sections as v5. Elite only; member + non-member. Selected via ?version=v7.',
  },
]

// Built-in baseline — the version a fresh visitor lands on when they
// haven't set their own default. The original page stays the default so
// existing behavior is preserved for every brand.
export const DEFAULT_MEMBERSHIP_VERSION: MembershipVersionId = 'v1'

// User-chosen default, set from the Membership Versions panel's "Set as
// default" trigger. Single key (matching the prompt) — the URL `?version`
// param overrides it per-visit.
const DEFAULT_VERSION_STORAGE_KEY = 'cgp.membership.version'

export function isValidMembershipVersion(
  value: string | null,
): value is MembershipVersionId {
  return value != null && MEMBERSHIP_VERSIONS.some((v) => v.id === value)
}

/** The user-chosen default membership version, or the built-in
 *  {@link DEFAULT_MEMBERSHIP_VERSION} when none has been set. */
export function readDefaultMembershipVersion(): MembershipVersionId {
  if (typeof window === 'undefined') return DEFAULT_MEMBERSHIP_VERSION
  try {
    const raw = window.localStorage.getItem(DEFAULT_VERSION_STORAGE_KEY)
    return isValidMembershipVersion(raw) ? raw : DEFAULT_MEMBERSHIP_VERSION
  } catch {
    return DEFAULT_MEMBERSHIP_VERSION
  }
}

/** Persist the chosen default membership version. */
export function writeDefaultMembershipVersion(id: MembershipVersionId): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(DEFAULT_VERSION_STORAGE_KEY, id)
  } catch {
    // Ignore quota / private-mode errors.
  }
}
