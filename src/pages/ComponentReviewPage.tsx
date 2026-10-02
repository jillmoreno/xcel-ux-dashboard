import { useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * ONE COMPONENT, EVERY VARIANT, STACKED — `/review`, 2026-09-25.
 *
 * The page a Refinement row points at when a designer wants the team to look at
 * ONE widget rather than their whole branch. A walkthrough branch renders every
 * change the designer has in flight, so a reviewer opening it cannot tell what
 * they are being asked about; this renders the chosen component's states one
 * under another, on the branch build, with nothing else in the way.
 *
 * ⚠ IT TAKES ITS WHOLE DEFINITION FROM THE URL, and that is the point. There is
 * no per-component code, no registry, no entry in `prototypeFeatures.ts` — which
 * matters twice over: a designer can produce a review link without Jillienne,
 * and `prototypeFeatures.ts` is a protected file they could not edit anyway.
 * Ships once, works for every component afterwards.
 *
 *   /review
 *     ?title=Study Pace Card
 *     &at=/dashboard-rebrand
 *     &note=the eyebrow sub-line is the part I want opinions on
 *     &v=Not started::dashboard-progress-state:not-started
 *     &v=On track::dashboard-progress-state:progress-on-track
 *
 * Each `v` is `Label::<ff expression>`, and the expression is passed through to
 * `?ff=` untouched — so every form that param already understands works here
 * (`key:on`, `key:off`, `key:variant`, `key:variant:secondary`, comma-separated).
 * No second grammar to learn or keep in step.
 *
 * ⚠ STACKED, NOT A SWITCHER, by the direct ask. The Live Preview tab on a
 * handoff shows one page at a time behind a picker; here the whole point is
 * COMPARING states, and a picker makes a reviewer hold the previous one in their
 * head. It also makes the page one screenshot-able artifact to drop into Slack.
 */
export function ComponentReviewPage() {
  const [params] = useSearchParams()
  /*
   * ⚠ THE FRAMES ARE INERT UNTIL CLICKED, and this is not a nicety — without it
   * the page does not work. A stacked page of iframes swallows the mouse wheel:
   * scrolling over the first state scrolls INSIDE it, so a reviewer never
   * reaches the second one and concludes the link is broken. Found on the first
   * real render of this page.
   *
   * So each frame starts `pointer-events: none` — the wheel passes straight
   * through to the page, and you glide down all the states — and becomes live
   * when you click it, which is when you actually want to poke at one. The same
   * pattern map embeds use, for the same reason.
   */
  const [live, setLive] = useState<number | null>(null)
  const title = params.get('title')?.trim() || 'Component review'
  const note = params.get('note')?.trim() || ''
  const at = params.get('at')?.trim() || '/dashboard-rebrand'
  /* `getAll`, so the param repeats rather than carrying its own separator — a
     delimiter here would have to survive labels containing it, and labels are
     written by a designer, not escaped by one. */
  const variants = params
    .getAll('v')
    .map((raw) => {
      const i = raw.indexOf('::')
      return i === -1
        ? { label: raw.trim(), ff: '' }
        : { label: raw.slice(0, i).trim(), ff: raw.slice(i + 2).trim() }
    })
    .filter((v) => v.label || v.ff)

  return (
    <main style={page}>
      <header style={head}>
        <p style={eyebrow}>Component review</p>
        <h1 style={h1}>{title}</h1>
        {note && <p style={noteStyle}>{note}</p>}
        <p style={meta}>
          {variants.length === 0
            ? 'No states given.'
            : `${variants.length} state${variants.length === 1 ? '' : 's'}, on this branch build. Scroll to compare.`}
        </p>
      </header>

      {variants.length === 0 ? (
        /* ⚠ NAMES THE PARAM. This page is built by a skill, and the way it fails
           is a malformed link — so the empty state is addressed to whoever has to
           fix it, not to a reviewer who can do nothing about it. */
        <p style={empty}>
          Add one or more <code>&amp;v=Label::flag-key:variant</code> parameters to this URL.
        </p>
      ) : (
        <ol style={list}>
          {variants.map((v, i) => {
            const url = `${at}${at.includes('?') ? '&' : '?'}${v.ff ? `ff=${encodeURIComponent(v.ff)}&` : ''}chrome=off`
            return (
              <li key={`${v.label}-${i}`} style={item}>
                <div style={itemHead}>
                  <span style={itemLabel}>{v.label || `State ${i + 1}`}</span>
                  {/* The pinned state, shown rather than hidden: a reviewer
                      reporting "the nav looks wrong" needs to see that the nav
                      was deliberately held at a value for this frame. */}
                  {v.ff && <code style={itemFf}>{v.ff}</code>}
                  <span style={hint}>
                    {live === i ? 'interactive — scroll the page from the edges' : 'click to interact'}
                  </span>
                </div>
                <div
                  style={frameWrap}
                  onClick={() => setLive(i)}
                  onMouseLeave={() => setLive((cur) => (cur === i ? null : cur))}
                >
                  <iframe
                    title={`${title} — ${v.label || `state ${i + 1}`}`}
                    src={url}
                    style={{ ...frame, pointerEvents: live === i ? 'auto' : 'none' }}
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </main>
  )
}

/* ─── styles ──────────────────────────────────────────────────────────── */

const page: CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
  padding: '32px 24px 64px',
  fontFamily: 'var(--font-body)',
  color: 'var(--color-text-primary)',
}

const head: CSSProperties = { marginBottom: 28 }

const eyebrow: CSSProperties = {
  margin: '0 0 6px',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const h1: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 30,
  lineHeight: 1.15,
  color: 'var(--color-text-primary)',
}

const noteStyle: CSSProperties = {
  margin: '10px 0 0',
  maxWidth: '62ch',
  fontSize: 15,
  lineHeight: 1.5,
  color: 'var(--color-text-secondary)',
}

const meta: CSSProperties = {
  margin: '12px 0 0',
  fontSize: 13,
  color: 'var(--color-text-tertiary)',
}

const empty: CSSProperties = {
  margin: 0,
  padding: '20px 22px',
  borderRadius: 2,
  border: '1px dashed var(--color-neutral-300)',
  fontSize: 14,
  color: 'var(--color-text-secondary)',
}

const list: CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 28,
}

const item: CSSProperties = { margin: 0 }

const itemHead: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 8,
}

const itemLabel: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--color-text-primary)',
}

const itemFf: CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: 11.5,
  color: 'var(--color-text-tertiary)',
}

/* A fixed viewport per state rather than a page-height frame: the states have to
   line up for comparison, and one tall frame pushes the next state off-screen
   entirely — which is the switcher problem this page exists to avoid. The frame
   scrolls internally for anything below the fold. */
const hint: CSSProperties = {
  marginInlineStart: 'auto',
  fontSize: 11,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

/* Releases the frame on mouse-out as well as on click elsewhere, so a reviewer
   who clicks one state and scrolls away is not still trapped in it. */
const frameWrap: CSSProperties = { display: 'block' }

const frame: CSSProperties = {
  width: '100%',
  height: 620,
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 2,
  background: 'var(--color-surface-card)',
  display: 'block',
}
