import { createElement, type ReactNode } from 'react'

/**
 * PICTURES FOR THE INVITE FLOW'S TWO HANDOFFS' STATES — 2026-11-05, Afsana:
 * "when looking at the states, it states 'no live render for this
 * component'... can you attach images and also keep the supporting subtext".
 *
 * ⚠ CAPTURES, NOT LIVE RENDERS — the one deliberate exception to the
 * registry's rule. Every state here is a modal or a page reached by walking
 * the flow (a portalled dialog over the checkout, a timer, a verified address
 * in the URL), so none of them can be drawn from a component's own props the
 * way the Atlas cards are. The prose beside each picture is still the spec;
 * the picture shows it. Re-shoot the file when its screen changes —
 * `public/handoff-states/<feature id>/`.
 *
 * Keyed by handoff component id, then by the variant's `name` exactly as the
 * handoff file spells it — `DevHandoffVariants.test.ts` fails on a key that
 * matches no variant. A variant left out (the not-supported modal's "Several
 * items", which the prototype's carts never produce) keeps the section's
 * no-render note.
 */
const MODALS = '/handoff-states/xcel-invite-v3-checkout-modals'
const LAST_STEP = '/handoff-states/xcel-invite-v3-last-step'

const STATE_IMAGES: Record<string, Record<string, string>> = {
  'v3-enter-email': {
    Empty: `${MODALS}/enter-email--empty.png`,
    'Valid email': `${MODALS}/enter-email--valid.png`,
  },
  'v3-one-time-code': {
    Empty: `${MODALS}/one-time-code--empty.png`,
    Complete: `${MODALS}/one-time-code--complete.png`,
    'Resend counting down': `${MODALS}/one-time-code--complete.png`,
    'Resend available': `${MODALS}/one-time-code--resend-available.png`,
    'Code resent': `${MODALS}/one-time-code--resent.png`,
    'Invalid code': `${MODALS}/one-time-code--invalid.png`,
    'Expired code': `${MODALS}/one-time-code--expired.png`,
    'With Use a different email': `${MODALS}/one-time-code--empty.png`,
    'Without Use a different email': `${MODALS}/one-time-code--direct-email.png`,
  },
  'v3-log-in': {
    'Empty password': `${MODALS}/log-in--empty.png`,
    'Password entered': `${MODALS}/log-in--entered.png`,
    'Wrong password': `${MODALS}/log-in--wrong.png`,
    'Check your email': `${MODALS}/log-in--check-email.png`,
    'Resend link waiting': `${MODALS}/log-in--resend-waiting.png`,
  },
  'v3-signing-in': { Holding: `${MODALS}/signing-in.png` },
  'v3-partner-code': { Asked: `${MODALS}/partner-code.png` },
  'v3-not-supported': { 'One item': `${MODALS}/not-supported--one.png` },
  'v3-signing-out': { Holding: `${MODALS}/signing-out.png` },
  'v3-placing-order': { Holding: `${MODALS}/placing-order.png` },

  'v3-thank-you-page': {
    'Version A — Start learning': `${LAST_STEP}/page--start-learning.png`,
    'Version B — Finish setting up your account': `${LAST_STEP}/page--create-password.png`,
  },
  'v3-order-receipt': {
    'Partner price': `${LAST_STEP}/receipt--partner.png`,
    'List price': `${LAST_STEP}/receipt--list.png`,
  },
  'v3-last-step-start-learning': { Ready: `${LAST_STEP}/start-learning.png` },
  'v3-last-step-create-password': {
    Empty: `${LAST_STEP}/create-password--empty.png`,
    Typing: `${LAST_STEP}/create-password--typing.png`,
    'Passwords don’t match': `${LAST_STEP}/create-password--mismatch.png`,
    Ready: `${LAST_STEP}/create-password--ready.png`,
  },
  'v3-taking-you-to-course': { Holding: `${LAST_STEP}/setting-up-account.png` },
}

/** The captures as the registry's renders — one `<img>` per state, at its
 *  own size and never wider than the column. Every file is a 2x capture
 *  (headless Chrome, device scale factor 2). */
export function inviteV3StateRenders(): Record<string, Record<string, () => ReactNode>> {
  return Object.fromEntries(
    Object.entries(STATE_IMAGES).map(([componentId, states]) => [
      componentId,
      Object.fromEntries(
        Object.entries(states).map(([name, src]) => [
          name,
          () =>
            createElement('img', {
              src,
              /* Captured at 2x — drawn at half its pixel size, so it is sharp
                 on a retina screen and the right size on any. */
              srcSet: `${src} 2x`,
              alt: name,
              loading: 'lazy',
              /* The column stretches an image to its own width, which drew a
                 472px modal at 845. Pin it to half its pixels once known. */
              onLoad: (e: { currentTarget: HTMLImageElement }) => {
                e.currentTarget.style.width = `${e.currentTarget.naturalWidth / 2}px`
              },
              style: { display: 'block', maxWidth: '100%', height: 'auto', borderRadius: 8 },
            }),
        ]),
      ),
    ]),
  )
}
