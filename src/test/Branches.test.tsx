import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DemoPanel } from '@/components/prototype/LinksPanel'
import { DesignPanel } from '@/components/prototype/DesignPanel'
import { ReleasePanel } from '@/components/prototype/ReleasePanel'
import { groupByFeature, listsOnDesign, SCOPES_ELSEWHERE, stageOf, UNNAMED_KEY } from '@/data/designBranches'
import { groupForRelease, waitingCount } from '@/data/releaseQueue'
import { isBranchOnBoard, titleFromBranch, type BranchDeploy } from '@/data/branchStore'
import { parseBranch, reviewHref, reviewPathFor, DEFAULT_REVIEW_PATH } from '@/data/branchName'
import { PROTOTYPE_FEATURES, PROTOTYPE_SCOPES } from '@/data/prototypeFeatures'
import { selectBranchDeploys, slugifyBranch, REVIEW_PATH } from '../../netlify/lib/branchDeploys'
import { decidedOn, isMergedInto, parseCompare, parseMarker } from '../../netlify/lib/branchGit'
import type { StoredLink } from '@/data/linkStore'

/**
 * The automatic branch list (2026-09-21) — the DESIGN SECTION since
 * 2026-11-16.
 *
 * What is pinned here is that the section is DERIVED and writes nothing: a
 * branch is a row because Netlify built it, its feature and scope come from
 * its name, and "on stage" / "released" come from git. Nobody authors a row,
 * so nothing here can be stale or missing by someone forgetting a step —
 * which is what the prefilled-link flow it replaced kept doing.
 *
 * The rest is the two things that would silently go wrong: which deploys
 * count (a preview or `main` in the list misleads; a building one must say
 * so rather than hand over a link), and that branch names never reach the
 * testing build.
 */

const here = dirname(fileURLToPath(import.meta.url))

const deploy = (over: Record<string, unknown> = {}) => ({
  context: 'branch-deploy',
  state: 'ready',
  branch: 'feat/streak',
  title: 'Add the streak card',
  committer: 'Sam',
  published_at: '2026-09-20T10:00:00.000Z',
  links: { branch: 'https://feat-streak--ux-demo-xceldashboard.netlify.app' },
  ...over,
})

const row = (over: Partial<StoredLink> = {}): StoredLink => ({
  id: 'demo-001',
  title: 'Something already up',
  url: 'https://feat-old--ux-demo-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
  note: 'Look here.',
  addedBy: 'Sam',
  type: '',
  // Required on main's StoredLink since the product control (merged 2026-10-02).
  product: 'both',
  addedDate: '2026-09-18',
  updatedAt: '',
  archivedAt: '',
  archivedBy: '',
  feature: '',
  supersedes: '',
  ...over,
})

/** Both endpoints from one stub: the board on `/api/demos`, the strip on
 *  `/api/branches`. They are separate fetches and the panel renders both. */
function mockEndpoints({
  rows = [] as StoredLink[],
  branches = null as unknown,
  branchStatus = 200,
} = {}) {
  const writes: { method: string; url: string; body: unknown }[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: unknown, init?: RequestInit) => {
      const url = String(input)
      const method = init?.method ?? 'GET'
      const json = (body: unknown, status = 200) =>
        new Response(JSON.stringify(body), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      if (url.includes('/api/branches')) {
        return json(branches ?? { configured: false, branches: [], reason: 'no-credentials' }, branchStatus)
      }
      if (method !== 'GET') {
        writes.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null })
        return json({ link: row() }, 201)
      }
      return json({ links: rows })
    }),
  )
  return { writes }
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.resetModules()
})

/* ── which deploys count ──────────────────────────────────────────────────── */

