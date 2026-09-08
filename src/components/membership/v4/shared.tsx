import type { ComponentType, CSSProperties } from 'react'
import {
  Award,
  BookOpen,
  Briefcase,
  FileText,
  Flag,
  Gem,
  GraduationCap,
  Heart,
  HeartPulse,
  Library,
  Lock,
  Podcast,
  Robot,
  RubiMark,
  RubiWordmark,
  Users,
  Video,
} from '@/icons'
import type {
  MembershipContentType,
  MembershipFirstIconKey,
  MembershipFirstTier,
} from '@/data/membership/membershipFirstFixtures'
import { accentPalette, coverGradient, type AccentTone } from './sharedUtil'

/**
 * Shared *component* building blocks for the Membership v4
 * ("Membership-First — Sections") page: the icon map, NEW / content-type /
 * tier tags, the icon medallion, and the gated "Unlock with Passport"
 * affordance. Non-component helpers (`accentPalette`, `isGated`) + the
 * `MembershipAccess` / `AccentTone` types live in `./sharedUtil`.
 * Everything references Elite CSS variables (they cascade via
 * `<html data-brand="elite">`); no raw hex / px font names.
 */

const ICONS: Record<MembershipFirstIconKey, ComponentType<{ size?: number }>> = {
  video: Video,
  podcast: Podcast,
  award: Award,
  robot: Robot,
  briefcase: Briefcase,
  'book-open': BookOpen,
  books: Library,
  'file-lines': FileText,
  flag: Flag,
  'graduation-cap': GraduationCap,
  heart: Heart,
  'heart-pulse': HeartPulse,
  users: Users,
  gem: Gem,
}

/** Rounded icon medallion. */
export function Medallion({
  iconKey,
  tone = 'teal',
  size = 46,
}: {
  iconKey: MembershipFirstIconKey
  tone?: AccentTone
  size?: number
}) {
  const Icon = ICONS[iconKey]
  const { bg, fg } = accentPalette(tone)
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: 'var(--radius-md)',
        display: 'grid',
        placeItems: 'center',
        background: bg,
        color: fg,
      }}
    >
      <Icon size={Math.round(size * 0.46)} />
    </span>
  )
}

/**
 * Cover-art media area for the "Just launched" cards. Three modes:
 *   - **Rubi-branded** (cover label matches /rubi/i) — a soft cream surface
 *     with the Rubi mark + wordmark centered, and the product name (e.g.
 *     "Coach", "Resume") as a subtitle in the brand red beneath the
 *     wordmark. Skips the gradient + bottom-anchored label so the logo
 *     reads as the primary identity.
 *   - **Real image** (`image` set) — an `<img>` filling the box; on load
 *     error it hides itself, revealing the designed cover beneath.
 *   - **Designed cover** (default) — a diagonal gradient (from the item's
 *     accent tone) with an optional uppercase label, anchored bottom-left.
 * The NEW badge is layered above either mode.
 */
export function LaunchCardMedia({
  tone,
  title,
  image,
  coverLabel,
  showNew = true,
}: {
  tone: AccentTone
  title: string
  image?: string
  coverLabel?: string
  /** Show the corner NEW badge. Defaults true (the "Just launched" spine);
   *  callers reusing the cover for non-new items pass `false`. */
  showNew?: boolean
}) {
  const isRubi = !!coverLabel && /rubi/i.test(coverLabel)
  return (
    <div style={MEDIA}>
      {isRubi ? (
        <RubiCover coverLabel={coverLabel!} />
      ) : (
        <>
          {/* Designed cover — the base layer (also the image's error fallback). */}
          <div style={{ ...COVER, background: coverGradient(tone) }}>
            {coverLabel && <span style={COVER_LABEL}>{coverLabel}</span>}
          </div>

          {/* Real cover image layered on top; hides on error to reveal the cover. */}
          {image && (
            <img
              src={image}
              alt={title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
              style={COVER_IMG}
            />
          )}
        </>
      )}

      {/* NEW badge — above the media. */}
      {showNew && (
        <span style={MEDIA_BADGE}>
          <NewPill />
        </span>
      )}
    </div>
  )
}

/**
 * Rubi-branded launch cover. Drops the gradient cover for a soft cream
 * surface so the multicolor Rubi logo reads cleanly, and renders the
 * sub-product name (e.g. "Rubi™ Coach" → "Coach") as a subtitle below
 * the wordmark in the brand red.
 *
 * The subtle radial fill behind the mark is a brand-red wash (rgba) so the
 * card still feels Rubi without competing with the wordmark.
 */
function RubiCover({ coverLabel }: { coverLabel: string }) {
  // "Rubi™ Coach" → "Coach"; falls back to the raw label if nothing matches.
  const subtitle = coverLabel.replace(/^rubi[™\s]*/i, '').trim() || coverLabel
  return (
    <div style={RUBI_COVER}>
      <div style={RUBI_GLOW} aria-hidden />
      <div style={RUBI_LOGO_GROUP}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RubiMark width={42} aria-hidden />
          <RubiWordmark width={92} aria-hidden />
        </div>
        {subtitle && <span style={RUBI_SUBTITLE}>{subtitle}</span>}
      </div>
    </div>
  )
}

const MEDIA: CSSProperties = {
  position: 'relative',
  height: 150,
  overflow: 'hidden',
  borderBottom: '2px solid var(--color-border-subtle)',
}

const COVER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end',
  padding: '12px 13px',
  color: 'var(--color-text-inverse)',
}

