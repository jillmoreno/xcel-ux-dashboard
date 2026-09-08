/**
 * DashboardHeroBand — single teal band that fuses the dashboard's
 * welcome row and the 4-stat card into one row.
 *
 * Anatomy (left to right):
 *
 *   ┌─── 1fr ────────────────────────────────────┬─── auto ───┐
 *   │ Avatar  Greeting  [Pro pill]                │ chip ╎ chip │
 *   │         "italic motto, single line…"        │ chip ╎ chip │
 *   └─────────────────────────────────────────────┴────────────┘
 *
 * - Left column = welcome content (avatar + greeting + Pro pill + motto)
 * - Right column = four inline `<StatChip>`s with subtle vertical dividers
 *
 * Visual variants driven by `membership` + (new vs returning user):
 *
 *   - **member**: Pro pill in topline, avatar gem badge, "Saved" chip
 *     in the 4th slot.
 *   - **non-member**: NO Pro pill, NO gem badge, the 4th chip swaps to
 *     an upgrade-card link pointing at `/membership/plans`.
 *   - **new user** (0 credits + 0 certs): greeting flips to "Welcome,"
 *     (no "back"), the motto slot falls back to an onboarding string
 *     if `user.motto` isn't set, and the entire stats row fades to
 *     65% opacity.
 *
 * Reference: `explorations/dashboard-top/welcome-stats-option2.html`
 * (V1 — uppercase eyebrow labels, subtle dividers, no icon discs).
 */

import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { useLoFi } from '@/context/LoFiContext'
import { dashboardStatsFor } from '@/data/learnerOverviewFixtures'
import { Gem } from '@/icons'
import { LoFiHeroBody } from '@/components/lo-fi/LoFiPlaceholders'

/** USD formatter — module-level so the Intl.NumberFormat constructor
 *  doesn't run on every render. */
const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

/** Default motto used when a user has no `user.motto` set. Spec calls
 *  this out for the new-user state — but it'd also catch any other
 *  brand whose fixture omits motto, which is fine. */
const ONBOARDING_QUOTE = 'Welcome aboard — pick a path to get started.'

