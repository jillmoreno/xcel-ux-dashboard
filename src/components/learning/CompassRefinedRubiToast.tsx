import { RubiLogo, X } from '@/icons'
import { REFINED_RUBI_INTRO } from '@/data/compassRefinedCopy'
import { useAccount } from '@/context/AccountContext'

/**
 * RUBI'S FIRST-RUN TOAST — 2026-11-11: "when a user first lands here, (at
 * 0%), then a message should appear where the ask rubi is, like a toast
 * alert, in the style with the navy button."
 *
 * ⚠ IT TAKES THE ASK RUBI PILL'S PLACE AND GIVES IT BACK. The pill is where
 * a learner goes to reach her; the toast is her reaching THEM, once, on the
 * day they arrive. Drawing both would put two ways to start one conversation
 * a centimetre apart, so the page shows the toast instead of the pill and
 * dismissing it reveals the pill — which also teaches where she lives.
 *
 * ⚠ STARTING LEADS, NOT TALKING. On the inline card Rubi's own offer was the
 * primary; on a toast that greets somebody who has not begun the course,
 * making "Talk with Rubi" the one navy button would make meeting the tutor
 * the first thing the product asks of them. Start the course is the primary,
 * Talk with Rubi is the outlined alternative, Not now is the way past.
 *
 * ⚠ THREE ACTIONS AND A CLOSE IS DELIBERATE, not an oversight of the
 * one-action rule the next-step card follows. That card asks "what next?"
 * and must answer it once; this one is an introduction, and an introduction
 * a learner cannot decline is a prompt.
 */
export function CompassRefinedRubiToast({
  onDismiss,
}: {
  /** Closes the toast and hands the corner back to the Ask Rubi pill. */
  onDismiss: () => void
}) {
  /* Her greeting uses the learner's name — see `REFINED_RUBI_INTRO.title`. */
  const { user } = useAccount()
  return (
    <aside className="crf-rd-toast" aria-label={REFINED_RUBI_INTRO.label}>
      <div className="crf-rd-toast__head">
        <p className="crf-rd-toast__eyebrow">
          <RubiLogo size={14} aria-hidden />
          {REFINED_RUBI_INTRO.label}
        </p>
        <button
          type="button"
          className="crf-rd-toast__x"
          aria-label={REFINED_RUBI_INTRO.close}
          onClick={onDismiss}
        >
          <X size={14} aria-hidden />
        </button>
      </div>
      <h2 className="crf-rd-toast__title">{REFINED_RUBI_INTRO.title(user.firstName)}</h2>
      <p className="crf-rd-toast__why">{REFINED_RUBI_INTRO.why}</p>
      <div className="crf-rd-toast__cta">
        <button type="button" className="crf-rd-toast__go">
          {REFINED_RUBI_INTRO.start}
        </button>
        <button type="button" className="crf-rd-toast__alt">
          {REFINED_RUBI_INTRO.cta}
        </button>
        {/* Dismissing from here and from the × are the same act. */}
        <button type="button" className="crf-rd-toast__quiet" onClick={onDismiss}>
          {REFINED_RUBI_INTRO.dismiss}
        </button>
      </div>
    </aside>
  )
}
