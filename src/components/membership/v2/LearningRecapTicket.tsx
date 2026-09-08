import type { ComponentType, CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen, Podcast, Video } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { useTheme } from '@/context/ThemeContext'
import {
  learningAtAGlanceFor,
  type ContentFormat,
} from '@/data/membership/learningAtAGlanceFixtures'

/**
 * Compact, ticket-style variant of the "Your year in learning" recap teaser
 * (the sibling {@link import('./LearningRecapBadge').LearningRecapBadge} is
 * the full-width teal band — this one reflows the SAME data into a narrow,
 * ~240px card for a 1/3-width column).
 *
 * Styled in the Passport / Achievements visual language: Cutive Mono
 * numerals (`--font-stamp`), dashed "perforation" rules, and a circular
 * year stamp — so the recap reads as a collectible moment, not another
 * stat tile.
 *
 * Elite-only, member-only (selector returns null otherwise). It deliberately
 * does NOT wrap itself in `Block`/`Wrap`: the PRD allows a `style`
 * passthrough instead so a grid/flex parent can place it (here it sits to
 * the right of the Current Learning Path card in the membership overview).
 */
const FORMAT_ICON: Record<ContentFormat, ComponentType<{ size?: number }>> = {
  video: Video,
  podcast: Podcast,
  reading: BookOpen,
}

function dominantFormat(mix: Record<ContentFormat, number>): ContentFormat {
  return (Object.keys(mix) as ContentFormat[]).reduce((top, f) =>
    mix[f] > mix[top] ? f : top,
  )
}

