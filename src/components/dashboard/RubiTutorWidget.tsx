import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoFi } from '@/context/LoFiContext'
import { LoFiWidgetBody } from '@/components/lo-fi/LoFiPlaceholders'

/**
 * Dashboard V2 — Rubi Tutor AI assistant widget.
 *
 * Replaces the generic `SidebarCard` rendering for Rubi in V2's right
 * rail. Matches the design reference shipped 2026-05-26:
 *
 *   - Centered hexagonal sparkle medallion (brand-colored).
 *   - "What can I help you with?" headline.
 *   - Pill-shaped input ("Ask Rubi…") with a circular send button.
 *   - "Suggested" eyebrow + 3 quick-prompt rows, each prefixed by a
 *     small hexagonal sparkle bullet.
 *
 * The input is wired to `useNavigate` and routes the learner to the
 * Rubi chat surface (`/account/tutoring`) when they submit — same
 * destination as the legacy "Let's Go" CTA so deep links continue to
 * resolve. Suggested prompts seed the input with the prompt text and
 * fire the same navigate handler.
 */
export function RubiTutorWidget() {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const { loFi } = useLoFi()
  if (loFi) {
    return (
      <section aria-label="Rubi — AI tutor" style={loFiWidgetStyle}>
        <LoFiWidgetBody rows={4} showCta ariaLabel="Lo-fi Rubi widget" />
      </section>
    )
  }

  const submit = (prompt: string) => {
    const q = prompt.trim()
    if (!q) {
      navigate('/account/tutoring')
      return
    }
    navigate(`/account/tutoring?q=${encodeURIComponent(q)}`)
  }

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submit(value)
  }

  return (
    <section
      aria-label="Rubi — AI tutor"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '12px 20px 24px',
        background: 'var(--color-surface-card)',
        border: '1px solid var(--color-border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Top-left eyebrow — matches the Quick Links / Jump Back In /
          Learning Paths / Courses tiles so the widget reads as part of
          the same sidebar family. `alignSelf: stretch` lets the span
          span the full card width inside this center-aligned column. */}
      <span
        style={{
          alignSelf: 'stretch',
          fontFamily: 'var(--font-body)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'var(--color-text-secondary)',
        }}
      >
        AI Assistant - Rubi Tutor
      </span>
      {/* Medallion + headline group — left-aligned horizontal row. The
          icon shrinks from 56→40 so it sits comfortably next to the
          18px h3 baseline; full size felt outsized once the two were
          side-by-side. `alignSelf: stretch` lets this row span the
          card width inside the parent's center-aligned column. */}
      <div
        style={{
          alignSelf: 'stretch',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <HexSparkleLogo size={40} />
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontSize: 18,
            fontWeight: 600,
            lineHeight: '24px',
            color: 'var(--color-text-primary)',
          }}
        >
          What can I help you with?
        </h3>
      </div>

      <form
        onSubmit={onSubmit}
        role="search"
        aria-label="Ask Rubi a question"
        style={{
          position: 'relative',
          width: '100%',
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Ask Rubi…"
          aria-label="Ask Rubi"
          style={{
            width: '100%',
            height: 44,
            padding: '0 48px 0 18px',
            borderRadius: 999,
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-neutral-100)',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-action)'
            e.currentTarget.style.background = 'var(--color-surface-card)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border-subtle)'
            e.currentTarget.style.background = 'var(--color-neutral-100)'
          }}
        />
        <button
          type="submit"
          aria-label="Send question to Rubi"
          style={{
            position: 'absolute',
            top: '50%',
            right: 6,
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            background: 'var(--color-neutral-400)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 160ms ease',
          }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-action)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--color-neutral-400)'
          }}
        >
          <UpArrowIcon size={14} />
        </button>
      </form>

      <div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <span
          style={{
            // Match the "Personal best" eyebrow in the streak hero —
            // 11/500/16, secondary text — so the dashboard's small-
            // caption typography reads consistently across widgets.
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 500,
            lineHeight: '16px',
            color: 'var(--color-text-secondary)',
          }}
        >
          Suggested
        </span>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          {SUGGESTIONS.map((prompt) => (
            <li key={prompt}>
              <button
                type="button"
                onClick={() => submit(prompt)}
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 4px',
                  background: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background 160ms ease',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background =
                    'var(--color-neutral-100)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                }}
              >
                <HexSparkleLogo size={20} bordered />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: 13,
                    lineHeight: '18px',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {prompt}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const SUGGESTIONS = [
  'Summarize what I learned this week',
  'Quiz me on my current course',
  'What should I study next?',
] as const

/**
 * Hexagonal sparkle medallion. Two render modes:
 *   - default (no `bordered`): solid brand-colored hexagon with a white
 *     sparkle glyph, used as the headline medallion at the top of the
 *     widget.
 *   - `bordered`: outlined hexagon (no fill) with a brand-colored
 *     sparkle, used as the bullet glyph next to each suggested prompt.
 *
 * Sized via the `size` prop (pixels, square). The internal viewBox is a
 * fixed 24-unit grid so the hexagon + sparkle stay proportional.
 */
function HexSparkleLogo({ size = 56, bordered = false }: { size?: number; bordered?: boolean }) {
  // Regular hexagon with flat top, inset 1.5 units from the viewBox edges
  // to give the stroke room to render without clipping.
  const hexPath = 'M12 1.5 L21.5 7 L21.5 17 L12 22.5 L2.5 17 L2.5 7 Z'
  // 4-pointed sparkle, centered at (12, 12), reaching toward each side.
  const sparkPath =
    'M12 6.5 L13.3 10.7 L17.5 12 L13.3 13.3 L12 17.5 L10.7 13.3 L6.5 12 L10.7 10.7 Z'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden
      style={{ flexShrink: 0, display: 'inline-block' }}
    >
      <path
        d={hexPath}
        fill={bordered ? 'transparent' : 'var(--color-primary-500)'}
        stroke={bordered ? 'var(--color-primary-500)' : 'none'}
        strokeWidth={bordered ? 1.5 : 0}
        strokeLinejoin="round"
      />
      <path
        d={sparkPath}
        fill={bordered ? 'var(--color-primary-500)' : 'var(--color-text-inverse)'}
      />
    </svg>
  )
}

function UpArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
      style={{ display: 'inline-block' }}
    >
      <path
        d="M8 12.5 V3.5 M8 3.5 L3.5 8 M8 3.5 L12.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// Lo-Fi shell — matches the live widget's padding / border / radius
// so the right rail keeps its rhythm when the placeholder slots in.
const loFiWidgetStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
  padding: '20px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
}
