import { useSearchParams } from 'react-router-dom'
import { looksLikeEmail } from './inviteFlows'

/**
 * THE EMAIL VERIFICATION BEFORE CHECKOUT — 2026-10-27, Jillienne: "another
 * invite flow, that includes a modal prior to the checkout flow that requires
 * the first name, last name, and email address, and this will send a 6-digit
 * pin to the users email that they will need to enter before they can
 * continue with the checkout flow."
 *
 * The fifth arm of `invite-flow-journey` — `b2b2c-verified` in
 * `inviteFlows.ts`. A partner invited this person, the invitation carried no
 * way to contact them, and instead of typing the address twice at checkout
 * (the no-email arm's evidence that it can be reached) the learner PROVES it
 * before the checkout opens: name and address in a modal, a code to the
 * address, the code typed back. Everything after that treats the address as
 * known — locked at checkout, the password set inline — exactly as the
 * with-email arm does, because the question the two arms answer differently
 * ("who typed this address?") has the same answer once a code has come back
 * from it.
 *
 * ⚠ WHAT IS IN THE ADDRESS, AND WHAT IS NOT. The walk's progress lives in the
 * query string everywhere else — `partner=yes`, `validated=1` — so that a
 * link can be pasted and Reset can put it back (`INVITE_WALK_PARAMS`). The
 * verification follows that rule for the one bit that IS progress:
 * `verified=1`. The name and address the learner typed are NOT put in the
 * URL: an address in a link is an address in every place the link is pasted,
 * and the walk's query string already rides through six screens. They go in
 * `sessionStorage` instead, which lasts the tab and no longer. A `verified=1`
 * link opened in a fresh tab finds no identity and falls back to the demo
 * learner — the walk still works, it just names Jordan.
 *
 * ⚠ THE CODE IS A CONSTANT, NOT A RANDOM. Nothing is sent anywhere — this is
 * a prototype — so the modal has to tell the reviewer what "the email" says.
 * A fixed code means a reviewer who has walked it once knows it, a test can
 * type it, and the demo affordance that reveals it reveals the same thing
 * every time.
 */

/** In the address once the code has been accepted. Cleared by Reset. */
export const EMAIL_VERIFIED_PARAM = 'verified'

export const VERIFICATION_CODE_LENGTH = 6

/** What "the email" says, every time. */
export const DEMO_VERIFICATION_CODE = '482913'

export type VerifiedIdentity = {
  first: string
  last: string
  email: string
}

/** Has the walk passed the verification? Read from the address. */
export function useEmailVerified(): boolean {
  const [params] = useSearchParams()
  return params.get(EMAIL_VERIFIED_PARAM) === '1'
}

/** Enough to send a code to: both names, and an address that looks like one. */
export function identityComplete(identity: VerifiedIdentity): boolean {
  return (
    identity.first.trim() !== '' &&
    identity.last.trim() !== '' &&
    looksLikeEmail(identity.email)
  )
}

/** Exactly the digits — a code half-typed is not a wrong code, it is unfinished. */
export function codeComplete(entered: string): boolean {
  return /^\d+$/.test(entered) && entered.length === VERIFICATION_CODE_LENGTH
}

export function codeMatches(entered: string): boolean {
  return entered === DEMO_VERIFICATION_CODE
}

/* ── The identity, for the tab's lifetime ─────────────────────────────── */

const STORAGE_KEY = 'xcel-invite-verified-identity'

/** Every access is guarded: a private window, a blocked store or a test
 *  without one must leave the walk working, not crash the checkout. */
function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null
  } catch {
    return null
  }
}

export function readVerifiedIdentity(): VerifiedIdentity | null {
  try {
    const raw = storage()?.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as VerifiedIdentity).first === 'string' &&
      typeof (parsed as VerifiedIdentity).last === 'string' &&
      typeof (parsed as VerifiedIdentity).email === 'string'
    ) {
      return parsed as VerifiedIdentity
    }
    return null
  } catch {
    return null
  }
}

export function storeVerifiedIdentity(identity: VerifiedIdentity): void {
  try {
    storage()?.setItem(
      STORAGE_KEY,
      JSON.stringify({
        first: identity.first.trim(),
        last: identity.last.trim(),
        email: identity.email.trim(),
      }),
    )
  } catch {
    /* Nothing to do: the walk falls back to the demo learner. */
  }
}

export function clearVerifiedIdentity(): void {
  try {
    storage()?.removeItem(STORAGE_KEY)
  } catch {
    /* As above. */
  }
}
