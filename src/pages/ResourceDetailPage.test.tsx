import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import type {
  LibraryCategory,
  LibraryResource,
  LibraryResourceType,
} from '@/data/membership/libraryFixtures'
import { ResourceDetailPage } from './ResourceDetailPage'

/**
 * Coverage: one assertion per `LibraryResourceType` (six variants)
 * plus a not-found case.
 *
 * Shell-level checks (title, type badge, topic, Download, Feedback)
 * only need to hit one variant — they're the same shell for every
 * type — so those run against a REAL XCEL fixture. The variant-body
 * tests build their resource instead of naming a fixture id.
 *
 * That split is deliberate. Each variant test used to route to
 * whichever Elite record happened to have that `type` — a video for
 * the video body, a webinar for the webinar body, and so on. It made
 * a test about BODY ROUTING depend on the brand's content mix, and
 * it broke when Elite left: XCEL's library is five text records, so
 * there is no video or webinar to point at, and the `downloadUrl` /
 * `pdfUrl` cases reference real files under `public/library/` that
 * only Elite ships. Authoring XCEL resources pointing at assets that
 * do not exist would make the demo 404 on download to satisfy a test.
 *
 * `findLibraryResourceById` is mocked per-test instead, so each
 * variant is exercised directly. Restore the fixture-driven form if
 * XCEL ever ships video, webinar and downloadable library assets.
 */

/** A minimal resource of a given type — every field the shell reads. */
function stubResource(over: Partial<LibraryResource> & { type: LibraryResourceType }) {
  return {
    id: 'stub-resource',
    title: 'Stub Resource',
    description: 'A resource built for this test.',
    category: 'career-tips' as LibraryCategory,
    rating: 4.5,
    durationMinutes: 8,
    heroBackground: 'var(--color-primary-100)',
    heroAccent: 'var(--color-primary-700)',
    heroLabel: 'STUB',
    ...over,
  } as LibraryResource
}

/** Render the page with `findLibraryResourceById` returning `resource`. */
async function renderResource(resource: LibraryResource) {
  vi.doMock('@/data/membership/libraryFixtures', async () => {
    const actual =
      await vi.importActual<typeof import('@/data/membership/libraryFixtures')>(
        '@/data/membership/libraryFixtures',
      )
    return { ...actual, findLibraryResourceById: () => ({ resource, brand: 'xcel' }) }
  })
  const { ResourceDetailPage: Page } = await import('./ResourceDetailPage')
  return render(
    <AccountProvider>
      <MemoryRouter initialEntries={['/resources/stub-resource']}>
        <Routes>
          <Route path="/resources/:id" element={<Page />} />
        </Routes>
      </MemoryRouter>
    </AccountProvider>,
  )
}

function renderAt(path: string) {
  return render(
    <AccountProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
        </Routes>
      </MemoryRouter>
    </AccountProvider>,
  )
}

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.doUnmock('@/data/membership/libraryFixtures')
  vi.resetModules()
})

describe('ResourceDetailPage — shell + variant routing', () => {
  it('renders the shell for an article resource', () => {
    // Shell-level checks run against a REAL fixture, so the shell is proven
    // against authored data rather than a stub. `xcel-exam-day` is an article
    // in the career-tips category.
    renderAt('/resources/xcel-exam-day')
    expect(
      screen.getByRole('heading', { level: 1, name: /exam day, start to finish/i }),
    ).toBeInTheDocument()
    // Type badge.
    expect(screen.getByText('Article')).toBeInTheDocument()
    // Topic line.
    expect(screen.getByText(/topic: career tips/i)).toBeInTheDocument()
    // Title-row actions.
    expect(
      screen.getByRole('button', { name: /download this resource/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /give feedback on this resource/i }),
    ).toBeInTheDocument()
    // Back link → library.
    const back = screen.getByRole('link', { name: /^back$/i })
    expect(back).toHaveAttribute('href', '/membership?tab=library')
  })

  it('renders the video body with playback controls for a video resource', async () => {
    await renderResource(stubResource({ type: 'video', title: 'A Video Resource' }))
    expect(screen.getByText('Video')).toBeInTheDocument()
    // Video controls are stub-buttons.
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /toggle fullscreen/i }),
    ).toBeInTheDocument()
  })

  it('renders the webinar variant with the longer runtime stamp', async () => {
    await renderResource(stubResource({ type: 'webinar-recording', title: 'A Webinar Recording' }))
    expect(screen.getByText('Webinar Recording')).toBeInTheDocument()
    // VideoBody is reused — the webinar passes a 13:42 runtime.
    expect(screen.getByText(/0:00 \/ 13:42/i)).toBeInTheDocument()
  })

  it('renders the PDF-viewer mock for an infographic resource', () => {
    // Also a real fixture: XCEL authors one infographic.
    renderAt('/resources/xcel-state-requirements')
    expect(screen.getByText('Infographic')).toBeInTheDocument()
    // Toolbar controls.
    expect(screen.getByRole('button', { name: /next page/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
    // Thumbnail rail renders 5 pages.
    expect(screen.getByRole('button', { name: /^go to page 1$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^go to page 5$/i })).toBeInTheDocument()
  })

  it('wires real download links when a template resource ships a downloadUrl', async () => {
    // `downloadUrl` points at a file under public/library/. XCEL ships none, so
    // this drives the wiring with a stub rather than authoring a fixture that
    // would 404 in the running demo.
    await renderResource(
      stubResource({
        type: 'template',
        title: 'A Template Resource',
        downloadUrl: '/library/a-template-resource.docx',
      }),
    )
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText(/preview unavailable/i)).toBeInTheDocument()
    // Two download targets render — the title-row text-link and the body CTA.
    // When `downloadUrl` is set, BOTH become real <a> elements pointing at it.
    const links = screen.getAllByRole('link', { name: /download/i })
    expect(links.length).toBeGreaterThanOrEqual(2)
    for (const link of links) {
      expect(link).toHaveAttribute('href', '/library/a-template-resource.docx')
    }
  })

  it('renders the embedded PDF reader when a resource carries a pdfUrl', async () => {
    await renderResource(
      stubResource({
        type: 'article',
        title: 'Critical Communication Skills',
        pdfUrl: '/library/critical-communication-skills.pdf',
      }),
    )
    // The shell still renders the resource type badge (Article) — pdfUrl swaps
    // the BODY, not the meta.
    expect(screen.getByText('Article')).toBeInTheDocument()
    // The embedded reader is an <object> with aria-label naming the resource
    // + "PDF".
    expect(
      screen.getByLabelText(/critical communication skills — pdf/i),
    ).toBeInTheDocument()
  })

  it('renders a not-found state for an unknown id', () => {
    renderAt('/resources/nope-this-does-not-exist')
    expect(
      screen.getByRole('heading', { level: 1, name: /resource not found/i }),
    ).toBeInTheDocument()
    const back = screen.getByRole('link', { name: /back to the resource library/i })
    expect(back).toHaveAttribute('href', '/membership?tab=library')
  })
})
