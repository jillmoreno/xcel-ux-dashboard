import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UxDashboardPage } from '@/pages/UxDashboardPage'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { existsSync, readFileSync, statSync } from 'node:fs'
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

/** The nav order is load-bearing: the ungated sections first (Prototypes ·
 *  Refinement · Other Links · Research · Development · Done — Development and
 *  Done were pulled out of the shared gate 2026-09-23, see `NAV_EYEBROWS` in
 *  UxDashboardPage.tsx), then the still-gated group, with the divider drawn
 *  where the first gated one starts. */
const EXPECTED_SECTIONS = [
  'Prototypes',
  'Refinement',
  'Other Links',
  'Research',
  'Design',
  'Exploration',
  'Sandbox',
  'Development',
  'Done',
  'Archive',
  'QA Notes',
  'To Do',
  'Contributing',
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

  it('Contributing renders the static designer guide in a frame — one document, not a JSX copy', () => {
    renderDashboard('/?section=contributing')
    const frame = screen.getByTitle('Contributing to the dashboard')
    expect(frame.tagName).toBe('IFRAME')
    expect(frame).toHaveAttribute('src', '/contributing/')
    // …and that document exists, with its PDF beside it. The guide's own header
    // comment says how the PDF is regenerated; this only proves neither is missing.
    const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/contributing')
    const html = readFileSync(resolve(dir, 'index.html'), 'utf8')
    expect(html).toContain('href="contributing.pdf"')
    expect(statSync(resolve(dir, 'contributing.pdf')).size).toBeGreaterThan(10_000)
  })

  it('the foot of the rail links the stakeholder guide, outside the section nav', () => {
    renderDashboard()
    const link = screen.getByRole('link', { name: /How to read this dashboard/ })
    expect(link).toHaveAttribute('href', '/about/')
    // Not a section: it must not be inside the <nav>, or it becomes a
    // thirteenth row and the order assertion above starts counting it.
    expect(screen.getByRole('navigation')).not.toContainElement(link)
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
    // The one in-app row, and the only feature row on the ungated front door.
    'xcel-dashboard': 'prototypes',
    'xcel-lms': 'exploration',
    'xcel-walkthrough': 'exploration',
    'xcel-wireframes': 'exploration',
    'xcel-admin': 'exploration',
    'xcel-admin-tool': 'exploration',
    'xcel-exam-spec': 'exploration',
    // Added 2026-09-22 — see the row's own note in `prototypeFeatures.ts` for
    // why this page stopped being masthead-only and took a tile.
    'xcel-pace-presets': 'exploration',
    // Added 2026-09-24 — the repo's FIRST authored dev handoff. `devStatus:
    // 'in-design'` is what places it, and `sectionOf` reads that BEFORE
    // `category`, so changing the status moves the row between Design and
    // Development. Update this map in the same commit if it moves. (It did,
    // same day: it shipped `in-design` → Design, which was wrong for a handoff.)
    'xcel-course-entry': 'development',
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

  it('Prototypes holds exactly the rows meant to be ungated', () => {
    /*
     * Prototypes (Demo until 2026-09-18, when Demo became the authored-on-the-
     * page review inbox) is the UNGATED front door for FEATURE ROWS: a viewer
     * with no password sees this section's rows and no others. So what sits
     * here is a decision about what a stakeholder may see unaccompanied, and
     * it should not be possible to change it by accident.
     *
     * ⚠ This test was previously called "Demo is empty", and its comment
     * claimed to be the tripwire that would fail if a row were ever promoted.
     * IT WOULD NOT HAVE. It only asserted that one gated row's title was
     * absent, which stayed true no matter what else appeared — so when
     * `xcel-dashboard` was promoted on 2026-09-08 this test passed, and three
     * unrelated `externalUrl` assertions were what actually caught it.
     *
     * It compares the whole set now, in both directions: promoting a row to
     * Prototypes fails here, and so does demoting the one that belongs.
     */
    // Prototypes is the landing section, so a bare `/` is the case that matters.
    renderDashboard()
    expect(screen.getByRole('heading', { level: 1, name: 'Prototypes' })).toBeInTheDocument()

    // Counted from the RENDERED section rather than from the data, because
    // what a passwordless viewer can reach is the actual concern. Every row
    // carries one "Actions for <title>" kebab, so the kebabs are the rows.
    const rows = screen
      .getAllByRole('button', { name: /^Actions for / })
      .map((b) => b.getAttribute('aria-label')?.replace(/^Actions for /, ''))
    expect(rows).toEqual(['XCEL Dashboard — Live Product Build'])

    // …and a gated row is still not among them.
    expect(screen.queryByText('XCEL LMS — Desktop Platform')).not.toBeInTheDocument()
  })
})

/**
 * The in-app password is NOT enforced on the full build (2026-09-18). The
 * Netlify site password is the lock on the full site, and on the public site
 * the restricted group is absent altogether (PublicGateway.test.tsx) — so the
 * modal had no job on either. These used to assert the opposite; they are
 * inverted rather than deleted so re-enabling `ENFORCE_SECTION_GATE` fails
 * here and gets re-decided.
 */
describe('the restricted group is open on the full build', () => {
  it('opens Exploration on click — no password, no lock glyph', async () => {
    const user = userEvent.setup()
    renderDashboard()
    expect(screen.queryByText(/— locked/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Exploration/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('XCEL LMS — Desktop Platform')).toBeInTheDocument()
  })

  it('a deep link into a restricted section lands on it directly', () => {
    renderDashboard('/?section=exploration')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Exploration')
  })

  it('the gate metadata is still there — the public build filters on it', () => {
    // Not a DOM assertion: the divider and its eyebrow are what the metadata
    // draws on the full build, so their presence proves the `gate` fields
    // survived the un-enforcement.
    renderDashboard()
    expect(screen.getByText(/^Designers$/i)).toBeInTheDocument()
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
  /**
   * These three cover the DOCUMENT rows — the ones opening a standalone HTML
   * file under public/prototypes/. Every row was one until 2026-09-08, when
   * `xcel-dashboard` arrived pointing at an in-app route instead, so they are
   * scoped by `to` rather than looping over PROTOTYPE_FEATURES blind.
   *
   * The split is asserted below rather than assumed: a row must carry exactly
   * one of `to` / `externalUrl`, so a new document row cannot skip these
   * checks by quietly omitting `externalUrl`, which is how the guard would
   * otherwise be lost.
   */
  const documentRows = PROTOTYPE_FEATURES.filter((f) => !f.to)
  const routeRows = PROTOTYPE_FEATURES.filter((f) => f.to)

  it('every row is either a document or a route, never both and never neither', () => {
    for (const f of PROTOTYPE_FEATURES) {
      expect(
        Boolean(f.to) !== Boolean(f.externalUrl),
        `${f.id} needs exactly one of to / externalUrl`,
      ).toBe(true)
    }
    // Both kinds exist, so neither filter above is vacuously empty.
    expect(documentRows.length).toBeGreaterThan(0)
    expect(routeRows.length).toBeGreaterThan(0)
  })

  it('every route row points into this app, not off it', () => {
    for (const f of routeRows) {
      // A same-origin path. An absolute URL here would open the tile in a new
      // tab via `externalUrl`'s anchor path instead of routing, so it would be
      // the wrong field.
      expect(f.to, `${f.id}`).toMatch(/^\/[\w\-/]*(\?.*)?$/)
    }
  })

  it('every document row points at a same-origin /prototypes/ path', () => {
    for (const f of documentRows) {
      expect(f.externalUrl, `${f.id} needs an externalUrl`).toBeTruthy()
      expect(f.externalUrl).toMatch(/^\/prototypes\/[\w.-]+$/)
      // The row's picture and its CTA must be the same artifact.
      expect(f.livePreviewUrl).toBe(f.externalUrl)
    }
  })

  it('every document row resolves to a file that actually exists in public/', () => {
    // The one that earns its keep. A tile pointing at a file nobody copied is
    // invisible in CI and in the build — it only shows up as a preview frame
    // quietly containing the dashboard itself.
    for (const f of documentRows) {
      const rel = f.externalUrl!.replace(/^\//, '')
      const onDisk = resolve(dirname(fileURLToPath(import.meta.url)), '../../public', rel)
      expect(existsSync(onDisk), `${f.id} → ${f.externalUrl} is not in public/`).toBe(true)
    }
  })

  it('all document rows share one base, so a move stays one constant', () => {
    const bases = new Set(documentRows.map((f) => f.externalUrl!.replace(/\/[^/]+$/, '')))
    expect(bases.size).toBe(1)
    expect([...bases][0]).toBe('/prototypes')
  })

  /*
   * The share origin — a DIFFERENT constant from PROTOTYPE_BASE above, and the
   * one that was wrong until 2026-09-03.
   *
   * shareLink.ts arrived as a byte-identical copy of the Common LMS file and
   * kept ITS origin, so every "Copy link" here produced a URL on
   * ux-lms-dashboard.netlify.app — a site that does not serve this dashboard's
   * routes. Nothing caught it because the constant was never read in a test and
   * a wrong-but-well-formed URL looks fine in a toast.
   *
   * Asserted against the SOURCE rather than the imported value, because the
   * export is now derived from window.location and resolves to the jsdom
   * localhost fallback under vitest — so importing it would only ever test the
   * fallback branch. Reading the declared literal is what pins the thing a
   * careless re-copy would get wrong. Same technique as smoke-desktop.mjs
   * parsing declared hex out of the stylesheet.
   */
  it('the share-origin fallback is THIS site, not a sibling dashboard', () => {
    const src = readFileSync(
      resolve(dirname(fileURLToPath(import.meta.url)), '../components/prototype/shareLink.ts'),
      'utf8',
    )
    const declared = src.match(/const DEPLOYED_ORIGIN = '([^']+)'/)?.[1]
    expect(declared, 'DEPLOYED_ORIGIN is no longer a plain string literal').toBeTruthy()
    expect(declared).toBe('https://xceldashboard.netlify.app')
    // Guard the specific regression, in the house style of asserting that the
    // old wrong value stays wrong.
    expect(declared).not.toContain('ux-lms-dashboard')
    expect(declared).not.toContain('partnerhub')
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

describe('the Prototypes row opens the committed configuration', () => {
  it('carries `?demo=1`, not the bare route', () => {
    // Demo mode swaps the working flag map for the committed baseline before
    // first paint. Without the param, a returning reviewer's own persisted
    // toggles ARE the demo — silently, and the nav is where that shows first.
    //
    // Asserted on the row rather than by rendering, because the failure is a
    // missing query param on a link that still works perfectly.
    const row = PROTOTYPE_FEATURES.find((f) => f.id === 'xcel-dashboard')!
    expect(row.to).toBe('/dashboard-rebrand?demo=1')
  })

  it('holds the route rows and nothing else', () => {
    // The document-shape guards are scoped to rows WITHOUT `to`; a document row
    // that accidentally grows one would slip past every one of them.
    //
    // ⚠ WAS "is still the only row in the file with a `to`" until 2026-09-24,
    // when `xcel-course-entry` — the repo's first dev handoff — landed as a
    // legitimate second route row. The assertion is still the whole SET in both
    // directions, which is what actually catches an accidental conversion; only
    // the expected set grew. Loosening this to a count, or to "at least one",
    // would give up the guard entirely.
    expect(PROTOTYPE_FEATURES.filter((f) => f.to).map((f) => f.id).sort()).toEqual([
      'xcel-course-entry',
      'xcel-dashboard',
    ])
  })
})

/* ── The component detail's jump nav ─────────────────────────────────────────
 *
 * Read from the SOURCE, not the module: `COMPONENT_SECTIONS` is deliberately
 * not exported (PrototypeFeaturePage.tsx is a byte-for-byte copy of the LMS
 * file, and exporting it here would make the file un-copyable). The LMS
 * tokenContrast test reads its stylesheet the same way, for the same reason. */
describe('component detail — COMPONENT_SECTIONS matches the render order', () => {
  // A PATH, not a `new URL(…)`: under the jsdom environment the global `URL`
  // is jsdom's, and Node's `readFileSync` rejects it ("must be of scheme
  // file"). Same shape the two reads above use.
  const src = readFileSync(
    resolve(dirname(fileURLToPath(import.meta.url)), '../pages/PrototypeFeaturePage.tsx'),
    'utf8',
  )

  it('declares the sections in the order the detail renders them', () => {
    // The array: `{ id: 'quick-summary', label: '…' }, …`
    const arr = src.slice(src.indexOf('const COMPONENT_SECTIONS = ['), src.indexOf('] as const'))
    const declared = [...arr.matchAll(/\{ id: '([a-z-]+)'/g)].map((m) => m[1])
    // The render: `{section(\n        'quick-summary',` — one call per section.
    const rendered = [...src.matchAll(/\{section\(\n\s+'([a-z-]+)',/g)].map((m) => m[1])
    expect(declared.length).toBeGreaterThan(0)
    // A mismatch silently highlights the wrong scroll-spy chip and nothing else
    // fails, which is why this is asserted rather than trusted.
    expect(rendered).toEqual(declared)
  })

  it('leads with the Quick Summary, and seeds the active chip from it', () => {
    expect(src).toMatch(/const COMPONENT_SECTIONS = \[\n(?:\s*\/\/.*\n)*\s*\{ id: 'quick-summary'/)
    expect(src).toContain("useState<ComponentSectionId>('quick-summary')")
  })
})
