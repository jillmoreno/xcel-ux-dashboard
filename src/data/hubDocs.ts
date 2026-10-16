/**
 * HUB RESOURCES — the Hub's own documents (2026-10-15, Jillienne).
 *
 * The three guides are static pages under `public/`, each with a PDF rendered
 * from it. Until today none of them was reachable from the rail: the
 * Contributing section was archived on 2026-09-29 and the "How to read this
 * dashboard" link came off the rail foot the same day, so all three were
 * reachable only by typing a URL. This list is the way back in, under its own
 * **Team** eyebrow.
 *
 * NOT `PROTOTYPE_FEATURES` rows, and not a link board. A feature row is a
 * surface of the product; a board row is something a person added on the page
 * and can remove. These are files in this repository, shipped with the build —
 * the list changes when a file is added, which is a commit, so it belongs in
 * code. That is also why there is no "Add" button on the panel.
 *
 * ⚠ ONE ENTRY PER DOCUMENT, and `href` must be a path this site serves, not an
 * absolute address. A document is served from the same deploy as the dashboard
 * reading this list, so a branch build shows ITS OWN copy of these pages — the
 * one thing an absolute URL would break, by sending a reviewer on a branch
 * build back to `main`'s guide.
 */
export type HubDoc = {
  id: string
  title: string
  /** Who it is written for — the question a reader asks first. */
  audience: string
  blurb: string
  /** Site-relative, with the trailing slash the folder is served at. */
  href: string
  /** The PDF beside it, site-relative. '' when there is none. */
  pdf: string
  /** `yyyy-mm-dd`, the date in the document's own dateline. Shown so a reader
   *  can tell at a glance whether they are looking at something current. */
  updated: string
}

export const HUB_DOCS: HubDoc[] = [
  {
    id: 'designer-workflow',
    title: 'Designer Workflow on the Hub',
    audience: 'Eric and Anjani — useful to Afsana and Cody',
    blurb:
      'From a laptop with nothing on it to a branch under review. Thirteen parts: setup, the daily loop, rebasing, building a change, sharing on Refinement, promoting a surface, and what to say when something goes wrong.',
    href: '/designer-workflow/',
    pdf: '/designer-workflow/designer-workflow.pdf',
    updated: '2026-10-15',
  },
  {
    id: 'contributing',
    title: 'Contributing to the dashboard',
    audience: 'A designer arriving for the first time',
    blurb:
      'The same loop at more length, with pictures and the failure modes — eight illustrated steps, then the long version, the feature-flag rule, the Refinement form field by field, and a troubleshooting table.',
    href: '/contributing/',
    pdf: '/contributing/contributing.pdf',
    updated: '2026-10-15',
  },
  {
    id: 'about',
    title: 'How to read this dashboard',
    audience: 'Stakeholders',
    blurb:
      'The orientation page a reviewer is sent to: what Prototypes means, what Refinement means, how to read a row, and why nothing they change in a prototype is saved.',
    href: '/about/',
    pdf: '/about/about.pdf',
    updated: '2026-09-18',
  },
]
