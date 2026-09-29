import { useSearchParams } from 'react-router-dom'
import { CompassMark, House, HouseSolid } from '@/icons'
import { useNavPlacement } from './navPlacement'
import type { PlatformSection } from './PlatformSideNav'

/**
 * Platform TOP NAV — the second of the two navigation options the
 * `nav-placement` flag chooses between (Figma 765:3801).
 *
 * A FORK, NOT A MODE OF THE RAIL. `PlatformSideNav` is untouched: option 1 is
 * the rail exactly as it ships, and this file is option 2 in full. That is the
 * repo's rule for comparing two treatments (CLAUDE.md, "fork the layout,
 * import the data") and it is what lets the two be judged against each other
 * rather than against a version of the rail with the top nav's compromises
 * already threaded through it.
 *
 * WHAT IT SHARES WITH THE RAIL IS THE STATE, WHICH IS THE POINT. The active
 * section is `?section=` in the URL and nothing else — `PlatformShell` reads
 * it, `PlatformSideNav` writes it through `handleSelect`, and this writes it
 * the same way. So the two navs are interchangeable without lifting a single
 * piece of state, and a section deep link keeps working under both.
 *
 * ⚠ IT LIVES IN THE HEADER, WHICH IS ABOVE THE SHELL. `Header` renders in
 * `AppLayout`, outside `PlatformShell` and therefore outside the course /
 * resource launcher providers — so unlike `handleSelect` this cannot close an
 * open launcher on its way out. The shell closes them when the section changes
 * under a top nav instead; see the effect next to `topNav` in PlatformShell.
 */

type TopNavItem = {
  id: PlatformSection
  label: string
  icon?: typeof House
  iconActive?: typeof House
}

/**
 * TWO ITEMS, OR THREE ON OPTION 4 — and the short list is the design's claim,
 * not a porting shortcut. (Help joins them only where nothing else carries it;
 * see `HELP_ITEM`.)
 *
 * The rail carries seven rows; the Figma draws Home, Compass Learning and
 * Help. A top nav has a header's width to work in rather than a column's
 * height, so the concept it is testing is a SHORTER primary nav with the
 * learning areas reached from the page below — which is why the same design
 * puts Study Pace / Courses / Certificates in a tab strip on Home.
 *
 * ⚠ NOTHING BECOMES UNREACHABLE BY BEING OFF THIS LIST. Every section still
 * resolves from `?section=`, which is the rule the rail already follows for
 * its own hidden rows ("It hides the ROW ONLY" — `hiddenSections` in
 * PlatformSideNav). Trimming a nav here is an editorial act, not a feature cut.
 *
 * ⚠ TWO LABELS ARE MAPPED RATHER THAN MATCHED, and both are worth a second
 * look before this is shown to anyone:
 *   - "Compass Learning" → `compass`, its OWN page (Figma 765:3471) — the
 *     Compass chrome opened on Overview. It pointed at `courses` for one
 *     commit, which was a guess and the wrong one: Compass Learning is a
 *     destination of its own, not another name for My Courses.
 *   - "Help" → `support`, the rail's Get Help row under a shorter label.
 */
const TOP_NAV_ITEMS: readonly TopNavItem[] = [
  { id: 'dashboard', label: 'Home', icon: House, iconActive: HouseSolid },
  { id: 'compass', label: 'Compass Learning', icon: CompassMark },
]

/**
 * HELP IS OPTION 4'S ALONE — 2026-09-29, the direct ask: "only have Help be in
 * the top nav when we are on option 4 because it doesn't live anywhere else.
 * Otherwise, remove it from the top nav."
 *
 * Under Option 3 the rail carries Get Help, so a second one in the header is a
 * duplicate. Option 4 has no rail and its tab strip is Study Pace / Courses /
 * Certificates, so the header is the only place left for it.
 *
 * ⚠ OPTION 1 HAS NO RAIL EITHER, and now no Help anywhere — `?section=support`
 * still resolves, but nothing on screen points at it. That follows the ask as
 * given rather than contradicting it; it is the one arm worth a second look.
 */
const HELP_ITEM: TopNavItem = { id: 'support', label: 'Help' }

export function PlatformTopNav() {
  const placement = useNavPlacement()
  const items =
    placement === 'hybrid-tabs' ? [...TOP_NAV_ITEMS, HELP_ITEM] : TOP_NAV_ITEMS
  const [params, setParams] = useSearchParams()
  /* The shell's own default: no `?section=` IS Home, because `handleSelect`
     deletes the param rather than writing `dashboard` into it. */
  const active = params.get('section') ?? 'dashboard'

  /* Mirrors `PlatformShell.handleSelect` — same param, same delete-on-Home,
     same `replace` so the in-place section swap leaves no history entries. */
  const select = (id: PlatformSection) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (id === 'dashboard') next.delete('section')
        else next.set('section', id)
        return next
      },
      { replace: true },
    )
  }

  return (
    <nav aria-label="Primary" className="flex items-center" style={{ gap: 24 }}>
      {items.map((item) => {
        /* A section reached by deep link that is not on this list leaves NO
           item active, which is the honest state — falling back to Home would
           light the wrong item while the learner is on Certificates. */
        const isActive = active === item.id
        const Icon = isActive ? (item.iconActive ?? item.icon) : item.icon
        return (
          <button
            key={item.id}
            type="button"
            /* THE SAME CTA IDS THE RAIL EMITS, derived the same way — a
               moderated run that breaks `nav.courses` must break it under
               EITHER navigation, or the two options stop being comparable at
               exactly the moment someone is watching a participant use them.
               All three of these are registered in `TESTABLE_CTAS`. */
            data-cta-id={`nav.${item.id}`}
            onClick={() => select(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`cre-nav-pill cre-topnav-pill${isActive ? ' is-active' : ''}`}
          >
            {Icon ? <Icon size={17} aria-hidden /> : null}
            {item.label}
          </button>
        )
      })}
    </nav>
  )
}
