import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { linkifyNote, shortenForDisplay } from '@/components/prototype/linkifyNote'

/**
 * URLs IN A TO DO BOARD CARD'S NOTE (2026-10-16). `/share-branch` puts the
 * branch build's address in a card's Quick note, and the note rendered as
 * plain text — so the one thing the card existed to hand you had to be
 * selected and pasted.
 *
 * ⚠ HALF THESE CASES ARE THE SCHEME ALLOWLIST, and they are the reason this
 * file is longer than the feature. A card is authored by anyone with the Hub
 * link, so a note is UNTRUSTED TEXT: the risk of "make it clickable" is not a
 * broken link, it is `javascript:` reaching an `href`. The rule is that only
 * http and https are ever drawn as anchors and everything else stays visible
 * but inert — visible matters too, or a note could be silently swallowed.
 */

const show = (text: string) => render(<p>{linkifyNote(text)}</p>)
afterEach(cleanup)

describe('linkifyNote', () => {
  it('leaves a note with no URL exactly as it was', () => {
    show('Home, under Current Progress. Is the streak motivating or nagging?')
    expect(screen.getByText(/Is the streak motivating/)).toBeInTheDocument()
    expect(document.querySelector('a')).toBeNull()
  })

  it('links an http(s) URL, and opens it safely in a new tab', () => {
    show('See https://example.test/page for the build.')
    const a = screen.getByRole('link') as HTMLAnchorElement
    expect(a).toHaveAttribute('href', 'https://example.test/page')
    expect(a).toHaveAttribute('target', '_blank')
    // noreferrer as well as noopener: the board is behind a password and the
    // referrer would name it to wherever a note points.
    expect(a.getAttribute('rel')).toContain('noopener')
    expect(a.getAttribute('rel')).toContain('noreferrer')
    // The words around it survive.
    expect(screen.getByText(/See/)).toBeInTheDocument()
    expect(screen.getByText(/for the build/)).toBeInTheDocument()
  })

  it('keeps the query string — the walk is a query string', () => {
    // `?demo=1&journey=full` IS the feature on this branch; a linkifier that
    // stopped at `?` would hand reviewers a different page than the one shared.
    show('https://branch--site.netlify.app/end-to-end-demo?demo=1&journey=full')
    expect(screen.getByRole('link')).toHaveAttribute(
      'href',
      'https://branch--site.netlify.app/end-to-end-demo?demo=1&journey=full',
    )
  })

  it('does NOT link javascript:, data: or file: — they stay as text', () => {
    for (const hostile of [
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'file:///etc/passwd',
    ]) {
      cleanup()
      show(`look at ${hostile} here`)
      expect(document.querySelector('a'), `${hostile} must not become a link`).toBeNull()
      // …and it is still READABLE. Dropping it would hide what someone wrote.
      expect(document.body.textContent).toContain(hostile)
    }
  })

  it('never renders markup from a note', () => {
    // React escapes by construction; this fails loudly if anyone ever
    // "improves" this with dangerouslySetInnerHTML.
    show('<img src=x onerror=alert(1)> and <b>bold</b>')
    expect(document.querySelector('img')).toBeNull()
    expect(document.querySelector('b')).toBeNull()
    expect(document.body.textContent).toContain('<b>bold</b>')
  })

  it('leaves a sentence’s full stop out of the href', () => {
    show('Shared at https://example.test/build.')
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.test/build')
    expect(document.body.textContent).toContain('build.')
  })

  it('keeps a bracket that belongs to the URL, drops one that does not', () => {
    show('a https://example.test/Foo_(bar) b')
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.test/Foo_(bar)')
    cleanup()
    show('(see https://example.test/x)')
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.test/x')
    expect(document.body.textContent).toContain(')')
  })

  it('links several URLs in one note', () => {
    show('row https://a.test/one card https://b.test/two')
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([
      'https://a.test/one',
      'https://b.test/two',
    ])
  })

  it('does not invent a scheme for bare www or //host', () => {
    // Guessing a scheme is how a note becomes a link somewhere its author
    // never named.
    show('www.example.test and //example.test')
    expect(document.querySelector('a')).toBeNull()
  })
})

describe('shortening what a card SHOWS, never where it goes', () => {
  /* A card is ~187px wide. The first card `/share-branch` filed rendered its
     branch-build URL as five wrapped lines, taller than the rest of the card
     together. The text is shortened; the href never is. */
  const BRANCH =
    'https://feat-e2e-invite-atlas-compass--ux-design-xceldashboard.netlify.app/end-to-end-demo?demo=1&journey=full'

  it('keeps the full address in the href and in the title', () => {
    render(<p>{linkifyNote(`see ${BRANCH} now`)}</p>)
    const a = screen.getByRole('link')
    expect(a).toHaveAttribute('href', BRANCH)
    // Hover and assistive tech can always reach the real target.
    expect(a).toHaveAttribute('title', BRANCH)
    expect(a.textContent!.length).toBeLessThan(BRANCH.length)
  })

  it('never elides the START of the host — the part that says where you are going', () => {
    // Shortening a link's text is one character from disguising it. The head
    // stays; the middle is what goes.
    expect(shortenForDisplay(BRANCH).startsWith('feat-e2e-invite-atlas-compass')).toBe(true)
    expect(shortenForDisplay(BRANCH)).toContain('\u2026')
  })

  it('keeps the tail, so two links on one host do not render identically', () => {
    const a = shortenForDisplay('https://x.test/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/one')
    const b = shortenForDisplay('https://x.test/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa/two')
    expect(a).not.toEqual(b)
  })

  it('drops https:// from the display but keeps http://', () => {
    // Plain http is worth noticing, so it is never hidden.
    expect(shortenForDisplay('https://short.test/a')).toBe('short.test/a')
    expect(shortenForDisplay('http://short.test/a')).toBe('http://short.test/a')
  })

  it('leaves a short URL completely alone', () => {
    expect(shortenForDisplay('https://x.test/a')).toBe('x.test/a')
    expect(shortenForDisplay('https://x.test/a')).not.toContain('\u2026')
  })
})
