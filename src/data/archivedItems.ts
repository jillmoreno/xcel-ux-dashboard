/**
 * ─────────────────────────────────────────────────────────────────────────
 *  ARCHIVE — things removed from the XCEL project
 * ─────────────────────────────────────────────────────────────────────────
 *
 *  Rendered by `ArchiveTable` in the dashboard's Archive section. Hand-edited;
 *  there is no generator.
 *
 *  NO LONGER EMPTY as of 2026-09-10 — two rows as of 2026-09-16. It was empty on
 *  purpose before that, and the rule behind it still holds: do not seed this with rows from
 *  the other dashboards' archives to make it look populated, because a restore
 *  note pointing at another repo's files is worse than no row at all.
 *
 *  THE CONVENTION THIS FILE ENFORCES, for when there is something to put here:
 *
 *    Don't delete outright. When you remove something, UNWIRE it (pull it from
 *    routes, render paths, flags) but KEEP the file(s) in the repo, just
 *    unreferenced — then add a row here pointing at them, with a `restoreNote`
 *    that lists the actual re-wire steps. Bringing it back should be a re-wire,
 *    never a rebuild.
 *
 *  `restoreNote` is the field that earns its keep, and the one most often
 *  written too thinly. Name the files, the exact call sites, and anything that
 *  was deliberately NOT restored — a note that just says "re-add the component"
 *  is how a removal becomes permanent by accident.
 *
 *  The first row turned out not to be the one predicted here (the XCEL rows
 *  moving out of the Common LMS dashboard — still an open question, and still
 *  that project's archive rather than this one, since the code being unwired
 *  would be theirs). It was a card on the Profile page instead.
 */
export type ArchivedItem = {
  /** Stable id (kebab-case). */
  id: string
  /** Component / feature / variant name. */
  name: string
  /** One line: what it was / what it did. */
  what: string
  /** Where the code still lives (file path[s]) — kept in-repo, just unwired. */
  location: string
  /** The feature flag or route that governed it, if any. */
  flag?: string
  /** When it was archived — 'YYYY-MM-DD'. */
  dateRemoved: string
  /** Why it was pulled from the project. */
  reason: string
  /** How to bring it back — the re-wire steps / which flag or route to restore. */
  restoreNote: string
  /**
   * Optional screenshot of what it looked like, shown in the detail Sheet.
   * A path under `public/` (served at BASE_URL), e.g. 'archive/my-thing.png'.
   * Drop the PNG in `public/archive/`. Absent → the Sheet shows a placeholder.
   */
  screenshot?: string
}

