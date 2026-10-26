import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { GatewayShell } from './PrototypeFeaturePage'
import { variantDeckById, type VariantDeckMeta } from '@/data/variantDecks'
import { prototypeFeatureById } from '@/data/prototypeFeatures'

/**
 * The stakeholder explanation under a variant. On the Common LMS hub this is
 * `RenewalStateNarrative` from its renewal model; declared locally here so the
 * page is product-independent. Authored prose — nothing derives it.
 */
type DeckNarrative = { useCase: string; logic: string[]; upsell: string; openQuestion?: string }
import { copyToClipboard, PROTOTYPE_SHARE_ORIGIN } from '@/components/prototype/shareLink'
import { Toast } from '@/components/ui/Toast'
import { Share2 } from '@/icons'

/* ═══════════════════════════════════════════════════════════════════════
 * Variants & Copy deck — "Option 1: copy under the render".
 *
 * One card per state: the surfaces at their REAL widths, then the copy deck
 * beneath at the same width. Nothing scaled, nothing behind a click.
 *
 * Two alternatives were built and rejected in
 * `explorations/variants-copy-deck/copy-deck-layouts.html`. Side-by-side halves
 * the page height but forces the trio to ~70%, so real type sizes can no longer
 * be judged — which is the thing the render is here for. Copy-first puts the
 * render behind a fold, so card-and-sheet agreement stops being the default
 * view. The cost of this one is height, and the sticky state nav is what pays
 * for it.
 *
 * THE RULE THIS PAGE EXISTS TO HOLD: a string is rendered, never retyped. Every
 * value in the copy table comes off the resolved state object. The `when`
 * condition and the rationale stay AUTHORED — why amber and not red is a
 * judgement a person has to write down, and no model can derive it.
 * ═══════════════════════════════════════════════════════════════════════ */

/** One labelled copy field. `value` is `null` when the state genuinely has none
 *  — rendered as "none for this state" rather than omitted, because a missing
 *  row and an empty one look identical once a row is dropped, and the first
 *  reads as a bug in the page. */
type CopyField = { label: string; value: string | string[] | null; source: string }

type DeckRow = {
  id: string
  /** The status word the state shows — never colour alone. */
  pill: string
  pillStyle: CSSProperties
  /** Authored: the condition that selects this state. */
  when: string
  /** Present when no live fixture reaches this state and the row was built to
   *  reach it. Rendered as a visible badge — real copy, but not a membership
   *  anyone holds. */
  synthesizedNote?: string
  fields: CopyField[]
  surfaces: ReactNode
  /** The stakeholder explanation, rendered at the bottom of the variant.
   *  Authored — it is the reasoning, and nothing can derive it. */
  narrative?: DeckNarrative
}

/** Flattens a row to the text a reviewer pastes into a doc or a ticket. */
function rowAsText(row: DeckRow): string {
  const lines = [row.id, `  When: ${row.when}`]
  if (row.synthesizedNote) lines.push(`  Note: ${row.synthesizedNote}`)
  for (const f of row.fields) {
    if (f.value === null) continue
    const v = Array.isArray(f.value) ? f.value.join('\n         ') : f.value
    lines.push(`  ${f.label}: ${v}`)
  }
  if (row.narrative) {
    lines.push('', `  Use case: ${row.narrative.useCase}`, '  How it works:')
    for (const l of row.narrative.logic) lines.push(`    - ${l}`)
    lines.push(`  Membership upsell: ${row.narrative.upsell}`)
    if (row.narrative.openQuestion) lines.push(`  Open question: ${row.narrative.openQuestion}`)
  }
  return lines.join('\n')
}

/* ── row builders, by deck id ───────────────────────────────────────────
 * Each deck registered in `src/data/variantDecks.ts` names its rows here —
 * the surfaces at their real widths and every copy field read off the model
 * at render time. EMPTY on the XCEL hub (carried from the Common LMS hub
 * 2026-10-26, where `membership-renewal` builds its rows from the renewal
 * state machine). Add a builder beside its `VariantDeckMeta` and the page,
 * the route and the gateway's "Variants & copy deck" link all light up.
 */
const DECK_ROWS: Record<string, (deck: VariantDeckMeta) => DeckRow[]> = {}

