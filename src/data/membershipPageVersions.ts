// Version catalog for the Dashboard Rebrand's "Membership" rail section
// (MembershipStandalonePage). Mirrors dashboardVersions.ts so the "Membership
// Version" picker (opened from the Feature Flag sheet, next to "Dashboard
// Version") behaves like the dashboard one. The selected version is stored in
// the `membership-page-version` feature flag, so it
// persists per-browser and drives the page reactively.

// The PICKER's ids. Archived versions ('simple', 'lofi') and the never-listed
// 'scorecard' / 'multi' stay valid `membership-page-version` FLAG values — the
// implementations are intact and reachable via `?ff=` / deep links — they're
// just no longer offered in the Membership Version list. See ARCHIVED_ITEMS.
export type MembershipPageVersionId = 'hub' | 'full'

export type MembershipPageVersion = {
  id: MembershipPageVersionId
  label: string
  createdAt: string
  modifiedAt: string
  description: string
}

export const MEMBERSHIP_PAGE_VERSIONS: MembershipPageVersion[] = [
  {
    id: 'hub',
    label: 'Membership Hub',
    createdAt: '2026-08-19',
    modifiedAt: '2026-08-19',
    description:
      'The default. A redesigned "at a glance" hero (Figma 633:132) — a personalized heading + eyebrow over a stat band led by a "Lifetime Member Savings" cell, then Days · Credit hours · Certificates · Hours (dropping the tier badge / Manage / Expires row). Everything below the hero uses the Lo-fi benefits treatment (benefit hero sections as wireframe blocks). Member-only hero; a non-member falls back to the standard non-member page with lo-fi benefits.',
  },
  {
    id: 'full',
    label: 'Marketing/Wordpress Style',
    createdAt: '2026-07-01',
    modifiedAt: '2026-08-17',
    description:
      'The detailed Membership page — hero, comparison grid, upgrade banner, the "Included with Your Membership" shelves, and the "Explore Additional…" benefit spotlights (non-member: plan comparison + success stats + benefit spotlight).',
  },
]

export const DEFAULT_MEMBERSHIP_PAGE_VERSION: MembershipPageVersionId = 'hub'
