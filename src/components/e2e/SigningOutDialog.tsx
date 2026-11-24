import type { CSSProperties } from 'react'
import { XcelLoadingStatus } from '@/components/e2e/XcelLoadingStatus'
import { XcelModalV3 } from '@/components/e2e/XcelModalV3'

/**
 * "SIGNING YOU OUT" — Invite Flow V3, 2026-11-02, Afsana. A learner signed in
 * to an existing XCEL account whose cart holds the targeted SKUs is signed out
 * at Checkout and goes on as a guest.
 *
 * XCEL's own modal since 2026-11-24 (Afsana): "Signing you out" in the ruled
 * header, the sentence saying why, then the spinner. The XCEL logo, the grey
 * notice box and the "Signing you out" line under the spinner went with the
 * Atlas-style card — XCEL's modals have none of them. No ✕: it holds, it
 * cannot be dismissed. The spinner keeps its words for a screen reader.
 *
 * It only draws the held moment. The cart owns the timer and what follows —
 * the sign-out and the Partner Code question.
 */
export function SigningOutDialog() {
  return (
    <XcelModalV3 titleId="v3-signing-out-title" title="Signing you out">
      <div style={BODY}>
        <p role="note" style={NOTICE}>
          To support an ongoing platform update, we need to sign you out.
        </p>
        <XcelLoadingStatus message="Signing you out" size={48} messageHidden />
      </div>
    </XcelModalV3>
  )
}

const BODY: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }

const NOTICE: CSSProperties = { alignSelf: 'stretch', margin: 0 }
