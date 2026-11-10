import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AffidavitModal } from '@/components/e2e/AffidavitModal'
import { AffidavitModalHouseStyle } from '@/components/e2e/AffidavitModalHouseStyle'
import { FEATURE_FLAGS, designControlsFor } from '@/context/FeatureFlagContext'

/* The house-style affidavit modal (2026-11-11, Afsana) — Jill's exploration
   as a sibling of AffidavitModal.tsx, picked on the Design bar. */
describe('AffidavitModalHouseStyle', () => {
  afterEach(cleanup)

  it('is the title and the ✕ on one row, then the student’s notice, the document and its attestation', () => {
    render(<AffidavitModalHouseStyle kind="pre" onClose={() => {}} />)
    expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true')
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Pre-course Affidavit')
    expect(screen.getByRole('note').textContent).toMatch(/^Student action required/)
    expect(screen.getByRole('link', { name: /Pre-course Affidavit/ })).toBeTruthy()
    // Focus lands on the attestation.
    expect(document.activeElement).toBe(screen.getByRole('checkbox'))
  })

  it('keeps its repeated titles in step with the original’s', () => {
    for (const kind of ['pre', 'post'] as const) {
      const { unmount } = render(<AffidavitModal kind={kind} onClose={() => {}} />)
      const original = screen.getByRole('heading', { level: 2 }).textContent
      unmount()
      render(<AffidavitModalHouseStyle kind={kind} onClose={() => {}} />)
      expect(screen.getByRole('heading', { level: 2 }).textContent, kind).toBe(original)
      cleanup()
    }
  })

  it('names the proctor when told to', () => {
    render(<AffidavitModalHouseStyle kind="post" onClose={() => {}} actor="proctor" />)
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe('Study-manual Notice Affidavit')
    expect(screen.getByRole('note').textContent).toMatch(/^Proctor action required/)
  })

  it('I Agree comes on with the box ticked and first name, last name and signature filled — no exam date, no name match', () => {
    const onClose = vi.fn()
    render(<AffidavitModalHouseStyle kind="pre" onClose={onClose} />)
    const agree = screen.getByRole('button', { name: 'I Agree' }) as HTMLButtonElement
    expect(agree.disabled).toBe(true)
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.change(screen.getByLabelText(/^First name/), { target: { value: 'Jordan' } })
    fireEvent.change(screen.getByLabelText(/^Last name/), { target: { value: 'Navarro' } })
    expect(agree.disabled).toBe(true) // no signature yet
    fireEvent.change(screen.getByLabelText(/^Signature/), { target: { value: 'J. Navarro' } })
    expect(agree.disabled).toBe(false) // a signature need not match the name (2026-11-11)
    expect(screen.queryByLabelText(/Date exam was completed/)).toBeNull()
    expect(screen.queryByText(/must match/)).toBeNull()
    fireEvent.click(agree)
    expect(onClose).toHaveBeenCalled()
  })

  it('opens ticked for the handoff gallery, and Escape and the ✕ close it', () => {
    const onClose = vi.fn()
    render(<AffidavitModalHouseStyle kind="pre" onClose={onClose} initialAgreed />)
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('takes every colour from a token, and Jill’s three new values live once, in the XCEL block', () => {
    const src = readFileSync(resolve(__dirname, '../components/e2e/AffidavitModalHouseStyle.tsx'), 'utf8')
    expect(src).not.toMatch(/#[0-9a-f]{3,6}\b/i)
    const tokens = readFileSync(resolve(__dirname, '../styles/tokens.css'), 'utf8')
    const xcel = tokens.slice(tokens.indexOf("[data-brand='xcel'] {"))
    for (const t of ['--color-xcel-affidavit-cta: #3d5a73', '--color-xcel-affidavit-student-fill: #bcebf1', '--color-xcel-affidavit-student-ink: #105f69'])
      expect(xcel.slice(0, xcel.indexOf('\n}')), t).toContain(t)
  })

  it('is on the Design bar of both Homes that open the modal, House style by default, the proctor off', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'affidavit-modal-house-style')!
    expect([flag.surface, flag.owner, flag.defaultVariant, flag.variants?.map((v) => v.value)]).toEqual([
      'design',
      'afsana',
      'house-style',
      ['current', 'house-style'],
    ])
    expect(FEATURE_FLAGS.find((f) => f.key === 'affidavit-modal-proctor')!.defaultEnabled).toBe(false)
    for (const [version, owner] of [['jill-atlas-main', 'jill'], ['eric-atlas-e2e', 'eric']] as const) {
      const keys = designControlsFor(version, owner, null).map((f) => f.key)
      expect(keys, version).toContain('affidavit-modal-house-style')
      expect(keys, version).toContain('affidavit-modal-proctor')
    }
  })
})