/* ── page ─────────────────────────────────────────────────────────────── */

export function VariantDeckPage() {
  const { deckId } = useParams()
  const deck = variantDeckById(deckId)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => {
    document.title = deck ? `${deck.title} — Variants & Copy` : 'Variants & Copy'
  }, [deck])

  if (!deck) {
    return (
      <GatewayShell maxWidth={760}>
        <h1 style={titleStyle}>Deck not found</h1>
        <p style={{ marginTop: 12, color: 'var(--color-text-secondary)' }}>
          No variants deck is registered at that address. Add one to{' '}
          <code style={codeStyle}>src/data/variantDecks.ts</code>.
        </p>
      </GatewayShell>
    )
  }

  const rows = DECK_ROWS[deck.id]?.(deck) ?? []
  const feature = prototypeFeatureById(deck.featureId)
  const shareUrl = `${PROTOTYPE_SHARE_ORIGIN}/variants/${deck.id}`

  const copy = (text: string, label: string) => {
    copyToClipboard(text)
      .then(() => setToast(label))
      .catch(() => window.prompt('Copy this:', text))
  }

  const deckAsText = [
    deck.title,
    `Source: ${deck.source}`,
    '',
    ...rows.map(rowAsText),
  ].join('\n\n')

  return (
    // 1440, not the handoff page's 1120: the trio is 1232px at its real widths
    // and the copy table sits beneath it at the same width.
    <GatewayShell
      maxWidth={1440}
      back={feature ? { to: `/prototype/${feature.id}`, title: `Back to ${feature.title}` } : undefined}
    >
      <header style={{ margin: '28px 0 8px' }}>
        <p style={eyebrowStyle}>Variants &amp; copy</p>
        <h1 style={titleStyle}>{deck.title}</h1>
        <p style={ledeStyle}>{deck.blurb}</p>
        <p style={sourceStyle}>
          Every string below is read from <code style={codeStyle}>{deck.source}</code> as the page
          renders, so this cannot fall out of step with the build.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 16 }}>
          <button type="button" style={primaryBtnStyle} onClick={() => copy(deckAsText, 'Whole deck copied')}>
            Copy all {rows.length} states as text
          </button>
          <button type="button" style={btnStyle} onClick={() => copy(shareUrl, 'Link copied')}>
            <Share2 size={13} aria-hidden style={{ verticalAlign: '-2px', marginRight: 5 }} />
            Copy link
          </button>
          {feature && (
            <Link to={`/prototype/${feature.id}`} style={{ ...btnStyle, textDecoration: 'none' }}>
              The full handoff
            </Link>
          )}
        </div>
      </header>

      {/* Sticky state nav. The cost of Option 1 is height — six states at full
          size is a long scroll — and this is what pays for it. Plain anchors:
          they navigate within one document, and every state stays in the DOM so
          find-in-page, select-all and print keep working. */}
      <nav aria-label="States" style={navStyle}>
        <span style={navLabelStyle}>States</span>
        {rows.map((r) => (
          <a key={r.id} href={`#${r.id}`} style={navLinkStyle}>
            {r.id}
          </a>
        ))}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 72 }}>
        {rows.map((row) => (
          <section key={row.id} id={row.id} style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <h2 style={stateIdStyle}>{row.id}</h2>
              <span style={row.pillStyle}>{row.pill}</span>
              {row.synthesizedNote && <span style={synthBadgeStyle}>Built for this deck</span>}
            </div>
            <p style={whenStyle}>{row.when}</p>
            {row.synthesizedNote && <p style={synthNoteStyle}>{row.synthesizedNote}</p>}

            <div style={{ marginTop: 16 }}>{row.surfaces}</div>

            <div style={copyBlockStyle}>
              <div style={copyHeadStyle}>
                <h3 style={copyHeadLabelStyle}>Copy — read from the model</h3>
                <button
                  type="button"
                  style={btnStyle}
                  onClick={() => copy(rowAsText(row), `“${row.id}” copied`)}
                >
                  Copy as text
                </button>
              </div>
              <table style={tableStyle}>
                <tbody>
                  {row.fields.map((f) => (
                    <tr key={f.label}>
                      <th scope="row" style={thStyle}>
                        {f.label}
                      </th>
                      <td style={tdStyle}>
                        {f.value === null ? (
                          <span style={noneStyle}>none for this state</span>
                        ) : Array.isArray(f.value) ? (
                          f.value.map((line, i) => (
                            <span key={i} style={{ display: 'block' }}>
                              {line}
                            </span>
                          ))
                        ) : (
                          f.value
                        )}
                        <span style={derivedStyle}>{f.source}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {row.narrative && <NarrativeBlock narrative={row.narrative} />}
          </section>
        ))}
      </div>

      <Toast
        open={toast !== null}
        onClose={() => setToast(null)}
        tone="success"
        title="Copied"
        duration={2600}
      >
        {toast ?? ''}
      </Toast>
    </GatewayShell>
  )
}

/**
 * The stakeholder section at the foot of a variant.
 *
 * Deliberately the LAST thing in the card: the render and the copy are the
 * evidence, and this is the explanation of them. Reading it first would tell
 * someone what to think before they had seen the thing.
 *
 * It is visually separated rather than boxed — a second bordered panel inside a
 * bordered card is the "box in a box" the preview sections were already fixed
 * for once.
 */
function NarrativeBlock({ narrative }: { narrative: DeckNarrative }) {
  return (
    <div style={narrativeStyle}>
      <h3 style={narrativeHeadStyle}>What this is</h3>
      <p style={narrativeProseStyle}>{narrative.useCase}</p>

      <h3 style={{ ...narrativeHeadStyle, marginTop: 18 }}>How it works</h3>
      <ul style={narrativeListStyle}>
        {narrative.logic.map((line, i) => (
          <li key={i} style={narrativeItemStyle}>
            {line}
          </li>
        ))}
      </ul>

      {/* Always present, even where the answer is "nothing changes". The
          question is worth an answer on every state, and an absent line reads
          as nobody having checked. */}
      <h3 style={{ ...narrativeHeadStyle, marginTop: 18 }}>Membership upsell banner</h3>
      <p style={narrativeProseStyle}>{narrative.upsell}</p>

      {narrative.openQuestion && (
        <div style={openQuestionStyle}>
          <span style={openQuestionLabelStyle}>Open question</span>
          <p style={{ ...narrativeProseStyle, margin: '4px 0 0' }}>{narrative.openQuestion}</p>
        </div>
      )}
    </div>
  )
}

/* ── styles ───────────────────────────────────────────────────────────── */

/** Separated by a rule rather than boxed — see `NarrativeBlock`. */
const narrativeStyle: CSSProperties = {
  marginTop: 24,
  paddingTop: 20,
  borderTop: '1px solid var(--color-border-subtle)',
}

const narrativeHeadStyle: CSSProperties = {
  margin: 0,
  font: '700 11px/1.3 var(--font-body)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

// 76ch — the gateway's reading measure. At the card's full width this prose
// would run past 140 characters a line, about twice what is comfortable.
const narrativeProseStyle: CSSProperties = {
  margin: '6px 0 0',
  maxWidth: '76ch',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-secondary)',
}

const narrativeListStyle: CSSProperties = {
  margin: '6px 0 0',
  paddingLeft: 18,
  maxWidth: '76ch',
  // The app's reset zeroes list markers globally, so a bare <ul> renders as
  // indented lines with nothing to hang the eye on.
  listStyle: 'disc',
}

const narrativeItemStyle: CSSProperties = {
  margin: '0 0 5px',
  fontSize: 14,
  lineHeight: '21px',
  color: 'var(--color-text-secondary)',
}

/** An unresolved decision, marked so it cannot be read as settled behaviour. */
const openQuestionStyle: CSSProperties = {
  marginTop: 18,
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  borderLeft: '3px solid var(--color-warning-500)',
  background: 'var(--color-warning-100)',
}

const openQuestionLabelStyle: CSSProperties = {
  font: '700 10.5px/1.4 var(--font-body)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--color-warning-800)',
}

const eyebrowStyle: CSSProperties = {
  margin: 0,
  font: '700 11px/1.3 var(--font-body)',
  letterSpacing: '0.09em',
  textTransform: 'uppercase',
  color: 'var(--color-primary-600)',
}

const titleStyle: CSSProperties = {
  margin: '8px 0 0',
  font: '700 var(--text-heading-3xl)/1.15 var(--font-heading)',
  color: 'var(--color-text-primary)',
}

// 76ch — the gateway's reading measure. Full-column prose measures ~145
// characters here, roughly twice the comfortable maximum.
const ledeStyle: CSSProperties = {
  margin: '10px 0 0',
  maxWidth: '76ch',
  fontSize: 15,
  lineHeight: '23px',
  color: 'var(--color-text-secondary)',
}

const sourceStyle: CSSProperties = {
  margin: '8px 0 0',
  maxWidth: '76ch',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-tertiary)',
}

