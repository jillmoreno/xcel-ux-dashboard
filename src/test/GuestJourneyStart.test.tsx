import { describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider, useFeatureFlags } from '@/context/FeatureFlagContext'
import {
  INVITE_FLOW_FLAG,
  SPLIT_JOURNEY_RAIL_FLAG,
  PARTNER_CODE_ASK_FLAG,
  EMAIL_VALIDATED_PARAM,
  ORDER_CONFIRMATION_STYLE_FLAG,
  PARTNER_CODE_PARAM,
  asksForPartnerCode,
  entryPathFor,
  type InviteFlowId,
} from '@/data/inviteFlows'
import { INVITE_LOA_PARAM, INVITE_STATE_PARAM } from '@/data/inviteMissingDetails'
import {
  CART_PACKAGE_PARAM,
  FINDER_EDUCATION,
  FINDER_LINES_OF_AUTHORITY,
  FINDER_STATES,
  cartPackage,
  packagesFor,
} from '@/data/xcelCourseFinder'
import { LOADING_HANDOFF_MS } from '@/components/e2e/XcelLoadingPage'
import { START_POINTS } from '@/pages/endToEndDemo'
import { InviteFlowEntrySync } from '@/pages/EndToEndPageSync'
import { InviteEmailPageV2 } from '@/pages/InviteEmailPageV2'
import { InvitedCheckoutPageV2 } from '@/pages/InvitedCheckoutPageV2'
import { XcelFindCoursePage } from '@/pages/XcelFindCoursePage'
import { XcelPackagesPage } from '@/pages/XcelPackagesPage'
import { XcelCartPage } from '@/pages/XcelCartPage'
import { XcelQrInvitePage } from '@/pages/XcelQrInvitePage'
import { XcelPartnerCodePage } from '@/pages/XcelPartnerCodePage'
import { XcelOrderConfirmationPage } from '@/pages/XcelOrderConfirmationPage'
import { XcelActivationEmailPage } from '@/pages/XcelActivationEmailPage'
import { InvitedProductDetailPageV2 } from '@/pages/InvitedProductDetailPageV2'

/**
 * THE GUEST JOURNEY'S FIRST TWO SCREENS — 2026-10-22, Jillienne: "Guest
 * Checkout. Needs to start sooner."
 *
 * ⚠ WHAT IS PINNED IS THE HAND-OFF, not the marketing page. The screens
 * themselves are a rebuild of xcelsolutions.com and their copy and layout are
 * expected to move; what must not move is that the finder's three picks reach
 * the packages page, reach the product page, and ANSWER the options modal so a
 * guest is not asked twice for something they have already said.
 */

/* jsdom HAS NO LAYOUT, and Invited Product Detail measures text to fit its
   course title. The same shim `EndToEndJourneyWalk.test.tsx` installs. */
if (!('getClientRects' in Range.prototype)) {
  Object.defineProperty(Range.prototype, 'getClientRects', {
    value: () => [],
    writable: true,
    configurable: true,
  })
}

function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where" data-path={pathname} data-search={search} />
}

function renderJourney(entry: string) {
  window.history.replaceState({}, '', entry)
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <AccountProvider>
        <FeatureFlagProvider>
          <Where />
          <Routes>
            <Route path="/end-to-end-demo/find" element={<XcelFindCoursePage />} />
            <Route path="/end-to-end-demo/packages" element={<XcelPackagesPage />} />
            <Route path="/end-to-end-demo/cart" element={<XcelCartPage />} />
            <Route path="/end-to-end-demo/partner-code" element={<XcelPartnerCodePage />} />
            <Route
              path="/end-to-end-demo/order-confirmation"
              element={<XcelOrderConfirmationPage />}
            />
            <Route
              path="/end-to-end-demo/activation-email"
              element={<XcelActivationEmailPage />}
            />
            <Route path="/end-to-end-demo/checkout" element={<InvitedCheckoutPageV2 />} />
            <Route path="/end-to-end-demo/qr" element={<XcelQrInvitePage />} />
            <Route path="/end-to-end-demo" element={<InvitedProductDetailPageV2 />} />
          </Routes>
        </FeatureFlagProvider>
      </AccountProvider>
    </MemoryRouter>,
  )
}

/**
 * Press Checkout and answer the partner-code question if this arm asks one.
 *
 * ⚠ THE GUEST JOURNEY GREW A STEP (2026-10-22) and these walks have to pass
 * through it. Answering NO keeps them on the guest path they are about — the
 * tests that are ABOUT the question live in their own describe below.
 */
async function checkoutPastPartnerCode(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Checkout' }))
  const no = screen.queryByRole('button', { name: 'NO' })
  if (no) await user.click(no)
}

const at = () => screen.getByTestId('where').getAttribute('data-path')
const query = () => new URLSearchParams(screen.getByTestId('where').getAttribute('data-search') ?? '')

const GUEST = '/end-to-end-demo/find?ff=invite-flow-journey:b2c-guest'

