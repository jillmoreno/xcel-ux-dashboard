/**
 * THE DESIGN SECTION — derived from branches, authored by nobody (2026-11-16).
 *
 * Every branch Netlify has built lately, grouped by the FEATURE its name
 * says it is for, each row saying where the work is: building, built and
 * open to look at, on stage, released. Nothing here is a record a person
 * wrote. The designer's whole job is to name the branch and push — see
 * `src/data/branchName.ts` for the name's shape — and the row appears,
 * moves and leaves on its own.
 *
 * WHY IT CAME BACK. Design was retired 2026-10-15 (it listed nothing; see the
 * `design-section` row in `archivedItems.ts`). What replaced "put your work
 * where people can see it" was a chain of prefilled links — `share-branch`
 * built a URL, the designer clicked it through the site password, the page
 * read the params and wrote a Refinement row; `share-to-stage` did the same
 * for a To Do card. Jillienne, 2026-11-16: the links "are just adding more
 * confusion and chaos". The chain had four places to fail silently and
 * recorded the same fact three times. This section records it zero times.
 *
 * WHAT REFINEMENT IS NOW. The board of things git cannot see — a hand-written
 * HTML exploration, a component review deck, a note that says WHERE to look
 * on a build. The kebab's "Discuss in Refinement" opens its Add form with the
 * branch's address and feature already in it, in this tab, so the one case
 * that still wants a note has a one-click door and no URL to copy.
 *
 * It renders only where it can read: the endpoint needs a Netlify token
 * (`/api/branches`), and the git facts need a GitHub one (`branchGit.ts`).
 * Each missing piece is said once, at the top, rather than per row.
 */
import { useMemo, useState, type CSSProperties } from 'react'
import { ArrowUpRightFromSquare, MessageCircle, PenToSquare, Share2, User } from '@/icons'
import { type ActionMenuItem } from '@/components/ui/ActionMenu'
import { HubRow, type HubRowTag } from './HubRow'
import { GeneratedThumb } from './GeneratedThumb'
import { safeBranchHref, useBranches, type BranchIndex } from '@/data/branchStore'
import { scopeLabel, scopeOwner } from '@/data/branchName'
import { groupByFeature, stageOf, type DesignRow, type DesignStage } from '@/data/designBranches'
import type { FeatureAccent, PrototypeScope } from '@/data/prototypeFeatures'
import { LINK_PRODUCTS, type LinkProduct } from '@/data/linkStore'

const STAGE_TEXT: Record<DesignStage, string> = {
  building: 'Building…',
  failed: 'Build failed',
  'in-design': 'In design',
  'on-stage': 'On stage',
  released: 'Released',
}

const STAGE_STYLE: Record<DesignStage, CSSProperties> = {
  building: { color: 'var(--ux-text-3)', fontStyle: 'italic' },
  // The one red on the page: the product's secondary ramp, which the kebab's
  // `danger` items already use for the same meaning.
  failed: { borderColor: 'var(--color-secondary-700)', color: 'var(--color-secondary-700)' },
  'in-design': {},
  'on-stage': { borderColor: 'var(--ux-accent)', color: 'var(--ux-accent)' },
  released: { color: 'var(--ux-text-3)' },
}

/** The tile hue says which surface, the same way Refinement's says which
 *  deploy — compared down the list, so the four need to differ. */
const SCOPE_ACCENT: Record<PrototypeScope, FeatureAccent> = {
  compass: 'teal',
  atlas: 'gold',
  invite: 'blue',
  admin: 'neutral',
  'end-to-end': 'neutral',
}

/** The Refinement product tag a scope maps onto, for the Discuss door. */
const SCOPE_PRODUCT: Partial<Record<PrototypeScope, LinkProduct>> = {
  compass: 'compass',
  // The board's id for the Atlas side is `xcel` — see `LINK_PRODUCTS`.
  atlas: 'xcel',
  invite: 'xcel',
}

/* ── styles ───────────────────────────────────────────────────────────────── */

const noteStyle: CSSProperties = {
  margin: '0 0 16px',
  padding: '9px 12px',
  borderRadius: 8,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  fontSize: 13,
  lineHeight: 1.6,
}

const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  flexWrap: 'wrap',
  marginBottom: 14,
}