describe('selectBranchDeploys', () => {
  const opts = { siteHost: 'ux-demo-xceldashboard.netlify.app' }

  it('keeps a ready branch deploy', () => {
    const out = selectBranchDeploys([deploy()], opts)
    expect(out).toHaveLength(1)
    expect(out[0].branch).toBe('feat/streak')
    expect(out[0].url).toBe('https://feat-streak--ux-demo-xceldashboard.netlify.app')
  })

  /* Since 2026-11-16 a branch lists from the moment it is PUSHED, so the
     designer sees "Building…" rather than nothing — but the row has to SAY
     so, because the alias quietly keeps serving the previous build. */
  it('keeps a deploy that is not ready, and says which kind', () => {
    expect(selectBranchDeploys([deploy({ state: 'building' })], opts)[0].build).toBe('building')
    expect(selectBranchDeploys([deploy({ state: 'enqueued' })], opts)[0].build).toBe('building')
    expect(selectBranchDeploys([deploy({ state: 'error' })], opts)[0].build).toBe('failed')
    expect(selectBranchDeploys([deploy()], opts)[0].build).toBe('ready')
  })

  it('drops the stage branch — it is the other build of the product, not a designer\'s', () => {
    expect(selectBranchDeploys([deploy({ branch: 'stage' })], opts)).toHaveLength(0)
    expect(selectBranchDeploys([deploy({ branch: 'rc' })], { ...opts, stageBranch: 'rc' })).toHaveLength(0)
  })

  it('carries the commit the deploy was built from', () => {
    expect(selectBranchDeploys([deploy({ commit_ref: 'abc123' })], opts)[0].sha).toBe('abc123')
  })

  /* A deploy preview is a pull request's own build at a `deploy-preview-N--`
     address that dies when the PR closes. The branch alias survives and always
     points at the newest build, and it is the link this board is about. */
  it('drops deploy previews and production', () => {
    expect(selectBranchDeploys([deploy({ context: 'deploy-preview' })], opts)).toHaveLength(0)
    expect(selectBranchDeploys([deploy({ context: 'production' })], opts)).toHaveLength(0)
  })

  /* `main` IS Prototypes — it is not work in review. Dropped by NAME as well
     as by context, because a site can be configured to build it as a branch
     deploy too. */
  it('drops the production branch even when it arrives as a branch deploy', () => {
    const out = selectBranchDeploys([deploy({ branch: 'main' })], opts)
    expect(out).toHaveLength(0)
  })

  /* The feed is a history. Without this, a branch pushed five times is five
     rows and one person's work fills the strip. */
  it('keeps one row per branch, the newest build', () => {
    const out = selectBranchDeploys(
      [
        deploy({ published_at: '2026-09-18T10:00:00.000Z', title: 'older' }),
        deploy({ published_at: '2026-09-20T10:00:00.000Z', title: 'newer' }),
      ],
      opts,
    )
    expect(out).toHaveLength(1)
    expect(out[0].commit).toBe('newer')
  })

  it('sorts newest first', () => {
    const out = selectBranchDeploys(
      [
        deploy({ branch: 'feat/a', published_at: '2026-09-18T10:00:00.000Z', links: null }),
        deploy({ branch: 'feat/b', published_at: '2026-09-20T10:00:00.000Z', links: null }),
      ],
      opts,
    )
    expect(out.map((b) => b.branch)).toEqual(['feat/b', 'feat/a'])
  })

  /* Netlify's own answer is preferred; the slug rule is the safety net for a
     deploy that does not carry one, because a row with no address is worse
     than no row. */
  it('derives the address when Netlify does not supply one', () => {
    const out = selectBranchDeploys([deploy({ links: null, branch: 'Feat/Odd_Name' })], opts)
    expect(out[0].url).toBe('https://feat-odd-name--ux-demo-xceldashboard.netlify.app')
  })

  /* Same trust boundary the board has: this address is rendered as an href and
     can be handed to the Add form, and `javascript:` in an href executes in
     this origin. */
  it('refuses a non-http scheme from the API and falls back to the derived form', () => {
    const out = selectBranchDeploys(
      [deploy({ links: { branch: 'javascript:alert(1)' } })],
      opts,
    )
    expect(out[0].url).toBe('https://feat-streak--ux-demo-xceldashboard.netlify.app')
  })

  it('appends the review path, matching the promote-to-refinement skill', () => {
    expect(selectBranchDeploys([deploy()], opts)[0].reviewUrl).toBe(
      'https://feat-streak--ux-demo-xceldashboard.netlify.app' + REVIEW_PATH,
    )
    expect(REVIEW_PATH).toContain('demo=1')
  })

  it('survives a garbage feed', () => {
    expect(selectBranchDeploys(null, opts)).toEqual([])
    expect(selectBranchDeploys([null, 3, 'x', {}], opts)).toEqual([])
  })

  it('slugifies the way Netlify does', () => {
    expect(slugifyBranch('feat/Drop_The Band')).toBe('feat-drop-the-band')
    expect(slugifyBranch('--odd--')).toBe('odd')
  })
})

/* ── the Design section ───────────────────────────────────────────────────── */

