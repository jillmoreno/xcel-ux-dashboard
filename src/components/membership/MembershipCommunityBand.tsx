import type { CSSProperties } from 'react'
import { ArrowUpRightFromSquare, CircleCheck, Facebook } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { communityFor, type CommunityIcon } from '@/data/membership/communityFixtures'

/**
 * Membership community band — the member-only community group, advertised on
 * the member Membership page.
 *
 * This exists because the community is the one thing in the old External
 * Resources set that ISN'T free: it is a membership benefit, so it belongs
 * beside the other benefits rather than beside the blog and the podcast.
 *
 * It carries NO "Membership Exclusive" badge. Placement already says it — the
 * band sits under "Included with Your Membership" on the Membership page, where
 * everything is a member benefit, so the badge restated the section it lived in.
 * (The badge earned its keep on the old mixed page, where open links and this
 * one gated card shared a grid and nothing else distinguished them.)
 *
 * Member-only by placement, not by prop: it renders inside `MemberBody*`, which
 * a non-member never reaches. It does NOT double as a non-member upsell — a non-member on
 * the Membership page is already being sold the plan by the comparison table
 * above, and a second "join to get this" pitch competes with it.
 *
 * Self-hides for any brand with no community (`communityFor` → null), so this is
 * McKissock-only today and costs every other brand nothing.
 */

const ICONS: Record<CommunityIcon, typeof Facebook> = {
  facebook: Facebook,
}

export function MembershipCommunityBand() {
  const { brand } = useAccount()
  const community = communityFor(brand)
  if (!community) return null
  const Icon = ICONS[community.icon]

  return (
    <section aria-labelledby="membership-community-heading" style={sectionStyle}>
      {/* No centred "Your Membership Community" title above the band any more.
          The eyebrow below says the same thing, and stacking the two put three
          near-identical headings on one band. The benefit rows beside this one
          work the same way: one shared section title for the group, then an
          eyebrow + name per row. */}
      <div style={community.image ? bandStyle : bandStyleNoImage}>
        {community.image && (
          // `lm-photowrap` + `lm-photo` are the SAME classes the marketing
          // benefit spots below use, so this photo is sized by exactly the rule
          // that sizes theirs and cannot drift from them. `position: relative`
          // is the only addition — it anchors the corner badge.
          <div className="lm-photowrap" style={{ position: 'relative' }}>
            <div
              className="lm-photo"
              style={{
                backgroundImage: `url(${community.image})`,
                // `.lm-photo`'s own floor is 220px; the marketing spots below
                // land at 300 only because their copy column (bigger title,
                // wider-spaced bullets, a Learn More button) pushes the row
                // that tall. This band's copy is shorter, so matching their
                // photo means stating the height rather than inheriting it.
                minHeight: 300,
              }}
              aria-hidden
            />
            {/* The platform glyph as a badge breaking the photo's top-left
                corner — it says WHERE the group lives, which the title alone
                doesn't, and the overlap ties the mark to the image instead of
                leaving it floating in the copy. Decorative only: the heading
                text carries the meaning for assistive tech. */}
            <span aria-hidden style={glyphBadgeStyle}>
              <Icon size={130} />
            </span>
          </div>
        )}

        <div style={copyStyle}>
          {/* Eyebrow → title → blurb, matching the benefit-row headers beside
              this band property for property (see the style consts below), so
              the community reads as one more section rather than a one-off. */}
          <div style={headerStyle}>
            <span style={eyebrowStyle}>Exclusive Membership Community</span>
            <h2 id="membership-community-heading" style={nameStyle}>
              {/* No image ⇒ no corner to badge, so the glyph falls back inline
                  before the title rather than dropping the platform cue. */}
              {!community.image && <Icon size={20} aria-hidden style={glyphInlineStyle} />}
              {community.name}
            </h2>
            <p style={descriptionStyle}>{community.description}</p>
          </div>

          <ul style={highlightListStyle}>
            {community.highlights.map((highlight) => (
              <li key={highlight} style={highlightStyle}>
                <CircleCheck size={15} aria-hidden style={{ flex: 'none', marginTop: 2 }} />
                {highlight}
              </li>
            ))}
          </ul>

          {/* The CTA lives INSIDE the copy column, which is where the marketing
              spots below put their "Learn More" — with the photo now taking a
              full half of the row, a third column would squeeze the copy. */}
          <a
            href={community.href}
            target="_blank"
            rel="noopener noreferrer"
            className="cre-community-cta"
            style={ctaStyle}
            aria-label={`${community.cta}: ${community.name} (opens in a new tab)`}
          >
            {community.cta}
            <ArrowUpRightFromSquare size={14} aria-hidden />
          </a>
        </div>
      </div>
    </section>
  )
}

