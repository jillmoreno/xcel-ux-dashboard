import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UxDashboardPage } from '@/pages/UxDashboardPage'
import { AccountProvider } from '@/context/AccountContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PROTOTYPE_FEATURES, componentPreviewUrl } from '@/data/prototypeFeatures'
import { ARCHIVED_ITEMS } from '@/data/archivedItems'
import { HANDOFF_IDS } from '@/data/handoffFeatures'

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
 * Do Board and Hub Resources off the rail — and, the same day, their code out
 * of the repo (one `archivedItems.ts` row each; the whole advanced Hub is on
 * the `hub-advanced` branch). The tests that rendered them went with them.
 * What stays here is the six-section rail and the pure data checks over
 * `PROTOTYPE_FEATURES`, which holds the dev handoffs alone now.
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

  /* "every Hub Resources row points at a document this repo actually ships"
     stood here until 2026-11-21 — `HUB_DOCS` went with its section
     (`hub-resources-section`). The guides under `public/` are still served;
     `OneSite.test.tsx` checks they exist. */

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
    /* THE FIVE PROTOTYPES ROWS AND THE FOURTEEN EXPLORATIONS ROWS WERE LISTED
       HERE until 2026-11-21 (`'prototypes'` and `'exploration'`). Both
       sections and their rows went with the advanced Hub — see
       `prototypes-section` and `explorations-section` in `archivedItems.ts`;
       the list is verbatim on `hub-advanced`. What is left is the four
       hand-authored Atlas Home handoffs of 2026-10-19. */
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

  /* "no Explorations row carries a devStatus" stood here — the inverse of
     the rule below, for a section that is gone (2026-11-21). */

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
    /* ⚠ SINCE 2026-11-21 BOTH `documentRows` AND `routeRows` ARE EMPTY: the
       document rows were Explorations and the route rows were Prototypes,
       and both sections went with the advanced Hub. Every hand-authored row
       left is a guided handoff, so the guided-row guard below is the live
       one and the document / route checks are vacuous until a row of either
       shape comes back (the two archive rows say how). They stay in place
       for that day rather than being deleted with the rows. */
    expect(gatewayRows.length).toBeGreaterThan(0)
    expect(documentRows).toEqual([])
    expect(routeRows).toEqual([])
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
    // Vacuous while there are no document rows (see above) — `bases` is
    // empty rather than `['/prototypes']` — and live again the day one comes
    // back.
    const bases = new Set(documentRows.map((f) => f.externalUrl!.replace(/\/[^/]+$/, '')))
    expect(bases.size).toBeLessThanOrEqual(1)
    for (const base of bases) expect(base).toBe('/prototypes')
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

/* "the Prototypes row opens the committed configuration" and "Prototypes —
   one row per scope, every row the same build" stood here — the `?demo=1`
   check, the route-row set, the one-row-per-scope rule, the scope owners, the
   product doors, the `lastUpdated` stamps, the placeholders, the row order and
   the `stageBuild.ts` origin. The section, `PROTOTYPE_SCOPES` and
   `stageBuild.ts` all went with the advanced Hub on 2026-11-21
   (`prototypes-section` in `archivedItems.ts`); the cases are verbatim on
   `hub-advanced`. */

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