export const ARCHIVED_ITEMS: ArchivedItem[] = [
  {
    id: 'learner-band-completed-celebration',
    name: 'Completed celebration band (100%)',
    what: 'The green "You’re all caught up!" card the Learner Focused band returned INSTEAD of itself at 100% — a success half with the completed stats and a View Certificate action, joined to a white panel offering Browse Catalog.',
    location:
      'src/components/membership/v5/LearnerFocusedBand.tsx — the `if (renewalReady) { … }` early return, replaced by a block comment at the same spot. `CompletedCelebration` and its `CompletedStat` type are UNTOUCHED in `CompletedCelebration.tsx` and still used by `ClpJumpBackInBand` and `MarketingFocusedBand`.',
    dateRemoved: '2026-09-21',
    reason:
      'The direct ask for a completed state on the NORMAL band ("the course image should not disappear"). The early return was why nothing else survived 100%: the course header and its art, the Study Journey, the Jump Back In card and the pace tile were all below it and never rendered. What replaced it is the band in a completed state — the pace tile hidden, Jump Back In reading "Review Course Material", and the journey marking all four coursework stops complete. The celebration is not wrong, it is a different answer to the same state, and keeping both would have said "complete" twice on one screen.',
    restoreNote:
      'Re-add one `if (renewalReady) { … }` block at the top of `LearnerFocusedBand`’s render, above the `return (` — it built a `CompletedStat[]` from `mandatory`/`elective` when `hasBreakdown`, then `deadline` and `timeRemainingText(weeksLeft)`, and returned a `<section aria-label="Learning path complete" className="cre-learner-focused-band">` with a two-column grid wrapping `<CompletedCelebration …>`. Re-import `CompletedCelebration` and `type CompletedStat` from `./CompletedCelebration`, and `DiscoveryEmpty` from `./JumpBackInDiscoveryEmpty` (both imports went with it). `renewalReady`, `onBrowseCatalog` and `onViewCertificate` are ALL STILL PROPS — `renewalReady` now drives the completed treatments inside the band, and the other two are accepted-and-ignored precisely so a restore needs no caller changes; re-add them to the destructure. NOT restored deliberately: the second `gridTemplateColumns: stack ? …` declaration that lived in that branch. A test (`has only ONE grid to edit now`) pins its absence, because the celebration grid once received an edit meant for the live one and the symptom was the left column silently getting narrower — re-adding the branch means updating that test and inheriting the warning in it.',
  },
  {
    id: 'header-cart',
    name: 'Header cart button',
    what: 'The shopping-cart icon pill in the top-right header cluster, left of the notification bell and the account menu.',
    location: 'src/components/layout/Header.tsx — `CartButton`, exported and unreferenced.',
    dateRemoved: '2026-09-21',
    reason:
      'The direct ask ("no cart"). It was a `<Link to="#">` — a control that has never gone anywhere — in a product where the learner is already enrolled and buys course packages on xcelsolutions.com rather than inside the LMS, so it promised a storefront this app does not have. Removed in the same pass as the membership upsell band and the Career Tools "Member Exclusive" badge, but for a DIFFERENT reason: those two are a correctness fix behind `supportsMembership` and return on their own for a brand that sells a membership, whereas this is editorial and therefore archived.',
    restoreNote:
      'Re-add `<CartButton />` as the first child of the `utilities` cluster in `Header.tsx` (directly above `{showBell && <NotificationsMenu />}`), and delete the block comment that replaced it. The component itself is unchanged and still exported from that file — drop the `export` again if it regains its only in-file caller, since it was exported solely to keep an unreferenced local function from failing lint. NOT restored with it, and a separate decision: the `to="#"` href. It never resolved, so a restore that matters wants a real destination (a cart route, or an outbound link to the xcelsolutions.com basket) rather than the dead link this was. Nothing else moved — the bell and the account menu keep their positions, and the cluster comment explaining why the bell sits between Cart and the avatar was deliberately left in place.',
  },
  {
    id: 'dashboard-mvp-version',
    name: 'Dashboard MVP (classic /dashboard version)',
    what:
      'The sixth entry in the classic dashboard version picker — a pared-back V3 with the right rail hidden, the hero "Saved this year" chip dropped, the content column centred, and Featured Products moved below Learning Path + Courses.',
    location:
      'src/components/dashboard/versions/DashboardMVP.tsx (kept, unreferenced). Its MVP_FLAGS snapshot is still in that file.',
    flag: "Was driven by MVP_FLAGS — a snapshot of eight now-removed catalog flags; the route itself is `/dashboard?version=mvp`, behind `dashboard-tab`.",
    dateRemoved: '2026-09-16',
    reason:
      'It was defined ENTIRELY by a feature-flag snapshot, and the XCEL flag audit removed all eight of those flags from the catalog (they only ever drove the classic /dashboard, which this project\'s demo never opens). Without them MVP renders as V3 with hideRightRail / membershipPlacement="trail" / consolidatedProgress — a second near-identical row in the picker. The three props survive on DashboardV3, so what made MVP a distinct LAYOUT is still there; what is gone is the flag configuration that made it a distinct CONFIGURATION.',
    restoreNote:
      'Re-add the eight flags to FEATURE_FLAGS in src/context/FeatureFlagContext.tsx (dashboard-kpi-card, jump-back-in-card, jump-back-in-card-links, dashboard-top5-pagination, membership-card-layout/-height/-width, streak-hero-card) and revert the pinned constants that replaced them in DashboardV3.tsx and LearnerOverviewPanel.tsx — each pin carries a comment naming its flag. Then re-add the `mvp` row to DASHBOARD_VERSIONS (src/data/dashboardVersions.ts) and the `case \'mvp\'` branch + DashboardMVP import to src/pages/DashboardPage.tsx. NOT restored deliberately: nothing in DashboardMVP.tsx itself was edited, so no component work is needed — and note the five right-rail flags in MVP_FLAGS (premium-membership-card, whats-new-card, quick-links-card, rubi-tutor-widget, dashboard-rail-tray) were always moot here, since `hideRightRail` already drops that column.',
  },
  {
    id: 'profile-motivational-statement',
    name: 'Motivational Statement card (Profile)',
    what: 'A card on the Profile page holding the learner’s own motivational statement, with an edit pencil opening the real `MotivationalStatementPanel` (the only card there wired to anything but a stub).',
    location:
      'src/components/account/profile/ProfileCards.tsx (`MotivationalStatementCard`, still exported, no longer imported) · src/components/membership/MotivationalStatementPanel.tsx · src/context/MotivationContext.tsx',
    dateRemoved: '2026-09-10',
    reason:
      'Editorial — removed from the Profile page at Jillienne’s request. NOT a capability or data problem: the statement is real, the panel works, and the context is untouched.',
    restoreNote:
      'Re-add `MotivationalStatementCard` to the import from `@/components/account/profile/ProfileCards` in src/pages/ProfilePage.tsx and render it as the FIRST child of the right-hand column, above `MembershipPlanCard`. Nothing else moved: the component, `MotivationalStatementPanel` and `MotivationContext` are all intact and unchanged, and the STATEMENT itself is still read and written by `ProfilePersonalizePanel` (through `MotivationContext`) and displayed by `ProfilePersonalizeBand`. CORRECTED 2026-09-16: this note used to say the panel was “STILL REACHABLE from the left rail (`NavProfileHeader` → MotivationalStatementPanel)”. That stopped being true when the rail profile header was unwired the same day — see `nav-profile-header` below. `MotivationalStatementPanel` (the slide-over) now has NO live caller, so restoring this card also restores the only door onto it. Deliberately NOT restored alongside it: the Membership Plan card, which left the same page on the same day for an unrelated reason (it is gated on `supportsMembership`, not archived, and returns by itself for a brand that sells one).',
  },
  {
    id: 'nav-profile-header',
    name: 'Profile header (left rail)',
    what: 'The pinned top region of the dashboard rail: the learner’s 48px avatar with its thin Brick `brandRing`, “Welcome back, <name>” as a button to the Profile page, their motivational statement, and the divider under the group. On a brand that sells membership it also carried the “Your Membership” summary — moot for XCEL, where `supportsMembership` is false.',
    location:
      'src/components/layout/PlatformSideNav.tsx (`NavProfileHeader`, exported, no longer rendered) · `NavMotivationQuote` and `NavMembershipSummary` are reached only through it · src/components/membership/MotivationalStatementPanel.tsx',
    dateRemoved: '2026-09-16',
    reason:
      'Editorial — removed at Jillienne’s request. The header’s account trigger gained the learner’s photo AND name on the same day, so this was the second portrait-and-name of the same person in one viewport, a few hundred pixels apart. The rail now opens on MY LEARNING, which is its job.',
    restoreNote:
      'Re-add `<div style={{ flexShrink: 0 }}><NavProfileHeader isMember={isMember} onSelect={onSelect} /></div>` as the first child of the `<nav>` in `PlatformSideNav`, and restore `const isMember = membership === \'member\'` with `membership` back in that component’s `useAccount()` destructure — `NavProfileHeader` is its only consumer, so it was dropped with it. Nothing INSIDE the header changed: the component, `NavMotivationQuote`, `NavMotivationStatementButton`, `NavMembershipSummary` and `MotivationalStatementPanel` are all intact. Two things to decide rather than restore blindly: (1) the header’s account trigger now shows the same photo and name, so bringing this back re-creates the duplication that removed it — consider dropping the name from `.cre-account-pill` instead; (2) `brandRing` on `Avatar` has NO other call site, and it exists to mark this avatar as the learner’s own, so restoring the header restores the only thing that uses it. Deliberately NOT restored with it: nothing — this row is self-contained.',
  },
]
