/**
 * THE RELEASE SECTION — what is on stage that main does not have (2026-11-16).
 *
 * Jillienne's inbox, and the answer to the question the Design and Prototypes
 * tags could not: "what is sitting on stage, ready for me to push to main?"
 * One number at the top — stage is N commits ahead of main — then, by
 * surface, every branch whose commits are all on `stage` and not all on
 * `main`: who owns the surface, who pushed the branch, when it was staged,
 * and whether its flag defaults are DECIDED (the `.hub/decided/<scope>.json`
 * marker `share-to-stage` writes, counted only while it vouches for a commit
 * main does not have — `netlify/lib/branchGit.ts`).
 *
 * Empty means nothing to do. Not empty means `/release` — which is still the
 * only action, and still a sentence said to Claude: the merge needs git and
 * the undecided-group gate needs judgement. What this page adds is that the
 * gate is VISIBLE before the skill runs, so an undecided surface is a row
 * that says so rather than a refusal three steps in.
 *
 * A rail row of its own rather than a mode of Prototypes, because the
 * "stage is not a section" rule (CLAUDE.md, 2026-11-01) was about not
 * duplicating the PRODUCT rows — and these are not product rows, they are
 * branches waiting on a decision of Jillienne's.
 *
 * Derived, like Design: it reads `/api/branches` and writes nothing.
 */
import { useMemo, type CSSProperties } from 'react'
import { ArrowUpRightFromSquare, CircleCheck, HourglassClock, PenToSquare, User } from '@/icons'
import { HubRow, type HubRowTag } from './HubRow'
import { GeneratedThumb } from './GeneratedThumb'
import { safeBranchHref, useBranches, type BranchIndex } from '@/data/branchStore'
import { scopeLabel, scopeOwner } from '@/data/branchName'
import { groupForRelease, type ReleaseRow } from '@/data/releaseQueue'
import type { FeatureAccent, PrototypeScope } from '@/data/prototypeFeatures'

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

const summaryStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
  flexWrap: 'wrap',
  margin: '0 0 18px',
}

const bigNumberStyle: CSSProperties = {
  fontFamily: 'var(--font-heading)',
  fontSize: 28,
  fontWeight: 700,
  lineHeight: 1,
  color: 'var(--ux-text)',
}

const summaryTextStyle: CSSProperties = { fontSize: 13.5, color: 'var(--ux-text-2)' }

const actionStyle: CSSProperties = {
  margin: '0 0 18px',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--ux-accent)',
  background: 'color-mix(in srgb, var(--ux-accent) 8%, var(--ux-card))',
  color: 'var(--ux-text)',
  fontSize: 13,
  lineHeight: 1.6,
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

const SCOPE_ACCENT: Record<PrototypeScope, FeatureAccent> = {
  compass: 'teal',
  atlas: 'gold',
  invite: 'blue',
  admin: 'neutral',
  'end-to-end': 'neutral',
}

/* ── the panel ────────────────────────────────────────────────────────────── */

/** `index` is the page's one read of `/api/branches` when it has one; the
 *  panel reads for itself when rendered alone (tests, a future route). */
