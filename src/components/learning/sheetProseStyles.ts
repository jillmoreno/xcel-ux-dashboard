import type { CSSProperties } from 'react'

/**
 * THE NUMBERS AND THE PARSER BEHIND `sheetProse.tsx`.
 *
 * ⚠ A PLAIN `.ts` MODULE ON PURPOSE. These are not components, and exporting
 * them from the `.tsx` file trips react-refresh's "only export components"
 * rule — the same split `pageHeaderStyles.ts` and `navPlacement.ts` already
 * make. The reasoning for every value lives next to it; the WHY for the
 * treatment as a whole is in `sheetProse.tsx`.
 */

/**
 * Split "Label — rest of the sentence" into its two halves, or `null`.
 *
 * ⚠ THE LENGTH GUARD IS THE WHOLE FUNCTION. An em dash in this copy means one
 * of two things — a short LABEL introducing its detail ("State exam — 150
 * scored questions…", "Exam fee — $40"), or an ordinary mid-sentence dash
 * ("Register online with PSI at test-takers.psiexams.com/nyins — exam fee
 * $40"). Emphasising the first half of the second kind would bold a URL and
 * read as a mistake, so anything longer than a label is left alone. 44 was
 * measured against every entry in both data sets: the longest real label is
 * "Pre-licensing education" and the shortest false positive is the PSI line
 * at 54.
 *
 * ⚠ IT IS PRESENTATION ONLY. Nothing downstream depends on an entry carrying a
 * dash, and one written without it simply renders flat — which is what makes
 * this safe to apply to every path's data rather than only the entries written
 * in this shape.
 */
export const PROSE_LABEL_MAX = 44

export function splitLead(text: string): { lead: string; rest: string } | null {
  /* ⚠ TWO DELIMITERS, AND THE COLON IS THE RISKIER ONE. An em dash in this
     copy is almost always a label; a colon is also ordinary punctuation, so it
     carries a second guard — the remainder must begin with a capital, which is
     what separates "Prep Review Course: This part of the training…" from a
     lowercase continuation. Audited against every string in both data sets,
     2026-10-07: the colon matches exactly the two nested entries it was added
     for, and the trailing-colon lines ("Registration must be completed online
     on the PSI website:") fall out on the empty-remainder test below.

     ⚠ THE FIRST MATCH WINS, which matters for the Exam Simulator entry — it
     carries a second colon ("…retention levels. Important: Only take…") and
     emphasising both would turn one bullet into two labels. */
  const at = [text.indexOf(' — '), text.indexOf(': ')]
    .map((i, k) => ({ i, len: k === 0 ? 3 : 2 }))
    .filter((m) => m.i >= 0 && m.i <= PROSE_LABEL_MAX)
    .sort((a, b) => a.i - b.i)[0]
  if (!at) return null
  const rest = text.slice(at.i + at.len).trim()
  if (!rest) return null
  /* A colon's remainder has to look like a new sentence; an em dash's does not
     ("Exam fee — $40"). */
  if (at.len === 2 && rest[0] !== rest[0].toUpperCase()) return null
  return { lead: text.slice(0, at.i).trim(), rest }
}



export const proseListStyle: CSSProperties = { listStyle: 'none', margin: 0, padding: 0 }

export const proseItemStyle: CSSProperties = {
  display: 'flex',
  gap: 9,
  marginBottom: 7,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '19px',
  color: 'var(--color-text-primary)',
}

/* A nested bullet is a qualification of the one above it, so it recedes: the
   secondary ink and a hollow marker, which is the same distinction the journey
   rail draws between a stop and its sub-steps. */
export const proseItemNestedStyle: CSSProperties = {
  ...proseItemStyle,
  marginBottom: 6,
  color: 'var(--color-text-secondary)',
}

/* Centred on the first line's box: (19 − 5) / 2 = 7. `flex: none` so a long
   item cannot squeeze the dot into an oval. */
export const proseMarkerStyle: CSSProperties = {
  flex: 'none',
  width: 5,
  height: 5,
  marginTop: 7,
  borderRadius: '50%',
  background: 'var(--color-text-tertiary)',
}

export const proseMarkerNestedStyle: CSSProperties = {
  ...proseMarkerStyle,
  background: 'transparent',
  boxShadow: 'inset 0 0 0 1px var(--color-text-tertiary)',
}

/* ⚠ WEIGHT ONLY, NO COLOUR. The lead is a scanning aid inside a sentence that
   continues through it — recolouring would make it look like a link, which is
   the one thing these are not. The step sheet puts REAL links in the same
   paragraphs, so the distinction has to hold there. */
export const proseLeadStyle: CSSProperties = { fontWeight: 600 }

export const proseFactsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
  gap: 1,
  margin: 0,
  background: 'var(--color-border-subtle)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-md)',
  overflow: 'hidden',
}

export const proseFactCellStyle: CSSProperties = {
  background: 'var(--color-surface-card)',
  padding: '11px 14px 12px',
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export const proseFactLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 10,
  lineHeight: '14px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--color-text-secondary)',
}

export const proseFactTextStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: '17px',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

export const proseFactValueStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 16,
  lineHeight: '20px',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

/* A section's title, with the hairline that gives a long page its rhythm — six
   identical bold-title-then-list blocks had none, which is most of what the ask
   called "chaos". The rule costs no vertical space the margin was not already
   spending. */
export const proseSectionStyle: CSSProperties = {
  marginTop: 20,
  paddingTop: 16,
  borderTop: '1px solid var(--color-border-subtle)',
}

export const proseSectionTitleStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontWeight: 700,
  fontSize: 14,
  lineHeight: '19px',
  margin: '0 0 6px',
  color: 'var(--color-text-primary)',
}