const codeStyle: CSSProperties = {
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
}

const navStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 4,
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 6,
  margin: '20px 0 16px',
  padding: '10px 0',
  background: 'var(--ux-bg, var(--color-surface-page))',
}

const navLabelStyle: CSSProperties = {
  font: '700 10px/1.3 var(--font-body)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  marginRight: 4,
}

const navLinkStyle: CSSProperties = {
  padding: '5px 11px',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  color: 'var(--color-text-primary)',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 12,
  textDecoration: 'none',
}

const cardStyle: CSSProperties = {
  padding: 24,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg)',
  // Clears the sticky state nav so a jump does not land the heading under it.
  scrollMarginTop: 68,
}

const stateIdStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'ui-monospace, monospace',
  fontSize: 17,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const whenStyle: CSSProperties = {
  margin: '8px 0 0',
  maxWidth: '76ch',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-secondary)',
}

const copyBlockStyle: CSSProperties = {
  marginTop: 22,
  paddingTop: 4,
}

const copyHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  paddingBottom: 10,
  borderBottom: '1px solid var(--color-border-subtle)',
}

const copyHeadLabelStyle: CSSProperties = {
  margin: 0,
  font: '700 11px/1.3 var(--font-body)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
}

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: 14,
  lineHeight: '21px',
}

