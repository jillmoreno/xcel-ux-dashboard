import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { MyPodcastsPage } from '@/pages/MyPodcastsPage'
import { AccountProvider } from '@/context/AccountContext'
import { CONTINUE_LISTENING, MY_PODCAST_PLAYLIST, RECOMMENDED_PODCASTS } from '@/data/podcastFixtures'

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location" data-search={location.search} />
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AccountProvider>
        <Routes>
          <Route
            path="/my-learning/podcasts"
            element={
              <>
                <MyPodcastsPage />
                <LocationProbe />
              </>
            }
          />
        </Routes>
      </AccountProvider>
    </MemoryRouter>,
  )
}

describe('MyPodcastsPage', () => {
  it('renders the Continue Listening tab by default', () => {
    renderAt('/my-learning/podcasts')
    expect(screen.getByRole('heading', { level: 1, name: /my podcasts/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /^continue listening$/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: CONTINUE_LISTENING[0].episodeTitle })).toBeInTheDocument()
    // Default tab leaves the URL with no ?tab= param.
    const probe = screen.getByTestId('location')
    expect(probe.getAttribute('data-search') ?? '').not.toMatch(/tab=/)
  })

  it('renders the My Playlist as a Spotify-style list when ?tab=playlist is set', () => {
    renderAt('/my-learning/podcasts?tab=playlist')
    expect(screen.getByRole('heading', { level: 2, name: /^my playlist$/i })).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`^${MY_PODCAST_PLAYLIST.length} Results?$`, 'i')),
    ).toBeInTheDocument()
    // Redesigned as a list, not a <table>.
    expect(screen.queryByRole('table')).toBeNull()
    const first = MY_PODCAST_PLAYLIST[0]
    expect(screen.getByRole('button', { name: `Open ${first.title}` })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Play ${first.title}` })).toBeInTheDocument()
  })

  it('shows each saved podcast with its credit metadata', () => {
    renderAt('/my-learning/podcasts?tab=playlist')
    // Visual column labels (no real <table> / columnheaders).
    expect(screen.getByText('Date added')).toBeInTheDocument()
    expect(screen.getByText('Progress')).toBeInTheDocument()
    const first = MY_PODCAST_PLAYLIST[0]
    const creditType = first.badge === 'mandatory' ? 'Mandatory' : 'Elective'
    expect(screen.getByText(first.title)).toBeInTheDocument()
    // Subtitle reads "<CreditType> · <hours> · <state>" on a single line.
    expect(
      screen.getByText(new RegExp(`${creditType}.*${first.state}`)),
    ).toBeInTheDocument()
  })

  it('progress cell shows Not Started / percentage / Complete by status', () => {
    renderAt('/my-learning/podcasts?tab=playlist')
    const notStarted = MY_PODCAST_PLAYLIST.find((r) => r.myStatus === 'not-started')
    const inProgress = MY_PODCAST_PLAYLIST.find((r) => r.myStatus === 'in-progress')
    const completed = MY_PODCAST_PLAYLIST.find((r) => r.myStatus === 'completed')
    if (!notStarted || !inProgress || !completed) {
      throw new Error('Expected at least one of each status in playlist fixture')
    }
    expect(screen.getByText(/^Not Started$/)).toBeInTheDocument()
    expect(screen.getByText(`${Math.round(inProgress.progress ?? 0)}%`)).toBeInTheDocument()
    expect(screen.getByText(/^Complete$/)).toBeInTheDocument()
  })

  it('clicking the Browse Podcasts tab updates the URL and renders the grid', async () => {
    const user = userEvent.setup()
    renderAt('/my-learning/podcasts')
    await user.click(screen.getByRole('tab', { name: /browse podcasts/i }))
    const probe = screen.getByTestId('location')
    expect(probe.getAttribute('data-search') ?? '').toMatch(/tab=recommended/)
    expect(screen.getByRole('button', { name: RECOMMENDED_PODCASTS[0].title })).toBeInTheDocument()
  })

  it('clicking Continue Listening clears the tab param and returns to the default view', async () => {
    const user = userEvent.setup()
    renderAt('/my-learning/podcasts?tab=recommended')
    expect(screen.queryByRole('heading', { level: 2, name: /^continue listening$/i })).toBeNull()
    await user.click(screen.getByRole('tab', { name: /continue listening/i }))
    const probe = screen.getByTestId('location')
    expect(probe.getAttribute('data-search') ?? '').not.toMatch(/tab=/)
    expect(screen.getByRole('heading', { level: 2, name: /^continue listening$/i })).toBeInTheDocument()
  })

  it('clicking a recommended card opens the Podcast Summary sheet defaulted to the Description tab', async () => {
    const user = userEvent.setup()
    renderAt('/my-learning/podcasts?tab=recommended')
    const first = RECOMMENDED_PODCASTS[0]
    await user.click(screen.getByRole('button', { name: first.title }))
    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('heading', { name: /podcast summary/i })).toBeInTheDocument()
    const descriptionTab = within(dialog).getByRole('button', { name: /^description$/i })
    expect(descriptionTab).toHaveAttribute('data-active', 'true')
    // Chapters tab still exists but is not active by default.
    expect(within(dialog).getByRole('button', { name: /^chapters$/i })).toHaveAttribute('data-active', 'false')
  })
})
