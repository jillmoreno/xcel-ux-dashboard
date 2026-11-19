import type { CSSProperties } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { TriangleExclamation } from '@/icons'
import { PROTOTYPE_FEATURES } from '@/data/prototypeFeatures'
import { parsePrototypeBuild, PROTOTYPE_BUILDS } from '@/data/stageBuild'

/**
 * THE RETIRED-LINK SCREEN — 2026-11-17, Jillienne: "deactivate the links to
 * the main prototypes and stage prototypes so that the users get an error
 * screen … on the error screen shown to the user is where the message should
 * be."
 *
 * ⚠ WHY A SCREEN AND NOT A `coming-soon` ROW. The repo already had one way to
 * take a Prototypes link away: `status: 'coming-soon'`, which draws the row
 * DISABLED (the 2026-10-14 held-back end-to-end row — "don't remove the work,
 * just hide users from clicking on it"). That hides the link; it does not tell
 * anyone anything. The ask here is the opposite: the click still happens, and
 * what it lands on is where the message lives. So the rows stay live-looking
 * and their `href` is re-pointed HERE.
 *
 * ⚠ THE ROW'S `to` IS NOT TOUCHED. Every deactivated row keeps its real route
 * on record — `UxDashboard.smoke.test.tsx` still checks each one is same-origin,
 * at a product door, at `?demo=1`, with nothing pinned — so reactivating a row
 * is deleting one `linkRetired` flag and nothing else. Only the href the row
 * RENDERS changes, in `ProjectRow`.
 *
 * ⚠ ONE SCREEN FOR BOTH BUILDS. Main and Stage are two origins, and the stage
 * build is behind its own copy of the site password — a retired screen served
 * from there would be a login wall first. So the row points at this screen on
 * the HUB's origin under either switch position, and `?build=stage` is how the
 * screen knows which one the reader was reaching for.
 *
 * WHO TO ASK is deliberately NOT a person. It named the scope's `owner` for
 * half a day on 2026-11-17, on the reasoning that one name beats a channel —
 * until Jillienne read her own name on the live screen: "I don't want my name
 * in there, just have Check with UX Team/Product Owner for the new link." One
 * line for every row, so the screen carries no roster to keep in step with
 * `PROTOTYPE_SCOPES` and no individual's name in front of stakeholders.
 */
export function PrototypeLinkRetiredPage() {
  const { featureId } = useParams<{ featureId: string }>()
  const [params] = useSearchParams()
  const build = parsePrototypeBuild(params.get('build'))
  const buildLabel = PROTOTYPE_BUILDS.find((b) => b.id === build)?.label ?? 'Main'

  const feature = PROTOTYPE_FEATURES.find((f) => f.id === featureId)

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <TriangleExclamation size={28} style={markStyle} aria-hidden />

        <h1 style={titleStyle}>This prototype link is no longer active</h1>

        <p style={leadStyle}>
          {feature ? (
            <>
              {/* ⚠ THE TITLE ALONE, no scope label after it. The row titles
                  already carry their own parenthetical — "End-to-End User
                  Experience (Invite, Atlas, Compass)" — so appending the scope
                  read as a doubled bracket, "(Invite, Atlas, Compass)
                  (End-to-End)", on every row (2026-11-17, Jillienne on the
                  live screen). */}
              The <strong style={strongStyle}>{buildLabel}</strong> link for{' '}
              <strong style={strongStyle}>{feature.title}</strong> has been turned off.
            </>
          ) : (
            <>The {buildLabel} prototype link you followed has been turned off.</>
          )}
        </p>

        {/* THE MESSAGE — the whole reason this screen exists.
            ⚠ NO NAMES, and no per-scope branch. It named the scope's `owner`
            until 2026-11-17, when Jillienne saw her own name on the live
            screen: "I don't want my name in there, just have Check with UX
            Team/Product Owner for the new link." One line for every row and
            for the bare path, so there is nothing to keep in step with
            `PROTOTYPE_SCOPES`. */}
        <p style={bodyStyle}>
          The Main and Stage prototype links are being replaced. Check with UX Team/Product Owner
          for the new link before you review this surface.
        </p>

        <p style={noteStyle}>
          Nothing has been deleted — the work is still on the build. Only the link from the Hub is
          switched off until a new one is given.
        </p>

        <Link to="/" style={backStyle}>
          Back to the Hub
        </Link>
      </div>
    </div>
  )
}

const wrapStyle: CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px 24px',
  background: 'var(--color-neutral-50)',
}

const cardStyle: CSSProperties = {
  maxWidth: 520,
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  gap: 14,
  padding: '40px 32px',
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-lg, 12px)',
}

const markStyle: CSSProperties = { color: 'var(--color-text-tertiary)' }

const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontSize: 22,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const leadStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 15,
  lineHeight: 1.5,
  color: 'var(--color-text-primary)',
}

const bodyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  lineHeight: 1.6,
  color: 'var(--color-text-secondary)',
}

const noteStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  lineHeight: 1.6,
  color: 'var(--color-text-tertiary)',
}

const strongStyle: CSSProperties = { color: 'var(--color-text-primary)', fontWeight: 600 }

const backStyle: CSSProperties = {
  marginTop: 6,
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-accent-link)',
  textDecoration: 'none',
}
