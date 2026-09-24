import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CompassCourseContent } from '@/components/compass/CompassCourseContent'

describe('CompassCourseContent (Figma 49:3338)', () => {
  it('shows the design’s placeholder with no lesson', () => {
    render(<CompassCourseContent />)
    expect(screen.getByRole('region', { name: 'Course content' })).toBeTruthy()
    expect(screen.getByText('Course Content')).toBeTruthy()
  })

  it('renders a lesson in place of the placeholder', () => {
    render(<CompassCourseContent><p>Lesson body</p></CompassCourseContent>)
    expect(screen.getByText('Lesson body')).toBeTruthy()
    expect(screen.queryByText('Course Content')).toBeNull()
  })
})
