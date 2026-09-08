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
  DevHandoffUiUxLogic,
  DevHandoffUserStory,
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

function userStoryLines(story: DevHandoffUserStory): string[] {
  const out = [
    '#### User Story',
    '',
    `**As a** ${story.asA}`,
    `**I want** ${story.iWant}`,
    `**So that** ${story.soThat}`,
    '',
  ]
  if (story.value) out.push(`**Why it matters.** ${story.value}`, '')
  if (story.notes?.length) out.push(...bullets(story.notes), '')
  return out
}

function uxLogicLines(logic: DevHandoffUiUxLogic): string[] {
  const out = ['#### UX Logic', '', logic.why, '']
  if (logic.actions?.length) {
    out.push('**Actions**', '')
    for (const a of logic.actions) out.push(`- **${a.name}** — ${a.detail}`)
    out.push('')
  }
  if (logic.variants?.length) {
    out.push('**Variants**', '')
    for (const v of logic.variants) {
      const when = v.when ? ` _(${v.when})_` : ''
      out.push(`- **${v.name}**${when} — ${v.why} → ${v.action}`)
    }
    out.push('')
  }
  out.push(...listSection('Edge cases', logic.edgeCases))
  out.push(...listSection('Toaster logic', logic.toasterLogic))
  return out
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
  out.push(...listSection('States', spec.states))
  out.push(...listSection('Responsive', spec.responsive))
  out.push(...listSection('Sources', spec.sources))
  return out
}

/** `location` is sometimes a bare path and sometimes a paragraph of prose that
 *  happens to contain paths. Backticking the second kind renders a
 *  screen-wide code span, so only a genuine one-token path gets code
 *  formatting; anything with a sentence in it is emitted as prose. */
function locationLine(location: string): string {
  return /^\S+$/.test(location.trim()) ? `\`${location.trim()}\`` : location
}

function componentLines(c: DevHandoffComponent): string[] {
  const when = c.badgeDate ? shortDate(c.badgeDate) : null
  const badge = c.badge ? ` — ${c.badge}${when ? ` (${when})` : ''}` : ''
  const out = [`### ${c.name}${badge}`, '', locationLine(c.location), '', c.summary, '']

  if (c.userStory) out.push(...userStoryLines(c.userStory))

  if (c.variants.length) {
    out.push('#### Variants', '')
    for (const v of c.variants) {
      out.push(`- **${v.name}** — ${v.when}${v.detail ? ` ${v.detail}` : ''}`)
    }
    out.push('')
  }

  if (c.uiUxLogic) out.push(...uxLogicLines(c.uiUxLogic))
  else out.push(...listSection('UX Logic', c.uxLogic))

  if (c.designSpec) out.push(...designSpecLines(c.designSpec))

  // Acceptance criteria as checkboxes: this list is a Definition of Done, and
  // most trackers render `- [ ]` as something you can tick off.
  if (c.acceptanceCriteria?.length) {
    out.push('#### Acceptance', '', ...c.acceptanceCriteria.map((a) => `- [ ] ${a}`), '')
  }

  if (c.statesMatrix?.length) {
    out.push('#### States', '', '| State | Expected behaviour |', '| --- | --- |')
    for (const s of c.statesMatrix) out.push(`| ${s.state} | ${s.behavior} |`)
    out.push('')
  }

  out.push(...listSection('Data', c.data))
  out.push(...listSection('Stubs / TODO', c.stubs))
  out.push(...listSection('Accessibility', c.a11y))
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
    out.push('## Design & product decisions', '')
    if (decisions.intro) out.push(decisions.intro, '')
    decisions.items.forEach((d, i) => {
      out.push(`**${i + 1}. ${d.question}** _(${d.status})_`, '', d.decision, '')
      if (d.owner) out.push(`Owner / needs: ${d.owner}`, '')
    })
    if (decisions.openItems?.length) out.push(...listSection('Open items', decisions.openItems))
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
