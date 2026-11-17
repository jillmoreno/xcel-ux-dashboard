import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

  it('fills the cart for the flows that start there', () => {
    render(
      <MemoryRouter>
        <InviteV3StartPage />
      </MemoryRouter>,
    )
    const row = screen.getByRole('heading', { name: 'Not signed in to XCEL (OCD)' }).closest('article')!
    const url = new URL(within(row).getAllByRole('link')[0].getAttribute('href')!, 'http://x')
    expect(url.pathname).toBe('/end-to-end-demo/cart')
    expect(url.searchParams.get('pkg')).toBe('premier')
  })
})
