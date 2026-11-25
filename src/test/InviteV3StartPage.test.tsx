import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import { InviteV3StartPage } from '@/pages/InviteV3StartPage'
import { INVITE_FLOWS_V3 } from '@/data/inviteFlowsV3'

/* `/invite-v3` — the V3 invite flow on its own, for a Jira ticket
   (2026-11-17). Every flow has a row, and every Start keeps the walk to the
   flow: no chrome, and the stand-alone ending. */
describe('the stand-alone invite flow page', () => {
  it('lists every V3 flow with a Start that strips the chrome', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    for (const flow of INVITE_FLOWS_V3) {
      const row = screen.getByRole('heading', { name: flow.label }).closest('article')!
      const links = within(row).getAllByRole('link')
      expect(links.length).toBeGreaterThan(0)
      for (const link of links) {
        const url = new URL(link.getAttribute('href')!, 'http://x')
        expect(url.searchParams.get('chrome')).toBe('off')
        expect(url.searchParams.get('standalone')).toBe('1')
        expect(url.searchParams.get('ff')).toContain(`:${flow.id}`)
      }
    }
  })

  it('offers Products on the B2B2C cards, on Standard, and carries the pick', async () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    for (const name of ['Direct Email', 'QR Code']) {
      const row = screen.getByRole('heading', { name }).closest('article')!
      const select = within(row).getByLabelText('Products')
      expect(select).toHaveValue('standard')
      /* No Multi-product (Old) here (2026-11-18). */
      expect(within(select as HTMLElement).queryByRole('option', { name: 'Multi-product (Old)' })).not.toBeInTheDocument()
      expect(within(select as HTMLElement).getAllByRole('option')).toHaveLength(4)
      expect(within(row).getAllByRole('link')[0].getAttribute('href')).toContain('pdp-products%3Astandard')
      await userEvent.selectOptions(select, 'california')
      for (const link of within(row).getAllByRole('link')) {
        expect(link.getAttribute('href')).toContain('pdp-products%3Acalifornia')
      }
    }
    const b2c = screen.getByRole('heading', { name: 'Signed into XCEL (OCD)' }).closest('article')!
    expect(within(b2c).queryByLabelText('Products')).not.toBeInTheDocument()
  })

  it('gives each card its one-line subtext', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('User receives an email invitation from an XCEL partner.')).toBeInTheDocument()
    expect(screen.getByText('User scans an XCEL partner’s QR code.')).toBeInTheDocument()
    expect(screen.getByText('User is not signed into XCEL and wants to make a purchase.')).toBeInTheDocument()
    expect(screen.getByText('User is signed into XCEL and wants to make a purchase.')).toBeInTheDocument()
  })

  it('lists Not signed in to XCEL before Signed in, then Log In', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    const b2c = screen.getByRole('region', { name: 'Public site (B2C)' })
    expect(within(b2c).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Not signed into XCEL (OCD)',
      'Signed into XCEL (OCD)',
      'Log In',
    ])
  })

  it('links the whole prototype from a note, on both tabs', async () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/To access the prototype that captures all of these flows, click/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute(
      'href',
      'https://feat-invite-flow-v3--ux-design-xceldashboard.netlify.app/end-to-end-demo/email?demo=1&version=jill-atlas-main',
    )
    /* In a new tab, as the Starts open (2026-11-18). */
    expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute('target', '_blank')
    expect(screen.getByRole('link', { name: 'here' })).toHaveAttribute('rel', 'noopener noreferrer')
    await userEvent.click(screen.getByRole('tab', { name: 'Screens' }))
    expect(screen.getByText(/To access the prototype that captures all of these flows, click/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'here' })).toBeInTheDocument()
  })

  it('opens each Start in a new tab, as a secondary button that says so', () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    const starts = screen.getAllByRole('link', { name: /Atlas account \(opens in a new tab\)/ })
    /* Two per checkout flow, and Log In's Atlas account (2026-11-20). */
    expect(starts).toHaveLength(9)
    for (const link of starts) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      expect(link).toHaveClass('cre-v3-start')
      expect(link.querySelector('svg')).not.toBeNull()
    }
    expect(screen.getByText(/Reach out to Afsana if you have any questions\./)).toBeInTheDocument()
  })

  it('fills the cart for the flows that start there', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    const row = screen.getByRole('heading', { name: 'Not signed into XCEL (OCD)' }).closest('article')!
    const url = new URL(within(row).getAllByRole('link')[0].getAttribute('href')!, 'http://x')
    expect(url.pathname).toBe('/end-to-end-demo/cart')
    expect(url.searchParams.get('pkg')).toBe('premier')
  })
})

