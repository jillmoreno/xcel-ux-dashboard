import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { CourseCard, type CourseCardData } from '@/components/courses/CourseCard'
import { AccountProvider, defaultMemberTier } from '@/context/AccountContext'
import { FIXTURE_TODAY, myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * The progress bar's fill is a status language.
 *
 * ⚠ IT DID NOT USED TO BE. Decision 30 said Expiring Soon was the ONLY state
 * allowed to colour this bar, because one-off exceptions dilute a single
 * meaningful colour. That was retired on 2026-09-08: Expired went charcoal,
 * Completed went green, Failed went red. A complete deliberate mapping is a
 * different thing from an exception — but it only stays coherent while EVERY
 * state is in the map, which is what this file pins.
 */

function seed() {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({ brand: 'xcel', tier: defaultMemberTier('xcel') }),
  )
}

/**
 * A base XCEL course, with the state under test applied on top.
 *
 * This used to pick a named fixture row per state — a McKissock course for
 * completed, a CRE one for expiring-soon, and so on. That coupled a test about
 * COLOUR MAPPING to whichever brand happened to author a row in each state, and
 * it broke the moment those brands left. XCEL's seven My Courses rows only
 * cover in-progress / not-started / completed, so three of the five states have
 * no row to point at and would have had to be authored purely to be tested.
 *
 * Building the state explicitly is also just a better test: the mapping is what
 * is being pinned, and now nothing about it depends on fixture churn.
 */
function course(state: Partial<CourseCardData>): CourseCardData {
  const base = myCoursesFor('xcel').find((c) => c.id === 'mc-xcel-lh-prelicense')!
  return { ...base, expiresAt: undefined, ...state }
}

/**
 * An ISO date `days` from FIXTURE_TODAY — not from the real clock.
 *
 * `CourseCard` resolves expiry against the anchored `FIXTURE_TODAY`
 * (2026-05-11) so the demo renders the same states whenever it is opened. A
 * date built from `new Date()` lands on the wrong side of that anchor and the
 * state silently comes back `none`.
 */