const COVER_LABEL: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 12,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.95)',
}

const COVER_IMG: CSSProperties = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
}

/* Rubi-branded cover — soft cream surface, multicolor brand logo, red
 * subtitle. The brand red is intentionally hardcoded here because it's
 * baked into the Rubi SVGs themselves; we mirror the same red in the
 * subtitle for visual unity. */
const RUBI_BRAND_RED = '#C8203A'

const RUBI_COVER: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background:
    'linear-gradient(135deg, color-mix(in srgb, ' +
    RUBI_BRAND_RED +
    ' 6%, var(--color-neutral-50)) 0%, var(--color-neutral-50) 65%)',
  overflow: 'hidden',
}

const RUBI_GLOW: CSSProperties = {
  position: 'absolute',
  width: 220,
  height: 220,
  borderRadius: '50%',
  background:
    'radial-gradient(circle, color-mix(in srgb, ' +
    RUBI_BRAND_RED +
    ' 18%, transparent) 0%, transparent 70%)',
  top: -60,
  right: -60,
  pointerEvents: 'none',
}

const RUBI_LOGO_GROUP: CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
}

const RUBI_SUBTITLE: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 13,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: RUBI_BRAND_RED,
}

const MEDIA_BADGE: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  zIndex: 2,
}

const TAG_BASE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '0 8px',
  height: 22,
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
  lineHeight: '20px',
  whiteSpace: 'nowrap',
}

/** Bright "NEW" pill — the discoverability marker that anchors the page.
 *  `tone` defaults to the magenta `cta`; `secondary` renders the teal
 *  `secondary-700` (matching the "Member Exclusive" badge) for the AI Career
 *  Tools cards, whose navy band + teal exclusive tag read better with teal. */
export function NewPill({ tone = 'cta' }: { tone?: 'cta' | 'secondary' } = {}) {
  return (
    <span
      style={{
        ...TAG_BASE,
        background: tone === 'secondary' ? 'var(--color-secondary-700)' : 'var(--color-cta-500)',
        color: 'var(--color-text-inverse)',
        letterSpacing: '0.06em',
      }}
    >
      NEW
    </span>
  )
}

const CONTENT_LABELS: Record<MembershipContentType, string> = {
  course: 'Course',
  podcast: 'Podcast',
  tool: 'AI tool',
  bundle: 'Bundle',
  certificate: 'Exam prep',
  video: 'Video',
  partner: 'Partner perk',
}

/** Neutral content-type chip — signals "more than courses". */
export function ContentTypeTag({ type }: { type: MembershipContentType }) {
  return (
    <span
      style={{
        ...TAG_BASE,
        background: 'var(--color-neutral-100)',
        color: 'var(--color-text-secondary)',
        fontWeight: 500,
      }}
    >
      {CONTENT_LABELS[type]}
    </span>
  )
}

/** Tier marker — a Passport gem chip, or a neutral "Lite" chip for the one
 *  product type also included with Passport Lite. */
export function TierTag({ tier }: { tier: MembershipFirstTier }) {
  if (tier === 'lite') {
    return (
      <span
        style={{
          ...TAG_BASE,
          background: 'var(--color-primary-100)',
          color: 'var(--color-primary-700)',
        }}
      >
        Passport Lite
      </span>
    )
  }
  return (
    <span className="cre-tag-pro" style={{ ...TAG_BASE, color: 'var(--color-tertiary-700)' }}>
      <Gem size={12} aria-hidden />
      {tier === 'both' ? 'Passport · Lite' : 'Passport'}
    </span>
  )
}

/** Small "Unlock with Passport" lock chip stamped on gated cards. */
export function UnlockChip() {
  return (
    <span
      style={{
        ...TAG_BASE,
        background: 'var(--color-primary-100)',
        color: 'var(--color-primary-700)',
        fontWeight: 700,
      }}
    >
      <Lock size={12} aria-hidden />
      Unlock with Passport
    </span>
  )
}
