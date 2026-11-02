import type { PrototypeFeature } from '../prototypeFeatures'

/**
 * ATLAS — MY CERTIFICATES, 2026-11-02, the sibling of `xcel-atlas-my-courses`
 * and the other half of Jillienne's ask that day.
 *
 * ⚠ THE PAGE HAD NO DOOR, and that is the finding this handoff exists for.
 * Both certificate cards gate `clickable` on `status === 'action-required'`,
 * and the Atlas page hides the status tabs — so the Action Required tab was
 * unreachable, no card opened anything, and the ⋮ called `console.info`. A
 * certificates page you could not open a certificate from.
 *
 * ⚠ AND THE PANEL BEHIND IT COULD NOT HAVE DRAWN ONE ANYWAY.
 * `CertificateActionPanel` keys its whole body off
 * `CERT_ACTION_META[data.action]`, which only an action-required record has.
 * An ISSUED certificate opened an empty sheet under an "Action Required"
 * banner — including from the shared `CourseCard`'s completed-course marker on
 * every other surface in the product, where that path was already live. The
 * panel grew an issued arm and a not-yet-earned arm; the action-required arm
 * is untouched.
 *
 * ⚠ THE BASELINE ONLY — Jill/Atlas-Main and End-to-End Demo. Eric's WIP and
 * White keep the page he asked for on 2026-10-13.
 */
