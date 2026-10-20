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
import { PROTOTYPE_FEATURES, PROTOTYPE_SCOPES, componentPreviewUrl } from '@/data/prototypeFeatures'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'
import { HUB_DOCS } from '@/data/hubDocs'

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

/** The nav order is load-bearing — see `NAV_EYEBROWS` in UxDashboardPage.tsx.
 *  Ten sections since 2026-10-15: Design is retired with the Designers group
 *  it headed, Explorations (was Exploration) moved up to sit under PRDs, and
 *  Archive and QA Notes sit under Dev Handoff, ungated. */
const EXPECTED_SECTIONS = [
  'Prototypes',
  'Refinement',
  'Research',
  'Resources',
  'PRDs',
  'Explorations',
  'Development',
  'Done',
  'Archive',
  'QA Notes',
  // The two Team sections (2026-10-15), last, under one "Team" eyebrow — see
  // the `SectionDef`s in `UxDashboardPage.tsx`. The board is NOT the archived
  // To Do section, which had id `todo` and is still archived. Hub Resources is
  // the first way back to the guides since the Contributing section was
  // archived and the rail-foot link to /about/ came off (both 2026-09-29, both
  // still pinned gone below).
  'To Do Board',
  'Hub Resources',
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
    expect(screen.getByText('UX Design Hub')).toBeInTheDocument()
    // Both products, because the hub is now explicitly about both — XCEL LMS
    // alone read as the name of the only thing in here.
    expect(screen.getByText('Atlas LMS & Compass Learning')).toBeInTheDocument()
    // No third line since 2026-10-15: "Design Link" said which build you were
    // on, and the demo site is being retired — one site, nothing to tell apart.
    expect(screen.queryByText('Design Link')).toBeNull()
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

  it('Hub Resources lists every guide, opening each in a new tab', async () => {
    // The rows come from `HUB_DOCS`, which is code rather than a board, so the
    // list is assertable in a way Refinement's never can be. New tab because
    // each document is a full page with its own rail: opening one in this tab
    // replaces the dashboard with something that has no way back to it.
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('button', { name: /Hub Resources/ }))
    for (const doc of HUB_DOCS) {
      const link = screen.getByRole('link', { name: new RegExp(doc.title) })
      expect(link).toHaveAttribute('href', doc.href)
      expect(link).toHaveAttribute('target', '_blank')
    }
  })

  it('every Hub Resources row points at a document this repo actually ships', () => {
    // The one failure this list can have that nothing else would catch: a
    // path typed by hand that no longer exists, which renders as a perfectly
    // ordinary row and 404s on click.
    for (const doc of HUB_DOCS) {
      const pub = resolve(dirname(fileURLToPath(import.meta.url)), '../../public')
      expect(existsSync(resolve(pub, doc.href.replace(/^\//, ''), 'index.html'))).toBe(true)
      if (doc.pdf) expect(existsSync(resolve(pub, doc.pdf.replace(/^\//, '')))).toBe(true)
    }
  })

  it('the archived Contributing section no longer resolves, and its guide is untouched', () => {
    // ARCHIVED 2026-09-29. This test used to assert the section rendered the
    // guide in an iframe. Both halves still matter, in opposite directions:
    //
    //   the SECTION is gone — `?section=contributing` no longer resolves, so
    //   the rail has no row and the URL falls back like any unknown section;
    //   the DOCUMENT is not — `public/contributing/` is deliberately untouched
    //   and still served at /contributing/, which is where CLAUDE.md sends
    //   designers. Archiving the rail entry must never take the guide with it.
    renderDashboard('/?section=contributing')
    expect(screen.queryByTitle('Contributing to the dashboard')).toBeNull()

    const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../../public/contributing')
    const html = readFileSync(resolve(dir, 'index.html'), 'utf8')
    expect(html).toContain('href="contributing.pdf"')
    expect(statSync(resolve(dir, 'contributing.pdf')).size).toBeGreaterThan(10_000)
  })

  it('no longer links the stakeholder guide from the rail', () => {
    // Removed 2026-09-29. The guide itself is UNCHANGED and still served at
    // /about/ — this is the rail entry going, not the document. Pinned rather
    // than deleted so that putting the link back is a deliberate act with a
    // failing test behind it, not something that drifts back in.
    renderDashboard()
    expect(screen.queryByRole('link', { name: /How to read this dashboard/ })).toBeNull()
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
    // The in-app rows — the only feature rows on the ungated front door. One
    // per `prototypeScope`; see "Prototypes holds exactly the rows" below.
    'xcel-invite': 'prototypes',
    'xcel-atlas-learning': 'prototypes',
    'xcel-dashboard': 'prototypes',
    'xcel-compass': 'prototypes',
    // The seven documents — Explorations, directly under PRDs since 2026-10-15.
    // `xcel-lms` and `xcel-admin-tool` stood here until 2026-10-15 — archived
    // (`archivedFeatureRows.ts`; `desktop-platform-row`, `admin-tool-row`).
    'xcel-compliance-documents': 'exploration',
    'xcel-walkthrough': 'exploration',
    'xcel-wireframes': 'exploration',
    'xcel-admin': 'exploration',
    // The Admin placeholder (2026-10-14) — a coming-soon row that opens nothing.
    'xcel-admin-coming-soon': 'prototypes',
    'xcel-exam-spec': 'exploration',
    // `atlas-home-course-card` (the first handoff row, 2026-09-24) stood here
    // until 2026-10-15 — archived, `home-course-card-handoff`.
    // Added 2026-09-22 — see the row's own note in `prototypeFeatures.ts` for
    // why this page stopped being masthead-only and took a tile.
    'xcel-pace-presets': 'exploration',
    // `xcel-course-entry` (the repo's first authored dev handoff, 2026-09-24)
    // stood here until 2026-10-15 — archived, `course-entry-handoff`. Both
    // handoffs were removed as "not ready"; Development lists nothing now.
    // The Atlas Home dev-handoff split (2026-10-19) — `devStatus: 'in-design'`
    // on all eight; a page-level Overview plus one row per component. They land
    // on DEVELOPMENT, not Design: Design was archived 2026-10-15 (`design-
    // section`) and `sectionOf` now returns 'development' for any authored
    // status. `category: 'dev-handoff'` routes there too, so both paths agree.
    'xcel-atlas-home-overview': 'development',
    'xcel-atlas-home-course-head': 'development',
    'xcel-atlas-home-progress-panel': 'development',
    'xcel-atlas-home-readiness-panel': 'development',
    'xcel-atlas-home-exam-date-card': 'development',
    'xcel-atlas-home-study-journey': 'development',
    'xcel-atlas-home-quick-links': 'development',
    'xcel-atlas-home-affidavit-modal': 'development',
  }

  it('accounts for every authored feature', () => {
    const ids = PROTOTYPE_FEATURES.map((f) => f.id).sort()
    expect(ids).toEqual(Object.keys(EXPECTED_PLACEMENT).sort())
  })

  it('no Explorations row carries a devStatus', () => {
    // The inverse of the rule below, and the one that actually bites in this
    // repo. `sectionOf` checks devStatus BEFORE category, so a status added to
    // one of these rows silently pulls it out of Explorations and onto the
    // Development board — no error, and it reads as the row simply vanishing
    // from the section.
    for (const f of PROTOTYPE_FEATURES) {
      const placed = EXPECTED_PLACEMENT[f.id]
      if (placed !== 'exploration') continue
      expect(
        f.devStatus,
        `${f.id} is in ${placed}, so it must NOT carry a devStatus`,
      ).toBeUndefined()
    }
  })

  it('every Development row carries an authored devStatus', () => {
    for (const f of PROTOTYPE_FEATURES) {
      const placed = EXPECTED_PLACEMENT[f.id]
      if (placed !== 'development') continue
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
    // ⚠ ONE ROW PER SCOPE since 2026-10-14 — it was exactly one row from
    // 2026-09-28. The list is still written out, in section order, so adding
    // a row is a deliberate edit here and not something a category typo does.
    // The product FIRST (2026-10-14, Jillienne: "always have this be the
    // first option"), then the doors around it.
    //
    // 2026-10-16: the end-to-end row RELEASED and so joined this list, at the
    // top — it is the product row, and the order rule above is what puts it
    // there rather than anything about its status.
    expect(rows).toEqual([
      'End-to-End User Experience (Invite, Atlas, Compass)',
      'Invite & Purchase — Work in Progress',
      'Atlas Learning — Work in Progress',
      'Compass Learning — Work in Progress',
    ])
    // …plus the ONE remaining PLACEHOLDER, which has no kebab because it goes
    // nowhere: drawn disabled, titled, tagged "Coming soon", and not a link.
    // The Admin row has nothing built behind it. (The end-to-end row was the
    // other kind — built, held back, route kept — until it was released.)
    for (const [id, title] of [['xcel-admin-coming-soon', 'Admin Tool']]) {
      const placeholder = document.querySelector(`[data-placeholder="${id}"]`)
      expect(placeholder, `${id} should be drawn as a placeholder`).not.toBeNull()
      expect(placeholder!.getAttribute('aria-disabled')).toBe('true')
      expect(placeholder!.querySelector('a')).toBeNull()
      // The generated mark, never a live frame — "a default icon image like
      // the admin tool to show it's disabled".
      expect(placeholder!.querySelector('iframe, img')).toBeNull()
      expect(placeholder!.textContent).toContain(title)
      expect(placeholder!.textContent).toContain('Coming soon')
    }

    // …and a gated row is still not among them.
    expect(screen.queryByText('XCEL LMS — Desktop Platform')).not.toBeInTheDocument()
  })
})

/**
 * THE DESIGNERS GROUP IS GONE (2026-10-15). Design, Exploration, Archive and QA
 * Notes shared a gate id drawn as a divider under a "Designers" eyebrow — and,
 * until 2026-09-18, a password modal. One site behind one Netlify password
 * needs no second door: Design (empty, unused) is retired, Explorations moved
 * up to sit directly under PRDs, and Archive and QA Notes sit under Dev
 * Handoff. These pin each half.
 */
describe('the Designers group is gone (2026-10-15)', () => {
  it('opens Explorations on click — no password, no lock glyph', async () => {
    const user = userEvent.setup()
    renderDashboard()
    expect(screen.queryByText(/— locked/)).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Explorations/ }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Explorations')
    expect(screen.getByText('XCEL LMS — Learner Walk-through')).toBeInTheDocument()
    // Every document, and nothing else lists here.
    expect(document.querySelectorAll('[data-row]').length).toBe(
      PROTOTYPE_FEATURES.filter((f) => f.category === 'exploration').length,
    )
  })

  it('Explorations sits directly under PRDs in the nav', () => {
    renderDashboard()
    const labels = within(screen.getByRole('navigation'))
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
    const prds = labels.findIndex((l) => l.includes('PRDs'))
    expect(prds).toBeGreaterThan(-1)
    expect(labels[prds + 1]).toContain('Explorations')
  })

  it('a ?section=exploration deep link lands on it directly', () => {
    renderDashboard('/?section=exploration')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Explorations')
  })

  it('draws no Designers eyebrow, and Design has no nav row', () => {
    renderDashboard()
    expect(screen.queryByText(/^Designers$/i)).toBeNull()
    const nav = screen.getByRole('navigation')
    expect(within(nav).queryByRole('button', { name: /^Design\b/ })).toBeNull()
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
  /*
   * THREE ROW SHAPES, not two — corrected 2026-09-24 when the first `guided`
   * feature landed.
   *
   *   • a DOCUMENT row   → `externalUrl`, a file under /prototypes/
   *   • a ROUTE row      → `to`, an in-app path
   *   • a GATEWAY row    → NEITHER, because a guided feature's row falls
   *                        through to its own `/prototype/<id>` page
   *
   * ⚠ THE THIRD ONE MUST CARRY NEITHER FIELD. The home row's href is
   * `externalUrl ?? to ?? '/prototype/<id>'`, so either field set on a guided
   * feature HIJACKS the row and sends it somewhere that is not the handoff.
   * That is not a style rule — it shipped broken for one commit exactly that
   * way, and `a guided row opens its own gateway` below is what now catches it.
   */
  const gatewayRows = PROTOTYPE_FEATURES.filter((f) => f.kind === 'guided')
  // A coming-soon PLACEHOLDER (no `to`, no `externalUrl`) is neither — see the
  // Prototypes block below, which pins its shape.
  const documentRows = PROTOTYPE_FEATURES.filter(
    (f) => !f.to && f.kind !== 'guided' && !(f.status === 'coming-soon' && !f.externalUrl),
  )
  const routeRows = PROTOTYPE_FEATURES.filter((f) => f.to)

  it('every non-guided row is either a document or a route, never both and never neither', () => {
    for (const f of PROTOTYPE_FEATURES) {
      if (f.kind === 'guided') continue // → its own gateway; asserted below
      // A coming-soon PLACEHOLDER has neither, on purpose: it is drawn disabled
      // (2026-10-14, the Admin row). The Prototypes block below pins its shape.
      if (f.status === 'coming-soon' && !f.to && !f.externalUrl) continue
      expect(
        Boolean(f.to) !== Boolean(f.externalUrl),
        `${f.id} needs exactly one of to / externalUrl`,
      ).toBe(true)
    }
    // Documents and routes exist, so neither filter above is vacuously empty.
    // ⚠ No GATEWAY row exists since 2026-10-15 — both handoffs were archived
    // ("not ready") — so `gatewayRows` IS empty and the guided-row guard below
    // is vacuous until the next `/dev-handoff-notes` row lands. It stays in
    // place for that day rather than being deleted with the rows.
    expect(documentRows.length).toBeGreaterThan(0)
    expect(routeRows.length).toBeGreaterThan(0)
  })

  it('a guided row opens its own gateway, not somewhere else', () => {
    /* ⚠ THE REGRESSION THIS EXISTS FOR. `xcel-course-entry` shipped with a `to`
       pointing at the dashboard — added only to satisfy the rule above, which
       predated guided features — and the Development row then opened the
       product instead of the handoff notes. The href resolution is
       `externalUrl ?? to ?? '/prototype/<id>'`, so the ONLY way a guided row
       reaches its gateway is by carrying neither field. */
    for (const f of gatewayRows) {
      expect(f.to, `${f.id} is guided, so a \`to\` would hijack its row`).toBeUndefined()
      expect(
        f.externalUrl,
        `${f.id} is guided, so an \`externalUrl\` would hijack its row`,
      ).toBeUndefined()
      // …and it must have something for the gateway to actually show.
      expect(f.devHandoff, `${f.id} is guided but has no devHandoff to render`).toBeTruthy()
    }
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
    //
    // 2026-10-16: the end-to-end row moved to the OTHER product door when it
    // was released — it opens at the invite flow's first page, not the
    // dashboard, because the row's claim is the whole journey. What this
    // case is actually guarding is `?demo=1`, so it asserts the param on
    // whichever door the row carries rather than re-pinning the pathname.
    //
    // 2026-10-19: and it moved again, one page EARLIER — the invitation email
    // ("clicking on end to end should start with the email first"). Same
    // door, same two params; the pathname is checked by the door case below,
    // which is why this one asserts the params rather than the address.
    const row = PROTOTYPE_FEATURES.find((f) => f.id === 'xcel-dashboard')!
    const e2e = new URL(row.to!, 'https://same.origin')
    expect(e2e.pathname).toBe('/end-to-end-demo/email')
    expect(e2e.searchParams.get('demo')).toBe('1')
    expect(e2e.searchParams.get('journey')).toBe('full')
  })

  it('holds the route rows and nothing else', () => {
    // The document-shape guards are scoped to rows WITHOUT `to`; a document row
    // that accidentally grows one would slip past every one of them.
    //
    // ⚠ BACK TO ONE. `xcel-course-entry` was briefly added here when it shipped
    // with a `to` — which was the bug: a guided row must carry neither field or
    // it never reaches its gateway. See `a guided row opens its own gateway`.
    // The assertion stays the whole SET in both directions, which is what
    // catches an accidental conversion; loosening it to a count would give up
    // the guard entirely.
    //
    // ⚠ TWO SINCE 2026-10-14, both Prototypes rows. The guided-row trap above
    // is unchanged; a `to` is still only ever a Prototypes row's.
    expect(PROTOTYPE_FEATURES.filter((f) => f.to).map((f) => f.id).sort()).toEqual([
      'xcel-atlas-learning',
      'xcel-compass',
      'xcel-dashboard',
      'xcel-invite',
    ])
  })
})

/* ── Prototypes — one row per scope, every row the same build ────────────────
 *
 * 2026-10-14. Prototypes held ONE row from 2026-09-28, because two rows
 * pointing at two builds of the same thing make everyone ask which one is
 * real. The section now holds one row PER SCOPE (`PROTOTYPE_SCOPES`), and this
 * block is the stricter mechanical form of what the one-row rule guaranteed:
 * every row is `main`'s build at the committed baseline, so there is nothing
 * to ask "which one is real?" about. The thing to notice is what is NOT
 * allowed — a branch URL, an `?ff=` pin, a pinned `version=`, a document the
 * public build cannot serve — because each of those is a row that would stop
 * tracking the product, or stop opening, the moment `main` moved under it.
 *
 * Two shapes since 2026-10-14: a row that OPENS enters the product app through
 * one of its doors; a PLACEHOLDER (`coming-soon`, nothing to open) is drawn
 * disabled and says the door exists before the room does. A document row is
 * not admitted: the public build 404s `/prototypes/*`. */
describe('Prototypes — one row per scope, every row the same build', () => {
  const prototypeRows = PROTOTYPE_FEATURES.filter((f) => f.category === 'prototype')

  it('every Prototypes row carries a scope, and no scope has two rows', () => {
    const seen = new Map<string, string>()
    for (const f of prototypeRows) {
      expect(f.prototypeScope, `${f.id} is a Prototypes row and needs a prototypeScope`).toBeTruthy()
      expect(
        PROTOTYPE_SCOPES.some((s) => s.id === f.prototypeScope),
        `${f.id} names a scope that is not in PROTOTYPE_SCOPES`,
      ).toBe(true)
      const prior = seen.get(f.prototypeScope!)
      expect(
        prior,
        `${f.id} and ${prior} are both ${f.prototypeScope} — a second row for a scope is a Refinement job`,
      ).toBeUndefined()
      seen.set(f.prototypeScope!, f.id)
    }
  })

  it('every scope names who decides what the surface should be', () => {
    // 2026-10-14: design authority per scope — Anjani owns Compass and runs
    // the promotion for it on her branch; the merge stays Jillienne's. See the
    // note on PROTOTYPE_SCOPES. The skill reads this to know whose group is
    // whose.
    for (const s of PROTOTYPE_SCOPES) expect(s.owner, `${s.id} needs an owner`).toBeTruthy()
    expect(PROTOTYPE_SCOPES.find((s) => s.id === 'compass')?.owner).toBe('Anjani')
  })

  it('no row outside Prototypes carries a scope', () => {
    // The field means "which door of the product is this the source of truth
    // for". On an Exploration or handoff row it would be a claim the section
    // does not make.
    for (const f of PROTOTYPE_FEATURES) {
      if (f.category === 'prototype') continue
      expect(f.prototypeScope, `${f.id} is not a Prototypes row and must not carry a scope`).toBeUndefined()
    }
  })

  /** The product app's doors — the pathnames a row may enter at.
   *
   *  ⚠ A DOOR, NOT AN EXACT PATHNAME (2026-10-19). The end-to-end row opens
   *  at `/end-to-end-demo/email`, a page UNDER the invite door rather than a
   *  third entrance — the guarantee this case exists for is "same origin,
   *  main's build, no pins", and which page of a flow a row starts on is the
   *  owner's call. An unrelated route still fails: `/my-learning` matches no
   *  door, and `/end-to-end-demos` is not under one either. */
  const PRODUCT_DOORS = ['/dashboard-rebrand', '/end-to-end-demo']
  const entersThroughADoor = (pathname: string) =>
    PRODUCT_DOORS.some((d) => pathname === d || pathname.startsWith(`${d}/`))
  const isPlaceholder = (f: (typeof prototypeRows)[number]) => f.status === 'coming-soon'

  it('every Prototypes row with a route enters the product on main at the committed baseline', () => {
    // Held-back rows keep their route on record, so it is checked too: when
    // the word flips back to `ready`, the door it opens must already be right.
    for (const f of prototypeRows.filter((f) => !isPlaceholder(f) || f.to)) {
      expect(f.externalUrl, `${f.id}: a Prototypes row is a route, never a document`).toBeUndefined()
      expect(f.to, `${f.id} needs a \`to\``).toBeTruthy()
      const url = new URL(f.to!, 'https://same.origin')
      expect(url.origin, `${f.id} must be same-origin — a branch URL is a second build`).toBe('https://same.origin')
      expect(
        entersThroughADoor(url.pathname),
        `${f.id} must enter the product app through one of its doors (got ${url.pathname})`,
      ).toBe(true)
      expect(url.searchParams.get('demo'), `${f.id} must open the committed baseline`).toBe('1')
      expect(url.searchParams.has('ff'), `${f.id} must not pin flags — it would stop tracking main`).toBe(false)
      expect(url.searchParams.has('version'), `${f.id} must not pin a version — the baseline chooses it`).toBe(false)
    }
  })

  it('a Prototypes row\u2019s kebab offers Copy link and nothing else', async () => {
    // 2026-10-14, Jillienne on the preview. Mark in design, Mark done and the
    // roll-up statuses are dev-cycle actions; a row that IS the product has
    // no dev cycle to set. The Design/Development rows keep the full menu.
    const user = userEvent.setup()
    renderDashboard()
    await user.click(screen.getByRole('button', { name: 'Actions for Compass Learning — Work in Progress' }))
    const menu = await screen.findByRole('menu')
    expect(within(menu).getAllByRole('menuitem').map((m) => m.textContent)).toEqual(['Copy link'])
    await user.keyboard('{Escape}')
    // …and the kebab is drawn in the gateway's tertiary ink, not the amber accent.
    const kebab = screen.getByRole('button', { name: 'Actions for Compass Learning — Work in Progress' })
    expect(kebab.style.color).toBe('var(--ux-text-3)')
  })

  it('Prototypes is two cards: the source of truth alone, then the work in progress', () => {
    // 2026-10-14, Jillienne on the preview: "this is the same as the main
    // branch, so can we have it separated from the rest to better indicate
    // that it's the Final Prototype, Source of Truth".
    renderDashboard()
    const groups = [...document.querySelectorAll('main [data-group]')]
    expect(groups.map((g) => g.getAttribute('data-group'))).toEqual(['source-of-truth', 'in-progress'])
    expect(groups[0].textContent).toContain('Final prototype — source of truth')
    expect([...groups[0].querySelectorAll('[data-row]')].map((r) => r.getAttribute('data-row'))).toEqual(['xcel-dashboard'])
    expect(groups[1].textContent).toContain('Work in progress')
    expect([...groups[1].querySelectorAll('[data-row]')].map((r) => r.getAttribute('data-row'))).toEqual([
      'xcel-invite',
      'xcel-atlas-learning',
      'xcel-compass',
      'xcel-admin-coming-soon',
    ])
  })

  it('every Prototypes row that opens carries a valid lastUpdated stamp', () => {
    // 2026-10-14. The "Updated" tag reads it; `ship-to-main` maintains it. An
    // ISO timestamp with a zone, so the viewer's clock can render it.
    for (const f of prototypeRows.filter((f) => !isPlaceholder(f))) {
      expect(f.lastUpdated, `${f.id} needs a lastUpdated`).toBeTruthy()
      expect(Number.isNaN(Date.parse(f.lastUpdated!)), `${f.id}: lastUpdated must parse`).toBe(false)
      expect(f.lastUpdated, `${f.id}: lastUpdated must carry a zone (Z or offset)`).toMatch(/(Z|[+-]\d{2}:\d{2})$/)
    }
    for (const f of prototypeRows.filter((f) => isPlaceholder(f) && !f.to)) {
      expect(f.lastUpdated, `${f.id}: nothing built, nothing to have updated`).toBeUndefined()
    }
  })

  it('a Prototypes row wears its scope, its owner and its Updated time as tags', () => {
    renderDashboard()
    const compass = document.querySelector('[data-row="xcel-compass"]')!
    // The outlined tags are the spans that carry a border; the owner tag's
    // textContent is its hidden "Owner: " label plus the name.
    // Outlined tags are the 4px-radius bordered spans; the generated thumbnail
    // is bordered too, at the radius token, so the radius is the tell.
    const tagsOf = (row: Element) =>
      [...row.querySelectorAll('span')]
        .filter((s) => s.style.border && s.style.borderRadius === '4px')
        .map((s) => s.textContent ?? '')
    const tags = tagsOf(compass)
    // Owner, Updated, then the scope last (2026-10-15: "move these top ones
    // to the bottom").
    expect(tags[0]).toBe('Owner: Anjani')
    expect(tags[1]).toMatch(/^Updated \w{3} \d{1,2}, \d{1,2}:\d{2}/)
    expect(tags[2]).toBe('Compass')
    // The product row stacks the same three, its scope reading "End-to-End".
    // 2026-10-16: and NOTHING under them — it carried a fourth, "Coming soon",
    // while it was held back, and releasing it is what takes that tag off. The
    // absence is asserted, not just dropped: a row that silently went back to
    // Coming soon would otherwise pass this case.
    const e2e = document.querySelector('[data-row="xcel-dashboard"]')!
    const e2eTags = tagsOf(e2e)
    expect(e2eTags[0]).toBe('Owner: Jillienne')
    expect(e2eTags[1]).toMatch(/^Updated /)
    expect(e2eTags[2]).toBe('End-to-End')
    expect(e2eTags).toHaveLength(3)
    expect(e2e.textContent).not.toContain('Coming soon')
    // The placeholder names its owner and says Coming soon, with no Updated.
    const ph = document.querySelector('[data-placeholder="xcel-admin-coming-soon"]')!
    expect(ph.textContent).toContain('Owner: Cody')
    expect(ph.textContent).toContain('Coming soon')
    expect(ph.textContent).not.toContain('Updated ')
  })

  it('the placeholders are written out, and a row never becomes one by accident', () => {
    // 2026-10-14. Written out so a new placeholder is a deliberate edit here.
    //
    // 2026-10-16: the end-to-end row was RELEASED (Jillienne, "I want to turn
    // on the end-to-end flow and work through it"), so only the Admin row is
    // left — the one kind of placeholder with nothing built behind it. The
    // held-back kind now has no instance, which is why the rule it stood for
    // is restated below rather than deleted with it.
    expect(prototypeRows.filter(isPlaceholder).map((f) => f.id)).toEqual(['xcel-admin-coming-soon'])
    for (const f of prototypeRows.filter(isPlaceholder)) {
      expect(f.kind, `${f.id}: a guided placeholder would try to open a gateway`).toBe('explore')
    }
    // The released row opens, and opens at a product door — the thing being
    // held back was ever only its `status`.
    const e2e = PROTOTYPE_FEATURES.find((f) => f.id === 'xcel-dashboard')!
    expect(e2e.status, 'released 2026-10-16').toBe('ready')
    expect(PRODUCT_DOORS.some((d) => e2e.to!.startsWith(d))).toBe(true)
    // A row with no `to` and no `externalUrl` that is NOT coming-soon would be
    // a dead link; the shape test above refuses it, this names the rule.
    for (const f of prototypeRows.filter((f) => !f.to && !f.externalUrl)) {
      expect(f.status, `${f.id} opens nothing, so it must say Coming soon`).toBe('coming-soon')
    }
  })

  it('the rows read in the order PROTOTYPE_SCOPES declares — the product first', () => {
    expect(PROTOTYPE_SCOPES[0].id, 'the end-to-end row is always first').toBe('end-to-end')
    const order = PROTOTYPE_SCOPES.map((s) => s.id)
    const got = prototypeRows.map((f) => order.indexOf(f.prototypeScope!))
    expect(got, 'reorder the rows in prototypeFeatures.ts to match PROTOTYPE_SCOPES').toEqual([...got].sort((a, b) => a - b))
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
