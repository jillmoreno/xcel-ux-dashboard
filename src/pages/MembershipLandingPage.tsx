import type { CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useAccount } from '@/context/AccountContext'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { RecommendedForYouPanel } from '@/components/dashboard/recommended/RecommendedForYouPanel'
import { MembershipHeroBand } from '@/components/membership/MembershipHeroBand'
import { MembershipUpsellHero } from '@/components/membership/MembershipUpsellHero'
import { PlanTierStrip } from '@/components/membership/PlanTierStrip'
import { PreviewBanner } from '@/components/membership/PreviewBanner'
import { LockedPreview } from '@/components/membership/LockedPreview'
import { LockedComingSoon } from '@/components/membership/LockedComingSoon'
import { LibraryPanel } from '@/components/membership/LibraryPanel'
import { PartnerOfferingsPanel } from '@/components/membership/PartnerOfferingsPanel'
import { MembershipBenefitsPanel } from '@/components/membership/MembershipBenefitsPanel'
import { benefitHeroesFor } from '@/data/membership/benefitHeroesFixtures'
import { ForumsComingSoon } from '@/components/membership/ForumsComingSoon'
import { CommunityComingSoon } from '@/components/membership/CommunityComingSoon'
/**
 * Top-level `/membership` landing page. Two branches driven by
 * `useAccount().membership`:
 *
 *   - **Member**     → personalized `<MembershipHeroBand>` over a
 *                      sticky 4-tab nav. Only the Recommended tab
 *                      renders real content today (re-uses the
 *                      dashboard's `<RecommendedForYouPanel>`); the
 *                      other three render member-side `*ComingSoon`
 *                      placeholders pending follow-up prompts.
 *
 *   - **Non-member** → `<MembershipUpsellHero>` + `<PlanTierStrip>`
 *                      + the same 4-tab structure, but every tab
 *                      panel is wrapped in `<LockedPreview>`. The
 *                      Recommended tab teases the real shelves
 *                      behind a fade + "Join to unlock" pill; the
 *                      other three render `<LockedComingSoon>` with
 *                      tab-specific marketing copy.
 *
 * Active tab is URL-driven via `?tab=recommended|library|forums|
 * community`. Default is Recommended — when the param is null or
 * unrecognized, the page renders Recommended and (per convention)
 * drops the param on outbound writes via the `setParam` helper.
 *
 * The member-vs-non-member branch is **not** URL-driven; it reads
 * from the active account fixture so the page mirrors the rest of
 * the app's brand/membership switching behavior.
 */
type MembershipTab =
  | 'recommended'
  | 'benefits'
  | 'library'
  | 'partner-offerings'
  | 'forums'
  | 'community'

// TODO(engagement): once the engagement service publishes per-user
// membership counts (saved-library count, unread-forum-replies,
// community mentions), wire count pills + unread dots into each
// TabItem here. The shape can stay additive — `<Tabs>` already
// accepts `children`-like extensibility per item.
const TABS: TabItem<MembershipTab>[] = [
  { id: 'recommended', label: 'Recommended for you' },
  { id: 'library', label: 'Resource Library' },
  { id: 'partner-offerings', label: 'VIP Partner Offerings' },
  { id: 'forums', label: 'Course Forums' },
  { id: 'community', label: 'Community Posts' },
]

// "Membership Benefits" tab — inserted second (after Recommended) only when
// the brand has benefit heroes (Elite). Kept out of `TABS` so the base order
// stays the canonical 5 for brands without it.
const BENEFITS_TAB: TabItem<MembershipTab> = { id: 'benefits', label: 'Membership Benefits' }

function parseTab(raw: string | null): MembershipTab {
  return raw === 'benefits' ||
    raw === 'library' ||
    raw === 'partner-offerings' ||
    raw === 'forums' ||
    raw === 'community'
    ? raw
    : 'recommended'
}

/**
 * `/membership` route entry. Selects the page version the same way
 * `DashboardPage` selects V1–V5 from `?version=`:
 *
 *   - `?version=v2` / `?version=v3` (Elite only) → the FHEA Passport
 *     redesign ({@link MembershipV2}). V3 passes `version="v3"` to render
 *     the grouped products layout; V2 keeps the single grid.
 *   - any other / absent value → the original page ({@link MembershipV1}),
 *     byte-for-byte unchanged.
 *
 * The chosen default persists via `cgp.membership.version`
 * (`readDefaultMembershipVersion`), and an explicit `?version` param
 * overrides it. Unrecognized values fall back silently to the default.
 * v2 is brand-gated to Elite — non-Elite brands always get v1, so the
 * other three brands are unaffected.
 *
 * The member-vs-non-member branch is NOT version-driven — both versions
 * read `useAccount().membership` independently.
 */
export function MembershipLandingPage() {
  // Versions v2–v7 were Elite-only explorations — Elite carried the Passport
  // fixtures they render. With that brand gone every version resolves to V1.
  //
  // This whole page is unreachable for XCEL in any case: `supportsMembership`
  // is false for it, so `MembershipRoute` in App.tsx redirects `/membership`
  // to the dashboard before this renders. The file is kept, not deleted, for
  // the same reason `supportsMembership` exists — the brand seam is meant to
  // survive a brand that has no membership.
  return <MembershipV1 />
}

