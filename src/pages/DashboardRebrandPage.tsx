import { useEffect, useLayoutEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAccount, type Brand } from '@/context/AccountContext'
import { useTheme } from '@/context/ThemeContext'
import { useFeatureFlags } from '@/context/FeatureFlagContext'
import { parseTierParam } from '@/components/prototype/demoControlsUtil'
import { PlatformShell } from '@/components/layout/PlatformShell'

/**
 * The rebranded dashboard — the persistent dark left-nav shell, reached from
 * the "Dashboard Rebrand" tile on the prototype home (no longer a feature
 * flag). Lives at `/dashboard-rebrand`; the classic `/dashboard` (V1–V5) is
 * untouched.
 *
 * Seeds the demo account to Elite ONCE on entry (the membership-overview
 * landing + the V7 membership sections are Elite-only). It deliberately does
 * NOT re-assert `member`: the slim header's Member toggle owns the
 * member ⇄ non-member flip from here on, and re-pinning would fight it. If
 * the brand is already Elite we leave `membership` exactly as the toggle /
 * stored state left it; otherwise we seed Elite + member as the default
 * landing state. The one-shot `useRef` guard keeps the effect from resetting
 * membership when the toggle later flips it (which re-renders this page).
 *
 * An explicit `?membership=member|non-member` query param (used by the
 * Motivating-Statement prototype gateway to land a reviewer directly in one
 * view) is honored in that same one-shot seed — it deterministically sets the
 * membership on entry instead of relying on a click-time `setAccount` that
 * races the gateway's own account-pinning effect. Because the seed is one-shot,
 * the in-shell Member toggle still owns every flip afterward.
 */
export function DashboardRebrandPage() {
  const { brand, setAccount, setTier } = useAccount()
  const { theme } = useTheme()
  const { setDemoMode } = useFeatureFlags()
  const [params] = useSearchParams()
  const wantMembership = params.get('membership')
  // `?tier=` names a SPECIFIC tier (non-member / low / mid / high); `?membership=`
  // only says member-or-not and resolves to the brand's DEFAULT member tier. So
  // when both are present the tier param wins — otherwise a link asking for
  // Passport lands on Passport Lite, silently, because the coarser param
  // overwrote it. (The Demo Controls bar restores `?tier=` too, but this seed
  // runs after it and would clobber the result.)
  const wantTier = parseTierParam(params.get('tier'))
  // An explicit `?brand=` opts the shell out of the default Elite seed so a
  // brand-agnostic section (e.g. Help & Support) can be demoed in any brand
  // from the prototype gateway. Mirrors the one-shot `?membership=` handling.
  const brandParam = params.get('brand')
  // Validated rather than cast: `?brand=` is user-supplied, and a link written
  // against the six-brand LMS dashboard can still name a brand this repo does
  // not have. Unknown ⇒ null ⇒ the default seed below.
  const KNOWN_BRANDS: Brand[] = ['xcel']
  const wantBrand = KNOWN_BRANDS.includes(brandParam as Brand) ? (brandParam as Brand) : null
  // The "pure" Demo view — opened from the Demo tab tile as
  // `/dashboard-rebrand?demo=1`. It swaps the live feature flags for the
  // Default baseline and suspends persistence, so tinkering in the sandbox
  // never changes what the Demo renders (and vice versa). The layout version
  // is inherently pure already (URL-driven, no persisted default), so a fresh
  // Demo open lands on Marketing Focused.
  const demo = params.get('demo') === '1'
  const seeded = useRef(false)

  // Toggle demo mode for the lifetime of the page. useLayoutEffect so the
  // baseline swap lands before first paint (no flash of the tinkered config),
  // and the cleanup restores the sandbox flags on exit.
  useLayoutEffect(() => {
    setDemoMode(demo)
    return () => setDemoMode(false)
  }, [demo, setDemoMode])
  useEffect(() => {
    if (seeded.current) return
    seeded.current = true
    // Target brand: `?brand=` is kept as the seam it was, but with one brand
    // it can only ever resolve to XCEL. Elite was the LMS's default seed.
    const targetBrand: Brand = wantBrand ?? 'xcel'
    // An explicit membership param wins — seed the target brand + that
    // membership so a gateway deep-link lands squarely in the member OR
    // non-member view.
    if (wantTier) {
      setAccount(targetBrand, wantTier === 'non-member' ? 'non-member' : 'member')
      if (wantTier !== 'non-member') setTier(wantTier)
      return
    }
    if (wantMembership === 'member' || wantMembership === 'non-member') {
      setAccount(targetBrand, wantMembership)
      return
    }
    // Otherwise only seed when arriving on a different brand than the target.
    // Already on the target keeps whatever membership the toggle / localStorage
    // carried in.
    if (brand !== targetBrand) {
      setAccount(targetBrand, 'member')
    }
  }, [brand, wantBrand, wantMembership, wantTier, setAccount, setTier])

  // Dark mode is SCOPED to this feature: write the active theme onto <html>
  // only while this page is mounted (so the slim header, left rail, and
  // content column all pick up the [data-theme='dark'] token overrides in
  // tokens.css), and clear it on unmount so every other route renders light.
  // The preference itself persists in ThemeContext → localStorage, so the
  // chosen mode is remembered the next time the reviewer opens the feature.
  useEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    // index.html pins an inline `color-scheme: light` on <html>; set it inline
    // here too so dark mode's native controls (scrollbars, date pickers) match,
    // since an inline style beats the stylesheet rule.
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light'
    return () => {
      delete root.dataset.theme
      root.style.colorScheme = 'light'
    }
  }, [theme])

  // The learning-experience setup state lives in AppLayout's LearningSetupProvider
  // (shared with the standalone `/onboarding-flow` wizard) so a finished wizard's
  // picks carry into this dashboard's populated Current Learning Path.
  return <PlatformShell />
}