const served = (over: Partial<BranchDeploy> & { branch: string }): BranchDeploy => ({
  slug: slugifyBranch(over.branch),
  url: `https://${slugifyBranch(over.branch)}--ux-design-xceldashboard.netlify.app`,
  reviewUrl: `https://${slugifyBranch(over.branch)}--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1`,
  updated: '2026-11-15',
  commit: 'Add the streak card',
  author: 'Sam',
  build: 'ready' as const,
  onStage: false,
  released: false,
  decided: [],
  ...over,
})

describe('the Design section', () => {
  const ok = {
    configured: true,
    git: { configured: true, reason: '' },
    branches: [served({ branch: 'feat/atlas-streak' })],
  }

  it('lists a built branch under its feature, open in a new tab, tagged with its scope', async () => {
    mockEndpoints({ branches: ok })
    render(<DesignPanel />)
    expect(await screen.findByRole('heading', { name: 'Streak' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Streak/ })
    /* ⚠ `&section=dashboard`, and the assertion used to read without any
       section at all. This case pinned the bug: every row opened the one
       constant `/dashboard-rebrand?demo=1` whatever its scope. The row now
       opens where its surface lives — see `reviewHref`.
       (The fixture was a Compass branch until 2026-11-18, when Compass moved
       to its own Hub and stopped listing here — see `SCOPES_ELSEWHERE`.) */
    expect(link).toHaveAttribute(
      'href',
      'https://feat-atlas-streak--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1&section=dashboard',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Atlas Learning')).toBeInTheDocument()
    expect(screen.getByText('In design')).toBeInTheDocument()
    expect(screen.getByText(/feat\/atlas-streak · built 2026-11-15/)).toBeInTheDocument()
  })

  /* The whole point: nothing is written. The section reads two endpoints and
     POSTs to neither, however it is clicked. */
  it('writes nothing', async () => {
    const { writes } = mockEndpoints({ branches: ok })
    render(<DesignPanel />)
    await screen.findByRole('heading', { name: 'Streak' })
    expect(writes).toHaveLength(0)
  })

  it('says Building… with no link while Netlify is still going, and Build failed when it broke', async () => {
    mockEndpoints({
      branches: {
        ...ok,
        branches: [
          served({ branch: 'feat/atlas-streak', build: 'building' }),
          served({ branch: 'feat/atlas-home', build: 'failed' }),
        ],
      },
    })
    render(<DesignPanel />)
    expect(await screen.findByText('Building…')).toBeInTheDocument()
    expect(screen.getByText('Build failed')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Streak/ })).not.toBeInTheDocument()
  })

  it('reads On stage and Released from git, and hides released rows until asked', async () => {
    const user = userEvent.setup()
    mockEndpoints({
      branches: {
        ...ok,
        branches: [
          served({ branch: 'feat/atlas-streak', onStage: true }),
          served({ branch: 'feat/atlas-home', onStage: true, released: true }),
        ],
      },
    })
    const { container } = render(<DesignPanel />)
    // `data-stage` on the card is the row's one word; the filter pills say
    // the same words, so the assertion is on the rows, not the text.
    await screen.findByRole('heading', { name: 'Streak' })
    expect(container.querySelectorAll('[data-row][data-stage="on-stage"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-row][data-stage="released"]')).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: 'Released' }))
    await screen.findByRole('heading', { name: 'Home' })
    expect(container.querySelectorAll('[data-row][data-stage="released"]')).toHaveLength(1)
    expect(container.querySelectorAll('[data-row][data-stage="on-stage"]')).toHaveLength(0)
  })

  it('groups a variant with its feature', async () => {
    mockEndpoints({
      branches: {
        ...ok,
        branches: [
          served({ branch: 'feat/atlas-study-planner' }),
          served({ branch: 'feat/atlas-study-planner--dense' }),
        ],
      },
    })
    render(<DesignPanel />)
    expect(await screen.findAllByRole('heading', { name: 'Study planner' })).toHaveLength(1)
    expect(screen.getByText('Study planner — Dense')).toBeInTheDocument()
  })

  it('says once, at the top, when the git facts are off — not per row', async () => {
    mockEndpoints({ branches: { ...ok, git: { configured: false, reason: 'no-credentials' } } })
    render(<DesignPanel />)
    expect(await screen.findByText(/set GITHUB_TOKEN/)).toBeInTheDocument()
    expect(screen.getAllByText(/GITHUB_TOKEN/)).toHaveLength(1)
  })

  it('names the env vars when it is deployed but not configured', async () => {
    mockEndpoints({ branches: { configured: false, branches: [], reason: 'no-credentials' } })
    render(<DesignPanel />)
    expect(await screen.findByText(/NETLIFY_API_TOKEN and NETLIFY_SITE_ID/)).toBeInTheDocument()
  })

  it('says the token may have expired when Netlify refuses', async () => {
    mockEndpoints({
      branches: { configured: true, branches: [], reason: 'netlify-401' },
      branchStatus: 502,
    })
    render(<DesignPanel />)
    expect(await screen.findByText(/token may have expired/)).toBeInTheDocument()
  })

  /* The strip that used to sit under Refinement is gone — one place, not two. */
  it('Refinement no longer carries the branch strip', async () => {
    mockEndpoints({ branches: ok })
    render(<DemoPanel />)
    await screen.findByRole('button', { name: /Add the first link/ })
    expect(screen.queryByText('Branch builds')).not.toBeInTheDocument()
    expect(screen.queryByText('feat/atlas-streak')).not.toBeInTheDocument()
  })
})

