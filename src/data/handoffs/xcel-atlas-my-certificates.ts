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
    'The learner’s issued certificates on one page, reached from Home’s Quick Links and drawn with the shared certificate card under a serif title, every one of them opening a Certificate Details slide-over.',
  tileBlurb:
    'Issued certificates on one page, on the shared card with a serif title. Every card opens its detail — a sheet that used to render empty for an issued certificate.',
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
    { id: 'atlas-certificates-card-style', label: 'Certificates card', note: 'Shared is the card documented here. Atlas draws the earlier card instead \u2014 the one the audit of 2026-11-02 replaced.' },
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
        name: 'Certificate card',
        tabLabel: 'The card',
        location:
          'src/components/certificates/CertificateCard.tsx. The same component /my-learning/certificates draws \u2014 not a copy. AtlasCertificateCard.tsx is the earlier card, kept behind the Certificates card control.',
        summary:
          'The title top-left in the heading serif, a status badge top-right \u2014 an icon in a tinted circle with the status spelled out beneath it \u2014 then the profession, a row of state, hours and credit type, and a label-and-value pair for Certificate Issued and Reporting Status. The status word under the badge is set in capitals. The kebab sits bottom-right. The whole card opens its detail, and says so: a 6px accent stroke slides onto the left edge on hover or focus and the title turns the accent colour and underlines.',
        variants: [
          { name: 'Issued', when: 'The certificate has been earned. An award badge over COMPLETED in the pass ramp \u2014 the green the Compass surfaces use for mastery \u2014 with the issue date and the reporting line.', why: 'It was the brand primary ramp, which on this brand is a navy, so the one status a learner is pleased to see looked like any other furniture.' },
          { name: 'Not yet earned', when: 'Never, on this page \u2014 see the decision below. The card can draw it (an hourglass badge over an \u201cIn Progress\u201d tag, and one line in place of the issue and reporting rows) and keeps the ability on purpose, but nothing here asks for it: every certificate this page lists is an issued one.', why: 'Kept rather than deleted because a certificate that genuinely is not issued must not fall through to the issued treatment and print a date it has not got.' },
          { name: 'Action required', when: 'Something is outstanding. A triangle-exclamation badge over an “Action required” tag in the warning ramp, the course completion date instead of an issue date, and a "Certificate Pending" pill naming what is needed. Reachable from the tabbed page, whose status tabs this page hides.' },
          { name: 'External', when: 'A certificate the learner uploaded, taken elsewhere. A neutral badge over EXTERNAL and an "Issued By" line. Also tab-only.' },
          { name: 'Serif title', when: 'On this page only. The heading serif in place of the sans title the tabbed page draws.', why: 'The page title is serif, and a sans card title under it read as a different product.' },
        ],
        ctas: [
          { name: 'The card', does: 'Opens the Certificate Details slide-over, for any status. Keyboard: Enter and Space, with a role and a label naming the certificate.' },
          { name: 'The kebab', does: 'Opens the same slide-over. With no menu designed yet the honest destination is the card\u2019s own; a Download, Print and Report menu is an open decision below.' },
          { name: 'The reporting status information icon', does: 'A tooltip explaining a pending roster submission. Drawn only on that one reporting value.' },
        ],
        statesMatrix: [
          { question: 'Why not the card the page drew before?', answer: 'An audit on 2026-11-02 found four things wrong with it. It led with a "Certificate" pill \u2014 the one fact every card on a certificates page shares, so it distinguished nothing \u2014 while the status, the fact that actually varies, sat at 11px in grey on the right. It dropped the profession line, so two continuing-education certificates in one state differed only by title. It had no hover or focus treatment even after the whole card became a button. And its not-yet-earned card was a title over two rows of empty space.' },
          { question: 'Why does the kebab do the same thing as the card?', answer: 'Because the alternative was leaving it dead. It is a placeholder for a Download, Print and Report menu, not a considered equivalence.' },
          { question: 'How does the card know a certificate is not yet earned?', answer: 'It is told. The record is still marked completed \u2014 not-yet-earned is a decision the page makes from a list of ids \u2014 so the card cannot read it off the data, and a card that did would print COMPLETED over a certificate the learner has not got.' },
          { question: 'Does the tabbed page change?', answer: 'No. Every one of these is an opt-in prop, so /my-learning/certificates draws exactly what it drew before: the sans title, and only an action-required card clickable.' },
        ],
        edgeCases: [
          'The kebab stops propagation, so it never also fires the card\u2019s own click.',
          'Titles wrap freely; the grid sizes each row to its tallest card, so a two-line title lifts its whole row.',
          'In dark mode the card surface flips and the title and status tag are re-pinned to light stops, which the component handles.',
        ],
        designSpec: {
          tokens: [
            { role: 'Issued badge and stroke', token: '--color-pass-100 / --color-pass-500' },
            { role: 'Issued glyph and status word', token: '--color-pass-600 / --color-pass-700' },
            { role: 'Not-yet-earned badge and stroke', token: '--color-info-100 / --color-info-500' },
            { role: 'Action-required badge and stroke', token: '--color-warning-100 / --color-warning-500' },
            { role: 'External badge', token: '--color-neutral-100' },
            { role: 'Kebab circle', token: '--color-tertiary-100' },
            { role: 'Title face on this page', token: '--font-heading-serif' },
          ],
          responsive: ['The hover stroke and title colour live in tokens.css on .cre-cert-card, driven by the --cert-accent and --cert-link properties the card sets per status.'],
          sources: [
            'src/components/certificates/CertificateCard.tsx.',
            'Status matrix: Figma file uVUMm2ZJ6YWoc9NqjTpqWb, node 122:2018 \u2014 each status in Default and Hover.',
          ],
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
          question: 'Which certificate card does the page draw?',
          decision:
            'The card the rest of the product already uses, with its title in the serif face. An audit on 2026-11-02 found four faults in the one it replaced: a "Certificate" pill in the loudest position saying the one thing every card on the page shares, while the status it should have been saying sat at 11px in grey; no profession line, so two continuing-education certificates in one state differed only by title; no hover or focus treatment, after the whole card had become a button; and a not-yet-earned card that was a title over two rows of empty space. The earlier card is kept behind the Certificates card control.',
          status: 'Decided',
        },
        {
          question: 'Does the page ever show a certificate that is not yet earned?',
          decision:
            'No. Every certificate on this page is an issued one. A not-yet-earned look was briefly painted over the Life & Health card, but that was never a record state \u2014 that record carries an issue date and a reporting date \u2014 so the overlay made the page disagree with its own data. The card and the detail sheet both keep the ability to draw one, unwired, because a certificate that genuinely is not issued must not fall through to the issued treatment and claim a date, a reporting status and a document it has not got.',
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
        'Settle whether a learner part-way through a course should hold its completion certificate at all \u2014 Home shows Life & Health in progress while this page lists its certificate as issued, which is the records disagreeing rather than the pages.',
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
