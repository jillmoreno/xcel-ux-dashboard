import type { CSSProperties } from 'react'
import { Award, TriangleExclamation, CircleInfo, HourglassClock, MoreVertical } from '@/icons'
import { Tooltip } from '@/components/ui/Tooltip'
import { useTheme } from '@/context/ThemeContext'
import {
  CERT_ACTION_META,
  PENDING_ROSTER_TOOLTIP,
  type Certificate,
  type CertReporting,
} from '@/data/certificateFixtures'

/**
 * Certificate grid card — status variants from the 2.0 Certificates "Cert
 * Cards" matrix (file uVUMm2ZJ6YWoc9NqjTpqWb, node 122:2018, which documents
 * each status in Default + Hover states). The Figma's MCKissock green/orange is
 * remapped to our tokens: a filled-tint icon badge + status tag, and a peach
 * (`tertiary-100`) kebab circle bottom-right.
 *
 * **Interaction (the matrix's Default → Hover columns):** at rest the card has
 * a dark title and **no** left stroke; on hover/focus a 6px accent stroke
 * slides onto the left edge and the title turns the accent color + underlines.
 * Both are handled by `.cre-cert-card` in tokens.css, driven by the per-card
 * `--cert-accent` (stroke) / `--cert-link` (title) custom properties set below.
 *
 *   - `completed`        → green `success` accent + certificate badge.
 *   - `external`         → green `success` badge + "EXTERNAL" tag + the issuing
 *                          provider line.
 *   - `action-required`  → amber `warning` accent + a triangle-exclamation
 *                          alert badge + "ACTION REQUIRED" tag + a "Certificate
 *                          Pending — …" pill. The whole card is a button that
 *                          opens the Certificate Details slide-over.
 */