/* ── the branch name ──────────────────────────────────────────────────────── */

describe('branches that name no surface', () => {
  /* 2026-11-18, Jillienne: "I don't want EVERY branch to show on the design
     page. not all of the branches are design related." A row earns its place
     by naming its surface. The unnamed ones are kept FOR NOW, collected in one
     group that asks for the rename, rather than dropped — so a designer sees
     their branch and what to do, instead of wondering where it went. */
  it('collect in one group, not a section each', () => {
    const groups = groupByFeature(
      ['feat/keycloak-change-password', 'test/session-1', 'session-2026-11-13-practice'].map((branch) =>
        served({ branch }),
      ),
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].key).toBe(UNNAMED_KEY)
    expect(groups[0].feature).toBe('Needs a surface name')
    expect(groups[0].rows).toHaveLength(3)
  })

  it('sort last, however recent — a to-do is not news', () => {
    const groups = groupByFeature([
      served({ branch: 'feat/keycloak-change-password', updated: '2026-11-18' }),
      served({ branch: 'feat/atlas-streak', updated: '2026-11-01' }),
    ])
    expect(groups.map((g) => g.key)).toEqual(['atlas:streak', UNNAMED_KEY])
  })

  it('a named branch is untouched by any of it', () => {
    const groups = groupByFeature([served({ branch: 'feat/atlas-streak' })])
    expect(groups[0].key).toBe('atlas:streak')
    expect(groups[0].feature).toBe('Streak')
    expect(groups[0].scope).toBe('atlas')
  })
})

describe('a scope that moved to its own Hub', () => {
  /* Compass moved out on 2026-11-18. The branches stay in the repo and keep
     building; the Design section just stops listing them. */
  it('drops every compass branch, however it is named', () => {
    const rows = [
      'feat/compass-three-views',
      'test/compass-html',
      'feat/compass-planner-stc',
      // ⚠ This one only reaches the exclusion because the scope word is
      // looked for ANYWHERE in the name (the same day's other fix). Under
      // first-word-only it parsed as Other and would have stayed on the page.
      'session-2026-11-13-compass-course',
    ].map((branch) => served({ branch }))
    expect(groupByFeature(rows)).toEqual([])
    for (const r of rows) expect(listsOnDesign(parseBranch(r.branch)), r.branch).toBe(false)
  })

  it('leaves every other branch exactly where it was', () => {
    const kept = ['feat/invite-flow-v3', 'erics-atlas-primary', 'feat/design-section']
    for (const b of kept) expect(listsOnDesign(parseBranch(b)), b).toBe(true)
    const groups = groupByFeature(kept.map((branch) => served({ branch })))
    expect(groups).toHaveLength(3)
  })

  it('is one list, and compass is on it', () => {
    // The undo is deleting an entry here; the test names the fact so a silent
    // re-add or removal is visible.
    expect([...SCOPES_ELSEWHERE]).toEqual(['compass'])
  })
})

