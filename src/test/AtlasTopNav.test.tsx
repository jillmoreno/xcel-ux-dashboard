import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AtlasTopNav } from '@/components/layout/AtlasTopNav'
import { atlasNavFor } from '@/components/layout/atlasNavVersion'

/* The Nav Version control's Top Nav (Figma 160:616, 2026-09-30): Home is
   current on the Home page, Compass Learning on the course's pages. */
function Search() {
  return <span data-testid="search">{useLocation().search}</span>
}
function renderNav(search: string) {
  render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand${search}`]}>
      <AtlasTopNav />
      <Search />
    </MemoryRouter>,
  )
}
const current = () =>
  screen.getAllByRole('button').filter((b) => b.getAttribute('aria-current') === 'page').map((b) => b.textContent)

describe('Atlas Top Nav', () => {
  it('marks Home current on the Home page', () => {
    renderNav('?demo=1&nav=top-nav')
    expect(current()).toEqual(['Home'])
  })

  it('marks Compass Learning current on the Overview and Course pages', () => {
    renderNav('?section=course&coursePage=overview')
    expect(current()).toEqual(['Compass Learning'])
  })

  it('marks neither on another section', () => {
    renderNav('?section=study-plan')
    expect(current()).toEqual([])
  })

  it('navigates by section only, keeping the demo params', () => {
    renderNav('?demo=1&skin=global&nav=top-nav')
    fireEvent.click(screen.getByRole('button', { name: /Compass Learning/ }))
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=course')
    expect(search).toContain('coursePage=overview')
    expect(search).toContain('skin=global')
    expect(search).toContain('nav=top-nav')
    fireEvent.click(screen.getByRole('button', { name: /Home/ }))
    expect(screen.getByTestId('search').textContent).not.toContain('section=')
  })

  it('reads ?nav= validated, defaulting to Left Rail', () => {
    expect(atlasNavFor(null)).toBe('left-rail')
    expect(atlasNavFor('top-nav')).toBe('top-nav')
    expect(atlasNavFor('sideways')).toBe('left-rail')
  })
})
