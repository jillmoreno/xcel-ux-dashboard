import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { QuickLinksCard } from '@/components/dashboard/QuickLinksCard'

function renderCard() {
  return render(
    <AccountProvider>
      <MemoryRouter>
        <QuickLinksCard />
      </MemoryRouter>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('QuickLinksCard — Option B 2×2 tile grid', () => {
  it('renders all four tile labels', () => {
    renderCard()
    expect(screen.getByText('Catalog')).toBeInTheDocument()
    expect(screen.getByText('Resource Library')).toBeInTheDocument()
    expect(screen.getByText('Podcasts')).toBeInTheDocument()
    expect(screen.getByText('Certificates')).toBeInTheDocument()
  })

  it('renders all four captions verbatim', () => {
    renderCard()
    expect(screen.getByText('Browse new courses')).toBeInTheDocument()
    expect(screen.getByText('Explore Resources')).toBeInTheDocument()
    expect(screen.getByText('Listen on the go')).toBeInTheDocument()
    expect(screen.getByText('View Completions')).toBeInTheDocument()
  })

  it('routes each tile to its canonical href', () => {
    renderCard()
    const expected: Array<[string, string]> = [
      ['Catalog — Browse new courses', '/catalog'],
      ['Resource Library — Explore Resources', '/resources/r-cre-disclosure-guide'],
      ['Podcasts — Listen on the go', '/my-learning/podcasts'],
      ['Certificates — View Completions', '/my-learning/certificates'],
    ]
    for (const [name, href] of expected) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href)
    }
  })

  it('renders exactly four tiles inside the grid', () => {
    renderCard()
    expect(screen.getAllByRole('link')).toHaveLength(4)
  })

  it('each tile carries an aria-label of `${label} — ${caption}`', () => {
    renderCard()
    expect(
      screen.getByRole('link', { name: 'Catalog — Browse new courses' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Resource Library — Explore Resources' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Podcasts — Listen on the go' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Certificates — View Completions' }),
    ).toBeInTheDocument()
  })
})
