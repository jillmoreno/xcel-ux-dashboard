import { useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from '@/icons'
import { ActionMenu, type ActionMenuItem } from '@/components/ui/ActionMenu'
import {
  HUB_CHEVRON_W,
  HUB_KEBAB_W,
  hubBlurbStyle,
  hubBodyStyle,
  hubCaptionStyle,
  hubIconTagStyle,
  hubNameStyle,
  hubRowLinkStyle,
  hubRowWrapStyle,
  hubTagAreaStyle,
  hubTagStackStyle,
  hubTagStyle,
  hubTitleRowStyle,
} from './hubRowStyles'

/**
 * THE HUB ROW — every section's row (2026-11-01).
 *
 * One card: [thumbnail] [title · description · caption] [a stack of up to
 * three outlined tags · an optional status column] [chevron] and, outside
 * the clickable part, the kebab. It is the Prototypes rows' anatomy, lifted
 * out of `ProjectRow` so the other seven sections can wear it rather than
 * approximate it — Jillienne, 2026-11-01: "Thumbnail, title, short
 * description, and the 3 tags on the right - with the ellipsis for
 * additional actions. I want ALL of the pages to follow this similar UI."
 *
 * It is PRESENTATION ONLY. What the three tags say, what the thumbnail is,
 * what the kebab offers — those are the section's facts, and each caller
 * decides them (`ProjectRow` for the feature rows, `LinksPanel` for the four
 * boards, and so on). What this component owns is that the facts land in
 * the same places at the same sizes on every page.
 *
 * ── Three ways a row opens ───────────────────────────────────────────────
 *   `href`                a real link — a `<Link>` for a path on this site,
 *                         an `<a target=_blank>` when `external`. With
 *                         `onOpen` beside it a PLAIN click is intercepted
 *                         (the in-frame gateway) and a modified click still
 *                         gets the real page in a new tab.
 *   `onOpen` alone        a `<button>` — a row that opens a sheet.
 *   neither               inert: drawn, not linked. A `placeholder` is the
 *                         dimmed form of this, with `aria-disabled`.
 *
 * ── Alignment is the whole point ─────────────────────────────────────────
 * The tag column is a fixed width, the status column is present on every
 * row of a section that has one, a row with no chevron keeps the chevron's
 * width, and a row with no kebab keeps the kebab's. Everything lines up
 * down the list whatever any one row carries.
 */

export type HubRowTag = {
  key: string
  text: ReactNode
  icon?: ReactNode
  /** Read aloud before the text, never shown — "Owner: " before a name. */
  srPrefix?: string
  /** Overrides on the outlined tag — a hue for a product, a status colour. */
  style?: CSSProperties
  title?: string
}

export type HubRowProps = {
  /** `data-row` — what the tests and the smoke suite find a row by. */
  id: string
  thumb: ReactNode
  title: ReactNode
  /** Drawn beside the title at its size — an external-link glyph, an id. */
  titleAdornment?: ReactNode
  /** Visually-hidden text after the title — " — opens in a new tab". */
  titleSr?: string
  description?: ReactNode
  caption?: ReactNode
  tags: HubRowTag[]
  /** The status column's content. The column exists when `statusWidth` is
   *  set, whether or not this is. */
  status?: ReactNode
  statusWidth?: number
  href?: string
  external?: boolean
  onOpen?: () => void
  /** The kebab. Empty or absent → a spacer of the kebab's width. */
  actions?: ActionMenuItem[]
  menuLabel?: string
  /** An inset left stroke, stacked into the card shadow — Ready for Dev's
   *  green, a QA finding's severity. */
  stroke?: string
  /** Drawn disabled: dimmed, no link, no chevron, no kebab. */
  placeholder?: boolean
  /** The `aria-label` for the button form. */
  openLabel?: string
  className?: string
  titleClassName?: string
  /** Extra data attributes on the card — `data-placeholder`, a test hook. */
  data?: Record<string, string>
  /** Rendered after the kebab, outside the card's grid — a Toast. */
  children?: ReactNode
}

export function HubRow({
  id,
  thumb,
  title,
  titleAdornment,
  titleSr,
  description,
  caption,
  tags,
  status,
  statusWidth,
  href,
  external,
  onOpen,
  actions,
  menuLabel,
  stroke,
  placeholder,
  openLabel,
  className,
  titleClassName,
  data,
  children,
}: HubRowProps) {
  const [hover, setHover] = useState(false)
  const opens = !placeholder && (Boolean(href) || Boolean(onOpen))
  const hasKebab = !placeholder && Boolean(actions && actions.length > 0)

  const dataAttrs: Record<string, string> = { 'data-row': id }
  for (const [k, v] of Object.entries(data ?? {})) dataAttrs[`data-${k}`] = v

  const inner = (
    <>
      {thumb}

      <span style={hubBodyStyle}>
        <span style={hubTitleRowStyle}>
          <span className={titleClassName} style={hubNameStyle}>
            {title}
            {titleSr && <span className="cre-visually-hidden">{titleSr}</span>}
          </span>
          {titleAdornment}
        </span>
        {description != null && description !== '' && <span style={hubBlurbStyle}>{description}</span>}
        {caption != null && caption !== '' && <span style={hubCaptionStyle}>{caption}</span>}
      </span>

      {/* The tags in their own column, so they line up down the list instead
          of starting at whatever x-position the description happened to end
          on. */}
      <span style={hubTagAreaStyle(statusWidth)}>
        <span style={hubTagStackStyle}>
          {tags.map((t) => (
            <span
              key={t.key}
              title={t.title}
              style={t.icon ? { ...hubIconTagStyle, ...t.style } : { ...hubTagStyle, ...t.style }}
            >
              {t.icon}
              {t.srPrefix && <span className="cre-visually-hidden">{t.srPrefix}</span>}
              {t.text}
            </span>
          ))}
        </span>
        {statusWidth !== undefined && <span style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>{status}</span>}
      </span>

      {opens ? (
        <ChevronRight
          aria-hidden
          size={HUB_CHEVRON_W}
          style={{ flex: 'none', color: hover ? 'var(--ux-accent)' : 'var(--ux-text-3)' }}
        />
      ) : (
        // Keeps the chevron's column so the tags line up with the rows above.
        <span aria-hidden style={{ flex: 'none', width: HUB_CHEVRON_W }} />
      )}
    </>
  )

  /* The stroke joins the card shadow in ONE `boxShadow`: a second declaration
     would replace the first, not add to it. An inset shadow rather than a
     `border-left` because the row's padding is fixed and a border would push
     every cell 3px right, off the rows above. */
  const wrap: CSSProperties = {
    ...hubRowWrapStyle,
    background: hover && opens ? 'var(--ux-bg)' : 'var(--ux-card)',
    boxShadow: stroke ? `inset 3px 0 0 ${stroke}, var(--shadow-card)` : 'var(--shadow-card)',
  }
  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onFocus: () => setHover(true),
    onBlur: () => setHover(false),
  }

  if (placeholder) {
    return (
      <div style={wrap} aria-disabled="true" className={className} {...dataAttrs}>
        <span style={{ ...hubRowLinkStyle, flex: 1, opacity: 0.62, cursor: 'default' }}>{inner}</span>
        <span aria-hidden style={{ flex: 'none', width: HUB_KEBAB_W }} />
      </div>
    )
  }

  let body: ReactNode
  if (href) {
    const linkProps = {
      style: { ...hubRowLinkStyle, flex: 1 },
      ...handlers,
      // Only a plain primary click is intercepted — a modified click is the
      // reviewer asking for a new tab, and that should still get the real page.
      onClick: onOpen
        ? (e: ReactMouseEvent<HTMLAnchorElement>) => {
            if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
            e.preventDefault()
            onOpen()
          }
        : undefined,
    }
    body = external ? (
      <a href={href} target="_blank" rel="noopener noreferrer" {...linkProps}>
        {inner}
      </a>
    ) : (
      <Link to={href} {...linkProps}>
        {inner}
      </Link>
    )
  } else if (onOpen) {
    body = (
      <button
        type="button"
        onClick={onOpen}
        aria-label={openLabel}
        aria-haspopup="dialog"
        style={{ ...hubRowLinkStyle, flex: 1, width: '100%' }}
        {...handlers}
      >
        {inner}
      </button>
    )
  } else {
    body = <span style={{ ...hubRowLinkStyle, flex: 1, cursor: 'default' }}>{inner}</span>
  }

  return (
    <div
      style={wrap}
      className={className}
      onMouseEnter={handlers.onMouseEnter}
      onMouseLeave={handlers.onMouseLeave}
      {...dataAttrs}
    >
      {body}
      {hasKebab ? (
        <span style={{ flex: 'none' }}>
          {/* Gray, not the amber accent the shared kebab defaults to —
              2026-10-14, Jillienne on the preview ("make the ellipsis gray").
              On a row the dots are the quietest thing in it; amber made them
              the loudest. `--ux-text-3` is the chevron's resting colour. */}
          <ActionMenu label={menuLabel ?? 'Actions'} items={actions!} triggerStyle={{ color: 'var(--ux-text-3)' }} />
        </span>
      ) : (
        <span aria-hidden style={{ flex: 'none', width: HUB_KEBAB_W }} />
      )}
      {children}
    </div>
  )
}

