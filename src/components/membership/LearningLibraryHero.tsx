import type { ComponentType, CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Books, HeartPulse, Lightbulb, Podcast, Video } from '@/icons'
import { SearchInput } from '@/components/ui/SearchInput'
import { MembershipBadge } from '@/components/ui/MembershipBadge'
import { tierBadgeIcon } from '@/components/ui/membershipTierBadge'
import { useAccount, supportsMembership, type Brand } from '@/context/AccountContext'

/**
 * Resource Library hero — the navy membership band at the top of the
 * `m-learning-library` section in the Dashboard Rebrand shell. Two variants,
 * both from Figma `4mrp23uaUKbZyq5EFTLIKG`:
 *
 *   - **Member** (node 61:9476) — "INCLUDED WITH YOUR MEMBERSHIP" eyebrow +
 *     Passport Lite pill, "Resource Library" title, three benefit tiles
 *     (Courses & CE · Video Skills · CE Podcasts, diamond markers), and a search
 *     bar wired to the library's `?q=` param (live filtering — `LibraryPanel`
 *     reads the same param, so it drops its own inline search).
 *   - **Non-member** (node 62:10377) — "MEMBERS ONLY · BECOME A MEMBER TODAY"
 *     eyebrow, "Unlock the Full Resource Library" title, three benefit tiles
 *     with icons (Nurse Mike Videos · Career Tips · Clinical Skills), and an
 *     "Unlock with Membership" CTA (→ `onUnlock`) in place of the search.
 *
 * Full-bleed like the gradient section hero (negative margins cancel
 * `SectionShell`'s 24px-top / 40px-side gutter).
 */

type Benefit = {
  title: string
  caption: string
  /** Non-member tiles lead with an icon; member tiles use the diamond marker. */
  Icon?: ComponentType<{ size?: number; style?: CSSProperties }>
}

// Elite copy from the design. The rebrand Resource Library is Elite-only, so
// this stays inline; lift to a `libraryHeroBenefitsFor(brand)` selector if
// another brand ships a member library hero.
const MEMBER_BENEFITS: Benefit[] = [
  { title: 'Courses & CE', caption: 'Specialty courses that count toward license.', Icon: Books },
  { title: 'Video Skills', caption: 'Short, practical how-to videos for the bedside.', Icon: Video },
  { title: 'CE Podcasts', caption: 'Earn credit on the go with audio CE.', Icon: Podcast },
]

/**
 * Per-brand overrides for the member tiles.
 *
 * ⚠ `MEMBER_BENEFITS` above is ELITE copy — "for the bedside", audio CE — and
 * it is hardcoded for every brand, so CRE, McKissock and STC all show nursing
 * language on this hero today. That is PRE-EXISTING and is not fixed here;
 * this map exists because XCEL has no podcast product at all, so one of those
 * three tiles advertises something that does not exist rather than merely
 * reading off-brand. TODO(content): give the other three brands their own set
 * and drop the default.
 */
const MEMBER_BENEFITS_BY_BRAND: Partial<Record<Brand, Benefit[]>> = {
  xcel: [
    { title: 'Review Notes', caption: 'The lesson notes, condensed to what the exam asks.', Icon: Books },
    { title: 'Lecture Videos', caption: 'On-demand instructor lectures, chapter by chapter.', Icon: Video },
    { title: 'Flashcards', caption: 'The full 800+ deck, sorted by topic.', Icon: Books },
  ],
}

// Non-member tiles carry icons matching the design: video / lightbulb /
// heart-pulse (Nurse Mike Videos · Career Tips · Clinical Skills).
const NON_MEMBER_BENEFITS: Benefit[] = [
  { title: 'Nurse Mike Videos', caption: 'Animated Educational & Skill Refresher Videos', Icon: Video },
  { title: 'Career Tips', caption: 'Discover practical advice to advance your career', Icon: Lightbulb },
  { title: 'Clinical Skills', caption: 'Sharpen your skills with our clinical content', Icon: HeartPulse },
]