const pillStyle: CSSProperties = {
  font: 'inherit',
  fontSize: 12,
  fontWeight: 600,
  padding: '4px 11px',
  borderRadius: 999,
  border: '1px solid var(--ux-border)',
  background: 'var(--ux-card)',
  color: 'var(--ux-text-2)',
  cursor: 'pointer',
}

const pillActiveStyle: CSSProperties = {
  ...pillStyle,
  background: 'var(--ux-accent)',
  borderColor: 'var(--ux-accent)',
  color: 'var(--ux-on-accent)',
}

const groupHeadStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 10,
  padding: '14px 2px 6px',
}

const groupNameStyle: CSSProperties = {
  margin: 0,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.6,
  textTransform: 'uppercase',
  color: 'var(--ux-text-2)',
}

const groupMetaStyle: CSSProperties = { fontSize: 12, color: 'var(--ux-text-3)' }

const emptyStyle: CSSProperties = {
  margin: 0,
  fontSize: 13.5,
  lineHeight: 1.6,
  color: 'var(--ux-text-3)',
}

/* ── the panel ────────────────────────────────────────────────────────────── */

type Filter = 'active' | 'on-stage' | 'released' | 'all'

/** `index` is the page's one read of `/api/branches` when it has one; the
 *  panel reads for itself when rendered alone (tests, a future route). */
