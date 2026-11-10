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

  /* Jill, 2026-11-10: her three off-ramp values stay in the component, named,
     until she decides whether they belong in the XCEL ramp — not in tokens.css. */
  it('takes every other colour from a token, and keeps Jill’s three as named constants', () => {
    const src = readFileSync(resolve(__dirname, '../components/e2e/AffidavitModalHouseStyle.tsx'), 'utf8')
    expect([...src.matchAll(/#[0-9a-f]{6}\b/gi)].map((m) => m[0]).sort()).toEqual(['#105f69', '#3d5a73', '#bcebf1'])
    for (const name of ['CTA', 'STUDENT_FILL', 'STUDENT_INK']) expect(src, name).toMatch(new RegExp(`const ${name} = '#[0-9a-f]{6}' // Jill, 2026-11-10`))
    const tokens = readFileSync(resolve(__dirname, '../styles/tokens.css'), 'utf8')
    expect(tokens).not.toMatch(/xcel-affidavit/)
  })

  it('the student’s notice is teal with a person; the proctor’s amber with a triangle', () => {
    render(<AffidavitModalHouseStyle kind="pre" onClose={() => {}} />)
    const student = screen.getByRole('note')
    expect(student.style.borderColor).toBe('var(--color-info-500)')
    const studentIcon = student.querySelector('svg')!.outerHTML
    cleanup()
    render(<AffidavitModalHouseStyle kind="pre" onClose={() => {}} actor="proctor" />)
    const proctor = screen.getByRole('note')
    expect(proctor.style.borderColor).toBe('var(--color-warning-300)')
    expect(proctor.style.background).toBe('var(--color-warning-100)')
    expect(proctor.querySelector('svg')!.outerHTML).not.toBe(studentIcon)
  })

  it('has no hairline above I Agree', () => {
    render(<AffidavitModalHouseStyle kind="pre" onClose={() => {}} />)
    const footer = screen.getByRole('button', { name: 'I Agree' }).parentElement!
    expect(footer.style.borderTop).toBe('')
    expect(footer.style.padding).toBe('16px 30px 32px')
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
