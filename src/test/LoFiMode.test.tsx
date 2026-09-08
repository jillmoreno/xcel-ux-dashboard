import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'

/**
 * Lo-Fi mode end-to-end:
 *   1. When the persisted Lo-Fi flag (`cgp.loFi`) is on, each component
 *      renders its lo-fi variant — DashboardHeroBand swaps to a
 *      placeholder region + the dashboard widgets render lo-fi bodies.
 *   2. State persists via localStorage (cgp.loFi).
 *   3. Default reads — components fall back to their real Hi-Fi rendering
 *      when no LoFiProvider is present (useLoFi returns a no-op default).
 *
 * NOTE: the Lo-Fi demo-tools menu item was removed from `AdminToolsMenu`,
 * so Lo-Fi is now driven purely by the persisted flag (no in-app toggle).
 *
 * AppLayout brings its own provider stack — we don't wrap one here.
 */

function renderApp(url = '/dashboard?version=v3') {
  return render(
    <AccountProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('Lo-Fi mode', () => {
  it('renders each component in its lo-fi variant when the persisted flag is on', () => {
    // Hi-Fi by default — no lo-fi hero placeholder.
    const { unmount } = renderApp()
    expect(
      screen.queryByRole('region', { name: /lo-fi dashboard hero/i }),
    ).not.toBeInTheDocument()
    unmount()

    // With the persisted flag on, the dashboard boots into lo-fi: the hero's
    // placeholder region + multiple lo-fi widget bodies (Rubi, Quick Links,
    // Streak, Courses Summary, etc.) render. "At least one" since the exact
    // count depends on which feature flags are on.
    window.localStorage.setItem('cgp.loFi', 'true')
    renderApp()
    expect(
      screen.getByRole('region', { name: /lo-fi dashboard hero/i }),
    ).toBeInTheDocument()
    const widgets = screen.getAllByRole('region', { name: /lo-fi .* widget/i })
    expect(widgets.length).toBeGreaterThan(0)
  })

  it('restores Lo-Fi state from localStorage on mount', () => {
    window.localStorage.setItem('cgp.loFi', 'true')
    renderApp()
    // Hero band boots straight into the placeholder — no menu
    // interaction needed.
    expect(
      screen.getByRole('region', { name: /lo-fi dashboard hero/i }),
    ).toBeInTheDocument()
  })
})