const feature: PrototypeFeature = {
  id: 'xcel-atlas-my-certificates',
  title: 'Atlas — My Certificates',
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
    'The learner’s certificates inside the Atlas shell — reached from Home’s Quick Links, drawn with the Atlas certificate card, every one of them opening a Certificate Details slide-over that now covers issued and not-yet-earned certificates as well as the action-required ones it was written for.',
  tileBlurb:
    'Certificates in the Atlas shell. Every card opens its detail — the panel now covers issued and not-yet-earned certificates, fixing an empty sheet across the product.',
  pages: [
    {
      label: 'My Certificates — the page as it ships',
      note: 'The page a developer builds from: no side rail, no search, no filters, no status tabs. Five certificates, three to a row, every one of them openable.',
      to: '/dashboard-rebrand?demo=1&section=certificates',
    },
    {
      label: 'Home — where it is reached from',
      note: 'The Quick Links card’s "My Certificates" row is the only link to this page.',
      to: '/dashboard-rebrand?demo=1&section=dashboard',
    },
    {
      label: 'Inert cards — the page before this work',
      note: 'The flag off: the cards are drawn exactly the same and nothing opens. This is what a reviewer saw until 2026-11-02.',
      to: '/dashboard-rebrand?demo=1&section=certificates&ff=atlas-certificates-open-detail:off',
    },
    {
      label: 'The tabbed page — the panel’s other host',
      note: 'The other page this panel opens from, outside the learning shell: the filter column, the three status tabs and the shared certificate card. Its Action Required tab is the one case the panel could always draw.',
      to: '/my-learning/certificates',
    },
  ],
  featureFlags: [
    { id: 'atlas-certificates-open-detail', label: 'Certificates open their detail', note: 'Whether the card and its kebab open the slide-over. Off restores the page with nothing clickable on it. It does not decide what the panel can draw: the issued and not-yet-earned states are always built, because the shared course card was already reaching them.' },
    { id: 'atlas-pages-quick-links', label: 'Quick Links on the learning pages', note: 'Shared with My Courses. Hidden, which is what this page shows; Shown puts the side rail back and re-centres the content.' },
  ],
  devHandoff: {
    flagsNote:
      'One control matters here, and it decides whether the card opens rather than what the panel can draw. The issued and not-yet-earned states are always built, because the shared course card’s completed-course marker was already opening this panel on other surfaces and getting an empty sheet.',
    intro:
      'Three things: a page that is a grid and a title, a card that is drawn once and read three ways, and the slide-over behind it, which is where most of the work went. The panel covered one case and needed three; the card had no click and needed one; the page had a title that disagreed with the only link pointing at it.',
    components: [],
    uiComponents: [
      {
        id: 'atlas-my-certificates-page',
        order: 1,
        name: 'My Certificates page',
        tabLabel: 'The page',
        location:
          'The Atlas shell at ?section=certificates. Rendered by CertificatesSection in src/components/layout/PlatformShell.tsx over src/pages/CertificatesPage.tsx — the same page component /my-learning/certificates uses, with its controls switched off.',
        summary:
          'A serif "My Certificates" under a "Back to Home" crumb, then the cards, full width, three to a row. The search box, the result count, the Sort By select, six filter accordions, the three status tabs and Add External Certificate are all suppressed, and so is the Quick Links rail. Because the tabs are hidden the page shows ONE collection — the issued certificates — which is also why the card had to become clickable: Action Required was the only openable status and its tab is not on the page.',
        variants: [
          { name: 'Default', when: 'The learner has certificates. Three to a row at 1440, wrapping at the card’s 340px minimum, rows equal-height.' },
          { name: 'Empty', when: 'Nothing to show.', detail: '"No certificates yet" over "Certificates appear here as you complete your courses."', why: 'The shared copy said "try clearing a filter, or check another tab" — both of which name controls this page hides. Two descriptions now, picked by hideListControls.' },
          { name: 'Side rail shown', when: 'The Quick Links control is set to Shown. The rail takes a 234px column and the page re-centres at 1081px.' },
        ],
        ctas: [
          { name: 'Back to Home', does: 'Returns to ?section=dashboard. Drawn by the Atlas section header.' },
          { name: 'The card', does: 'Opens the Certificate Details slide-over.' },
          { name: 'The card ⋮', does: 'Opens the same slide-over — see the card below.' },
        ],
        statesMatrix: [
          { question: 'Why is the heading "My Certificates" when the section is called Certificates everywhere else?', answer: 'The only link that reaches this page — the Quick Links row — says "My Certificates", and My Courses beside it already carries the possessive. The override is the Atlas page header only: SECTION_TITLES also labels the left rail, the section tabs and the breadcrumb on Testing, Testing 2/3 and Hybrid, so renaming it there would rename their nav too.' },
          { question: 'Where are the Action Required and External Certificates tabs?', answer: 'Hidden with the rest of the list controls. Action Required is the status the panel was originally written for, so hiding its tab is what made the card’s click necessary rather than optional.' },
          { question: 'Can a learner add an external certificate here?', answer: 'No. Add External Certificate lives on the External tab, which is hidden. It is kept in the code, not removed.' },
        ],
        edgeCases: [
          'Titles wrap to two lines; gridAutoRows: 1fr keeps every card in a row the same height.',
          'Below ~700px untested, with the rest of the Atlas shell.',
        ],
        designSpec: {
          tokens: [
            { role: 'Page heading face', token: '--font-heading-serif' },
            { role: 'Page heading colour', token: '--color-compass-page-heading' },
            { role: 'Card surface', token: '--color-fixed-light' },
            { role: 'Status bar', token: '--color-atlas-tan-300' },
          ],
          responsive: ['repeat(auto-fill, minmax(340px, 1fr)) with a 20px gap and equal-height rows — CertificatesPage’s own grid.'],
          sources: [
            'The final prototype is the source of truth: /dashboard-rebrand?demo=1&section=certificates.',
            'src/components/layout/PlatformShell.tsx (CertificatesSection) and src/pages/CertificatesPage.tsx.',
          ],
        },
      },
      {
        id: 'atlas-certificate-card',
        order: 2,
        name: 'Atlas certificate card',
        tabLabel: 'The card',
        location:
          'src/components/certificates/AtlasCertificateCard.tsx — Figma "Atlas UX Design" 375:1250. A sibling of the shared CertificateCard, not a variant of it; it imports that card’s ReportingStatus so the two can never disagree.',
        summary:
          'A rounded status bar across the top carrying a "Certificate" pill and the status word, with the ⋮ beside it; the title in the serif; then state | hours | requirement, "Certificate Issued: date" and "Reporting Status: value". The whole card is the button.',
        variants: [
          { name: 'Completed', when: 'An issued certificate — the page’s common case. All three detail lines draw.' },
          { name: 'In progress', when: 'The host names the id in inProgressIds (the Life & Health certificate, whose course is still under way). The bar reads In-Progress, and the issued and reporting lines are hidden.', why: 'Nothing has been issued, so printing an issue date would be a claim the product cannot support.' },
          { name: 'Action required', when: 'status is action-required. The status word changes; this is the only variant the page could open before 2026-11-02, and its tab is hidden.' },
          { name: 'External', when: 'A certificate the learner uploaded. Reachable only on the tabbed page.' },
        ],
        ctas: [
          { name: 'The card', does: 'Opens the Certificate Details slide-over, for any status, when openAnyStatus is set. Keyboard: Enter and Space, with role="button" and an aria-label naming the certificate.' },
          { name: 'The ⋮', does: 'Opens the same slide-over. It was a dead control — rendered, labelled for screen readers, wired to console.info — and with no menu designed yet the honest destination is the detail, where View Certificate and Go to Course already live. A real menu is open below.' },
        ],
        statesMatrix: [
          { question: 'Why does the ⋮ do the same thing as the card?', answer: 'Because the alternative was leaving it dead. It is explicitly a placeholder for a Download / Print / Report menu, not a considered equivalence.' },
          { question: 'Does the shared CertificateCard become clickable too?', answer: 'No. It keeps the action-required rule, which is still right for the tabbed page where Action Required is one click away. Only the Atlas card takes openAnyStatus.' },
          { question: 'How does the card know a certificate is "in progress"?', answer: 'It is told. The record is still status: completed in the fixtures — in-progress is a presentational decision the host makes from inProgressIds — so neither the card nor the panel can read it off the data.' },
        ],
        edgeCases: ['The ⋮ stops propagation, so it never also fires the card’s own click.'],
        designSpec: {
          tokens: [
            { role: 'Card surface', token: '--color-fixed-light' },
            { role: 'Status bar fill', token: '--color-atlas-tan-300' },
            { role: 'Certificate pill fill', token: '--color-primary-100' },
            { role: 'Certificate pill rule', token: '--color-primary-200' },
            { role: 'Kebab circle', token: '--color-atlas-tan-200' },
            { role: 'Title face', token: '--font-heading-serif' },
          ],
          responsive: ['Fixed 24px padding and a 16px radius; the card fills its grid cell.'],
          sources: ['src/components/certificates/AtlasCertificateCard.tsx; Figma 375:1250, 375:1311, 379:1368–1374, 411:1382.'],
        },
      },
      {
        id: 'atlas-certificate-detail-panel',
        order: 3,
        name: 'Certificate Details panel — three states',
        tabLabel: 'The panel',
        location:
          'src/components/certificates/CertificateActionPanel.tsx. Opened from this page, from the tabbed Certificates page, from the Course Details sheet, and from the shared CourseCard’s completed-course marker on every surface that renders it.',
        summary:
          'One slide-over, 544 wide, titled "Certificate Details": a Back link, a banner, the certificate’s identity and facts, and a "What would you like to do?" row of action tiles. It covered one case — action required — and an issued certificate opened it empty, under a warning banner, with no facts and no actions. That was already reachable in the product before this page existed.',
        variants: [
          { name: 'Action required', when: 'The record carries an action (Survey / Affidavit / Proctored Exam / Document / Payment). The warning banner with the per-action reason, Enrolled and Course Completed, the "Certificate Pending" line and the Affidavit explanation block.', detail: 'UNCHANGED. Every line it drew before, it still draws.' },
          { name: 'Issued', when: 'No action, and the host has not called it in progress. A success banner reading "Certificate Issued" over state · hours · requirement; Enrolled and Certificate Issued; the Reporting Status line through the card’s own ReportingStatus component; View Certificate and Go to Course.', why: 'The common case, and the one the panel could not draw at all.' },
          { name: 'Not yet earned', when: 'The host passes inProgress. An info banner reading "Not Yet Earned" over "This certificate is issued when you finish the course."; Enrolled only; no reporting line; Continue Course, and no View Certificate.', why: 'There is no document to offer and nothing has been reported.' },
        ],
        ctas: [
          { name: 'View Certificate (issued only)', does: 'Opens certificatePdfUrl(cert). ⚠ That helper returns the My Certificates LIST, not a document — a known placeholder the Atlas Home course-head handoff already records on its own View Certificate. Going through the helper keeps every door in the product on one placeholder to replace.' },
          { name: 'Go to Course / Continue Course', does: 'console.info today. The label changes on the not-yet-earned state, where continuing is the actual next step.' },
          { name: 'Back, and the sheet’s own close', does: 'Closes the slide-over.' },
        ],
        statesMatrix: [
          { question: 'Why is the issued date labelled "Certificate Issued" when the panel’s other states say "Course Completed"?', answer: 'Because the card above it says "Certificate Issued" from the same field. Certificate has no separate issued date — completedDate is both — so printing it under two different names in one flow would read as a bug. The conflation is real and is logged below.' },
          { question: 'Is the new behaviour behind the Atlas flag?', answer: 'No, deliberately. The shared CourseCard was already opening this panel for issued certificates and getting an empty sheet; gating the fix would leave that broken everywhere else.' },
          { question: 'Why does the panel need telling that a certificate is in progress?', answer: 'The record does not carry it — see the card. If it ever becomes a real record state, the inProgress prop is what collapses into it.' },
        ],
        edgeCases: [
          'A record with an action the meta table does not know falls to the issued state; no fixture does this today.',
          'rosterReported, when present, draws on the action-required and issued states and never on the not-yet-earned one.',
        ],
        designSpec: {
          tokens: [
            { role: 'Action-required banner', token: '--color-warning-100' },
            { role: 'Issued banner', token: '--color-success-100' },
            { role: 'Issued banner ink', token: '--color-success-800' },
            { role: 'Not-yet-earned banner', token: '--color-info-100' },
            { role: 'Not-yet-earned banner ink', token: '--color-info-800' },
            { role: 'Action tile glyphs', token: '--color-tertiary-600' },
          ],
          responsive: ['A 544px sheet; the body scrolls. The action tiles wrap when two do not fit.'],
          sources: [
            'src/components/certificates/CertificateActionPanel.tsx.',
            'Banner ink sits on the -700/-800 steps for the same reason --color-status-success-text is pinned to -600: the -500 of either ramp fails AA on its own 100 tint.',
          ],
        },
      },
    ],
    decisions: {
      items: [
        {
          question: 'How does a learner open a certificate?',
          decision:
            'The whole card, for any status, plus the ⋮ as a second route to the same place. The shared CertificateCard keeps its action-required-only rule on the tabbed page.',
          status: 'Decided',
        },
        {
          question: 'What does the detail panel show for a certificate that is not action-required?',
          decision:
            'Two new states — issued and not yet earned — in the existing panel rather than a second component. The action-required state is unchanged, and the two new ones are always built rather than put behind the control, because the shared course card was already reaching them and getting an empty sheet.',
          status: 'Decided',
        },
        {
          question: 'Is the page heading "Certificates" or "My Certificates"?',
          decision:
            'My Certificates, on the Atlas page header only. It matches the Quick Links row that reaches it and My Courses beside it; SECTION_TITLES is left alone so no other version’s nav is renamed.',
          status: 'Decided',
        },
        {
          question: 'What does the ⋮ offer?',
          decision:
            'Open. It opens the detail today because leaving it dead was not acceptable and no menu has been designed. The expected menu is Download PDF · Print · Report to State, which would make the card and the ⋮ meaningfully different.',
          status: 'Needs weigh-in',
          owner: 'Design',
        },
        {
          question: 'What does View Certificate actually open?',
          decision:
            'Open, and it is the one the learner cares most about. certificatePdfUrl returns the certificates list, not a document; the real artefact is most likely a PDF through a viewer rather than an in-app page. One placeholder, product-wide, to replace.',
          status: 'Needs weigh-in',
          owner: 'Engineering',
        },
        {
          question: 'Does a certificate have its own issued date?',
          decision:
            'Open, and today the answer is no — Certificate.completedDate is printed as both "Course Completed" and "Certificate Issued" depending on the surface. Issuing usually lags completion, so these are probably two fields.',
          status: 'Needs weigh-in',
          owner: 'Engineering, with Product',
        },
        {
          question: 'Is "not yet earned" a record state or a presentation choice?',
          decision:
            'Open. It is presentation today: the record says completed and the host names the id in inProgressIds. A real learner’s certificate list would have to derive this from the course’s own progress.',
          status: 'Needs weigh-in',
          owner: 'Engineering',
        },
      ],
      openItems: [
        'Design the ⋮ menu, or decide the card’s click is the whole affordance and drop the ⋮.',
        'Point View Certificate at a real document.',
        'Decide whether a certificate carries its own issued date, separate from course completion.',
        'Make "not yet earned" derivable from the course rather than from a list of ids.',
        'Wire Go to Course / Continue Course, which logs to the console on all three states.',
        'Lay the page out below 700px, with the rest of the Atlas shell.',
      ],
    },
    designerNotes: [],
  },
}

export default feature
