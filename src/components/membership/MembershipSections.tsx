import type { CSSProperties } from 'react'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { MembershipPassportCard } from './MembershipPassportCard'
import { MembershipScorecard } from './MembershipScorecard'

/**
 * The two Explore Membership sections (Concept C) — "Current Membership" (the
 * passport card) beside "Membership Scorecard" (the light value panel).
 *
 * Rendered directly under the Explore Membership section hero, above the upsell
 * band. Gated by the **`membership-sections`** flag (Membership group, page
 * `dashboard-rebrand`, **default OFF**): when off this returns `null` and the
 * Explore Membership section renders exactly as it does today (upsell band →
 * quick filter → product sections), so the flag's off-state is a true no-op.
 *
 * Layout: a fixed ~352px card column beside a fluid scorecard column, collapsing
 * to a single column under ~940px. The tonal split (dark card / light panel) is
 * what separates the two sections, so each carries only a small text label.
 */
export function MembershipSections({ onManage }: { onManage?: () => void } = {}) {
  const { enabled } = useFeatureFlag('membership-sections')
  if (!enabled) return null
  return <MembershipSectionsLayout onManage={onManage} />
}

/**
 * The same two sections with **no flag gate** — for surfaces that select this
 * treatment some other way. The Membership page's `scorecard` version renders
 * this directly under its hero (replacing the hardcoded five-stat band), so it
 * must not also depend on the Explore Membership flag.
 */
export function MembershipSectionsLayout({ onManage }: { onManage?: () => void } = {}) {
  return (
    <div className="cre-membership-sections">
      <section style={colStyle} aria-labelledby="membership-current-heading">
        <h2 id="membership-current-heading" style={labelStyle}>
          Current Membership
        </h2>
        <MembershipPassportCard onManage={onManage} />
      </section>
      <section style={colStyle} aria-labelledby="membership-scorecard-heading">
        <h2 id="membership-scorecard-heading" style={labelStyle}>
          Membership Scorecard
        </h2>
        <MembershipScorecard />
      </section>
    </div>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

// Grid lives in tokens.css (`.cre-membership-sections`) because the two columns
// are deliberately unequal (352px card + fluid scorecard) and collapse at a
// breakpoint — neither is expressible as an inline style.
const colStyle: CSSProperties = { minWidth: 0 }

const labelStyle: CSSProperties = {
  margin: '0 0 12px',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.11em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-600)',
}
