import { useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { FEATURE_FLAGS, FeatureFlagProvider } from '@/context/FeatureFlagContext'
import { AccountProvider } from '@/context/AccountContext'
import {
  DEFAULT_INVITE_FLOW_VERSION,
  INVITE_FLOW_VERSION_FLAG,
  INVITE_FLOW_VERSIONS,
  inviteFlowVersionLabel,
  isInviteFlowPath,
  resolveInviteFlowVersion,
} from '@/data/inviteFlowVersions'
import { InviteFlowVersionsPanel } from '@/components/e2e/InviteFlowVersionsPanel'
import {
  InviteFlowVersionsPanelProvider,
  useInviteFlowVersionsPanel,
} from '@/components/e2e/InviteFlowVersionsPanelContext'

/**
 * THE INVITE FLOW'S VERSIONS — 2026-10-22.
 *
 * What this pins is the seam between two lists that have to agree: the catalog
 * the picker renders and the flag variants it writes. They live in different
 * files for good reasons (one is data about the product, one is a control), and
 * nothing else would notice them drifting — a row with no matching variant is a
 * card that selects nothing, and a variant with no row is a reachable version
 * the picker cannot offer. Neither throws.
 */
describe('Invite flow versions', () => {
  const definition = FEATURE_FLAGS.find((f) => f.key === INVITE_FLOW_VERSION_FLAG)

  it('has a flag backing the picker', () => {
    expect(definition).toBeDefined()
    expect(definition?.variants?.length).toBeGreaterThan(0)
  })

  it('offers exactly the versions the flag can store', () => {
    const rows = INVITE_FLOW_VERSIONS.map((v) => v.id).sort()
    const variants = (definition?.variants ?? []).map((v) => v.value).sort()
    expect(variants).toEqual(rows)
  })

  it('defaults to a version that is in the catalog', () => {
    // Both the branch default (the flag) and the committed one (the constant).
    expect(INVITE_FLOW_VERSIONS.some((v) => v.id === definition?.defaultVariant)).toBe(true)
    expect(INVITE_FLOW_VERSIONS.some((v) => v.id === DEFAULT_INVITE_FLOW_VERSION)).toBe(true)
  })

  it('carries a V2 for the checkout exploration', () => {
    expect(INVITE_FLOW_VERSIONS.map((v) => v.id)).toContain('v2')
  })

  it("carries a V3 for Afsana's concept", () => {
    expect(inviteFlowVersionLabel('v3')).toBe("Invite Flow V3 — Afsana's concept")
  })

  it('every row says what it is, and when', () => {
    for (const version of INVITE_FLOW_VERSIONS) {
      expect(version.label.trim().length).toBeGreaterThan(0)
      expect(version.description.trim().length).toBeGreaterThan(40)
      expect(version.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(version.modifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('falls back to the default rather than rendering an unknown id', () => {
    expect(resolveInviteFlowVersion('v2')).toBe('v2')
    expect(resolveInviteFlowVersion('v9')).toBe(DEFAULT_INVITE_FLOW_VERSION)
    expect(resolveInviteFlowVersion(null)).toBe(DEFAULT_INVITE_FLOW_VERSION)
    expect(resolveInviteFlowVersion(undefined)).toBe(DEFAULT_INVITE_FLOW_VERSION)
  })

  it('labels an id, and an unknown one as itself', () => {
    expect(inviteFlowVersionLabel('v1')).toBe('Invite Flow V1')
    expect(inviteFlowVersionLabel('v9')).toBe('v9')
  })

  /* The four routes the demo bar's version control must answer for — and the
     ones it must not, or the dashboard picker loses its own button. */
  it('knows which routes are the invite flow', () => {
    expect(isInviteFlowPath('/end-to-end-demo')).toBe(true)
    expect(isInviteFlowPath('/end-to-end-demo/email')).toBe(true)
    expect(isInviteFlowPath('/end-to-end-demo/checkout')).toBe(true)
    expect(isInviteFlowPath('/end-to-end-demo/confirmation')).toBe(true)
    expect(isInviteFlowPath('/dashboard-rebrand')).toBe(false)
    expect(isInviteFlowPath('/')).toBe(false)
  })

  it('renders the catalog under its own title when open', () => {
    render(
      <MemoryRouter initialEntries={['/end-to-end-demo/checkout']}>
        <AccountProvider>
          <FeatureFlagProvider>
            <InviteFlowVersionsPanelProvider>
              {/* The panel is gated on its context's `open`, so drive it the
                  way the demo bar does rather than reaching past the provider. */}
              <OpenOnMount />
              <InviteFlowVersionsPanel />
            </InviteFlowVersionsPanelProvider>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'Invite Flow Versions' })).toBeInTheDocument()
    for (const version of INVITE_FLOW_VERSIONS) {
      expect(screen.getAllByText(version.label).length).toBeGreaterThan(0)
    }
    // …and NOT the dashboard list it borrows its panel from.
    expect(screen.queryByText('Dashboard V1')).not.toBeInTheDocument()
  })
})

/** Opens the picker once, from inside the provider — the demo bar's job in the
 *  running app. */
function OpenOnMount() {
  const panel = useInviteFlowVersionsPanel()
  useEffect(() => {
    panel?.openPanel()
  }, [panel])
  return null
}
