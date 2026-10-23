import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider, designControlsFor } from '@/context/FeatureFlagContext'
import {
  INVITE_LINES_OF_AUTHORITY,
  INVITE_LOA_PARAM,
  INVITE_MISSING_DETAILS_FLAG,
  INVITE_STATE_PARAM,
  INVITE_STATES,
  inviteProductTitle,
  matchingStates,
  readInviteChoice,
} from '@/data/inviteMissingDetails'
import { INVITE_FLOW_FLAG } from '@/data/inviteFlows'
import { E2E_COURSE_TITLE_SHORT } from '@/pages/endToEndDemo'
import { InvitedProductDetailPageV2 } from '@/pages/InvitedProductDetailPageV2'
import { InvitedCheckoutPageV2 } from '@/pages/InvitedCheckoutPageV2'

/**
 * THE INCOMPLETE INVITATION — 2026-10-22, Jillienne's brief: the recruiter left
 * the state and line of authority blank, so the invite door does not know what
 * product to show and has to ask.
 *
 * ⚠ WHAT IS PINNED IS THE CONSEQUENCE, not the dialog. A modal that opens and
 * closes is easy to get right and worth almost nothing; the thing that makes
 * this feature work is that the ANSWER names the product, survives the hop to
 * checkout, and is not asked for twice. Those are the assertions below.
 */

/* jsdom HAS NO LAYOUT, and Invited Product Detail measures text to fit its
   course title (`lineWidths`, which walks `range.getClientRects()`). jsdom
   implements Range but not that method, so the page throws on mount — nothing
   to do with this suite's subject. Empty rects read as "nothing measured",
   which is the branch the fitter already takes before a paint. The same shim
   `EndToEndJourneyWalk.test.tsx` installs, and for the same reason. */
if (!('getClientRects' in Range.prototype)) {
  Object.defineProperty(Range.prototype, 'getClientRects', {
    value: () => [],
    writable: true,
    configurable: true,
  })
}

/** Types into the state search and takes the named option. */
async function pickState(user: ReturnType<typeof userEvent.setup>, state: string) {
  await user.type(screen.getByRole('combobox', { name: 'State' }), state)
  await user.click(screen.getByRole('option', { name: state }))
}

const PRODUCT_DETAIL = '/end-to-end-demo'
const CHECKOUT = '/end-to-end-demo/checkout'

