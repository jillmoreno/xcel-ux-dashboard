import { describe, expect, it } from 'vitest'
import { cleanup as cleanupRender, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AccountProvider } from '@/context/AccountContext'
import { FEATURE_FLAGS, FeatureFlagProvider, designControlsFor } from '@/context/FeatureFlagContext'
import {
  DEFAULT_INVITE_FLOW,
  INVITE_FLOW_FLAG,
  emailEnteredTwice,
  emailsMatch,
  individuallyInvited,
  looksLikeEmail,
  partnerAttributed,
  passwordSetFromEmailedLink,
  productUnknownFor,
  resolveInviteFlow,
  studentInformationComplete,
  type InviteFlowId,
} from '@/data/inviteFlows'
import { E2E_LEARNER_EMAIL, E2E_PARTNER_NAME } from '@/pages/endToEndDemo'
import { InvitedCheckoutPageV2 } from '@/pages/InvitedCheckoutPageV2'
import { InvitedProductDetailPageV2 } from '@/pages/InvitedProductDetailPageV2'
import { InvitedConfirmationPageV2 } from '@/pages/InvitedConfirmationPageV2'
import { InvitedConfirmationRoute } from '@/pages/InviteFlowRoutes'

/**
 * WHO IS BUYING, AT SECURE CHECKOUT — 2026-10-22, Jillienne's brief. B2B and
 * B2C that morning; Guest Checkout the same day.
 *
 * ⚠ WHAT IS WORTH PINNING HERE is the behaviours, not the copy. The arms are a
 * design question still open on this branch, so every assertion below is about
 * something the BRIEF asked for — locked vs typed twice, masked vs visible,
 * password set inline vs mailed, Payment closed until the form is filled — and
 * none is about wording or layout, which are expected to move.
 *
 * ⚠ THE MASKED FIELD IS ASSERTED ON ITS `type`, which is the only thing that
 * actually makes it masked, and the thing a later "let's just use a text
 * input" would quietly undo. It is deliberately NOT found by role: a masked
 * input is not a `textbox` to the accessibility tree, which is exactly the
 * cost the component's own note records.
 */

