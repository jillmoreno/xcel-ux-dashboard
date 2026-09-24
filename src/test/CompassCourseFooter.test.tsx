import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompassCourseFooter } from '@/components/compass/CompassCourseFooter'

describe('Compass course navigation footer (Figma 31:1221)', () => {
  it('is a named navigation landmark, pinned to the bottom', () => {
    render(<CompassCourseFooter previous={{ label: 'Chapter 1' }} next={{ label: 'Chapter 3' }} />)
    const nav = screen.getByRole('navigation', { name: 'Course navigation' })
    expect(nav.style.position).toBe('sticky')
    expect(nav.style.bottom).toBe('0px')
  })

  it('names both steps — Previous by its lesson, Next in its label', () => {
    render(<CompassCourseFooter previous={{ label: 'Chapter 1' }} next={{ label: 'Chapter 3' }} />)
    expect(screen.getByRole('button', { name: 'Previous: Chapter 1' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next: Chapter 3' })).toBeTruthy()
  })

  it('renders a step with no handler DISABLED — never a button that goes nowhere', () => {
    render(<CompassCourseFooter previous={{ label: 'Chapter 1' }} next={{ label: 'Chapter 3' }} />)
    expect(screen.getByRole('button', { name: 'Previous: Chapter 1' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Next: Chapter 3' })).toBeDisabled()
  })

  it('keeps a disabled Next at full colour — only Previous fades (at source)', async () => {
    const { readFileSync } = await import('node:fs')
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).toMatch(/\.cre-compass-step--next:disabled\s*\{\s*opacity:\s*1;/)
  })

  it('wires the handlers it is given', () => {
    const prev = vi.fn()
    const next = vi.fn()
    render(
      <CompassCourseFooter
        previous={{ label: 'Chapter 1', onSelect: prev }}
        next={{ label: 'Chapter 3', onSelect: next }}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Previous: Chapter 1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next: Chapter 3' }))
    expect(prev).toHaveBeenCalledOnce()
    expect(next).toHaveBeenCalledOnce()
  })

  it('keeps every colour in tokens — no inline hex', () => {
    const { container } = render(<CompassCourseFooter />)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i)
  })
})
