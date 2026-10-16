import type { CSSProperties } from 'react'
import { initialsOf, type TodoHue } from '@/data/todoBoardStore'

/**
 * A person, as a coloured disc of initials.
 *
 * ⚠ NOT `@/components/ui/Avatar`, and that is a decision rather than an
 * oversight. That component is the product's avatar: it takes `tone`
 * (`brand` / `neutral`), membership tier rings and a Pro badge, all on the
 * BRAND tokens, and it has no way to say "this person is the teal one". The
 * board needs exactly that — five people have to be told apart at a glance in
 * a 24px disc — and it is drawn on the gateway's `--ux-hue-*` palette like
 * the rest of this page, which Avatar cannot reach.
 *
 * Forking it would have been worse: this is four lines of style, and the
 * alternative is a `hue` prop on a shared product component, used by nothing
 * in the product, that every future reader has to account for.
 *
 * The disc is `aria-hidden`: initials are a picture of a name, and every
 * caller already renders the name itself (the filter button's label, the
 * card's owner `<select>`, the Manage people row). An avatar that announced
 * "JM" beside the word "Jillienne" would be read twice.
 */
export function TodoBoardAvatar({
  name,
  hue,
  size = 24,
}: {
  name: string
  hue: TodoHue
  /** 24 on a card and in the roster, 22 in the filter row. */
  size?: number
}) {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 'none',
    width: size,
    height: size,
    borderRadius: 999,
    background: `var(--ux-hue-${hue})`,
    color: `var(--ux-hue-${hue}-fg)`,
    // The hue tokens are soft surfaces and their `-fg` pairs are the readable
    // ink on them — the same pairing `TodoPanel`'s stage pills use, so the
    // board's discs and the rail's pills are one system.
    fontSize: Math.round(size * 0.42),
    fontWeight: 700,
    letterSpacing: '0.02em',
  }
  return (
    <span aria-hidden style={style}>
      {initialsOf(name)}
    </span>
  )
}
