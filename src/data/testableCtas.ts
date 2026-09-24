/**
 * THE CTA CATALOG — every clickable element a user test is allowed to break.
 *
 * 2026-09-23. A moderated test learns most from what a participant REACHES
 * FOR, and the product answers almost every reach by navigating — at which
 * point the question "would you have expected that to do something?" can no
 * longer be asked, because it did. This catalog names the controls that can be
 * made inert for a single session so the reach itself is the finding.
 *
 * ─── WHAT THIS IS NOT ────────────────────────────────────────────────────────
 *
 * ⚠ IT IS NOT A FEATURE FLAG, and the distinction is the whole reason it is a
 * second mechanism rather than more entries in `FEATURE_FLAGS`. A flag decides
 * WHICH DESIGN RENDERS — it is a fork in the product, committed, reviewed, and
 * eventually resolved by picking a side. This decides whether one already-
 * rendered control RESPONDS, for one session, and is never committed at all.
 * Nothing here changes what a learner sees; a dead CTA is pixel-identical to a
 * live one, which is the point.
 *
 * ⚠ AND A DEAD CTA IS NOT A DISABLED ONE. No `disabled`, no `aria-disabled`,
 * no dimming. A disabled control answers the question for the participant —
 * they stop reaching, and the reach is the data. See `CtaTestContext` for what
 * that costs in accessibility terms and why it is still right here.
 *
 * ─── ADDING A CTA ────────────────────────────────────────────────────────────
 *
 * Two steps, and the second is one token:
 *   1. Add a row below.
 *   2. Put `data-cta-id="<id>"` on the element.
 *
 * Nothing else. No handler changes, no wrapper, no prop threading — the
 * interceptor in `CtaTestContext` finds the element by attribute.
 *
 * ⚠ AN ID MAY APPEAR ON SEVERAL ELEMENTS ON PURPOSE. The three pace options
 * share `home.pace-option` because "can they tell the pace is a choice" is one
 * question, not three; killing the group is the honest way to ask it. If you
 * ever need them apart, split the row — do not add a second attribute.
 */

/** Which region of the page a control sits in — the grouping a moderator picks
 *  from when building a run, and the only thing `region` is for. */
export type CtaRegion = 'Left nav' | 'Header' | 'Course header' | 'Jump back in' | 'Study Pace' | 'Study journey'

export type TestableCta = {
  /**
   * Stable id, `region.control`. NEVER CHANGE ONE after a test has run with
   * it: the id is what a session link carries, so a rename silently revives a
   * control in any link already handed out, and the run that produced a
   * finding stops being reproducible.
   */
  id: string
  /** The visible label, as a moderator would say it out loud. Where a control
   *  has two labels the alternative follows a slash — the id covers both. */
  label: string
  region: CtaRegion
  /** What breaking this one is FOR — the question the dead end asks. Shown
   *  when a run is assembled, so a control is never killed for its own sake. */
  asks: string
}

