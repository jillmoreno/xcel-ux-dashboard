import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { InvitedConfirmationPage } from '@/pages/InvitedConfirmationPage'
import { END_TO_END_VERSION } from '@/pages/endToEndDemo'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'

/**
 * THE INVITE & PURCHASE FLOW ENDS AT THE PASSWORD (2026-10-15, Jillienne:
 * "it should END after user puts in a password"). `e2e-ends-at-password` is
 * on in the committed baseline, so Confirm closes the flow on Confirmation &
 * Password with a loading page; off is Eric's hand-off to Home with the
 * Affidavit modal. Both arms are pinned here, and the default is pinned
 * FIRST — a new arm must not become the baseline by landing, only by
 * promotion.
 *
 * ⚠ THE LOADING PAGE IS STILL TERMINAL *ON THIS ROW* (2026-10-16). The
 * End-to-End row walks through it to Atlas Learning; Invite & Purchase does
 * not, and that difference is `?journey=full` on the other row's address, not
 * a flag. The cases below are this row's — no journey param, so the spinner
 * is the end, exactly as `main` shipped on 2026-10-15. The hand-off has its
 * own describe underneath.
 */

const CONFIRMATION = '/end-to-end-demo/confirmation'

function Probe() {
  const { pathname, search } = useLocation()
  return <span data-testid="location">{pathname + search}</span>
}

