import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { atlasHandoffVariantRender } from '@/components/prototype/atlasHandoffPreviewsRegistry'

/**
 * THE QUICK LINKS PREVIEWS SHOW THE ROWS THE HOME SHOWS — nothing more.
 *
 * ⚠ TWICE NOW, FROM TWO DIFFERENT CAUSES (2026-10-22). The gallery wrapped
 * the card in a `MemoryRouter`, which React Router 7 throws on inside the
 * app's own Router, so the whole handoff page rendered BLANK — and when that
 * was fixed the card fell back to its own defaults and drew seven rows where
 * the Home draws five, inventing Flashcards and Exam Simulator. Jillienne:
 * "dont add any links that are not there."
 *
 * So this pins both: that the renders render at all, and that the list is
 * `AtlasHomeJillMain`'s. It is the cheapest form of the prop-parity check the
 * handoff keeps needing — the same class as `bare`, `onCustomize` and `card`
 * before it.
 */
const HOME_ROWS = [
  'My Courses',
  'My Certificates',
  'Exam Information',
  'Applying for a License',
  'State Requirements',
]
/* The course's own pages. `withoutCoursePages` is what keeps them off this
   rail, and it is the prop the previews dropped. */
const NOT_ON_THE_RAIL = ['Flashcards', 'Exam Simulator']

describe('the Quick Links previews match the Home', () => {
  /* The CARD's own states. The three `Sheet — …` variants on this component
     render a cropped iframe of the page rather than the card, so there are no
     rows of ours to count in them. */
  for (const variant of ['Default', 'Hover / focus']) {
    it(`"${variant}" draws the Home's five rows and no others`, () => {
      const node = atlasHandoffVariantRender('atlas-home-quick-links', variant)
      expect(node, `no render registered for "${variant}"`).toBeTruthy()
      /* The handoff page sits inside the app's Router, so the preview has to
         survive being rendered inside one — the condition the MemoryRouter
         wrapper failed. */
      render(<MemoryRouter>{node}</MemoryRouter>)
      const rows = screen.getAllByRole('listitem').map((li) => li.textContent?.trim())
      expect(rows).toEqual(HOME_ROWS)
      for (const gone of NOT_ON_THE_RAIL) expect(screen.queryByText(gone)).toBeNull()
    })
  }
})