function inDays(days: number): string {
  const d = new Date(FIXTURE_TODAY)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The inline `background` on the bar's fill span. jsdom does not resolve
 *  custom properties, which is fine — the token NAME is what we are pinning. */
function fillToken(): string {
  const bar = screen.getByRole('progressbar')
  const span = bar.querySelector('span') as HTMLElement
  return span.style.background
}

function renderCard(data: CourseCardData) {
  seed()
  return render(
    <MemoryRouter>
      <AccountProvider>
        <CourseCard data={data} compact />
      </AccountProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('every state maps to a deliberate fill', () => {
  it('in progress — the brand fill, the bar as a pure quantity', () => {
    renderCard(course({ status: 'in-progress', progress: 50 }))
    expect(fillToken()).toBe('var(--color-progress-fill)')
  })

  it('completed — success green', () => {
    renderCard(course({ status: 'completed', progress: 100 }))
    expect(fillToken()).toBe('var(--color-progress-fill-complete)')
  })

  it('failed — error red', () => {
    renderCard(course({ status: 'failed', progress: 40 }))
    expect(fillToken()).toBe('var(--color-progress-fill-failed)')
  })

  it('expiring soon — warning, the one state where the colour urges something', () => {
    // Inside the warn window, so `courseExpiryState` resolves `expiring-soon`
    // against the clock rather than against a stored flag.
    //
    // Note it is NOT simply "inside DEFAULT_WARN_DAYS (60)": `warnWindowFor`
    // clamps the countdown to HALF the enrolment window, and the base course
    // carries `enrolledAt: 2026-05-04`. Against an expiry 5 days after
    // FIXTURE_TODAY that window is 12 days, so the clamp is 6 — ten days out
    // would resolve `none` and read as the mapping being broken.
    renderCard(course({ status: 'in-progress', progress: 40, expiresAt: inDays(5) }))
    expect(fillToken()).toBe('var(--color-warning-500)')
  })

  it('expired — charcoal, the only fill that is not a colour', () => {
    renderCard(course({ status: 'in-progress', progress: 40, expiresAt: inDays(-1) }))
    expect(fillToken()).toBe('var(--color-progress-fill-expired)')
  })
})

describe('failed outranks the clock', () => {
  it('a failed course reads failed even if its expiry has passed', () => {
    // These genuinely co-occur, and the resolution order mirrors
    // `resolveStatusBadge` so the bar and the cover badge cannot disagree about
    // which state a card is in. Failed wins: the clock stopped mattering the
    // moment you did not pass.
    renderCard(course({ status: 'failed', progress: 40, expiresAt: '2020-01-01' }))
    expect(fillToken()).toBe('var(--color-progress-fill-failed)')
  })
})

describe('the two new fills are legible on the track, in both themes', () => {
  // The track is `neutral-100`, which INVERTS to a deep navy in dark, so a
  // single fixed stop cannot serve both — `error-500` is 5.02:1 light and only
  // 2.39:1 dark. Both tokens therefore alias the theme-aware `status-*-text`
  // pair. A progress bar is a meaningful non-text indicator: WCAG 1.4.11, 3:1.
  const luminance = (hex: string) => {
    const h = hex.replace('#', '')
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
  }
  const contrast = (fg: string, bg: string) => {
    const a = luminance(fg)
    const b = luminance(bg)
    return Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100
  }
  const NON_TEXT = 3
  const TRACK_LIGHT = '#ececec'
  const TRACK_DARK = '#0c2a55'

  it('complete — success-600 light / success-300 dark', () => {
    expect(contrast('#006d2c', TRACK_LIGHT)).toBe(5.51)
    expect(contrast('#66b887', TRACK_DARK)).toBe(5.93)
  })

  it('failed — error-600 light / error-200 dark', () => {
    expect(contrast('#a20000', TRACK_LIGHT)).toBe(7.01)
    expect(contrast('#ea9999', TRACK_DARK)).toBe(6.44)
  })

  it('keeps the raw -500 stops asserted as the wrong answer', () => {
    // Tripwire. `error-500` is the obvious pick and passes in light, which is
    // exactly how it would get through a light-only check.
    expect(contrast('#cb0000', TRACK_LIGHT)).toBeGreaterThanOrEqual(NON_TEXT)
    expect(contrast('#cb0000', TRACK_DARK)).toBeLessThan(NON_TEXT)
  })
})

describe('the resume link', () => {
  const marker = () => screen.queryByRole('link', { name: /Jump Back In/i })

  it('offers Jump Back In on any in-progress course', () => {
    renderCard(course({ status: 'in-progress', progress: 50 }))
    expect(marker()).toHaveAttribute('href', '/courses/mc-xcel-lh-prelicense')
  })

  it('is a router link, not a new tab — resuming stays inside the app', () => {
    // Contrast the certificate marker, which leaves for a document and IS a
    // real `target="_blank"` anchor.
    renderCard(course({ status: 'in-progress', progress: 50 }))
    expect(marker()).not.toHaveAttribute('target')
  })

  it('does not offer it on a not-started course', () => {
    renderCard(course({ status: 'not-started', progress: 0 }))
    expect(marker()).toBeNull()
  })

  it('does NOT offer it on an expired course, which is still in-progress data', () => {
    // ⚠ The one that matters. This is `status: 'in-progress'` with a PASSED
    // expiry, so a naive status check would offer to resume a course whose
    // access has ended — the exact promise the expired treatment refuses to
    // make. The footer renders `Enrol again` INSTEAD of the marker, which is
    // what excludes it.
    const expired = course({ status: 'in-progress', progress: 40, expiresAt: inDays(-1) })
    expect(expired.status).toBe('in-progress')
    renderCard(expired)
    expect(marker()).toBeNull()
    expect(screen.getByText(/Enrol again/i)).toBeInTheDocument()
  })

  it('still shows on the Learning Path selection, including a not-started one', () => {
    // The `jumpBackIn` PROP marks the course the learner left off on, and that
    // is sometimes the next NOT-STARTED course — so the prop cannot simply be
    // replaced by the status check.
    seed()
    render(
      <MemoryRouter>
        <AccountProvider>
          <CourseCard data={course({ status: 'not-started', progress: 0 })} compact jumpBackIn />
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(marker()).toBeInTheDocument()
  })
})
