import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { CircleExclamationRegular } from '@/icons'
import { HelpSheet } from '@/components/support/HelpSheet'

/**
 * MY COURSES, COURSE ERROR — Atlas (2026-11-19, Eric). Shown when the Demo Controls' Course picker is on **Course Error**.
 *
 * Began as a copy of `AtlasNoCoursesState` (the same card, badge, serif headline and Begin Course button) and became
 * the courses-failed-to-load case the same day. Three states, in order:
 *
 *   1. ERROR — a circle-exclamation in the badge: "We're sorry, we can't seem to load your courses." ⏎ "Try refreshing the page."
 *      and **Refresh**.
 *   2. WORKING — Refresh pressed: the badge becomes the invite flow's working animation (`XcelLoadingStatus`'s drawing:
 *      the sweeping arc, the counter-turning inner arc, the pulse — its global `cre-e2e-loading-*` classes, which also
 *      stop under reduced motion), in Atlas's Primary instead of the invite flow's brick. For four seconds (`COURSE_ERROR_REFRESH_MS`).
 *   3. TRY AGAIN — after the first and second refresh (later 2026-11-19, Eric: "allow the user to refresh two more
 *      times"): back to the exclamation and Refresh, the headline "Let's try this again." after the first and "One more
 *      try." after the second, before the last try.
 *   4. STILL FAILING — after the THIRD refresh: "Our bad, we still can't seem to load your courses." ⏎
 *      "Please contact customer service." and **Get Help**, which opens the Help sheet the header's Help opens (`HelpSheet`).
 *
 * The demo never loads anything: every refresh is staged and fails, and the third lands on state 4. Re-picking Course
 * Error in the Demo Controls (or reloading) starts again at state 1.
 *
 * The old empty-state subtext ("To get started on your insurance career…") is not here: it was about enrolling, and
 * this page is about courses that exist but did not load.
 */
type Phase = 'error' | 'working' | 'still-failing'

/** Refreshes before Get Help: the first, then "two more times" (2026-11-19, Eric). */
export const COURSE_ERROR_REFRESH_TRIES = 3

/** How long each staged refresh "works" before it gives up — 4 seconds (2026-11-19, Eric; five at first). */
export const COURSE_ERROR_REFRESH_MS = 4000

export function AtlasCourseErrorState() {
  const [phase, setPhase] = useState<Phase>('error')
  // Refreshes that have finished (and failed). 0 → the first headline; 1 → "Let's try this again."; 2 → "One more try."; 3 → Get Help.
  const [failed, setFailed] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const timer = useRef<number | null>(null)
  useEffect(
    () => () => {
      if (timer.current != null) window.clearTimeout(timer.current)
    },
    [],
  )

  const refresh = () => {
    setPhase('working')
    timer.current = window.setTimeout(() => {
      const next = failed + 1
      setFailed(next)
      setPhase(next >= COURSE_ERROR_REFRESH_TRIES ? 'still-failing' : 'error')
    }, COURSE_ERROR_REFRESH_MS)
  }

  const working = phase === 'working'
  return (
    <section aria-label="Course error" style={CARD}>
      {working ? (
        <span role="status" aria-label="Refreshing your courses" style={BADGE_WORKING}>
          <WorkingAnimation />
        </span>
      ) : (
        <span aria-hidden style={BADGE}>
          <CircleExclamationRegular size={20} aria-hidden />
        </span>
      )}
      {/* Two lines tall in EVERY state, a one-line headline centred in them — so the card keeps one depth through the
          error, the retries and Get Help (2026-11-19, Eric). The span holds the text so the flex centring sees one item. */}
      <h2 className="cre-compass-course-title" aria-live="polite" style={HEADLINE}>
        <span>
        {phase === 'still-failing'
          ? (
              <>
                {/* A line break before "Please contact customer service." (2026-11-19, Eric — "Contact customer service here." first). */}
                {/* "Our bad…" (2026-11-19, Eric — "We're sorry, we're still having trouble finding your courses." before). */}
                Our bad, we still can’t seem to load your courses.
                <br />
                Please contact customer service.
              </>
            )
          : failed >= COURSE_ERROR_REFRESH_TRIES - 1
            ? // The last try's message (2026-11-19, Eric — "One more time." first).
              'One more try.'
            : failed > 0
              ? 'Let’s try this again.'
            : (
                <>
                  {/* A line break before "Try refreshing the page." (2026-11-19, Eric). */}
                  {/* "…can't seem to load…" (2026-11-19, Eric — "…can't find…" before). */}
                  We’re sorry, we can’t seem to load your courses.
                  <br />
                  Try refreshing the page.
                </>
              )}
        </span>
      </h2>
      {phase === 'still-failing' ? (
        <button type="button" onClick={() => setHelpOpen(true)} className="cre-compass-primary cre-compass-btn-primary" style={BUTTON}>
          Get Help
        </button>
      ) : (
        <button
          type="button"
          onClick={refresh}
          disabled={working}
          className="cre-compass-primary cre-compass-btn-primary"
          style={{ ...BUTTON, ...(working ? { opacity: 0.6, cursor: 'default' } : null) }}
        >
          Refresh
        </button>
      )}
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </section>
  )
}

/* The invite flow's working animation (`XcelLoadingStatus`), drawn at the badge's 48 and in Atlas's Primary: the Primary
   100 track, the Primary 500 arcs and pulse. Its own copy of the drawing so the invite flow's file is untouched; the
   motion is the shared classes'. */
function WorkingAnimation() {
  return (
    <svg aria-hidden viewBox="0 0 72 72" width={48} height={48} style={{ display: 'block', overflow: 'visible' }}>
      <circle cx={36} cy={36} r={32} fill="none" strokeWidth={3} style={{ stroke: 'var(--color-primary-100)' }} />
      <circle
        className="cre-e2e-loading-arc"
        cx={36}
        cy={36}
        r={32}
        fill="none"
        strokeWidth={3}
        strokeLinecap="round"
        strokeDasharray="56 145"
        style={{ stroke: 'var(--color-primary-500)' }}
      />
      <circle
        className="cre-e2e-loading-arc-inner"
        cx={36}
        cy={36}
        r={21}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeDasharray="30 102"
        strokeOpacity={0.4}
        style={{ stroke: 'var(--color-primary-500)' }}
      />
      <circle className="cre-e2e-loading-pulse" cx={36} cy={36} r={5} style={{ fill: 'var(--color-primary-500)' }} />
    </svg>
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
/* The badge: a 48 circle in Primary 100 with the icon in Primary 500. */
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
/* The working animation takes the badge's place and size, without its fill — the track is the circle now. */
const BADGE_WORKING: CSSProperties = { ...BADGE, background: 'none' }
/* The Atlas serif, at the page title's colour, a step under it. */
const HEADLINE: CSSProperties = {
  margin: 0,
  // Two of its 30px lines, whatever the state says — see the render.
  minHeight: 60,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
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
  cursor: 'pointer',
}