const thStyle: CSSProperties = {
  width: 132,
  textAlign: 'left',
  verticalAlign: 'top',
  padding: '9px 14px 9px 0',
  font: '700 10.5px/1.5 var(--font-body)',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: 'var(--color-text-tertiary)',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const tdStyle: CSSProperties = {
  verticalAlign: 'top',
  padding: '9px 0',
  color: 'var(--color-text-primary)',
  borderBottom: '1px solid var(--color-border-subtle)',
}

const noneStyle: CSSProperties = {
  color: 'var(--color-text-tertiary)',
  fontStyle: 'italic',
}

/** Names the field each string came off. It is the page's whole claim made
 *  checkable — a reader can open the model and verify any line. */
const derivedStyle: CSSProperties = {
  display: 'inline-block',
  marginLeft: 8,
  padding: '1px 6px',
  borderRadius: 4,
  background: 'var(--color-primary-100)',
  color: 'var(--color-primary-800)',
  fontFamily: 'ui-monospace, monospace',
  fontSize: 10,
  fontWeight: 700,
  verticalAlign: '1px',
  whiteSpace: 'nowrap',
}

/** Marks a row no live fixture reaches. Warning ramp at -800 on -100 (7.62:1),
 *  the same pairing the handoff badges use — it is a qualifier, not an alarm,
 *  and it must not read as a status the membership is in. */
const synthBadgeStyle: CSSProperties = {
  padding: '2px 8px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-warning-100)',
  color: 'var(--color-warning-800)',
  font: '700 10px/1.5 var(--font-body)',
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
}

const synthNoteStyle: CSSProperties = {
  margin: '4px 0 0',
  maxWidth: '76ch',
  fontSize: 12.5,
  lineHeight: '18px',
  color: 'var(--color-warning-800)',
}

const btnStyle: CSSProperties = {
  padding: '7px 13px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border-subtle)',
  background: 'var(--color-surface-card)',
  color: 'var(--color-action)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  cursor: 'pointer',
}

const primaryBtnStyle: CSSProperties = {
  ...btnStyle,
  border: '1px solid var(--color-action)',
  background: 'var(--color-action)',
  color: 'var(--color-text-inverse)',
}
