import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { AtlasTopNav } from '@/components/layout/AtlasTopNav'
import { atlasNavFor } from '@/components/layout/atlasNavVersion'

/* The Nav Version control's Top Nav (Figma 160:616, 2026-09-30): Home is
   current on the Home page, My Learning on the course's pages. */
function Search() {
  return <span data-testid="search">{useLocation().search}</span>
}
function renderNav(search: string, expanding = false) {
  render(
    <MemoryRouter initialEntries={[`/dashboard-rebrand${search}`]}>
      <AtlasTopNav expanding={expanding} />
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

  it('marks My Learning current on the Overview and Course pages', () => {
    renderNav('?section=course&coursePage=overview')
    expect(current()).toEqual(['My Learning'])
  })

  it('marks neither on another section', () => {
    renderNav('?section=support')
    expect(current()).toEqual([])
  })

  it('navigates by section only, keeping the demo params', () => {
    renderNav('?demo=1&skin=global&nav=top-nav')
    fireEvent.click(screen.getByRole('button', { name: /My Learning/ }))
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=course')
    expect(search).toContain('coursePage=overview')
    expect(search).toContain('skin=global')
    expect(search).toContain('nav=top-nav')
    fireEvent.click(screen.getByRole('button', { name: /Home/ }))
    expect(screen.getByTestId('search').textContent).not.toContain('section=')
  })

  it('reads ?nav= validated, defaulting to Top Nav (since 2026-10-01)', () => {
    expect(atlasNavFor(null)).toBe('top-nav')
    expect(atlasNavFor('left-rail')).toBe('left-rail')
    expect(atlasNavFor('top-nav')).toBe('top-nav')
    expect(atlasNavFor('expanding-top-nav')).toBe('expanding-top-nav')
    expect(atlasNavFor('sideways')).toBe('top-nav')
  })
})

/* Expanding Top Nav (Figma 168:916, 2026-10-01): the current button's tray
   holds its links; the other tray is closed and its links unreachable. */
describe('Atlas Expanding Top Nav', () => {
  const linkButtons = () =>
    screen.getAllByRole('button').filter((b) => b.classList.contains('cre-atlas-topnav-link'))

  it('has no links on the plain Top Nav', () => {
    renderNav('')
    expect(linkButtons()).toHaveLength(0)
  })

  it("carries Home's and My Learning's links", () => {
    renderNav('', true)
    expect(linkButtons().map((b) => b.textContent)).toEqual([
      'Course', 'Study Plan', 'Certificates', 'Resources', 'Overview', 'Course', 'Flashcards', 'Exam Simulator',
    ])
  })

  it('a link goes to its page and is marked current; Home stays current on its own links', () => {
    renderNav('?section=course&coursePage=overview', true)
    fireEvent.click(screen.getByRole('button', { name: 'Flashcards' }))
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=course')
    expect(search).toContain('coursePage=flashcards')
    expect(current()).toEqual(['My Learning', 'Flashcards'])
    fireEvent.click(screen.getByRole('button', { name: 'Certificates' }))
    expect(screen.getByTestId('search').textContent).toContain('section=certificates')
    expect(current()).toEqual(['Home', 'Certificates'])
  })

  it("Home's Course link opens the course's Course page, which is My Learning's", () => {
    renderNav('', true)
    fireEvent.click(screen.getAllByRole('button', { name: 'Course' })[0])
    const search = screen.getByTestId('search').textContent ?? ''
    expect(search).toContain('section=course')
    expect(search).toContain('coursePage=course')
    expect(current()).toEqual(['My Learning', 'Course'])
    fireEvent.click(screen.getByRole('button', { name: 'Study Plan' }))
    expect(screen.getByTestId('search').textContent).toContain('section=study-plan')
    expect(current()).toEqual(['Home', 'Study Plan'])
  })
})