export function DashboardHeroBand({
  variant = 'v2',
  vertical: verticalDefault = false,
  hideSavedChip = false,
}: {
  variant?: 'v2' | 'v3'
  /** Default orientation for this dashboard version — `true` stacks the
   *  welcome block over a 2×2 stats grid (Dashboard V4), `false` is the
   *  full-width horizontal band. The `dashboard-kpi-card` flag's
   *  "Orientation" variant overrides this: `horizontal` / `vertical`
   *  force a specific orientation, `auto` (default) honors this prop. */
  vertical?: boolean
  /** Drop the member-only "Saved this year" stat chip from the row.
   *  Used by Dashboard MVP, which pares the hero down to Credits /
   *  Progress / Certificates. Certificates then becomes the last chip. */
  hideSavedChip?: boolean
} = {}) {
  const { brand, membership, user } = useAccount()
  const { loFi } = useLoFi()
  // Orientation override from the KPI Card flag's secondary variant.
  // `auto` falls back to the per-version default passed in via the prop.
  const orientation = useFeatureFlag('dashboard-kpi-card').secondaryVariant
  const vertical =
    orientation === 'vertical'
      ? true
      : orientation === 'horizontal'
        ? false
        : verticalDefault
  const isMember = membership === 'member'
  const isV3 = variant === 'v3'

  // Lo-Fi mode strips the hero's content but keeps its shape +
  // position so the page template stays intact for design reviews.
  // Surface goes neutral grey to read as a placeholder rather than
  // the brand-colored band.
  if (loFi) {
    return (
      <div style={loFiHeroShellStyle}>
        <LoFiHeroBody ariaLabel="Lo-fi dashboard hero" />
      </div>
    )
  }
  const stats = dashboardStatsFor(brand)
  const isNewUser = stats.creditsEarned === 0 && stats.certificatesCount === 0
  const greeting = isNewUser
    ? `Welcome, ${user.firstName}`
    : `Hi ${user.firstName}`
  const quote = user.motto ?? (isNewUser ? ONBOARDING_QUOTE : null)

  // V3 inverts the band — white card surface with primary-800 text
  // instead of the teal-on-white V2 treatment. The flip is driven by a
  // single `textColor` + `dividerColor` pair that's threaded into each
  // text element / `<StatChip>` so V2 styles stay untouched. White
  // dividers on a white background obviously can't show, so V3 uses a
  // low-alpha primary-800 wash for the inter-chip dividers.
  const textColor = isV3
    ? 'var(--color-primary-800)'
    : 'var(--color-neutral-50)'
  const dividerColor = isV3
    ? 'color-mix(in srgb, var(--color-primary-800) 18%, transparent)'
    : 'rgba(255, 255, 255, 0.22)'

  const proPill = isMember ? (
    <span
      aria-label="Pro membership"
      style={{
        ...proPillStyle,
        // V3 swaps the glassy white-on-teal pill for a tinted
        // primary-100 chip with primary-300 border so it reads on the
        // inverted (white) band.
        background: isV3
          ? 'var(--color-primary-100)'
          : 'rgba(255, 255, 255, 0.15)',
        border: isV3
          ? '1px solid var(--color-primary-300)'
          : '1px solid rgba(255, 255, 255, 0.3)',
        color: textColor,
        // Vertical stacks the pill under the name — keep it hugging its
        // content instead of stretching to the column width.
        ...(vertical ? { alignSelf: 'flex-start' } : {}),
      }}
    >
      <Gem size={14} aria-hidden style={{ flexShrink: 0 }} />
      Pro Membership
    </span>
  ) : null

  // The motto. Horizontal renders it inside the body stack (next to the
  // avatar); vertical renders it full-width below the header row.
  const quoteNode = quote ? (
    <span style={{ ...quoteStyle, color: textColor }}>“{quote}”</span>
  ) : null

  return (
    <div
      style={{
        ...bandStyle,
        // Vertical orientation drops the 2-column grid and stacks the
        // welcome block over the stats so the band fits a narrow column.
        ...(vertical
          ? {
              display: 'flex',
              flexDirection: 'column',
              gridTemplateColumns: undefined,
              gap: 16,
              alignItems: 'stretch',
            }
          : {}),
        background: isV3
          ? 'var(--color-surface-card)'
          : 'var(--color-primary-500)',
        // V3 needs a hairline so the white band reads as a surface
        // against the (also light) page background. V2 keeps the
        // borderless teal slab.
        border: isV3 ? '1px solid var(--color-border-subtle)' : undefined,
      }}
    >
      {/* ── Left column ── */}
      <div style={leftStyle}>
        <Avatar
          initials={user.initials}
          size={44}
          imageUrl={user.avatarUrl}
          alt={`${user.firstName} ${user.lastName}`}
          ring
          // V3 always renders the Pro gem badge so the band's avatar
          // matches the global header's `<AccountMenu>` avatar (which
          // hardcodes `isPro={true}`). V2 keeps the membership-gated
          // behavior — the gem doubles as the Pro indicator alongside
          // the inline "Pro" pill.
          pro={isV3 ? true : isMember}
        />

        <div style={bodyStackStyle}>
          {vertical ? (
            // Vertical: name, then the Pro pill stacked below it. The
            // motto is rendered full-width below this whole row.
            <>
              <h1 style={{ ...greetingStyle, color: textColor }}>{greeting}</h1>
              {proPill}
            </>
          ) : (
            <>
              <div style={toplineStyle}>
                <h1 style={{ ...greetingStyle, color: textColor }}>
                  {greeting}
                </h1>
                {proPill}
              </div>
              {quoteNode}
            </>
          )}
        </div>
      </div>

      {/* Vertical: motto spans the full widget width, below the header. */}
      {vertical && quote && (
        <span
          style={{
            ...quoteStyle,
            color: textColor,
            width: '100%',
            // Let the full motto wrap across the widget rather than
            // truncating to a single line.
            whiteSpace: 'normal',
            overflow: 'visible',
            textOverflow: 'clip',
          }}
        >
          “{quote}”
        </span>
      )}

      {/* ── Right column — four stat chips. Wrap in a group so we can
          fade the whole row at once when the user is brand-new. ── */}
      <div
        data-faded={isNewUser ? 'true' : undefined}
        style={{
          ...statsRowStyle,
          // Vertical: 2×2 grid of stats instead of the 4-up horizontal
          // row. `alignItems: stretch` overrides the base `center` so
          // each cell's left-aligned contents line up flush-left.
          ...(vertical
            ? {
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '12px 20px',
                alignItems: 'stretch',
              }
            : {}),
          opacity: isNewUser ? 0.65 : 1,
        }}
      >
        <StatChip
          label={isMember ? 'Member Since' : 'Learner Since'}
          value="2024"
          sub="1 year, 54 days"
          textColor={textColor}
          dividerColor={dividerColor}
          vertical={vertical}
        />
        <StatChip
          label="Credits"
          value={String(stats.creditsEarned)}
          sub="total completed"
          textColor={textColor}
          dividerColor={dividerColor}
          vertical={vertical}
        />
        <StatChip
          label="Certificates"
          value={String(stats.certificatesCount)}
          sub="lifetime earned"
          // When V3 non-member drops the 4th chip — or MVP hides the
          // Saved chip — Certificates is the last visible chip, so
          // collapse its right divider.
          isLast={(isV3 && !isMember) || hideSavedChip}
          textColor={textColor}
          dividerColor={dividerColor}
          vertical={vertical}
        />
        {hideSavedChip ? (
          // MVP drops the 4th slot entirely — no Saved chip and no
          // UpgradeChip fallback — so the row ends at Certificates.
          null
        ) : isMember ? (
          <StatChip
            label="Saved"
            value={USD.format(stats.savedAmount)}
            sub="this year"
            isLast
            textColor={textColor}
            dividerColor={dividerColor}
            vertical={vertical}
          />
        ) : isV3 ? (
          // V3 drops the inline UpgradeChip — the upgrade affordance
          // lives at the top of the right sidebar (Premium Membership
          // SidebarCard moved to position 1 for non-members) so the
          // hero band stays focused on stats.
          null
        ) : (
          <UpgradeChip />
        )}
      </div>
    </div>
  )
}

