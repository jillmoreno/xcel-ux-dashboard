/**
 * INVITE FLOW V3 — THE FLOWS TAKEN OUT ON 2026-11-05. NOTHING IMPORTS THIS.
 *
 * Afsana, scoping the V3 dev handoff: "for B2B invite: delete invite flow
 * titled 'QR: Has Atlas: Automatic Sign-in Post OTP' / for B2C guest: delete
 * the flows titled: has atlas: automatic sign-in post otp, alternative:
 * immediate check for partner code after clicking go to cart / delete model
 * type = B2B -> invite -> Checkout". The handoff documents what remains; these
 * are kept verbatim so bringing one back is a re-wire, not a rebuild (the
 * archive convention, CLAUDE.md).
 *
 * ⚠ THE LAST COMMIT THAT RAN THEM IS `b2343adc`. `git show b2343adc:<path>`
 * has every call site exactly as it was.
 *
 * TO RESTORE — every step, per flow:
 *
 *   ALL THREE FLOWS / THE MODEL
 *     - `src/data/inviteFlowsV3.ts`: put the row back in `INVITE_FLOWS_V3` and
 *       its id back in `InviteFlowV3Id` (the model: `InviteModelId`,
 *       `INVITE_MODELS`, `INVITE_V3_FLOW_FLAGS`, `DEFAULT_INVITE_FLOW_V3`).
 *     - `src/context/FeatureFlagContext.tsx`: the flag variants below, back in
 *       `invite-v3-flow-b2b` / `invite-v3-flow-b2c` / `invite-v3-model`.
 *     - `src/test/InviteFlowsV3.test.ts` and `InviteFlowV3Screens.test.tsx`:
 *       the cases at `b2343adc` that walk these ids.
 *
 *   THE TWO AUTOMATIC SIGN-IN FLOWS (`qr-atlas-auto`, `has-atlas`)
 *     - The orange picker rows in `src/pages/inviteFlow.css` (the rule keyed
 *       on their labels; the `--color-e2e-alt-flow*` tokens are still in
 *       `tokens.css`).
 *     - `emailCheckV3`'s `second: 'none'` and `VerifyEmailModalV3`'s
 *       `second="none"` path are still there — they are what these flows ran.
 *
 *   THE GO TO CART ALTERNATIVE (`pc-after-add`)
 *     - `pcFirstFlowV3` (below) back in `inviteFlowsV3.ts`, and its branch in
 *       `useInviteFlowV3`.
 *     - `inviteV3Surface`'s `'invite:v3-b2c-pc-first'` branch, the surface in
 *       `src/context/designSurface.ts` (union + label), and on the
 *       `invite-v3-model`, `invite-v3-flow-b2c` and `invite-v3-email-account`
 *       flags' `surfaces`.
 *     - `src/pages/XcelPackagesPage.tsx`: `pcFirst`, the `added` initialiser
 *       that opens "Added to your cart", `v3={pcFirst}` on `AddedToCart`, the
 *       Go to Cart branch, and the `asking` `PartnerCodeAskModal`.
 *     - `entryPathV3`'s `packages` branch, and `startsWithCart`'s
 *       `/end-to-end-demo/packages` in `src/pages/EndToEndPageSync.tsx`;
 *       `v3ScreensFor`'s B2C `/end-to-end-demo/packages`.
 *     - Its orange picker row, as above.
 *
 *   THE B2B → INVITE → CHECKOUT MODEL (`b2b-checkout`, `invite-mixed-cart`)
 *     - The `invite-v3-flow-b2b-checkout` flag below, and the key in
 *       `REBRAND_FLAGS` (`src/components/account/FeatureFlagPanel.tsx`).
 *     - `inviteCheckoutFlowV3` and `useV3CheckoutDropNotice` (below), its
 *       branches in `useInviteFlowV3`, `useV3SignedInCart`, `inviteV3Surface`
 *       and `v3ScreensFor`.
 *     - The surface `'invite:v3-b2b-checkout'` in `designSurface.ts` and on
 *       the `invite-v3-model` and `invite-v3-email-account` flags.
 *     - `src/pages/XcelCartPage.tsx`: `invitedNext`, `goToInvitation`, the
 *       click-anywhere `onClickCapture`, and the Checkout button's branch.
 *     - `src/pages/InvitedCheckoutPageV3.tsx`: `dropNotice` and its
 *       `UnsupportedItemDialog` (Cancel → the product page, Proceed →
 *       `dropped=1`), and `!dropNotice` on the email check.
 *
 * ⚠ NOT ARCHIVED WITH THEM: `UnsupportedItemDialog`, "Signing you in" and the
 * Partner Code question are all still used by the flows that remain.
 * ⚠ NO `ARCHIVED_ITEMS` ROW YET — `archivedItems.ts` is the design lead's
 * file; this header is the restore note until she adds one.
 */