export function LearningRecapTicket({
  style,
  layout = 'ticket',
}: {
  style?: CSSProperties
  /** `'ticket'` (default) is the narrow ~300px Passport card; `'banner'` is a
   *  full-width horizontal strip with the same data reflowed into a single
   *  row (header → stats → interests → CTA). */
  layout?: 'ticket' | 'banner'
}) {
  const { brand, membership } = useAccount()
  // The `membership-recap-ticket` flag (which offered a dark variant) was
  // archived 2026-08-17 — this ticket now always renders in its light treatment.
  const dark = false
  const { theme } = useTheme()
  const glance = learningAtAGlanceFor(brand)
  if (membership !== 'member' || !glance) return null

  // Archetype chip drops the leading "The " for the compact label.
  const archetypeShort = glance.archetype.label.replace(/^The\s+/, '')
  const FormatIcon = FORMAT_ICON[dominantFormat(glance.archetype.mix)]
  const isBanner = layout === 'banner'
  // Banner trims to a single top interest so the right edge of the strip
  // stays compact next to the CTA; the ticket layout still shows three.
  const topInterests = glance.topSpecialties.slice(0, isBanner ? 1 : 3).map((s) => s.name)
  const year = String(new Date().getFullYear())

  // Dark variant (feature flag): neutral-800 surface, white text, and accent
  // tones lightened to their 400 shades so they stay legible on the dark fill.
  // The default `banner` variant sits on the page's `surface-card`, which the
  // rebrand dark theme turns navy — there the -600 accents collapse (the audit
  // measured "42"/"Pharmacology" at 1.72:1), so lift them to the -300 stops
  // when the rendered theme is dark. Fixes finding #1 for the recap strip.
  const bannerDark = !dark && theme === 'dark'
  const accents = dark ? PILL_COLORS_DARK : bannerDark ? PILL_COLORS_LIGHTEN : PILL_COLORS
  const mutedColor = dark ? 'rgb(255 255 255 / 0.65)' : undefined

  // Header block — title + archetype eyebrow + year stamp. Shared between
  // layouts; the banner variant pushes the year inline next to the title.
  const header = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: isBanner ? 'flex-start' : 'space-between',
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ ...TITLE, ...(dark ? { color: 'var(--color-text-inverse)' } : null) }}>
          Year in learning
        </div>
        <div style={{ ...ARCHETYPE, ...(mutedColor ? { color: mutedColor } : null) }}>
          <FormatIcon size={13} aria-hidden />
          {archetypeShort.toUpperCase()}
        </div>
      </div>
      {/* Year stamp is purely decorative — drop it in banner mode so the
          row has room for the CTA next to the KPI columns. */}
      {!isBanner && (
        <span
          aria-hidden
          style={{
            ...YEAR,
            ...(dark ? { color: 'var(--color-secondary-300)' } : null),
          }}
        >
          {year}
        </span>
      )}
    </div>
  )

  const stats = (
    <div
      style={{
        ...STAT_STRIP,
        ...(isBanner ? BANNER_STAT_STRIP : null),
        ...(dark
          ? isBanner
            ? { borderLeftColor: 'rgb(255 255 255 / 0.2)', borderRightColor: 'rgb(255 255 255 / 0.2)' }
            : { borderTopColor: 'rgb(255 255 255 / 0.2)', borderBottomColor: 'rgb(255 255 255 / 0.2)' }
          : null),
      }}
    >
      <Stat value={glance.consistency.ceHours} caption="CE HRS" valueColor={accents[0]} captionColor={mutedColor} />
      <Stat value={glance.consistency.streakWeeks} caption="WK STREAK" valueColor={accents[1]} captionColor={mutedColor} />
      <Stat value={glance.milestones.certificatesEarned} caption="CERTS" valueColor={accents[2]} captionColor={mutedColor} />
      {/* Banner-only: the top interest joins the stat strip as a 4th
          column so the pill sits on the same row as the numerals and
          the "TOP INTEREST" caption mirrors CE HRS / CERTS. */}
      {isBanner &&
        topInterests.map((name, i) => {
          const color = accents[i % accents.length]
          return (
            <div
              key={`pill-${name}`}
              style={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <span style={{ ...PILL, borderColor: color, color }}>{name}</span>
              <div
                style={{
                  ...STAT_CAPTION,
                  ...(mutedColor ? { color: mutedColor } : null),
                }}
              >
                TOP INTEREST
              </div>
            </div>
          )
        })}
    </div>
  )

  // Ticket layout — keep the original pill row + inline CTA.
  // Banner layout — the pill+caption columns already sit inside `stats`
  // (so they share the stat strip's row), and only the "See your recap"
  // link remains here as a separate flex child to the right of the strip.
  const interests = topInterests.length > 0 && !isBanner && (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        gap: 8,
      }}
    >
      <div style={{ ...INTERESTS_LABEL, ...(mutedColor ? { color: mutedColor } : null) }}>
        Top Interests
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
        {topInterests.map((name, i) => {
          const color = accents[i % accents.length]
          return (
            <span key={name} style={{ ...PILL, borderColor: color, color }}>
              {name}
            </span>
          )
        })}
        <Link
          to="/membership/recap"
          className={dark ? 'cre-recap-ticket-go cre-recap-ticket-go--dark' : 'cre-recap-ticket-go'}
          style={CTA}
        >
          See your recap
          <ArrowRight size={13} aria-hidden />
        </Link>
      </div>
    </div>
  )

  // Inline CTA on the same row as the header + stat strip; the parent
  // banner uses `column-gap` to separate them.
  const bannerCta = isBanner && (
    <Link
      to="/membership/recap"
      className="cre-link-action"
      style={{ ...BANNER_CTA, flexShrink: 0 }}
    >
      See your recap
      <ArrowRight size={13} aria-hidden />
    </Link>
  )

  return (
    <section
      aria-label="Your year in learning"
      style={{
        ...CARD,
        ...(isBanner ? BANNER_CARD : null),
        ...(dark ? { background: 'var(--color-neutral-800)' } : null),
        ...style,
      }}
    >
      {header}
      {stats}
      {interests}
      {bannerCta}
    </section>
  )
}

function Stat({
  value,
  caption,
  valueColor,
  captionColor,
}: {
  value: number
  caption: string
  valueColor: string
  captionColor?: string
}) {
  return (
    <div style={{ flex: '1 1 auto', textAlign: 'center' }}>
      <div style={{ ...STAT_VALUE, color: valueColor }}>{value}</div>
      <div style={{ ...STAT_CAPTION, ...(captionColor ? { color: captionColor } : null) }}>{caption}</div>
    </div>
  )
}

/* ─── styles (tokens only for fonts + colors) ────────────────────────── */

const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  maxWidth: 300,
  maxHeight: 240.5,
  padding: 16,
  background: 'var(--color-neutral-50)',
  border: '2px dashed var(--color-secondary-300)',
  borderRadius: 'var(--radius-lg)',
}

