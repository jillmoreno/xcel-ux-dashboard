import { type ComponentType, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Award, Check, Library, Podcast, Robot, Star } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import {
  benefitHeroesFor,
  type BenefitHero,
  type BenefitHeroAccent,
  type BenefitHeroCta,
  type BenefitHeroIconKey,
} from '@/data/membership/benefitHeroesFixtures'
import { isGated } from '../v4/sharedUtil'
import { UnlockChip } from '../v4/shared'
import { Wrap } from '../v2/passportShared'

/**
 * Four full-width, alternating marketing hero sections — one per benefit
 * (Resource Library, CE Podcasts, Exam & Cert Prep, AI Career Tools). Used by
 * the V5 / V7 Membership-First overview AND the v1 "Membership Benefits" tab.
 *
 * Copy + CTAs come from `benefitHeroesFor(brand)` (Elite-only; other brands
 * render nothing). The `variant` prop picks which CTA set + framing to use:
 *   - `'member'`    → benefit deep-links ("Browse the library", …).
 *   - `'marketing'` → non-member pitch ("Learn more" → benefit, "Become a
 *                     member" → `#plans`); Passport-only benefits get the
 *                     dimmed "Unlock with Passport" chip (`isGated`), while
 *                     `both`-tier benefits (CE podcasts) stay open.
 *
 * Each section themes via a single `--accent-*` custom-property set; layout
 * alternates image-right / image-left and collapses to one column under
 * 880px. All colors come from existing Elite tokens — no new tokens.
 */

type Side = 'image-right' | 'image-left'
type IconComponent = ComponentType<{ size?: number; 'aria-hidden'?: boolean }>

const ICONS: Record<BenefitHeroIconKey, IconComponent> = {
  library: Library,
  podcast: Podcast,
  award: Award,
  robot: Robot,
}

/** Map an accent key to its `{ solid, bg, text, surface, sectionBg }`
 *  token bundle. `solid` paints the primary CTA fill; `bg` is the chip
 *  tint behind the kicker + check icon; `text` is the dark accent color;
 *  `surface` backs the image fallback tile; `sectionBg` is the soft
 *  full-section wash that sets each hero apart from its neighbour. All
 *  four tones come from existing CRE / Nectar tokens — no new colors
 *  introduced. */
function accentTokens(accent: BenefitHeroAccent): {
  solid: string
  bg: string
  text: string
  surface: string
  sectionBg: string
} {
  switch (accent) {
    case 'teal':
      return {
        solid: 'var(--color-secondary-500)',
        bg: 'var(--color-secondary-100)',
        text: 'var(--color-secondary-700)',
        surface: 'var(--color-secondary-50, var(--color-secondary-100))',
        sectionBg: 'color-mix(in srgb, var(--color-secondary-100) 55%, var(--color-surface-card))',
      }
    case 'gold':
      return {
        solid: 'var(--color-tertiary-500)',
        bg: 'var(--color-tertiary-100)',
        text: 'var(--color-tertiary-700)',
        surface: 'var(--color-tertiary-50, var(--color-tertiary-100))',
        sectionBg: 'color-mix(in srgb, var(--color-tertiary-100) 55%, var(--color-surface-card))',
      }
    case 'sky':
      return {
        // Page already ships an "info" semantic ramp from Nectar; we route
        // the sky-blue accent through it so we don't introduce new tokens.
        solid: 'var(--color-info-500, var(--color-primary-500))',
        bg: 'var(--color-info-100, var(--color-primary-100))',
        text: 'var(--color-info-700, var(--color-primary-700))',
        surface: 'var(--color-info-50, var(--color-primary-100))',
        sectionBg:
          'color-mix(in srgb, var(--color-info-100, var(--color-primary-100)) 55%, var(--color-surface-card))',
      }
    case 'lavender':
    default:
      return {
        solid: 'var(--color-cta-500)',
        bg: 'var(--color-cta-100)',
        text: 'var(--color-cta-700)',
        surface: 'var(--color-cta-50, var(--color-cta-100))',
        sectionBg: 'color-mix(in srgb, var(--color-cta-100) 55%, var(--color-surface-card))',
      }
  }
}