/* ── The catalog rows, verbatim from `INVITE_FLOWS_V3` ──────────────────── */

const QR_START = ['qr', 'variation-4', 'variation-4-filled', 'pdp']
const CART_START = ['cart', 'pc-modal']
const VERIFY = ['verify-1', 'verify-2']
const CODE = ['code-1', 'code-2']
const CHECKOUT = ['checkout-1b', 'checkout-2', 'checkout-3']
const NEW_PASSWORD = ['create-password', 'create-password-filled']

export const ARCHIVED_INVITE_MODELS_V3 = [
  {
    id: 'b2b-checkout',
    label: 'B2B → Invite → Checkout',
    description: 'A cart already holding a mixed order, then a partner’s invitation. Partner pricing; the unsupported item is dropped at checkout.',
  },
]

export const ARCHIVED_INVITE_FLOWS_V3 = [
  {
    id: 'qr-atlas-auto',
    model: 'b2b',
    label: 'QR: Has Atlas: Automatic Sign-in Post OTP',
    description: 'Already on Atlas. After the email, signed in automatically — the checkout arrives filled.',
    base: 'qr-social',
    /* ⚠ NO SECOND STEP — 2026-11-03, Afsana: after the email and Continue,
       "the signing you in modal needs to show, and then secure checkout page
       with their info. pre-populated". */
    screens: [...QR_START, ...VERIFY, 'signing-in', ...CHECKOUT, 'placing', 'ready'],
  },
  {
    id: 'has-atlas',
    model: 'b2c',
    label: 'Has Atlas: Automatic Sign-in Post OTP',
    description: 'Already on Atlas. After the email, signed in automatically — the checkout arrives filled.',
    base: 'b2c-guest',
    screens: [...CART_START, ...VERIFY, 'signing-in', ...CHECKOUT, 'placing-modal', 'ready'],
  },
  {
    /* 2026-11-03, Afsana: "immediate check for partner code after clicking
       'go to cart'". Opens on the packages page with "Added to your cart"
       showing; Go to Cart asks the Partner Code question, then the cart;
       Checkout goes straight to Verify your email. */
    id: 'pc-after-add',
    model: 'b2c',
    label: 'Alternative: immediate check for partner code after clicking ‘go to cart’',
    description: 'Starts at “Added to your cart”. Go to Cart asks for a partner code, then Your cart; Checkout goes straight to Verify your email — a code, or a log-in if the email has Atlas.',
    base: 'b2c-guest',
    screens: ['packages', 'added-to-cart', 'pc-modal', 'cart', ...VERIFY, ...CODE, 'checkout-1', ...CHECKOUT, 'placing', ...NEW_PASSWORD],
  },
  {
    /* 2026-11-04, Afsana: the cart (click anywhere), the invitation email,
       View invitation to the product page, then Purchase opens the secure
       checkout under "1 item in your cart is not supported"; Proceed drops
       the item, then a log-in (Atlas) or a code. Walks as Direct Email. */
    id: 'invite-mixed-cart',
    model: 'b2b-checkout',
    label: 'Mixed cart, then invitation',
    description: 'Mixed cart, then the partner’s invitation. Purchase drops the unsupported item, then a log-in or a code.',
    base: 'b2b2c-email',
    screens: ['cart', 'email', 'pdp', 'drop-notice', ...CODE, 'checkout-1', ...CHECKOUT, 'placing', ...NEW_PASSWORD],
  },
]

