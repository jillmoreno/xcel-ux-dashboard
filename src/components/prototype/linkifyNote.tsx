import type { CSSProperties, ReactNode } from 'react'

/**
 * URLs IN A BOARD NOTE, RENDERED AS LINKS — 2026-10-16, Jillienne ("make the
 * card notes clickable"), after `/share-branch` started putting the branch
 * build's address in a card's Quick note. The note was `{card.note}` in a
 * `<p>`, so the one thing the card existed to hand you was select-and-paste.
 *
 * ⚠ A NOTE IS UNTRUSTED TEXT. Anyone with the Hub link can author a card, so
 * this builds REACT NODES and never `dangerouslySetInnerHTML` — markup in a
 * note stays the characters somebody typed. The scheme allowlist is the other
 * half: only `http:` and `https:` are drawn as links, which is what keeps
 * `javascript:` and `data:` out of an `href`. Anything else stays plain text,
 * visible but inert, so a note is never silently swallowed either.
 *
 * `new URL()` is the parser rather than the regex — the regex only FINDS a
 * candidate, and a candidate that will not parse is left as text.
 */

/* Deliberately narrow: a scheme we allow, then anything that is not
   whitespace or a quote/angle. Bare `www.` and scheme-relative `//host` are
   NOT matched — guessing a scheme is how a note turns into a link somewhere
   the author did not name. */
