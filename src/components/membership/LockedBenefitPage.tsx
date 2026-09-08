import type { CSSProperties, ComponentType } from 'react'
import { ArrowRight, Award, Check, Gem, Library, Lock, RubiLogo } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiHeroBody } from '@/components/lo-fi/LoFiPlaceholders'
import {
  benefitMarketingFor,
  type LockedBenefitSection,
} from '@/data/membership/benefitMarketingFixtures'
import { benefitHeroesFor } from '@/data/membership/benefitHeroesFixtures'

/**
 * Non-member "locked benefit" page — what a non-member sees after clicking a
 * Passport-only rail item (Resource Library / Exam & Cert Prep / Rubi AI
 * Tools / Partner Offers) in the Dashboard Rebrand shell.
 *
 * Styled to match the **member Explore Membership marketing heroes**
 * (`BenefitHeroSections`): a single accent-tinted band (per-benefit accent),
 * a real marketing photo on the left (with a lock badge to signal the benefit
 * is gated), and on the right a MEMBER BENEFIT kicker + headline + lede +
 * check-bullets + a single "See membership plans" CTA that routes the non-member
 * in-shell to Explore Membership (`onSeePlans`).
 *
 * Copy is fixture-backed + Elite-only via `benefitMarketingFor`; the photo +
 * accent reuse the matching `benefitHeroesFor` entry (Partner Offers has no
 * hero photo, so it falls back to the accent-surface icon tile). Token-only.
 */

const ICONS: Record<string, ComponentType<{ size?: number; 'aria-hidden'?: boolean }>> = {
  library: Library,
  award: Award,
  rubi: RubiLogo,
  gem: Gem,
}

type AccentKey = 'teal' | 'sky' | 'lavender' | 'gold'
type AccentBundle = { sectionBg: string; text: string; surface: string; solid: string }

const ACCENTS: Record<AccentKey, AccentBundle> = {
  teal: {
    sectionBg: 'color-mix(in srgb, var(--color-secondary-100) 55%, var(--color-surface-card))',
    text: 'var(--color-secondary-700)',
    surface: 'var(--color-secondary-100)',
    solid: 'var(--color-secondary-500)',
  },
  sky: {
    sectionBg:
      'color-mix(in srgb, var(--color-info-100, var(--color-primary-100)) 55%, var(--color-surface-card))',
    text: 'var(--color-info-700, var(--color-primary-700))',
    surface: 'var(--color-info-100, var(--color-primary-100))',
    solid: 'var(--color-info-500, var(--color-primary-500))',
  },
  lavender: {
    sectionBg: 'color-mix(in srgb, var(--color-cta-100) 55%, var(--color-surface-card))',
    text: 'var(--color-cta-700)',
    surface: 'var(--color-cta-100)',
    solid: 'var(--color-cta-500)',
  },
  gold: {
    sectionBg: 'color-mix(in srgb, var(--color-tertiary-100) 55%, var(--color-surface-card))',
    text: 'var(--color-tertiary-700)',
    surface: 'var(--color-tertiary-100)',
    solid: 'var(--color-tertiary-500)',
  },
}

/** Per locked section: accent + the `benefitHeroesFor` id whose photo to reuse
 *  (empty = no hero photo → accent-surface icon tile). */
const SECTION_META: Record<LockedBenefitSection, { accent: AccentKey; heroId: string }> = {
  'm-learning-library': { accent: 'teal', heroId: 'learning-library' },
  'm-exam-prep': { accent: 'sky', heroId: 'exam-prep' },
  'm-career-tools': { accent: 'lavender', heroId: 'career-tools' },
  'm-more': { accent: 'gold', heroId: '' },
}