/* The Screens tab (2026-11-18): pictures listed by a manifest the capture
   script writes. A tiny stand-in manifest is enough to pin the layout. */
describe('the stand-alone page’s Screens tab', () => {
  const manifest = {
    capturedAt: '2026-11-19',
    components: [
      {
        id: 'modal-verify-your-email',
        title: 'Verify your email',
        kind: 'modal',
        flows: ['Direct Email', 'QR Code'],
        states: [
          { file: 'modals/verify-your-email/01-empty.png', state: 'Empty', seenIn: ['Direct Email · No Atlas account'] },
          { file: 'modals/verify-your-email/02-wrong-code.png', state: 'Wrong code', seenIn: ['QR Code · No Atlas account'] },
        ],
      },
      {
        id: 'card-ocd-log-in',
        title: 'OCD log in',
        kind: 'card',
        flows: ['Log In'],
        capturedAt: '2026-11-23',
        states: [{ file: 'cards/ocd-log-in/01-empty.png', state: 'Email, empty', seenIn: ['Log In · OCD account'] }],
      },
      {
        id: 'page-your-cart',
        title: 'Your cart',
        kind: 'page',
        flows: ['Not signed into XCEL (OCD)'],
        states: [{ file: 'pages/your-cart/01-targeted.png', state: 'Targeted course', seenIn: ['Not signed into XCEL (OCD) · Targeted only · No Atlas account'] }],
      },
    ],
  }
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => manifest })))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens on Flows, and Screens lists each component once with its states and flows', async () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('tab', { name: 'Flows' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.click(screen.getByRole('tab', { name: 'Screens' }))
    const modal = await screen.findByRole('article', { name: 'Verify your email (Modal)' })
    expect(within(modal).getByText('Used in: Direct Email · QR Code')).toBeInTheDocument()
    expect(within(modal).getByRole('button', { name: 'Verify your email — Wrong code' })).toBeInTheDocument()
    /* Components first, pages after. */
    const components = screen.getByRole('region', { name: 'Components' })
    const pages = screen.getByRole('region', { name: 'Pages' })
    expect(within(components).queryByRole('article', { name: /Your cart/ })).not.toBeInTheDocument()
    expect(within(pages).getByRole('article', { name: 'Your cart (Page)' })).toBeInTheDocument()
    expect(screen.getByText(/Captured 2026-11-19/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /No Atlas account/ })).not.toBeInTheDocument()
  })

  it('splits Screens into Invite & Purchase Flow (first) and Revised Log In Page (2026-11-23)', async () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3?tab=screens']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    /* Two rows: the page's, and Screens' own. */
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual([
      'Flows',
      'Screens',
      'Invite & Purchase Flow',
      'Revised Log In Page',
    ])
    expect(screen.getByRole('tab', { name: 'Invite & Purchase Flow' })).toHaveAttribute('aria-selected', 'true')
    await screen.findByRole('article', { name: 'Verify your email (Modal)' })
    expect(screen.queryByRole('article', { name: /OCD log in/ })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Revised Log In Page' }))
    expect(await screen.findByRole('article', { name: 'OCD log in (On the page)' })).toBeInTheDocument()
    expect(screen.queryByRole('article', { name: /Verify your email/ })).not.toBeInTheDocument()
    /* Grouped by what it is, not by kind (2026-11-23). */
    expect(screen.getByRole('region', { name: 'Net New OCD Designs that integrate Keycloak' })).toContainElement(
      screen.getByRole('article', { name: 'OCD log in (On the page)' }),
    )
    expect(screen.queryByRole('region', { name: 'Components' })).not.toBeInTheDocument()
    /* Its own capture date, not the run's. */
    expect(screen.getByText(/^Captured 2026-11-23\./)).toBeInTheDocument()
  })

  it('opens a state full size, says where it is seen, and steps through them', async () => {
    render(
      <MemoryRouter initialEntries={['/invite-v3?tab=screens']}>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    await userEvent.click(await screen.findByRole('button', { name: 'Verify your email — Empty' }))
    const dialog = screen.getByRole('dialog', { name: 'Verify your email — Empty' })
    expect(within(dialog).getByRole('img')).toHaveAttribute('src', '/invite-v3-screens/modals/verify-your-email/01-empty.png')
    expect(dialog).toHaveTextContent('seen in Direct Email · No Atlas account')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog', { name: 'Verify your email — Wrong code' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