/* ─── StatChip ──────────────────────────────────────────────────────── */

function StatChip({
  label,
  value,
  sub,
  isLast,
  textColor,
  dividerColor,
  vertical = false,
}: {
  label: string
  value: string
  sub?: string
  isLast?: boolean
  /** Foreground color for the chip's label / value / sub. Lets V3
   *  flip white-on-teal to primary-800-on-white without forking the
   *  whole component. */
  textColor: string
  /** Color of the divider drawn on the chip's right edge. Skipped
   *  when `isLast` is true so the row ends flush. */
  dividerColor: string
  /** Vertical orientation — renders as a full-width row (label left,
   *  value + sub right) with a bottom divider, for the V4 stacked band. */
  vertical?: boolean
}) {
  if (vertical) {
    // 2×2 grid cell — separation comes from the grid gap, so no
    // per-cell divider (isLast / dividerColor only matter to the
    // horizontal row variant).
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 3,
          color: textColor,
        }}
      >
        <span style={{ ...chipLabelStyle, color: textColor }}>{label}</span>
        <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ ...chipValueStyle, color: textColor, marginTop: 0 }}>
            {value}
          </span>
          {sub && (
            <span style={{ ...chipSubStyle, color: textColor, marginTop: 0 }}>
              {sub}
            </span>
          )}
        </span>
      </div>
    )
  }
  return (
    <div
      style={{
        ...chipStyle,
        color: textColor,
        // Last chip drops its divider so the row ends flush.
        borderRight: isLast ? 'none' : `1px solid ${dividerColor}`,
        paddingRight: isLast ? 0 : 14,
      }}
    >
      <span style={{ ...chipLabelStyle, color: textColor }}>{label}</span>
      <span style={{ ...chipValueStyle, color: textColor }}>{value}</span>
      {sub && <span style={{ ...chipSubStyle, color: textColor }}>{sub}</span>}
    </div>
  )
}

/* ─── UpgradeChip — non-Pro 4th-slot replacement ───────────────────── */

function UpgradeChip() {
  return (
    <Link
      to="/membership/plans"
      aria-label="Upgrade to Pro membership"
      style={upgradeLinkStyle}
    >
      <span style={upgradeLabelStyle}>Upgrade to Pro</span>
      <span style={upgradeValueStyle}>Save 20% on courses</span>
    </Link>
  )
}

