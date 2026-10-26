/**
 * Serialise a feature's dev handoff to Markdown.
 *
 * Exists because the handoff's real destination is usually somewhere else — a
 * ticket, a PR description, a Slack thread — and the gateway page is a poor
 * clipboard. Selecting the rendered page copies its chrome and loses every
 * heading level; this produces the same content as a document.
 *
 * Ordered to match the page, so someone reading the file and someone reading the
 * screen are working through the same sequence: the decisions log, then each
 * component with Preview omitted (a live render has no Markdown form) and every
 * other section in its on-screen order.
 *
 * Nothing here invents content. A field that is not authored is skipped rather
 * than emitted empty — a heading with nothing under it reads as a gap in the
 * work rather than a gap in the export.
 */
import type {
  DevHandoffComponent,
  DevHandoffDesignSpec,
  PrototypeFeature,
} from '@/data/prototypeFeatures'

/** `2026-08-31` → `8/31/26`, by hand. No `Date` is constructed: `new Date(iso)`
 *  parses as UTC and renders the previous day in a western timezone. */
function shortDate(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  return m ? `${Number(m[2])}/${Number(m[3])}/${m[1].slice(2)}` : null
}

function bullets(items: readonly string[] | undefined): string[] {
  return items?.length ? items.map((i) => `- ${i}`) : []
}

/** A titled bullet list, or nothing at all when the field is unauthored. */
function listSection(title: string, items: readonly string[] | undefined): string[] {
  return items?.length ? [`#### ${title}`, '', ...bullets(items), ''] : []
}

function designSpecLines(spec: DevHandoffDesignSpec): string[] {
  const out = ['#### Design Spec', '']
  if (spec.tokens.length) {
    // A table because tokens are two aligned columns that get compared down the
    // page — the one part of a handoff that is genuinely tabular.
    out.push('| Role | Token |', '| --- | --- |')
    for (const t of spec.tokens) out.push(`| ${t.role} | \`${t.token}\` |`)
    out.push('')
  }
  out.push(...listSection('Layout', spec.responsive))
  out.push(...listSection('Interaction', spec.states))
  out.push(...listSection('Source of truth', spec.sources))
  return out
}

function componentLines(c: DevHandoffComponent): string[] {
  const when = c.badgeDate ? shortDate(c.badgeDate) : null
  const badge = c.badge ? ` — ${c.badge}${when ? ` (${when})` : ''}` : ''
  const out = [`### ${c.name}${badge}`, '', c.summary, '']


  if (c.variants.length) {
    out.push('#### Variants', '')
    for (const v of c.variants) {
      const parts = [`- **${v.name}** — ${v.when}`]
      if (v.detail && v.detail !== '—') parts.push(v.detail)
      if (v.why) parts.push(`_Why it exists._ ${v.why}`)
      if (v.action) parts.push(`_Action._ ${v.action}`)
      out.push(parts.join(' '))
    }
    out.push('')
  }

  if (c.ctas?.length) {
    out.push('#### CTAs', '')
    for (const cta of c.ctas) out.push(`- **${cta.name}** — ${cta.does}`)
    out.push('')
  }

  // Edge cases: the matrix and the prose cases under ONE heading, the way the
  // page renders them since 2026-10-21.
  if (c.statesMatrix?.length || c.edgeCases?.length) {
    out.push('#### Edge cases', '')
    if (c.statesMatrix?.length) {
      for (const st of c.statesMatrix) {
        out.push(`**Q.** ${st.question}`, '', `**A.** ${st.answer}`, '')
      }
    }
    if (c.edgeCases?.length) out.push(...bullets(c.edgeCases), '')
  }

  if (c.designSpec) out.push(...designSpecLines(c.designSpec))

  if (c.jiraTickets?.length) out.push(...listSection('Jira', c.jiraTickets))
  return out
}

/**
 * The whole feature as a Markdown document.
 *
 * `origin` is passed in rather than imported so the caller decides whether the
 * link points at the deployed prototype or localhost — a file pasted into a
 * ticket needs the former, and only the caller knows which it is.
 */
export function featureHandoffMarkdown(feature: PrototypeFeature, origin: string): string {
  const out: string[] = [`# ${feature.title}`, '', feature.blurb, '']
  out.push(`Walkthrough: ${origin}/prototype/${feature.id}`, '')

  const decisions = feature.devHandoff?.decisions
  if (decisions?.items.length) {
    out.push('## Questions', '')
    if (decisions.intro) out.push(decisions.intro, '')
    decisions.items.forEach((d, i) => {
      out.push(`**${i + 1}. ${d.question}** _(${d.status})_`, '', d.decision, '')
      if (d.owner) out.push(`Owner / needs: ${d.owner}`, '')
    })
    if (decisions.openItems?.length) out.push(...listSection('Open items', decisions.openItems))
  }

  // The designer's own words, when there are any — an empty section would read
  // as a gap in the work, which is the opposite of what "nothing to add" means.
  const notes = (feature.devHandoff?.designerNotes ?? []).map((n) => n.trim()).filter(Boolean)
  if (notes.length) {
    out.push("## Designer's notes", '')
    for (const n of notes) out.push(n, '')
  }

  const components = feature.devHandoff?.uiComponents ?? []
  if (components.length) {
    out.push('## UI components & UX logic', '')
    const ordered = [...components]
      .map((c, i) => ({ c, i }))
      .sort((a, b) => (a.c.order ?? a.i + 1000) - (b.c.order ?? b.i + 1000))
      .map(({ c }) => c)
    for (const c of ordered) out.push(...componentLines(c))
  }

  // Collapse the runs of blank lines the section helpers leave behind, so the
  // file reads as written rather than as generated.
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
}

/** Filename for the download — the feature id, which is already kebab-case and
 *  unique, so no slugging is needed and the file is greppable back to source. */
export function handoffMarkdownFilename(feature: PrototypeFeature): string {
  return `${feature.id}-handoff.md`
}