export const TESTABLE_CTAS: TestableCta[] = [
  /* ── Left nav ──────────────────────────────────────────────────────────── */
  {
    id: 'nav.dashboard',
    label: 'Home',
    region: 'Left nav',
    asks: 'Do they use the rail to get back, or the logo?',
  },
  {
    id: 'nav.courses',
    label: 'My Courses',
    region: 'Left nav',
    asks: 'Is the rail where they look for the rest of their courses?',
  },
  {
    id: 'nav.certificates',
    label: 'Certificates',
    region: 'Left nav',
    asks: 'Do they go looking for a certificate before they have earned one?',
  },
  {
    id: 'nav.support',
    label: 'Get Help',
    region: 'Left nav',
    asks: 'Is this the escape hatch they reach for when stuck?',
  },

  /* ── Header ────────────────────────────────────────────────────────────── */
  /*
   * `header.logo` LIVED HERE — "Do they expect the logo to be Home?" — and was
   * removed on 2026-09-23 when the logo stopped being a link at all ("clicking
   * on the logo in the top left should NOT do anything, please kill that
   * link").
   *
   * ⚠ A CONTROL THAT IS ALWAYS INERT IS NOT A TESTABLE CTA. Leaving the row
   * would let a moderator "kill" something already dead and then read a
   * participant's shrug as a finding about their session rather than about the
   * product. If the logo is ever a link again, the row comes back with the
   * attribute.
   */
  {
    id: 'header.notifications',
    label: 'Notification bell',
    region: 'Header',
    asks: 'Does the unread count pull them away from the task?',
  },
  {
    id: 'header.account',
    label: 'Account menu',
    region: 'Header',
    asks: 'Do they hunt for settings up here?',
  },

  /* ── Course header band ────────────────────────────────────────────────── */
  {
    id: 'home.course-details',
    label: 'Details →',
    region: 'Course header',
    asks: 'Is “Details” read as progress detail, or as course detail?',
  },

  /* ── Jump back in ──────────────────────────────────────────────────────── */
  {
    id: 'home.resume',
    label: 'Resume / Start course',
    region: 'Jump back in',
    asks: 'Is this the first thing they reach for? If it dies, where do they go instead?',
  },

  /* ── Study Pace ────────────────────────────────────────────────────────── */
  {
    id: 'home.pace-option',
    label: 'The three pace plans',
    region: 'Study Pace',
    asks: 'Do they read the three as a choice they can make, or as a readout?',
  },
  {
    id: 'home.week-strip',
    label: 'The M–S day circles',
    region: 'Study Pace',
    asks: 'Does anyone discover the circles are clickable without being told?',
  },
  {
    id: 'home.study-pace-adjust',
    label: 'Adjust / Customize Study Plan',
    region: 'Study Pace',
    asks: 'Is the link the way they expect to change a pace, or do they hunt on the card?',
  },
  {
    id: 'home.study-pace-info',
    label: 'The completion-date info glyph',
    region: 'Study Pace',
    asks: 'Do they need the tooltip to trust the date, or ignore it?',
  },

  /* ── Study journey ─────────────────────────────────────────────────────── */
  {
    id: 'home.journey-stop',
    label: 'The coursework rows (Pre-Licensing, Course Exam, …)',
    region: 'Study journey',
    asks: 'Do they treat the rail as a table of contents, or as a status readout?',
  },
  {
    id: 'home.schedule-exam',
    label: 'Schedule State Exam / Edit Exam Date →',
    region: 'Study journey',
    asks: 'Do they go here to book, or look for it somewhere else first?',
  },
  {
    id: 'home.exam-date-save',
    label: 'Save (exam date)',
    region: 'Study journey',
    asks: 'Do they believe the date saved without a confirmation?',
  },
  {
    id: 'home.exam-date-clear',
    label: 'Clear (exam date)',
    region: 'Study journey',
    asks: 'Can they undo a wrong date without help?',
  },
  {
    id: 'home.what-to-expect',
    label: 'What to expect →',
    region: 'Study journey',
    asks: 'Is exam anxiety enough to pull them out of the coursework?',
  },
  {
    id: 'home.how-to-apply',
    label: 'How to apply →',
    region: 'Study journey',
    asks: 'Do they look this far ahead at all?',
  },
  {
    id: 'home.state-requirements',
    label: 'New York State Requirements',
    region: 'Study journey',
    asks: 'Is the full requirements sheet something they want, or noise?',
  },
]

/** Every id, for validating a session's `?dead=` list. */
export const TESTABLE_CTA_IDS: readonly string[] = TESTABLE_CTAS.map((c) => c.id)

/** The catalog grouped for display, in the order the regions are declared. */
export function testableCtasByRegion(): { region: CtaRegion; ctas: TestableCta[] }[] {
  const order: CtaRegion[] = []
  const bucket = new Map<CtaRegion, TestableCta[]>()
  for (const cta of TESTABLE_CTAS) {
    if (!bucket.has(cta.region)) {
      bucket.set(cta.region, [])
      order.push(cta.region)
    }
    bucket.get(cta.region)!.push(cta)
  }
  return order.map((region) => ({ region, ctas: bucket.get(region)! }))
}