describe('parseBranch — the only thing a designer authors', () => {
  it('reads scope and feature off the name', () => {
    expect(parseBranch('feat/compass-study-planner')).toMatchObject({
      scope: 'compass',
      feature: 'Study planner',
      featureKey: 'compass:study-planner',
      variant: '',
    })
  })
  it('reads a variant after --', () => {
    expect(parseBranch('feat/compass-study-planner--dense')).toMatchObject({
      featureKey: 'compass:study-planner',
      variant: 'Dense',
    })
  })
  it('accepts the words people actually use for a scope', () => {
    expect(parseBranch('feat/checkout-summary').scope).toBe('invite')
    expect(parseBranch('eric/atlas-home').scope).toBe('atlas')
    expect(parseBranch('feat/admin-learners').scope).toBe('admin')
  })
  it('still lists a branch that follows no shape at all', () => {
    expect(parseBranch('docs/hub-resources')).toMatchObject({ scope: null, feature: 'Hub resources' })
    expect(parseBranch('streak')).toMatchObject({ scope: null, feature: 'Streak' })
  })

  /* ── the scope word anywhere, and the path it implies (2026-11-18) ──────── */

  it('finds the scope word anywhere in the name, not just first', () => {
    /* The real branch list is what forced this: two thirds of the rows sat
       under "Other branches", and the two below are why — the word was right
       there, just not in front. Silent, because a name that does not match is
       not an error. */
    expect(parseBranch('erics-atlas-primary')).toMatchObject({
      scope: 'atlas',
      feature: 'Primary',
      featureKey: 'atlas:primary',
    })
    expect(parseBranch('session-2026-11-13-compass-course')).toMatchObject({
      scope: 'compass',
      // The feature is what FOLLOWS the scope, so the date prefix the author
      // used for their own reasons does not become the row's title.
      feature: 'Course',
      featureKey: 'compass:course',
    })
  })

  it('a name that already followed the convention parses exactly as before', () => {
    // The scope is word 0 and `rest` is everything after it — which is what
    // the first-word-only code computed. This is the no-change guarantee.
    expect(parseBranch('feat/compass-study-planner')).toMatchObject({
      scope: 'compass',
      feature: 'Study planner',
      featureKey: 'compass:study-planner',
    })
    expect(parseBranch('feat/compass')).toMatchObject({ scope: 'compass', feature: 'Compass' })
  })

  it('a branch with no scope word anywhere is still Other', () => {
    // The fix infers; it does not guess. Nothing in these names says a surface.
    for (const b of ['feat/retire-prototype-links', 'feat/design-section', 'test/session-1']) {
      expect(parseBranch(b).scope, b).toBeNull()
    }
  })

  it('a branch is reviewed where its SURFACE lives, not at one constant', () => {
    /* Until 2026-11-18 every row opened `/dashboard-rebrand?demo=1`, so a
       Compass branch opened the Atlas home and an Invite branch opened the
       Atlas home. The path now comes from the scope's Prototypes row, so
       there is one answer to "where does Compass live" rather than two. */
    const at = (b: string) => reviewHref('https://x--site.netlify.app', parseBranch(b).scope)
    expect(at('feat/compass-three-views')).toBe('https://x--site.netlify.app/dashboard-rebrand?demo=1&section=compass')
    expect(at('feat/home-state-licensing-links')).toBe('https://x--site.netlify.app/dashboard-rebrand?demo=1&section=dashboard')
    expect(at('feat/invite-flow-v3')).toBe('https://x--site.netlify.app/end-to-end-demo/find?demo=1')
    // No scope, nothing known about where the work is: the historic default.
    expect(at('feat/design-section')).toBe(`https://x--site.netlify.app${DEFAULT_REVIEW_PATH}`)
  })

  it('every scope resolves to its own Prototypes row\u2019s route', () => {
    /* The anti-duplication pin. If someone adds a second table of "where each
       surface lives", this is what should fail. Admin is the exception by
       design — a placeholder row with no `to`, so its branches get the
       default. */
    for (const sc of PROTOTYPE_SCOPES) {
      const row = PROTOTYPE_FEATURES.find((f) => f.category === 'prototype' && f.prototypeScope === sc.id)
      expect(reviewPathFor(sc.id), sc.id).toBe(row?.to || DEFAULT_REVIEW_PATH)
    }
    expect(reviewPathFor('admin')).toBe(DEFAULT_REVIEW_PATH)
    expect(reviewPathFor(null)).toBe(DEFAULT_REVIEW_PATH)
  })
  it('furthest-along wins the row\'s one word', () => {
    const b = served({ branch: 'feat/x', onStage: true, released: true })
    expect(stageOf(b)).toBe('released')
    expect(stageOf({ ...b, released: false })).toBe('on-stage')
    expect(stageOf({ ...b, build: 'building' })).toBe('building')
  })
  it('groups newest activity first', () => {
    const g = groupByFeature([
      served({ branch: 'feat/atlas-a', updated: '2026-11-01' }),
      served({ branch: 'feat/atlas-b', updated: '2026-11-10' }),
    ])
    expect(g.map((x) => x.feature)).toEqual(['B', 'A'])
  })
})

