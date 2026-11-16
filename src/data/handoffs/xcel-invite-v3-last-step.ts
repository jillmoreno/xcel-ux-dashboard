import type { PrototypeFeature } from '../prototypeFeatures'

/**
 * INVITE FLOW V3 — THANK YOU & LAST STEP, 2026-11-05. Written with Afsana
 * through `/dev-handoff-notes`, on `feat/invite-flow-v3`.
 *
 * The page every V3 flow ends on after Placing your order: the receipt on the
 * left, the Last step card on the right in one of two versions, and the
 * "Setting up your account…" hold that hands the learner to Atlas learner
 * Home (it was "Taking you to your course…" until 2026-11-11). The modals before it are their own row,
 * `xcel-invite-v3-checkout-modals`.
 *
 * ⚠ ATLAS LEARNER HOME IS A LINK, NOT A COMPONENT. It is an existing page with
 * its own handoffs; this one only says the learner lands there with the course
 * at 0%.
 */
const feature: PrototypeFeature = {
  id: 'xcel-invite-v3-last-step',
  title: 'Invite — Thank you & last step',
  kind: 'guided',
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'not-ready',
  surface: 'invite',
  owner: 'Afsana',
  lastUpdated: '2026-11-11T21:23:24Z',
  accent: 'gold',
  icon: 'flag',
  brands: ['xcel'],
  thumbnail: '/prototype-thumbs/xcel-invite-v3-last-step.png',
  blurb:
    'Where every invite checkout ends — the order receipt beside a Last step card that either starts the course or creates a password, then a short hold that lands the learner on Atlas learner Home.',
  tileBlurb:
    'The invite flow’s ending: the receipt, the Last step card (Start Course, or Finish setting up your account then Confirm), and Setting up your account… before Atlas Home.',
  pages: [
    {
      label: 'Version B — Finish setting up your account',
      note: 'A learner new to Atlas. The hidden corner bottom-right of the card fills a valid password into both fields; Confirm opens Setting up your account…, which lands on Atlas learner Home after four seconds (demo timing); a click outside closes it first (demo only).',
      to: '/end-to-end-demo/confirmation?demo=1&ff=invite-flow-version:v3,invite-v3-model:b2b,invite-v3-flow-b2b:qr-net-new',
    },
    {
      label: 'Version A — Start learning',
      note: 'A learner whose email already has Atlas. Start Course opens Setting up your account….',
      to: '/end-to-end-demo/confirmation?demo=1&ff=invite-flow-version:v3,invite-v3-model:b2b,invite-v3-flow-b2b:qr-atlas-login',
    },
    {
      label: 'Atlas learner Home — where the learner lands',
      note: 'The existing Home, with the course at 0%. Not specified in this handoff.',
      to: '/dashboard-rebrand?demo=1&section=dashboard',
    },
  ],
  featureFlags: [
    { id: 'invite-v3-flow-b2b', label: 'Invite flow', note: 'Which version the page shows: the Has Atlas flows end on Start learning, the others on Finish setting up your account.' },
    { id: 'invite-v3-email-account', label: 'Email belongs to', note: 'On Direct Email and the OCD flows: Atlas account → Start learning; No Atlas account → Finish setting up your account.' },
  ],
  devHandoff: {
    flagsNote: 'Design bar controls for reaching each version in the prototype, not product settings.',
    intro:
      'One page, two versions, decided by whether the learner’s email already has an Atlas account. Both show the same receipt on the left. A learner who already has Atlas gets Start learning; a learner new to Atlas sets a password first. Either button opens Setting up your account…, which holds until the account is ready and lands them on Atlas learner Home with the course at 0%.',
    components: [],
    uiComponents: [
      {
        id: 'v3-thank-you-page',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-last-step-v3-thank-you-page.png',
        order: 1,
        name: 'Thank you & Last step page',
        tabLabel: 'The page',
        location: '/end-to-end-demo/confirmation — src/pages/InvitedConfirmationPageV3.tsx.',
        summary:
          'The XCEL header, then two halves: the order receipt on the left and, on the right over the topographic background, the Last step card. The card is one of two versions.',
        variants: [
          { name: 'Version A — Start learning', when: 'The learner’s email has an Atlas account (they logged in during checkout).' },
          { name: 'Version B — Finish setting up your account', when: 'The email has no Atlas account (they verified it with a one-time code).', why: 'A learner new to Atlas has no way back in without a password, so setting one is the last thing the purchase asks.' },
        ],
        ctas: [],
        statesMatrix: [],
        edgeCases: [],
        designSpec: {
          tokens: [
            { role: 'Page', token: '--color-fixed-light' },
            { role: 'Card stage', token: '--color-neutral-75' },
          ],
          responsive: ['The card stage is padded 48px 32px 64px around the 440px card.'],
          sources: [
            'The final prototype is the source of truth — the first two Live Preview routes.',
            'Implemented in src/pages/InvitedConfirmationPageV3.tsx.',
          ],
        },
      },
      {
        id: 'v3-order-receipt',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-last-step-v3-order-receipt.png',
        order: 2,
        name: 'Order receipt',
        tabLabel: 'Receipt',
        location: 'The page’s left half — src/components/e2e/ConfirmationReceiptV3.tsx.',
        summary: '"Thank you for your order, [first name]!", then Confirmation number, Product and Order total, each a ruled row.',
        variants: [
          { name: 'Partner price', when: 'A partner applies (the B2B flows). The order total is the partner’s price.' },
          { name: 'List price', when: 'No partner. The order total is the package’s own price.' },
        ],
        ctas: [],
        statesMatrix: [
          { question: 'What if the product name is long?', answer: 'It wraps inside its row.' },
          { question: 'What if unsupported items were removed at checkout?', answer: 'They are not on the receipt — only what was bought.' },
        ],
        edgeCases: [],
        designSpec: {
          tokens: [
            { role: 'Panel', token: '--color-secondary-200' },
            { role: 'Row rules', token: '--color-secondary-300' },
            { role: 'Heading font', token: '--font-e2e-serif' },
            { role: 'Labels', token: '--color-text-secondary' },
            { role: 'Values', token: '--color-text-primary' },
            { role: 'Body font', token: '--font-e2e-avenir' },
          ],
          responsive: ['Panel padding 48px 40px; each row 13px above, 2px below, with a 1px rule on top.'],
          sources: [
            'The final prototype is the source of truth — the first two Live Preview routes.',
            'Implemented in src/components/e2e/ConfirmationReceiptV3.tsx.',
          ],
        },
      },
      {
        id: 'v3-last-step-start-learning',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-last-step-v3-last-step-start-learning.png',
        order: 3,
        name: 'Last step — Start learning',
        tabLabel: 'Start learning',
        location: 'The page’s right half, version A — src/pages/InvitedConfirmationPageV3.tsx.',
        summary: 'Eyebrow "Last step", heading "Start learning", a short rule, "Begin your learning journey today." and Start Course.',
        variants: [{ name: 'Ready', when: 'Always, on version A.' }],
        ctas: [{ name: 'Start Course', does: 'Opens Setting up your account….' }],
        statesMatrix: [],
        edgeCases: [],
        designSpec: {
          tokens: [
            { role: 'Card', token: '--color-fixed-light' },
            { role: 'Card shadow', token: '--color-e2e-form-shadow' },
            { role: 'Eyebrow', token: '--color-xcel-brick-600' },
            { role: 'Heading font', token: '--font-e2e-serif' },
            { role: 'Body', token: '--color-text-secondary' },
            { role: 'Button', token: '--color-xcel-brick-600' },
          ],
          responsive: ['Card 440px wide, padding 28px, 16px between blocks. Eyebrow 11px, heading 20px, body 14px, button 15px with padding 12px 20px.'],
          sources: [
            'The final prototype is the source of truth — the second Live Preview route.',
            'Implemented in src/pages/InvitedConfirmationPageV3.tsx.',
          ],
        },
      },
      {
        id: 'v3-last-step-create-password',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-last-step-v3-last-step-create-password.png',
        order: 4,
        name: 'Last step — Finish setting up your account',
        tabLabel: 'Create password',
        location: 'The page’s right half, version B — src/pages/InvitedConfirmationPageV3.tsx, src/components/e2e/InvitePasswordChecklistV3.tsx, src/data/invitePasswordRulesV3.ts.',
        summary:
          'Eyebrow "Last step", heading "Finish setting up your account", then "Create a password to set up your account for" the email, in bold. A password field; a strength meter and "Password must:" with seven rules; a confirm password field; and Confirm.',
        variants: [
          { name: 'Empty', when: 'On arrival. No rule is met; Confirm is off.' },
          { name: 'Typing', when: 'Each rule ticks as it is met, and the meter fills — Weak, Fair, Good, Strong.' },
          { name: 'Passwords don’t match', when: 'Confirm password has something in it and differs from the password. Its border turns red and "Passwords do not match." appears under it.', why: 'It waits for the second field to have something in it, so the learner is not told off before they have typed.' },
          { name: 'Ready', when: 'All seven rules are met and both fields match. Confirm turns on.' },
        ],
        ctas: [
          { name: 'Password eye', does: 'Shows or hides the password.' },
          { name: 'Confirm password eye', does: 'Shows or hides the confirmation.' },
          { name: 'Confirm', does: 'Off until all seven rules are met and both fields match. Then creates the account and opens Setting up your account….' },
        ],
        statesMatrix: [
          { question: 'What are the seven rules?', answer: 'Be 9–15 characters; include a number; an uppercase letter; a lowercase letter; one of !@#$%^&*._-; use only those special characters; be different from email.' },
          { question: 'What if the password contains a character that is not allowed?', answer: 'The "use only the following special characters" rule stays unticked and Confirm stays off.' },
          { question: 'What if the password is the email?', answer: '"Be different from email" stays unticked and Confirm stays off. The comparison ignores case.' },
          { question: 'What if creating the account fails after Confirm?', answer: 'Not decided — see Questions.' },
        ],
        edgeCases: [
          'The email is the one verified at checkout, in bold in the line under the heading, so the learner can see which account they are setting up. A long address wraps rather than widening the card.',
          'Demo only: a hidden corner at the card’s bottom-right fills a valid password into both fields.',
        ],
        designSpec: {
          tokens: [
            { role: 'Line under the heading', token: '--color-text-secondary' },
            { role: 'Email in that line (bold)', token: '--color-text-primary' },
            { role: 'Field', token: '--color-e2e-field' },
            { role: 'Field border', token: '--color-e2e-form-outline' },
            { role: 'Rule met', token: '--color-success-700' },
            { role: 'Rule pending', token: '--color-text-secondary' },
            { role: 'Meter — weak / fair', token: '--color-error-600, --color-warning-600' },
            { role: 'Mismatch border and text', token: '--color-error-600' },
            { role: 'Confirm, on', token: '--color-xcel-brick-600' },
            { role: 'Confirm, off', token: '--color-e2e-form-locked' },
          ],
          states: ['Confirm: disabled (grey) until ready, then the brick primary.'],
          responsive: ['The same 440px card as Start learning. Field labels 11px, fields 14px, mismatch line 13px.'],
          sources: [
            'The final prototype is the source of truth — the first Live Preview route.',
            'Implemented in src/pages/InvitedConfirmationPageV3.tsx, with the rules in src/data/invitePasswordRulesV3.ts.',
          ],
        },
      },
      {
        id: 'v3-taking-you-to-course',
        thumbnail: '/prototype-thumbs/components/xcel-invite-v3-last-step-v3-taking-you-to-course.png',
        order: 5,
        name: 'Setting up your account…',
        tabLabel: 'Setting up your account',
        location: 'Over the page, after Start Course or Confirm — src/components/e2e/TakingYouToCourseDialog.tsx, and its four-second timer in src/pages/InvitedConfirmationPageV3.tsx.',
        summary:
          'The XCEL logo over the spinner and "Setting up your account…", after both Start Course and Confirm. In the product it holds until the account is set up, then lands the learner on Atlas learner Home with the course at 0%. The prototype’s four seconds is demo timing only.',
        variants: [
          { name: 'Holding', when: 'Start Course or Confirm was clicked.' },
        ],
        ctas: [],
        statesMatrix: [
          { question: 'Where does the learner land?', answer: 'Atlas learner Home, showing the course they bought at zero progress. Home is an existing page — see the third Live Preview route.' },
          { question: 'What if setting up the account runs long, or Home fails to load?', answer: 'Not decided — see Questions.' },
        ],
        edgeCases: [
          'Demo only: the prototype holds exactly four seconds, then opens Atlas learner Home. Four seconds is a stand-in so a reviewer sees the card; the product holds for as long as setup actually takes, with no fixed time.',
          'Demo only: a click outside the card closes it before the four seconds are up, so a reviewer can stay on the page. The product never does this.',
        ],
        designSpec: {
          tokens: [
            { role: 'Card', token: '--color-fixed-light' },
            { role: 'Scrim', token: '--color-e2e-scrim' },
            { role: 'Spinner', token: '--color-xcel-brick-600' },
          ],
          responsive: ['460px modal, padding 32px 32px 44px, 28px between logo and spinner. Spinner 48px, logo 132 × 42.'],
          sources: [
            'The final prototype is the source of truth — the first two Live Preview routes.',
            'Implemented in src/components/e2e/TakingYouToCourseDialog.tsx.',
          ],
        },
      },
    ],
    decisions: {
      items: [
        {
          question: 'How does the password card introduce itself, and where does the email go?',
          decision: 'Heading "Finish setting up your account", then "Create a password to set up your account for" the email in bold. It replaces "Create your password" over a locked Email field: the step is finishing an account the purchase already made, and the address reads as part of that sentence rather than as a field the learner might think they can change. Chosen from four options compared on the Design bar, 2026-11-11.',
          status: 'Decided',
        },
        {
          question: 'What does the password card’s button say?',
          decision: 'Confirm — replacing "Save Password & Log In". The learner is confirming the password they just typed twice.',
          status: 'Decided',
        },
        {
          question: 'What must a password meet?',
          decision: 'Seven rules under "Password must:", a strength meter, and a confirm field. Confirm stays off until every rule is met and both fields match.',
          status: 'Decided',
        },
        {
          question: 'What happens after Start Course or Confirm?',
          decision: 'Setting up your account… until the account is ready, then Atlas learner Home with the course at 0%. It replaced Taking you to your course… on 2026-11-11, after both buttons — one hold, not two in a row. The prototype’s four seconds and click-outside-to-close are for the demo only; the real wait is however long setup takes.',
          status: 'Decided',
        },
        {
          question: 'Is Atlas learner Home part of this handoff?',
          decision: 'No — a link only. It is an existing page with its own handoffs; nothing about it is specific to arriving from checkout beyond the course showing 0%.',
          status: 'Decided',
        },
        {
          question: 'What if creating the account fails after Confirm?',
          decision: 'Open. Not designed.',
          status: 'Needs weigh-in',
          owner: 'Design and Engineering',
        },
        {
          question: 'What if Setting up your account… runs long, or Home fails to load?',
          decision: 'Open. Not designed.',
          status: 'Needs weigh-in',
          owner: 'Design and Engineering',
        },
      ],
      openItems: [
        'Design account creation failing after Confirm.',
        'Design a slow hand-off, or Home failing to load.',
      ],
    },
    designerNotes: [],
  },
}

export default feature
