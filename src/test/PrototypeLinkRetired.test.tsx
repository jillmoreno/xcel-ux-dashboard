import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { PrototypeLinkRetiredPage } from '@/pages/PrototypeLinkRetiredPage'
import { PROTOTYPE_FEATURES, PROTOTYPE_SCOPES } from '@/data/prototypeFeatures'

/**
 * THE DEACTIVATED PROTOTYPES LINKS — 2026-11-17, Jillienne: "deactivate the
 * links to the main prototypes and stage prototypes so that the users get an
 * error screen … on the error screen shown to the user is where the message
 * should be."
 *
 * The rendered-href half of this is pinned in `UxDashboard.smoke.test.tsx`
 * (see `expectedHref` there, which is also the single place to edit when the
 * new links arrive). This file pins the two things that file is not about:
 * that the deactivation is RECOVERABLE — every deactivated row still carries
 * its real route, so coming back is one deleted line — and that the screen the
 * click lands on actually carries the message.
 */

const openingPrototypeRows = PROTOTYPE_FEATURES.filter(
  (f) => f.category === 'prototype' && f.status !== 'coming-soon',
)

function renderScreen(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/prototype-unavailable" element={<PrototypeLinkRetiredPage />} />
        <Route path="/prototype-unavailable/:featureId" element={<PrototypeLinkRetiredPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('the deactivated Prototypes links', () => {
  it('every Prototypes row that opens is deactivated — Main and Stage alike', () => {
    /* Written out as "all of them" rather than by id, because the ask was the
       section, not a row: a sixth surface released while the links are off
       must be off too, or one door quietly stays open. */
    expect(openingPrototypeRows.length).toBeGreaterThan(0)
    for (const f of openingPrototypeRows) {
      expect(f.linkRetired, `${f.id}: the Prototypes links are deactivated`).toBe(true)
    }
  })

  it('a deactivated row keeps its real route, so reactivating is one deleted line', () => {
    // The whole point of not using `status: 'coming-soon'` and not blanking
    // `to`. The route's SHAPE is held to the one-build rule by the smoke test;
    // what matters here is simply that it is still there.
    for (const f of openingPrototypeRows) {
      expect(f.to, `${f.id} must keep its route on record`).toBeTruthy()
      expect(f.externalUrl, `${f.id}: a Prototypes row is a route, never a document`).toBeUndefined()
    }
  })

  it('no row outside Prototypes is deactivated', () => {
    // `linkRetired` means "this surface's Prototypes link is off". On a
    // handoff or an Exploration row it would just be a broken link.
    for (const f of PROTOTYPE_FEATURES) {
      if (f.category === 'prototype') continue
      expect(f.linkRetired, `${f.id} is not a Prototypes row and must not be deactivated`).toBeUndefined()
    }
  })

  it('the screen says the link is off, names the surface, and says who has the new one', () => {
    const compass = PROTOTYPE_FEATURES.find((f) => f.id === 'xcel-compass')!
    renderScreen('/prototype-unavailable/xcel-compass')

    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/no longer active/i)
    // The surface it was for, by name — a reader who followed a pasted link
    // needs to know which door they were at.
    expect(document.body.textContent).toContain(compass.title)
    // THE MESSAGE, and where to go for the new link.
    expect(document.body.textContent).toMatch(/being replaced/i)
    expect(document.body.textContent).toContain('UX Team/Product Owner')
    // And it says the work is still there, so "the link is off" does not read
    // as "the prototype is gone".
    expect(document.body.textContent).toMatch(/nothing has been deleted/i)
    expect(screen.getByRole('link', { name: 'Back to the Hub' })).toHaveAttribute('href', '/')
  })

  it('NO INDIVIDUAL IS NAMED on the screen, for any row', () => {
    /* 2026-11-17, Jillienne reading the live screen: "I don't want my name in
       there." It named the scope's owner until then. The roster is the thing
       to keep out — a name here is in front of every stakeholder who follows a
       stale link, and it would also have to be kept in step with
       `PROTOTYPE_SCOPES`. Checked across every row, not just the one above. */
    const names = [...new Set(PROTOTYPE_SCOPES.map((s) => s.owner))]
    expect(names.length).toBeGreaterThan(0)
    for (const f of openingPrototypeRows) {
      document.body.innerHTML = ''
      renderScreen(`/prototype-unavailable/${f.id}`)
      const text = document.body.textContent ?? ''
      expect(text).toContain('UX Team/Product Owner')
      for (const owner of names) {
        // Split on "&" so "Afsana & Eric" fails on either half.
        for (const part of owner.split('&').map((p) => p.trim())) {
          expect(text, `${f.id} names ${part}`).not.toContain(part)
        }
      }
    }
  })

  it('it says which build the reader was reaching for', () => {
    /* Asserted on the LEAD line, not the whole screen: the message below it
       names both builds ("The Main and Stage prototype links are being
       replaced"), so a bare `toContain('Stage')` would pass under Main. */
    renderScreen('/prototype-unavailable/xcel-compass')
    expect(document.body.textContent).toMatch(/The Main link for/)
    expect(document.body.textContent).not.toMatch(/The Stage link for/)

    document.body.innerHTML = ''
    renderScreen('/prototype-unavailable/xcel-compass?build=stage')
    expect(document.body.textContent).toMatch(/The Stage link for/)
    expect(document.body.textContent).not.toMatch(/The Main link for/)
  })

  it('a link pasted without a row still gets the message', () => {
    /* The bare path is the fallback — an old copied link, or a row id that has
       since been renamed. It cannot name a surface or an owner, so it must not
       pretend to; the message itself still has to land. */
    renderScreen('/prototype-unavailable')
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/no longer active/i)
    expect(document.body.textContent).toMatch(/being replaced/i)
    expect(document.body.textContent).toContain('UX Team/Product Owner')
    expect(screen.getByRole('link', { name: 'Back to the Hub' })).toHaveAttribute('href', '/')
  })
})
