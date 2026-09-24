import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { CompassHomeCourseCard } from '@/components/compass/CompassHomeCourseCard'

const base = {
  courseTitle: 'New York Life and Health Pre-Licensing',
  leftToComplete: '27 days',
  completed: 0,
  total: 42,
  unit: 'lessons',
  lessonNumber: 1,
  partNumber: 1,
  partCount: 3,
  lessonTitle: 'Life Insurance Policy Provisions, Options and Riders',
  estimatedMinutes: 18,
}

describe('CompassHomeCourseCard (Figma 108:4579)', () => {
  it('renders the design’s not-started state', () => {
    render(<CompassHomeCourseCard {...base} onBegin={() => {}} />)
    expect(screen.getByRole('heading', { name: base.courseTitle })).toBeTruthy()
    expect(screen.getByText('Needs Scheduled')).toBeTruthy()
    expect(screen.getByText('27 days')).toBeTruthy()
    expect(screen.getByText('0 of 42 lessons')).toBeTruthy()
    expect(screen.getByText(/Lesson 1/)).toBeTruthy()
    expect(screen.getByRole('button', { name: /Begin Course/ })).toBeTruthy()
  })

  it('still says Begin Course once lessons are done — and prints a booked exam date', () => {
    render(<CompassHomeCourseCard {...base} completed={26} lessonNumber={27} examDate="June 30, 2026" onBegin={() => {}} />)
    expect(screen.getByRole('button', { name: /Begin Course/ })).toBeTruthy()
    expect(screen.getByText('June 30, 2026')).toBeTruthy()
    expect(screen.queryByText('Needs Scheduled')).toBeNull()
  })

  it('calls onBegin, and is disabled without one', () => {
    const onBegin = vi.fn()
    const { unmount } = render(<CompassHomeCourseCard {...base} onBegin={onBegin} />)
    fireEvent.click(screen.getByRole('button', { name: /Begin Course/ }))
    expect(onBegin).toHaveBeenCalledOnce()
    unmount()
    render(<CompassHomeCourseCard {...base} />)
    expect((screen.getByRole('button', { name: /Begin Course/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('the Course Overview chip (Figma 108:4620)', () => {
  it('opens the Overview when wired, and is plain text when not', () => {
    const onOverview = vi.fn()
    const { unmount } = render(<CompassHomeCourseCard {...base} onOverview={onOverview} />)
    fireEvent.click(screen.getByRole('button', { name: 'Course Overview' }))
    expect(onOverview).toHaveBeenCalledOnce()
    unmount()
    render(<CompassHomeCourseCard {...base} />)
    expect(screen.queryByRole('button', { name: 'Course Overview' })).toBeNull()
    expect(screen.getByText('Course Overview')).toBeTruthy()
  })
})
