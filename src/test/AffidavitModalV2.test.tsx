import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { AffidavitModal } from '@/components/e2e/AffidavitModal'
import { AffidavitModalV2 } from '@/components/e2e/AffidavitModalV2'
import { FEATURE_FLAGS } from '@/context/FeatureFlagContext'

/**
 * AFFIDAVIT V2 — 2026-11-03, Afsana. The first change V2 makes: the modal
 * does not cover the review chrome. jsdom has no layout, so each case stands
 * the bars up as elements with a faked `getBoundingClientRect`, which is the
 * one thing `useChromeBottom` reads.
 */

/** A stand-in bar: an element with the bar's class whose box ends at `bottom`. */
function bar(className: string, bottom: number, height = 40): HTMLElement {
  const el = document.createElement('div')
  el.className = className
  el.getBoundingClientRect = () =>
    ({ top: bottom - height, bottom, height, left: 0, right: 0, width: 0, x: 0, y: 0 }) as DOMRect
  document.body.appendChild(el)
  return el
}

function scrimOf(): HTMLElement {
  return screen.getByRole('dialog').parentElement as HTMLElement
}

afterEach(() => {
  cleanup()
  document.body.innerHTML = ''
})

describe('AffidavitModalV2', () => {
  it('dims the page from below the lowest bar, not from the top of the window', () => {
    bar('cre-prototype-bar', 44)
    bar('cre-demo-controls', 96)
    bar('cre-demo-controls', 140) // the design bar is a DemoBar too
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('140px')
  })

  it('follows the design bar when it is opened while the modal is up', async () => {
    bar('cre-prototype-bar', 44)
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('44px')
    await act(async () => {
      bar('cre-demo-controls', 120)
      await Promise.resolve() // MutationObserver callbacks are microtasks
    })
    expect(scrimOf().style.top).toBe('120px')
  })

  it('ignores a bar that is mounted but closed (zero height)', () => {
    bar('cre-prototype-bar', 44)
    bar('cre-demo-controls', 300, 0)
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('44px')
  })

  it('covers the whole window when no bar is on screen (?chrome=off)', () => {
    render(<AffidavitModalV2 onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('0px')
  })

  it('sits under the bars’ dropdown menus (60) and over the product shell (51)', () => {
    render(<AffidavitModalV2 onClose={() => {}} />)
    const z = Number(scrimOf().style.zIndex)
    expect(z).toBeGreaterThan(51)
    expect(z).toBeLessThan(60)
  })

  it('shows the same document as V1 — the names are imported, not copied', () => {
    render(<AffidavitModalV2 kind="post" onClose={() => {}} />)
    expect(screen.getByRole('heading', { name: 'Study-manual Notice Affidavit' })).toBeTruthy()
  })

  it('leaves V1 as it was: the whole window, at 1000', () => {
    bar('cre-prototype-bar', 44)
    render(<AffidavitModal onClose={() => {}} />)
    expect(scrimOf().style.top).toBe('')
    expect(scrimOf().style.zIndex).toBe('1000')
  })

  it('is on by default on this branch, on the Design bar of both Homes that open it', () => {
    const flag = FEATURE_FLAGS.find((f) => f.key === 'atlas-affidavit-v2')
    expect(flag?.defaultEnabled).toBe(true)
    expect(flag?.surface).toBe('design')
    // jill-atlas-main is where the invite flow lands (END_TO_END_VERSION).
    expect(flag?.versions).toEqual(['jill-atlas-main', 'eric-atlas-e2e'])
  })
})
