import type { CSSProperties } from 'react'

/**
 * SUB-NAV — the quiet vertical rail that sits beside a page's content, one
 * level below the shell's dark left rail. Text rows, an active pill, no
 * glyphs.
 *
 * THE ICONS WENT on 2026-09-18 (the direct ask), from both consumers, and the
 * reading that justifies it: a glyph earns its place where it tells two rows
 * apart faster than the word does — which is the shell's 17px collapsed rail,
 * not a 208px column of left-aligned labels one level down. Here they were
 * decoration competing with the one thing the rail has to say, and two of the
 * Compass set were admitted stand-ins for drawings the registry does not hold.
 *
 * The ACCOUNT DROPDOWN keeps its glyphs, and that is not an inconsistency: six
 * unrelated destinations in a floating menu is the case where a mark does help,
 * and `AccountSectionDef.icon` is still read there.
 *
 * EXTRACTED from `AccountSubNav` on 2026-09-18, when the Compass course
 * launcher needed the same treatment (the direct ask: "this is the secondary
 * navigation style that also needs to exist on that page"). The account rail
 * had owned the markup, the styles and the hover class privately, so a second
 * surface would have meant a near-copy — and the way two sub-navs end up a few
 * pixels and one font weight apart is a second definition of the shell.
 * `AccountSubNav` composes this now and keeps its own data resolution.
 *
 * The treatment's reasoning is unchanged and is the account rail's: it is the
 * SECOND level of navigation, so it is deliberately quiet — no surface, no
 * border, just an active pill. Making it look like another panel would set it
 * up to compete with the rail it sits next to.
 *
 * It is a **selector, not a set of links**. Both consumers live inside the
 * Dashboard Rebrand shell and swap their content in place; rendering anchors
 * would re-mount the shell. `aria-current="page"` rather than `aria-pressed`,
 * because these read as navigation to the thing you are on rather than as
 * toggles. A test asserts no `<a>` in either.
 */
export function SubNav<Id extends string>({
  ariaLabel,
  items,
  active,
  onSelect,
}: {
  /** Names the region — two sub-navs in one app must not both be "Sections". */
  ariaLabel: string
  items: readonly SubNavItem<Id>[]
  active: Id
  onSelect: (id: Id) => void
}) {
  return (
    <nav aria-label={ariaLabel} style={navStyle}>
      {items.map(({ id, label }) => {
        const on = id === active
        return (
          <button
            key={id}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => onSelect(id)}
            /* The hover / focus rule lives in `tokens.css` under this class —
               `CSSProperties` cannot carry a pseudo-class. The name still says
               "account" because it is PERSISTED nowhere but it IS referenced by
               a test and by both consumers; renaming it is a sweep worth doing
               on its own rather than inside this extraction. */
            className="cre-account-subnav-item"
            style={{
              ...itemStyle,
              background: on ? 'var(--color-primary-100)' : 'transparent',
              color: on ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
              fontWeight: on ? 700 : 500,
            }}
          >
            <span>{label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/**
 * TEXT ONLY — no `icon` as of 2026-09-18 (the direct ask, from the account
 * rail). An item list that carries one (`AccountSectionDef` does, for the
 * account DROPDOWN) is still assignable; the glyph is simply not read here.
 */
export type SubNavItem<Id extends string> = {
  id: Id
  label: string
}

/** The rail's fixed width. Exported because a consumer's own layout has to
 *  clear it — the account row's gutter is derived from this figure. */
export const SUBNAV_WIDTH = 208

const navStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  // Fixed width so the content beside it doesn't reflow when the active label
  // changes length ("Profile" vs "Payment Methods").
  width: SUBNAV_WIDTH,
  flexShrink: 0,
}

/* No `gap` any more: the row has one child since the glyphs went, and a gap
   with nothing to separate is the kind of leftover this repo keeps finding
   behind removed elements (the nodes' white disc, Get Licensed's list gap). */
const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '10px 14px',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  fontFamily: 'var(--font-body)',
  /* 14/20, down from 15/22 on 2026-09-18 (the direct ask, from the Compass
     rail). 14 is the PRIMARY rail's own row size, which is the useful anchor:
     a second-level nav should not out-size the first-level one it sits beside,
     and at 15 it did — noticeably, with the two a column apart while the
     launcher is open.

     BOTH SURFACES MOVE, because they are one rail — the account sub-nav gets
     this too. Adding a size variant for one pixel is how the divergence this
     component was extracted to close comes back. The pill's height follows
     from the line-height (40px, from 42), and `padding` is untouched. */
  fontSize: 14,
  lineHeight: '20px',
  textAlign: 'left',
  cursor: 'pointer',
}