/**
 * A 160×110 picture box for a row whose picture is a FILE — a screenshot, a
 * capture. `cover` from the top, so a tall capture shows its header rather
 * than its middle; the box is the same one `GeneratedThumb` draws, so a list
 * mixing the two reads as one column of tiles.
 */
export function HubImageThumb({ src, width, height }: { src: string; width: number; height: number }) {
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width,
        height,
        flex: 'none',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        border: failed === src ? '1px dashed var(--ux-border)' : '1px solid var(--ux-border)',
        background: 'var(--ux-bg)',
      }}
    >
      {failed !== src && (
        <img
          src={src}
          alt=""
          loading="lazy"
          onError={() => setFailed(src)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top', display: 'block' }}
        />
      )}
    </span>
  )
}

/**
 * A 160×110 live miniature of a SAME-ORIGIN page — the Hub's own guides.
 * Inert (no pointer, out of the tab order), lazy, and drawn at the page's
 * desktop width scaled down, which is exactly what the Prototypes rows do
 * for the product's pages. ⚠ Same origin only: a cross-origin page behind a
 * password renders its password box here — see `GeneratedThumb.tsx`.
 */
export function HubPageThumb({ src, width, height }: { src: string; width: number; height: number }) {
  const frameW = 1440
  const scale = width / frameW
  return (
    <span
      aria-hidden
      style={{
        display: 'block',
        width,
        height,
        flex: 'none',
        overflow: 'hidden',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--ux-border)',
        background: 'var(--ux-bg)',
      }}
    >
      <iframe
        src={src}
        title=""
        tabIndex={-1}
        loading="lazy"
        style={{
          width: frameW,
          height: height / scale,
          border: 0,
          transform: `scale(${scale})`,
          transformOrigin: 'left top',
          pointerEvents: 'none',
        }}
      />
    </span>
  )
}
