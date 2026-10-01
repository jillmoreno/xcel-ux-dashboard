import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompassPlayerBar, type CompassPlayerBarProps } from '@/components/compass/CompassPlayerBar'

/** Config-driven, like the rail — so the tests build their own props. */
function props(overrides: Partial<CompassPlayerBarProps> = {}): CompassPlayerBarProps {
  return {
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

  it('states the section, as given — and no exam date since the 2026-10-01 rearrangement', () => {
    render(<CompassPlayerBar {...props()} />)
    expect(screen.getByText('Life insurance policy types')).toBeTruthy()
    expect(screen.queryByText(/Days Out/)).toBeNull()
  })

  it('leads with the tools, then Close Course, and shows Rubi only while its rail is closed', () => {
    // Close Course and search / Notes / settings swapped sides 2026-10-01.
    const { rerender } = render(<CompassPlayerBar {...props({ rubiOpen: false })} />)
    const buttons = within(screen.getByRole('toolbar')).getAllByRole('button')
    expect(buttons[0]).toHaveAccessibleName('Search this course')
    expect(buttons[buttons.length - 2].textContent).toBe('Close Course')
    expect(buttons[buttons.length - 1]).toHaveAccessibleName('Open Rubi')
    rerender(<CompassPlayerBar {...props({ rubiOpen: true })} />)
    expect(screen.queryByRole('button', { name: 'Open Rubi' })).toBeNull()
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
    fireEvent.click(screen.getByRole('button', { name: 'Open Rubi' }))
    fireEvent.click(screen.getByRole('button', { name: 'Close Course' }))
    expect(onRubi).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Search this course' })).toBeDisabled()
  })

  it('keeps every colour in tokens — no inline hex', () => {
    const { container } = render(<CompassPlayerBar {...props()} />)
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i)
  })
})