// Banner overrides: full-width single row, swapped onto the standard card
// chrome (white surface, subtle border, shadow-card) so it reads as a
// regular widget rather than the Passport-ticket treatment. `flex-wrap`
// lets the interests + CTA group drop to a second line when the parent
// column is narrow (e.g. when the banner sits under the Path Tracker).
const BANNER_CARD: CSSProperties = {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  rowGap: 10,
  columnGap: 14,
  maxWidth: '100%',
  maxHeight: 'none',
  padding: '14px 16px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  boxShadow: 'var(--shadow-card)',
}

// Banner stat strip: a single thin solid divider on the left (separating
// the strip from the heading group); right side is open so the KPI columns
// breathe into the remaining banner width. `flex: 1` spreads the columns
// out evenly across the strip.
const BANNER_STAT_STRIP: CSSProperties = {
  padding: '4px 14px',
  gap: 10,
  borderTop: 'none',
  borderBottom: 'none',
  borderLeft: '1px solid var(--color-neutral-200)',
  borderRight: 'none',
  alignSelf: 'stretch',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
}

// Typewriter (Cutive Mono) year label — circle removed, full year shown.
const YEAR: CSSProperties = {
  flexShrink: 0,
  paddingRight: 8,
  fontFamily: 'var(--font-stamp)',
  fontWeight: 700,
  fontSize: 22,
  letterSpacing: '0.02em',
  color: 'var(--color-secondary-700)',
}

const TITLE: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 16,
  lineHeight: 1.15,
  color: 'var(--color-neutral-darkest)',
}

// Uppercase label, mirroring the page's other eyebrows/stat captions
// (font-body, weight 600, text-secondary).
const ARCHETYPE: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  marginTop: 3,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: '0.03em',
  color: 'var(--color-text-secondary)',
}

const STAT_STRIP: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  padding: '12px 0',
  borderTop: '2px dashed var(--color-neutral-200)',
  borderBottom: '2px dashed var(--color-neutral-200)',
}

// Numerals match the adjacent ProgressTrackerCard stat tiles (font-body,
// weight 700, neutral-darkest).
const STAT_VALUE: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 20,
  lineHeight: 1.15,
  color: 'var(--color-neutral-darkest)',
}

const STAT_CAPTION: CSSProperties = {
  marginTop: 4,
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: '0.03em',
  color: 'var(--color-text-tertiary)',
  whiteSpace: 'nowrap',
}

// Matches the CE-HRS stat caption styling.
const INTERESTS_LABEL: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 11,
  letterSpacing: '0.03em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

// Accent tones for stat numerals + interest pills. Light card uses the brand
// 600 shades; the dark variant lightens to 400 for contrast on neutral-800.
const PILL_COLORS = [
  'var(--color-primary-600)',
  'var(--color-secondary-600)',
  'var(--color-tertiary-600)',
]

const PILL_COLORS_DARK = [
  'var(--color-primary-400)',
  'var(--color-secondary-400)',
  'var(--color-tertiary-400)',
]

// Banner-on-navy (rebrand dark theme): the -400 stops still miss AA for the
// blue primary on the deep-navy surface, so the banner uses the lighter -300
// stops (measured ≥ 4.5:1 on navy for all three hues, all brands).
const PILL_COLORS_LIGHTEN = [
  'var(--color-primary-300)',
  'var(--color-secondary-300)',
  'var(--color-tertiary-300)',
]

const PILL: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 10px',
  borderRadius: 'var(--radius-pill)',
  border: '1px solid',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  fontSize: 12,
  lineHeight: '18px',
  whiteSpace: 'nowrap',
}

const CTA: CSSProperties = {
  // Flows inside the pills row; `marginLeft: auto` right-aligns it on the
  // same line as the last interest pill. Color + hover live in the
  // `.cre-recap-ticket-go` CSS rule (an inline color would block the hover
  // override; inline styles outrank a class selector).
  marginLeft: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 13,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}

// Banner-mode CTA — matches the standard CardEyebrow "View All →" link
// (body font, 13/600, action color, no underline) so the recap link reads
// as the same kind of action across the row.
const BANNER_CTA: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  // Contrast-aware CTA link — deep magenta on the light strip, light pink when
  // the strip goes navy in dark mode (flat --color-action failed at 2.88:1).
  color: 'var(--color-accent-link)',
  textDecoration: 'none',
  whiteSpace: 'nowrap',
}