describe('where each flow starts', () => {
  it('sends a guest to the public site and an invited learner to the email', () => {
    /* ⚠ THE WHOLE POINT OF THE ASK. A guest has no invitation to click, so
       opening their flow on an invitation email opens it on a screen that flow
       has no version of. */
    expect(entryPathFor('b2c-guest')).toBe('/end-to-end-demo/find')
    expect(entryPathFor('b2b2c-email')).toBe('/end-to-end-demo/email')
    expect(entryPathFor('b2b2c-no-email')).toBe('/end-to-end-demo/email')
    /* The verified arm is invited too — same letter, the proof comes later. */
    expect(entryPathFor('b2b2c-verified')).toBe('/end-to-end-demo/email')
    /* A signed-in customer starts on the public site, as a guest does. */
    expect(entryPathFor('xcel-signed-in')).toBe('/end-to-end-demo/find')
    /* ⚠ AND QR / SOCIAL STARTS ON THE PARTNER'S SHARE CARD — 2026-10-23,
       changed from `/end-to-end-demo`, which is where a SCAN lands. Starting
       there skipped the only screen that explains where the link came from and
       made the one flow that begins outside the learner's hands look exactly
       like the three that don't. */
    expect(entryPathFor('qr-social')).toBe('/end-to-end-demo/qr')
  })

  it('the QR card is the partner\u2019s screen, and says whose it is', async () => {
    const user = userEvent.setup()
    renderJourney(`/end-to-end-demo/qr?ff=${INVITE_FLOW_FLAG}:qr-social`)

    expect(screen.getByRole('heading', { name: /Scan to start your licensing course/ })).toBeInTheDocument()
    /* The attribution the discount downstream rests on. */
    expect(screen.getByText(/Sunrise Bank · Tampa Office/)).toBeInTheDocument()
    /* ⚠ THE URL IS PRINTED UNDER THE CODE. A code nobody can scan — a bad
       camera, a printed sheet, a screen reader — still has to be reachable. */
    expect(screen.getAllByText(/xcelsolutions\.com\/invite\//).length).toBeGreaterThan(0)
    expect(screen.getByRole('img', { name: /QR code for/ })).toBeInTheDocument()
    /* The partner's two actions, neither wired: the share sheet and the camera
       roll belong to the phone, not to the product. */
    expect(screen.getByRole('button', { name: 'Share' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save to Photos' })).toBeInTheDocument()

    /* ⚠ A REVIEWER AT A LAPTOP CANNOT SCAN, so the demo performs the crossing
       and says that is what it is doing. */
    await user.click(screen.getByRole('button', { name: /Scan the code/ }))
    expect(at()).toBe('/end-to-end-demo')
  })

  it('keeps the Start control lit on the two new screens', () => {
    /* Without this the control goes quiet for the first two screens of a flow
       it is supposed to name, which reads as having left the invite flow. */
    const invite = START_POINTS['invite-checkout']
    expect(invite.also).toContain('/end-to-end-demo/find')
    expect(invite.also).toContain('/end-to-end-demo/packages')
  })
})

describe('the course finder', () => {
  it('offers the real option lists', () => {
    /* ⚠ READ OFF THE LIVE SITE, not invented — the Figma node for this screen
       is a flattened screenshot with no layers. 51 states because the District
       of Columbia sells licences, and FIVE lines of authority because XCEL
       sells standalone Life and standalone Health. */
    expect(FINDER_STATES).toHaveLength(51)
    expect(FINDER_STATES).toContain('District of Columbia')
    expect(FINDER_LINES_OF_AUTHORITY).toHaveLength(5)
    expect(FINDER_LINES_OF_AUTHORITY).toContain('Life')
    expect(FINDER_LINES_OF_AUTHORITY).toContain('Health')
    expect(FINDER_EDUCATION).toContain('Get License')
  })

  it('spells the lines of authority the way the live site does', () => {
    /* A guest who picks "Life and Health" and lands on a page headed "Life &
       Health" has been handed two names for one thing in one journey. */
    expect(FINDER_LINES_OF_AUTHORITY).toContain('Life and Health')
    expect(FINDER_LINES_OF_AUTHORITY).not.toContain('Life & Health')
  })

  it('cascades: Education waits for State, Line of authority waits for Education', async () => {
    const user = userEvent.setup()
    renderJourney(GUEST)
    const state = screen.getByLabelText('State')
    const education = screen.getByLabelText('Education')
    const loa = screen.getByLabelText('Line of authority')

    expect(education).toBeDisabled()
    expect(loa).toBeDisabled()

    await user.selectOptions(state, 'Florida')
    expect(education).toBeEnabled()
    expect(loa).toBeDisabled()

    await user.selectOptions(education, 'Get License')
    expect(loa).toBeEnabled()
  })

  it('clears the picks after it when an earlier one changes', async () => {
    /* The live site's behaviour: a line of authority chosen under one state
       must not survive into another. */
    const user = userEvent.setup()
    renderJourney(GUEST)
    await user.selectOptions(screen.getByLabelText('State'), 'Florida')
    await user.selectOptions(screen.getByLabelText('Education'), 'Get License')
    await user.selectOptions(screen.getByLabelText('Line of authority'), 'Life and Health')
    expect(screen.getByRole('button', { name: 'Find courses' })).toBeEnabled()

    await user.selectOptions(screen.getByLabelText('State'), 'Texas')
    expect(screen.getByLabelText('Education')).toHaveValue('')
    expect(screen.getByLabelText('Line of authority')).toHaveValue('')
    expect(screen.getByRole('button', { name: 'Find courses' })).toBeDisabled()
  })

  it('will not search until all three are picked', async () => {
    const user = userEvent.setup()
    renderJourney(GUEST)
    const find = screen.getByRole('button', { name: 'Find courses' })
    expect(find).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('State'), 'Florida')
    expect(find).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Education'), 'Get License')
    expect(find).toBeDisabled()
    await user.selectOptions(screen.getByLabelText('Line of authority'), 'Life and Health')
    expect(find).toBeEnabled()
  })
})

describe('the packages page', () => {
  it('names the packages from the pick, at the live site’s prices', () => {
    const [premier, standard] = packagesFor('Florida', 'Life and Health')
    expect(premier.name).toBe('Florida Life and Health Pre-licensing Premier')
    expect(premier.price).toBe('$299.00')
    expect(premier.ribbon).toBe('Pass Guarantee')
    expect(standard.name).toBe('Florida Life and Health Pre-licensing')
    /* ⚠ THE SAME $199 THE REST OF THE FLOW CALLS THE LIST PRICE, so a guest's
       journey adds up from here to the order summary. */
    expect(standard.price).toBe('$199.00')
  })

  it('describes the course the learner actually picked', () => {
    /* The live page's copy names its own course; lifting it verbatim told a
       Property and Casualty buyer about Life & Health. */
    const [, standard] = packagesFor('Texas', 'Property and Casualty')
    expect(standard.blurb).toMatch(/Property and Casualty Pre-licensing course/)
    expect(standard.blurb).not.toMatch(/Life & Health/)
  })

  it('holds the packages back until a state is picked', async () => {
    /* ⚠ THE CARDS CARRY A STATE IN THEIR OWN NAMES. Showing them before one is
       picked would name a course nobody has chosen. */
    const user = userEvent.setup()
    renderJourney('/end-to-end-demo/packages?loa=Life+and+Health')
    expect(screen.queryByRole('button', { name: 'Add to Cart' })).not.toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Select your state')

    await user.selectOptions(screen.getByLabelText('Select a state'), 'Wisconsin')
    expect(screen.getAllByRole('button', { name: 'Add to Cart' })).toHaveLength(2)
  })

  it('names the course from both picks, and puts the state in the breadcrumb', async () => {
    const user = userEvent.setup()
    renderJourney('/end-to-end-demo/packages?loa=Property+and+Casualty')
    expect(
      screen.getByRole('heading', { name: 'Choose Your Property and Casualty Pre-Licensing Package' }),
    ).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Select a state'), 'Wisconsin')
    expect(
      screen.getByRole('heading', { name: 'Wisconsin Property and Casualty Pre-licensing' }),
    ).toBeInTheDocument()
    /* The breadcrumb gains the state — the page confirming the pick without a
       second message. */
    expect(screen.getByLabelText('Breadcrumb').textContent).toMatch(
      /Home.*Wisconsin.*Get License.*Property and Casualty/,
    )
  })

  it('sends them to the homepage when the page is opened with no course', () => {
    /* No line of authority means it was not reached through the nav. */
    renderJourney('/end-to-end-demo/packages')
    expect(at()).toBe('/end-to-end-demo/find')
  })
})

describe('the walk', () => {
  /** The route Jillienne walked: Get License → Life and Health, then a state. */
  async function walkTheNav(user: ReturnType<typeof userEvent.setup>) {
    await user.click(screen.getByRole('button', { name: /Get License/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Life and Health' }))
    await user.selectOptions(screen.getByLabelText('Select a state'), 'Florida')
  }

  /** The homepage's own second door to the same place. */
  async function findCourses(user: ReturnType<typeof userEvent.setup>) {
    await user.selectOptions(screen.getByLabelText('State'), 'Florida')
    await user.selectOptions(screen.getByLabelText('Education'), 'Get License')
    await user.selectOptions(screen.getByLabelText('Line of authority'), 'Life and Health')
    await user.click(screen.getByRole('button', { name: 'Find courses' }))
  }

  it('reaches the course page through the Get License menu', async () => {
    /* ⚠ THE ROUTE A GUEST ACTUALLY TAKES — 2026-10-22: "user goes to get
       license > life and health, to get to the next page". The nav decides
       WHAT, the page decides WHERE. */
    const user = userEvent.setup()
    renderJourney(GUEST)
    await user.click(screen.getByRole('button', { name: /Get License/ }))
    expect(screen.getAllByRole('menuitem')).toHaveLength(6)

    await user.click(screen.getByRole('menuitem', { name: 'Life and Health' }))
    expect(at()).toBe('/end-to-end-demo/packages')
    expect(query().get(INVITE_LOA_PARAM)).toBe('Life and Health')
    /* …and no state yet: that is the next page's question. */
    expect(query().get(INVITE_STATE_PARAM)).toBeNull()
  })

  it('confirms the add, listing what is in the bundle', async () => {
    /* ⚠ THE CONTENTS ARE WHY THIS IS A DIALOG AND NOT A TOAST. "Premier" does
       not say it includes the standard course, a recorded review and
       flashcards, and the moment to learn that is while the choice is fresh. */
    const user = userEvent.setup()
    renderJourney(GUEST)
    await user.click(screen.getByRole('button', { name: /Get License/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Life and Health' }))
    await user.selectOptions(screen.getByLabelText('Select a state'), 'Florida')
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[0])

    const dialog = screen.getByRole('dialog', { name: 'Added to your cart' })
    expect(dialog).toHaveTextContent('Florida Life and Health Pre-licensing Premier')
    expect(dialog).toHaveTextContent('Recorded Livestream Exam Review - Life and Health English')
    expect(dialog).toHaveTextContent('Flashcards - Life, Health, and Accident Insurance')
  })

  it('draws no contents list for the single-course package', async () => {
    const user = userEvent.setup()
    renderJourney(GUEST)
    await walkTheNav(user)
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[1])

    const dialog = screen.getByRole('dialog', { name: 'Added to your cart' })
    expect(dialog).toHaveTextContent('Florida Life and Health Pre-licensing')
    expect(dialog).not.toHaveTextContent('Flashcards')
  })

  it('Go to Cart opens the cart with the package that was added', async () => {
    const user = userEvent.setup()
    renderJourney(GUEST)
    await user.click(screen.getByRole('button', { name: /Get License/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Life and Health' }))
    await user.selectOptions(screen.getByLabelText('Select a state'), 'Florida')
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[0])
    await user.click(screen.getByRole('button', { name: 'Go to Cart' }))

    expect(at()).toBe('/end-to-end-demo/cart')
    /* ⚠ WHICH package — the state and line of authority alone cannot tell
       Premier from standard, and the cart prices it. */
    expect(query().get(CART_PACKAGE_PARAM)).toBe('premier')
    expect(query().get(INVITE_STATE_PARAM)).toBe('Florida')
  })

  it('closing the cart modal leaves them on the page', async () => {
    /* Dismissing a confirmation should not move you — the choice is still
       there to make again. */
    const user = userEvent.setup()
    renderJourney(GUEST)
    await walkTheNav(user)
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[1])
    await user.click(screen.getByRole('button', { name: 'Close' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(at()).toBe('/end-to-end-demo/packages')
  })

  it('carries the pick from the finder to the packages page', async () => {
    const user = userEvent.setup()
    renderJourney(GUEST)
    await findCourses(user)

    expect(at()).toBe('/end-to-end-demo/packages')
    expect(query().get(INVITE_STATE_PARAM)).toBe('Florida')
    expect(query().get(INVITE_LOA_PARAM)).toBe('Life and Health')
    /* ⚠ THE HEADING NAMES THE COURSE, NOT THE STATE — the live page's shape.
       The state shows up in the breadcrumb and in the package names, which is
       where it belongs: one course page serves every state. */
    expect(
      screen.getByRole('heading', { name: 'Choose Your Life and Health Pre-Licensing Package' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Florida Life and Health Pre-licensing' }),
    ).toBeInTheDocument()
  })

  it('carries it on into the product page', async () => {
    const user = userEvent.setup()
    renderJourney(GUEST)
    await walkTheNav(user)
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[1])
    await user.click(screen.getByRole('button', { name: 'Go to Cart' }))
    await checkoutPastPartnerCode(user)

    expect(at()).toBe('/end-to-end-demo/checkout')
    expect(query().get(INVITE_STATE_PARAM)).toBe('Florida')
    expect(screen.getAllByText(/Florida Life and Health Pre-licensing/).length).toBeGreaterThan(0)
  })

  it('does NOT ask again what the finder already answered', async () => {
    /* ⚠ THE LOAD-BEARING ONE. The options modal and the finder ask the same
       question, and the finder asked it first. A guest stopped on the product
       page to re-pick a state they just picked is the flow forgetting — which
       is why both write the same two params rather than each keeping their own
       answer. */
    const user = userEvent.setup()
    renderJourney(GUEST)
    await walkTheNav(user)
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[1])
    await user.click(screen.getByRole('button', { name: 'Go to Cart' }))
    await checkoutPastPartnerCode(user)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('never names a partner anywhere in the guest walk', async () => {
    const user = userEvent.setup()
    const { container } = renderJourney(GUEST)
    expect(container.textContent).not.toMatch(/Sunrise Bank/)
    await walkTheNav(user)
    expect(container.textContent).not.toMatch(/Sunrise Bank/)
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[1])
    await user.click(screen.getByRole('button', { name: 'Go to Cart' }))
    expect(container.textContent).not.toMatch(/Sunrise Bank/)
    await checkoutPastPartnerCode(user)
    expect(container.textContent).not.toMatch(/Sunrise Bank/)
  })
})

/**
 * SWITCHING FLOW RE-ENTERS AT THE RIGHT DOOR — 2026-10-22, Jillienne: "im on
 * guest checkout but its not starting at the right page."
 *
 * The Invite flow dropdown changed which door a flow uses and nothing re-ran
 * the navigation, so switching to Guest while reading the invitation email left
 * you on the invitation email — a screen that flow has no version of.
 */
describe('changing the flow', () => {
  /** A button that flips the flow flag, as the design bar's dropdown does. */
  function FlowSwitch({ to }: { to: InviteFlowId }) {
    const { setVariant } = useFeatureFlags()
    return (
      <button type="button" onClick={() => setVariant(INVITE_FLOW_FLAG, to)}>
        switch
      </button>
    )
  }

  function renderAt(path: string, from: InviteFlowId, to: InviteFlowId) {
    const entry = `${path}?ff=${INVITE_FLOW_FLAG}:${from}`
    window.history.replaceState({}, '', entry)
    return render(
      <MemoryRouter initialEntries={[entry]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Where />
            <InviteFlowEntrySync />
            <FlowSwitch to={to} />
            <Routes>
              <Route path="/end-to-end-demo/find" element={<XcelFindCoursePage />} />
              <Route path="/end-to-end-demo/packages" element={<XcelPackagesPage />} />
              <Route path="/end-to-end-demo/email" element={<InviteEmailPageV2 />} />
              <Route path="/end-to-end-demo/checkout" element={<InvitedCheckoutPageV2 />} />
              <Route path="/end-to-end-demo" element={<InvitedProductDetailPageV2 />} />
            </Routes>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )
  }

  it('moves to the new flow’s own first screen', async () => {
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/email', 'b2b2c-email', 'b2c-guest')
    expect(at()).toBe('/end-to-end-demo/email')

    await user.click(screen.getByRole('button', { name: 'switch' }))
    expect(at()).toBe('/end-to-end-demo/find')
  })

  it('leaves you where you are when the door does not change', async () => {
    /* ⚠ THE HALF THAT KEEPS IT FROM BEING ANNOYING. The two B2B2C flows share
       an entry, and the difference between them is what CHECKOUT does — so
       throwing a reviewer back to the email to see it would be the control
       undoing the walk it is meant to move you around inside. */
    const user = userEvent.setup()
    renderAt('/end-to-end-demo/checkout', 'b2b2c-email', 'b2b2c-no-email')
    await user.click(screen.getByRole('button', { name: 'switch' }))
    expect(at()).toBe('/end-to-end-demo/checkout')
  })

  it('drops the product pick, so the new flow starts clean', async () => {
    /* Carrying a state and line of authority from a finished walk would skip
       the finder and leave the options modal quiet on the flow whose signature
       behaviour is asking. */
    const user = userEvent.setup()
    const entry =
      `/end-to-end-demo?ff=${INVITE_FLOW_FLAG}:qr-social` +
      `&${INVITE_STATE_PARAM}=Texas&${INVITE_LOA_PARAM}=Personal+Lines`
    window.history.replaceState({}, '', entry)
    render(
      <MemoryRouter initialEntries={[entry]}>
        <AccountProvider>
          <FeatureFlagProvider>
            <Where />
            <InviteFlowEntrySync />
            <FlowSwitch to="b2c-guest" />
            <Routes>
              <Route path="/end-to-end-demo/find" element={<XcelFindCoursePage />} />
              <Route path="/end-to-end-demo" element={<InvitedProductDetailPageV2 />} />
            </Routes>
          </FeatureFlagProvider>
        </AccountProvider>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'switch' }))
    expect(at()).toBe('/end-to-end-demo/find')
    expect(query().get(INVITE_STATE_PARAM)).toBeNull()
    expect(query().get(INVITE_LOA_PARAM)).toBeNull()
  })

  it('does not move anyone on arrival', async () => {
    /* First render is not a change — a pasted deep link into the middle of a
       flow must not bounce to its start. */
    renderAt('/end-to-end-demo/checkout', 'b2c-guest', 'b2c-guest')
    expect(at()).toBe('/end-to-end-demo/checkout')
  })
})

describe('the cart', () => {
  const CART =
    `/end-to-end-demo/cart?ff=${INVITE_FLOW_FLAG}:b2c-guest` +
    `&${INVITE_STATE_PARAM}=Florida&${INVITE_LOA_PARAM}=Life+and+Health&${CART_PACKAGE_PARAM}=premier`

  it('resolves the package from the address', () => {
    /* ⚠ THE CART IS THE ADDRESS, not a store — so a reviewer can link to one
       and "empty" is a reachable state rather than something you can only get
       to by never clicking. */
    expect(cartPackage('Florida', 'Life and Health', 'premier')?.price).toBe('$299.00')
    expect(cartPackage('Florida', 'Life and Health', 'standard')?.price).toBe('$199.00')
    expect(cartPackage('Florida', 'Life and Health', null)).toBeNull()
    expect(cartPackage('', 'Life and Health', 'premier')).toBeNull()
  })

  it('lists the item, its contents and its price', () => {
    renderJourney(CART)
    expect(screen.getByRole('heading', { name: 'Your cart' })).toBeInTheDocument()
    expect(screen.getByText('Florida Life and Health Pre-licensing Premier')).toBeInTheDocument()
    expect(screen.getByText('Flashcards - Life, Health, and Accident Insurance')).toBeInTheDocument()
    expect(screen.getAllByText('$299.00').length).toBeGreaterThan(0)
  })

  it('charges a guest the list price, with no partner discount', () => {
    const { container } = renderJourney(CART)
    expect(container.textContent).not.toMatch(/Partner Discount/)
    expect(container.textContent).not.toMatch(/Sunrise Bank/)
  })

  it('Remove empties it, and leaves a way forward', async () => {
    /* An empty cart with no route back to the catalogue is the one screen in
       the walk with no forward move. */
    const user = userEvent.setup()
    renderJourney(CART)
    await user.click(screen.getByRole('button', { name: 'Remove' }))

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Checkout' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Find a course' }))
    expect(at()).toBe('/end-to-end-demo/find')
  })

  it('Checkout hands over to the flow, carrying the pick', async () => {
    /* ⚠ THE SEAM. Everything before this is xcelsolutions.com; everything
       after is the flow's own pages, which the invited journeys share. */
    const user = userEvent.setup()
    renderJourney(CART)
    await checkoutPastPartnerCode(user)

    expect(at()).toBe('/end-to-end-demo/checkout')
    expect(query().get(INVITE_STATE_PARAM)).toBe('Florida')
  })
})

/**
 * "Do you have a Partner Code?" — PAGE vs MODAL (2026-10-22, Jillienne: "make
 * it a toggle to compare both versions?").
 *
 * ⚠ WHAT IS PINNED IS THAT THE TWO ARMS ARE THE SAME QUESTION with the same
 * consequence, and differ only in placement. A toggle whose arms drifted into
 * asking different things, or into one of them not changing the price, would
 * be comparing two features rather than two designs — and nothing else would
 * notice.
 */
describe('the partner code question', () => {
  const base =
    `?ff=${INVITE_FLOW_FLAG}:b2c-guest` +
    `&${INVITE_STATE_PARAM}=Florida&${INVITE_LOA_PARAM}=Life+and+Health&${CART_PACKAGE_PARAM}=premier`
  const withArm = (arm: 'page' | 'modal') =>
    base.replace(`${INVITE_FLOW_FLAG}:b2c-guest`, `${INVITE_FLOW_FLAG}:b2c-guest,${PARTNER_CODE_ASK_FLAG}:${arm}`)

  it('only asks the flows that have no partner already', () => {
    /* An invited learner's partner is on their invitation and a scanned code
       carries its own attribution — asking either is asking something the flow
       already answered, mid-purchase. */
    expect(asksForPartnerCode('b2c-guest')).toBe(true)
    expect(asksForPartnerCode('b2b2c-email')).toBe(false)
    expect(asksForPartnerCode('b2b2c-no-email')).toBe(false)
    expect(asksForPartnerCode('qr-social')).toBe(false)
    /* ⚠ AND NOT A SIGNED-IN ACCOUNT (2026-10-27): the account already
       carries its affiliation, so the question has been answered. */
    expect(asksForPartnerCode('xcel-signed-in')).toBe(false)
  })

  it('page arm: Checkout goes to a step of its own', async () => {
    const user = userEvent.setup()
    renderJourney(`/end-to-end-demo/cart${withArm('page')}`)
    await user.click(screen.getByRole('button', { name: 'Checkout' }))

    expect(at()).toBe('/end-to-end-demo/partner-code')
    expect(screen.getByRole('heading', { name: 'Do you have a Partner Code?*' })).toBeInTheDocument()
    /* A page, not a dialog — that IS the arm. */
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('modal arm: Checkout goes straight to the checkout, and asks over it', async () => {
    const user = userEvent.setup()
    renderJourney(`/end-to-end-demo/cart${withArm('modal')}`)
    await user.click(screen.getByRole('button', { name: 'Checkout' }))

    expect(at()).toBe('/end-to-end-demo/checkout')
    expect(screen.getByRole('dialog', { name: 'Do you have a Partner Code?*' })).toBeInTheDocument()
  })

  it('both arms ask exactly the same thing', async () => {
    /* ⚠ ONE COMPONENT DRAWS BOTH. If this ever fails, the two arms have been
       written twice and the comparison has stopped meaning anything. */
    const user = userEvent.setup()
    const { unmount } = renderJourney(`/end-to-end-demo/cart${withArm('page')}`)
    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    const pageText = screen.getByRole('heading', { name: /Partner Code/ }).closest('section')!.textContent
    unmount()

    renderJourney(`/end-to-end-demo/cart${withArm('modal')}`)
    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(screen.getByRole('dialog').textContent).toBe(pageText)
  })

  it('Yes makes the purchase partner-attributed, on the modal arm', async () => {
    const user = userEvent.setup()
    renderJourney(`/end-to-end-demo/cart${withArm('modal')}`)
    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    await user.click(screen.getByRole('button', { name: 'YES' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    /* ⚠ AND IT DID NOT NAVIGATE — the point of this arm is that the learner
       stays on the page they came to pay on. */
    expect(at()).toBe('/end-to-end-demo/checkout')
    expect(screen.getByText('Partner Discount Price')).toBeInTheDocument()
    expect(screen.getAllByText('$65.00').length).toBeGreaterThan(0)
  })

  it('No keeps the price the cart quoted — and the strike stays above it', async () => {
    /* ⚠ THIS USED TO ASSERT $199.00, WHICH WAS THE BUG WEARING A TEST
       (2026-10-22). The walk adds a PREMIER package to the cart, the cart
       quotes $299.00 twice, and the checkout answered $199.00 — the invited
       flow's single-course price, because this page predated there being a
       cart at all. A test pinned to the old number is what let the two screens
       disagree in front of anyone walking the journey. */
    const user = userEvent.setup()
    const { container } = renderJourney(`/end-to-end-demo/cart${withArm('modal')}`)
    const quoted = screen.getAllByText('$299.00').length
    expect(quoted).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    await user.click(screen.getByRole('button', { name: 'NO' }))

    expect(container.textContent).not.toMatch(/Partner Discount/)
    /* Subtotal and Grand Total, both the cart's figure. */
    expect(screen.getAllByText('$299.00').length).toBeGreaterThan(1)
    expect(container.textContent).not.toMatch(/\$199\.00/)
    /* ⚠ THE STRIKE IS A HIGHER NUMBER, which is the whole point of a strike —
       it struck the same $199.00 it was charging, a discount of nothing. */
    expect(screen.getByText('$399.00')).toBeInTheDocument()
  })

  it('Place your order holds on the loading page before the receipt', async () => {
    /* ⚠ 2026-10-22: "after user clicks place your order, we likely need to
       show the loading gif page before immediately loading the confirmation
       page." Paying is the one moment in this flow where the learner has
       handed something over and is waiting to hear back, and a receipt that
       appears in the same frame as the press reads as a page swap rather than
       as a purchase going through.

       ⚠ `fireEvent`, NOT `userEvent`, BECAUSE OF THE FAKE TIMERS. userEvent
       schedules its own waits on the clock this test is controlling, so the
       two deadlock — the press never resolves and the test dies at its own
       timeout with the page still on the checkout. fireEvent is synchronous
       and has no such opinion. */
    vi.useFakeTimers()
    try {
      renderJourney(`/end-to-end-demo/checkout${withArm('modal')}&${PARTNER_CODE_PARAM}=no`)

      fireEvent.click(screen.getByRole('button', { name: /Fill in the demo/ }))
      fireEvent.click(screen.getByRole('button', { name: 'Save and continue' }))
      fireEvent.click(screen.getByRole('button', { name: 'Confirm Payment Method' }))
      fireEvent.click(screen.getByRole('button', { name: 'Place your order' }))

      /* The hold: the whole page, not a spinner over a checkout still showing
         a card form that invites a second press on an order already placed. */
      expect(screen.getByRole('status')).toHaveTextContent('Placing your order')
      expect(screen.queryByRole('button', { name: 'Place your order' })).toBeNull()
      expect(at()).toBe('/end-to-end-demo/checkout')

      await act(async () => {
        await vi.advanceTimersByTimeAsync(LOADING_HANDOFF_MS + 100)
      })
      expect(at()).toBe('/end-to-end-demo/order-confirmation')
      expect(screen.getByRole('heading', { name: /Thank you for your order/ })).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })

  it('the checkout lists what the CART holds, not the invited course', async () => {
    /* ⚠ THE LINE ITEMS WERE HARD-CODED to Florida Life and Health's three, so
       a guest who bought the standard package in another state read Premier's
       contents for a course they had not chosen. */
    const user = userEvent.setup()
    const standard =
      `?ff=${INVITE_FLOW_FLAG}:b2c-guest,${PARTNER_CODE_ASK_FLAG}:modal` +
      `&${INVITE_STATE_PARAM}=Texas&${INVITE_LOA_PARAM}=Property+and+Casualty` +
      `&${CART_PACKAGE_PARAM}=standard`
    const { container } = renderJourney(`/end-to-end-demo/cart${standard}`)
    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    await user.click(screen.getByRole('button', { name: 'NO' }))

    expect(screen.getAllByText('Texas Property and Casualty Pre-licensing').length).toBeGreaterThan(0)
    expect(container.textContent).not.toMatch(/Flashcards/)
    expect(container.textContent).not.toMatch(/Life and Health/)
    expect(screen.getAllByText('$199.00').length).toBeGreaterThan(1)
    expect(screen.getByText('$249.00')).toBeInTheDocument()
  })

  it('the page arm has the same consequence', async () => {
    /* The arms differ in placement, not in what answering does. */
    const user = userEvent.setup()
    renderJourney(`/end-to-end-demo/cart${withArm('page')}`)
    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    await user.click(screen.getByRole('button', { name: 'YES' }))

    expect(at()).toBe('/end-to-end-demo/checkout')
    expect(screen.getByText('Partner Discount Price')).toBeInTheDocument()
  })

  it('does not ask twice', async () => {
    /* The answer is in the address, so a reload or a step back does not
       re-open a question that has been answered. */
    renderJourney(`/end-to-end-demo/checkout${withArm('modal')}&${PARTNER_CODE_PARAM}=no`)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('does not run a partner-code bar across the partner-code question', async () => {
    /* ⚠ IT WOULD ANSWER THE QUESTION ABOVE ITSELF. Every other public page
       carries the bar inviting a code; this page's entire content is asking
       whether you have one. The real page drops it for the same reason. */
    const user = userEvent.setup()
    const { container } = renderJourney(`/end-to-end-demo/cart${withArm('page')}`)
    expect(container.textContent).toMatch(/Go to Partner Site/)

    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(at()).toBe('/end-to-end-demo/partner-code')
    expect(container.textContent).not.toMatch(/Go to Partner Site/)
  })

  it('asks again on the next purchase', async () => {
    /* ⚠ THE BUG THIS EXISTS FOR, reported as "the modal didnt show up? or the
       page actually". The flow carries its whole query string forward, so once
       `partner=no` was set it rode along through every later navigation — back
       through the cart, back through the packages, back to the finder — and the
       SECOND walk down the guest flow was never asked at all, on either arm.
       Nothing appeared, which makes the control look broken rather than
       answered.

       Here the previous answer is already in the address, as it would be
       walking back round, and a NEW cart has to clear it. */
    const user = userEvent.setup()
    renderJourney(
      `/end-to-end-demo/packages${withArm('modal')}&${PARTNER_CODE_PARAM}=no`,
    )
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[0])
    await user.click(screen.getByRole('button', { name: 'Go to Cart' }))
    expect(query().get(PARTNER_CODE_PARAM)).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Checkout' }))
    expect(screen.getByRole('dialog', { name: 'Do you have a Partner Code?*' })).toBeInTheDocument()
  })

  it('forgets the answer when the cart is emptied', async () => {
    /* Removing the item ends the purchase the answer belonged to. */
    const user = userEvent.setup()
    renderJourney(`/end-to-end-demo/cart${withArm('modal')}&${PARTNER_CODE_PARAM}=yes`)
    expect(query().get(PARTNER_CODE_PARAM)).toBe('yes')

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(query().get(PARTNER_CODE_PARAM)).toBeNull()
  })

  it('forgets the answer when a new line of authority is picked', async () => {
    const user = userEvent.setup()
    renderJourney(`/end-to-end-demo/cart${withArm('modal')}&${PARTNER_CODE_PARAM}=yes`)
    await user.click(screen.getByRole('button', { name: /Get License/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Personal Lines' }))
    expect(query().get(PARTNER_CODE_PARAM)).toBeNull()
  })

  it('never asks a flow that already has a partner', () => {
    const modal = `?ff=${INVITE_FLOW_FLAG}:qr-social,${PARTNER_CODE_ASK_FLAG}:modal`
    renderJourney(`/end-to-end-demo/checkout${modal}`)
    expect(
      screen.queryByRole('dialog', { name: 'Do you have a Partner Code?*' }),
    ).not.toBeInTheDocument()
  })
})

describe('the cart badge', () => {
  it('counts what is actually in the cart', async () => {
    /* ⚠ READ FROM THE CART ITSELF, not passed in — so it cannot say "1" over
       an empty basket. `cartPackage` is the one source. */
    const user = userEvent.setup()
    renderJourney(GUEST)
    expect(screen.queryByText(/items in cart/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Get License/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Life and Health' }))
    await user.selectOptions(screen.getByLabelText('Select a state'), 'Florida')
    await user.click(screen.getAllByRole('button', { name: 'Add to Cart' })[0])
    await user.click(screen.getByRole('button', { name: 'Go to Cart' }))
    expect(screen.getByText(/items in cart/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(screen.queryByText(/items in cart/)).not.toBeInTheDocument()
  })
})

describe('the demo fill', () => {
  it('fills the Guest form from a hidden target in the panel', async () => {
    /* ⚠ 2026-10-22: "let me click in a secret place on the personal info form
       to auto-fill that content. like bottom right of that container". Guest
       Checkout's form is ten empty fields and typing them is most of the time
       it takes to walk this flow in front of anyone — the same shortcut the
       card fields already have. */
    const user = userEvent.setup()
    const { container } = renderJourney(
      `/end-to-end-demo/checkout?ff=${INVITE_FLOW_FLAG}:b2c-guest&${PARTNER_CODE_PARAM}=no`,
    )
    const field = (label: string) =>
      [...container.querySelectorAll('label')].find((l) =>
        l.textContent?.startsWith(label),
      )!.querySelector('input, select')!

    expect(field('First Name')).toHaveValue('')

    await user.click(screen.getByRole('button', { name: 'Fill in the demo learner’s details' }))

    expect(field('First Name')).toHaveValue('Jordan')
    expect(field('Email address')).toHaveValue('jordan.navarro@gmail.com')
    expect(field('Re-enter email address')).toHaveValue('jordan.navarro@gmail.com')
    expect(field('Phone number *')).toHaveValue('555 010 0199')
  })

  it('fills but does not save', async () => {
    /* ⚠ FILLING IS NOT THE LEARNER SAYING THEIR DETAILS ARE RIGHT, and Save
       and continue is the step being demonstrated. */
    const user = userEvent.setup()
    const { container } = renderJourney(
      `/end-to-end-demo/checkout?ff=${INVITE_FLOW_FLAG}:b2c-guest&${PARTNER_CODE_PARAM}=no`,
    )
    await user.click(screen.getByRole('button', { name: 'Fill in the demo learner’s details' }))

    expect(
      container.querySelector('section[aria-labelledby="checkout-payment"] [inert]'),
    ).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save and continue' }))
    expect(
      container.querySelector('section[aria-labelledby="checkout-payment"] [inert]'),
    ).toBeNull()
  })

  it('is offered on EVERY flow, because none of them arrives filled in', () => {
    /* ⚠ THIS CASE USED TO ASSERT THE OPPOSITE for the invited arms — 2026-10-23,
       Jillienne: "its both - remove the known details path." A recruiter types
       a way to CONTACT someone, never their home address, so no invitation
       arrives carrying the student's details and every arm opens the form
       empty. The shortcut therefore has something to fill in on all four. */
    for (const flow of ['b2b2c-email', 'b2b2c-no-email', 'b2c-guest', 'qr-social', 'b2b2c-verified'] as const) {
      renderJourney(`/end-to-end-demo/checkout?ff=${INVITE_FLOW_FLAG}:${flow}`)
      expect(
        screen.getByRole('button', { name: 'Fill in the demo learner’s details' }),
        flow,
      ).toBeInTheDocument()
      expect(screen.queryByText('1200 Bayshore Boulevard'), flow).toBeNull()
      expect(
        screen.queryByRole('button', { name: /Edit Student Information/ }),
        flow,
      ).toBeNull()
      cleanup()
    }
  })

  it('…and B2B2C with email still arrives knowing the one thing it was sent', () => {
    /* The email is what the partner DID pass, so it stays locked rather than
       joining the fields the learner has to type. */
    renderJourney(`/end-to-end-demo/checkout?ff=${INVITE_FLOW_FLAG}:b2b2c-email`)
    expect(screen.getByDisplayValue('jordan.navarro@gmail.com')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Save and continue' })).toBeInTheDocument()
  })
})

describe('the order confirmation', () => {
  /* ⚠ PINS THE RECEIPT ARM. These are about the receipt page, and leaning on
     the flag's default made them break the day the default moved to `light` —
     a test that relies on a default is really a test of the default. */
  const ORDERED =
    `/end-to-end-demo/order-confirmation?ff=${INVITE_FLOW_FLAG}:b2c-guest,${ORDER_CONFIRMATION_STYLE_FLAG}:receipt` +
    `&${INVITE_STATE_PARAM}=Florida&${INVITE_LOA_PARAM}=Life+and+Health&${CART_PACKAGE_PARAM}=premier`

  it('thanks them, with an order number and a way into the portal', () => {
    renderJourney(ORDERED)
    expect(screen.getByRole('heading', { name: /Thank you for your order/ })).toBeInTheDocument()
    expect(screen.getByText('XL00186785')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Launch Student Portal' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'To access your training:' })).toBeInTheDocument()
  })

  it('lists the order’s details', () => {
    renderJourney(ORDERED)
    expect(screen.getByRole('heading', { name: 'Billing Information' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Student Information' })).toBeInTheDocument()
    expect(screen.getAllByText('Jordan Navarro').length).toBeGreaterThan(0)
    expect(screen.getByText('Florida Life and Health Pre-licensing Premier')).toBeInTheDocument()
  })

  /* ⚠ TWO CONFIRMATIONS, TWO JOURNEYS. What a flow ends on follows from how it
     began: an invited learner sets a password and is handed into Atlas; a
     stranger who bought from the public site gets an order number. Neither
     page should be made to serve both. */
  it('is where the guest flow ends', () => {
    renderJourney(ORDERED)
    expect(screen.queryByRole('heading', { name: 'Create password' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Check your email' })).not.toBeInTheDocument()
  })
})

/**
 * TWO THANK-YOU PAGES, ONE CONTROL — 2026-10-22, Jillienne: "i want another
 * version of this thank you page, use a feature flag dropdown to show
 * different ones".
 *
 * ⚠ THEY ARE TWO ENDINGS, NOT TWO SKINS, and that is what these pin. The
 * receipt hands over a portal button and assumes the account is ready; the
 * split screen sends the learner to their inbox first. If the split arm ever
 * starts letting someone log in without validating, the comparison has
 * collapsed into a restyle.
 */
describe('the thank-you page styles', () => {
  const ordered = (style: 'receipt' | 'split' | 'light', extra = '') =>
    `/end-to-end-demo/order-confirmation?ff=${INVITE_FLOW_FLAG}:b2c-guest,${ORDER_CONFIRMATION_STYLE_FLAG}:${style}` +
    `&${INVITE_STATE_PARAM}=Florida&${INVITE_LOA_PARAM}=Life+and+Health&${CART_PACKAGE_PARAM}=premier${extra}`
  /* ⚠ THE RAIL IS OFF BY DEFAULT SINCE 2026-10-22, so a test that wants to
     look at it has to ask — which is the right way round: a test relying on a
     default is really a test OF the default, and there is one of those below
     doing that job on purpose. */
  const withRail = (extra = '') =>
    ordered('split', `&${EMAIL_VALIDATED_PARAM}=1${extra}`).replace(
      `${ORDER_CONFIRMATION_STYLE_FLAG}:split`,
      `${ORDER_CONFIRMATION_STYLE_FLAG}:split,${SPLIT_JOURNEY_RAIL_FLAG}`,
    )

  it('offers both styles on one control', () => {
    const def = FEATURE_FLAGS.find((f) => f.key === ORDER_CONFIRMATION_STYLE_FLAG)
    expect(def?.surface).toBe('design')
    expect((def?.variants ?? []).map((v) => v.value)).toEqual(['receipt', 'split', 'light'])
    /* ⚠ `light` SINCE 2026-10-22 — the treatment this branch puts forward.
       Which style becomes the Prototypes baseline is `promote-to-prototype`'s
       decision, and this line is where the branch's answer is recorded. */
    expect(def?.defaultVariant).toBe('light')
  })

  it('receipt: the portal button, no sign-in', () => {
    renderJourney(ordered('receipt'))
    expect(screen.getByRole('button', { name: 'Launch Student Portal' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Log In' })).not.toBeInTheDocument()
  })

  it('split: no product CTA opens the inbox — only the demo control', () => {
    /* ⚠ 2026-10-22: "it wont be a CTA that will be showing to the user". The
       card carries the message and nothing to press; getting to the email is
       the prototype's own affordance, parked in the corner and marked DEMO. */
    const { container } = renderJourney(ordered('split'))
    const card = screen.getByRole('heading', { name: 'Confirm your email' }).parentElement!
    /* ⚠ NOTHING THAT OPENS A MAILBOX. Contact Us lives here and is a real
       control; what must not appear is a product button offering to open the
       learner's inbox, because the product has no such thing. */
    const labels = [...card.querySelectorAll('button')].map((b) => b.textContent?.trim())
    expect(labels).toEqual(['contact us'])
    expect(labels.some((l) => /email|inbox/i.test(l ?? ''))).toBe(false)
    /* The only way to the email screen is the demo's own, in the corner. */
    expect(container.textContent).toMatch(/Demo/)
  })

  it('split: the receipt rail and the way in, on one route', () => {
    /* ⚠ ONE ROUTE FOR BOTH, so every link into the flow's ending keeps working
       whichever style is selected. */
    renderJourney(ordered('split'))
    expect(screen.getByRole('heading', { name: /Thank you for your order/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Go to Email/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Launch Student Portal' })).not.toBeInTheDocument()
  })

  it('light: the same screen and the same behaviour, in warm paper', async () => {
    /* ⚠ A TONE, NOT A THIRD PAGE — 2026-10-22, "can we do a lighter
       confirmation experience". It is the same component with the rail
       lightened, so everything the split arm promises still holds; if this
       ever stops matching, the two have been written twice. */
    const user = userEvent.setup()
    const { container } = renderJourney(ordered('light'))
    expect(screen.getByRole('heading', { name: /Thank you for your order/ })).toBeInTheDocument()
    expect(screen.getByText('XL00186764')).toBeInTheDocument()
    expect(container.querySelector('input')).toBeNull()

    await user.click(screen.getByRole('button', { name: /Go to Email/ }))
    await user.click(screen.getByRole('button', { name: 'Activate my account' }))
    expect(
      screen.getByRole('heading', { name: 'Create your password' }),
    ).toBeInTheDocument()
  })

  it('split: draws no sign-in form at all until the email is validated', async () => {
    /* ⚠ 2026-10-22: "bc the user has not yet clicked the link in their email,
       no reason to show these fields like that cant do anything with". The
       form used to render disabled above the message — four controls a learner
       cannot use are four things to try before reading the sentence that
       explains why. */
    const user = userEvent.setup()
    const { container } = renderJourney(ordered('split'))
    expect(screen.getByRole('heading', { name: 'Confirm your email' })).toBeInTheDocument()
    expect(container.querySelector('input')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Log In' })).not.toBeInTheDocument()

    /* ⚠ THE ONLY CONTROL ON THIS CARD IS THE DEMO'S OWN. A real learner opens
       their own inbox; the product has no button for that, and one inside the
       card taught reviewers a step that does not exist. */
    await user.click(screen.getByRole('button', { name: /Go to Email/ }))
    expect(at()).toBe('/end-to-end-demo/activation-email')
  })

  it('split: the email’s own link is what validates them', async () => {
    /* ⚠ THE EMAIL IS THE LOAD-BEARING PART of this arm — it is what stands
       between the purchase and the account. A "Demo: I've clicked the link"
       shortcut told a reviewer it existed without ever showing it. */
    const user = userEvent.setup()
    const { container } = renderJourney(ordered('split'))
    await user.click(screen.getByRole('button', { name: /Go to Email/ }))

    expect(screen.getByRole('heading', { name: 'Activate your XCEL account' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activate my account' }))

    expect(at()).toBe('/end-to-end-demo/order-confirmation')
    expect(screen.getByRole('heading', { name: 'Create your password' })).toBeInTheDocument()
    expect(container.querySelector('input[type="password"]')).toBeEnabled()
  })

  it('split: comes back to the same screen, now looking forwards', () => {
    /* ⚠ THE RAIL CHANGES JOB — 2026-10-22: "when coming back to this part of
       the login process, we no longer need to show the confirmation stuff on
       the left". Before validating, the receipt proves the order exists while
       the learner is off in their inbox; after, they have seen it and the order
       is not in question, so the panel shows what is ahead instead. The page
       keeps its shape; what the left half is FOR changes. */
    renderJourney(withRail())
    expect(screen.getByRole('heading', { name: 'Create your password' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Your Journey at a Glance' })).toBeInTheDocument()
    /* ⚠ IT IS AN ACCOUNT BEING MADE, not one being signed into — and the rules
       for the password are on screen before the learner types, not after a
       failed attempt. */
    expect(screen.getByText('Password requirements')).toBeInTheDocument()
    expect(screen.getByText('9–30 characters')).toBeInTheDocument()
    expect(screen.getByText('Special characters')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save Password & Log In' })).toBeInTheDocument()
    expect(screen.queryByText('Forgot your password?')).not.toBeInTheDocument()
    expect(screen.queryByText('XL00186764')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /Thank you for your order/ })).not.toBeInTheDocument()
  })

  it('split: Save Password & Log In is gated on the rules, not on the field being non-empty', async () => {
    /* ⚠ 2026-10-22: "as user types in, those requirements should show a
       validation and then the confirm button will be active". The button used
       to unlock on the first keystroke, which made the requirements decorative
       — a list that tells you a policy the control does not hold you to. */
    const user = userEvent.setup()
    renderJourney(ordered('split', `&${EMAIL_VALIDATED_PARAM}=1`))

    const create = screen.getByRole('button', { name: 'Save Password & Log In' })
    expect(create).toBeDisabled()

    /* Long enough, but one class — the rows move, the button does not. */
    await user.type(screen.getByPlaceholderText('Enter password...'), 'hunterhunter')
    expect(screen.getByText('9–30 characters').textContent).toContain('met')
    expect(screen.getByText('At least 3 of the following:').textContent).toContain('not yet met')
    expect(create).toBeDisabled()

    /* The third class is the one that opens it. */
    await user.type(screen.getByPlaceholderText('Enter password...'), 'A1')
    expect(screen.getByText('At least 3 of the following:').textContent).toContain('met')
    expect(create).toBeEnabled()
  })

  it('the rail is OFF by default, and the card is alone on the page', () => {
    /* ⚠ 2026-10-22: "add a feature toggle that hides this section completely
       and on default only shows the last step section, centered in the
       screen." The learner has come back from their inbox to do exactly one
       thing, and a panel listing the months ahead competes with it at the
       moment it matters least. */
    const flag = FEATURE_FLAGS.find((f) => f.key === SPLIT_JOURNEY_RAIL_FLAG)
    expect(flag?.defaultEnabled).toBe(false)
    expect(flag?.variants).toBeUndefined()

    renderJourney(ordered('split', `&${EMAIL_VALIDATED_PARAM}=1`))
    expect(screen.queryByRole('heading', { name: 'Your Journey at a Glance' })).toBeNull()
    expect(screen.queryByText('Pass State Exam')).toBeNull()
    /* The card itself is untouched — this hides a panel, it does not change
       the step. */
    expect(screen.getByRole('heading', { name: 'Create your password' })).toBeInTheDocument()
  })

  it('the rail comes back when the toggle is on, and the receipt is never hidden by it', () => {
    /* ⚠ IT ONLY GOVERNS THE VALIDATED STATE. Before validating, the left half
       is the RECEIPT doing a different job — proving the order exists while
       the learner is off in their mail — and this toggle must not reach it. */
    renderJourney(withRail())
    expect(screen.getByRole('heading', { name: 'Your Journey at a Glance' })).toBeInTheDocument()

    cleanup()
    renderJourney(ordered('split'))
    expect(screen.getByRole('heading', { name: /Thank you for your order/ })).toBeInTheDocument()
  })

  it('Save Password & Log In holds on the loading page, then lands on Atlas Home', async () => {
    /* ⚠ 2026-10-22: "once log in is clicked, will show the loading gif page
       and then land user on the Atlas home page." The guest arm now ends where
       the invited one does. `fireEvent` rather than `userEvent` for the same
       reason as the Place your order hold — userEvent schedules its own waits
       on the clock this test controls, and the two deadlock. */
    vi.useFakeTimers()
    try {
      renderJourney(ordered('split', `&${EMAIL_VALIDATED_PARAM}=1`))
      fireEvent.change(screen.getByPlaceholderText('Enter password...'), {
        target: { value: 'Hunter2026' },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save Password & Log In' }))

      expect(screen.getByRole('status')).toHaveTextContent('Taking you to your learning dashboard')
      expect(at()).toBe('/end-to-end-demo/order-confirmation')

      await act(async () => {
        await vi.advanceTimersByTimeAsync(LOADING_HANDOFF_MS + 100)
      })
      expect(at()).toBe('/dashboard-rebrand')
    } finally {
      vi.useRealTimers()
    }
  })

  it('split: the journey starts at the next step, named for the pick', () => {
    /* ⚠ NO "Enroll in Course" ROW ("ignore the enroll in course step"). They
       enrolled two screens ago; a first row marked done would spend the
       panel's top line on something already behind them. */
    renderJourney(withRail())
    expect(screen.getByText('Complete Pre-licensing Coursework')).toBeInTheDocument()
    expect(screen.getByText('Pass State Exam')).toBeInTheDocument()
    expect(screen.getByText('Get Licensed in Florida')).toBeInTheDocument()
    expect(screen.queryByText(/Enroll in Course/)).not.toBeInTheDocument()
    /* …and the exam step names the course they bought. */
    expect(screen.getByText(/Florida Life and Health with confidence/)).toBeInTheDocument()
  })
})
