import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ComponentReviewPage } from '@/pages/ComponentReviewPage'

/**
 * `/review` — one component, every variant, stacked. The page a Refinement row
 * points at when a designer shares ONE widget instead of their whole branch.
 *
 * It is defined entirely by its URL, so the URL grammar IS the contract — and
 * the way it fails in the wild is a malformed link built by `promote-component`,
 * which nobody notices until a reviewer opens a blank page.
 */

function at(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/review" element={<ComponentReviewPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const frames = () => screen.getAllByTitle(/—/) as HTMLIFrameElement[]

describe('the component review page', () => {
  it('renders one frame per variant, in the order given', () => {
    at('/review?title=Study+Pace&v=Not+started::f:a&v=On+track::f:b&v=Done::f:c')
    const srcs = frames().map((f) => f.getAttribute('src') ?? '')
    expect(srcs).toHaveLength(3)
    expect(srcs[0]).toContain('f%3Aa')
    expect(srcs[1]).toContain('f%3Ab')
    expect(srcs[2]).toContain('f%3Ac')
  })

  it('pins each frame with its own ?ff= and strips the prototype chrome', () => {
    at('/review&v=x::k:v'.replace('&', '?'))
    const src = frames()[0].getAttribute('src') ?? ''
    expect(src).toContain('ff=')
    /* `chrome=off` on every frame: the dark prototype bar and the demo controls
       inside a 620px frame leave almost nothing for the component. */
    expect(src).toContain('chrome=off')
  })

  it('keeps a label containing the separator intact', () => {
    /* ⚠ LABELS ARE WRITTEN BY A DESIGNER, not escaped by one. Splitting on the
       LAST `::` — or on a single `:` — would mangle "Ends 5:30" or a label with
       a URL in it. The split is on the FIRST `::` only. */
    at('/review?v=Complete::+100%25+at+5:30::dashboard-progress-state:complete-100')
    expect(screen.getByText('Complete')).toBeTruthy()
    expect(frames()[0].getAttribute('src')).toContain('5%3A30')
  })

  it('carries the base route, including its own query', () => {
    at('/review?at=%2Fdashboard-rebrand%3Fversion%3Dtesting&v=a::k:v')
    const src = frames()[0].getAttribute('src') ?? ''
    expect(src).toContain('/dashboard-rebrand?version=testing')
    // …and joins with `&`, not a second `?`.
    expect(src.split('?').length - 1, `two question marks in ${src}`).toBe(1)
  })

  it('shows the pinned state on the page, not just in the src', () => {
    /* A reviewer reporting "the nav looks wrong" about an arm deliberately held
       at a value has spent their attention on nothing. */
    at('/review?v=On+track::dashboard-progress-state:progress-on-track')
    expect(screen.getByText('dashboard-progress-state:progress-on-track')).toBeTruthy()
  })

  it('says what is wrong when the link carries no variants', () => {
    /* This page is machine-built; a malformed link is the realistic failure, and
       the empty state is addressed to whoever can fix it. */
    at('/review?title=Nothing')
    expect(screen.queryAllByTitle(/—/)).toHaveLength(0)
    expect(screen.getByText(/&v=Label::flag-key:variant/)).toBeTruthy()
  })

  it('starts every frame inert so the page can be scrolled', () => {
    /* ⚠ THE BUG THAT MADE THE PAGE UNUSABLE ON ITS FIRST RENDER. Stacked
       iframes swallow the mouse wheel: scrolling over state 1 scrolls INSIDE
       it, so a reviewer never reaches state 2 and concludes the link is broken.
       Frames are `pointer-events: none` until clicked. */
    at('/review?v=a::k:1&v=b::k:2')
    for (const f of frames()) expect(f.style.pointerEvents).toBe('none')
  })
})
