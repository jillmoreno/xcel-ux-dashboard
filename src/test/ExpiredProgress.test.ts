import { describe, expect, it } from 'vitest'
import { courseExpiryState } from '@/data/courseExpiry'
import { certificateStateForCourse } from '@/data/certificateFixtures'
import { myCoursesFor, FIXTURE_TODAY } from '@/data/myCoursesFixtures'
import type { Brand } from '@/context/AccountContext'

/**
 * An expired course keeps the progress it earned (2026-09-08).
 *
 * THE RULE AS STATED: *"if a course is expired, and the user did not complete it
 * and receive a certificate, the progress made before expiration should still
 * show, in dark charcoal."*
 *
 * ⚠ THE TWO QUALIFIERS ARE STRUCTURALLY GUARANTEED, WHICH IS WHY NO CODE CHECKS
 * THEM. `courseExpiryState` returns `'none'` for a completed course BEFORE it
 * looks at `expiresAt`, and `CourseCard` only resolves a certificate marker when
 * the status is `completed`. So an expired course can be neither completed nor
 * certificated, and the rule collapses to "expired ⇒ show the frozen bar".
 *
 * That collapse is load-bearing and invisible. Reorder the completed check below
 * the date check in `courseExpiryState` — which would still look correct, and
 * still pass every other test — and a completed course with a passed expiry date
 * (the NORMAL case, not an edge one) starts rendering a charcoal "expired" bar
 * next to its certificate. These tests exist to catch that.
 */

const BRANDS: Brand[] = ['xcel']

describe('the preconditions the expired-progress rule leans on', () => {
  it('never reports a completed course as expired, whatever its dates say', () => {
    for (const brand of BRANDS) {
      for (const c of myCoursesFor(brand)) {
        if (c.myStatus !== 'completed') continue
        expect(
          courseExpiryState(c, FIXTURE_TODAY),
          `${c.id} is completed and must never read as expired`,
        ).toBe('none')
      }
    }
  })

  it('holds even when a completed course carries a date that has passed', () => {
    // Synthetic, because the fixtures may not happen to contain one today — and
    // "the fixtures don't have that case" is exactly how this regresses.
    const past = { status: 'completed' as const, expiresAt: '2020-01-01' }
    expect(courseExpiryState(past, FIXTURE_TODAY)).toBe('none')
  })

  it('never resolves a certificate for a course that is expired', () => {
    for (const brand of BRANDS) {
      for (const c of myCoursesFor(brand)) {
        if (courseExpiryState(c, FIXTURE_TODAY) !== 'expired') continue
        expect(
          certificateStateForCourse(brand, c.id),
          `${c.id} is expired, so it cannot also hold a certificate`,
        ).toBeNull()
      }
    }
  })
})

describe('the fixtures still demo the state', () => {
  it('has at least one expired course carrying real progress to draw', () => {
    // A bar with nothing in it demos nothing. If this fails, the fixture that
    // made the state visible has drifted rather than the code breaking.
    const withProgress = BRANDS.flatMap((b) =>
      myCoursesFor(b).filter(
        (c) => courseExpiryState(c, FIXTURE_TODAY) === 'expired' && (c.progress ?? 0) > 0,
      ),
    )
    expect(withProgress.length).toBeGreaterThan(0)
  })
})

describe('the charcoal fill is legible on the track it sits in', () => {
  // `--color-progress-fill-expired` → `neutral-800`, which INVERTS with the
  // ramp, so the two themes are different colours and both need measuring.
  // A progress bar is a meaningful non-text indicator: WCAG 1.4.11, 3:1.
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

  it('light — charcoal neutral-800 on the neutral-100 track', () => {
    expect(contrast('#404040', '#ececec')).toBe(8.78)
    expect(contrast('#404040', '#ececec')).toBeGreaterThanOrEqual(NON_TEXT)
  })

  it('dark — the ramp inverts to a light grey, still on its own track', () => {
    expect(contrast('#d6dce6', '#0c2a55')).toBe(10.31)
    expect(contrast('#d6dce6', '#0c2a55')).toBeGreaterThanOrEqual(NON_TEXT)
  })
})