/* ─── styles ────────────────────────────────────────────────────────── */

const loFiHeroShellStyle: CSSProperties = {
  // Matches the V2 band's outer dimensions so the page layout below
  // doesn't shift when Lo-Fi flips on. Surface goes neutral grey
  // rather than the brand teal — the placeholder reads as
  // intentional rather than a "broken" theme.
  background: 'var(--color-neutral-100)',
  border: '1px solid var(--color-neutral-200)',
  borderRadius: 'var(--radius-lg)',
  padding: '32px 40px',
}

const bandStyle: CSSProperties = {
  background: 'var(--color-primary-500)',
  borderRadius: 'var(--radius-lg)',
  // Compact vertical padding — the band is dense info (avatar +
  // greeting + motto + 4 stats), the breathing room was eating too
  // much screen real estate above the streak hero.
  padding: '12px 24px',
  display: 'grid',
  // `minmax(380px, 1fr) auto` keeps the welcome content from
  // collapsing too narrow while the stats row stays auto-sized.
  gridTemplateColumns: 'minmax(380px, 1fr) auto',
  gap: 28,
  alignItems: 'center',
}

const leftStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 14,
  minWidth: 0,
}

const bodyStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  minWidth: 0,
}

const toplineStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
}

const greetingStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--color-neutral-50)',
  letterSpacing: '-0.01em',
  lineHeight: 1.15,
}

const proPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  background: 'rgba(255, 255, 255, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  color: 'var(--color-neutral-50)',
  padding: '3px 10px',
  borderRadius: 'var(--radius-pill)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  flexShrink: 0,
}

const quoteStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontStyle: 'italic',
  fontSize: 12,
  // Full-opacity white + weight 500 for AA-friendlier contrast on the
  // teal band. The previous `rgba(255,255,255,0.82)` washed the motto
  // below the WCAG threshold; bumping to full white and stepping the
  // weight up from regular keeps it readable without growing the band.
  fontWeight: 500,
  color: 'var(--color-neutral-50)',
  lineHeight: 1.3,
  // Single-line truncation — production motto values should fit ~80
  // characters; longer strings get an ellipsis at the column width.
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const statsRowStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, auto)',
  gap: 22,
  alignItems: 'center',
  // `opacity` is overridden inline at the render site for the
  // new-user faded-row state.
}

const chipStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  color: 'var(--color-neutral-50)',
  minWidth: 80,
  // borderRight + paddingRight set inline per-chip so the last chip
  // can drop both. CSS `:last-child` selectors don't work with inline
  // styles, hence the prop-driven approach.
}

const chipLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  // Bumped weight to 700 so the uppercase eyebrow reads as bold small
  // caps. Combined with full-opacity white the label clears WCAG AA on
  // the teal band (the prior `rgba(...,0.72)` wash fell below).
  fontWeight: 700,
  letterSpacing: '0.12em',
  // CSS uppercases the label so source stays sentence-case ("Credits"
  // not "CREDITS") — copy edits flow without re-casing strings.
  textTransform: 'uppercase',
  color: 'var(--color-neutral-50)',
}

const chipValueStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 20,
  fontWeight: 700,
  lineHeight: 1,
  marginTop: 2,
  color: 'var(--color-neutral-50)',
}

const chipSubStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  // Same opacity bump as the chip label — full white + weight 500 so
  // the secondary caption ("of 200", "all paths", etc.) clears AA on
  // the teal band.
  fontWeight: 500,
  color: 'var(--color-neutral-50)',
  marginTop: 2,
}

const upgradeLinkStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  background: 'rgba(249, 180, 40, 0.15)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 12px',
  textDecoration: 'none',
  minWidth: 100,
}

const upgradeLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--color-warning-500)',
}

const upgradeValueStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  // The upgrade CTA isn't a stat — its value is action copy, so it
  // gets a smaller, body-weight treatment vs the 26px stat values.
  color: 'var(--color-neutral-50)',
  marginTop: 4,
  whiteSpace: 'nowrap',
}
