import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PartnerCodeAskModal } from '@/components/e2e/PartnerCodeAsk'
import { UnsupportedItemDialog } from '@/components/e2e/SignedInCartDialogs'
import { SigningOutDialog } from '@/components/e2e/SigningOutDialog'

/**
 * XCEL'S OWN MODAL on the three V3 modals the XCEL platform shows (2026-11-24,
 * Afsana): measured from the live "Select your state" modal — 560 wide, 5px
 * corners, a ruled header with the title in Avenir Heavy 18, the thin ✕, and
 * XCEL's red buttons with a working hover (a class, not an inline colour).
 */
function frame(dialog: HTMLElement) {
  const header = dialog.querySelector('header')!
  const title = header.querySelector('h2')!
  return { header, title }
}

describe('XCEL modal — the three V3 modals the XCEL platform shows', () => {
  it('Do you have a Partner Code?: ruled header, ✕, YES / NO as XCEL buttons, Contact Us a link', async () => {
    const onAnswer = vi.fn()
    const onClose = vi.fn()
    render(<PartnerCodeAskModal v3 onAnswer={onAnswer} onClose={onClose} />)
    const dialog = screen.getByRole('dialog', { name: 'Do you have a Partner Code?*' })
    expect(dialog.style.width).toBe('560px')
    expect(dialog.style.borderRadius).toBe('5px')
    const { header, title } = frame(dialog)
    expect(header.style.borderBottom).toBe('1px solid var(--color-e2e-card-outline)')
    expect(title.style.fontWeight).toBe('900')
    expect(title.style.fontSize).toBe('18px')
    const yes = within(dialog).getByRole('button', { name: /^yes$/i })
    const no = within(dialog).getByRole('button', { name: /^no$/i })
    for (const b of [yes, no]) {
      expect(b).toHaveClass('cre-xcel-btn')
      /* The hover lives in the class, so no inline colour may override it. */
      expect(b.style.background).toBe('')
      expect(b.style.textTransform).toBe('uppercase')
    }
    expect(within(dialog).getByRole('link', { name: 'Contact Us' })).toHaveAttribute('target', '_blank')
    await userEvent.click(no)
    expect(onAnswer).toHaveBeenCalledWith('no')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('1 item in your cart is not supported: ruled header, ✕, Proceed to checkout centred', async () => {
    const onProceed = vi.fn()
    render(<UnsupportedItemDialog items={['New York Life and Health Flashcards']} onProceed={onProceed} onCancel={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: '1 item in your cart is not supported' })
    expect(frame(dialog).header.style.borderBottom).toBe('1px solid var(--color-e2e-card-outline)')
    expect(within(dialog).getByRole('button', { name: 'Close' })).toBeInTheDocument()
    const proceed = within(dialog).getByRole('button', { name: 'Proceed to checkout' })
    expect(proceed).toHaveClass('cre-xcel-btn')
    expect((proceed.parentElement as HTMLElement).style.textAlign).toBe('center')
    await userEvent.click(proceed)
    expect(onProceed).toHaveBeenCalled()
  })

  it('Signing you out: the title in the ruled header, no ✕, no logo, the spinner still announced', () => {
    render(<SigningOutDialog />)
    const dialog = screen.getByRole('dialog', { name: 'Signing you out' })
    expect(frame(dialog).title).toHaveTextContent('Signing you out')
    expect(within(dialog).queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument()
    expect(within(dialog).getByRole('note')).toHaveTextContent('we need to sign you out')
    expect(within(dialog).getByRole('status')).toHaveTextContent('Signing you out')
  })
})
