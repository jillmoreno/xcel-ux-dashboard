import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UxDashboardPage } from '@/pages/UxDashboardPage'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROTOTYPE_FEATURES, componentPreviewUrl } from '@/data/prototypeFeatures'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'

/**
 * Smoke test for the XCEL dashboard.
 *
 * Same job as its siblings: the port could not be verified visually (no browser
 * in the build environment), and the failure that matters — a missing provider
 * throwing on mount — renders a blank page that reads as a styling bug rather
 * than an error.
 *
 * XCEL adds one concern the others do not have: its previews point at ANOTHER
 * project's live Netlify deploy rather than at files in `public/`. A unit test
 * cannot prove that origin is reachable or frame-embeddable, but it can pin the
 * shape of the URL so a careless edit to `PROTOTYPE_BASE` fails here instead of
 * silently blanking every preview in the browser.
 */

function renderDashboard(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AccountProvider>
        <ThemeProvider>
          <UxDashboardPage />
        </ThemeProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/** The nav order is load-bearing: open sections first, then the gated group,
 *  with the divider drawn where the first gated one starts. */
const EXPECTED_SECTIONS = [
  'Demo',
  'Research',
  'Design',
  'Exploration',
  'Sandbox',
  'Development',
  'Done',
  'Archive',
  'QA Notes',
  'To Do',
]

beforeEach(() => {
  // Section unlocks live in sessionStorage; a leaked unlock would make the gate
  // assertions pass for the wrong reason.
  sessionStorage.clear()
  localStorage.clear()
})

describe('XCEL dashboard — mount and nav', () => {
  it('mounts and renders the brand lockup', () => {
    renderDashboard()
    expect(screen.getByText('UX Dashboard')).toBeInTheDocument()
    expect(screen.getByText('XCEL LMS')).toBeInTheDocument()
  })

  it('renders the full section set, in order', () => {
    renderDashboard()
    const nav = screen.getByRole('navigation')
    const labels = within(nav)
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
    for (const section of EXPECTED_SECTIONS) {
      expect(labels.some((l) => l.includes(section))).toBe(true)
    }
    const positions = EXPECTED_SECTIONS.map((s) => labels.findIndex((l) => l.includes(s)))
    expect(positions).toEqual([...positions].sort((a, b) => a - b))
  })
})

describe('section routing (sectionOf)', () => {
  /**
   * All four XCEL rows carry `devStatus: 'in-design'`, which OUTRANKS their
   * `category: 'sandbox'` — so they land in Design, not Sandbox. That is
   * inherited deliberately from the Common LMS dashboard, where the same four
   * rows resolve the same way; drop the devStatus and all four fall back into
   * Sandbox, which is that category's documented behaviour rather than a bug.
   */
  const EXPECTED_PLACEMENT: Record<string, string> = {
    'xcel-lms': 'exploration',
    'xcel-walkthrough': 'exploration',
    'xcel-wireframes': 'exploration',
    'xcel-admin': 'exploration',
    'xcel-exam-spec': 'exploration',
  }

  it('accounts for every authored feature', () => {
    const ids = PROTOTYPE_FEATURES.map((f) => f.id).sort()
    expect(ids).toEqual(Object.keys(EXPECTED_PLACEMENT).sort())
  })

  it('no Exploration or Sandbox row carries a devStatus', () => {
    // The inverse of the rule below, and the one that actually bites in this
    // repo. `sectionOf` checks devStatus BEFORE category, so a status added to
    // one of these rows silently pulls it out of Exploration and into Design —
    // no error, and it reads as the row simply vanishing from the section.
    for (const f of PROTOTYPE_FEATURES) {
      const placed = EXPECTED_PLACEMENT[f.id]
      if (placed !== 'exploration' && placed !== 'sandbox') continue
      expect(
        f.devStatus,
        `${f.id} is in ${placed}, so it must NOT carry a devStatus`,
      ).toBeUndefined()
    }
  })

  it('every Design/Development row carries an authored devStatus', () => {
    for (const f of PROTOTYPE_FEATURES) {
      const placed = EXPECTED_PLACEMENT[f.id]
      if (placed !== 'design' && placed !== 'development') continue
      expect(f.devStatus, `${f.id} needs an authored devStatus`).toBeTruthy()
    }
  })

  it('Demo is empty, so the ungated front door shows no rows', () => {
    // Asserted rather than assumed. Every XCEL artifact sits in Exploration, so
    // nothing is presentation-ready — and the consequence is that a viewer
    // WITHOUT the password sees an empty Demo section and nothing else. If a row
    // is ever promoted to Demo, this test is the one that should fail and be
    // updated, so the change is deliberate.
    renderDashboard()
    expect(screen.getByRole('heading', { level: 1, name: 'Demo' })).toBeInTheDocument()
    expect(screen.queryByText('XCEL LMS — Desktop Platform')).not.toBeInTheDocument()
  })
})

describe('the restricted group is gated', () => {
  it('prompts for a password instead of revealing Design', async () => {
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('button', { name: /Design/ }))
    expect(screen.queryByText('XCEL LMS — Desktop Platform')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('a deep link into a gated section does not reveal it', () => {
    renderDashboard('/?section=design')
    expect(screen.queryByText('XCEL LMS — Desktop Platform')).not.toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('leaves the open sections open', () => {
    renderDashboard('/?section=demo')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('prototype URLs — served from this repo', () => {
  /*
   * These asserted the OPPOSITE until 2026-09-02: that every row pointed at an
   * absolute URL on the Common LMS deploy, because the prototypes lived there
   * and a relative path would 404 into the SPA fallback — rendering this
   * dashboard inside its own preview frame.
   *
   * The prototypes are now copied into this repo's public/prototypes/ and
   * PROTOTYPE_BASE is '/prototypes', because both Netlify sites are password-
   * protected: a cross-origin iframe needed a third-party session cookie on the
   * other origin, which Safari blocks and Chrome restricts, so reviewers got a
   * password prompt inside every thumbnail instead of a page.
   *
   * The old failure mode these guarded against is REAL and has not gone away —
   * it has only changed shape. A relative path still falls through to the SPA
   * fallback if the file is missing, and Netlify's catch-all returns 200 with
   * index.html, so the tile silently renders the dashboard inside itself with
   * no error anywhere. That is why the existence check below matters more than
   * the shape check: shape alone would pass for a file nobody ever copied.
   */
  it('every row points at a same-origin /prototypes/ path', () => {
    for (const f of PROTOTYPE_FEATURES) {
      expect(f.externalUrl, `${f.id} needs an externalUrl`).toBeTruthy()
      expect(f.externalUrl).toMatch(/^\/prototypes\/[\w.-]+$/)
      // The row's picture and its CTA must be the same artifact.
      expect(f.livePreviewUrl).toBe(f.externalUrl)
    }
  })

  it('every row resolves to a file that actually exists in public/', () => {
    // The one that earns its keep. A tile pointing at a file nobody copied is
    // invisible in CI and in the build — it only shows up as a preview frame
    // quietly containing the dashboard itself.
    for (const f of PROTOTYPE_FEATURES) {
      const rel = f.externalUrl!.replace(/^\//, '')
      const onDisk = resolve(dirname(fileURLToPath(import.meta.url)), '../../public', rel)
      expect(existsSync(onDisk), `${f.id} → ${f.externalUrl} is not in public/`).toBe(true)
    }
  })

  it('all rows share one base, so a move stays one constant', () => {
    const bases = new Set(PROTOTYPE_FEATURES.map((f) => f.externalUrl!.replace(/\/[^/]+$/, '')))
    expect(bases.size).toBe(1)
    expect([...bases][0]).toBe('/prototypes')
  })
})

describe('handoff previews', () => {
  it('resolves a URL for every documented component', () => {
    // No XCEL row authors devHandoff notes yet, so this iterates nothing today.
    // It is here so that the first one added is checked rather than silently
    // rendering the "add previewUrl" fallback.
    for (const f of PROTOTYPE_FEATURES) {
      for (const c of [
        ...(f.devHandoff?.components ?? []),
        ...(f.devHandoff?.uiComponents ?? []),
      ]) {
        expect(componentPreviewUrl(c.id), `${f.id}/${c.id} has no preview`).toBeTruthy()
      }
    }
  })

  it('returns null for an unknown id rather than throwing', () => {
    expect(componentPreviewUrl('no-such-component')).toBeNull()
  })
})

describe('archive', () => {
  it('is empty, and any future row explains how to restore itself', () => {
    // Empty is the correct state — XCEL has removed nothing. The loop guards the
    // convention for whenever that changes.
    for (const item of ARCHIVED_ITEMS) {
      expect(item.restoreNote.length, `${item.id} needs a real restoreNote`).toBeGreaterThan(40)
      expect(item.location).toBeTruthy()
      expect(item.dateRemoved).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
