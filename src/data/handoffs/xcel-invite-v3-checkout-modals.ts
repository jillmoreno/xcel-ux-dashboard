import type { PrototypeFeature } from '../prototypeFeatures'

/**
 * INVITE FLOW V3 — THE CHECKOUT MODALS, 2026-11-05. Written with Afsana through
 * `/dev-handoff-notes`, on `feat/invite-flow-v3`.
 *
 * Eight dialogs that sit over the V3 checkout (and, for the OCD flows, over the
 * cart): the email check and its two second steps, the three loading holds,
 * and the two questions the OCD cart asks. The page they lead to is its own
 * row, `xcel-invite-v3-last-step`.
 *
 * ⚠ SCOPE IS NINE FLOWS. The two Automatic Sign-in Post OTP flows, the Go to
 * Cart alternative and the B2B → Invite → Checkout model were archived the
 * same day (`archivedInviteFlowsV3.ts`), and the OCD cart's "None targeted"
 * case and partner code entry (Yes) are out of scope by the designer's call.
 * If any comes back, this file does not describe it.
 */
const feature: PrototypeFeature = {
  id: 'xcel-invite-v3-checkout-modals',
  title: 'Invite — Checkout modals',
  kind: 'guided',
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'not-ready',
  surface: 'invite',
  owner: 'Afsana',
  lastUpdated: '2026-11-05T18:44:14Z',
  accent: 'gold',
  icon: 'flag',
  brands: ['xcel'],
  thumbnail: '/prototype-thumbs/xcel-invite-v3-checkout-modals.png',
  blurb:
    'The eight modals between a learner’s cart and their placed order — the email check, the one-time code, the log-in, the partner code question, the unsupported-item notice, and the three loading holds.',
  tileBlurb:
    'The invite flow’s eight checkout modals: email, one-time code, log-in, partner code, not supported, and the signing in, signing out and placing order holds.',
  pages: [
    {
      label: 'Enter your email, then the one-time code — B2B, QR Net New',
      note: 'Type any email and Continue. On the code step, 000000 shows the wrong-code error and 999999 the expired-code error; any other six digits verifies.',
      to: '/end-to-end-demo/checkout?demo=1&ff=invite-flow-version:v3,invite-v3-model:b2b,invite-v3-flow-b2b:qr-net-new',
    },
    {
      label: 'Log in to continue — B2B, QR Has Atlas: Open Log-In Widget',
      note: 'Type any email and Continue. The password "wrong" shows the log-in error; any other password signs in. Forgot password? opens Check your email.',
      to: '/end-to-end-demo/checkout?demo=1&ff=invite-flow-version:v3,invite-v3-model:b2b,invite-v3-flow-b2b:qr-atlas-login',
    },
    {
      label: 'Direct Email — the code with the address supplied',
      note: 'The partner’s invitation supplied the address, so the check opens on the code with no email step and no Use a different email.',
      to: '/end-to-end-demo/checkout?demo=1&ff=invite-flow-version:v3,invite-v3-model:b2b,invite-v3-flow-b2b:direct-email,invite-v3-email-account:no-atlas',
    },
    {
      label: 'Signed in to XCEL (OCD), mixed cart — partner code, not supported, signing you out',
      note: 'Click Checkout on the cart: Partner code? → No → 1 item in your cart is not supported → Proceed to checkout → Signing you out… → the new Atlas checkout.',
      to: '/end-to-end-demo/cart?demo=1&ff=invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:xcel-signed-in,invite-v3-cart:mixed&lstate=Arizona&loa=Health&pkg=premier',
    },
    {
      label: 'Not signed in to XCEL (OCD), all supported — partner code, then the new checkout',
      note: 'Click Checkout on the cart: Partner code? → No → Enter your email to continue. Nobody is signed out on this flow.',
      to: '/end-to-end-demo/cart?demo=1&ff=invite-flow-version:v3,invite-v3-model:b2c,invite-v3-flow-b2c:xcel-signed-out,invite-v3-cart:targeted&lstate=Arizona&loa=Health&pkg=premier',
    },
  ],
  featureFlags: [
    { id: 'invite-v3-model', label: 'Model type', note: 'B2B invite or B2C guest.' },
    { id: 'invite-v3-flow-b2b', label: 'Invite flow', note: 'The four B2B flows — Direct Email and the three QR flows.' },
    { id: 'invite-v3-flow-b2c', label: 'Guest checkout', note: 'The five B2C flows, the two OCD flows among them.' },
    { id: 'invite-v3-cart', label: 'Cart contents', note: 'OCD flows only. Targeted only or Mixed is in scope; None targeted is not.' },
    { id: 'invite-v3-email-account', label: 'Email belongs to', note: 'Direct Email and the OCD flows: whether the email has an Atlas account — Log in to continue, or the one-time code.' },
  ],
  devHandoff: {
    flagsNote:
      'These are Design bar controls for reaching each modal in the prototype, not product settings. Each Live Preview route already pins the flow it opens.',
    intro:
      'Every invite flow checks who the learner is before the checkout can be used, and the OCD flows first settle what is in the cart. Which modal appears is decided by three things: whether the email came from the partner (Direct Email) or from the learner, whether that email has an Atlas account (a log-in) or not (a one-time code), and — for a learner coming from an existing XCEL (OCD) cart — whether they have a partner code, whether every item is a supported SKU, and whether they were signed in. After No to the partner code: an all-supported cart goes straight on (signed out first, if they were signed in); a mixed cart is told what will be removed and goes on only if they proceed. Every modal is 460px wide, centred, with the page behind held still.',
    components: [],
    uiComponents: [
      {
        id: 'v3-enter-email',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-checkout-modals-v3-enter-email.png',
        order: 1,
        name: 'Enter your email to continue',
        tabLabel: 'Enter your email',
        location: 'Over the checkout, on every flow except Direct Email. src/components/e2e/VerifyEmailModalV3.tsx — the email step.',
        summary:
          'The XCEL logo, "Enter your email to continue", "Provide your email address. We use it to find or create your account.", one email field and Continue. The email decides what comes next: Log in to continue if it has an Atlas account, the one-time code if it does not.',
        variants: [
          { name: 'Empty', when: 'On open. Continue is off.' },
          { name: 'Valid email', when: 'The field holds something shaped like an email address. Continue turns on.' },
        ],
        ctas: [
          { name: 'Continue', does: 'Off until the email is valid. Then opens Log in to continue if the email has an Atlas account, otherwise Enter your one-time code.' },
        ],
        statesMatrix: [
          { question: 'What if the email is not valid?', answer: 'Continue stays off until it looks like an email address. There is no error message.' },
          { question: 'Can the learner close it?', answer: 'No. There is no ✕ and no Escape — the checkout behind it cannot be used until the email is checked.' },
        ],
        edgeCases: [
          'A signed-in XCEL (OCD) learner who has just been signed out also lands here with an empty field. Whether that should change is an open question in Questions.',
        ],
        designSpec: {
          tokens: [
            { role: 'Card', token: '--color-fixed-light' },
            { role: 'Scrim', token: '--color-e2e-scrim' },
            { role: 'Shadow', token: '--color-e2e-form-shadow' },
            { role: 'Field', token: '--color-e2e-field' },
            { role: 'Field border', token: '--color-e2e-card-outline' },
            { role: 'Heading and body text', token: '--color-text-primary' },
            { role: 'Primary button', token: '--color-xcel-brick-600' },
            { role: 'Disabled button', token: '--color-e2e-form-locked' },
            { role: 'Font', token: '--font-e2e-avenir' },
          ],
          states: ['Continue: disabled (grey) until valid, then the brick primary.'],
          responsive: [
            'Modal 460px wide, never wider than the viewport less 48px; padding 36px 36px 32px; 20px between blocks. Logo 132 × 42, centred.',
            'Heading 22px; body 14px / 21px; field 38px tall; button full width, padding 12px 26px, 15px.',
          ],
          sources: [
            'The final prototype is the source of truth — the first Live Preview route.',
            'Implemented in src/components/e2e/VerifyEmailModalV3.tsx.',
          ],
        },
      },
      {
        id: 'v3-one-time-code',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-checkout-modals-v3-one-time-code.png',
        order: 2,
        name: 'Enter your one-time code',
        tabLabel: 'One-time code',
        location: 'Over the checkout, after Enter your email when the email has no Atlas account — or first, on Direct Email. src/components/e2e/VerifyEmailModalV3.tsx — CodeStep.',
        summary:
          'The XCEL logo, "Enter your one-time code", and "To verify your email address, enter the 6-digit code we sent to [email, bold]. Be sure to check your spam or junk folders. This code will expire in 10 minutes." Six digit boxes, Confirm, and under it the resend countdown.',
        variants: [
          { name: 'Empty', when: 'On open. The first box has focus; Confirm is off.' },
          { name: 'Complete', when: 'All six digits are in. Confirm turns on.' },
          { name: 'Resend counting down', when: 'For 10 minutes after the code is sent: "Didn’t receive the code? Resend code in 10:00", counting down.', why: 'The code is valid for those 10 minutes, so a second code before then would only race the first.' },
          { name: 'Resend available', when: 'The countdown has reached 0:00. "Resend code" becomes a link.' },
          { name: 'Code resent', when: 'Resend code was clicked. "We sent a new code to [email]." appears, the boxes clear and the countdown restarts.' },
          { name: 'Invalid code', when: 'Confirm with a wrong code. Red text under the boxes — "Invalid code. Please try again." — and a red stroke along the bottom of each box. Changing any digit clears both.', why: 'The learner needs to know the code was read and refused, not that nothing happened.' },
          { name: 'Expired code', when: 'Confirm after the 10 minutes have run out. Red text under the boxes — "The code has expired. Request another code." — with the same red stroke. Changing a digit or Resend code clears it.', why: 'Expired and wrong need different fixes — retyping will not help an expired code — so they say different things.' },
          { name: 'With Use a different email', when: 'The learner typed the email themselves: QR code, social link and B2C guest arrivals.' },
          { name: 'Without Use a different email', when: 'Direct Email. The partner’s invitation supplied the address.', why: 'There is no other address to use — the partner named this one.' },
        ],
        ctas: [
          { name: 'Digit boxes', does: 'One digit each. Typing moves to the next box, Backspace on an empty box goes back, the arrow keys move between boxes, and a pasted code fills all six. Anything that is not a digit is dropped.' },
          { name: 'Confirm', does: 'Off until all six digits are in. Then checks the code: right → the email is verified and the checkout opens with it locked; wrong → Invalid code; after 10 minutes → Expired code.' },
          { name: 'Resend code', does: 'Only once the countdown ends. Sends a new code, clears the boxes and any error, and restarts the 10 minutes.' },
          { name: 'Use a different email', does: 'Back to Enter your email to continue. Not shown on Direct Email.' },
        ],
        statesMatrix: [
          { question: 'What if the code is wrong?', answer: '"Invalid code. Please try again." in red under the boxes, 12px (smaller than the 14px lead), with a 2px red stroke along the bottom of every box. Confirm stays on.' },
          { question: 'What if the code has expired?', answer: '"The code has expired. Request another code." in the same treatment.' },
          { question: 'What if a pasted code has spaces or letters?', answer: 'Only the digits are kept, spread across the boxes from the one pasted into.' },
          { question: 'What if the email is very long?', answer: 'It wraps inside the sentence; the modal stays 460px wide.' },
          { question: 'What if the code email fails to send?', answer: 'Not decided — see Questions.' },
        ],
        edgeCases: [
          'Demo only: 000000 is the wrong code and 999999 an expired one, so both errors can be shown without a real inbox. Every other six digits is accepted. With 999999 the Resend link is still counting down — in the product an expired code always means the countdown has ended.',
        ],
        designSpec: {
          tokens: [
            { role: 'Digit box', token: '--color-e2e-field' },
            { role: 'Digit box border', token: '--color-e2e-card-outline' },
            { role: 'Error text and stroke', token: '--color-error-600' },
            { role: 'Countdown and notes', token: '--color-text-secondary' },
            { role: 'Primary button', token: '--color-xcel-brick-600' },
            { role: 'Disabled button', token: '--color-e2e-form-locked' },
            { role: 'Font', token: '--font-e2e-avenir' },
          ],
          states: [
            'Digit box focus: 2px brick outline, 1px offset.',
            'Error: 2px red stroke inside the bottom of each box, and the 12px / 16px red line under the row.',
          ],
          responsive: [
            'Boxes 54 × 66, 12px apart, 28px digits, centred. 8px between the row and the error line.',
            'Resend group: 13px notes, 10px apart, under Confirm.',
          ],
          sources: [
            'The final prototype is the source of truth — the first and third Live Preview routes.',
            'Implemented in src/components/e2e/VerifyEmailModalV3.tsx (CodeStep).',
          ],
        },
      },
      {
        id: 'v3-log-in',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-checkout-modals-v3-log-in.png',
        order: 3,
        name: 'Log in to continue',
        tabLabel: 'Log in',
        location: 'Over the checkout, after Enter your email when the email has an Atlas account — or first, on Direct Email. src/components/e2e/VerifyEmailModalV3.tsx — LoginStep.',
        summary:
          'The XCEL logo, "Log in to continue", and "Welcome back, [first name]! Sign in to [email, bold] to finish checking out." The address is in the sentence, not a field. A password field with show and hide, Forgot password?, and Log in. Forgot password? turns the modal into Check your email.',
        variants: [
          { name: 'Empty password', when: 'On open. Log in is off.' },
          { name: 'Password entered', when: 'Anything in the field. Log in turns on.' },
          { name: 'Wrong password', when: 'Log in with a password that does not match. Red text under the field — "We couldn’t log you in. Please try again." — and a red stroke along the field’s bottom. Editing the password clears both.' },
          { name: 'Check your email', when: 'Forgot password? was clicked. The modal becomes "Check your email": "We sent a password reset link to [email, bold]. Follow the instructions in the email to reset your password. Be sure to check your spam or junk folders." Resend link (primary) over Back to sign in (secondary).' },
          { name: 'Resend link waiting', when: 'Check your email, straight after a link is sent and after every resend. Resend link is disabled until the system allows another request.', why: 'A link has just gone out; a second request before the first can arrive only multiplies the emails.' },
        ],
        ctas: [
          { name: 'Password eye', does: 'Shows or hides the password.' },
          { name: 'Forgot password?', does: 'Sends a reset link to the address and turns the modal into Check your email.' },
          { name: 'Log in', does: 'Off until there is a password. Then signs in and opens Signing you in…, or shows the wrong-password error.' },
          { name: 'Resend link (Check your email)', does: 'Disabled for a wait after each send, the first included. Then sends another reset link and is disabled again.' },
          { name: 'Back to sign in (Check your email)', does: 'Returns to Log in to continue.' },
        ],
        statesMatrix: [
          { question: 'What if the password is wrong?', answer: '"We couldn’t log you in. Please try again." in red under the field, 12px, with a 2px red stroke along its bottom. Log in stays on.' },
          { question: 'How long is Resend link disabled?', answer: 'Not decided — see Questions. The prototype uses 30 seconds as a stand-in.' },
        ],
        edgeCases: [
          'Demo only: the password "wrong" fails; any other password signs in.',
          'Check your email has no ✕ — Back to sign in is the only way back.',
        ],
        designSpec: {
          tokens: [
            { role: 'Field', token: '--color-e2e-field' },
            { role: 'Error text and stroke', token: '--color-error-600' },
            { role: 'Primary button', token: '--color-xcel-brick-600' },
            { role: 'Secondary button — outline and text', token: '--color-xcel-brick-600' },
            { role: 'Secondary button — fill', token: '--color-fixed-light' },
            { role: 'Disabled button', token: '--color-e2e-form-locked' },
            { role: 'Font', token: '--font-e2e-avenir' },
          ],
          states: [
            'Log in and Resend link: disabled (grey) until they can be used, then the brick primary.',
            'Back to sign in: the primary’s size and shape, white with a 1px brick outline and brick text.',
          ],
          responsive: [
            'The same 460px modal and spacing as Enter your email. Error line 12px / 16px under the field; Forgot password? 13px under that.',
            'Check your email: Resend link and Back to sign in full width, stacked 14px apart.',
          ],
          sources: [
            'The final prototype is the source of truth — the second Live Preview route.',
            'Implemented in src/components/e2e/VerifyEmailModalV3.tsx (LoginStep).',
          ],
        },
      },
      {
        id: 'v3-signing-in',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-checkout-modals-v3-signing-in.png',
        order: 4,
        name: 'Signing you in…',
        tabLabel: 'Signing you in',
        location: 'The same modal, after Log in. src/components/e2e/VerifyEmailModalV3.tsx — the signing-in step.',
        summary: 'The XCEL logo over the loading spinner and "Signing you in…". It holds about three seconds, then the checkout opens filled from the learner’s account, with the email locked.',
        variants: [
          { name: 'Holding', when: 'After every successful Log in.', why: 'Signing in to an existing account fetches their details; the hold says something is happening rather than the form appearing already filled with no explanation.' },
        ],
        ctas: [],
        statesMatrix: [
          { question: 'What does the checkout look like after it?', answer: 'Filled from the account — name, email (locked) and phone — so the learner goes straight to payment.' },
        ],
        edgeCases: ['The three dots animate visually; a screen reader hears the line once.'],
        designSpec: {
          tokens: [
            { role: 'Spinner arcs and centre', token: '--color-xcel-brick-600' },
            { role: 'Spinner track', token: '--color-e2e-form-outline' },
            { role: 'Text', token: '--color-neutral-950' },
          ],
          responsive: ['Spinner 48px, logo 132 × 42 above it, 28px apart. Text 16px / 24px.'],
          sources: [
            'The final prototype is the source of truth — the second Live Preview route.',
            'Implemented in src/components/e2e/VerifyEmailModalV3.tsx and src/components/e2e/XcelLoadingStatus.tsx.',
          ],
        },
      },
      {
        id: 'v3-partner-code',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-checkout-modals-v3-partner-code.png',
        order: 5,
        name: 'Partner code? (Yes / No)',
        tabLabel: 'Partner code',
        location: 'B2C guest, after Checkout is clicked: over the cart on the two OCD flows, over the checkout on the other B2C flows. src/components/e2e/PartnerCodeAsk.tsx.',
        summary:
          '"Do you have a Partner Code?*", YES and NO, and the footnote: "*Partner Code, previously known as a Discount Code, allows access to your company’s dedicated Partner Site for exclusive pricing, products and to log in." An ✕ in the corner. Asked whether or not the learner is signed in to XCEL (OCD).',
        variants: [
          { name: 'Asked', when: 'After Checkout on a B2C flow, before anything else.', why: 'A partner code changes what the learner is buying and where — the partner’s own site — so it is settled before the cart or the email.' },
        ],
        ctas: [
          { name: 'YES', does: 'Opens partner code entry. Out of scope for this handoff.' },
          { name: 'NO', does: 'Continues. On the OCD flows: a mixed cart → 1 item in your cart is not supported; an all-supported cart → Signing you out… if signed in, otherwise straight to the new Atlas checkout. On the other B2C flows → Enter your email to continue.' },
          { name: '✕', does: 'Closes without an answer and returns to the cart. Escape does the same.' },
        ],
        statesMatrix: [],
        edgeCases: ['"Need help? Contact Us" under the footnote is out of scope for this handoff.'],
        designSpec: {
          tokens: [
            { role: 'Question', token: '--color-text-primary' },
            { role: 'YES / NO', token: '--color-xcel-brick-600' },
            { role: 'Rule', token: '--color-e2e-form-outline' },
            { role: 'Font', token: '--font-e2e-avenir' },
          ],
          responsive: ['460px modal, centred text. Question 20px / 28px, 800 weight. YES and NO side by side, 12px apart, at least 72px wide.'],
          sources: [
            'The final prototype is the source of truth — the fourth and fifth Live Preview routes.',
            'Implemented in src/components/e2e/PartnerCodeAsk.tsx (PartnerCodeAskModal, v3).',
          ],
        },
      },
      {
        id: 'v3-not-supported',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-checkout-modals-v3-not-supported.png',
        order: 6,
        name: '1 item in your cart is not supported',
        tabLabel: 'Not supported',
        location: 'Over the cart on the two OCD flows, after No to the partner code, when the cart mixes supported and unsupported SKUs. src/components/e2e/SignedInCartDialogs.tsx — UnsupportedItemDialog.',
        summary:
          '"To support an ongoing platform update, the following will be removed from your cart if you continue to checkout:" and the unsupported items listed by name. Proceed to checkout, and an ✕ in the corner.',
        variants: [
          { name: 'One item', when: 'One unsupported item. Heading: "1 item in your cart is not supported".' },
          { name: 'Several items', when: 'More than one. Heading: "2 items in your cart are not supported", and so on; each item listed.', detail: 'The prototype’s carts only ever hold one unsupported item, so this state has no picture — it is the One item modal with the heading pluralised and a line per item.' },
        ],
        ctas: [
          { name: 'Proceed to checkout', does: 'Removes the unsupported items from the cart and continues with the supported ones only: Signing you out… if signed in to XCEL (OCD), otherwise straight to the new Atlas checkout.' },
          { name: '✕', does: 'Closes and leaves the cart as it was. Escape and a click outside the card do the same.' },
        ],
        statesMatrix: [
          { question: 'What happens to the removed items?', answer: 'They are gone from the cart, the checkout and the receipt — the learner pays for the supported items only.' },
        ],
        edgeCases: [],
        designSpec: {
          tokens: [
            { role: 'Card', token: '--color-fixed-light' },
            { role: 'Primary button', token: '--color-xcel-brick-600' },
            { role: 'Scrim', token: '--color-e2e-scrim' },
          ],
          responsive: ['460px modal; ✕ 32px, 12px from the top-right corner.'],
          sources: [
            'The final prototype is the source of truth — the fourth Live Preview route.',
            'Implemented in src/components/e2e/SignedInCartDialogs.tsx.',
          ],
        },
      },
      {
        id: 'v3-signing-out',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-checkout-modals-v3-signing-out.png',
        order: 7,
        name: 'Signing you out…',
        tabLabel: 'Signing you out',
        location: 'Over the cart, Signed in to XCEL (OCD) only, after No to the partner code (and after Proceed on a mixed cart). src/components/e2e/SigningOutDialog.tsx.',
        summary:
          'The XCEL logo, a notice — "To support an ongoing platform update, we need to sign you out." — and the spinner with "Signing you out…". Then the new Atlas checkout, as a guest.',
        variants: [
          { name: 'Holding', when: 'A signed-in XCEL (OCD) learner continues to the new checkout.', why: 'The learner did not ask to be signed out, so the modal has to stay up long enough to read why before the checkout replaces it.' },
        ],
        ctas: [],
        statesMatrix: [
          { question: 'How long does it show?', answer: 'Long enough to read the notice; the exact length is the team’s call — see Questions. The prototype holds it four seconds, a second longer than the other loading modals.' },
        ],
        edgeCases: [],
        designSpec: {
          tokens: [
            { role: 'Notice', token: '--color-neutral-75' },
            { role: 'Notice border', token: '--color-e2e-card-outline' },
            { role: 'Spinner', token: '--color-xcel-brick-600' },
          ],
          responsive: ['460px modal, padding 32px 32px 44px, 32px between logo, notice and spinner. Notice 14px / 20px, left-aligned, padding 12px 14px. Spinner 48px.'],
          sources: [
            'The final prototype is the source of truth — the fourth Live Preview route.',
            'Implemented in src/components/e2e/SigningOutDialog.tsx.',
          ],
        },
      },
      {
        id: 'v3-placing-order',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-checkout-modals-v3-placing-order.png',
        order: 8,
        name: 'Placing your order…',
        tabLabel: 'Placing your order',
        location: 'Over the checkout, after Place your order. src/pages/InvitedCheckoutPageV3.tsx — PlacingOrderDialog.',
        summary: 'The XCEL logo over the spinner and "Placing your order…". About three seconds, then the Thank you & Last step page — its own handoff row.',
        variants: [
          { name: 'Holding', when: 'Place your order was clicked.', why: 'The scrim covers the form, so the order cannot be placed twice while it is processing.' },
        ],
        ctas: [],
        statesMatrix: [{ question: 'What if placing the order fails?', answer: 'Not decided — see Questions.' }],
        edgeCases: [],
        designSpec: {
          tokens: [{ role: 'Spinner', token: '--color-xcel-brick-600' }],
          responsive: ['460px modal, padding 32px 32px 44px. Spinner 48px.'],
          sources: [
            'The final prototype is the source of truth — any Live Preview route, walked to Place your order.',
            'Implemented in src/pages/InvitedCheckoutPageV3.tsx.',
          ],
        },
      },
    ],
    decisions: {
      items: [
        {
          question: 'When is the partner code asked?',
          decision: 'After Checkout, on every B2C flow, whether or not the learner is signed in to XCEL (OCD) — before the cart is changed or the email asked, because a partner code changes where the purchase happens.',
          status: 'Decided',
        },
        {
          question: 'What does Proceed to checkout do to a mixed cart?',
          decision: 'Removes the unsupported items and continues with the supported ones only. The ✕ leaves the cart untouched.',
          status: 'Decided',
        },
        {
          question: 'Does every log-in hold on Signing you in?',
          decision: 'Yes. It explains the checkout arriving already filled.',
          status: 'Decided',
        },
        {
          question: 'Who sees Use a different email?',
          decision: 'Learners who typed the email themselves — QR code, social link and B2C guest. Not Direct Email, because the partner supplied the address and there is no other to use.',
          status: 'Decided',
        },
        {
          question: 'How are a wrong code, an expired code and a wrong password shown?',
          decision: 'Red 12px text under the boxes or field — "Invalid code. Please try again.", "The code has expired. Request another code.", "We couldn’t log you in. Please try again." — with a 2px red stroke along the bottom. Smaller than the lead text so it reads as a note on the field, not a new heading.',
          status: 'Decided',
        },
        {
          question: 'What does Forgot password? do?',
          decision: 'Turns the modal into Check your email: the reset link’s address in bold, follow the email’s instructions, check spam or junk. Resend link (primary, disabled for a wait after each send) over Back to sign in (secondary).',
          status: 'Decided',
        },
        {
          question: 'After a signed-in XCEL (OCD) learner is signed out, how should Enter your email to continue behave?',
          decision:
            'Open. This is only the Signed in to XCEL (OCD) flow, at the moment the learner is signed out and continues into the new Atlas checkout — reached either by (1) No to the partner code, then 1 item in your cart is not supported, then Proceed to checkout; or (2) No to the partner code after Checkout with every item a supported SKU. Signing you out… follows in both, then the new checkout. What comes after the email is settled: the one-time code if it has no Atlas account, Log in if it does. What is open is the email step: should it appear at all, or go straight to the code or Log in with their XCEL email? If it appears, should the email be pre-filled? If pre-filled, should it be locked? This matters most for learners with XCEL history — active entitlements, passed or failed courses — so that history and the new Atlas account stay on one identity for migration. The prototype asks for the email with nothing filled in. Not covered: Not signed in to XCEL (OCD) and the other B2C flows, where nobody is signed out and the learner types their own email.',
          status: 'Needs weigh-in',
          owner: 'Jill and Engineering',
        },
        {
          question: 'How long does Signing you out… show?',
          decision: 'Open. Long enough to read why they are being signed out — that is the only requirement. The prototype uses four seconds.',
          status: 'Needs weigh-in',
          owner: 'Engineering',
        },
        {
          question: 'How long is Resend link disabled on Check your email?',
          decision: 'Open — the system’s call. It must stay disabled until another request is allowed. The prototype uses 30 seconds as a stand-in.',
          status: 'Needs weigh-in',
          owner: 'Engineering',
        },
        {
          question: 'Should Check your email say how long until the learner can request another link?',
          decision: 'Open. The one-time code step shows its wait ("Resend code in 10:00"); without one here a learner cannot tell whether the button is waiting or broken.',
          status: 'Needs weigh-in',
          owner: 'Design and Engineering',
        },
        {
          question: 'Should Check your email say how long the reset link is valid (for example, 1 hour)?',
          decision: 'Open. The code step states its expiry ("This code will expire in 10 minutes."), and it tells a learner who finds the email later why the link stopped working. The expiry itself is the system’s; the copy follows it.',
          status: 'Needs weigh-in',
          owner: 'Design and Engineering',
        },
        {
          question: 'What if the code email fails to send?',
          decision: 'Open. Not designed.',
          status: 'Needs weigh-in',
          owner: 'Design and Engineering',
        },
        {
          question: 'What if placing the order fails — a declined card, a timeout?',
          decision: 'Open. Not designed.',
          status: 'Needs weigh-in',
          owner: 'Design and Engineering',
        },
      ],
      openItems: [
        'Decide how Enter your email behaves after a signed-in XCEL (OCD) learner is signed out — shown, pre-filled, locked.',
        'Set how long Signing you out… shows.',
        'Set the Resend link wait, and whether Check your email states the wait and the link’s validity.',
        'Design the code email failing to send.',
        'Design the order failing to place.',
      ],
    },
    designerNotes: [],
  },
}

export default feature
