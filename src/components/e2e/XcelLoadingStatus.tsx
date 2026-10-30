import type { CSSProperties } from 'react'

/**
 * THE LOADING SPINNER AND ITS LINE — moved out of `XcelLoadingPage`
 * 2026-10-30, unchanged, so Invite Flow V3's "Placing your order" dialog can
 * draw the same one over the checkout (Afsana's file, screen `placing`). The
 * loading page renders this, so the two cannot drift.
 */
export function XcelLoadingStatus({ message }: { message: string }) {
  return (
    <div role="status" aria-live="polite" style={LOADING_STACK}>
      <svg aria-hidden viewBox="0 0 72 72" width={72} height={72} style={{ display: 'block', overflow: 'visible' }}>
        <circle cx={36} cy={36} r={32} fill="none" strokeWidth={3} style={{ stroke: 'var(--color-e2e-form-outline)' }} />
        <circle
          className="cre-e2e-loading-arc"
          cx={36}
          cy={36}
          r={32}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray="56 145"
          style={{ stroke: 'var(--color-xcel-brick-600)' }}
        />
        <circle
          className="cre-e2e-loading-arc-inner"
          cx={36}
          cy={36}
          r={21}
          fill="none"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="30 102"
          strokeOpacity={0.4}
          style={{ stroke: 'var(--color-xcel-brick-600)' }}
        />
        <circle className="cre-e2e-loading-pulse" cx={36} cy={36} r={5} style={{ fill: 'var(--color-xcel-brick-600)' }} />
      </svg>
      <p style={LOADING_TEXT}>
        {message}
        {/* ⚠ THE ELLIPSIS IS READ ONCE, NOT ANIMATED, for a screen reader:
            `aria-live` would otherwise re-announce the line every time a
            dot typed itself. */}
        <span style={SR_ONLY}>…</span>
        <span aria-hidden>
          <span className="cre-e2e-loading-dot">.</span>
          <span className="cre-e2e-loading-dot">.</span>
          <span className="cre-e2e-loading-dot">.</span>
        </span>
      </p>
    </div>
  )
}

const LOADING_STACK: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 28,
}

const LOADING_TEXT: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '24px',
  color: 'var(--color-neutral-950)',
  textAlign: 'center',
}

/* Screen readers get the ellipsis as one character; sighted viewers get the
   three dots typing themselves. */
const SR_ONLY: CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
}
