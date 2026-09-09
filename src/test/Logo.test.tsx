import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Logo } from '@/components/brand/Logo'

/**
 * XCEL's real lockup, wired 2026-09-09. It replaced a text wordmark that had
 * been standing in since the migration, so what is worth pinning is the two
 * things that would put the wordmark back without anyone noticing — and the
 * sizing rule, which is a consequence of the artwork rather than a preference.
 */
describe('the XCEL logo', () => {
  it('renders the real lockup, not the text wordmark', () => {
    // The fallback is a <span role="img">, so a missing/renamed asset entry
    // degrades to something that still passes an "is there a logo" check.
    // Asserting the IMG is what distinguishes the two.
    render(<Logo height={52} />)
    const img = screen.getByRole('img', { name: /XCEL Insurance Training/i })
    expect(img.tagName).toBe('IMG')
    expect(img).toHaveAttribute('src', '/brand/xcel-logo.webp')
  })

  it('sizes by HEIGHT, so the header lockup is 142×52 and not 304×112', () => {
    // `sizeBy` defaults to 'creWidth', which width-matches a reference lockup
    // and would render this one at three-and-a-half times the header's own
    // height. The default being the wrong choice here is exactly why this is
    // asserted rather than left to the eye.
    render(<Logo height={52} />)
    const img = screen.getByRole('img', { name: /XCEL Insurance Training/i })
    expect(img).toHaveAttribute('height', '52')
    expect(img).toHaveAttribute('width', '142')
  })

  it('clears the brand guide’s 95px minimum WIDTH at every height used', () => {
    // 35 is the mobile header (MOBILE_LOGO_HEIGHT), 40 the classic header and
    // ProfessionTile, 52 the platform header. 34 — the mobile height before
    // this lockup landed — gives 93px and is the reason that constant exists.
    for (const height of [35, 40, 52]) {
      const { unmount } = render(<Logo height={height} />)
      const img = screen.getByRole('img', { name: /XCEL Insurance Training/i })
      expect(
        Number(img.getAttribute('width')),
        `${height}px tall renders under the 95px minimum`,
      ).toBeGreaterThanOrEqual(95)
      unmount()
    }
  })

  it('falls back to the wordmark for the square mark, which is not in the repo', () => {
    // The "White Knight" icon is separate artwork. Pointing `mark` at the wide
    // lockup would render a horizontal logo wherever a square one was asked
    // for — the failure this absence prevents. Nothing uses `mark` today; this
    // pins the behaviour for when something does.
    render(<Logo variant="mark" height={40} />)
    const fallback = screen.getByRole('img', { name: 'XCEL' })
    expect(fallback.tagName).toBe('SPAN')
  })
})