function MembershipV1() {
  const { brand, membership } = useAccount()
  const isMember = membership === 'member'
  const [params, setParams] = useSearchParams()
  // The "Membership Benefits" tab is Elite-only — shown when the brand has
  // benefit heroes. Insert it second; other brands keep the base 5 tabs.
  const showBenefits = benefitHeroesFor(brand).length > 0
  const tabs = showBenefits ? [TABS[0], BENEFITS_TAB, ...TABS.slice(1)] : TABS
  const requestedTab = parseTab(params.get('tab'))
  // A `?tab=benefits` deep link on a brand without the tab falls back to
  // Recommended so the param can't strand the page on an inert tab.
  const tab: MembershipTab =
    requestedTab === 'benefits' && !showBenefits ? 'recommended' : requestedTab
  // Hero band's visibility is feature-flagged (separate from its
  // light/dark variant, which the band reads internally). Toggling
  // the flag off hides the whole band from member view; non-member
  // view always renders its own upsell hero regardless.
  const heroFlag = useFeatureFlag('membership-hero-band')

  // Same atomic URL-state helper used by MyCoursesPage / MyPodcastsPage —
  // a null / empty value drops the param so the default tab leaves
  // the URL clean.
  const setParam = (key: string, value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value == null || value === '') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const onTabChange = (next: MembershipTab) => {
    setParam('tab', next === 'recommended' ? null : next)
  }

  return (
    <div className="mx-auto" style={pageShellStyle}>
      <div style={topBlockStyle}>
        {isMember ? (
          heroFlag.enabled && <MembershipHeroBand />
        ) : tab === 'benefits' ? (
          // The Benefits tab's non-member panel is a self-contained marketing
          // experience (its own lead-in + Passport plan comparison), so we
          // drop the page-level upsell hero + plan strip here to avoid a
          // doubled pitch / two plan blocks.
          null
        ) : (
          <>
            <MembershipUpsellHero />
            <PlanTierStrip />
            <PreviewBanner />
          </>
        )}
      </div>

      {/* Sticky tab bar — same scroll behavior as the exploration. The
          full-bleed surface lets it span the page while the inner
          rail mirrors the page's `padding: 0 24px` gutter. */}
      <div style={stickyTabBarStyle}>
        <div style={tabBarInnerStyle}>
          <Tabs items={tabs} active={tab} onChange={onTabChange} />
        </div>
      </div>

      <div style={tabPanelStyle}>
        {/* Active-tab title — a single canonical heading rendered
            above whichever panel is mounted. The label comes straight
            from the `TABS` array so the surface stays consistent: the
            tab nav reads "Resource Library" → the panel below reads
            "Resource Library". Each individual panel only renders its
            content (filters / shelves / empty states) — never its own
            title. */}
        <h2 style={tabTitleStyle}>
          {tabs.find((t) => t.id === tab)?.label}
        </h2>

        {/* TODO(membership-recommended): `RecommendedForYouPanel`
            contains an inline UpgradeBanner targeting non-members.
            For the non-member /membership view we already surface
            the upsell at the page level, so the banner may double
            up. Decide whether to fork the panel or add a "hideUpsell"
            param in a follow-up prompt; this build keeps the panel
            untouched per the prompt's contract. */}
        {tab === 'recommended' &&
          (isMember ? (
            <RecommendedForYouPanel />
          ) : (
            <LockedPreview pillLabel="Join to unlock personalized picks">
              <RecommendedForYouPanel />
            </LockedPreview>
          ))}

        {/* Membership Benefits — the panel handles its own member /
            non-member branch (heroes + nudge, or marketing heroes + plans). */}
        {tab === 'benefits' && <MembershipBenefitsPanel />}

        {tab === 'library' &&
          (isMember ? <LibraryPanel /> : <LockedComingSoon tab="library" />)}
        {tab === 'partner-offerings' &&
          (isMember ? (
            <PartnerOfferingsPanel />
          ) : (
            // Partner Offerings is one of two tabs (alongside
            // Recommended) where we ship real content to non-members
            // behind the fade — the partner mix is a strong upsell
            // affordance on its own. Other unbuilt tabs use the
            // `<LockedComingSoon>` marketing-copy variant instead.
            <LockedPreview pillLabel="Unlock VIP partner discounts">
              <PartnerOfferingsPanel />
            </LockedPreview>
          ))}
        {tab === 'forums' &&
          (isMember ? <ForumsComingSoon /> : <LockedComingSoon tab="forums" />)}
        {tab === 'community' &&
          (isMember ? (
            <CommunityComingSoon />
          ) : (
            <LockedComingSoon tab="community" />
          ))}
      </div>
    </div>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const pageShellStyle: CSSProperties = {
  // Page sits flush against the global header — the hero is the new
  // visual top so we drop top padding entirely. Horizontal gutters
  // are reapplied per inner block so the sticky tab bar can run
  // full-bleed when it sticks.
  maxWidth: 1440,
  padding: '0 0 64px',
  width: '100%',
}

const topBlockStyle: CSSProperties = {
  // The hero (and the upsell + plan strip + preview banner for
  // non-members) lives in a gutter-respecting wrapper. The sticky
  // tab bar below uses its own full-width band.
  padding: '24px 24px 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}

const stickyTabBarStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 5,
  marginTop: 24,
  // Transparent so the bar inherits the page background — keeps the
  // hero / plan strip / preview banner reading as one continuous
  // surface above the tab nav.
  background: 'transparent',
}

const tabBarInnerStyle: CSSProperties = {
  maxWidth: 1440,
  margin: '0 auto',
  padding: '0 24px',
}

const tabPanelStyle: CSSProperties = {
  maxWidth: 1440,
  margin: '0 auto',
  padding: '24px 24px 0',
}

const tabTitleStyle: CSSProperties = {
  margin: '0 0 20px',
  fontFamily: 'var(--font-heading)',
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '-0.01em',
  color: 'var(--color-primary-800)',
}