export function LockedBenefitPage({
  section,
  onSeePlans,
}: {
  section: LockedBenefitSection
  /** Routes the non-member to Explore Membership in-shell (no navigation away). */
  onSeePlans: () => void
}) {
  const { brand } = useAccount()
  const { loFi } = useLoFi()
  const meta = benefitMarketingFor(brand, section)
  if (!meta) return null

  if (loFi) {
    return (
      <div style={loFiBlockStyle}>
        <LoFiHeroBody ariaLabel="Lo-fi benefit marketing" />
      </div>
    )
  }

  const Icon = ICONS[meta.iconKey] ?? Library
  const { accent: accentKey, heroId } = SECTION_META[section]
  const accent = ACCENTS[accentKey]
  const photo = heroId ? benefitHeroesFor(brand).find((h) => h.id === heroId)?.image : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Upgrade strip — the compact "become a member" hero; owns the page CTA. */}
      <section aria-label="Become a member" style={stripStyle}>
        <span aria-hidden style={lockChipStyle}>
          <Lock size={22} aria-hidden />
        </span>
        <div style={stripCopyStyle}>
          <p style={stripTitleStyle}>{meta.stripTitle}</p>
          <p style={stripSubtitleStyle}>{meta.stripSubtitle}</p>
        </div>
        <button type="button" onClick={onSeePlans} style={ctaStyle}>
          See membership plans
          <ArrowRight size={16} aria-hidden />
        </button>
      </section>

      {/* Marketing hero — accent band + photo + value pitch (no CTA; the strip
          above owns the single page CTA). */}
      <section aria-label="Membership benefit" style={{ ...bandStyle, background: accent.sectionBg }}>
        <div style={{ ...mediaStyle, background: accent.surface, color: accent.text }} aria-hidden>
          {photo ? (
            <img src={photo} alt="" style={photoStyle} loading="lazy" decoding="async" referrerPolicy="no-referrer" />
          ) : (
            <Icon size={36} aria-hidden />
          )}
          <span style={lockBadgeStyle}>
            <Lock size={13} aria-hidden />
            Members only
          </span>
        </div>

        <div style={{ minWidth: 0 }}>
          <span style={{ ...kickerStyle, color: accent.text }}>{meta.eyebrow}</span>
          <h2 style={titleStyle}>{meta.title}</h2>
          <p style={blurbStyle}>{meta.blurb}</p>
          <ul style={bulletListStyle}>
            {meta.bullets.map((bullet) => (
              <li key={bullet} style={bulletRowStyle}>
                <span aria-hidden style={{ ...checkStyle, color: accent.text }}>
                  <Check size={16} aria-hidden />
                </span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

/* ─── styles (tokens only) ───────────────────────────────────────────── */

const stripStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 18,
  flexWrap: 'wrap',
  background:
    'linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800))',
  borderRadius: 'var(--radius-md)',
  padding: '18px 22px',
}

const lockChipStyle: CSSProperties = {
  flexShrink: 0,
  width: 44,
  height: 44,
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
}

const stripCopyStyle: CSSProperties = {
  flex: 1,
  minWidth: 230,
}

const stripTitleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--color-text-inverse)',
}

const stripSubtitleStyle: CSSProperties = {
  margin: '2px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.5,
  color: 'var(--color-primary-100)',
}

const bandStyle: CSSProperties = {
  display: 'grid',
  // Match the member marketing heroes' even split so the copy isn't cramped.
  gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
  gap: 40,
  alignItems: 'center',
  borderRadius: 'var(--radius-lg)',
  padding: '36px 40px',
}

const mediaStyle: CSSProperties = {
  position: 'relative',
  aspectRatio: '4 / 3',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const photoStyle: CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  display: 'block',
}

const lockBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '4px 10px',
  borderRadius: 'var(--radius-pill)',
  background: 'rgb(0 0 0 / 0.6)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

const loFiBlockStyle: CSSProperties = {
  background: 'var(--color-neutral-100)',
  border: '1px solid var(--color-neutral-200)',
  borderRadius: 'var(--radius-lg)',
  padding: 26,
}

const kickerStyle: CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  marginBottom: 8,
}

const titleStyle: CSSProperties = {
  margin: '0 0 10px',
  fontFamily: 'var(--font-heading)',
  fontSize: 'var(--text-heading-2xl)',
  fontWeight: 700,
  lineHeight: 'var(--text-heading-2xl--line-height)',
  color: 'var(--color-text-primary)',
}

const blurbStyle: CSSProperties = {
  margin: '0 0 18px',
  maxWidth: '54ch',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.55,
  color: 'var(--color-text-secondary)',
}

const bulletListStyle: CSSProperties = {
  listStyle: 'none',
  margin: '0 0 22px',
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const bulletRowStyle: CSSProperties = {
  display: 'flex',
  gap: 9,
  alignItems: 'center',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  color: 'var(--color-text-primary)',
}

const checkStyle: CSSProperties = {
  flexShrink: 0,
  lineHeight: 0,
}

const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  minHeight: 44,
  padding: '0 22px',
  border: 'none',
  cursor: 'pointer',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-heading)',
  fontSize: 15,
  fontWeight: 700,
}
