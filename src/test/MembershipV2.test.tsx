import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MembershipVersionsPanel } from '@/components/membership/MembershipVersionsPanel'
import {
  readDefaultMembershipVersion,
  writeDefaultMembershipVersion } from '@/data/membershipVersions'

beforeEach(() => {
})

describe('MembershipVersionsPanel — switcher', () => {
  it('lists both versions and fires onSelectVersion for the redesign', () => {
    const onSelect = vi.fn()
    render(
      <MembershipVersionsPanel
        open
        onClose={() => {}}
        activeVersionId="v1"
        onSelectVersion={onSelect}
        defaultVersionId="v1"
        onSetDefault={() => {}}
      />,
    )
    // Each row label is rendered as "<ID> — <name>" (e.g. "V1 — Original").
    expect(screen.getByText('V1 — Original')).toBeInTheDocument()
    expect(screen.getByText('V2 — Redesign — Passport')).toBeInTheDocument()

    fireEvent.click(screen.getByText('V2 — Redesign — Passport'))
    expect(onSelect).toHaveBeenCalledWith('v2')
  })

  it('"Set as default" persists to cgp.membership.version', () => {
    const onSetDefault = vi.fn((id) => writeDefaultMembershipVersion(id))
    render(
      <MembershipVersionsPanel
        open
        onClose={() => {}}
        activeVersionId="v1"
        onSelectVersion={() => {}}
        defaultVersionId="v1"
        onSetDefault={onSetDefault}
      />,
    )
    // Every non-default row exposes a "Set as default" trigger (v2 + v3
    // once V3 shipped), so scope to the v2 ("Redesign — Passport") row.
    const v2Row = screen.getByText('V2 — Redesign — Passport').closest('li')
    if (!v2Row) throw new Error('No <li> row for the v2 version')
    fireEvent.click(within(v2Row as HTMLElement).getByRole('button', { name: 'Set as default' }))
    expect(onSetDefault).toHaveBeenCalledWith('v2')
    expect(readDefaultMembershipVersion()).toBe('v2')
  })
})
