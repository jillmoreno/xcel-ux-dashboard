import type { PrototypeFeature } from '../prototypeFeatures'

/**
 * ATLAS — MY COURSES, 2026-11-02, Jillienne: "there should be a my courses and
 * my certificates page that is accessible from the home page, lets refine
 * those and create handoff docs for them."
 *
 * ⚠ IT CLOSES A GAP ANOTHER HANDOFF ALREADY NAMED. The Atlas Home Quick Links
 * handoff (`xcel-atlas-home-quick-links`) lists both of its navigating rows as
 * `does: 'To be designed.'` — the page existed, it was reachable, and nothing
 * on it worked. This is the answer to the My Courses half; its sibling
 * `xcel-atlas-my-certificates` answers the other.
 *
 * ⚠ THE BASELINE ONLY. Everything here is scoped to Jill/Atlas-Main and
 * End-to-End Demo (`isE2ELikeVersion`) — the versions the Atlas Learning and
 * End-to-End rows open. Eric's WIP and White keep the page he asked for on
 * 2026-10-13, Atlas card and Quick Links rail included. `isEricAtlasWhiteLike`
 * is a SUPERSET of that predicate and reaching for it is the easy mistake;
 * `AtlasLearningPages.test.tsx` fails if anything here widens.
 *
 * ⚠ CORRECTED 2026-11-23. This file recorded the SHARED card as the decision
 * ("drawn with the shared course card under a serif title … no button on the
 * card") while `atlas-courses-card-style` has defaulted to `atlas` since
 * 2026-11-03 on Eric's branch — the page draws the Figma 706:2416 card. The
 * blurbs, the first decision and the card component below are corrected
 * inline, the old wording quoted where it stood. The same day the card was
 * taken to section 3 of the My Courses PRD (Chi Wang, 2026-11-16) on a copy,
 * `AtlasCourseCardFigmaV2`, behind `atlas-courses-card-prd-fields`.
 *
 * ⚠ THE CE PACKAGE CARD (`demo-ny-pclh-refresher-ce`) was out of scope for
 * Jan 12 — a different product shape, several courses sold as one purchase —
 * and is OFF THE PAGE since 2026-11-24 (Jillienne: "remove this version").
 * Kept as `ATLAS_CE_PACKAGE_CARD`, with an Archive row.
 *
 * REFRESHED 2026-11-25 against feat/atlas-updates-11-23 ("lets do a Dev
 * handoff page for the My Courses updates"): the description is off the card,
 * the finished cards carry no date block, the pills are half-strength and only
 * on a finished or last-week course, the card is the one action, the sheet
 * carries Home's buttons and the deadline box, Home follows the card, and the
 * phone layout draws inside the review bar's Mobile frame. The Design link is
 * on the header's Links row.
 */