export function LearningLibraryHero({
  isMember = true,
  onUnlock,
}: {
  isMember?: boolean
  /** Non-member "Unlock with Membership" CTA handler (routes to Explore
   *  Membership in-shell). */
  onUnlock?: () => void
} = {}) {
  const { brand, tierLabel, tierTone } = useAccount()
  // A brand with no membership can't call anything "included with" one — and
  // its learners are never non-members either, so only the first arm applies.
  const hasMembership = supportsMembership(brand)
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const setQuery = (value: string) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value === '') next.delete('q')
        else next.set('q', value)
        return next
      },
      { replace: true },
    )
  }

  const benefits = isMember
    ? (MEMBER_BENEFITS_BY_BRAND[brand] ?? MEMBER_BENEFITS)
    : NON_MEMBER_BENEFITS

  return (
    <header style={bandStyle}>
      {/* Top row: eyebrow/title/description on the left, the search field (or
          the non-member unlock CTA) top-right — matching the title-left /
          search-right layout of the other section heroes. */}
      <div style={topRowStyle}>
        <div style={headStackStyle}>
          <div style={eyebrowRowStyle}>
            <span style={eyebrowStyle}>
              {!hasMembership
                ? 'Free with every XCEL course package'
                : isMember
                  ? 'Included with your membership'
                  : 'Members only · Become a member today'}
            </span>
            {/* `tierLabel` is null for a brand with no membership — skip the
                badge rather than printing the "Member" fallback. */}
            {isMember && tierLabel !== null && (
              <MembershipBadge label={tierLabel} tone={tierTone} icon={tierBadgeIcon(tierTone)} />
            )}
          </div>

          <h1 style={titleStyle}>{isMember ? 'Resource Library' : 'Unlock the Full Resource Library'}</h1>

          <p style={descriptionStyle}>
            {isMember
              ? 'Discover a curated collection of supplementary materials, including articles, webinars, videos, and research papers, designed to enrich and deepen your learning experience.'
              : 'Unlock exclusive videos, webinars, articles, and career resources designed to help you learn, grow, and succeed.'}
          </p>
        </div>

        {/* Member: the section-hero search sits top-right (wired to `?q=`).
            Non-member: the unlock CTA is NOT here — it moves below the benefit
            tiles (see after the benefits row) so it reads as the closing
            action under the "Nurse Mike Videos" card, not a header control. */}
        {isMember && (
          <SearchInput
            label="Search the library"
            placeholder="Search the library"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            tone="on-color"
            style={heroSearchStyle}
          />
        )}
      </div>

      <div style={benefitsRowStyle}>
        {benefits.map((b) => (
          <div key={b.title} style={benefitTileStyle}>
            {b.Icon ? (
              <b.Icon size={20} style={{ color: 'var(--color-text-inverse)', opacity: 0.5 }} />
            ) : (
              <span aria-hidden style={diamondStyle} />
            )}
            <span style={benefitTitleStyle}>{b.title}</span>
            <span style={benefitCaptionStyle}>{b.caption}</span>
          </div>
        ))}
      </div>

      {/* Non-member unlock CTA — moved out of the header row to sit below the
          benefit tiles (the "Nurse Mike Videos" card + siblings). The band's
          `align-items: flex-start` + 16px gap left-align it under the row. */}
      {!isMember && (
        <button type="button" onClick={onUnlock} style={unlockButtonStyle}>
          Unlock with Membership
        </button>
      )}
    </header>
  )
}

/* ─── styles ───────────────────────────────────────────────────────── */

const bandStyle: CSSProperties = {
  // Full-bleed: cancel SectionShell's 24px-top / 40px-side gutter so the band
  // runs flush against the slim header + spans the content column, then add
  // 24px below to separate it from the filter rail + grid.
  margin: '-24px -40px 24px',
  padding: '44px 48px 40px',
  background: 'linear-gradient(118deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 16,
}

// Title-left / search-right header row (matches MembershipSectionHero).
const topRowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 20,
  alignSelf: 'stretch',
}

const headStackStyle: CSSProperties = {
  minWidth: 0,
  flex: '1 1 420px',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

// Same search sizing as the other section heroes: top-right, `0 1 280px`,
// the SearchInput's own 40px light chrome.
const heroSearchStyle: CSSProperties = { flex: '0 1 280px' }

const eyebrowRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  flexWrap: 'wrap',
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '1.1px',
  textTransform: 'uppercase',
  color: 'rgb(255 255 255 / 0.82)',
}

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 40,
  fontWeight: 700,
  lineHeight: 1.06,
  color: 'var(--color-text-inverse)',
}

const descriptionStyle: CSSProperties = {
  margin: 0,
  maxWidth: 795,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: '22px',
  color: 'rgb(255 255 255 / 0.85)',
}

const benefitsRowStyle: CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'stretch',
  alignSelf: 'stretch',
  maxWidth: 1000,
  flexWrap: 'wrap',
}

const benefitTileStyle: CSSProperties = {
  flex: '1 1 0',
  minWidth: 200,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '16px 16px 18px',
  borderRadius: 12,
  background: 'rgb(255 255 255 / 0.06)',
  border: '1px solid rgb(255 255 255 / 0.14)',
}

const diamondStyle: CSSProperties = {
  width: 11,
  height: 11,
  transform: 'rotate(45deg)',
  background: 'var(--color-primary-300)',
  marginBottom: 4,
}

const benefitTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 800,
  lineHeight: 1.25,
  color: 'var(--color-text-inverse)',
}

const benefitCaptionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.45,
  color: 'rgb(255 255 255 / 0.72)',
}

const unlockButtonStyle: CSSProperties = {
  height: 48,
  padding: '0 32px',
  borderRadius: 8,
  border: 'none',
  background: 'var(--color-cta-500)',
  color: 'var(--color-text-inverse)',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
}