export function BenefitHeroSections({
  variant = 'member',
}: {
  /** `'member'` uses the benefit deep-links; `'marketing'` uses the
   *  non-member pitch CTAs + the gated Unlock-with-Passport treatment. */
  variant?: 'member' | 'marketing'
} = {}) {
  const { brand } = useAccount()
  const heroes = benefitHeroesFor(brand)
  // Non-member CTA style flag (marketing variant only): default shows
  // "Learn more" + "Become a member"; `join-only` collapses to a single
  // "Become a member". Read unconditionally (hook rules); used only in
  // the marketing variant.
  const ctaStyle = useFeatureFlag('benefits-cta-style').variant ?? 'learn-more'
  const joinOnly = variant === 'marketing' && ctaStyle === 'join-only'

  if (heroes.length === 0) return null

  return (
    <Wrap style={{ padding: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {heroes.map((hero, i) => (
          <BenefitHeroRow
            key={hero.id}
            hero={hero}
            variant={variant}
            joinOnly={joinOnly}
            side={i % 2 === 0 ? 'image-right' : 'image-left'}
          />
        ))}
      </div>
    </Wrap>
  )
}

function BenefitHeroRow({
  hero,
  variant,
  joinOnly,
  side,
}: {
  hero: BenefitHero
  variant: 'member' | 'marketing'
  joinOnly: boolean
  side: Side
}) {
  const tokens = accentTokens(hero.accent)
  const Icon = ICONS[hero.iconKey]
  const headingId = `benefit-${hero.id}-heading`
  // Marketing variant browses as Lite — Passport-only benefits are gated
  // (show the "Unlock with Passport" chip); `both`-tier stays open.
  const gated = variant === 'marketing' && isGated(hero.tier, 'lite')

  // Pick the CTA pair. Member → benefit deep-links. Marketing → "Learn more"
  // + "Become a member", or (join-only flag) a single "Become a member".
  let primaryCta: BenefitHeroCta
  let secondaryCta: BenefitHeroCta | null
  if (variant === 'marketing') {
    if (joinOnly) {
      primaryCta = hero.marketingCta.secondary
      secondaryCta = null
    } else {
      primaryCta = hero.marketingCta.primary
      secondaryCta = hero.marketingCta.secondary
    }
  } else {
    primaryCta = hero.memberCta.primary
    secondaryCta = hero.memberCta.secondary
  }

  // `--accent-*` cascades to every accented descendant (kicker chip,
  // bullet check icon, stat chip, button) so the whole section themes
  // from one declaration.
  const accentVars = {
    ['--accent-solid' as const]: tokens.solid,
    ['--accent-bg' as const]: tokens.bg,
    ['--accent-text' as const]: tokens.text,
    ['--accent-surface' as const]: tokens.surface,
    ['--accent-section-bg' as const]: tokens.sectionBg,
  } as CSSProperties

  return (
    <section
      aria-labelledby={headingId}
      className="cre-benefit-hero"
      data-side={side}
      data-gated={gated || undefined}
      style={accentVars}
    >
      <div className="cre-benefit-hero__copy">
        <div className="cre-benefit-hero__kickers">
          <span className="cre-benefit-hero__kicker">{hero.kicker}</span>
          {gated && <UnlockChip />}
        </div>
        {/* H3 (not H2) so the page's tab-title <h2> stays the only <h2>
            on the panel — keeps a valid heading outline. */}
        <h3 id={headingId} className="cre-benefit-hero__title">
          {hero.heading}
        </h3>
        <p className="cre-benefit-hero__lede">{hero.lede}</p>
        <ul className="cre-benefit-hero__list">
          {hero.bullets.map((bullet) => (
            <li key={bullet} className="cre-benefit-hero__item">
              <span className="cre-benefit-hero__check" aria-hidden="true">
                <Check size={12} aria-hidden />
              </span>
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
        <div className="cre-benefit-hero__actions">
          <CtaLink
            href={primaryCta.href}
            className="cre-benefit-hero__primary"
            ariaLabel={`${primaryCta.label} — ${hero.kicker}`}
          >
            {primaryCta.label}
            <ArrowRight size={15} aria-hidden />
          </CtaLink>
          {secondaryCta && (
            <CtaLink
              href={secondaryCta.href}
              className="cre-benefit-hero__secondary cre-link-action"
            >
              {secondaryCta.label}
              <ArrowRight size={13} aria-hidden />
            </CtaLink>
          )}
        </div>
      </div>

      <div className="cre-benefit-hero__media" aria-hidden="false">
        <div className="cre-benefit-hero__photo-wrap">
          <img
            className="cre-benefit-hero__photo"
            src={hero.image}
            alt={hero.imageAlt}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
          />
          <span className="cre-benefit-hero__badge" aria-hidden="true">
            <Icon size={20} aria-hidden />
          </span>
          <div className="cre-benefit-hero__stat" aria-hidden="true">
            <span className="cre-benefit-hero__stat-icon">
              <Star size={12} aria-hidden />
            </span>
            <div>
              <strong>{hero.stat.heading}</strong>
              <span>{hero.stat.sub}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** CTA renderer — a native `<a>` for in-page hash anchors (`#plans`, so the
 *  browser scrolls to the plan comparison) and a router `<Link>` for app
 *  routes. */
function CtaLink({
  href,
  className,
  ariaLabel,
  children,
}: {
  href: string
  className: string
  ariaLabel?: string
  children: React.ReactNode
}) {
  if (href.startsWith('#')) {
    return (
      <a href={href} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    )
  }
  return (
    <Link to={href} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  )
}
