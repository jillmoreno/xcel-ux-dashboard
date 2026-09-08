import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AccountProvider } from '@/context/AccountContext'
import { ResourceDetailPage } from './ResourceDetailPage'

/**
 * Coverage: one assertion per `LibraryResourceType` (six variants)
 * plus a not-found case. Each test routes to `/resources/<id>` with
 * a known fixture id and confirms the shell + the correct variant
 * body mounts.
 *
 * Shell-level checks (title, type badge, rating, topic, Download,
 * Feedback) only need to hit one variant — they're the same shell
 * for every type. The other five variant tests just confirm the
 * body switched correctly.
 */

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

describe('ResourceDetailPage — shell + variant routing', () => {
  it('renders the shell for an article resource', () => {
    renderAt('/resources/elite-surviving-night-shift')
    // Title row.
    expect(
      screen.getByRole('heading', { level: 1, name: /surviving night shift/i }),
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

  it('renders the video body with playback controls for a video resource', () => {
    renderAt('/resources/elite-intradermal-injections')
    expect(screen.getByText('Video')).toBeInTheDocument()
    // Video controls are stub-buttons.
    expect(screen.getByRole('button', { name: /^play$/i })).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /toggle fullscreen/i }),
    ).toBeInTheDocument()
  })

  it('renders the webinar variant with the longer runtime stamp', () => {
    renderAt('/resources/elite-new-grad-pitfalls')
    expect(screen.getByText('Webinar Recording')).toBeInTheDocument()
    // VideoBody is reused — the webinar passes a 13:42 runtime.
    expect(screen.getByText(/0:00 \/ 13:42/i)).toBeInTheDocument()
  })

  it('renders the PDF-viewer mock for an infographic resource', () => {
    renderAt('/resources/elite-ekg-cheat-sheet')
    expect(screen.getByText('Infographic')).toBeInTheDocument()
    // Toolbar controls.
    expect(
      screen.getByRole('button', { name: /next page/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /zoom in/i }),
    ).toBeInTheDocument()
    // Thumbnail rail renders 5 pages.
    expect(
      screen.getByRole('button', { name: /^go to page 1$/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /^go to page 5$/i }),
    ).toBeInTheDocument()
  })

  // (E-book magazine-viewer test removed — both Elite e-books now
  // ship real PDFs, so the `<EbookBody>` mock isn't reachable from
  // any current fixture. The mock stays in the codebase as a
  // fallback for any future e-book that lands without a PDF.)

  it('wires real download links when a template resource ships a downloadUrl', () => {
    renderAt('/resources/elite-cover-letter-template')
    expect(screen.getByText('Template')).toBeInTheDocument()
    expect(screen.getByText(/preview unavailable/i)).toBeInTheDocument()
    // Two download targets render — the title-row text-link and the
    // body CTA. When `downloadUrl` is set, BOTH become real <a>
    // elements pointing at the file.
    const links = screen.getAllByRole('link', { name: /download/i })
    expect(links.length).toBeGreaterThanOrEqual(2)
    for (const link of links) {
      expect(link).toHaveAttribute(
        'href',
        '/library/elite-cover-letter-template.docx',
      )
    }
  })

  it('renders the embedded PDF reader when a resource carries a pdfUrl', () => {
    renderAt('/resources/elite-critical-communication-skills')
    // The shell still renders the resource type badge (Article) —
    // pdfUrl swaps the BODY, not the meta.
    expect(screen.getByText('Article')).toBeInTheDocument()
    // The embedded reader is an <object> with aria-label naming the
    // resource + "PDF".
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