function renderAt(path: string, flow: InviteFlowId, element: React.ReactElement) {
  /* ⚠ `?ff=` IS READ FROM `window.location.search`, not from the MemoryRouter
     entry — so both are set, or the render falls back to catalog defaults and
     the test passes for the wrong reason. */
  const ff = `${INVITE_FLOW_FLAG}:${flow}`
  window.history.replaceState({}, '', `${path}?ff=${ff}`)
  return render(
    <MemoryRouter initialEntries={[`${path}?ff=${ff}`]}>
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

const CHECKOUT = '/end-to-end-demo/checkout'
const CONFIRMATION = '/end-to-end-demo/confirmation'

describe('the checkout audience flag', () => {
  const definition = FEATURE_FLAGS.find((f) => f.key === INVITE_FLOW_FLAG)

  it('is a design control on the invite flow, not a demo one', () => {
    /* The two-bar rule: this is a decision open inside an exploration, so it
       belongs to the designer's bar. If it is ever promoted to the stakeholder
       bar that is a deliberate call — and this is the test that will say so. */
    expect(definition?.surface).toBe('design')
    expect(definition?.versions).toContain('eric-atlas-e2e')
  })

  /* ⚠ THE SURFACE SCOPE — 2026-10-22, Jillienne: "these only need to show when
     we are in the Invite & Checkout Flow", then "these design controls should
     not show when the Start is set to Invite & Checkout, they should display
     for Atlas". The version alone could do neither: the invite flow pins
     `eric-atlas-e2e`, which is the version Atlas Home runs on too.

     It was a one-directional `paths` field for half a day, which answered the
     first request and made the second impossible. The flow is a declared
     SURFACE now (`InviteSurfaceSync`), and a surface is exclusive in BOTH
     directions — which is the whole of what was asked, in the mechanism the
     catalog already had. */
  describe('shows inside the Invite & Checkout flow and nowhere else', () => {
    const onDesignBar = (surface: string | null) =>
      designControlsFor('eric-atlas-e2e', 'eric', surface).map((f) => f.key)

    it('is on the bar on the invite surface', () => {
      expect(onDesignBar('invite')).toContain(INVITE_FLOW_FLAG)
    })

    it('is NOT on the bar off it — Atlas, Compass, anywhere undeclared', () => {
      expect(onDesignBar(null)).not.toContain(INVITE_FLOW_FLAG)
      expect(onDesignBar('compass:overview')).not.toContain(INVITE_FLOW_FLAG)
    })

    it('⚠ AND IT TAKES ATLAS\u2019S CONTROLS OFF THE FLOW, which is the point', () => {
      /* Brand, Affidavit, Long title and Readiness section are Atlas's and
         name no surface, so a declared surface excludes them — the behaviour
         the `paths` field could not express. */
      const onInvite = onDesignBar('invite')
      for (const key of [
        'atlas-brand-skin-v3',
        'atlas-affidavit',
        'atlas-home-long-title',
        'atlas-readiness-section',
      ]) {
        expect(onInvite, key).not.toContain(key)
      }
    })

    it('…and leaves them exactly where they were on Atlas', () => {
      const onAtlas = onDesignBar(null)
      expect(onAtlas).toContain('atlas-home-long-title')
      expect(onAtlas).toContain('atlas-affidavit')
      expect(onAtlas).toContain('atlas-brand-skin-v3')
      expect(onAtlas).toContain('atlas-readiness-section')
    })

    it('brings the whole flow\u2019s bar with it, not just this control', () => {
      const onInvite = onDesignBar('invite')
      for (const key of [
        INVITE_FLOW_FLAG,
        'order-confirmation-style',
        'split-journey-rail',
        'partner-code-ask',
        'invite-missing-details',
      ]) {
        expect(onInvite, key).toContain(key)
      }
    })
  })

  it('offers exactly the flows the resolver knows', () => {
    expect((definition?.variants ?? []).map((v) => v.value)).toEqual([
      'b2b2c-email',
      'b2b2c-no-email',
      'b2c-guest',
      'qr-social',
    ])
    expect(definition?.defaultVariant).toBe(DEFAULT_INVITE_FLOW)
  })

  it('has enough options to render as a dropdown, not pills', () => {
    /* ⚠ 2026-10-22, the ask: "a design tool dropdown to select which flow we
       are working through". The bar switches shape on a COUNT —
       `SEGMENTED_MAX` is 3 in `DesignControlsBar` — so four flows is what makes
       it a dropdown, with no edit to that protected file. Drop to three and the
       control silently becomes pills again. */
    expect((definition?.variants ?? []).length).toBeGreaterThan(3)
  })

  /* ⚠ `detailsKnown` IS NOT A COLUMN — 2026-10-23. It was one until both
     B2B2C arms turned out to know only how to CONTACT the learner, never who
     they are, at which point every flow answered it the same way and it
     stopped being a question. See the note where it used to live in
     `inviteFlows.ts`.

     ⚠ THE PREDICATES ARE THE CONTRACT, not the flow names. Every page asks one
     of these rather than comparing to a flow — which is what makes adding a
     fifth flow a question each predicate has to answer, instead of a search for
     every `===` across three files. The table is deliberately exhaustive: a new
     flow fails to compile here until it has an answer in every column. */
  it('answers every question for every flow', () => {
    const EXPECTED: Record<
      InviteFlowId,
      {
        partner: boolean
        invited: boolean
        twice: boolean
        mailedLink: boolean
        productUnknown: boolean
      }
    > = {
      'b2b2c-email': {
        partner: true,
        invited: true,
        twice: false,
        mailedLink: false,
        productUnknown: false,
      },
      'b2b2c-no-email': {
        partner: true,
        invited: true,
        twice: true,
        mailedLink: true,
        productUnknown: false,
      },
      'b2c-guest': {
        partner: false,
        invited: false,
        twice: true,
        mailedLink: true,
        productUnknown: false,
      },
      /* ⚠ THE ROW THAT JUSTIFIES THE FLOW EXISTING: partner true, invited
         false. Partner pricing with nobody identified is the combination none
         of the other three cover — without it, QR / social is just a second
         name for guest checkout. */
      'qr-social': {
        partner: true,
        invited: false,
        twice: true,
        mailedLink: true,
        productUnknown: true,
      },
    }

    for (const [flow, want] of Object.entries(EXPECTED) as [InviteFlowId, (typeof EXPECTED)[InviteFlowId]][]) {
      expect({
        partner: partnerAttributed(flow),
        invited: individuallyInvited(flow),
        twice: emailEnteredTwice(flow),
        mailedLink: passwordSetFromEmailedLink(flow),
        productUnknown: productUnknownFor(flow),
      }).toEqual(want)
    }
  })

  it('falls back rather than rendering neither arm', () => {
    expect(resolveInviteFlow('b2c-guest')).toBe('b2c-guest')
    expect(resolveInviteFlow('qr-social')).toBe('qr-social')
    expect(resolveInviteFlow('enterprise')).toBe(DEFAULT_INVITE_FLOW)
    expect(resolveInviteFlow(null)).toBe(DEFAULT_INVITE_FLOW)
  })

  it('treats case and padding as the same mailbox', () => {
    expect(emailsMatch('Jordan@Example.com', ' jordan@example.com ')).toBe(true)
    expect(emailsMatch('jordan@example.com', 'jordan@exmaple.com')).toBe(false)
    expect(looksLikeEmail('jordan@example.com')).toBe(true)
    expect(looksLikeEmail('jordan@example')).toBe(false)
  })
})

describe('B2B checkout', () => {
  it('pre-populates the email and locks it', () => {
    renderAt(CHECKOUT, 'b2b2c-email', <InvitedCheckoutPageV2 />)
    const field = screen.getByDisplayValue(E2E_LEARNER_EMAIL)
    expect(field).toBeDisabled()
    expect(field).toHaveAttribute('readonly')
  })

  it('says where the address came from', () => {
    renderAt(CHECKOUT, 'b2b2c-email', <InvitedCheckoutPageV2 />)
    expect(screen.getByText(new RegExp(E2E_PARTNER_NAME))).toBeInTheDocument()
  })

  it('asks for the address once, not twice', () => {
    renderAt(CHECKOUT, 'b2b2c-email', <InvitedCheckoutPageV2 />)
    expect(screen.queryByText('Re-enter email address')).not.toBeInTheDocument()
  })
})

describe('B2C checkout', () => {
  it('asks for the email twice', () => {
    renderAt(CHECKOUT, 'b2b2c-no-email', <InvitedCheckoutPageV2 />)
    expect(screen.getByText('Email address')).toBeInTheDocument()
    expect(screen.getByText('Re-enter email address')).toBeInTheDocument()
  })

  it('masks the first field and leaves the second visible', () => {
    const { container } = renderAt(CHECKOUT, 'b2b2c-no-email', <InvitedCheckoutPageV2 />)
    const first = container.querySelector('input[placeholder="Enter your email address"]')
    const second = container.querySelector('input[placeholder="Re-enter your email address"]')
    expect(first).toHaveAttribute('type', 'password')
    expect(second).toHaveAttribute('type', 'email')
  })

  it('does not pre-populate either field', () => {
    renderAt(CHECKOUT, 'b2b2c-no-email', <InvitedCheckoutPageV2 />)
    expect(screen.queryByDisplayValue(E2E_LEARNER_EMAIL)).not.toBeInTheDocument()
  })

  it('flags a mismatch once the second field is left, and not before', async () => {
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2b2c-no-email', <InvitedCheckoutPageV2 />)
    const first = container.querySelector('input[placeholder="Enter your email address"]')!
    const second = container.querySelector('input[placeholder="Re-enter your email address"]')!

    await user.type(first, 'jordan@example.com')
    await user.type(second, 'jordan@exmaple.com')
    /* Still typing — a field that objects before you have finished is objecting
       to an address nobody has written yet. */
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.tab()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(second).toHaveAttribute('aria-invalid', 'true')
  })

  it('clears the mismatch when the two agree', async () => {
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2b2c-no-email', <InvitedCheckoutPageV2 />)
    const first = container.querySelector('input[placeholder="Enter your email address"]')!
    const second = container.querySelector('input[placeholder="Re-enter your email address"]')!

    await user.type(first, 'jordan@example.com')
    await user.type(second, 'jordan@exmaple.com')
    await user.tab()
    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.clear(second)
    await user.type(second, 'jordan@example.com')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('the end of the flow', () => {
  it('B2B sets the password inline — on the SAME page the guest ends on', () => {
    /* ⚠ 2026-10-23, Jillienne: "this step needs to match the confirmation page
       we did for the guest version, but the create password side will skip the
       email validation for this flow." Not a restyle — the same component.
       `InviteFlowRoutes` picks it, so these cases render the route. */
    renderAt(CONFIRMATION, 'b2b2c-email', <InvitedConfirmationRoute />)
    expect(screen.getByRole('heading', { name: 'Create your password' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Check your email' })).not.toBeInTheDocument()
    /* ⚠ AND IT SKIPS THE VERIFICATION STEP, which is the one difference. The
       guest has to open their inbox first; an invited learner was REACHED at
       that address, so there is nothing to prove. */
    expect(screen.queryByRole('heading', { name: 'Confirm your email' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Go to Email/ })).toBeNull()
    /* …while the rest of the page matches: the receipt, and the step label. */
    expect(screen.getByText(/Thank you for your order/)).toBeInTheDocument()
    expect(screen.getByText('Last step')).toBeInTheDocument()
  })

  it('B2B gates Confirm on the rules, and the demo fill is off the field', async () => {
    /* ⚠ THE SHORTCUT MOVED — 2026-10-22, "yes move that shortcut to the bottom
       right". Clicking INTO the field used to fill it with a valid password,
       which meant the requirements this page now ticks as you type could never
       be seen doing it: the very first gesture a learner makes on this form
       satisfied every rule at once. */
    const user = userEvent.setup()
    renderAt(CONFIRMATION, 'b2b2c-email', <InvitedConfirmationRoute />)

    const field = screen.getByPlaceholderText('Enter password...')
    const cta = screen.getByRole('button', { name: 'Save Password & Log In' })
    await user.click(field)
    expect(field).toHaveValue('')
    expect(cta).toBeDisabled()

    /* Typing works the slow way, and the gate holds until the rules are met. */
    await user.type(field, 'hunterhunter')
    expect(cta).toBeDisabled()
    await user.type(field, 'A1')
    expect(cta).toBeEnabled()
  })

  it('B2B fills from the corner — labelled, so it is not a trap for a keyboard', async () => {
    /* ⚠ THE CORNER CAME WITH THE PASSWORD STEP — 2026-10-23. It was put in
       Confirmation & Password's bottom-right the day before so that filling
       the field and watching the requirements tick stopped being one gesture;
       when the step moved pages the shortcut moved with it, rather than
       quietly leaving the product in a refactor. */
    const user = userEvent.setup()
    renderAt(CONFIRMATION, 'b2b2c-email', <InvitedConfirmationRoute />)

    await user.click(screen.getByRole('button', { name: 'Fill in the demo learner’s password' }))
    expect(screen.getByPlaceholderText('Enter password...')).not.toHaveValue('')
    expect(screen.getByRole('button', { name: 'Save Password & Log In' })).toBeEnabled()
  })

  it('B2C thanks them and sends them to their inbox instead', () => {
    renderAt(CONFIRMATION, 'b2b2c-no-email', <InvitedConfirmationPageV2 />)
    expect(screen.getByRole('heading', { name: 'Thank you for your order!' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(screen.getByText(/Click the link in that email to set up your password/)).toBeInTheDocument()
  })

  it('B2C offers NO inline password field', () => {
    /* ⚠ THE LOAD-BEARING ONE. The emailed link is the verification step — it is
       what proves the learner can open the address they typed twice. An inline
       password field beside it would let them finish without ever opening the
       mail, which is the single thing this arm exists to require. */
    renderAt(CONFIRMATION, 'b2b2c-no-email', <InvitedConfirmationPageV2 />)
    expect(screen.queryByRole('heading', { name: 'Create password' })).not.toBeInTheDocument()
    expect(screen.queryByPlaceholderText('Enter password...')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirm' })).not.toBeInTheDocument()
  })

  it('B2C names the address it mailed', () => {
    renderAt(CONFIRMATION, 'b2b2c-no-email', <InvitedConfirmationPageV2 />)
    expect(screen.getAllByText(E2E_LEARNER_EMAIL).length).toBeGreaterThan(0)
  })
})

describe('Guest checkout', () => {
  /** Fills the guest's student information the way a learner would. */
  async function fillStudentInformation(
    user: ReturnType<typeof userEvent.setup>,
    container: HTMLElement,
    email = 'sam.okafor@example.com',
  ) {
    const field = (label: string) =>
      [...container.querySelectorAll('label')].find((l) =>
        l.textContent?.startsWith(label),
      )!.querySelector('input, select')!

    await user.type(field('Email address'), email)
    await user.type(field('Re-enter email address'), email)
    await user.type(field('First Name'), 'Sam')
    await user.type(field('Last Name'), 'Okafor')
    await user.type(field('Street Address'), '88 Harbour Way')
    await user.selectOptions(field('State'), 'Texas')
    await user.type(field('City'), 'Austin')
    await user.type(field('ZIP Code'), '78701')
    await user.type(field('Phone number *'), '512 555 0134')
  }

  const paymentPanel = (container: HTMLElement) =>
    container.querySelector('section[aria-labelledby="checkout-payment"] [inert]')

  it('starts with the student information empty', () => {
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const student = container.querySelector('section[aria-labelledby="checkout-student"]')!
    /* Nothing is known about a guest, so neither the learner's name nor the
       invitation's address may appear anywhere in the section. */
    expect(student.textContent).not.toMatch(/Jordan Navarro/)
    expect(student.textContent).not.toMatch(/Bayshore/)
    for (const input of student.querySelectorAll('input[type="text"]')) {
      expect((input as HTMLInputElement).value).toBe('')
    }
  })

  it('shows the form itself rather than an Edit expander', () => {
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const student = container.querySelector('section[aria-labelledby="checkout-student"]')!
    expect(student.textContent).not.toMatch(/Edit Student Information/)
    expect(student.textContent).not.toMatch(/Confirm student information/)
    expect(student.querySelector('input[placeholder="Enter your email address"]')).toBeTruthy()
  })

  it('closes the Payment section until the information is complete', () => {
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    /* ⚠ `inert` IS THE ASSERTION, not opacity. It is what takes the column out
       of the tab order and the accessibility tree; a dimmed-but-reachable
       column is the failure this arm is most likely to regress into. */
    expect(paymentPanel(container)).toBeTruthy()
    expect(screen.getByRole('status')).toHaveTextContent(
      'Complete your student information to continue to payment.',
    )
  })

  it('opens the Payment section on Save and continue, not before', async () => {
    /* ⚠ A PRESS, NOT A WATCHER — 2026-10-22, Jillienne: "there should be a save
       and continue that unlocks the next step". Payment used to open the moment
       the last field happened to be valid, which is a section appearing
       underneath you mid-keystroke, and gave the learner no moment to review
       what they had typed. */
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    expect(paymentPanel(container)).toBeTruthy()

    await fillStudentInformation(user, container)
    /* Complete, and still closed. */
    expect(paymentPanel(container)).toBeTruthy()

    await user.click(screen.getByRole('button', { name: 'Save and continue' }))
    expect(paymentPanel(container)).toBeNull()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('says what is wrong rather than disabling Save', async () => {
    /* ⚠ A DISABLED SAVE TELLS YOU YOU ARE WRONG AND REFUSES TO SAY WHY — and
       with the first email field MASKED a learner cannot even re-read what they
       typed to work it out. The button stays pressable; the press is what
       surfaces the errors. */
    const user = userEvent.setup()
    renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const save = screen.getByRole('button', { name: 'Save and continue' })
    expect(save).toBeEnabled()

    await user.click(save)
    expect(screen.getByRole('alert')).toHaveTextContent('Fill in every required field above')
  })

  it('shows the mismatch on Save, without waiting for a blur', async () => {
    /* ⚠ PRESSING SAVE IS ALSO "I'VE FINISHED TYPING". Waiting on blur alone is
       right while someone is still in the field and wrong at the moment they
       try to move on. */
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const field = (label: string) =>
      [...container.querySelectorAll('label')].find((l) =>
        l.textContent?.startsWith(label),
      )!.querySelector('input')!

    await user.type(field('Email address'), 'sam@example.com')
    await user.type(field('Re-enter email address'), 'sam@exmaple.com')
    /* Still in the field — nothing said yet. */
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Save and continue' }))
    expect(
      screen.getByText('These addresses don’t match. Re-enter your email address.'),
    ).toBeInTheDocument()
    expect(field('Re-enter email address')).toHaveAttribute('aria-invalid', 'true')
  })

  it('tells an empty confirmation apart from a wrong one', async () => {
    /* ⚠ DIFFERENT MISTAKES, DIFFERENT SENTENCES. "These addresses don't match"
       is confusing when the second field is blank — there is nothing to
       compare. */
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const field = (label: string) =>
      [...container.querySelectorAll('label')].find((l) =>
        l.textContent?.startsWith(label),
      )!.querySelector('input')!

    await user.type(field('Email address'), 'sam@example.com')
    await user.click(screen.getByRole('button', { name: 'Save and continue' }))

    expect(screen.getByText('Re-enter your email address to confirm it.')).toBeInTheDocument()
  })

  it('clears the error as soon as the pair agrees', async () => {
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const field = (label: string) =>
      [...container.querySelectorAll('label')].find((l) =>
        l.textContent?.startsWith(label),
      )!.querySelector('input')!

    await user.type(field('Email address'), 'sam@example.com')
    await user.type(field('Re-enter email address'), 'sam@exmaple.com')
    await user.click(screen.getByRole('button', { name: 'Save and continue' }))
    expect(screen.getByText(/don’t match/)).toBeInTheDocument()

    await user.clear(field('Re-enter email address'))
    await user.type(field('Re-enter email address'), 'sam@example.com')
    expect(screen.queryByText(/don’t match/)).not.toBeInTheDocument()
  })

  it('re-locks Payment when a saved detail is edited', async () => {
    /* ⚠ THE SAVE SAID "these are right". Changing one withdraws that, and
       leaving Payment open over stale details is how a learner pays against an
       address they were half-way through correcting. */
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    await fillStudentInformation(user, container)
    await user.click(screen.getByRole('button', { name: 'Save and continue' }))
    expect(paymentPanel(container)).toBeNull()

    const city = [...container.querySelectorAll('label')]
      .find((l) => l.textContent?.startsWith('City'))!
      .querySelector('input')!
    await user.clear(city)
    await user.type(city, 'Dallas')

    expect(paymentPanel(container)).toBeTruthy()
  })

  it('puts the email below the name, not above the form', async () => {
    /* 2026-10-22: "email section should be below the first and last name".
       Name, then email, then address — the email is how the person is
       contacted, so it belongs with who they are. */
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const student = container.querySelector('section[aria-labelledby="checkout-student"]')!
    const labels = [...student.querySelectorAll('label > span:first-child')].map(
      (e) => e.textContent,
    )
    expect(labels.slice(0, 4)).toEqual([
      'First Name',
      'Last Name',
      'Email address',
      'Re-enter email address',
    ])
    /* …and the phone sits at the end, after the address. */
    expect(labels[labels.length - 1]).toBe('Phone number *')
  })

  it('keeps Payment closed while the two emails disagree', async () => {
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const field = (label: string) =>
      [...container.querySelectorAll('label')].find((l) =>
        l.textContent?.startsWith(label),
      )!.querySelector('input, select')!

    await user.type(field('Email address'), 'sam.okafor@example.com')
    await user.type(field('Re-enter email address'), 'sam.okafor@exmaple.com')
    await user.type(field('First Name'), 'Sam')
    await user.type(field('Last Name'), 'Okafor')
    await user.type(field('Street Address'), '88 Harbour Way')
    await user.selectOptions(field('State'), 'Texas')
    await user.type(field('City'), 'Austin')
    await user.type(field('ZIP Code'), '78701')
    await user.type(field('Phone number *'), '512 555 0134')

    /* Everything is typed, so only the mismatch is holding the gate — which is
       the point: a guest has no partner to fall back on and no account to
       recover, so an unconfirmed address must not reach payment. */
    expect(paymentPanel(container)).toBeTruthy()
  })

  it('keeps Payment closed when a required field is only whitespace', async () => {
    const user = userEvent.setup()
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    const field = (label: string) =>
      [...container.querySelectorAll('label')].find((l) =>
        l.textContent?.startsWith(label),
      )!.querySelector('input, select')!

    await user.type(field('Email address'), 'sam.okafor@example.com')
    await user.type(field('Re-enter email address'), 'sam.okafor@example.com')
    await user.type(field('First Name'), 'Sam')
    await user.type(field('Last Name'), '   ')
    await user.type(field('Street Address'), '88 Harbour Way')
    await user.selectOptions(field('State'), 'Texas')
    await user.type(field('City'), 'Austin')
    await user.type(field('ZIP Code'), '78701')
    await user.type(field('Phone number *'), '512 555 0134')

    expect(paymentPanel(container)).toBeTruthy()
  })

  it('captures the email the B2C way', () => {
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    expect(container.querySelector('input[placeholder="Enter your email address"]')).toHaveAttribute(
      'type',
      'password',
    )
    expect(
      container.querySelector('input[placeholder="Re-enter your email address"]'),
    ).toHaveAttribute('type', 'email')
  })

  it('ends the flow the B2C way', () => {
    renderAt(CONFIRMATION, 'b2c-guest', <InvitedConfirmationPageV2 />)
    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Create password' })).not.toBeInTheDocument()
  })
})

describe('what counts as complete student information', () => {
  const COMPLETE = {
    first: 'Sam',
    last: 'Okafor',
    street: '88 Harbour Way',
    state: 'Texas',
    city: 'Austin',
    zip: '78701',
    phone: '512 555 0134',
    email: 'sam@example.com',
    emailAgain: 'sam@example.com',
  }

  it('accepts a filled form', () => {
    expect(studentInformationComplete(COMPLETE)).toBe(true)
  })

  it('requires every name, address and contact field', () => {
    for (const key of ['first', 'last', 'street', 'state', 'city', 'zip', 'phone'] as const) {
      expect(studentInformationComplete({ ...COMPLETE, [key]: '' })).toBe(false)
      expect(studentInformationComplete({ ...COMPLETE, [key]: '   ' })).toBe(false)
    }
  })

  it('requires an email that looks like one and agrees with itself', () => {
    expect(studentInformationComplete({ ...COMPLETE, email: 'sam@example' })).toBe(false)
    expect(studentInformationComplete({ ...COMPLETE, emailAgain: 'sam@exmaple.com' })).toBe(false)
  })

  it('does NOT require the optional second address line', () => {
    /* The form marks it optional; gating on it would contradict the label. */
    expect(studentInformationComplete(COMPLETE)).toBe(true)
  })
})

/* jsdom HAS NO LAYOUT, and Invited Product Detail measures text to fit its
   course title (`lineWidths`, which walks `range.getClientRects()`). The same
   shim `EndToEndJourneyWalk.test.tsx` installs, for the same reason. */
if (!('getClientRects' in Range.prototype)) {
  Object.defineProperty(Range.prototype, 'getClientRects', {
    value: () => [],
    writable: true,
    configurable: true,
  })
}

const PRODUCT_DETAIL = '/end-to-end-demo'

/**
 * WHAT THE INVITE DOOR MAY CLAIM — 2026-10-22, with the flow picker.
 *
 * ⚠ THE PAGE MAKES THREE CLAIMS and three of the four flows cannot support all
 * of them: that this person was invited, that a named partner is behind it, and
 * that there is a discount off a list price. Before the picker those were
 * unconditional, which was survivable while one flow existed and becomes a
 * contradiction on screen the moment a reviewer can switch.
 */
describe('what the product detail page may claim', () => {
  it('says "you\u2019ve been invited" only where someone was', () => {
    renderAt(PRODUCT_DETAIL, 'b2b2c-email', <InvitedProductDetailPageV2 />)
    expect(screen.getByRole('heading', { name: 'You’ve been invited' })).toBeInTheDocument()
  })

  it('does not claim an invitation on a broadcast link', () => {
    /* A QR code on a poster is shown to everybody. */
    renderAt(PRODUCT_DETAIL, 'qr-social', <InvitedProductDetailPageV2 />)
    expect(screen.queryByRole('heading', { name: 'You’ve been invited' })).not.toBeInTheDocument()
    /* …but the partner IS still named: that is the whole point of the flow. */
    expect(screen.getByRole('heading', { name: /Sunrise Bank/ })).toBeInTheDocument()
  })

  it('never mentions a partner to a guest', () => {
    /* ⚠ THE CLEAREST VERSION OF THE LIE, and what the page did until today:
       naming Sunrise Bank to someone who has no relationship with them. */
    const { container } = renderAt(PRODUCT_DETAIL, 'b2c-guest', <InvitedProductDetailPageV2 />)
    expect(container.textContent).not.toMatch(/Sunrise Bank/)
    expect(screen.queryByRole('heading', { name: 'You’ve been invited' })).not.toBeInTheDocument()
  })

  it('shows the discount where a partner earned it, and not otherwise', () => {
    const { container: partnered } = renderAt(
      PRODUCT_DETAIL,
      'qr-social',
      <InvitedProductDetailPageV2 />,
    )
    expect(partnered.textContent).toMatch(/\$65\.00/)
    expect(partnered.textContent).toMatch(/\$199\.00/)
    cleanupRender()

    const { container: guest } = renderAt(PRODUCT_DETAIL, 'b2c-guest', <InvitedProductDetailPageV2 />)
    /* The list price, with nothing struck through beside it. */
    expect(guest.textContent).toMatch(/\$199\.00/)
    expect(guest.textContent).not.toMatch(/\$65\.00/)
  })

  it('always asks which product on a broadcast link', () => {
    /* ⚠ INHERENT, NOT A TOGGLE. `invite-missing-details` is off here: a poster
       has no field for a recruiter to leave blank, so the question is always
       open on this flow. Without it, a reviewer picking QR / social lands on a
       page confidently selling a Florida course to someone who scanned a code
       in Texas. */
    renderAt(PRODUCT_DETAIL, 'qr-social', <InvitedProductDetailPageV2 />)
    expect(screen.getByRole('dialog', { name: 'What are you licensing for?' })).toBeInTheDocument()
  })

  it('does not ask on an invited flow unless the recruiter left it blank', () => {
    renderAt(PRODUCT_DETAIL, 'b2b2c-no-email', <InvitedProductDetailPageV2 />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('the order summary', () => {
  it('drops the Partner Discount line for a guest', () => {
    const { container } = renderAt(CHECKOUT, 'b2c-guest', <InvitedCheckoutPageV2 />)
    expect(container.textContent).not.toMatch(/Partner Discount Price/)
    expect(container.textContent).toMatch(/\$199\.00/)
  })

  it('keeps it for a partner-attributed broadcast link', () => {
    const { container } = renderAt(CHECKOUT, 'qr-social', <InvitedCheckoutPageV2 />)
    expect(container.textContent).toMatch(/Partner Discount Price/)
    expect(container.textContent).toMatch(/\$65\.00/)
  })
})
