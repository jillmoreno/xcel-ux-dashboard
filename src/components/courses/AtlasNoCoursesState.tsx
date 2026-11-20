import type { CSSProperties } from 'react'
import { BookRegular } from '@/icons'

/**
 * MY COURSES WITH NO COURSES — Atlas (2026-11-19, Eric).
 *
 * The Elite Learning prototype's My Courses empty state (ux-lms-dashboard: a book in a tinted circle, a headline, a line
 * of help and one button) brought over and restyled to Atlas: the page's own card corners and Primary 100 edge, the
 * Atlas serif headline, and Home's Begin Course button (`cre-compass-primary cre-compass-btn-primary`, so it takes the
 * same steel fill and slate hover per brand). Shown when the Demo Controls' Course picker is on **No Courses**.
 *
 * GET STARTED leaves for xcelsolutions.com, in a new tab, at the "Find The Right Insurance License Course For You"
 * section. That heading's section carries no id of its own (the nearest, `#courseForm`, is the form UNDER the heading,
 * so linking to it scrolls the heading out of view) — so the link is a TEXT FRAGMENT, `#:~:text=…`, which Chrome, Edge
 * and Safari scroll to and briefly highlight. Where it lands in the window is the browser's choice, not ours; a browser
 * without text fragments opens the top of the page.
 */
export const XCEL_FIND_A_COURSE_URL =
  'https://www.xcelsolutions.com/#:~:text=Find%20The%20Right%20Insurance%20License%20Course%20For%20You'

export function AtlasNoCoursesState() {
  return (
    <section aria-label="No courses" style={CARD}>
      <span aria-hidden style={BADGE}>
        <BookRegular size={20} aria-hidden />
      </span>
      <h2 className="cre-compass-course-title" style={HEADLINE}>
        {/* One headline, no subtext (2026-11-19, Eric) — "You currently have no courses available." over "To get started on
            your insurance career, find the right licensing options here:" before. */}
        {/* Reworded the same day, with a line break after "yet," and no "Click below:" (Eric). */}
        Looks like you haven’t purchased any courses yet,
        <br />
        get started on your insurance journey today.
      </h2>
      <a
        href={XCEL_FIND_A_COURSE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="cre-compass-primary cre-compass-btn-primary"
        style={BUTTON}
      >
        Get Started
      </a>
    </section>
  )
}

/* The page's card: its corners (`--atlas-card-radius`) on a Secondary 100 fill, no border (2026-11-19, Eric) — white with the
   Quick Links' Primary 100 edge before. */
const CARD: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 12,
  // 104 top and bottom — the 48 plus 56 (2026-11-19, Eric).
  padding: '104px 32px',
  boxSizing: 'border-box',
  // 850 wide (2026-11-19, Eric; 800 first), the text free to use it; narrower only when the page is.
  width: 850,
  maxWidth: '100%',
  borderRadius: 'var(--atlas-card-radius, 20px)',
  background: 'var(--color-secondary-100)',
}
/* The Elite book-in-a-circle, in Atlas's Primary 100 / 500. */
const BADGE: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 48,
  borderRadius: '50%',
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-500)',
  marginBottom: 4,
}
/* The Atlas serif, at the page title's colour, a step under it. */
const HEADLINE: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 400,
  fontSize: 24,
  lineHeight: '30px',
  letterSpacing: '-0.01em',
  color: 'var(--color-compass-page-heading)',
}
/* Home's Begin Course, measured 2026-11-19: Open Sans Bold 13.5/20.25, 5 × 16, 9 corners — the classes carry the colours. */
const BUTTON: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  marginTop: 8,
  padding: '5px 16px',
  border: '1px solid transparent',
  borderRadius: 9,
  fontFamily: 'var(--font-body)',
  fontSize: 13.5,
  lineHeight: '20.25px',
  fontWeight: 700,
  textDecoration: 'none',
}