const URL_CANDIDATE = /https?:\/\/[^\s<>"']+/gi

/* Sentence punctuation that trails a URL rather than belonging to it:
   "see https://x.test/page." — the stop is the sentence's. */
const TRAILING = /[.,;:!?]+$/

/** `)` is only trailing if the URL does not open its own bracket, so
 *  `…/Foo_(bar)` survives while `(see https://x.test)` does not keep it. */
function trimTrailing(url: string): { href: string; tail: string } {
  let href = url
  let tail = ''
  for (;;) {
    const punct = TRAILING.exec(href)
    if (punct) {
      tail = punct[0] + tail
      href = href.slice(0, -punct[0].length)
      continue
    }
    if (href.endsWith(')') && !href.includes('(')) {
      tail = ')' + tail
      href = href.slice(0, -1)
      continue
    }
    if (href.endsWith(']') && !href.includes('[')) {
      tail = ']' + tail
      href = href.slice(0, -1)
      continue
    }
    return { href, tail }
  }
}

/** http/https only — the allowlist that keeps `javascript:` out of an href. */
function safeHref(candidate: string): string | null {
  try {
    const parsed = new URL(candidate)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null
  } catch {
    return null
  }
}

/* ── HOW MUCH OF A URL A CARD CAN SHOW ───────────────────────────────────
 *
 * A board card is ~187px wide and its note column ~165px, which is about 28
 * characters a line. A Netlify BRANCH build address is 100+ characters —
 * `feat-e2e-invite-atlas-compass--ux-design-xceldashboard.netlify.app/…` —
 * so the first card `/share-branch` filed rendered its link as FIVE LINES of
 * wrapped URL, taller than everything else on the card put together. It did
 * not overflow; it just ate the card.
 *
 * So the TEXT is shortened and the `href` is not. Three rules, and the first
 * is the one that matters:
 *
 *   1. THE HOST'S BEGINNING IS NEVER ELIDED. Shortening a link's text is one
 *      character away from disguising where it goes, and on a board anyone
 *      can author that is worth being careful about. The head is kept, the
 *      MIDDLE is dropped, and the full address is in `title` and in the
 *      status bar on hover — so a reader can always see the real target.
 *   2. `https://` is dropped from the display only (conventional, and it is
 *      eight characters of a twenty-eight character line). `http://` is KEPT,
 *      because plain http is worth noticing.
 *   3. The tail is kept too, so two links that differ only in their path or
 *      query do not render identically.
 */
const DISPLAY_MAX = 58

export function shortenForDisplay(url: string): string {
  const shown = url.startsWith('https://') ? url.slice('https://'.length) : url
  if (shown.length <= DISPLAY_MAX) return shown
  /* ⚠ THE HEAD IS 38 CHARACTERS ON PURPOSE, and the number is not arbitrary:
     38 is the longest branch slug a Netlify branch build can have on this
     site (63-char DNS label, minus `--ux-design-xceldashboard` and the dots —
     we found the limit the hard way on 2026-10-16, when a 39-character branch
     had no reachable URL at all). So the whole branch name survives the
     shortening on every address `/share-branch` can produce, which is the one
     thing a reader needs to tell two branch builds apart.

     The tail is kept so two links on the same host do not render identically;
     the MIDDLE — `--ux-design-xceldashboard.netlify.app`, the same on every
     one of them — is what goes. */
  const head = Math.ceil((DISPLAY_MAX - 1) * 0.66)
  const tail = DISPLAY_MAX - 1 - head
  return `${shown.slice(0, head)}\u2026${shown.slice(-tail)}`
}

/**
 * A DEPLOY LINK GETS A NAME, NOT AN ADDRESS — 2026-10-16, Jillienne: "change
 * the link to be 'View Deploy Link' to avoid the long name".
 *
 * Even shortened, a branch build's address is three lines of machine noise in
 * a 187px card, and it is noise that says nothing a reader wants: the card's
 * TITLE already says which piece of work this is, so the address only has to
 * be followable, not readable.
 *
 * ⚠ SCOPED TO DEPLOY HOSTS, and deliberately not applied to every URL. A note
 * can hold a Figma file, a PRD, a Slack permalink — labelling those "View
 * Deploy Link" would be a plain lie, and labelling them all "View link" would
 * hide which of three links in a note is which. Everything that is not a
 * deploy keeps its shortened address.
 *
 * The full address is still in `title` and in the browser's status bar on
 * hover, which is what keeps a named link honest.
 */
function deployLabel(href: string): string | null {
  try {
    const { hostname } = new URL(href)
    /* Every build of this project — the Hub, a branch build, the test site —
       is a `*.netlify.app` host. Matching the suffix rather than a specific
       site means a renamed or added Netlify project is still recognised;
       matching `.netlify.app` and not `netlify.app` means `netlify.app`
       itself, or a lookalike like `notnetlify.app`, is not. */
    return hostname.endsWith('.netlify.app') ? 'View Deploy Link' : null
  } catch {
    return null
  }
}

export const noteLinkStyle: CSSProperties = {
  color: 'var(--ux-text-2)',
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  /* A named deploy link fits on one line, but a non-deploy URL keeps its
     (shortened) address and can still be longer than a card is wide — and a
     card a URL has stretched breaks the column. Break anywhere, never scroll. */
  overflowWrap: 'anywhere',
}

/**
 * Splits `text` into plain strings and anchors. Returns the original string
 * untouched (as a single-item array) when there is nothing to link, so a note
 * without a URL renders exactly as it did before this existed.
 */
export function linkifyNote(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  URL_CANDIDATE.lastIndex = 0

  for (let m = URL_CANDIDATE.exec(text); m; m = URL_CANDIDATE.exec(text)) {
    const { href, tail } = trimTrailing(m[0])
    const safe = safeHref(href)
    if (!safe) continue // leave it in the surrounding text, unlinked
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <a
        key={`link-${key++}`}
        href={safe}
        target="_blank"
        rel="noopener noreferrer"
        style={noteLinkStyle}
        /* ⚠ THE CARD IS DRAGGABLE AND THE COLUMN LISTENS ABOVE THIS. Without
           stopPropagation a click on the link is also a click on the card, so
           following a link could reorder the board behind the new tab. */
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        draggable={false}
        /* The full address, for hover and for anyone checking where this
           actually goes before clicking it. */
        title={href}
      >
        {deployLabel(href) ?? shortenForDisplay(href)}
      </a>,
    )
    if (tail) out.push(tail)
    last = m.index + m[0].length
  }

  if (out.length === 0) return [text]
  if (last < text.length) out.push(text.slice(last))
  return out
}