const feature: PrototypeFeature = {
  id: 'xcel-atlas-my-courses',
  title: 'Atlas — My Courses',
  kind: 'guided',
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'not-ready',
  surface: 'atlas',
  owner: 'Jill',
  lastUpdated: '2026-11-25T13:17:06Z',
  accent: 'blue',
  icon: 'grid',
  brands: ['xcel'],
  links: [
    {
      url: 'https://feat-atlas-updates-11-23--ux-design-xceldashboard.netlify.app/dashboard-rebrand?demo=1&section=courses&version=jill-atlas-main',
      label: 'Design — the branch build this handoff describes',
    },
  ],
  // Corrected 2026-11-23 (it read: "drawn with the shared course card under a serif title, with no search, no filters, no
  // status tabs and no button on the card").
  // Refreshed 2026-11-25 (it read: "… carrying the fields section 3 of the My Courses PRD confirms — description, labels,
  // status, progress, one date line per status and a working button on every card, View Certificate included").
  blurb:
    'The learner’s whole course library on one page, reached from Home’s Quick Links and drawn with the Atlas card (Figma 706:2416) taken to section 3 of the My Courses PRD — the three labels, the status and progress, an access line on every live course, a working certificate link on a finished one, and the card itself opening Home with its course active.',
  // Corrected 2026-11-23 (it read: "the shared card with a serif title, no rail and no list controls").
  tileBlurb:
    'The course library on one page: the Atlas card to the My Courses PRD, each card opening Home in its course, a working certificate link when finished.',
  pages: [
    {
      label: 'My Courses — the page itself',
      note: 'The page a developer builds from: no side rail, no filter column, the cards running the full width. Thirteen enrolments, four to a row at desktop width.',
      to: '/dashboard-rebrand?demo=1&section=courses',
    },
    {
      label: 'Home — where the learner comes from',
      note: 'The Quick Links card’s "My Courses" row is the only link to this page, and it is not repeated on the page itself. See the states table.',
      to: '/dashboard-rebrand?demo=1&section=dashboard',
    },
    {
      label: 'My Courses with the side rail — the control turned on',
      note: 'What the page looks like when the Quick Links control is set to Shown: the rail on the left and the content centred at 1081px.',
      to: '/dashboard-rebrand?demo=1&section=courses&ff=atlas-pages-quick-links:shown',
    },
    {
      label: 'My Courses — the PRD card, every status at once',
      note: 'The seven design cards under the PRD card: In Progress inside its last week (the countdown pill, the amber bar) and In Progress well outside it (no pill, the blue bar), Not Started, Completed with its Certificate link, Completed with its certificate pending, Expired, and Failed. The three labels, the access line on the live courses, the status and the bar at the foot, "Details →" on every card.',
      to: '/dashboard-rebrand?demo=1&section=courses&ff=atlas-courses-card-style:atlas,atlas-courses-from-library:off,atlas-courses-card-prd-fields:on',
    },
    {
      label: 'My Courses on a phone — the design-time layout',
      note: 'The 402 × 874 breakpoint frame the review bar’s Mobile icon draws, with the page inside it: the cards in one column, each on its side, the sheet at the phone’s full width. The same layout switches on by itself when the live page’s window is 640 wide or narrower — see the decisions.',
      to: '/dashboard-rebrand?demo=1&section=courses&ff=atlas-courses-card-style:atlas,atlas-courses-from-library:off,atlas-courses-card-prd-fields:on,home-breakpoint:mobile',
    },
    {
      label: 'My Courses — the card before the PRD, for comparison',
      note: 'The card as of 2026-11-18: the facts in the Course Details sheet, no description, no date line, the disabled "Completed" button. The control turned off.',
      to: '/dashboard-rebrand?demo=1&section=courses&ff=atlas-courses-card-style:atlas,atlas-courses-from-library:off,atlas-courses-card-prd-fields:off',
    },
    {
      label: 'My Courses with the shared card — the control turned over',
      // Corrected 2026-11-23 (it read: "the earlier card — the control turned over … The card this page used to draw
      // (Figma 213:3619)"; the shared card is the other arm now, not the default).
      note: 'The LMS dashboard’s CourseCard with a serif title and no button — the arm this page drew until 2026-11-03. Kept so the two can be read side by side.',
      to: '/dashboard-rebrand?demo=1&section=courses&ff=atlas-courses-card-style:shared',
    },
  ],
  featureFlags: [
    { id: 'atlas-pages-quick-links', label: 'Quick Links on the learning pages', note: 'Hidden, which is what this page shows. Shown puts the side rail back on both learning pages and re-centres the content. Hiding it also takes away the only route to My Certificates that does not pass through Home.' },
    // Corrected 2026-11-23 (it read: "Shared is the card documented here. Atlas draws the earlier card instead").
    { id: 'atlas-courses-card-style', label: 'My Courses card', note: 'Atlas (the default since 2026-11-03) is the card documented here — Figma 706:2416 with a full-width button. Shared draws the LMS dashboard’s CourseCard instead, serif title and no button.' },
    { id: 'atlas-courses-card-title-align', label: 'My Courses card — title', note: 'A design-bar control (2026-11-24): a short title centred in its 60px box (the default and the decision, 2026-11-25) or at the top of it. Three-line titles fill the box either way.' },
    { id: 'atlas-courses-card-prd-fields', label: 'My Courses card — PRD fields', note: 'On (2026-11-23): the Atlas card to section 3 of the My Courses PRD — description, the three labels on the card, a date line per status, the failed score and expired progress, and a working View Certificate on a completed course. Off: the card as of 2026-11-18, with the disabled Completed button. Only matters when the card control is set to Atlas.' },
    { id: 'atlas-courses-from-library', label: 'My Courses list', note: 'Only does anything when the card control is set to Atlas. Off shows three fixed example courses in place of the learner’s own.' },
    { id: 'atlas-courses-open-course', label: 'My Courses buttons open the course', note: 'Whether the card opens the course. Off, the title links out of the learning shell instead, and the earlier card’s button is drawn disabled.' },
  ],
  devHandoff: {
    flagsNote:
      'Six review controls, none of them a product setting. The card control and the PRD-fields control are the two a reviewer should expect to see turned over — the first picks the card, the second is the Jan 12 work on it. One sits on the design bar for the PRD card itself: the title’s alignment, centred by decision with Top kept for comparison. (Two more were retired on 2026-11-25 once decided: the card’s actions, hidden; the sheet’s deadline box, on.) The other three exist so the page as it was can still be opened beside the page as it is.',
    // Corrected 2026-11-23 (it read: "The card is the one the rest of the product already uses, unchanged except that its
    // title is set in the heading serif. It has never carried a button and does not gain one here.").
    intro:
      'Two things to build, and one of them is mostly absence. The page is the section header over a grid of cards: no search, no filter column, no status tabs, no View Archived and no side rail, every one of them left out on purpose and every one still in the code behind a prop. The card is the Atlas card (Figma 706:2416), taken to section 3 of the My Courses PRD between 2026-11-23 and 2026-11-24: every card carries an image with a status pill on its corner when there is something to say, the title, the three labels in one ruled row, the status as text beside the percentage over a bar, an access line while the course is live, and "Details →" into a sheet that holds the course’s buttons. The card has no button of its own: clicking it opens Home with that course active, and Home’s course head reads the card’s title, cover, date and progress.',
    components: [],
    uiComponents: [
      {
        id: 'atlas-my-courses-page',
        order: 1,
        name: 'My Courses page',
        tabLabel: 'The page',
        location:
          'The Atlas shell at ?section=courses. Rendered by MyCoursesSection in src/components/layout/PlatformShell.tsx over src/pages/MyCoursesPage.tsx — the same page component /my-learning/courses uses, with its controls switched off rather than a second page.',
        summary:
          'A serif page title under a "Back to Home" link, then the cards, full width. Most of the specification is what the page leaves out: the search box, the result count, the Sort By select, six filter accordions, the five status pills and the View Archived link are all suppressed, and so is the side rail that used to stand where the filters were. The page is the learner’s whole active library in one grid. Archived courses are a separate collection with no way into it from here, so they are left out rather than mixed in.',
        variants: [
          { name: 'Default', when: 'The learner has enrolments. The grid fills the content box, wrapping at the card’s own width — four to a row at 1440.', why: 'With no side rail there is no column to reserve, so the grid takes the whole content box and the cards sit left.' },
          { name: 'Empty library', when: 'No active enrolments.', detail: '"No courses yet" over "Courses you enroll in will appear here.", with a Browse Catalog button.', why: 'Browse Catalog is the only honest way out of a page with nothing on it and no filters to clear.' },
          { name: 'Side rail shown', when: 'The Quick Links control is set to Shown.', detail: 'The rail takes a 230–260px left column and the page re-centres at 1081px — the rail, a 24px gap and three 255px cards. The section header follows the same width.' },
        ],
        ctas: [
          { name: 'Back to Home', does: 'Returns to ?section=dashboard. Drawn by the Atlas section header, not by this page.' },
          { name: 'The card title', does: 'Opens the course — see the card below.' },
          { name: 'The card’s "Details →"', does: 'Opens the card’s own Course Details sheet — see the card below. The ⋮ menu the earlier card drew is built and switched off.' },
          { name: 'Browse Catalog (empty state only)', does: 'Goes to /catalog.' },
        ],
        statesMatrix: [
          { question: 'How does a learner get from here to My Certificates?', answer: 'Back to Home, then the Quick Links row — three clicks between two pages that sit side by side. Quick Links was the one-click route and it is hidden on purpose. This was raised before the change and accepted, not missed.' },
          { question: 'What happens to archived courses?', answer: 'They are left out. Archiving is a place, not a status, and an archived card draws identically to an active one — so with no View Archived link to explain it, an archived course here would be indistinguishable from a live one.' },
          { question: 'Do the demo controls change this page?', answer: 'Yes. The page reads the same course records as /my-learning/courses, so the Course and Progress controls change what it shows. The three fixed cards it replaced ignored them entirely.' },
          { question: 'What if a learner has one course? Forty?', answer: 'The grid wraps at the card width, so both work. The page is no longer sized to a fixed number of cards — see ATLAS_MY_COURSES_COLUMNS.' },
        ],
        edgeCases: [
          'Long course titles clamp to two lines; rows stay level because every card reserves the same title height whether it wraps or not.',
          'On a phone — the review bar’s Mobile icon, which draws the 402 × 874 breakpoint frame, or the live page in a window 640 wide or narrower — the cards run in one column, each on its side: an 80px image at the left, the title beside it, the labels, access line, progress and foot full width under both; the sheet fills the phone. One breakpoint stylesheet (src/styles/home-breakpoints/mobile.css) serves both; tablet is still off.',
        ],
        designSpec: {
          tokens: [
            { role: 'Page title face', token: '--font-heading-serif' },
            { role: 'Page title size', token: '--type-atlas-h4-base-size' },
            { role: 'Page title colour', token: '--color-compass-page-heading' },
            { role: 'Card surface', token: '--color-surface-card' },
            { role: 'Card rule', token: '--color-border-subtle' },
            { role: 'Meta text', token: '--color-text-secondary' },
          ],
          responsive: [
            'The grid is repeat(auto-fill, minmax(min(100%, 220px), 1fr)) with a 16px gap — the page component’s own, not an override.',
            'With the side rail shown the page is capped at ATLAS_MY_COURSES_WIDTH (1081) and centred; without it the page takes the shell’s whole content box.',
          ],
          sources: [
            'The final prototype is the source of truth: /dashboard-rebrand?demo=1&section=courses.',
            'src/components/layout/PlatformShell.tsx (MyCoursesSection) and src/pages/MyCoursesPage.tsx.',
          ],
        },
      },
      {
        id: 'atlas-my-courses-card-prd',
        order: 2,
        name: 'Course card — the Atlas card to the PRD',
        tabLabel: 'Course card (PRD)',
        location:
          'src/components/compass/AtlasCourseCardFigmaV2.tsx, a copy of AtlasCourseCardFigma.tsx (the 2026-11-18 card, never edited). The flag atlas-courses-card-prd-fields chooses between them in MyCoursesSection, src/components/layout/PlatformShell.tsx. The data — one date line per status, the labels, the score, the certificate link — is built in src/data/atlasCourseCards.ts (dateLine, atlasCourseCardFor); the card only draws it.',
        summary:
          'Section 3 of the My Courses PRD (Chi Wang, 2026-11-16), field by field. A 120px image (a default when the course has none) with the status pill straddling its top-left corner — half on the card, half on the photo, the title in the heading serif inside a fixed 60px box — three lines of 20 at most, then an ellipsis, a shorter title centred in it; charcoal at rest and black when the card is hovered — no description (see the decisions), the status pill, then State | Category | Line of authority as one row in the shared card’s meta style — the state abbreviated ("FL"), values only, 12px, hairlines between — the status as text beside the 0–100 figure over a bar on a light grey track (aria-valuenow, min 0, max 100), one access line while the course is live, nothing under it — and, by default, no button: the card is the one action and opens Home, where the buttons are (decided 2026-11-23). "Details →" at the bottom right opens the Course Details sheet either way. Per status: Not Started: "Access Ends: mm/dd/yyyy, (N days)". In Progress: the same line. Failed: the same line. Expired: no date line — "Expired - mm/dd/yyyy" is the pill, the last progress the bar’s marker. Completed: the same access line (access ends whether or not the course is finished); the pill carries the score and the status row the completion date, and the foot carries the Certificate link, where the card before it drew a disabled "Completed". (A control that drew one full-width button per status was retired on 2026-11-25.) The days are usableDaysLeft — expiry minus one, the figure the study plan is built on — so the two never disagree. The line is drawn in the status row’s own clothes — 11px in the secondary ink, the label at 400 and the date and count at 700, like "In Progress" and "45%" over the bar — so the card has one body ink; the hairline sits under the title block rather than around the line (2026-11-24).',
        variants: [
          { name: 'Every status', when: 'Always.', detail: 'One fill for every card — a lightened Secondary 100 with a 1px Primary 100 rule inside the edge. The finished card no longer steps back to a different ground (it did on the card before this one).', why: 'Asked for with the finished card selected: one material, so status is said by the pill and the line, not by the card’s colour.' },
          { name: 'Not Started', when: 'The learner has not opened the course.', detail: 'No pill — the status row says it. "Access Ends: mm/dd/yyyy, (N days)"; the sheet offers Begin Course.' },
          { name: 'In Progress', when: 'The learner has begun.', detail: 'The same date line, the filled bar; the sheet offers Resume Course. No pill outside the last week — the status row says it and the bar is the primary blue; inside the last week (seven usable days, Home’s own amber tier) the pill appears, counting down — "Access Ends 5 days" — and the bar goes amber.' },
          { name: 'Failed', when: 'Finished, not passed.', detail: 'The Failed pill — "Failed - Score: 62%" when the platform knows the score, "Failed" when it does not — the progress bar unfilled with a charcoal marker at the progress point, "Access Ends: mm/dd/yyyy, (N days)" since the learner can still retake; the sheet offers Retake Course. No separate score line: the pill carries it. The status row reads "Failed" beside the last percentage (2026-11-25; "Progress Made" before).' },
          { name: 'Expired', when: 'Access ended before the learner finished.', detail: 'The pill reads "Expired - mm/dd/yyyy" on a light grey fill in the primary ink, where the other pills keep their tinted fills; the status row reads "Expired" beside the last percentage (2026-11-25; "Progress Made" before); the bar is unfilled with a charcoal marker where the progress reached. No access line — the pill says the date, the marker says the progress. The sheet’s deadline box carries Purchase Extension — see the decisions.', why: 'A pale pink pill read as a warning still in play; grey reads as over, and the date on it says when.' },
          { name: 'Completed', when: 'The course is finished.', detail: 'The pill reads "Completed - Score: 92%"; the status row reads "Completed - mm/dd/yyyy" over the full bar; then "Access Ends: mm/dd/yyyy, (N days)", since access ends whether or not the course is finished; at the foot, "Certificate" with the award glyph — a link to the course’s certificate, the certificates page when none is issued — or "Certificate Pending" with the hourglass, not a link, while one is still owed; the sheet offers View Certificate too.', why: 'The PRD’s "No dead ends": a disabled button on a finished course was the one dead end on the page.' },
        ],
        ctas: [
          { name: 'Begin / Resume / Retake Course', does: 'Not on the card. Decided 2026-11-23 and the Shown / Hidden control retired 2026-11-25: the card has no button; the block stays in the file behind a constant, with an Archive row. The sheet carries the course’s button, which opens the course inside the learning shell (?section=course&coursePage=course).' },
          { name: 'Review Course ›', does: 'Not on the card, for the same reason; the sheet offers Review Course on a finished course.' },
          { name: 'Purchase Extension', does: 'Not on the card. The sheet’s deadline box carries the one Purchase Extension that goes somewhere; Home’s own stays drawn, not wired — see the xcel-purchase-extension handoff.' },
          { name: 'View Certificate', does: 'Not on the card as a button; the foot’s Certificate link is the route, and the sheet offers View Certificate. The link’s target: Inside the learning shell it lands on the shell’s own Certificates & Transcripts page (?section=certificates) — MyCoursesSection re-points it, because AppLayout blocks /my-learning/* from inside the rebrand with a toast and the product route would be a dead end there. The card’s own data.certificateHref is that product route: certificatePdfUrl for the course’s issued certificate, else /my-learning/certificates. Stops propagation, so the click does not also open Home.' },
          { name: 'Certificate (award glyph)', does: 'At the bottom left of a completed card whose certificate is issued, in the text link’s style — the same place View Certificate goes: the shell’s Certificates & Transcripts page. When the certificate is not yet issued (an affidavit, a survey, a proctor’s sign-off still owed) the slot reads "Certificate Pending" with an hourglass, in the status row’s own text — not a link — and the sheet offers no View Certificate.' },
          { name: 'Details →', does: 'At the bottom right of every card. Opens the PRD card’s own Course Details sheet (AtlasCourseDetailsSheetV2): under the title, the card’s ruled labels row, then the card’s own status row and progress bar; then, on a course inside its last week or past its date, the deadline box — "Access ends in 5 days" with the triangle in amber, red with the calendar mark inside two days, "Access ended 04/20/2026" in neutral once gone; one quiet line, "Your access to this course ends 05/17/2026."; Purchase Extension inside it, outlined in the tone while access lasts and primary once it has gone, opening the XCEL storefront in a new tab — then the course buttons, the primary first: Begin / Resume / Retake / Review Course, Course Overview, View Certificate at 100% (no row at all once expired); a light rule under them, then a Description sub-header over the package paragraph, then an Outline: Step 1’s six rows exactly as Home draws them — the lesson count from the card’s own percent, the done rows ticked, the current one ringed — built from the same helpers as Home’s journey so the two agree. (The three facts as rows went on 2026-11-24; the ruled row says them once.) "Course Details ›" under the title on the card before; under the button for a day.' },
          { name: 'The card itself', does: 'Opens Home in this course’s state, everywhere but on its buttons and links — Home shows the card’s own title, cover, access date, day count and progress (2026-11-24), and the demo bar’s Progress and Expires are set to the nearest presets on the way.' },
        ],
        statesMatrix: [
          { question: 'Where does View Certificate land today?', answer: 'On Certificates & Transcripts inside the shell, for every completed course, issued certificate or not — certificatePdfUrl is stubbed to the certificates page until a document endpoint exists (its TODO(data)), and the shell re-points that page to its own. A real document URL passes straight through the re-point. Found by clicking it: the first cut linked /my-learning/certificates and the shell’s guard blocked it with a toast — the exact dead end the PRD forbids.' },
          { question: 'Why does every record have an access date now?', answer: 'The PRD has no "Enrolled" line, and most fixtures had no expiry, which is what the old third shape covered. Every XCEL record carries an expiresAt now; the story records’ dates are a year out so no badge changed.' },
          { question: 'Where is the score?', answer: 'On the pill, for a completed and a failed course alike — "Completed - Score: 92%", "Failed - Score: 62%". Section 3’s table puts it on the completed card’s date line and lists it as an extra detail on the failed card; both lines went on 2026-11-24 once the pill carried it, so the card says each thing once.' },
          { question: 'Which cards wear a pill at all?', answer: 'A finished one — Completed, Failed, Expired — and a live one inside its last week, where the pill counts down in usable days ("Access Ends 5 days"). In Progress and Not Started wear none: the status row already says it. The record’s own Due Soon badge fires at the catalogue’s sixty days, which is too early for this pill, so a course outside the week is drawn plain here.' },
          { question: 'Why mm/dd/yyyy on the card when the PRD writes "[date]"?', answer: 'To match the Home course head’s access row, which the card opens onto: "Course Access Ends: 06/10/2026, 29 days to complete". One deadline, said one way, in the milestone format every Completed: and Expired: line in the product already uses.' },
        ],
        edgeCases: [
          'A completed record with no score wears a plain "Completed" pill; one with no completion date reads "Completed" alone on the status row. A failed record with no score wears "Failed"; an expired one with no date, "Expired". Nothing is invented.',
          'A record with no expiresAt would draw no access line at all — none in XCEL does, by design, since 2026-11-23.',
          'The title clamps to three lines of 20 inside its 60px box; a shorter title is centred in it (or at the top, with the title control turned over) and the box keeps its height, so the rules under the titles stay level across a row.',
          'The ⋮ menu (Go to Course Home, Download Certificate) is built and switched off in the card; a developer will find it in the file and should not draw it.',
          'Every link and button on the card stops its click, so only a click on the card’s ground opens Home; Enter and Space on the focused card do the same.',
        ],
        designSpec: {
          tokens: [
            { role: 'Card fill, every status', token: 'color-mix(--color-secondary-100 50%, --color-neutral-50) — a lighter Secondary 100 (2026-11-23)' },
            { role: 'Card edge', token: '--color-primary-100, a 1px rule inside the edge' },
            { role: 'Title face', token: '--font-heading-serif' },
            { role: 'Title ink', token: '--color-neutral-800 at rest · --color-text-primary on the card’s hover' },
            { role: 'Card hover', token: 'a 1px ring of --color-primary-500 at 40% (color-mix over --color-neutral-50) in place of the Primary 100 edge, the lift, and every line of text to --color-text-primary; the links keep their blue' },
            { role: 'Labels, access line, status row', token: '--font-body · 11px over 18 · --color-text-secondary; the date and the day count at 700, the rest at 400' },
            { role: 'Label rules', token: '--color-border-subtle, 1 × 12 — the shared card’s MetaRule' },
            { role: 'Progress track', token: '--color-neutral-200, 5px tall' },
            { role: 'Progress fill', token: '--color-primary-500 on a live course; the last week’s amber (the Due Soon pill’s strong fill); no fill on an expired or failed course — a 2px --color-neutral-800 marker at the progress point' },
            { role: 'Pills on this card', token: 'the catalog fill mixed 50% with --color-neutral-50 (Due Soon, Completed, Failed); Expired on --color-neutral-100 in --color-text-primary' },
            { role: 'Button', token: '--color-primary-500' },
          ],
          responsive: [
            'Each card is its own column (since 2026-11-23; a subgrid before), 24px of padding and 8px between blocks: the 120px image, the title in its 60px box with the hairline under it, the ruled labels, the access line, the actions when shown, the progress pinned low, and "Details →" at the bottom right. Cards in a row share a height, so the progress bars sit level across the row while the rows above them do not.',
            'On the phone frame (402 wide) the page is 16px in at the sides and the cards run in one column 12px apart, each 16px of padding and 24px over the pill, on its side: an 80px square image at the left, the title beside it at 16 over 20 (18 on the desktop) over the same 80px with no box height, a 16px column gap, then the labels under a hairline, the access line, the progress and the foot full width under both, 4px between rows and the blocks’ own padding trimmed. The sheet takes the phone’s full width.',
          ],
          sources: [
            'The My Courses PRD, section 3 (Chi Wang, 2026-11-16).',
            'src/components/compass/AtlasCourseCardFigmaV2.tsx and src/data/atlasCourseCards.ts.',
            '/dashboard-rebrand?demo=1&section=courses&ff=atlas-courses-card-style:atlas,atlas-courses-from-library:off — every status at once.',
          ],
        },
      },
      {
        id: 'atlas-my-courses-card',
        order: 3,
        // Corrected 2026-11-23 (it read: "Course card — the shared card, serif title", as the page's card; it is the OTHER
        // arm of atlas-courses-card-style now).
        name: 'Course card — the shared card, the other choice',
        tabLabel: 'Shared card',
        location:
          'src/components/courses/CourseCard.tsx, the compact variant. The same component the catalog and /my-learning/courses render — not a copy of it.',
        summary:
          'An image header, the title in the heading serif, a delivery line (Online, Video, Classroom) over credit, hours and state, then a footer holding the status word, the progress percentage and a progress bar, with the kebab beneath. Status and expiry badges sit over the image: "14 Days to Complete", "Failed", "Jump Back In". There is no button on this card, and that is the decision — this card has never carried one, and picking it over the earlier card did not bring that card’s full-width Resume or Begin button with it.',
        variants: [
          { name: 'Not started', when: 'The learner has not opened the course. "Not Started" and 0%.' },
          { name: 'In progress', when: 'The learner has begun. The percentage and the filled bar, plus the Jump Back In marker on the course the page treats as current.' },
          { name: 'Completed', when: 'The course is finished. The completion marker, and a certificate link once one has been issued, which opens the Certificate Details panel described on the My Certificates handoff.' },
          { name: 'Failed', when: 'The learner did not pass. The Failed badge in the error tone over the image.' },
          { name: 'Expiring or expired', when: 'The course has an access deadline inside its warning window: "n Days to Complete", then "Expired" past it. Most courses have no deadline and no badge.' },
          { name: 'Serif title', when: 'On this page only. 16px rather than 14, in the heading serif.', why: 'The page title is serif, and a sans card title under it read as a different product. It is the one thing this card takes from the page it sits on.' },
        ],
        ctas: [
          { name: 'The title', does: 'Opens the course inside the learning shell (?section=course&coursePage=course). On other surfaces the same title is a link to /courses/:id; here it is re-pointed, because that route leaves the shell and takes the header and the way back with it.' },
          { name: 'The kebab', does: 'Opens the page’s Course Details panel for that course.' },
          { name: 'Jump Back In', does: 'The marker on the current course. Drawn by the card, wired by the page.' },
          { name: 'The certificate marker, on a completed course', does: 'Opens the Certificate Details panel. See the My Certificates handoff.' },
        ],
        statesMatrix: [
          { question: 'Why is there no Resume or Begin Course button?', answer: 'It was asked for directly: no call to action on the card. This card has never carried one — the title is what the learner clicks — and the button belongs to the card this page replaced.' },
          { question: 'Where does the title actually land?', answer: 'On the single course page the prototype has, whichever card was clicked. The link carries no course id, and the course page would ignore one today. Logged below as open.' },
          { question: 'Why does the serif title draw bold when the code asks for 400?', answer: 'The font skin sets font-weight: 700 with an important flag on every inline serif, in tokens.css. Three components ask for lighter weights and all three draw at 700. The code now says 700 so nobody tries to fix a weight that never applied.' },
        ],
        edgeCases: [
          'A course with no image of its own falls back to getCourseImage(id); the records assign a unique image per brand, so no two cards in one library repeat.',
          'The title clamps to two lines and reserves that height whether it wraps or not, so rows stay level.',
        ],
        designSpec: {
          tokens: [
            { role: 'Title face, on this page', token: '--font-heading-serif' },
            { role: 'Title face, everywhere else', token: '--font-body' },
            { role: 'Card surface', token: '--color-surface-card' },
            { role: 'Progress fill', token: '--color-status-completed' },
            { role: 'Expiry badge', token: '--color-warning-100' },
            { role: 'Failed badge', token: '--color-status-error-text' },
          ],
          responsive: ['The card is fluid inside its grid cell, shrinking to fill rather than holding its 265px minimum.'],
          sources: [
            'src/components/courses/CourseCard.tsx — CompactCourseCard and TITLE_FACE.',
            'The serif title is only visible at /dashboard-rebrand?demo=1&section=courses.',
          ],
        },
      },
    ],
    decisions: {
      items: [
        {
          question: 'Which card does the Atlas My Courses page draw?',
          // Corrected 2026-11-23. It read: "The card the rest of the product already uses, with its title in the serif face
          // and no call to action. The earlier card (Figma 213:3619) stays in the code behind the My Courses card control."
          decision:
            'The Atlas card — Figma 706:2416 since 2026-11-12, the default of the My Courses card control since 2026-11-03 on the Atlas Primary build. The shared card, serif title and no call to action, stays in the code as the control’s other choice. (Corrected 2026-11-23; this row recorded the shared card as the decision for three weeks after the default changed.)',
          status: 'Decided',
        },
        {
          question: 'What does the Completed card’s button do?',
          decision:
            'It works: "View Certificate", a link to the course’s certificate, or to the certificates page when none is issued. Section 3 of the My Courses PRD (Chi Wang, 2026-11-16) names the button, and its "No dead ends" rules out the disabled "Completed" the card drew before. Inside the learning shell the link is re-pointed to the shell’s own Certificates & Transcripts page, because the shell blocks the product route with a toast — the same re-point the title link already gets. Behind atlas-courses-card-prd-fields on a copy of the card; the original is untouched. 2026-11-23.',
          status: 'Decided',
        },
        {
          question: 'Which fields does every card carry?',
          decision:
            'The PRD’s section 3, as written — but for the description, see the next row: image, title, state, category and line of authority, the status as text, the progress as a number and a bar, one date line per status, and one button. The labels came back onto the card from the Course Details sheet; the sheet keeps them. 2026-11-23.',
          status: 'Decided',
        },
        {
          question: 'Does the card show the course’s description?',
          decision:
            'No. Section 3 of the PRD asks for one on every card ("Description coming soon" without one), and the card drew it for a day under the title with a design-bar control. Decided hidden on 2026-11-24 and the control retired — a deviation from the PRD, logged here. The records keep their description text; the Course Details sheet is where a longer read belongs.',
          status: 'Decided',
        },
        {
          question: 'Is the CE package card in the Jan 12 scope?',
          decision:
            'No. A CE package is several courses sold as one purchase, a product shape the PRD’s course-card section does not describe. On 2026-11-23 demo-ny-pclh-refresher-ce was left exactly as it was — not restyled, not removed — and the Failed row of the PRD’s table was given its own card, a failed practice exam. On 2026-11-24 the package card came off the page altogether; its data is kept (ATLAS_CE_PACKAGE_CARD) with an Archive row, so a CE-package card is a separate piece of work when it comes.',
          status: 'Decided',
        },
        {
          question: 'How are the three labels drawn — one ruled row, stacked under an icon, or one labelled line each?',
          decision:
            'The ruled row, with the state abbreviated — "FL | Licensing | Life and Health" — so the line rarely wraps. Decided 2026-11-23 against the other two; their control was retired on 2026-11-24 and they are an Archive row. The sheet keeps the full state name.',
          status: 'Decided',
        },
        {
          question: 'Does the card carry its own button and links, or is the card the one action?',
          decision:
            'The card is the one action. Decided 2026-11-23: no button and no links on the card; a click anywhere opens Home with the course active, where Begin, Resume, Purchase Extension and View Certificate already are. The scan counted four ways to act on one card; this makes it one. The control that drew the card with its own button and links was retired on 2026-11-25 once the decision held; the block stays in the file behind a constant, with an Archive row.',
          status: 'Decided',
        },
        {
          question: 'Does the phone layout ship, or stay a design-time breakpoint?',
          decision:
            'It switches on by itself now (2026-11-25). The review bar’s Mobile icon still draws the 402 × 874 frame, and the live page takes the same layout whenever its window is 640 wide or narrower — the one phone stylesheet, keyed on a data attribute the shell sets either way, so the frame and a real narrow window cannot drift. Home came along the same day (its head and progress panel as flat bands, the cover beside the title, an Edit link to this page), which is what made a shipped breakpoint honest; the day before it was design-time only, because one phone page inside a desktop shell is a half-built phone. 640 is the ceiling because the layout was drawn at 402 and still reads as one column up to there; there is no tablet layout between it and the desktop.',
          status: 'Decided',
        },
        {
          question: 'How does the sheet present a deadline and the extension?',
          decision:
            'In a message box of its own above the course buttons (2026-11-24). Home’s tiers exactly — amber inside seven usable days, red inside two, neutral once access has ended — the quiet copy (the deadline alone, until product writes a line), and Purchase Extension in the box only, not in the button row — always, since the box’s On / Off control was retired on 2026-11-25. The button opens the XCEL storefront in a new tab — an extension is bought there, not in the LMS (Jillienne, the same day: "it goes to ecomm site"). The storefront’s root for now; which page sells an extension is the xcel-purchase-extension handoff’s open question. Home’s and the card’s own Purchase Extension stay drawn and unwired.',
          status: 'Decided',
        },
        {
          question: 'Does the status text read "Failed" and "Expired", or "Progress Made"?',
          decision:
            '"Failed" and "Expired" (2026-11-25), as the PRD asks. The pill on the same card already says "Failed - Score: 62%" or "Expired - 04/20/2026", so a status row reading "Progress Made" beside it was a second label for one state that disagreed with the first. The case for "Progress Made" was that the bar shows how far the learner got; the marker on the unfilled track makes that point now, and the percentage beside the status still does. The card read "Progress Made" for both from 2026-11-12 to 2026-11-25; the sheet inherits the row.',
          status: 'Decided',
        },
        {
          question: 'Does the page keep the Quick Links rail?',
          decision:
            'No. It is hidden, so the cards run the full width of the page. The rail is kept in the code behind a control rather than removed.',
          status: 'Decided',
        },
        {
          question: 'Do the hidden list controls come back with the LMS card?',
          decision:
            'No. Search, the status pills, the result count, the filter column and View Archived all stay hidden. The filter column had to be hidden explicitly: it was only ever absent because the side rail stood in its place, so removing the rail brought six filter accordions back onto a page with no other control on it.',
          status: 'Decided',
        },
        {
          question: 'Does the page show the learner’s real courses?',
          decision:
            'Yes. It reads the same records as /my-learning/courses, so the demo controls change it and the list is as long as the library. Archived courses are left out — see the states table.',
          status: 'Decided',
        },
        {
          question: 'What does the card open?',
          decision:
            'The course inside the learning shell, rather than /courses/:id, which would leave it. Every card lands on the same course page today.',
          status: 'Decided',
        },
        {
          question: 'Where does the card land when the learner has more than one course?',
          decision:
            'Open. The link carries no course id and the course page would ignore one, because the prototype has a single real course behind it. Every card opening the same page is honest in a prototype and wrong in a build.',
          status: 'Needs weigh-in',
          owner: 'Engineering, with Design',
        },
        {
          question: 'How does a learner move between My Courses and My Certificates?',
          decision:
            'Not an issue (2026-11-25). There are three ways to the certificates: Home’s own My Certificates link, the Certificate link at the foot of a finished card on this page (and View Certificate in its sheet), and the header’s menu on the phone. A direct link between the two pages would be a fourth; none is needed. Quick Links was the one-click route before the rail came off and is now one of the three.',
          status: 'Decided',
        },
        {
          question: 'What does this page look like on a tablet?',
          decision:
            'Open. The phone has a design-time layout now (the row above); the tablet does not — the review bar’s tablet button is still disabled, and the learning shell has no layout between the phone frame and the desktop.',
          status: 'Needs weigh-in',
          owner: 'Design',
        },
        {
          question: 'Which cards wear a status pill, and in what strength?',
          decision:
            'Only a card with something to say beyond its status row: Completed, Failed and Expired, and a live course inside its last seven usable days, where the pill counts down. In Progress and Not Started wear none. The tinted pills are mixed half with the card’s ground so the row reads calmer; Expired is light grey with the primary ink and carries its date, so the end of access reads as over rather than as a live warning. 2026-11-24.',
          status: 'Decided',
        },
        {
          question: 'Does a short title sit at the top of its box or centred in it?',
          decision:
            'Centred (2026-11-25). Every title gets the same 60px box so the rules under them stay level; a one-line title then has slack, and splitting it above and below keeps the title on the image’s centre line rather than hugging the photo. Top was the default for a day; the design bar’s title control still draws it for comparison.',
          status: 'Decided',
        },
      ],
      openItems: [
        'Replace the certificatePdfUrl stub with the real certificate document, so View Certificate opens the course’s own certificate rather than the page (2026-11-23).',
        'Carry the course id into the course page, so a card opens the course it names.',
        'Lay out the tablet, which is still off — between the phone’s 640 ceiling and the desktop the page is the desktop page (2026-11-25).',
        'Confirm that archived courses are meant to be unreachable from this page, rather than simply left out.',
      ],
    },
    designerNotes: [],
  },
}

export default feature