export function ReleasePanel({ index: given }: { index?: BranchIndex } = {}) {
  const own = useBranches(given === undefined)
  const index = given ?? own.index
  const groups = useMemo(() => groupForRelease(index.branches), [index.branches])

  if (index.loading) return null

  if (!index.available) {
    return (
      <p style={noteStyle}>
        {index.reason === 'no-endpoint'
          ? 'The release queue is only on the deployed Hub — this build has no /api/branches.'
          : index.reason === 'no-credentials'
            ? 'Set NETLIFY_API_TOKEN and NETLIFY_SITE_ID on the Netlify project to list branches here.'
            : 'Could not reach Netlify for the branch list — the token may have expired.'}
      </p>
    )
  }

  if (index.git !== 'on') {
    return (
      <p style={noteStyle}>
        {index.git === 'off'
          ? 'The release queue reads git. Set GITHUB_TOKEN on the Netlify project and this page will say what is on stage and not on main.'
          : 'GitHub did not answer, so what is on stage is unknown right now.'}
      </p>
    )
  }

  const waiting = groups.reduce((n, g) => n + g.rows.length, 0)
  const undecided = groups.reduce((n, g) => n + g.rows.filter((r) => !r.decided).length, 0)
  const ahead = index.stageAheadOfMain

  return (
    <div>
      {/* The one number. `ahead` is the commits; the rows are the branches —
          two views of the same gap, and the number is the one `/release`
          step 1 prints, so the page and the skill agree. */}
      <div style={summaryStyle} role="status">
        <span style={bigNumberStyle}>{ahead ?? '—'}</span>
        <span style={summaryTextStyle}>
          {ahead === null
            ? 'commits on stage not on main — unknown'
            : ahead === 0
              ? 'commits on stage not on main. Stage is level with main.'
              : `commit${ahead === 1 ? '' : 's'} on stage not on main · ${waiting} branch${waiting === 1 ? '' : 'es'} from ${groups.length} surface${groups.length === 1 ? '' : 's'}${undecided ? ` · ${undecided} undecided` : ''}`}
        </span>
      </div>

      {ahead !== null && ahead > 0 && (
        <p style={actionStyle}>
          {undecided === 0 ? (
            <>
              <b>Ready.</b> Every surface below has its defaults decided. Say <code>/release</code> to merge stage
              into main; the rows move to Released on their own.
            </>
          ) : (
            <>
              <b>Not yet.</b> {undecided} branch{undecided === 1 ? ' has' : 'es have'} no decided-defaults
              marker — <code>/release</code> will refuse until the owner runs <code>/share-to-stage</code> for it
              (which asks the flag questions and writes the marker).
            </>
          )}
        </p>
      )}

      {groups.length === 0 ? (
        <p style={emptyStyle}>
          {ahead !== null && ahead > 0
            ? 'Stage is ahead of main, but no branch in the build window accounts for it — a direct push to stage, or a branch older than the deploy window. `git log origin/main..origin/stage` says which.'
            : 'Nothing waiting. When an owner shares a surface to stage, it appears here.'}
        </p>
      ) : (
        groups.map((g) => (
          <section key={g.scope ?? 'other'} aria-labelledby={`release-${g.scope ?? 'other'}`}>
            <div style={groupHeadStyle}>
              <h2 id={`release-${g.scope ?? 'other'}`} style={groupNameStyle}>
                {g.scope ? scopeLabel(g.scope) : 'No surface named'}
              </h2>
              <span style={groupMetaStyle}>
                {g.scope
                  ? `owner ${scopeOwner(g.scope)} · ${g.ready ? 'decided' : 'undecided'}`
                  : 'the branch name has no surface word, so nothing can vouch for it'}
              </span>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {g.rows.map((r) => (
                <ReleaseRowCard key={r.deploy.branch} row={r} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}

function ReleaseRowCard({ row }: { row: ReleaseRow }) {
  const { deploy, feature, scope, decided } = row
  const href = deploy.build === 'ready' ? safeBranchHref(deploy.reviewUrl) : null
  const marker = scope ? deploy.decided.find((m) => m.scope === scope) : undefined

  const tags: HubRowTag[] = [
    decided
      ? {
          key: 'decided',
          text: 'Decided',
          icon: <CircleCheck size={11} aria-hidden style={{ flex: 'none' }} />,
          style: { borderColor: 'var(--ux-accent)', color: 'var(--ux-accent)' },
          title: marker ? `Defaults decided ${marker.decidedAt}${marker.by ? ` by ${marker.by}` : ''}` : undefined,
        }
      : {
          key: 'undecided',
          text: 'Undecided',
          icon: <HourglassClock size={11} aria-hidden style={{ flex: 'none' }} />,
          style: { color: 'var(--ux-text-3)' },
          title: 'No decided-defaults marker vouches for this branch — the owner runs /share-to-stage.',
        },
    {
      key: 'author',
      text: deploy.author,
      icon: <User size={11} aria-hidden style={{ flex: 'none' }} />,
      srPrefix: 'Pushed by: ',
    },
    { key: 'staged', text: deploy.updated ? `Staged ${deploy.updated}` : '' },
  ].filter((t) => t.text)

  return (
    <HubRow
      id={`release-${deploy.slug}`}
      className="cre-uxlinks-row"
      titleClassName="cre-uxlinks-title"
      thumb={
        <GeneratedThumb accent={scope ? SCOPE_ACCENT[scope] : 'neutral'} boost={1.7}>
          <PenToSquare size={34} />
        </GeneratedThumb>
      }
      title={feature}
      titleAdornment={
        href ? (
          <ArrowUpRightFromSquare size={11} aria-hidden style={{ flex: 'none', color: 'var(--ux-text-3)' }} />
        ) : undefined
      }
      titleSr={href ? ' — opens in a new tab' : ' — no build to open'}
      description={deploy.commit || undefined}
      caption={deploy.branch}
      tags={tags}
      href={href ?? undefined}
      external
      data={{ decided: decided ? 'yes' : 'no' }}
    />
  )
}