export function DesignPanel({ index: given }: { index?: BranchIndex } = {}) {
  const own = useBranches(given === undefined)
  const index = given ?? own.index
  const [filter, setFilter] = useState<Filter>('active')

  const groups = useMemo(() => groupByFeature(index.branches), [index.branches])
  const shown = useMemo(
    () =>
      groups
        .map((g) => ({
          ...g,
          rows: g.rows.filter((r) =>
            filter === 'all'
              ? true
              : filter === 'released'
                ? r.stage === 'released'
                : filter === 'on-stage'
                  ? r.stage === 'on-stage'
                  : r.stage !== 'released',
          ),
        }))
        .filter((g) => g.rows.length > 0),
    [groups, filter],
  )

  if (index.loading) return null

  if (!index.available) {
    return (
      <p style={noteStyle}>
        {index.reason === 'no-endpoint'
          ? 'The branch list is only on the deployed Hub — this build has no /api/branches.'
          : index.reason === 'no-credentials'
            ? 'Set NETLIFY_API_TOKEN and NETLIFY_SITE_ID on the Netlify project to list branches here.'
            : 'Could not reach Netlify for the branch list — the token may have expired.'}
      </p>
    )
  }

  const total = index.branches.length
  const counts = {
    active: index.branches.filter((b) => stageOf(b) !== 'released').length,
    'on-stage': index.branches.filter((b) => stageOf(b) === 'on-stage').length,
    released: index.branches.filter((b) => stageOf(b) === 'released').length,
  }

  return (
    <div>
      {index.git !== 'on' && (
        <p style={noteStyle}>
          {index.git === 'off'
            ? 'On stage and Released are off: set GITHUB_TOKEN on the Netlify project and the rows will say where each branch is.'
            : 'GitHub did not answer, so On stage and Released are unknown for now — the builds are still listed.'}
        </p>
      )}

      <div style={toolbarStyle}>
        <div role="group" aria-label="Filter branches" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(
            [
              ['active', 'In progress'],
              ['on-stage', 'On stage'],
              ['released', 'Released'],
              ['all', 'All'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              style={filter === id ? pillActiveStyle : pillStyle}
              onClick={() => setFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12, color: 'var(--ux-text-3)' }}>
          {total === 0
            ? 'no branches built'
            : `${counts.active} in progress · ${counts['on-stage']} on stage · ${counts.released} released`}
        </span>
      </div>

      {shown.length === 0 ? (
        <p style={emptyStyle}>
          {total === 0
            ? 'Nothing is built right now. Push a branch — feat/compass-your-thing — and it appears here.'
            : 'Nothing under this filter.'}
        </p>
      ) : (
        shown.map((g) => (
          <section key={g.key} aria-labelledby={`design-${g.key}`}>
            <div style={groupHeadStyle}>
              <h2 id={`design-${g.key}`} style={groupNameStyle}>
                {g.feature}
              </h2>
              <span style={groupMetaStyle}>
                {[g.scope && scopeLabel(g.scope), g.scope && scopeOwner(g.scope) && `owner ${scopeOwner(g.scope)}`]
                  .filter(Boolean)
                  .join(' · ') || 'Other branches'}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {g.rows.map((r) => (
                <DesignRowCard key={r.deploy.branch} row={r} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

/* ── one row ──────────────────────────────────────────────────────────────── */

/** The Refinement Add form, prefilled, in THIS tab. A full navigation rather
 *  than a section switch because the page reads the prefill from the address
 *  once, at mount — the same door the old skill link went through, minus the
 *  password wall and the copy-paste, since we are already inside. */
function discussHref(row: DesignRow): string {
  const p = new URLSearchParams()
  p.set('section', 'demo')
  p.set('add', '1')
  p.set('url', row.deploy.reviewUrl)
  p.set('title', row.parsed.variant ? `${row.parsed.feature} — ${row.parsed.variant}` : row.parsed.feature)
  p.set('feature', row.parsed.feature)
  const product = row.parsed.scope ? SCOPE_PRODUCT[row.parsed.scope] : undefined
  if (product && LINK_PRODUCTS.some((x) => x.id === product)) p.set('product', product)
  return `/?${p.toString()}`
}

function DesignRowCard({ row }: { row: DesignRow }) {
  const { deploy, parsed, stage } = row
  const href = deploy.build === 'ready' ? safeBranchHref(deploy.reviewUrl) : null
  const [copied, setCopied] = useState(false)

  const tags: HubRowTag[] = [
    { key: 'stage', text: STAGE_TEXT[stage], style: STAGE_STYLE[stage] },
    {
      key: 'author',
      text: deploy.author,
      icon: <User size={11} aria-hidden style={{ flex: 'none' }} />,
      srPrefix: 'Pushed by: ',
    },
    { key: 'scope', text: parsed.scope ? scopeLabel(parsed.scope) : '' },
  ].filter((t) => t.text)

  const actions: ActionMenuItem[] = [
    ...(href
      ? [
          {
            id: 'open',
            label: 'Open build',
            icon: <ArrowUpRightFromSquare size={13} aria-hidden />,
            onSelect: () => window.open(href, '_blank', 'noopener,noreferrer'),
          },
          {
            id: 'copy',
            label: copied ? 'Copied' : 'Copy build link',
            icon: <Share2 size={13} aria-hidden />,
            onSelect: () => {
              void navigator.clipboard?.writeText(href).then(() => {
                setCopied(true)
                window.setTimeout(() => setCopied(false), 1600)
              })
            },
          },
        ]
      : []),
    {
      id: 'discuss',
      label: 'Discuss in Refinement',
      icon: <MessageCircle size={13} aria-hidden />,
      onSelect: () => window.location.assign(discussHref(row)),
    },
  ]

  const title = parsed.variant ? `${parsed.feature} — ${parsed.variant}` : parsed.feature

  return (
    <HubRow
      id={`design-${deploy.slug}`}
      className="cre-uxlinks-row"
      titleClassName="cre-uxlinks-title"
      thumb={
        <GeneratedThumb accent={parsed.scope ? SCOPE_ACCENT[parsed.scope] : 'neutral'} boost={1.7}>
          <PenToSquare size={34} />
        </GeneratedThumb>
      }
      title={title}
      titleAdornment={
        href ? (
          <ArrowUpRightFromSquare size={11} aria-hidden style={{ flex: 'none', color: 'var(--ux-text-3)' }} />
        ) : undefined
      }
      titleSr={href ? ' — opens in a new tab' : stage === 'building' ? ' — still building' : ' — no build to open'}
      description={deploy.commit || undefined}
      caption={[
        deploy.branch,
        deploy.updated && (deploy.build === 'ready' ? `built ${deploy.updated}` : `pushed ${deploy.updated}`),
        /* THE NEXT STEP, on the row (2026-11-16, Jillienne: "I want the share
           to stage to be a clearer action"). An in-design branch with a
           surface says what moves it on and who can; a staged one says it
           is waiting on Release. The skill is still a sentence said to
           Claude — this is the row saying which sentence. */
        stage === 'in-design' && parsed.scope
          ? `next: /share-to-stage (${scopeOwner(parsed.scope)})`
          : stage === 'on-stage'
            ? 'waiting on Release'
            : '',
      ]
        .filter(Boolean)
        .join(' · ')}
      tags={tags}
      href={href ?? undefined}
      external
      actions={actions}
      menuLabel={`Actions for ${deploy.branch}`}
      data={{ stage }}
    />
  )
}
