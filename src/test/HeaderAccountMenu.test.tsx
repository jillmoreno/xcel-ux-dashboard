import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider, useAccount } from '@/context/AccountContext'
import { FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { ProfileAvatarProvider } from '@/context/ProfileAvatarContext'
import { AccountMenu } from '@/components/layout/AccountMenu'

/**
 * THE HEADER ACCOUNT TRIGGER — the learner's own photo and name (2026-09-16).
 *
 * It was a generic `CircleUser` glyph, and `Header` rendered
 * `<AccountMenu initials="SC" />` — the only prop it ever passed, and not this
 * learner's initials. The component's own comment claimed Header passed the
 * live values from `useAccount().user`; it did not, so the hardcoded defaults
 * WERE the menu. Harmless behind a glyph; a second learner the moment the
 * trigger shows a face and a name.
 */

/** Source with comments removed — a note explaining a removal names the thing
 *  it removed, so a naive source match reads its own tombstone as the bug. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

function seed() {
  window.localStorage.clear()
  window.localStorage.setItem('cgp.account', JSON.stringify({ brand: 'xcel', tier: 'high' }))
}

/** The live learner, read the way the component reads it. */
type Live = { name: string; avatarUrl: string | undefined; initials: string }

function LiveUser({ onResolve }: { onResolve: (v: Live) => void }) {
  const { user } = useAccount()
  onResolve({
    name: `${user.firstName} ${user.lastName}`,
    avatarUrl: user.avatarUrl,
    initials: user.initials,
  })
  return null
}

function renderMenu() {
  let live: Live = { name: '', avatarUrl: undefined, initials: '' }
  const view = render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <ProfileAvatarProvider>
            <LiveUser onResolve={(v) => { live = v }} />
            <AccountMenu />
          </ProfileAvatarProvider>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
  return { ...view, live: () => live }
}

beforeEach(seed)

describe('the account trigger resolves the live learner', () => {
  it('takes NO props from Header, and shows that learner’s name', () => {
    const { container, live } = renderMenu()
    const pill = container.querySelector<HTMLElement>('.cre-account-pill')!
    expect(pill).toBeTruthy()
    // Against the CONTEXT rather than a literal: the point is that the trigger
    // and the account fixture cannot disagree, not that the demo learner is
    // called Alicia.
    expect(pill.textContent).toContain(live().name)
    expect(pill.getAttribute('aria-label')).toContain(live().name)
  })

  it('renders that learner’s photo, not a generic glyph', () => {
    const { container, live } = renderMenu()
    const pill = container.querySelector<HTMLElement>('.cre-account-pill')!
    const img = pill.querySelector('img')
    expect(img).toBeTruthy()
    expect(img!.getAttribute('src')).toBe(live().avatarUrl)
    expect(img!.getAttribute('alt')).toBe(live().name)
  })

  it('no longer hardcodes "SC" anywhere', () => {
    // The literal Header used to pass. It is not this learner's initials, and
    // it was invisible because the trigger never rendered them.
    // Comments stripped: the note explaining the removal names the old literal,
    // and a naive match reads its own tombstone as the bug.
    const header = stripComments(readFileSync('src/components/layout/Header.tsx', 'utf8'))
    expect(header).not.toMatch(/initials="SC"/)
    expect(header).toMatch(/<AccountMenu \/>/)
  })

  it('keeps the props as OVERRIDES for an isolated mount', () => {
    // Which is what they were genuinely being used for — a unit test rendering
    // the menu on its own. Removing them would break those mounts.
    render(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <AccountMenu initials="PR" name="Priya Raman" />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('button', { name: /Account menu — Priya Raman/ })).toBeInTheDocument()
  })

  it('does NOT carry the Brick ring — the rail keeps that', () => {
    // `brandRing` is documented as marking the rail's 48px avatar as the
    // learner's own, and as its ONLY call site. A second ringed avatar in one
    // viewport spends the distinction rather than making it. At 28px a 2px ring
    // is proportionally heavier than it is at 48, too.
    const { container } = renderMenu()
    const pill = container.querySelector<HTMLElement>('.cre-account-pill')!
    const frame = pill.querySelector('img')!.parentElement as HTMLElement
    expect(frame.style.border).not.toMatch(/cta-500/)
    const src = stripComments(readFileSync('src/components/layout/AccountMenu.tsx', 'utf8'))
    expect(src).not.toMatch(/brandRing/)
  })
})

describe('the rail profile header is unwired', () => {
  /*
   * 2026-09-16, the same day the trigger gained the photo and name. The rail's
   * pinned top region was a second portrait-and-name of the same person in one
   * viewport — `ARCHIVED_ITEMS` id `nav-profile-header`.
   */
  it('renders no greeting and no rail avatar', async () => {
    const { PlatformSideNav } = await import('@/components/layout/PlatformSideNav')
    const { render: r } = await import('@testing-library/react')
    const { container } = r(
      <MemoryRouter>
        <AccountProvider>
          <FeatureFlagProvider>
            <PlatformSideNav active="dashboard" onSelect={() => {}} />
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const rail = container.querySelector('nav[aria-label="Primary"]')!
    expect(rail.textContent).not.toMatch(/welcome back/i)
    expect(rail.querySelector('img')).toBeNull()
    // The rail still renders — it opens on MY LEARNING now.
    expect(rail.textContent).toMatch(/MY LEARNING/i)
  })

  it('is KEPT and exported, not deleted', () => {
    // The archive convention: unwire it, keep the file, record the re-wire. An
    // unreferenced local function is a lint error, so it is exported instead —
    // the same treatment `MotivationalStatementCard` gets on the Profile page.
    const src = readFileSync('src/components/layout/PlatformSideNav.tsx', 'utf8')
    expect(src).toMatch(/export function NavProfileHeader/)
    expect(stripComments(src)).not.toMatch(/<NavProfileHeader/)
  })

  it('carries an archive row whose restore note names the isMember line', () => {
    // That line went with it (the header was its only consumer), so a restore
    // that re-adds only the JSX leaves a compile error.
    const src = readFileSync('src/data/archivedItems.ts', 'utf8')
    expect(src).toMatch(/nav-profile-header/)
    const row = src.slice(src.indexOf("id: 'nav-profile-header'"))
    expect(row).toMatch(/isMember/)
    expect(row).toMatch(/brandRing/)
  })

  it('corrects the stale claim on the motivational-statement row', () => {
    // Its restore note said the panel was "STILL REACHABLE from the left rail
    // (`NavProfileHeader` → MotivationalStatementPanel)". Unwiring the header
    // made that false, and a restore note that lies is worse than none.
    const src = readFileSync('src/data/archivedItems.ts', 'utf8')
    const row = src.slice(
      src.indexOf("id: 'profile-motivational-statement'"),
      src.indexOf("id: 'nav-profile-header'"),
    )
    expect(row).toMatch(/CORRECTED 2026-09-16/)
    expect(row).toMatch(/ProfilePersonalizePanel/)
  })
})

describe('the trigger is a pill sized to its content', () => {
  it('replaced the fixed 40x40 icon pill, keeping its hover', () => {
    // `cre-icon-pill` is a square built for one glyph and cannot hold a name.
    // The replacement matches it everywhere else, because the trigger sits in a
    // three-item cluster and one that hovers differently from the cart and the
    // bell reads as a different kind of control.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    const base = css.match(/\.cre-account-pill\s*\{([^}]*)\}/)![1]
    expect(base).toMatch(/border-radius: var\(--radius-md\)/)
    expect(base).toMatch(/background: transparent/)
    const pillHover = css.match(/\.cre-account-pill:hover\s*\{([^}]*)\}/)![1]
    const iconHover = css.match(/\.cre-icon-pill:hover\s*\{([^}]*)\}/)![1]
    expect(pillHover.trim()).toBe(iconHover.trim())
    expect(css).toMatch(/\.cre-account-pill:focus-visible\s*\{[^}]*outline/)
  })

  it('drops the NAME on a narrow header, keeping it in the label', () => {
    // At phone widths the header is a logo, a hamburger and this cluster. The
    // button's `aria-label` still carries the name, so assistive tech loses
    // nothing — which is why the name is hidden rather than the whole pill.
    const css = readFileSync('src/styles/tokens.css', 'utf8')
    expect(css).toMatch(/@media \(max-width: 900px\)\s*\{\s*\.cre-account-pill__name\s*\{\s*display: none/)
  })
})
