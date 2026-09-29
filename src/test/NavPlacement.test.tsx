import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, useSearchParams } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccountProvider, useAccount, type Brand } from '@/context/AccountContext'
import { FeatureFlagProvider, FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { PlatformTopNav } from '@/components/layout/PlatformTopNav'
import { useNavPlacement } from '@/components/layout/navPlacement'

/**
 * THE TWO NAVIGATIONS — `nav-placement`, the exploration on
 * `jill/navigation-exploration`.
 *
 * What is worth pinning here is not that a nav renders. It is the three things
 * that make the two options COMPARABLE, each of which fails silently:
 *
 *   1. The committed default. A branch's default is a decision; a new arm must
 *      become the baseline by being promoted, not by landing.
 *   2. That the flag OFF resolves to the shipped rail rather than to nothing.
 *      A shell with no navigation at all is the failure mode of a placement
 *      flag, and it looks like a styling bug rather than a missing branch.
 *   3. That the top nav writes the SAME `?section=` state the rail writes —
 *      which is the whole reason the two can be swapped without lifting state,
 *      and the one thing a fork of a nav is likely to get subtly wrong.
 */

function Seed({ brand }: { brand: Brand }) {
  const { brand: current, setAccount } = useAccount()
  useEffect(() => {
    if (current !== brand) setAccount(brand, 'member')
  }, [brand, current, setAccount])
  return null
}

/** Prints the resolved placement + the live `?section=`, so a test can read
 *  both without reaching into the shell. */
function Probe() {
  const placement = useNavPlacement()
  const [params] = useSearchParams()
  return (
    <>
      <span data-testid="placement">{placement}</span>
      <span data-testid="section">{params.get('section') ?? '(none)'}</span>
    </>
  )
}

function renderTopNav(search = '') {
  window.history.replaceState({}, '', `/dashboard-rebrand${search}`)
  return render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand${search}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Seed brand="xcel" />
          <Probe />
          <PlatformTopNav />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('nav-placement', () => {
  it('is in the catalog as a two-arm flag, defaulting to the top nav on this branch', () => {
    /* ⚠ THIS ASSERTS THE BRANCH DEFAULT, NOT A SHIPPED ONE. `top` is the
       default here so the branch build opens on the work under discussion —
       CLAUDE.md's rule for a design branch. If `promote-to-prototype` ever
       makes `left` the baseline again, this line is the one that says so out
       loud rather than letting the change pass unremarked. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'nav-placement')
    expect(flag).toBeTruthy()
    expect(flag?.defaultVariant).toBe('top')
    expect(flag?.variants?.map((v) => v.value)).toEqual([
      'left',
      'top',
      'hybrid',
      'hybrid-tabs',
    ])
    expect(flag?.page).toBe('dashboard-rebrand')
  })

  it('resolves to the shipped rail when the flag is switched OFF', () => {
    /* Not to "no navigation". Off means the product as it ships. */
    renderTopNav('?ff=nav-placement:off')
    expect(screen.getByTestId('placement').textContent).toBe('left')
  })

  it('resolves to the rail on the `left` arm', () => {
    renderTopNav('?ff=nav-placement:left')
    expect(screen.getByTestId('placement').textContent).toBe('left')
  })

  it('keeps the two hybrids apart: Option 3 has the rail, Option 4 the tabs', async () => {
    /* ⚠ THE ARMS THE PREDICATES EXIST FOR. Header, rail and tab strip are three
       questions asked of one value, and the two hybrids are where the answers
       diverge — a `=== 'top'` left in any of the three call sites collapses one
       option into another.

       ⚠ THE TWO HYBRIDS DIFFER BY EXACTLY ONE THING. Both draw the header;
       Option 3 fills the rest with the RAIL and Option 4 with the TAB STRIP.
       Option 4 was built as a replacement for Option 3 for one build — these
       four lines are what keep them as four options rather than three. */
    const { showsRail, showsSectionTabs, showsTopNav } = await import(
      '@/components/layout/navPlacement'
    )
    renderTopNav('?ff=nav-placement:hybrid')
    expect(screen.getByTestId('placement').textContent).toBe('hybrid')
    expect(showsTopNav('hybrid')).toBe(true)
    expect(showsRail('hybrid')).toBe(true)
    expect(showsSectionTabs('hybrid')).toBe(false)

    expect(showsTopNav('hybrid-tabs')).toBe(true)
    expect(showsRail('hybrid-tabs')).toBe(false)
    expect(showsSectionTabs('hybrid-tabs')).toBe(true)

    /* The first two stay single: one navigation each, no tabs. */
    expect(showsRail('top')).toBe(false)
    expect(showsTopNav('left')).toBe(false)
    expect(showsSectionTabs('top')).toBe(false)
    expect(showsSectionTabs('left')).toBe(false)
  })

  it('resolves the fourth arm', () => {
    renderTopNav('?ff=nav-placement:hybrid-tabs')
    expect(screen.getByTestId('placement').textContent).toBe('hybrid-tabs')
  })

  it('draws a short nav, and Help only where nothing else carries it', () => {
    /* ⚠ THE COUNT IS THE ASSERTION. The rail has seven rows and this has two:
       the shorter primary nav IS the concept under test, so a later
       well-meaning "port the missing rows over" should have to argue with a
       failing test first.

       ⚠ HELP IS OPTION 4'S ALONE (2026-09-29). Option 3's rail carries Get
       Help, so a header copy is a duplicate; Option 4 has no rail and its tabs
       are the learning sections, so the header is the only place left. Option 1
       drops it too, which follows the ask and leaves that arm with no Help on
       screen — deliberate, and recorded at `HELP_ITEM`. */
    renderTopNav('?ff=nav-placement:top')
    const items = () =>
      [...screen.getByRole('navigation', { name: 'Primary' }).querySelectorAll('button')].map(
        (b) => b.textContent,
      )
    expect(items()).toEqual(['Home', 'Compass Learning'])
  })

  it('adds Help on Option 4, where no rail and no tab carries it', () => {
    renderTopNav('?ff=nav-placement:hybrid-tabs')
    const items = [
      ...screen.getByRole('navigation', { name: 'Primary' }).querySelectorAll('button'),
    ].map((b) => b.textContent)
    expect(items).toEqual(['Home', 'Compass Learning', 'Help'])
  })

  it('marks Home current when there is no `?section=` at all', () => {
    /* The shell deletes the param for Home rather than writing `dashboard`
       into it, so "no param" is Home. A nav that only understood an explicit
       value would light nothing on the landing screen. */
    renderTopNav('?ff=nav-placement:top')
    expect(screen.getByRole('button', { name: /Home/ }).getAttribute('aria-current')).toBe('page')
  })

  it('leaves every item unmarked on a section it does not carry', () => {
    /* Certificates is reachable by deep link and is deliberately not a top-nav
       item. Falling back to Home would light the wrong item — worse than
       lighting none. */
    renderTopNav('?ff=nav-placement:top&section=certificates')
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(0)
  })

  it('writes the same `?section=` the rail writes', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    renderTopNav('?ff=nav-placement:top')
    await userEvent.click(screen.getByRole('button', { name: 'Compass Learning' }))
    expect(screen.getByTestId('section').textContent).toBe('compass')
  })

  it('sends Compass Learning to its own page, not to My Courses', async () => {
    /* ⚠ THE ONE THAT WAS WRONG FIRST. Compass Learning pointed at `courses`
       for a commit, on the guess that it was another name for My Courses. It
       is its own destination (Figma 765:3471) — the Compass chrome on
       Overview — and `?section=compass` is what opens it. */
    const { default: userEvent } = await import('@testing-library/user-event')
    renderTopNav('?ff=nav-placement:top')
    await userEvent.click(screen.getByRole('button', { name: 'Compass Learning' }))
    expect(screen.getByTestId('section').textContent).toBe('compass')
  })

  it('tags Compass Learning with a registered CTA id', async () => {
    /* A control a moderated run can break. It is top-nav only, so `nav.compass`
       has no rail equivalent — which is exactly why it needs its own row. */
    const { TESTABLE_CTAS } = await import('@/data/testableCtas')
    renderTopNav('?ff=nav-placement:top')
    const btn = screen.getByRole('button', { name: 'Compass Learning' })
    expect(btn.getAttribute('data-cta-id')).toBe('nav.compass')
    expect(TESTABLE_CTAS.some((c) => c.id === 'nav.compass')).toBe(true)
  })

  it('drops the param again on Home, rather than writing `dashboard`', async () => {
    /* `?section=dashboard` would be a URL the shell never produces and the
       logo's `/dashboard-rebrand` would stop reading as Home. */
    const { default: userEvent } = await import('@testing-library/user-event')
    renderTopNav('?ff=nav-placement:top&section=courses')
    await userEvent.click(screen.getByRole('button', { name: /Home/ }))
    expect(screen.getByTestId('section').textContent).toBe('(none)')
  })
})
