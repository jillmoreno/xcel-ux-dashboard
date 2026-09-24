import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompassRubiRail } from '@/components/compass/CompassRubiRail'

function renderRail(onClose = vi.fn(), open = true) {
  const utils = render(
    <CompassRubiRail
      open={open}
      stickyTop={173}
      greeting="Ask me anything about this chapter."
      suggestions={['Give an example', 'Explain simpler', 'Quiz me']}
      onClose={onClose}
    />,
  )
  return Object.assign(onClose, { utils })
}

describe('Compass Rubi right rail (Figma 49:3053)', () => {
  it('is a named aside in a pinned slot that fills the viewport below its offset', () => {
    renderRail()
    const rail = screen.getByRole('complementary', { name: 'Chat with Rubi' })
    const slot = rail.parentElement!
    expect(slot.style.position).toBe('sticky')
    expect(slot.style.top).toBe('173px')
    expect(slot.style.height).toBe('calc(100vh - 173px)')
  })

  it('slides from the right on an ease-in-out curve', () => {
    renderRail()
    const rail = screen.getByRole('complementary', { name: 'Chat with Rubi' })
    const slot = rail.parentElement!
    // Open: full width, panel home.
    expect(slot.style.width).toBe('380px')
    expect(rail.style.transform).toBe('translateX(0)')
    // Width and slide share ONE ease-in-out cubic curve.
    expect(slot.style.transition).toContain('cubic-bezier(0.65, 0, 0.35, 1)')
    expect(rail.style.transition).toContain('cubic-bezier(0.65, 0, 0.35, 1)')
  })

  it('closed: slid out, zero width, and unreachable — but still mounted', () => {
    const onClose = renderRail(vi.fn(), false)
    expect(screen.queryByRole('complementary', { name: 'Chat with Rubi' })).toBeNull()
    const rail = onClose.utils.container.querySelector<HTMLElement>('.cre-compass-rubi')!
    const slot = rail.parentElement!
    expect(slot.style.width).toBe('0px')
    expect(rail.style.transform).toBe('translateX(100%)')
    expect(slot).toHaveAttribute('aria-hidden', 'true')
    expect(slot.hasAttribute('inert')).toBe(true)
    // Visibility flips only AFTER the slide-out, so it does not blink out.
    expect(slot.style.transition).toMatch(/visibility 0s linear 320ms/)
  })

  it("opens with Rubi's greeting in a live log", () => {
    renderRail()
    const log = screen.getByRole('log', { name: 'Conversation with Rubi' })
    expect(log).toHaveAttribute('aria-live', 'polite')
    expect(within(log).getByText('Ask me anything about this chapter.')).toBeTruthy()
  })

  it('a chip FILLS the input — it does not send on its own', () => {
    renderRail()
    fireEvent.click(screen.getByRole('button', { name: 'Quiz me' }))
    expect(screen.getByRole('textbox', { name: 'Ask Rubi' })).toHaveValue('Quiz me')
    expect(within(screen.getByRole('log')).queryByText('Quiz me')).toBeNull()
  })

  it('sending shows the message and says plainly that Rubi is not connected', () => {
    renderRail()
    const input = screen.getByRole('textbox', { name: 'Ask Rubi' })
    const send = screen.getByRole('button', { name: 'Send' })
    expect(send).toBeDisabled()
    fireEvent.change(input, { target: { value: 'What is a rider?' } })
    fireEvent.click(send)
    const log = screen.getByRole('log')
    expect(within(log).getByText('What is a rider?')).toBeTruthy()
    // No invented answer — an honest note instead.
    expect(within(log).getByText(/isn't connected in this prototype/)).toBeTruthy()
    expect(input).toHaveValue('')
  })

  it('Enter in the input sends too', () => {
    renderRail()
    const input = screen.getByRole('textbox', { name: 'Ask Rubi' })
    fireEvent.change(input, { target: { value: 'Explain simpler' } })
    fireEvent.submit(input.closest('form')!)
    expect(within(screen.getByRole('log')).getByText('Explain simpler')).toBeTruthy()
  })

  it('closes from its own button', () => {
    const onClose = renderRail()
    fireEvent.click(screen.getByRole('button', { name: 'Close Rubi' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('keeps every colour in tokens — no inline hex', () => {
    const { container } = render(
      <CompassRubiRail open stickyTop={0} greeting="Hi" suggestions={['Quiz me']} onClose={() => {}} />,
    )
    expect(container.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b/i)
  })
})