export function CertificateCard({
  data,
  onOpen,
  onOptions,
  openAnyStatus = false,
  inProgress = false,
  titleSerif = false,
}: {
  data: Certificate
  /** Open the Certificate Details slide-over. */
  onOpen?: (id: string) => void
  /** Kebab (⋮) menu click. Without one, the ⋮ opens the detail on a card that
   *  opens at all; failing that it falls back to a console stub. */
  onOptions?: (id: string) => void
  /**
   * EVERY CARD OPENS, not only an action-required one — 2026-11-02.
   *
   * Off (the default) is the rule this card has always had, and it is still
   * right for the tabbed page: Action Required is one click away there, and a
   * completed certificate's own row is the kebab. A host that hides the tabs
   * has no such route, which is what this is for.
   */
  openAnyStatus?: boolean
  /**
   * NOT YET EARNED — the certificate for a course still under way.
   *
   * ⚠ IT IS THE HOST'S WORD, NOT THE RECORD'S. Such a certificate is still
   * `status: 'completed'` in the fixtures, so the card cannot read it off
   * `data` and has to be told. It beats `isCompleted` everywhere below: a
   * certificate that has not been issued must not wear the COMPLETED tag.
   */
  inProgress?: boolean
  /** The title in the heading serif — the Atlas pages, as `CourseCard`'s own
   *  `titleSerif`. */
  titleSerif?: boolean
}) {
  const isAction = data.status === 'action-required'
  const isExternal = data.status === 'external'
  const isCompleted = data.status === 'completed' && !inProgress
  const pending = data.action ? CERT_ACTION_META[data.action].pendingLabel : null
  // Dark theme (rebrand): the card surface flips navy, but the title
  // (`.cre-cert-card-title` class = `var(--color-text-primary)`) and the status
  // tag bake to their light-mode stops under `@theme inline`, so they collapse
  // on navy. Re-pin them to light literals in dark. See finding #1.
  const dark = useTheme().theme === 'dark'

  // Status accent (Figma 122:2018, MCKissock green/orange remapped to our
  // tokens): `completed` reads as an earned certificate (the **pass** ramp —
  // green, as of 2026-11-02; it was the brand primary, which is a navy here);
  // `external` is a neutral third-party cert (gray ramp — distinct from the
  // green you-earned-it cards); `action-required` reads as a warning (amber).
  // `stroke` drives the hover left stroke (`--cert-accent`), `link` the hover
  // title color (`--cert-link`), and `icon`/`box`/`tag` the filled-tint badge +
  // status tag. (External's `link` stays `text-primary` — the title just
  // underlines on hover; a gray hover title would read as *less* emphasis.)
  const accent = inProgress
    ? {
        /* THE INFO RAMP, matching the detail panel's "Not Yet Earned" banner, so
           the card and the sheet it opens agree about what this state is. */
        stroke: 'var(--color-info-500)',
        link: 'var(--color-info-700)',
        icon: 'var(--color-info-600)',
        box: 'var(--color-info-100)',
        tag: dark ? 'var(--color-info-300)' : 'var(--color-info-800)',
      }
    : isAction
    ? {
        stroke: 'var(--color-warning-500)',
        link: 'var(--color-warning-700)',
        icon: 'var(--color-warning-600)',
        box: 'var(--color-warning-100)',
        // On the navy dark card the -700 status stops collapse; lift to the
        // ramp's light stop so the tag clears AA (brand-adaptive).
        tag: dark ? 'var(--color-warning-300)' : 'var(--color-warning-700)',
      }
    : isExternal
      ? {
          stroke: 'var(--color-neutral-600)',
          link: 'var(--color-text-primary)',
          icon: 'var(--color-text-secondary)',
          box: 'var(--color-neutral-100)',
          tag: dark ? 'var(--color-neutral-700)' : 'var(--color-text-secondary)',
        }
      : {
          /* AN EARNED CERTIFICATE IS GREEN (2026-11-02, the direct ask:
             completed certificates "should take on this green color. and
             shades of it", against the Compass palette's `--c-pass`).

             It was the brand primary ramp, which on this brand is a navy —
             so the one status a learner is pleased to see looked the same as
             any other brand furniture. The pass ramp is the Compass surfaces'
             own "on track / mastery" green, and the design-system audit lists
             it as already identical across the two systems.

             ⚠ THE STOPS ARE THE SAME SHAPE AS EVERY OTHER STATUS HERE — 100
             fill, 600 glyph, 500 stroke, 700 link and tag, 300 for the tag on
             the dark card. Only the ramp changed, so the three statuses stay
             comparable. */
          stroke: 'var(--color-pass-500)',
          link: 'var(--color-pass-700)',
          icon: 'var(--color-pass-600)',
          box: 'var(--color-pass-100)',
          tag: dark ? 'var(--color-pass-300)' : 'var(--color-pass-700)',
        }

  const clickable = (isAction || openAnyStatus) && onOpen != null
  const open = () => onOpen?.(data.id)

  return (
    <div
      className="cre-cert-card"
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      aria-label={clickable ? `View details for ${data.title}` : undefined}
      onClick={clickable ? open : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                open()
              }
            }
          : undefined
      }
      style={{
        ...cardStyle,
        // Per-card accent props consumed by `.cre-cert-card` (tokens.css): the
        // 6px hover left stroke + the hover title link color.
        ['--cert-accent' as string]: accent.stroke,
        ['--cert-link' as string]: accent.link,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <h3
          className="cre-cert-card-title"
          style={{
            ...titleStyle,
            ...(titleSerif ? SERIF_TITLE : null),
            ...(dark ? { color: '#f1f3f7' } : null),
          }}
        >
          {data.title}
        </h3>
        <div style={iconColStyle}>
          <span
            aria-hidden
            style={{
              ...iconBoxStyle,
              color: accent.icon,
              background: accent.box,
            }}
          >
            {inProgress ? (
              <HourglassClock size={20} aria-hidden />
            ) : isAction ? (
              <TriangleExclamation size={20} aria-hidden />
            ) : (
              <Award size={22} aria-hidden />
            )}
          </span>
          {inProgress && <span style={{ ...tagStyle, color: accent.tag }}>IN&nbsp;PROGRESS</span>}
          {isCompleted && <span style={{ ...tagStyle, color: accent.tag }}>COMPLETED</span>}
          {isExternal && <span style={{ ...tagStyle, color: accent.tag }}>EXTERNAL</span>}
          {isAction && (
            <span style={{ ...tagStyle, color: accent.tag }}>ACTION&nbsp;REQUIRED</span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        <span style={professionStyle}>{data.profession}</span>
        <div style={metaRowStyle}>
          <span>{data.state}</span>
          <Divider />
          <span>
            {data.hours} {data.hours === 1 ? 'Hour' : 'Hours'}
          </span>
          <Divider />
          <span>{data.badge}</span>
        </div>
        {inProgress ? (
          /* ⚠ A LINE, NOT A GAP. Nothing has been issued and nothing reported,
             so both rows below are absent — and because the grid sizes every
             row to its tallest card, that left this one as a title over two
             rows of empty space. It says what is outstanding instead. */
          <span style={completedStyle}>Issued when you complete the course</span>
        ) : isAction ? (
          <span style={completedStyle}>Course Completed {formatDate(data.completedDate)}</span>
        ) : (
          <div style={infoGridStyle}>
            <span style={infoLabelStyle}>Certificate Issued</span>
            <span style={infoValueMutedStyle}>{formatDate(data.completedDate)}</span>
            {data.reporting && (
              <>
                <span style={infoLabelStyle}>Reporting Status</span>
                <span style={infoValueStrongStyle}>
                  <ReportingStatus reporting={data.reporting} />
                </span>
              </>
            )}
          </div>
        )}
        {isExternal && data.externalProvider && (
          <span style={issuedByStyle}>Certificate Issued By {data.externalProvider}</span>
        )}
      </div>

      {pending && (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={pendingPillStyle}>Certificate Pending — {pending}</span>
        </div>
      )}

      {/* Kebab (⋮) — peach `tertiary-100` circle, bottom-right. Stops propagation
          so it never also triggers a clickable (action-required) card. */}
      <button
        type="button"
        aria-label={`Options for ${data.title}`}
        style={kebabStyle}
        onClick={(e) => {
          e.stopPropagation()
          /* With no menu designed yet, the honest destination is the card's
             own: the detail, where View Certificate and Go to Course live. A
             real menu (Download · Print · Report) is an open decision. */
          if (onOptions) onOptions(data.id)
          else if (clickable) open()
          else console.info('certificate:options', data.id)
        }}
      >
        <MoreVertical size={16} aria-hidden />
      </button>
    </div>
  )
}

/* THE SERIF TITLE (2026-11-02) — the Atlas pages set their headings in the
   heading serif, and a sans card title under a serif page title read as a
   different product. Same prop, same reason, as `CourseCard`'s `titleSerif`.

   ⚠ THE 700 IS WHAT RENDERS, NOT A PREFERENCE. The Atlas font skin carries
   `[data-atlas-palette][data-atlas-font="playfair-2"] [style*="--font-heading-serif"]
   { font-weight: 700 !important }` in tokens.css, so an inline serif on those
   pages is Bold whatever this asks for. Written as 700 so the source matches
   the screen. */
const SERIF_TITLE: CSSProperties = {
  fontFamily: 'var(--font-heading-serif)',
  fontWeight: 700,
  letterSpacing: '-0.01em',
}

/** The "Reporting Status" line value — one of three variants. Exported for
 *  `AtlasCertificateCard`, so the two cards always read the same. */
export function ReportingStatus({ reporting }: { reporting: CertReporting }) {
  if (reporting.status === 'reported') {
    return <>Reported {formatDate(reporting.date)}</>
  }
  if (reporting.status === 'non-reporting') {
    return <>{reporting.stateAbbr} is a Non-Reporting State</>
  }
  // pending-roster → label + an info tooltip (roster submission guidance).
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      Pending Roster Submission
      <Tooltip
        content={
          <span style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
            {PENDING_ROSTER_TOOLTIP.map((p, i) => (
              <span key={i}>{p}</span>
            ))}
          </span>
        }
      >
        <button type="button" aria-label="About roster submission" style={infoBtnStyle} onClick={(e) => e.stopPropagation()}>
          <CircleInfo size={15} aria-hidden />
        </button>
      </Tooltip>
    </span>
  )
}

function Divider() {
  return <span aria-hidden style={{ width: 1, height: 12, background: 'var(--color-border-subtle)' }} />
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return `${m}/${d}/${y}`
}

const cardStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  minHeight: 168,
  padding: 20,
  background: 'var(--color-surface-card)',
  border: '1px solid var(--color-border-subtle)',
  borderRadius: 'var(--radius-xl)',
  // box-shadow + hover lift live on the `.cre-cert-card` class (tokens.css) so
  // the `:hover` rule can override the resting shadow.
}