/* ─── styles ──────────────────────────────────────────────────────── */

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
}

// The marketing benefit spots' `1fr 1fr` grid and 32px gap, but WITHOUT their
// card chrome: no fill, no stroke, no padding. A tinted panel here outranked the
// benefits it follows, and the stroke boxed in a band that reads better open.
// The photo carries the visual weight instead.
const bandStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 32,
  alignItems: 'center',
}

// With no photo there is no second column to fill, so the copy runs as one
// block rather than leaving half the row empty.
const bandStyleNoImage: CSSProperties = {
  display: 'block',
}

// The bare 130px glyph tucked into the photo's top-left corner — no plate behind
// it. The 7px inset keeps it hugging the corner at any glyph size.
//
// White, NOT the primary-700 it used back when it sat on a white plate: that
// corner of the photo is dark, and the olive measured 1.25:1 there — it simply
// disappeared. It is a literal rather than `--color-text-inverse` per the
// on-image convention: the photo is dark in either theme, so a token that flips
// with the theme would break it in one of them.
//
// The drop shadow is doing real work, not decoration. The corner is not uniform
// — it runs from near-black to fairly light — and against the lighter patches
// white alone drops to about 2:1. The shadow is what holds the glyph's edge
// there. Re-check both if the photo or the glyph size changes again.
const glyphBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: 7,
  left: 7,
  display: 'block',
  color: '#fff',
  filter: 'drop-shadow(0 1px 4px rgb(0 0 0 / 0.55))',
}

const copyStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  // Lets the band wrap the CTA onto its own line on a narrow column instead of
  // squeezing the copy to a few words per line.
  flex: '1 1 320px',
  minWidth: 0,
}

/* The three consts below mirror the benefit-row header (`BenefitRowBand`'s
   eyebrow / h2 / blurb) exactly — same family, size, weight, tracking, colour
   tokens and 8px rhythm — so this band's header and theirs are the same object.
   Change one and change the other. */

const headerStyle: CSSProperties = {
  // The benefit headers cap their measure at 52ch; without it the blurb would
  // run the full 525px column and set a different line length to theirs.
  maxWidth: '52ch',
}

const eyebrowStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-eyebrow-text)',
}

const nameStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  margin: '8px 0 0',
  fontFamily: 'var(--font-heading)',
  fontSize: 26,
  fontWeight: 800,
  lineHeight: 1.12,
  letterSpacing: '-0.01em',
  color: 'var(--color-text-primary)',
}

const glyphInlineStyle: CSSProperties = {
  flex: 'none',
  color: 'var(--color-primary-700)',
}

const descriptionStyle: CSSProperties = {
  margin: '8px 0 0',
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}

const highlightListStyle: CSSProperties = {
  margin: '4px 0 0',
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const highlightStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}

/** The shared `Button` primitive's `secondary` variant (`VARIANTS.secondary` +
 *  `SIZES.md` in ui/Button.tsx) property for property — the outline treatment
 *  the "Learn More" buttons in the marketing benefit spots beside this band use,
 *  so the two read as the same control.
 *
 *  It stays an `<a>` rather than becoming a `<Button>` because the destination
 *  is an external URL: an anchor keeps the href, the middle-click / open-in-new-
 *  tab affordances, and the "opens in a new tab" announcement. A button with an
 *  onClick handler would look identical and lose all of that. The trade is that
 *  hover/focus can't be expressed inline — `.cre-community-cta` in tokens.css
 *  carries those, mirroring Button.secondary's inset-shadow hover.
 *
 *  `--color-action` is the token, not the raw cta-500: on McKissock cta-500 is a
 *  light orange at 2.32:1, the same trap the catalog's Add To Cart buttons fell
 *  into. `--color-action` resolves to each brand's AA-safe action stop
 *  (cta-700 / #93571e here → 5.80:1 on the page). */
const ctaStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  flex: 'none',
  // The copy column is a flex column, so without this the anchor stretches to
  // the full column width instead of hugging its label.
  alignSelf: 'flex-start',
  marginTop: 4,
  height: 40,
  padding: '0 16px',
  borderRadius: 'var(--radius-md)',
  background: 'transparent',
  color: 'var(--color-action)',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1,
  textDecoration: 'none',
  whiteSpace: 'nowrap',
  // The border is inside the 40px height, matching Button (which is
  // `box-sizing: border-box` via the global reset).
  boxSizing: 'border-box',
}
