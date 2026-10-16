import type { CSSProperties } from 'react'
import { initialsOf, type TodoHue } from '@/data/todoBoardStore'
import './todoBoard.css'

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
  /* Colour lives in `todoBoard.css`, keyed on `data-hue` — read the note at
     the top of that file before moving any of it back in here. The short
     version: the disc tints its card with the hue rather than being filled by
     it (the `-fg` tokens are ink for the PAGE, not for the hue — filled, two
     of them were literally the same colour), and the mix has to be in a
     stylesheet because an inline `color-mix` is pathologically slow in
     jsdom's CSSOM and times a suite out. Geometry stays here, since it is the
     one thing that varies per call. */
  const style: CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.42),
  }

  return (
    <span aria-hidden className="cre-todo-avatar" data-hue={hue} style={style}>
      {initialsOf(name)}
    </span>
  )
}
