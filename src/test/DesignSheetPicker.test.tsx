import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { FEATURE_FLAGS, type FeatureFlagDefinition } from '@/context/FeatureFlagContext'
import { SheetPicker } from '@/components/prototype/DesignControlsBar'
import { INVITE_FLOW_FLAG } from '@/data/inviteFlows'

/**
 * THE SHEET PICKER — 2026-10-27, Jillienne on the Invite flow menu: "trigger
 * this as sheet view where we can see all the options better, there will
 * likely be more added."
 *
 * Rendered on its own rather than through the whole design bar: the bar only
 * draws the Invite flow control on the invite surface, which takes the page
 * sync to declare, and none of that is what this pins. What it pins is the
 * shape — a trigger on the bar, a dialog at the side, every option in it with
 * its description, the default marked, and a pick that lands and closes.
 */

const definition = FEATURE_FLAGS.find((f) => f.key === INVITE_FLOW_FLAG) as FeatureFlagDefinition

function renderPicker(current = 'b2c-guest') {
  const onPick = vi.fn()
  const label = definition.variants!.find((v) => v.value === current)!.label
  render(<SheetPicker def={definition} current={current} label={label} onPick={onPick} />)
  return onPick
}

describe('the Invite flow control as a sheet', () => {
  it('is a trigger on the bar that opens a dialog, not a popover', () => {
    renderPicker()
    const trigger = screen.getByRole('button', { name: /^Invite flow: / })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(trigger)
    expect(screen.getByRole('dialog', { name: 'Invite flow' })).toBeInTheDocument()
  })

  it('lists every arm with its description, and marks the default', () => {
    renderPicker()
    fireEvent.click(screen.getByRole('button', { name: /^Invite flow: / }))
    const group = screen.getByRole('radiogroup', { name: 'Invite flow' })
    const radios = within(group).getAllByRole('radio')
    expect(radios).toHaveLength(definition.variants!.length)
    /* The whole sentence is the name — a screen reader hears the label and
       what it means, not two fragments. */
    for (const v of definition.variants!) {
      expect(within(group).getByRole('radio', { name: `${v.label} — ${v.description}` })).toBeInTheDocument()
    }
    expect(within(group).getByText('Default').closest('[role=radio]')).toHaveAttribute(
      'aria-label',
      expect.stringContaining(definition.variants!.find((v) => v.value === definition.defaultVariant)!.label),
    )
    expect(within(group).getByRole('radio', { checked: true })).toHaveAttribute(
      'aria-label',
      expect.stringContaining('B2C Guest Checkout'),
    )
  })

  it('a pick lands on the flag and closes the sheet', () => {
    const onPick = renderPicker()
    fireEvent.click(screen.getByRole('button', { name: /^Invite flow: / }))
    fireEvent.click(screen.getByRole('radio', { name: /^Signed-in XCEL account/ }))
    expect(onPick).toHaveBeenCalledWith('xcel-signed-in')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('Close and Escape both leave the flag alone', () => {
    const onPick = renderPicker()
    fireEvent.click(screen.getByRole('button', { name: /^Invite flow: / }))
    fireEvent.click(screen.getByRole('button', { name: 'Close panel' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /^Invite flow: / }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(onPick).not.toHaveBeenCalled()
  })
})
