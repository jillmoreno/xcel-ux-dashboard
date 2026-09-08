import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { CourseCard, type CourseCardData } from '@/components/courses/CourseCard'

const COURSE: CourseCardData = {
  id: 'fl-laws',
  title: 'Florida Laws and Rules for Nurses',
  hours: 2,
  state: 'FL',
  delivery: 'online',
  badge: 'mandatory',
  status: 'in-progress',
  progress: 60,
}

function renderCard(props: Partial<Parameters<typeof CourseCard>[0]> = {}) {
  return render(
    <MemoryRouter>
      <CourseCard data={COURSE} mediaLeft {...props} />
    </MemoryRouter>,
  )
}

describe('CourseCard — Jump Back In kebab + card activation', () => {
  it('renders no kebab and a title link by default (mediaLeft)', () => {
    renderCard()
    expect(screen.queryByRole('button', { name: /more actions for/i })).toBeNull()
    // Title is the standalone-course link when the card isn't a clickable surface.
    const link = screen.getByRole('link', { name: COURSE.title })
    expect(link).toHaveAttribute('href', `/courses/${COURSE.id}`)
  })

  it('renders a kebab that opens the details panel without activating the card', () => {
    const onActivate = vi.fn()
    const onKebab = vi.fn()
    renderCard({ onActivate, onKebab })

    const kebab = screen.getByRole('button', { name: /more actions for florida laws/i })
    fireEvent.click(kebab)
    expect(onKebab).toHaveBeenCalledTimes(1)
    // stopPropagation: the kebab must not also trigger the card-level activation.
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('makes the whole card a clickable surface (title is no longer a link)', () => {
    const onActivate = vi.fn()
    renderCard({ onActivate, onKebab: vi.fn() })

    // The title drops its /courses link — the card owns navigation now.
    expect(screen.queryByRole('link', { name: COURSE.title })).toBeNull()

    const card = document.querySelector('.cre-course-card') as HTMLElement
    expect(card).toHaveAttribute('role', 'button')
    fireEvent.click(card)
    expect(onActivate).toHaveBeenCalledTimes(1)

    // Keyboard: Enter activates.
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onActivate).toHaveBeenCalledTimes(2)
  })
})
