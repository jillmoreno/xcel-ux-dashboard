import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
import { HANDOFF_IDS } from '@/data/handoffFeatures'
import { HUB_HOST, STAGE_BRANCH, STAGE_ORIGIN, prototypeHref } from '@/data/stageBuild'

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
 *
 * 2026-11-21: the simple Hub took Prototypes (and its Main · Stage switch),
 * the derived Design list, Release, Resources, Explorations, QA Notes, the To
 * Do Board and Hub Resources off the rail, and the tests that rendered them
 * went with them — they live on the `hub-advanced` branch. What stays here is
 * the six-section rail and the pure data checks over `PROTOTYPE_FEATURES`.
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
 *  Six sections since the simple Hub (2026-11-21, `SIMPLE_SECTIONS`): the
 *  three boards under one "Design & Research" eyebrow, then the handoffs and
 *  the Archive under "Dev Handoff". Design is the board that was Refinement —
 *  same id, store and endpoint. The thirteen of 2026-11-16 are on
 *  `hub-advanced`. */
const EXPECTED_SECTIONS = [
  'Design',
  'Research',
  'PRDs',
  'Development',
  'Done',
  'Archive',
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

  it('every Hub Resources row points at a document this repo actually ships', () => {
    // The section is off the rail (2026-11-21), but `HUB_DOCS` is still code
    // in the repo and the guides are still served, so this stays.
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
    expect(screen.queryByRole('link', { name: /How to read the Hub/ })).toBeNull()
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
    // The Atlas vs. Compass typography and color audit (2026-10-27) — an
    // exploration with no document; its gateway page carries the findings.
    'xcel-design-system-audit': 'exploration',
    /* The two Compass Readiness states (2026-11-06). ⚠ ONLY TWO ROWS for a
       sixteen-state prototype: the rest live in a Design-canvas export that
       cannot be served (its runtime re-fetches its own page and mis-slices
       it), so the states are in the PRODUCT behind the Design bar instead,
       and these two self-contained exports stand for the design here. */
    'xcel-compass-readiness-58': 'exploration',
    'xcel-compass-readiness-86': 'exploration',
    'xcel-compass-mvp': 'exploration',
    /* THE THREE VERSION ROWS (2026-11-10) — one per arm of
       `compass-mvp-version`. ⚠ EXPLORATIONS, NOT PROTOTYPES: the block below
       refuses a second row for the `compass` scope and refuses `?ff=` on any
       Prototypes row, which is exactly what three pinned versions would be.
       See the rows' own note in `prototypeFeatures.ts`. */
    /* The first page audit of Refined (2026-11-12) — an exploration, not a
       handoff: its eight findings are open design decisions. */
    'xcel-compass-refined-course-audit': 'exploration',
    'xcel-compass-v-anjani': 'exploration',
    'xcel-compass-v-jeff': 'exploration',
    'xcel-compass-v-refined': 'exploration',
    // The compare page (2026-11-16) — V1 beside Refined, widget by widget.
    'xcel-compass-compare-readiness': 'exploration',
    // `xcel-course-entry` (the repo's first authored dev handoff, 2026-09-24)
    // stood here until 2026-10-15 — archived, `course-entry-handoff`. Both
    // handoffs were removed as "not ready"; Development lists nothing now.
    // The Atlas Home dev-handoff split (2026-10-19) — one row per component.
    // ⚠ THE PAGE-LEVEL OVERVIEW AND PURCHASE EXTENSION WERE ARCHIVED on
    // 2026-10-21 ("remove these"); both are kept in `archivedFeatureRows.ts`
    // and a line back in here is step two of either restore. They land
    // on DEVELOPMENT, not Design: Design was archived 2026-10-15 (`design-
    // section`) and `sectionOf` now returns 'development' for any authored
    // status. `category: 'dev-handoff'` routes there too, so both paths agree.
    'xcel-atlas-home-course-head': 'development',
    /* ⚠ FOUR ROWS BECAME ONE (2026-10-21) — "lets adjust so that everything
       below the course card is all part of this one feature ticket so we can
       see all the scenarios together". The progress column and the Study
       Journey move together: an exam date set in Step 2 re-plans the pace
       column, and the Progress control drives the dial, the readiness band and
       the journey's current stop at once. `xcel-atlas-home-readiness-panel`,
       `xcel-atlas-home-exam-date-card`, `xcel-atlas-home-study-journey` and
       `xcel-atlas-home-progress-panel` are all gone into this id. */
    'xcel-atlas-home-below-course-card': 'development',
    'xcel-atlas-home-quick-links': 'development',
    'xcel-atlas-home-affidavit-modal': 'development',
  }

  it('accounts for every authored feature', () => {
    // The HAND-authored ones. A handoff in `src/data/handoffs/` is a designer's
    // own file (2026-10-26) and lands on Development by construction —
    // `HandoffFolder.test.ts` pins that — so it is not listed here, or a
    // designer would have to edit this test to add a row.
    const ids = PROTOTYPE_FEATURES.map((f) => f.id)
      .filter((id) => !HANDOFF_IDS.has(id))
      .sort()
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

  it('a bare `/` lands on Design, and no feature row is on the front door', () => {
    /*
     * Was "Prototypes holds exactly the rows meant to be ungated" — the
     * two-directional set check over the rendered Prototypes rows. That
     * section is off the rail since 2026-11-21 (the test is on
     * `hub-advanced`), and the front door is now the Design BOARD, which lists
     * links authored on the page rather than `PROTOTYPE_FEATURES` rows. So
     * what is pinned is the landing section (`DEFAULT_SECTION`) and that no
     * feature row — with its "Actions for <title>" kebab — is drawn on it.
     */
    renderDashboard()
    expect(screen.getByRole('heading', { level: 1, name: 'Design' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Actions for / })).toBeNull()
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
 *
 * 2026-11-21: Explorations and QA Notes are off the simple Hub's rail too, so
 * the cases that opened them are on `hub-advanced`; what is left pins that a
 * deep link to a hidden section lands on Design rather than on a lock.
 */
describe('the Designers group is gone (2026-10-15)', () => {
  it('a ?section=exploration deep link lands on Design — the section is off the rail, not locked', () => {
    // `sectionFromParam` refuses a hidden section (2026-11-21), so a link
    // shared before the simple Hub lands on the first section with no modal.
    renderDashboard('/?section=exploration')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Design')
  })

  it('draws no Designers eyebrow; Design is the first nav row, and Research sits directly under it', () => {
    // The 2026-10-15 Design — feature rows by status, behind the Designers
    // group — stays gone, and so is the derived branch list of 2026-11-16
    // (`hub-advanced`). The Design that heads the rail since 2026-11-21 is
    // the board that was Refinement.
    renderDashboard()
    expect(screen.queryByText(/^Designers$/i)).toBeNull()
    const nav = screen.getByRole('navigation')
    const labels = within(nav)
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
    // The same normalisation `OneSite.test.tsx` uses: the count is appended
    // to the label's text.
    const name = (l: string) => l.replace(/\d+$/, '').trim()
    const design = labels.findIndex((l) => name(l) === 'Design')
    const research = labels.findIndex((l) => name(l) === 'Research')
    expect(design).toBe(0)
    expect(research).toBe(design + 1)
  })

  it('a ?section=design deep link lands on the Design board, not the derived list', () => {
    // `design` was the derived branch list's id; it is hidden now, so the
    // value resolves to nothing and the page falls back to the board.
    renderDashboard('/?section=design')
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Design')
    expect(screen.queryByText(/only on the deployed Hub/)).toBeNull()
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
    //
    // 2026-10-20: and BACK to the dashboard — "lets set the Atlas to be the
    // default view the user comes in on", taken with the Start control
    // collapsing the flow's four screens into one entry, so the invite is a
    // pick away rather than the front door. The pathname has now moved three
    // times in five days and the params have not moved once, which is the
    // case for this assertion being about `?demo=1` and `?journey=full`
    // rather than the address — `journey=full` is what keeps this the FULL
    // walk when the Start control jumps into it.
    const row = PROTOTYPE_FEATURES.find((f) => f.id === 'xcel-dashboard')!
    const e2e = new URL(row.to!, 'https://same.origin')
    expect(e2e.pathname).toBe('/dashboard-rebrand')
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
    // is unchanged.
    //
    // ⚠ AND THREE EXPLORATION ROWS SINCE 2026-11-10 — the Compass version
    // rows. A `to` was only ever a Prototypes row's until then, and the line
    // that said so is retired rather than quietly dropped: the three versions
    // live in the PRODUCT behind one flag, so a row per version is a route
    // with an `?ff=` pin or it is a second copy of the surface to keep in
    // step. They are `explore` rows, so the guided-row trap above does not
    // reach them. What this assertion still catches is the thing it was
    // written for: any OTHER row growing a `to` by accident.
    //
    // ⚠ AND THE COMPARE ROW SINCE 2026-11-16 — `/compare/compass-readiness`,
    // a route of this build that draws two versions' widgets side by side.
    // An exploration for the same reason as the three above it.
    expect(PROTOTYPE_FEATURES.filter((f) => f.to).map((f) => f.id).sort()).toEqual([
      'xcel-atlas-learning',
      'xcel-compass',
      'xcel-compass-compare-readiness',
      'xcel-compass-v-anjani',
      'xcel-compass-v-jeff',
      'xcel-compass-v-refined',
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

  /* ── Main · Stage (2026-11-01) ─────────────────────────────────────────────
   *
   * Jillienne: "I want the prototype page to have both Main and Stage options
   * there, not a new page in the rail." The switch, the `?build=stage`
   * address, the deactivated-link hrefs (2026-11-17) and the Staged tag
   * (2026-11-04) are all rendered by the Prototypes section, which is off the
   * simple Hub's rail since 2026-11-21 — their cases are on `hub-advanced`.
   * What stays is the one that reads `stageBuild.ts` rather than the page. */
  it('the stage origin is the Netlify branch-deploy address of the `stage` branch on the Hub’s own site', () => {
    // `HUB_URL` in PrototypeBar.tsx and `HUB_HOST` here are the same host:
    // the stage address is derived from it, so a site rename moves both.
    const bar = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), '../components/layout/PrototypeBar.tsx'), 'utf8')
    expect(bar).toContain(`const HUB_URL = 'https://${HUB_HOST}/'`)
    expect(STAGE_BRANCH).toBe('stage')
    expect(STAGE_ORIGIN).toBe(`https://stage--${HUB_HOST}`)
    // Same path, different origin — nothing about the route may change.
    expect(prototypeHref('/dashboard-rebrand?demo=1', 'main')).toBe('/dashboard-rebrand?demo=1')
    expect(prototypeHref('/dashboard-rebrand?demo=1', 'stage')).toBe(`${STAGE_ORIGIN}/dashboard-rebrand?demo=1`)
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
    // The render: one `section(` call each. Two shapes now — a bare
    // `{section(` for the sections that always render, and `&& section(` for
    // Options and Flows, which are dropped when unauthored. The `{` is no
    // longer part of the match, or the conditional two go uncounted and this
    // reports a mismatch that isn't one.
    const rendered = [...src.matchAll(/(?:^|[{&]\s*)section\(\n\s+'([a-z-]+)',/gm)].map((m) => m[1])
    expect(declared.length).toBeGreaterThan(0)
    // A mismatch silently highlights the wrong scroll-spy chip and nothing else
    // fails, which is why this is asserted rather than trusted.
    expect(rendered).toEqual(declared)
  })

  it('leads with the States, and seeds the active chip from it', () => {
    /* ⚠ WAS THE QUICK SUMMARY until 2026-10-21 (Jillienne: "lets REMOVE the
       summary section. It's just repeating itself. Lets start with the States
       section."). The feature header's blurb says the same thing one scroll
       higher, so the detail opens on the first thing that is not a restatement:
       what the component actually looks like. */
    /* Any number of comment lines may precede the first entry — line comments,
       block comments, and the continuation lines inside them, which is why this
       skips everything that is not an entry rather than trying to describe what
       a comment looks like. */
    expect(src).toMatch(/const COMPONENT_SECTIONS = \[\n(?:(?!\s*\{ id:).*\n)*\s*\{ id: 'variants'/)
    expect(src).toContain("useState<ComponentSectionId>('variants')")
  })
})

/* ── The demo build link — 2026-11-21 ──────────────────────────────────────
 * Prototypes is off the rail in the simple Hub, so the product on `main` is
 * reached from one quiet link at the foot of the rail. Jillienne: a main link
 * "for demo purposes eventually, but I don't want it to be the main thing
 * when users come to the UX hub." One link, new tab, the end-to-end door. */
describe('the Demo build link', () => {
  it('sits at the foot of the rail, once, and opens the product on main in a new tab', () => {
    renderDashboard()
    const links = screen.getAllByRole('link', { name: /Demo build/ })
    expect(links).toHaveLength(1)
    const link = links[0]
    expect(link.getAttribute('href')).toBe('/dashboard-rebrand?demo=1&journey=full')
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    // Inside the rail, not the content pane — the aside holds the nav.
    expect(screen.getByRole('navigation').parentElement).toContainElement(link)
  })

  it('is not a nav section — the rail still reads the six pages', () => {
    renderDashboard()
    const nav = screen.getByRole('navigation')
    expect(within(nav).queryByText('Demo build')).toBeNull()
  })
})
