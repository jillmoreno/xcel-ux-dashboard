import { createContext, useContext, useRef, useState, type ReactNode, type MutableRefObject } from 'react'
import { Toast } from '@/components/ui/Toast'

/**
 * WHERE THE SHARE ACTIONS ARE OWNED vs WHERE THEY ARE DRAWN — 2026-10-05.
 *
 * The kebab moved to the PrototypeBar, beside the device toggle (the direct
 * ask), but its two actions cannot move with it: `copyLink` and `copyDemoLink`
 * bake the reviewer's whole captured state into the URL — tier, professions,
 * memberships, the progress persona, the education type, What's New, the brand,
 * and every non-default flag — and all of that lives in `DemoControlsBar`.
 *
 * ⚠ A REF, NOT STATE, AND THAT IS THE POINT. The handlers close over values
 * that change on most renders, so publishing them through state would mean
 * re-rendering the whole chrome to keep a menu's callbacks fresh — and getting
 * it subtly wrong would copy a STALE link, which is the one failure mode that
 * looks like it worked. The bar overwrites the ref on every render; the menu
 * reads it at click time, so it cannot be stale by construction.
 *
 * ⚠ THE TOAST LIVES HERE, not in the bar, because the bar can be hidden. With
 * the demo toggle off `DemoControlsBar` returns null — but it has already
 * published its handlers (the ref assignment is above that early return), so
 * the menu still works, and a confirmation rendered inside the hidden bar would
 * never appear. Copying with the bar hidden is the normal case now that the
 * kebab is one bar up.
 */
export type DemoShareActions = {
  copyLink: () => void
  copyDemoLink: () => void
}

type Ctx = {
  ref: MutableRefObject<DemoShareActions | null>
  notifyCopied: () => void
}

const DemoShareContext = createContext<Ctx | null>(null)

export function DemoShareProvider({ children }: { children: ReactNode }) {
  const ref = useRef<DemoShareActions | null>(null)
  const [copied, setCopied] = useState(false)
  return (
    <DemoShareContext.Provider value={{ ref, notifyCopied: () => setCopied(true) }}>
      {children}
      <Toast
        open={copied}
        onClose={() => setCopied(false)}
        tone="success"
        title="Link copied"
        duration={1900}
      >
        Send it to show this exact view.
      </Toast>
    </DemoShareContext.Provider>
  )
}

/** For `DemoControlsBar` — publish the handlers. Safe outside a provider
 *  (returns null) so the bar can still be unit-mounted standalone. */
export function useDemoShareRegistry(): Ctx | null {
  return useContext(DemoShareContext)
}

/** For `PrototypeBar` — read them at click time. Null until the bar has
 *  published, which is also the signal that there is nothing to share (any
 *  route but the rebrand), so the kebab hides itself. */
export function useDemoShareActions(): DemoShareActions | null {
  return useContext(DemoShareContext)?.ref.current ?? null
}