// Two-column "Certificate Issued" / "Reporting Status" definition grid. The
// `paddingRight` keeps long reporting values clear of the bottom-right kebab.
const infoGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'auto 1fr',
  columnGap: 16,
  rowGap: 4,
  marginTop: 2,
  paddingRight: 40,
}

const infoLabelStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}

const infoValueMutedStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const infoValueStrongStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const infoBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  border: 'none',
  background: 'transparent',
  color: 'var(--color-warning-600)',
  cursor: 'pointer',
  lineHeight: 0,
}

const kebabStyle: CSSProperties = {
  position: 'absolute',
  bottom: 16,
  right: 16,
  width: 32,
  height: 32,
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--color-tertiary-100)',
  color: 'var(--color-text-secondary)',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
}

// NB: no `color` here — the `.cre-cert-card-title` class owns the resting +
// hover/focus title color so the inline style doesn't outrank the hover rule.
const titleStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-heading)',
  fontWeight: 600,
  fontSize: 17,
  lineHeight: '22px',
}

const iconColStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  flexShrink: 0,
}

// Filled-tint badge (Figma 122:2018 — the green/amber-tinted rounded plate
// behind the certificate glyph; no border, matching the design's filled icon).
const iconBoxStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 48,
  height: 40,
  borderRadius: 'var(--radius-sm)',
}

const tagStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.06em',
  color: 'var(--color-text-secondary)',
}

const professionStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
}

const metaRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 8,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-secondary)',
}

const completedStyle: CSSProperties = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  color: 'var(--color-text-tertiary)',
}

const issuedByStyle: CSSProperties = {
  marginTop: 2,
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--color-text-primary)',
}

const pendingPillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 'var(--radius-pill)',
  background: 'var(--color-warning-100)',
  color: 'var(--color-warning-800)',
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  fontWeight: 600,
}
