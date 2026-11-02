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
  lastUpdated: '2026-11-02T18:00:00Z',
  accent: 'blue',
  icon: 'grid',
  brands: ['xcel'],
  blurb:
    'The learner’s whole course library on one page, reached from Home’s Quick Links and drawn with the shared course card under a serif title, with no search, no filters, no status tabs and no button on the card.',
  tileBlurb:
    'The course library on one page: the shared card with a serif title, no rail and no list controls. The page Home’s Quick Links has always pointed at.',
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
      label: 'My Courses with the earlier card — the control turned over',
      note: 'The card this page used to draw (Figma 213:3619), with an "Available until" line and a full-width button. Kept so the two can be read side by side.',
      to: '/dashboard-rebrand?demo=1&section=courses&ff=atlas-courses-card-style:atlas',
    },
  ],
  featureFlags: [
    { id: 'atlas-pages-quick-links', label: 'Quick Links on the learning pages', note: 'Hidden, which is what this page shows. Shown puts the side rail back on both learning pages and re-centres the content. Hiding it also takes away the only route to My Certificates that does not pass through Home.' },
    { id: 'atlas-courses-card-style', label: 'My Courses card', note: 'Shared is the card documented here. Atlas draws the earlier card instead, with a date line and a full-width button.' },
    { id: 'atlas-courses-from-library', label: 'My Courses list', note: 'Only does anything when the card control is set to Atlas. Off shows three fixed example courses in place of the learner’s own.' },
    { id: 'atlas-courses-open-course', label: 'My Courses buttons open the course', note: 'Whether the card opens the course. Off, the title links out of the learning shell instead, and the earlier card’s button is drawn disabled.' },
  ],
  devHandoff: {
    flagsNote:
      'Four review controls, none of them a product setting. Only the first two are decisions a reviewer should expect to see turned over; the other two exist so the page as it was — three example cards, no working buttons — can still be opened beside the page as it is.',
    intro:
      'Two things to build, and one of them is mostly absence. The page is the section header over a grid of cards: no search, no filter column, no status tabs, no View Archived and no side rail, every one of them left out on purpose and every one still in the code behind a prop. The card is the one the rest of the product already uses, unchanged except that its title is set in the heading serif. It has never carried a button and does not gain one here.',
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
          { name: 'The card ⋮', does: 'Opens the Course Details panel MyCoursesPage already owns.' },
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
          'Below about 700px the page is untested — the learning shell has no narrow layout yet, and the tablet and mobile buttons in the review bar are disabled.',
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
        id: 'atlas-my-courses-card',
        order: 2,
        name: 'Course card — the shared card, serif title',
        tabLabel: 'Course card',
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
          decision:
            'The card the rest of the product already uses, with its title in the serif face and no call to action. The earlier card (Figma 213:3619) stays in the code behind the My Courses card control.',
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
            'Open. Quick Links was the one-click route and it is now hidden, so the trip is Back to Home, then the Quick Links row. Accepted knowingly, but whether these two pages deserve a direct link of their own is not settled.',
          status: 'Needs weigh-in',
          owner: 'Design',
        },
        {
          question: 'What does this page look like below 700px?',
          decision:
            'Open. The learning shell has no narrow layout — the review bar’s tablet and mobile buttons are disabled — so this page has never been laid out for a small screen.',
          status: 'Needs weigh-in',
          owner: 'Design',
        },
      ],
      openItems: [
        'Carry the course id into the course page, so a card opens the course it names.',
        'Decide whether My Courses and My Certificates need a direct link, now that the side rail is off both pages.',
        'Lay the page out below 700px, with the rest of the learning shell.',
        'Confirm that archived courses are meant to be unreachable from this page, rather than simply left out.',
      ],
    },
    designerNotes: [],
  },
}

export default feature