/* ── The walks, verbatim from `inviteFlowsV3.ts` ─────────────────────────── */

type ArchivedFlow = (typeof ARCHIVED_INVITE_FLOWS_V3)[number]
type EmailAccount = 'atlas' | 'no-atlas'

/** pc-after-add's walk after Checkout, by the email given. */
export function pcFirstFlowV3(flow: ArchivedFlow, email: EmailAccount): ArchivedFlow {
  const start = ['packages', 'added-to-cart', 'pc-modal', 'cart']
  return {
    ...flow,
    screens:
      email === 'atlas'
        ? [...start, ...VERIFY, 'login-1', 'login-2', ...CHECKOUT, 'placing', 'ready']
        : [...start, ...VERIFY, ...CODE, 'checkout-1', ...CHECKOUT, 'placing', ...NEW_PASSWORD],
  }
}

/** invite-mixed-cart's walk after "not supported", by the invitation's address. */
export function inviteCheckoutFlowV3(flow: ArchivedFlow, email: EmailAccount): ArchivedFlow {
  const start = ['cart', 'email', 'pdp', 'drop-notice']
  return {
    ...flow,
    screens:
      email === 'atlas'
        ? [...start, 'login-1', 'login-2', ...CHECKOUT, 'placing', 'ready']
        : [...start, ...CODE, 'checkout-1', ...CHECKOUT, 'placing', ...NEW_PASSWORD],
  }
}

/* `useV3CheckoutDropNotice` was:
     const flow = useInviteFlowV3()
     const [params] = useSearchParams()
     return flow.id === 'invite-mixed-cart' && params.get(V3_DROPPED_PARAM) !== '1'
   and `useV3SignedInCart` answered it first with
     { cart: 'mixed', signedIn: false, line: null,
       extra: dropped ? null : V3_NON_TARGETED_ITEM, dropped: [V3_NON_TARGETED_ITEM.name] } */

/* ── The flag catalog's entries, verbatim ───────────────────────────────── */

export const ARCHIVED_INVITE_V3_FLAG_VARIANTS = {
  'invite-v3-model': [
    { value: 'b2b-checkout', label: 'B2B → Invite → Checkout', description: 'A cart already holding a mixed order, then a partner’s invitation. Partner pricing; the unsupported item is dropped at checkout.' },
  ],
  'invite-v3-flow-b2b': [
    { value: 'qr-atlas-auto', label: 'QR: Has Atlas: Automatic Sign-in Post OTP', description: 'Already on Atlas. After the email, signed in automatically — the checkout arrives filled.' },
  ],
  'invite-v3-flow-b2c': [
    { value: 'has-atlas', label: 'Has Atlas: Automatic Sign-in Post OTP', description: 'Already on Atlas. After the email, signed in automatically — the checkout arrives filled.' },
    { value: 'pc-after-add', label: 'Alternative: immediate check for partner code after clicking ‘go to cart’', description: 'Starts at “Added to your cart”. Go to Cart asks for a partner code, then Your cart; Checkout goes straight to Verify your email — a code, or a log-in if the email has Atlas (pick Email belongs to beside this).' },
  ],
}

export const ARCHIVED_INVITE_V3_FLOW_B2B_CHECKOUT_FLAG = {
  key: 'invite-v3-flow-b2b-checkout',
  surface: 'design',
  versions: ['eric-atlas-e2e'],
  surfaces: ['invite:v3-b2b-checkout'],
  group: 'Navigation',
  label: 'Invite flow',
  picker: 'sheet',
  description: 'Invite Flow V3, B2B → Invite → Checkout. A cart holding a mixed order, the partner’s invitation, the product page; Purchase opens the checkout under “1 item in your cart is not supported”, then a log-in or a code (pick Email belongs to beside this).',
  defaultEnabled: true,
  defaultVariant: 'invite-mixed-cart',
  variants: [
    { value: 'invite-mixed-cart', label: 'Mixed cart, then invitation', description: 'Mixed cart, then the partner’s invitation. Purchase drops the unsupported item, then a log-in or a code.' },
  ],
  page: 'dashboard-rebrand',
}