/* ── the Release section ──────────────────────────────────────────────────── */

describe('the Release section — what is on stage and not on main', () => {
  const decidedMarker = { scope: 'compass', decidedAt: '2026-11-15', by: 'Anjani', commit: 'abc123' }
  const ok = (branches: BranchDeploy[], aheadOfMain = 3) => ({
    configured: true,
    git: { configured: true, reason: '' },
    stage: { aheadOfMain, behindMain: 0 },
    branches,
  })

  it('lists a staged, unreleased branch under its surface, tagged Decided from its marker', async () => {
    mockEndpoints({
      branches: ok([served({ branch: 'feat/compass-streak', onStage: true, decided: [decidedMarker] })]),
    })
    const { container } = render(<ReleasePanel />)
    expect(await screen.findByRole('heading', { name: 'Compass' })).toBeInTheDocument()
    expect(screen.getByText('owner Anjani · decided')).toBeInTheDocument()
    expect(container.querySelectorAll('[data-row][data-decided="yes"]')).toHaveLength(1)
    expect(screen.getByText(/^Ready\./)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/3\s*commits on stage not on main · 1 branch from 1 surface/)
  })

  it('says Not yet when a staged branch has no marker, and counts the undecided', async () => {
    mockEndpoints({
      branches: ok([
        served({ branch: 'feat/compass-streak', onStage: true, decided: [decidedMarker] }),
        served({ branch: 'feat/atlas-home', onStage: true }),
      ]),
    })
    const { container } = render(<ReleasePanel />)
    await screen.findByRole('heading', { name: 'Atlas Learning' })
    expect(container.querySelectorAll('[data-row][data-decided="no"]')).toHaveLength(1)
    expect(screen.getByText(/^Not yet\./)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/1 undecided/)
  })

  it('leaves out what is in design and what is released — only the gap between stage and main', async () => {
    mockEndpoints({
      branches: ok(
        [
          served({ branch: 'feat/compass-a' }),
          served({ branch: 'feat/compass-b', onStage: true, released: true }),
        ],
        0,
      ),
    })
    render(<ReleasePanel />)
    expect(await screen.findByText(/Nothing waiting/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/Stage is level with main/)
  })

  it('a marker for another scope does not vouch for this branch', () => {
    const g = groupForRelease([
      served({ branch: 'feat/atlas-home', onStage: true, decided: [decidedMarker] }),
    ])
    expect(g).toHaveLength(1)
    expect(g[0].rows[0].decided).toBe(false)
    expect(g[0].ready).toBe(false)
  })

  it('counts the waiting branches for the rail', () => {
    const index = {
      available: true,
      loading: false,
      reason: '',
      git: 'on' as const,
      stageAheadOfMain: 2,
      branches: [
        served({ branch: 'feat/compass-a', onStage: true }),
        served({ branch: 'feat/compass-b', onStage: true, released: true }),
        served({ branch: 'feat/compass-c' }),
      ],
    }
    expect(waitingCount(index)).toBe(1)
  })

  it('says the git facts are needed, once, when they are off', async () => {
    mockEndpoints({ branches: { ...ok([]), git: { configured: false, reason: 'no-credentials' } } })
    render(<ReleasePanel />)
    expect(await screen.findByText(/Set GITHUB_TOKEN/)).toBeInTheDocument()
  })
})

/* ── the git facts ────────────────────────────────────────────────────────── */

describe('the decided marker — honest by construction', () => {
  it('parses a marker and requires the commit it vouches for', () => {
    expect(parseMarker({ scope: 'compass', decidedAt: '2026-11-15', by: 'Anjani', commit: 'abc' }, 'x')).toEqual({
      scope: 'compass',
      decidedAt: '2026-11-15',
      by: 'Anjani',
      commit: 'abc',
    })
    // The file name is the scope when the body does not say.
    expect(parseMarker({ commit: 'abc' }, 'atlas')?.scope).toBe('atlas')
    expect(parseMarker({ scope: 'compass' }, 'compass')).toBeNull()
    expect(parseMarker('nope', 'compass')).toBeNull()
  })

  /* The rule that lets markers stay in the tree: a marker counts only while
     its commit is among the branch's commits main does not have. One left on
     main by the last release vouches for a commit main has, and is ignored on
     every branch cut after it. */
  it('counts a marker only while its commit is ahead of main', () => {
    const m = { scope: 'compass', decidedAt: '', by: '', commit: 'abc123def' }
    expect(decidedOn([m], ['abc123def4567890', 'zzz'])).toEqual([m])
    expect(decidedOn([m], ['zzz'])).toEqual([])
    expect(decidedOn([{ ...m, commit: '' }], ['abc123def'])).toEqual([])
  })

  it('reads ahead/behind and the commit shas off a compare', () => {
    expect(parseCompare({ ahead_by: 2, behind_by: 0, commits: [{ sha: 'a' }, { sha: 'b' }] })).toEqual({
      aheadBy: 2,
      behindBy: 0,
      shas: ['a', 'b'],
    })
    expect(parseCompare({ ahead_by: 'x' })).toBeNull()
  })
})

describe('isMergedInto', () => {
  it('is ahead_by === 0 and nothing else', () => {
    expect(isMergedInto({ ahead_by: 0, behind_by: 12, status: 'behind' })).toBe(true)
    expect(isMergedInto({ ahead_by: 0, behind_by: 0, status: 'identical' })).toBe(true)
    expect(isMergedInto({ ahead_by: 3 })).toBe(false)
    expect(isMergedInto({})).toBe(false)
    expect(isMergedInto(null)).toBe(false)
  })
})

/* ── helpers ──────────────────────────────────────────────────────────────── */

describe('helpers', () => {
  it('matches a branch to a board row on the host, not the whole URL', () => {
    // The strip offers the review path; a designer may have added the root, a
    // deeper path, or a different query. What makes them one review is the
    // branch, and the host is where the branch's name lives.
    expect(
      isBranchOnBoard('feat-streak', ['https://feat-streak--site.netlify.app/anything?x=1']),
    ).toBe(true)
    expect(isBranchOnBoard('feat-streak', ['https://other--site.netlify.app/'])).toBe(false)
    // A NOTE that happens to mention the branch is not a match — only the host.
    expect(isBranchOnBoard('feat-streak', ['https://example.com/feat-streak'])).toBe(false)
    expect(isBranchOnBoard('feat-streak', ['not a url'])).toBe(false)
    expect(isBranchOnBoard('', ['https://feat-streak--site.netlify.app/'])).toBe(false)
  })

  it('drafts a title from the branch, not the commit subject', () => {
    expect(titleFromBranch('feat/drop-the-renewal-band')).toBe('Drop the renewal band')
    expect(titleFromBranch('fix/local-dev-server-npm-path')).toBe('Local dev server npm path')
    expect(titleFromBranch('streak')).toBe('Streak')
  })
})

/* ── the two controls that keep branch names off the public build ─────────── */

describe('the trimmed-build guard', () => {
  const fn = readFileSync(resolve(here, '../../netlify/functions/branches.ts'), 'utf8')

  /* Control 2. Control 1 is "the public project has no token", which would be
     switched off silently the day someone sets the Blobs vars there to share a
     store — a reasonable thing to do. This one does not care. */
  it('the endpoint refuses outright on the testing build', () => {
    // `public` until 2026-10-15; that site is retired and the guard moved to
    // the one trimmed build that remains.
    expect(fn).toMatch(/VITE_GATEWAY_MODE/)
    expect(fn).toMatch(/=== 'testing'/)
    // Refused, not "returns an empty list" — an empty list is indistinguishable
    // from "no branches" and would hide the fact that this is not for here.
    expect(fn).toMatch(/404/)
  })

  it('writes nothing — it is a read-only endpoint', () => {
    expect(fn).toMatch(/req\.method !== 'GET'/)
    expect(fn).not.toMatch(/setJSON|store\.delete/)
  })

  /* Never echo Netlify's body: on an auth failure it can name the account. */
  it('does not echo the upstream body', () => {
    expect(fn).not.toMatch(/await res\.text\(\)/)
  })

  it('is routed in netlify.toml', () => {
    const toml = readFileSync(resolve(here, '../../netlify.toml'), 'utf8')
    expect(toml).toMatch(/from = "\/api\/branches"/)
  })
})
