import { useEffect } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AccountProvider, useAccount, type Brand } from '@/context/AccountContext'
import { FeatureFlagProvider, FEATURE_FLAGS } from '@/context/FeatureFlagContext'
import { PlatformSideNav } from '@/components/layout/PlatformSideNav'

/**
 * THE RAIL'S APPEARANCE FLAGS — `nav-rail-icons` and `nav-rail-captions`,
 * 2026-09-28.
 *
 * Both hide something, and the thing worth pinning about each is what must NOT
 * disappear with it: the group's accessible name survives a hidden caption, and
 * the collapsed rail keeps its glyph whatever the icon flag says.
 */

function Seed({ brand }: { brand: Brand }) {
  const { brand: current, setAccount } = useAccount()
  useEffect(() => {
    if (current !== brand) setAccount(brand, 'member')
  }, [brand, current, setAccount])
  return null
}

function renderNav(search = '') {
  window.history.replaceState({}, '', `/dashboard-rebrand${search}`)
  return render(
    <MemoryRouter>
      <AccountProvider>
        <FeatureFlagProvider>
          <Seed brand="xcel" />
          <PlatformSideNav active="dashboard" onSelect={() => {}} />
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

const icons = () => document.querySelectorAll('nav[aria-label="Primary"] svg')

describe('nav-rail-icons', () => {
  it('ships icons at 14 — promoted 2026-09-28', () => {
    /* This asserted 17 and failed the moment the baseline moved, which is what
       it was for: a new arm must not become the default by landing, only by
       being promoted. */
    const flag = FEATURE_FLAGS.find((f) => f.key === 'nav-rail-icons')
    expect(flag?.defaultVariant).toBe('small')
    renderNav()
    expect(icons().length).toBeGreaterThan(0)
    expect(icons()[0].getAttribute('width')).toBe('14')
  })

  it('still renders them at 17 on `standard`', () => {
    /* The old baseline, now the opt-in arm. */
    renderNav('?ff=nav-rail-icons:standard')
    expect(icons()[0].getAttribute('width')).toBe('17')
  })


  it('drops them entirely on `none`, and the labels stay', () => {
    /* ⚠ THE LABELS ARE THE POINT. An unlabelled glyph rail is the thing every
       nav study finds people mis-click; this flag removes the glyph, never the
       word. With the icon gone the row's flex gap collapses and the labels
       left-align against the row padding on their own — there is no second
       alignment rule to keep in step. */
    renderNav('?ff=nav-rail-icons:none')
    expect(icons()).toHaveLength(0)
    expect(screen.getByRole('button', { name: /^Home$/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /My Courses/ })).toBeTruthy()
  })
})

describe('nav-rail-captions', () => {
  const groupNames = () =>
    [...document.querySelectorAll('nav[aria-label="Primary"] ul')].map(
      (ul) =>
        ul.getAttribute('aria-label') ??
        document.getElementById(ul.getAttribute('aria-labelledby') ?? '')?.textContent ??
        '',
    )

  it('shows the captions as shipped', () => {
    expect(FEATURE_FLAGS.find((f) => f.key === 'nav-rail-captions')?.defaultEnabled).toBe(true)
    renderNav()
    expect(screen.getByText('My Learning')).toBeTruthy()
    expect(screen.getByText('Support')).toBeTruthy()
  })

  it('hides the headings but KEEPS every group named', () => {
    /*
     * ⚠ THE ASSERTION THAT MATTERS. Hiding the heading is a layout change;
     * dropping the group's accessible name with it would be an accessibility
     * regression — a screen reader would hear four buttons in one anonymous
     * list instead of "My Learning" and "Support". The `<ul>` carries the name
     * as `aria-label` when the caption is not on screen, which is the rule the
     * collapsed rail already followed.
     */
    renderNav('?ff=nav-rail-captions:off')
    expect(screen.queryByText('My Learning')).toBeNull()
    expect(screen.queryByText('Support')).toBeNull()
    const named = groupNames()
    expect(named.length).toBeGreaterThan(1)
    expect(named).toContain('My Learning')
    expect(named).toContain('Support')
    expect(named.every(Boolean), `an unnamed group: ${JSON.stringify(named)}`).toBe(true)
  })
})
