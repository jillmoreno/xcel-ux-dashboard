import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  /** Optional uppercase tag — "Personalized" / "Fresh in the catalog" /
   *  "Featured" etc. */
  eyebrow?: string
  title: string
  /** Optional one-line context under the title (e.g. "Because you completed…").
   *  Accepts ReactNode so callers can bold a value inline — the A4 shelf
   *  uses `<strong>{weeksLeft}</strong> weeks left in this license cycle.` */
  descriptor?: ReactNode
  /** Right-aligned link target. */
  seeAllHref: string
  /** Optional label for the right-aligned link. Defaults to "See All →";
   *  the Unlock-with-Premium shelf passes "Compare plans →". */
  seeAllLabel?: string
  /** Drop the right-aligned "See All" link entirely — the Recommended for You
   *  page hides it (the horizontal carousel is the way to see everything). */
  hideSeeAll?: boolean
}

/**
 * Heading row for one recommended-for-you shelf. The eyebrow + title + see-all
 * link stack matches the streaming-shelf rhythm documented in
 * `/recommended-for-you-redesign.md` § 5 "Row + card anatomy".
 *
 * Typography references go through `--font-*` / `--color-text-*` tokens; the
 * eyebrow inherits the same 11px uppercase rhythm used by sidebar promo
 * cards. The "See All" link mirrors `LINK_STYLE` in `ContinueLearningTabs.tsx`.
 */
export function ShelfHeader({
  eyebrow,
  title,
  descriptor,
  seeAllHref,
  seeAllLabel = 'See All →',
  hideSeeAll = false,
}: Props) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        {eyebrow && (
          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-secondary)',
            }}
          >
            {eyebrow}
          </span>
        )}
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontWeight: 500,
            fontSize: 20,
            lineHeight: '28px',
            color: 'var(--color-text-primary)',
          }}
        >
          {title}
        </h3>
        {descriptor && (
          <p
            style={{
              margin: 0,
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              lineHeight: '20px',
              color: 'var(--color-text-secondary)',
            }}
          >
            {descriptor}
          </p>
        )}
      </div>
      {!hideSeeAll && (
        <Link
          to={seeAllHref}
          className="cre-link-action"
          style={{
            // Matches LINK_STYLE in ContinueLearningTabs.tsx so the "See All"
            // link reads identically on every recommended shelf.
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 600,
            // Contrast-aware CTA link: deep magenta on light, light pink on the
            // rebrand's navy dark surface (flat cta-500 was 3.5:1 there). #1
            color: 'var(--color-accent-link)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
          }}
        >
          {seeAllLabel}
        </Link>
      )}
    </header>
  )
}
