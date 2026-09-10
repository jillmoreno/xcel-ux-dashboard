import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from '@/components/ui/Toast'
import { ALERT_TONES, type AlertTone } from '@/components/ui/alertTones'

const TONES = Object.keys(ALERT_TONES) as AlertTone[]

/**
 * The alert family — the Figma "Alerts" port (`kDJB8Xga3bscFwj2rDXuin`,
 * node `4:287`).
 *
 * The thing worth guarding is the SHARED map. Before it, `Toast` carried its
 * own four-tone table whose own comment admitted warning / error / info all
 * rendered the same `circle-exclamation` "until dedicated SVGs are added".
 * Those SVGs exist now, and the failure mode if a later edit re-forks the
 * table is silent: three tones showing one glyph, differing only in colour,
 * which is exactly the thing a colour-blind learner cannot read.
 */
describe('the alert tone map', () => {
  it('gives every tone a DISTINCT glyph — colour is never the only difference', () => {
    const glyphs = TONES.map((t) => ALERT_TONES[t].Icon)
    // `message` and `promo` share the brand colour, so if the glyphs also
    // collapsed there would be nothing left to tell them apart.
    expect(new Set(glyphs).size).toBe(glyphs.length)
  })

  it('gives every tone a word, so nothing is carried by hue alone', () => {
    for (const tone of TONES) {
      expect(ALERT_TONES[tone].label.length).toBeGreaterThan(0)
    }
  })

  it('resolves every colour through a token — no raw hex', () => {
    for (const tone of TONES) {
      expect(ALERT_TONES[tone].border).toMatch(/^var\(--color-/)
      expect(ALERT_TONES[tone].icon).toMatch(/^var\(--color-/)
    }
  })

  it('keeps the two CONTENT tones on the brand ramp and the four SYSTEM tones functional', () => {
    // A message from your instructor is not a system state. Borrowing the
    // success / warning / error ramp for it makes "you have mail" read as a
    // verdict — see the note in alertTones.ts.
    for (const tone of ['message', 'promo'] as const) {
      expect(ALERT_TONES[tone].icon).toContain('--color-primary-')
    }
    for (const tone of ['success', 'warning', 'error', 'info'] as const) {
      expect(ALERT_TONES[tone].icon).toContain(`--color-${tone}-`)
    }
  })
})

describe('Toast reads the shared map', () => {
  it('renders a different glyph per tone', () => {
    const seen = new Set<string>()
    for (const tone of TONES) {
      const { container, unmount } = render(
        <Toast open onClose={() => {}} tone={tone} title="T" duration={0}>
          body
        </Toast>,
      )
      const path = container.ownerDocument.body.querySelector('.cre-toast svg path')
      expect(path).not.toBeNull()
      seen.add(path!.getAttribute('d') ?? '')
      unmount()
    }
    expect(seen.size).toBe(TONES.length)
  })
})

describe('the dual CTA', () => {
  it('renders primary FIRST, secondary second — the design’s order', async () => {
    render(
      <Toast
        open
        onClose={() => {}}
        tone="info"
        title="Heads up"
        duration={0}
        action={{ label: 'Primary', onClick: () => {} }}
        secondaryAction={{ label: 'Secondary', onClick: () => {} }}
      >
        body
      </Toast>,
    )
    const labels = screen
      .getAllByRole('button')
      .map((b) => b.textContent)
      .filter((t) => t === 'Primary' || t === 'Secondary')
    expect(labels).toEqual(['Primary', 'Secondary'])
  })

  it('does not render a lone secondary — that is a primary wearing the wrong weight', () => {
    render(
      <Toast
        open
        onClose={() => {}}
        title="Heads up"
        duration={0}
        secondaryAction={{ label: 'Secondary', onClick: () => {} }}
      >
        body
      </Toast>,
    )
    expect(screen.queryByRole('button', { name: 'Secondary' })).toBeNull()
  })

  it('closes the toast after either action fires', async () => {
    const onClose = vi.fn()
    const onSecondary = vi.fn()
    render(
      <Toast
        open
        onClose={onClose}
        title="Heads up"
        duration={0}
        action={{ label: 'Primary', onClick: () => {} }}
        secondaryAction={{ label: 'Secondary', onClick: onSecondary }}
      >
        body
      </Toast>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Secondary' }))
    expect(onSecondary).toHaveBeenCalledOnce()
    expect(onClose).toHaveBeenCalledOnce()
  })
})

describe('the secondary button’s colour is theme-aware', () => {
  it('takes the class and sets no inline colour — the primary does the opposite', () => {
    render(
      <Toast
        open
        onClose={() => {}}
        title="Heads up"
        duration={0}
        action={{ label: 'Primary', onClick: () => {} }}
        secondaryAction={{ label: 'Secondary', onClick: () => {} }}
      >
        body
      </Toast>,
    )
    const secondary = screen.getByRole('button', { name: 'Secondary' })
    const primary = screen.getByRole('button', { name: 'Primary' })
    // Action-coloured TEXT on a card that goes dark — must come from the class.
    expect(secondary).toHaveClass('cre-alert-action')
    expect(secondary.style.color).toBe('')
    // White on the action FILL — no theme swap needed, and the class would be
    // noise. `--color-action` is correct here, which is what it is for.
    expect(primary).not.toHaveClass('cre-alert-action')
    expect(primary.style.color).toBe('rgb(255, 255, 255)')
  })
})
