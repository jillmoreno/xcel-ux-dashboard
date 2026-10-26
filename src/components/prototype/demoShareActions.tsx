import { useRef, useState, type ReactNode } from 'react'
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
import { DemoShareContext, type DemoShareActions } from './demoShareActionsUtil'

export function DemoShareProvider({ children }: { children: ReactNode }) {
  const ref = useRef<DemoShareActions | null>(null)
  const [copied, setCopied] = useState(false)
  const publish = (actions: DemoShareActions | null) => {
    ref.current = actions
  }
  return (
    <DemoShareContext.Provider value={{ ref, publish, notifyCopied: () => setCopied(true) }}>
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