function renderConfirmation(search = '') {
  window.history.replaceState({}, '', `${CONFIRMATION}${search}`)
  return render(
    <MemoryRouter initialEntries={[`${CONFIRMATION}${search}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Probe />
          <Routes>
            <Route path={CONFIRMATION} element={<InvitedConfirmationPage />} />
            <Route path="/dashboard-rebrand" element={<p>Home</p>} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** Fills the field the way the page offers — a click puts the test password in. */
function fillAndConfirm() {
  fireEvent.click(screen.getByPlaceholderText('Enter password...'))
  const confirm = screen.getByRole('button', { name: 'Confirm' })
  expect(confirm).not.toBeDisabled()
  fireEvent.click(confirm)
}

afterEach(cleanup)

describe('e2e-ends-at-password', () => {
  it('is on in the committed baseline', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'e2e-ends-at-password')
    expect(flag).toBeDefined()
    expect(flag?.defaultEnabled).toBe(true)
    expect(flag?.variants).toBeUndefined()
  })

  it('on: Confirm ends the flow on a loading page — "Taking you to your learning dashboard…" — and nothing navigates', () => {
    renderConfirmation()
    expect(screen.getByRole('heading', { name: 'Create password' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled()

    fillAndConfirm()

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Taking you to your learning dashboard…')
    expect(status.querySelector('.cre-e2e-loading-arc')).not.toBeNull()
    // The topo map behind it: generated contours, drawn in the one token.
    const topo = document.querySelector('.cre-e2e-loading-topo')
    expect(topo).not.toBeNull()
    expect(topo?.querySelectorAll('path').length).toBeGreaterThan(10)
    // The whole page is the loading page: the form and the order panel are gone.
    expect(screen.queryByRole('heading', { name: 'Create password' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Confirm' })).toBeNull()
    expect(screen.queryByText('Thank you for your order!')).toBeNull()
    // …and so is the partner header: the loading page is the map and the spinner alone.
    expect(screen.queryByText('Official Partner of')).toBeNull()
    expect(screen.getByTestId('location').textContent).toMatch(new RegExp(`^${CONFIRMATION}`))
    expect(screen.getByTestId('location').textContent).not.toContain('affidavit')
  })

  it('off: Confirm opens the End-to-End Demo’s Home with the Affidavit modal over it', () => {
    renderConfirmation('?ff=e2e-ends-at-password:off')
    fillAndConfirm()

    const location = screen.getByTestId('location').textContent ?? ''
    expect(location.startsWith('/dashboard-rebrand?')).toBe(true)
    const params = new URLSearchParams(location.slice(location.indexOf('?')))
    expect(params.get('demo')).toBe('1')
    expect(params.get('version')).toBe(END_TO_END_VERSION)
    expect(params.get('affidavit')).toBe('1')
    expect(screen.queryByText('Taking you to your learning dashboard…')).toBeNull()
  })
})

/**
 * THE LOADING PAGE HANDS OFF TO HOME — `e2e-loading-opens-home` (2026-10-16).
 * The seam the released End-to-End row is built on: the row opens at
 * `/end-to-end-demo`, and this is what carries a reviewer the last step into
 * Atlas Learning without a click.
 *
 * FAKE TIMERS, and the clock is advanced INSIDE `act` — the navigate happens
 * in a timeout, so React has to be allowed to flush the state change it
 * causes or the assertion reads the render before it.
 */
describe('e2e-loading-opens-home — the End-to-End row\u2019s hand-off', () => {
  it('is on in the committed baseline', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'e2e-loading-opens-home')
    expect(flag).toBeDefined()
    expect(flag?.defaultEnabled).toBe(true)
    expect(flag?.variants).toBeUndefined()
  })

  /* ── THE CASE THIS WHOLE DESIGN EXISTS FOR ────────────────────────────────
   * The two Prototypes rows open the SAME three pages. If they ever stop
   * disagreeing about where the walk ends, one of the two rows is lying about
   * what it answers — and the failure is silent on the page, because both
   * still look right until you wait three seconds. So it is asserted from the
   * rows themselves rather than from hardcoded strings. */
  it('the two rows that open these pages ask different questions of them', () => {
    const e2e = PROTOTYPE_FEATURES.find((f) => f.id === 'xcel-dashboard')!
    const invite = PROTOTYPE_FEATURES.find((f) => f.id === 'xcel-invite')!
    const q = (to: string) => new URL(to, 'https://x').searchParams
    expect(q(e2e.to!).get('journey'), 'the End-to-End row walks the whole product').toBe('full')
    expect(q(invite.to!).get('journey'), 'Invite & Purchase ends at the password — Afsana and Eric\u2019s surface').toBeNull()
    // Same door, so the difference really is the question and not the build.
    expect(new URL(e2e.to!, 'https://x').pathname).toBe(new URL(invite.to!, 'https://x').pathname)
  })

  it('on the End-to-End row\u2019s walk: three seconds, then the demo\u2019s Home', async () => {
    vi.useFakeTimers()
    try {
      renderConfirmation('?journey=full')
      fillAndConfirm()
      expect(screen.getByRole('status')).toHaveTextContent('Taking you to your learning dashboard…')

      await act(async () => {
        vi.advanceTimersByTime(2900)
      })
      expect(screen.getByTestId('location').textContent, 'not before three seconds').toMatch(
        new RegExp(`^${CONFIRMATION}`),
      )

      await act(async () => {
        vi.advanceTimersByTime(200)
      })
      const location = screen.getByTestId('location').textContent ?? ''
      expect(location.startsWith('/dashboard-rebrand?')).toBe(true)
      const params = new URLSearchParams(location.slice(location.indexOf('?')))
      expect(params.get('demo')).toBe('1')
      expect(params.get('version')).toBe(END_TO_END_VERSION)
      // NOT the affidavit hand-off — that modal belongs to the off arm of
      // `e2e-ends-at-password`, and stacking it over the landing would bury it.
      expect(params.get('affidavit')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('on the Invite row\u2019s walk: no journey param, so the spinner is the end', async () => {
    vi.useFakeTimers()
    try {
      renderConfirmation()
      fillAndConfirm()
      await act(async () => {
        vi.advanceTimersByTime(30_000)
      })
      expect(screen.getByRole('status')).toHaveTextContent('Taking you to your learning dashboard…')
      expect(screen.getByTestId('location').textContent).toMatch(new RegExp(`^${CONFIRMATION}`))
    } finally {
      vi.useRealTimers()
    }
  })

  it('off: not even the End-to-End row hands off', async () => {
    vi.useFakeTimers()
    try {
      renderConfirmation('?journey=full&ff=e2e-loading-opens-home:off')
      fillAndConfirm()
      await act(async () => {
        vi.advanceTimersByTime(30_000)
      })
      expect(screen.getByRole('status')).toHaveTextContent('Taking you to your learning dashboard…')
      expect(screen.getByTestId('location').textContent).toMatch(new RegExp(`^${CONFIRMATION}`))
    } finally {
      vi.useRealTimers()
    }
  })

  it('leaving before the three seconds are up cannot navigate on top of where you went', async () => {
    // The timer is cleared on unmount. Without that, a reviewer who used the
    // Design bar's Page control during the wait would be yanked to Home a
    // moment later, from a page that is no longer mounted.
    vi.useFakeTimers()
    try {
      const { unmount } = renderConfirmation('?journey=full')
      fillAndConfirm()
      unmount()
      await act(async () => {
        vi.advanceTimersByTime(10_000)
      })
      expect(screen.queryByTestId('location')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })
})
