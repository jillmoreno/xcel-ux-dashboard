# The Hub (`/`)

The project list at `/` — six pages, two quiet links, one site. **This file
describes the simple Hub of 2026-11-21.** The advanced Hub's `docs/gateway.md`
— 1,800 lines of dated decisions about fourteen sections, stage, the derived
Design list, Release, the To Do Board, the public site and the rest — is on
the `hub-advanced` branch, verbatim: `git show hub-advanced:docs/gateway.md`.

## The page

`src/pages/UxDashboardPage.tsx`. `SECTIONS` is the rail, in order: Design
(id `demo`) · Research · PRDs · Development · Done · Archive. `DEFAULT_SECTION`
is Design, so a bare `/` opens it and `?section=` is dropped from the address.
`sectionFromParam` resolves `?section=<id>` and the legacy aliases
(`dashboard` → Design, `dev` → Development, `links` → Design); anything else
lands on Design. Two eyebrows: *Design & Research* over Design, *Dev Handoff*
over Development. The rail foot carries **Guide** (`/contributing/`) and
**Demo build** (`/dashboard-rebrand?demo=1&journey=full`), both new-tab links,
then the Appearance menu (palette and theme, per browser).

## The three boards

One component, `LinkBoardPanel` in `src/components/prototype/LinksPanel.tsx`,
three presentations — `DemoPanel` (Design), `ResearchPanel`, `PrdsPanel` —
over three stores built by `createLinkBoard` (`demoStore.ts`,
`researchStore.ts`, `prdStore.ts`) and one server module,
`netlify/lib/linkBoard.ts`, instanced by `netlify/functions/demos.ts`,
`research.ts`, `prds.ts` (`/api/demos`, `/api/research`, `/api/prds` in
`netlify.toml`). Netlify Blobs, one store each; nothing is in git.

A row is title · link · note · who added it · Updated (the server stamps
`updatedAt` on every save; the boards sort by it). Design and Research are
compact rows (`compactRows`), no type; PRDs keeps the type taxonomy
(Confluence · Figma · Document · other). Research groups by project
(`showFeature`, `featureNoun: 'Project'`); Design does not group. The pills
over Design are the roster — `DESIGNERS` in `linkStore.ts`: Jill · Anjani ·
Eric · Afsana — and Added by is a pick from it, remembered per browser.

**Archive, not hide.** Every board is `archivable`: the row's ⋯ → Archive
stamps `archivedAt` / `archivedBy` and the row leaves the board. The Archive
page mounts each panel in `archiveView` and lists its archived rows under a
heading, with Unarchive and Edit; a board with none archived draws nothing.
The board's own empty state says where the rows went. (It was "Hide" from
2026-11-01 to 2026-11-21 so that "Archive" meant only the nav section; now an
archived row IS on that section, so the one word is right.)

## Development, Done, Archive

Development and Done list `PROTOTYPE_FEATURES` rows — since 2026-11-21 that
is the dev handoffs alone, one file each in `src/data/handoffs/`, globbed by
`handoffFeatures.ts`. `sectionOf` is the rule: `done` wins, then any
`devStatus` → Development, then everything else → Development. A handoff row
opens its gateway page at `/prototype/<id>`; the row's ⋯ offers the five
statuses (a per-browser override of the file's `devStatus`), Copy link, and
Archive (`rowArchiveStore.ts`, `/api/row-archive`), which lists the row on the
Archive page above the components table.

The Archive page, top to bottom: the three boards' archived links, the
archived handoff rows, then `ARCHIVED_ITEMS` from `src/data/archivedItems.ts`
— every feature, section and routine removed from the project with how to
bring it back. `ArchiveConvention.test.ts` makes every `restoreNote` and
`location` name a place you can go.

## One site, branch deploys

`ux-design-xceldashboard.netlify.app`, behind the site password, builds
`main` and every pushed branch (`<branch-with-dashes>--…`). A branch build
is a designer's preview and the link they paste on Design. `VITE_GATEWAY_MODE
= testing` (`gatewayMode.ts`) is the separate user-test site, which hides the
Hub entirely; `VITE_DEPLOY_CONTEXT = branch-deploy` (`deployContext.ts`,
set in `netlify.toml` per context) drops the prototype bar's home icon on
branch builds. `scripts/public-redirects.mjs` writes the production build's
edge 404s (`/recaps/*`).

The Blobs stores of the deleted sections (`qa-notes`, `qa-captures`,
`links`, `todo-board`) are still on the site, unreachable; nothing reads them.

## Tests

`UxDashboard.smoke.test.tsx` pins the six-section rail in order, the landing
section, the two rail-foot links and the handoff placement. `Demo.test.tsx`,
`LinkBoard.test.tsx`, `Research.test.tsx`, `Prds.test.tsx`,
`FeatureRefinement.test.tsx` and `LinkRowThumb.test.tsx` cover the boards;
`RowArchive*.test` the handoff archive; `OneSite.test.tsx` the site shape and
the guide; `FrameworkProtection.test.ts` and `MainProtection.test.ts` the two
guards.
