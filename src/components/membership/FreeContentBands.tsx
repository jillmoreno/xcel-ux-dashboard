import type { CSSProperties } from 'react'
import { ArrowUpRightFromSquare, Blog, Facebook, Podcast } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { resourcesFor, type ResourceIcon } from '@/data/membership/resourcesFixtures'

/**
 * Free Content promo bands — one band per item on the Free Content page (the
 * blog, the podcast), rendered on the Dashboard Rebrand overview directly under
 * the membership upsell band it is modelled on.
 *
 * Copy and glyphs come from the SAME `resourcesFor(brand)` fixture the Free
 * Content page renders — add a resource there and a band appears here. The one
 * deliberate difference is the sub-line: a band prefers `promoDescription`,
 * which leads with the free claim, because unlike the Free Content page there is
 * no hero here saying so and the paid upsell band sits directly above.
 *
 * Layout is `WhatsNewUpsellBand`'s `card` variant property for property: glyph →
 * title + sub-line → outlined pill, 16/24 padding, `--radius-lg`. The BACKGROUND
 * is deliberately NOT the upsell's `cta-700` plum. Three stacked plum bands
 * would read as three upsells, and these are the opposite of an upsell — the
 * whole point of the Free Content rename is that they cost nothing and need no
 * membership.
 *
 * Each band takes its colour from its CONTENT TYPE (see `ACCENT_BY_ICON`), so
 * the blog and the podcast never read as the same thing — and a third resource
 * gets a colour from the rule instead of someone picking one.
 *
 * Gated by `dashboard-free-content-bands`, default OFF — a stakeholder toggle.
 */
export function FreeContentBands() {
  const { brand } = useAccount()
  const flag = useFeatureFlag('dashboard-free-content-bands')
  const resources = resourcesFor(brand)
  if (!flag.enabled || resources.length === 0) return null

  return (
    <>
      {resources.map((resource) => {
        const Icon = ICONS[resource.icon]
        const accent = ACCENT_BY_ICON[resource.icon]
        return (
          <div key={resource.id} style={{ ...bandStyle, background: accent.bg }}>
            <span aria-hidden style={glyphStyle}>
              <Icon size={30} />
            </span>

            <div style={copyStyle}>
              <p style={titleStyle}>{resource.title}</p>
              {/* Band-specific copy that leads with the free claim; falls back
                  to the shared description. See `promoDescription` for why the
                  two surfaces word this differently. */}
              <p style={{ ...subStyle, color: accent.sub }}>
                {resource.promoDescription ?? resource.description}
              </p>
            </div>

            <a
              href={resource.href}
              target="_blank"
              rel="noopener noreferrer"
              style={ctaStyle}
              aria-label={`${resource.cta}: ${resource.title} (opens in a new tab)`}
            >
              {resource.cta}
              <ArrowUpRightFromSquare size={13} aria-hidden />
            </a>
          </div>
        )
      })}
    </>
  )
}

/** Same glyph map as `ResourceCard`, so a band and its card never disagree. */
const ICONS: Record<ResourceIcon, typeof Blog> = {
  blog: Blog,
  podcast: Podcast,
  facebook: Facebook,
}

/**
 * Content type → brand ramp. Reading is primary, audio is secondary, community
 * is tertiary; a new resource type gets its colour from this rule rather than
 * from whoever adds it.
 *
 * THE STOPS ARE NOT INTERCHANGEABLE — each is the lightest one on its ramp that
 * still carries white text at 4.5:1 on BOTH brands that have free content:
 *   • primary-900   McKissock 17.9:1 · Fitzgerald 17.6:1
 *   • secondary-800 McKissock 8.00:1 · Fitzgerald  9.16:1
 *   • tertiary-800  McKissock 7.53:1 · Fitzgerald 10.68:1
 * The mismatched stop on `secondary` is deliberate: secondary-700 is 4.33:1 on
 * McKissock and fails, so that ramp has to go a stop darker than the others.
 * Likewise tertiary-700 is 3.96:1 there. Re-measure before lightening any of
 * these — McKissock's ramps are all warm earth tones and run out of contrast
 * early.
 *
 * Separation on McKissock (the tightest palette): primary-900 vs secondary-800
 * is a wide pairing on both lightness and hue — the two never read as the same
 * band, which is the whole point of colouring by type.
 */
const ACCENT_BY_ICON: Record<ResourceIcon, { bg: string; sub: string }> = {
  blog: { bg: 'var(--color-primary-900)', sub: 'var(--color-primary-100)' },
  podcast: { bg: 'var(--color-secondary-800)', sub: 'var(--color-secondary-100)' },
  facebook: { bg: 'var(--color-tertiary-800)', sub: 'var(--color-tertiary-100)' },
}

/* ─── styles (mirror WhatsNewUpsellBand's `card` variant) ──────────── */

// `background` + the sub-line colour are overridden per item from
// `ACCENT_BY_ICON`; the values here are only the fallback shape.
const bandStyle: CSSProperties = {
  background: 'var(--color-primary-700)',
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: 18,
  padding: '16px 24px',
  borderRadius: 'var(--radius-lg)',
}

// Opacity-driven glyph, matching the upsell band's soft lock affordance rather
// than a hard tile.
const glyphStyle: CSSProperties = {
  flexShrink: 0,
  display: 'grid',
  placeItems: 'center',
  color: 'rgb(255 255 255 / 0.55)',
}

const copyStyle: CSSProperties = {
  flex: 1,
  minWidth: 240,
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  fontWeight: 800,
  lineHeight: 1.3,
  color: 'var(--color-text-inverse)',
}

// The upsell's sub-line uses `cta-100` — its own ramp's lightest stop — on the
// plum. Each band here does the same with its own ramp's -100, so the sub-line
// always belongs to the band it sits on. Overridden per item; this is the
// fallback.
const subStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.4,
  color: 'var(--color-primary-100)',
}

const ctaStyle: CSSProperties = {
  flexShrink: 0,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '10px 22px',
  borderRadius: 'var(--radius-md)',
  border: '1.5px solid var(--color-text-inverse)',
  cursor: 'pointer',
  background: 'transparent',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 800,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}
