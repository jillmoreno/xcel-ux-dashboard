/* eslint-disable react-refresh/only-export-components -- same pattern as
   FeatureFlagContext and AccountContext: provider, hooks and helpers live
   together so consumers import from a single path. */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TESTABLE_CTA_IDS } from '@/data/testableCtas'

/**
 * DEAD ENDS FOR A USER TEST — 2026-09-23.
 *
 * Makes named clickable elements inert for one session, so a moderator can ask
 * "what did you expect that to do?" instead of watching the product answer.
 * The control still renders, still focuses, still looks exactly as live as its
 * neighbours; the click simply does nothing.
 *
 * ─── HOW IT WORKS ────────────────────────────────────────────────────────────
 *
 * ONE CAPTURE-PHASE LISTENER ON `document`, not a wrapper per control. A click
 * on anything inside `[data-cta-id]` is swallowed before React sees it.
 *
 * ⚠ THE CAPTURE PHASE IS THE WHOLE TRICK, and a bubble listener here would do
 * nothing. React 19 attaches its own listeners at the ROOT CONTAINER, which is
 * a descendant of `document` — so in the capture phase `document` runs FIRST,
 * and `stopPropagation` there means the event never reaches React's root and
 * no `onClick` ever fires. In the bubble phase React would already have run.
 *
 * KEYBOARD IS COVERED WITHOUT A SECOND LISTENER: Enter and Space on a
 * `<button>`, and Enter on an `<a href>`, both dispatch a real `click` event,
 * which is the event this intercepts. There is nothing extra to do, and adding
 * a `keydown` handler would double-fire.
 *
 * `preventDefault` FOR ANCHORS, `stopPropagation` FOR REACT, and
 * `stopImmediatePropagation` for everything else listening on `document` —
 * a dead CTA must do NOTHING, including not closing a menu or dismissing a
 * popover on its way past.
 *
 * ─── WHAT IT IS NOT ──────────────────────────────────────────────────────────
 *
 * ⚠ NOT A FEATURE FLAG. A flag decides which design renders and is committed,
 * reviewed and eventually resolved. This decides whether one already-rendered
 * control responds, for one session, and is never committed. Keep them apart:
 * a "dead CTA" entry in `FEATURE_FLAGS` would put a research instrument in the
 * catalog of product decisions, where the next person to run a flag audit
 * would quite reasonably try to resolve it.
 *
 * ⚠ NOT `disabled`, AND THAT IS A DELIBERATE ACCESSIBILITY TRADE. A dead CTA
 * carries no `disabled`, no `aria-disabled`, no dimming — so a screen-reader
 * user is told the control is operable, operates it, and gets silence. That is
 * a WCAG-hostile state, and it ships nowhere: it exists only under a `?dead=`
 * link handed to a moderator for one session. The reason to accept it is that
 * the alternative destroys the measurement — an announced-disabled control
 * answers the question for the participant, and the reach is the data. If a
 * test is ever run with an assistive-tech user, run it with no dead CTAs.
 *
 * ─── WHERE A RUN COMES FROM ──────────────────────────────────────────────────
 *
 * THE LINK IS THE CONFIG: `?dead=home.resume,home.details`. A session is
 * assembled by writing a URL, so two moderators can run different cuts off one
 * branch build and nothing about a run is committed. `promote-to-testing`
 * builds that link.
 *
 * ⚠ READ ONCE, THEN HELD — because in-app navigation drops the query string.
 * The first build read `location.search` on every render; the participant
 * pressed a live CTA, react-router replaced the URL, `?dead=` went with it and
 * every dead control came back to life mid-session. It is parsed at mount and
 * kept in state from then on.
 *
 * ⚠ `sessionStorage`, NOT `localStorage`, and not for persistence — for
 * SURVIVING A RELOAD inside one tab. A test run is a session, so it must die
 * with the tab: a `localStorage` entry would leave a machine quietly killing
 * CTAs weeks later with nothing on screen to explain it, which is the worst
 * failure this whole mechanism could have. `?dead=` with an empty value
 * clears the stored run.
 */

