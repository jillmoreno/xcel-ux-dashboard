import type { CSSProperties } from 'react'
import { TOPO_CONTOURS, TOPO_VIEWBOX } from './topoContours'

/**
 * THE TOPO MAP behind the Invite & Purchase flow's loading page (2026-10-15,
 * Jillienne: "a fancier gif with a topo map layout in the background, very
 * light gray"). Inline SVG rather than a gif so the lines are one token
 * (`--color-e2e-topo`) and stay crisp at any size; the contours are
 * generated, see `topoContours.ts`. It drifts very slowly — a 40s breath,
 * off under reduced motion — and a soft wash of the page colour sits over
 * the middle so the spinner and its line read over the lines.
 */
export function TopoBackground() {
  return (
    <div aria-hidden style={WRAP}>
      <svg
        className="cre-e2e-loading-topo"
        viewBox={TOPO_VIEWBOX}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={SVG}
      >
        <g fill="none" stroke="currentColor" strokeLinejoin="round" strokeLinecap="round">
          {TOPO_CONTOURS.map((c, i) => (
            <path key={i} d={c.d} strokeWidth={c.major ? 1.75 : 1} />
          ))}
        </g>
      </svg>
      <div style={WASH} />
    </div>
  )
}

const WRAP: CSSProperties = { position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }

const SVG: CSSProperties = { display: 'block', color: 'var(--color-e2e-topo)' }

const WASH: CSSProperties = {
  position: 'absolute',
  inset: 0,
  background:
    'radial-gradient(ellipse 36% 40% at 50% 50%, color-mix(in srgb, var(--color-neutral-75) 90%, transparent) 0%, transparent 100%)',
}
