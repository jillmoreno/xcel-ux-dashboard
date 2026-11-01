/**
 * THE STAGE BUILD — the third environment, between a designer's branch and
 * `main` (2026-11-01, Jillienne).
 *
 * Until now a chunk of work had two places it could be seen: the designer's
 * own branch build (a Refinement row) and `main` (a Prototypes row). Nothing
 * sat between "under discussion" and "released", so an owner who had DECIDED
 * what their surface should be had no way to show that decision until
 * Jillienne merged it. `stage` is that middle: a long-lived branch that
 * Netlify builds at its own address, exactly like any `feat/…` branch, which
 * owners merge into with `/share-to-stage` and Jillienne releases to `main`
 * with `/release`. After a release the two branches are identical until the
 * next share.
 *
 * ON THE HUB it is NOT a new section — Jillienne, 2026-11-01: "I want the
 * prototype page to have both Main and Stage options there, not a new page in
 * the rail." Prototypes keeps its one row per surface and gains a Main · Stage
 * switch above the rows. The rows are the same rows; the switch decides which
 * BUILD each one opens. Under Main every row opens this origin (main's build,
 * exactly as before). Under Stage every row opens the same `to` on the stage
 * origin. `UxDashboard.smoke.test.tsx` pins both.
 *
 * WHY THE STAGE ORIGIN IS A CONSTANT. The Hub is served from `main`, so it
 * cannot know what is on `stage` without asking the stage site — and every
 * Netlify build of this project is behind the same site password, which a
 * cross-origin fetch does not carry. So the Hub does not try: it links to the
 * stage build and lets the stage build speak for itself. What is WAITING on
 * stage is the To Do Board's "On Stage" column, which `/share-to-stage` fills
 * in, not a tag on these rows. A "Staged · date" tag here would need either
 * a manifest the password gate lets through or a Blobs store the two skills
 * write to; both are possible, neither was worth doing before the loop had
 * been used.
 *
 * THE ADDRESS is Netlify's branch-deploy shape — `<branch>--<site>.netlify.app`
 * — for the branch named `STAGE_BRANCH`. `share-branch` builds the same
 * shape for a feature branch; `linkifyNote.tsx` reads it back. If the site is
 * ever renamed, `HUB_HOST` here and `HUB_URL` in `PrototypeBar.tsx` move
 * together (a test pins the two to one host).
 */

/** The branch `/share-to-stage` merges into and `/release` merges from. */
export const STAGE_BRANCH = 'stage'

/** The production Hub's host — `main`'s build. */
export const HUB_HOST = 'ux-design-xceldashboard.netlify.app'

/** The stage build's origin, Netlify's branch-deploy address for `stage`. */
export const STAGE_ORIGIN = `https://${STAGE_BRANCH}--${HUB_HOST}`

/** Which build a Prototypes row opens. `main` is the released product; `stage`
 *  is what owners have shared to stage and is awaiting release. */
export type PrototypeBuild = 'main' | 'stage'

export const PROTOTYPE_BUILDS: ReadonlyArray<{ id: PrototypeBuild; label: string; note: string }> = [
  {
    id: 'main',
    label: 'Main',
    note: 'The released product — main’s build at the committed baseline.',
  },
  {
    id: 'stage',
    label: 'Stage',
    note: 'Shared to stage and awaiting release. Same rows, the stage branch’s build.',
  },
]

export function parsePrototypeBuild(raw: string | null | undefined): PrototypeBuild {
  return raw === 'stage' ? 'stage' : 'main'
}

/** The address a Prototypes row opens for a build. A row's `to` is a
 *  same-origin path (`/dashboard-rebrand?demo=1`); under Main it is used as
 *  is, under Stage the same path is opened on the stage origin. Anything that
 *  is not a Prototypes route — a document's `externalUrl`, a handoff gateway —
 *  is untouched: the switch is about which BUILD of the product opens, and
 *  only the product rows open a build. */
export function prototypeHref(to: string, build: PrototypeBuild): string {
  if (build !== 'stage') return to
  return `${STAGE_ORIGIN}${to.startsWith('/') ? to : `/${to}`}`
}