function renderAt(path: string, search: string, element: React.ReactElement) {
  /* ⚠ `?ff=` IS READ FROM `window.location.search`, not from the MemoryRouter
     entry — both are set or the render falls back to catalog defaults. */
  window.history.replaceState({}, '', `${path}${search}`)
  return render(
    <MemoryRouter initialEntries={[`${path}${search}`]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Routes>
            <Route path={path} element={element} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/**
 * ⚠ THE INVITED ARM, PINNED — 2026-10-23, when `DEFAULT_INVITE_FLOW` moved to
 * `b2c-guest` so the Prototypes row opens the guest walk.
 *
 * Everything in this file is about what an INVITATION says and what happens
 * when a recruiter leaves its details out, which is the invited arm by
 * definition — a guest never had an invitation to be missing anything from.
 * These cases were reading the default instead of saying so, and a test
 * leaning on a default is really a test OF the default; there is one of those,
 * on purpose, in `InviteFlows.test.tsx`.
 */
const INVITED = `${INVITE_FLOW_FLAG}:b2b2c-email`
/** The invited arm, nothing else said. */
const INVITED_ONLY = `?ff=${INVITED}`
/** The flag on, and no answer yet. */
const ASKING = `?ff=${INVITE_MISSING_DETAILS_FLAG}:on,${INVITED}`
/** The flag on, with the pair already chosen. */
const ANSWERED =
  `?ff=${INVITE_MISSING_DETAILS_FLAG}:on,${INVITED}` +
  `&${INVITE_STATE_PARAM}=Texas&${INVITE_LOA_PARAM}=${encodeURIComponent('Property & Casualty')}`

describe('the missing-details flag', () => {
  const definition = FEATURE_FLAGS.find((f) => f.key === INVITE_MISSING_DETAILS_FLAG)

  it('is a design control scoped to the invite flow', () => {
    expect(definition?.surface).toBe('design')
    expect(definition?.surfaces).toEqual(['invite'])
  })

  it('defaults OFF', () => {
    /* ⚠ DELIBERATELY AGAINST the "flags default ON on your branch" rule. The
       email page names the course in the invitation's own words; opening on a
       modal that says we do not know it reads as a bug in the demo rather than
       as the case being explored. If this ever flips, it is a decision. */
    expect(definition?.defaultEnabled).toBe(false)
  })

  it('is on the design bar inside the flow and not outside it', () => {
    const inside = designControlsFor('eric-atlas-e2e', 'eric', 'invite')
    const outside = designControlsFor('eric-atlas-e2e', 'eric', null)
    expect(inside.map((f) => f.key)).toContain(INVITE_MISSING_DETAILS_FLAG)
    expect(outside.map((f) => f.key)).not.toContain(INVITE_MISSING_DETAILS_FLAG)
  })
})

describe('reading the choice out of the address', () => {
  it('needs both halves', () => {
    expect(readInviteChoice(new URLSearchParams())).toBeNull()
    expect(readInviteChoice(new URLSearchParams({ [INVITE_STATE_PARAM]: 'Texas' }))).toBeNull()
    expect(
      readInviteChoice(new URLSearchParams({ [INVITE_LOA_PARAM]: 'Personal Lines' })),
    ).toBeNull()
  })

  it('rejects a value that is not on offer', () => {
    /* A pasted link is user input. An unknown state must leave the flow
       asking, not name a product nobody sells. */
    expect(
      readInviteChoice(
        new URLSearchParams({
          [INVITE_STATE_PARAM]: 'Atlantis',
          [INVITE_LOA_PARAM]: 'Personal Lines',
        }),
      ),
    ).toBeNull()
    expect(
      readInviteChoice(
        new URLSearchParams({ [INVITE_STATE_PARAM]: 'Texas', [INVITE_LOA_PARAM]: 'Surety' }),
      ),
    ).toBeNull()
  })

  it('reads a valid pair', () => {
    expect(
      readInviteChoice(
        new URLSearchParams({
          [INVITE_STATE_PARAM]: 'Texas',
          [INVITE_LOA_PARAM]: 'Property & Casualty',
        }),
      ),
    ).toEqual({ state: 'Texas', lineOfAuthority: 'Property & Casualty' })
  })

  it('names the product from the pair', () => {
    expect(inviteProductTitle({ state: 'Texas', lineOfAuthority: 'Property & Casualty' })).toBe(
      'Texas Property & Casualty Pre-licensing',
    )
  })
})

describe('the state search', () => {
  it('covers all fifty states', () => {
    /* ⚠ FIFTY, NOT FIVE — 2026-10-22. The list was trimmed to the states the
       prototype has course content for, which meant a learner in Ohio typing
       their own state found nothing: a product that does not sell in Ohio. The
       search field is what made fifty affordable to show. */
    expect(INVITE_STATES).toHaveLength(50)
    expect(INVITE_STATES).toContain('Ohio')
    expect(INVITE_STATES).toContain('Wyoming')
  })

  it('narrows as you type, case-insensitively', () => {
    expect(matchingStates('new')).toEqual([
      'New Hampshire',
      'New Jersey',
      'New Mexico',
      'New York',
    ])
    expect(matchingStates('NEW')).toEqual(matchingStates('new'))
    expect(matchingStates(' texas ')).toEqual(['Texas'])
  })

  it('puts prefix matches before matches in the middle', () => {
    /* Someone typing the first letters of a name is naming it; a match in the
       middle is a coincidence. */
    const ar = matchingStates('ar')
    expect(ar.slice(0, 2)).toEqual(['Arizona', 'Arkansas'])
    expect(ar).toContain('Maryland')
    expect(ar.indexOf('Arizona')).toBeLessThan(ar.indexOf('Maryland'))
  })

  it('offers everything on an empty query, and nothing on a miss', () => {
    /* Empty returns all, so focusing the field lets someone browse rather than
       forcing them to guess a first letter. */
    expect(matchingStates('')).toHaveLength(50)
    expect(matchingStates('   ')).toHaveLength(50)
    expect(matchingStates('zzz')).toEqual([])
  })

  it('says so when nothing matches', async () => {
    const user = userEvent.setup()
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    await user.type(screen.getByRole('combobox', { name: 'State' }), 'zzz')
    expect(screen.getByRole('status')).toHaveTextContent('No states match')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('is navigable by keyboard alone', async () => {
    const user = userEvent.setup()
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    const field = screen.getByRole('combobox', { name: 'State' })

    await user.type(field, 'new ')
    /* ⚠ FOCUS STAYS IN THE INPUT while arrowing — the active row is pointed at
       by `aria-activedescendant`. Moving real focus into the list is what
       breaks typing, and is the usual way a hand-rolled typeahead goes wrong. */
    await user.keyboard('{ArrowDown}')
    expect(field).toHaveFocus()
    expect(field).toHaveAttribute('aria-activedescendant')

    await user.keyboard('{Enter}')
    expect(field).toHaveValue('New Jersey')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('clears the pick when the learner edits the text again', async () => {
    /* The field must not read "Tex" while still holding Texas — the CTA would
       be enabled for a state nobody has finished choosing. */
    const user = userEvent.setup()
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    await pickState(user, 'Texas')
    await user.click(screen.getByRole('radio', { name: 'Personal Lines' }))
    expect(screen.getByRole('button', { name: 'Show my course' })).toBeEnabled()

    await user.type(screen.getByRole('combobox', { name: 'State' }), '{Backspace}')
    expect(screen.getByRole('button', { name: 'Show my course' })).toBeDisabled()
  })

  it('Escape closes the list before it closes the dialog', async () => {
    const user = userEvent.setup()
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    await user.type(screen.getByRole('combobox', { name: 'State' }), 'new')
    expect(screen.getByRole('listbox')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    /* …and the dialog is still up. A learner dismissing an open list does not
       expect the whole modal to go with it. */
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('Invited Product Detail', () => {
  it('opens on the advertised course when the invitation was complete', () => {
    renderAt(PRODUCT_DETAIL, INVITED_ONLY, <InvitedProductDetailPageV2 />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText(new RegExp(E2E_COURSE_TITLE_SHORT)).length).toBeGreaterThan(0)
  })

  it('does not let the invitation name a course it did not carry', async () => {
    /* ⚠ THE CONTRADICTION THIS ARM IS MOST LIKELY TO REGROW. The welcome
       banner's course name was hard-coded, which put the recruiter's
       invitation naming the exact course two inches above a modal saying we do
       not know which course they meant. */
    const user = userEvent.setup()
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    const welcome = screen.getByText(/has invited you to/).closest('p')!
    expect(welcome.textContent).not.toMatch(/Pre-licensing/)

    await pickState(user, 'Texas')
    await user.click(screen.getByRole('radio', { name: 'Property & Casualty' }))
    await user.click(screen.getByRole('button', { name: 'Show my course' }))

    /* …and once they have picked, it names THEIR course. */
    expect(screen.getByText(/has invited you to/).closest('p')!.textContent).toMatch(
      /Texas Property & Casualty Pre-licensing/,
    )
  })

  it('leaves the complete invitation’s wording alone', () => {
    /* The normal arm is untouched by all of the above — it still names the
       invitation's advertised course, in the invitation's own short form. */
    renderAt(PRODUCT_DETAIL, INVITED_ONLY, <InvitedProductDetailPageV2 />)
    expect(screen.getByText(/has invited you to/).closest('p')!.textContent).toMatch(
      new RegExp(E2E_COURSE_TITLE_SHORT),
    )
  })

  it('asks when the invitation was missing its details', () => {
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    expect(screen.getByRole('dialog', { name: 'What are you licensing for?' })).toBeInTheDocument()
  })

  it('does not name an invitation a broadcast link never sent', async () => {
    /* ⚠ SAME CLASS AS THE WELCOME BANNER. "Your invitation didn't include
       these details" is true of a recruiter's omission and false of a QR code
       on a poster — there was no invitation to leave anything out of. */
    window.history.replaceState({}, '', `${PRODUCT_DETAIL}?ff=invite-flow-journey:qr-social`)
    render(
      <MemoryRouter initialEntries={[`${PRODUCT_DETAIL}?ff=invite-flow-journey:qr-social`]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Routes>
              <Route path={PRODUCT_DETAIL} element={<InvitedProductDetailPageV2 />} />
            </Routes>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
    const why = screen.getByRole('dialog').textContent ?? ''
    expect(why).toMatch(/This link is shared with everyone/)
    expect(why).not.toMatch(/Your invitation/)
  })

  it('says why it is asking', () => {
    /* A form appearing with no reason, to someone who just clicked a link in
       an invitation their employer sent, reads as a fault. */
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    expect(screen.getByText(/invitation didn’t include these details/i)).toBeInTheDocument()
  })

  it('offers every line of authority as a pill', () => {
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    for (const option of INVITE_LINES_OF_AUTHORITY) {
      expect(screen.getByRole('radio', { name: option })).toBeInTheDocument()
    }
  })

  it('offers the state as a search field, not fifty pills', () => {
    /* ⚠ 2026-10-22, Jillienne: "we dont want to have to show 50 pills in a
       modal". The assertion is on the CONTROL, because the regression to guard
       against is someone rendering the list again when the state count
       changes. */
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    expect(screen.getByRole('combobox', { name: 'State' })).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Texas' })).not.toBeInTheDocument()
    /* Only the three lines of authority are radios. */
    expect(screen.getAllByRole('radio')).toHaveLength(INVITE_LINES_OF_AUTHORITY.length)
  })

  it('will not continue until both halves are picked', async () => {
    const user = userEvent.setup()
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    const cta = screen.getByRole('button', { name: 'Show my course' })
    expect(cta).toBeDisabled()

    await pickState(user, 'Texas')
    expect(cta).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Property & Casualty' }))
    expect(cta).toBeEnabled()
  })

  it('names the product from the pick, and closes', async () => {
    const user = userEvent.setup()
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    await pickState(user, 'Texas')
    await user.click(screen.getByRole('radio', { name: 'Property & Casualty' }))
    await user.click(screen.getByRole('button', { name: 'Show my course' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      screen.getAllByText(/Texas Property & Casualty Pre-licensing/).length,
    ).toBeGreaterThan(0)
  })

  it('does not ask again once the pair is in the address', () => {
    /* ⚠ THE RELOAD CASE. The flag is still ON here — it says the recruiter
       left the fields blank, which stays true. What changed is that we now
       know the answer, so asking again would be the flow forgetting. */
    renderAt(PRODUCT_DETAIL, ANSWERED, <InvitedProductDetailPageV2 />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Texas Property & Casualty Pre-licensing/).length).toBeGreaterThan(0)
  })

  it('does not strand the learner when Escape closes it', async () => {
    const user = userEvent.setup()
    renderAt(PRODUCT_DETAIL, ASKING, <InvitedProductDetailPageV2 />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    /* ⚠ NEVER TRAP A KEYBOARD USER IN A DIALOG — so Escape closes it. But the
       page behind was the reason for asking, so it has to say that it still
       does not know, and offer the way back in. Without this the learner is
       silently dropped onto a product nobody established they want. */
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(
      'We still don’t know which course is right for you.',
    )

    await user.click(
      screen.getByRole('button', { name: 'Choose your state and line of authority' }),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('the pick carries through the flow', () => {
  it('names the chosen course in checkout’s order summary', () => {
    renderAt(CHECKOUT, ANSWERED, <InvitedCheckoutPageV2 />)
    expect(screen.getAllByText(/Texas Property & Casualty Pre-licensing/).length).toBeGreaterThan(0)
  })

  it('falls back to the advertised course when nothing was picked', () => {
    renderAt(CHECKOUT, INVITED_ONLY, <InvitedCheckoutPageV2 />)
    expect(screen.getAllByText(new RegExp(E2E_COURSE_TITLE_SHORT)).length).toBeGreaterThan(0)
  })

  it('never asks on checkout — the question belongs to the door', () => {
    /* The modal is mounted by Invited Product Detail alone. A learner who deep
       links straight to checkout with the flag on is past the point where the
       product is chosen, and a dialog there would interrupt a purchase. */
    renderAt(CHECKOUT, ASKING, <InvitedCheckoutPageV2 />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
