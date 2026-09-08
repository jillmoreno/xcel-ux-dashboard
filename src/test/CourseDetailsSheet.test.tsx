import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, beforeEach } from 'vitest'
import { CourseDetailsPanel } from '@/components/courses/CourseDetailsPanel'
import type { CourseCardData } from '@/components/courses/CourseCard'
import { AccountProvider, defaultMemberTier, type Brand } from '@/context/AccountContext'
import { myCoursesFor } from '@/data/myCoursesFixtures'

/**
 * The post-purchase Course Details sheet. Most of these assertions are about
 * the sheet NOT saying something — no second copy of the name, no rating, no
 * progress on an expired course, no empty danger container — because this sheet
 * replaced a deliberate blank placeholder and every one of those is a thing it
 * could plausibly have grown.
 */

function seed(brand: Brand, membership: 'member' | 'non-member' = 'member') {
  window.localStorage.setItem(
    'cgp.account',
    JSON.stringify({
      brand,
      tier: membership === 'member' ? defaultMemberTier(brand) : 'non-member' }),
  )
}

function course(brand: Brand, id: string): CourseCardData {
  const found = myCoursesFor(brand).find((c) => c.id === id)
  if (!found) throw new Error(`no fixture course ${id} on ${brand}`)
  return found
}

function openSheet(data: CourseCardData, brand: Brand = 'xcel', membership: 'member' | 'non-member' = 'member') {
  seed(brand, membership)
  return render(
    <MemoryRouter>
      <AccountProvider>
        <CourseDetailsPanel open onClose={() => {}} course={data} />
      </AccountProvider>
    </MemoryRouter>,
  )
}

const dialog = () => screen.getByRole('dialog')
const row = (name: RegExp) => within(dialog()).queryByRole('button', { name })

beforeEach(() => {
  window.localStorage.clear()
})

describe('the tabs', () => {
  function openTabs() {
    openSheet(course('xcel', 'mc-xcel-lh-prelicense'))
    fireEvent.click(row(/About the Course/i)!)
  }

  it('puts only the selected tab in the tab order', () => {
    // Roving tabindex — Tab moves PAST the strip to the panel rather than
    // through every tab in it.
    openTabs()
    expect(screen.getByRole('tab', { name: 'Description' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Instructor' })).toHaveAttribute('tabindex', '-1')
  })

  it('moves selection with the arrow keys, and wraps', () => {
    openTabs()
    const list = screen.getByRole('tablist')
    fireEvent.keyDown(list, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Instructor', selected: true })).toBeInTheDocument()
    fireEvent.keyDown(list, { key: 'ArrowLeft' })
    expect(screen.getByRole('tab', { name: 'Description', selected: true })).toBeInTheDocument()
    // Wraps backwards off the first tab to the last.
    fireEvent.keyDown(list, { key: 'ArrowLeft' })
    const tabs = screen.getAllByRole('tab')
    expect(tabs[tabs.length - 1]).toHaveAttribute('aria-selected', 'true')
  })

  it('gives the panel a focus stop, since it holds no focusable content', () => {
    openTabs()
    expect(screen.getByRole('tabpanel')).toHaveAttribute('tabindex', '0')
  })
})