type CtaTestValue = {
  /** Ids inert for this session. Empty in every normal use of the app. */
  dead: ReadonlySet<string>
  /** True when a run is active — for the banner that says so. */
  active: boolean
}

const CtaTestContext = createContext<CtaTestValue>({ dead: new Set(), active: false })

const STORAGE_KEY = 'cgp.deadCtas'
const PARAM = 'dead'

/** Split a `?dead=` value into ids. Tolerant of spaces and trailing commas —
 *  the value is hand-written into a URL by a person under time pressure. */
export function parseDeadParam(raw: string | null): string[] {
  if (raw == null) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Resolve the session's dead list: the URL when it says anything, otherwise
 * whatever this tab already had.
 *
 * ⚠ `has(PARAM)` RATHER THAN A TRUTHY VALUE, so `?dead=` with nothing after it
 * is a CLEAR and not a no-op. That is the only way to turn a run off without
 * closing the tab, and a moderator mid-session needs one.
 */
function readRun(search: string): { ids: string[]; fromUrl: boolean } {
  const params = new URLSearchParams(search)
  if (params.has(PARAM)) return { ids: parseDeadParam(params.get(PARAM)), fromUrl: true }
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return { ids: stored ? parseDeadParam(stored) : [], fromUrl: false }
  } catch {
    // Storage unavailable (a sandboxed frame, a thumbnail capture). No run.
    return { ids: [], fromUrl: false }
  }
}

export function CtaTestProvider({ children }: { children: ReactNode }) {
  /* PARSED IN THE INITIALISER, not in an effect. An effect would render one
     frame with every CTA live, which is one frame in which a participant can
     land a click on a control the run says is dead. */
  const [dead] = useState<ReadonlySet<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    const { ids, fromUrl } = readRun(window.location.search)
    const known = ids.filter((id) => TESTABLE_CTA_IDS.includes(id))
    const unknown = ids.filter((id) => !TESTABLE_CTA_IDS.includes(id))
    if (unknown.length > 0) {
      /* LOUD, because the failure is silent otherwise: a mistyped id in a
         session link leaves that control LIVE, and the moderator finds out by
         watching a participant sail through the dead end they had planned. */
      console.warn(
        `[cta-test] Unknown CTA id${unknown.length > 1 ? 's' : ''} ignored: ${unknown.join(', ')}. ` +
          `See TESTABLE_CTAS in src/data/testableCtas.ts.`,
      )
    }
    if (fromUrl) {
      try {
        // An empty list still writes, so `?dead=` clears a stored run.
        sessionStorage.setItem(STORAGE_KEY, known.join(','))
      } catch {
        // Storage unavailable — the run holds for this page view regardless.
      }
    }
    return new Set(known)
  })

  useEffect(() => {
    if (dead.size === 0) return
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const el = target.closest('[data-cta-id]')
      const id = el instanceof HTMLElement ? el.dataset.ctaId : undefined
      if (!id || !dead.has(id)) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [dead])

  const value = useMemo(() => ({ dead, active: dead.size > 0 }), [dead])
  return <CtaTestContext.Provider value={value}>{children}</CtaTestContext.Provider>
}

/** The session's dead ids, plus whether a run is on at all. */
export function useCtaTest(): CtaTestValue {
  return useContext(CtaTestContext)
}

/**
 * Is this control inert right now?
 *
 * ⚠ ALMOST NOTHING SHOULD CALL THIS. Tagging an element with
 * `data-cta-id="…"` is the whole integration — the interceptor does the rest,
 * and a component that branches on its own deadness starts rendering
 * differently, which is exactly what must not happen. It exists for the
 * session banner and for tests.
 */
export function useIsCtaDead(id: string): boolean {
  return useCtaTest().dead.has(id)
}
