import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DemoPanel } from '@/components/prototype/LinksPanel'
import { DesignPanel } from '@/components/prototype/DesignPanel'
import { groupByFeature, stageOf } from '@/data/designBranches'
import { isBranchOnBoard, titleFromBranch, type BranchDeploy } from '@/data/branchStore'
import { parseBranch } from '@/data/branchName'
import { selectBranchDeploys, slugifyBranch, REVIEW_PATH } from '../../netlify/lib/branchDeploys'
import { isMergedInto } from '../../netlify/lib/branchGit'
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
  ...over,
})

describe('the Design section', () => {
  const ok = {
    configured: true,
    git: { configured: true, reason: '' },
    branches: [served({ branch: 'feat/compass-streak' })],
  }

  it('lists a built branch under its feature, open in a new tab, tagged with its scope', async () => {
    mockEndpoints({ branches: ok })
    render(<DesignPanel />)
    expect(await screen.findByRole('heading', { name: 'Streak' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /Streak/ })
    expect(link).toHaveAttribute(
      'href',
      'https://feat-compass-streak--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(screen.getByText('Compass')).toBeInTheDocument()
    expect(screen.getByText('In design')).toBeInTheDocument()
    expect(screen.getByText(/feat\/compass-streak · built 2026-11-15/)).toBeInTheDocument()
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
          served({ branch: 'feat/compass-streak', build: 'building' }),
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
          served({ branch: 'feat/compass-streak', onStage: true }),
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
          served({ branch: 'feat/compass-study-planner' }),
          served({ branch: 'feat/compass-study-planner--dense' }),
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
    expect(screen.queryByText('feat/compass-streak')).not.toBeInTheDocument()
  })
})

/* ── the branch name ──────────────────────────────────────────────────────── */

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
  it('furthest-along wins the row\'s one word', () => {
    const b = served({ branch: 'feat/x', onStage: true, released: true })
    expect(stageOf(b)).toBe('released')
    expect(stageOf({ ...b, released: false })).toBe('on-stage')
    expect(stageOf({ ...b, build: 'building' })).toBe('building')
  })
  it('groups newest activity first', () => {
    const g = groupByFeature([
      served({ branch: 'feat/compass-a', updated: '2026-11-01' }),
      served({ branch: 'feat/compass-b', updated: '2026-11-10' }),
    ])
    expect(g.map((x) => x.feature)).toEqual(['B', 'A'])
  })
})

/* ── the git facts ────────────────────────────────────────────────────────── */

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
