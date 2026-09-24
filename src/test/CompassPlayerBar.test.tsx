import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompassPlayerBar, type CompassPlayerBarProps } from '@/components/compass/CompassPlayerBar'

/** Config-driven, like the rail — so the tests build their own props. */
function props(overrides: Partial<CompassPlayerBarProps> = {}): CompassPlayerBarProps {
  return {
    examDate: 'December 15, 2026',
    daysOut: '27 Days Out',
    section: { label: 'Life insurance policy types', pct: 14.3 },
    notesCount: 0,
    stickyTop: 112,
    ...overrides,
  }
}

describe('Compass Course Player controls bar (Figma 49:2963)', () => {
  it('is a named toolbar pinned at the offset it is given', () => {
    render(<CompassPlayerBar {...props()} />)
    const bar = screen.getByRole('toolbar', { name: 'Course player controls' })
    expect(bar.style.position).toBe('sticky')
    expect(bar.style.top).toBe('112px')
  })

  it('states the exam date, the days out and the section, as given', () => {
    render(<CompassPlayerBar {...props()} />)
    expect(screen.getByText('December 15, 2026')).toBeTruthy()
    expect(screen.getByText('27 Days Out')).toBeTruthy()
    expect(screen.getByText('Life insurance policy types')).toBeTruthy()
  })

  it('reports section progress as a real progressbar, rounded', () => {
    render(<CompassPlayerBar {...props()} />)
    const bar = screen.getByRole('progressbar', { name: 'Life insurance policy types progress' })
    expect(bar).toHaveAttribute('aria-valuenow', '14')
    expect(screen.getByText('14%')).toBeTruthy()
  })

  it('names Notes with its count, once', () => {
    render(<CompassPlayerBar {...props({ notesCount: 3, onNotes: () => {} })} />)
    expect(screen.getByRole('button', { name: 'Notes (3)' })).toBeTruthy()
  })

  it('renders an action with no handler DISABLED — nothing looks live and does nothing', () => {
    render(<CompassPlayerBar {...props()} />)
    const toolbar = screen.getByRole('toolbar')
    for (const b of within(toolbar).getAllByRole('button')) expect(b).toBeDisabled()
  })

  it('wires the handlers it is given', () => {
    const onRubi = vi.fn()
    const onClose = vi.fn()
    render(<CompassPlayerBar {...props({ onRubi, onClose })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rubi' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close the course player' }))
    expect(onRubi).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Search this course' })).toBeDisabled()
  })

  it('keeps every colour in tokens — no inline hex', () => {
    const { container } = render(<CompassPlayerBar {...props()} />)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i)
  })
})
