import type { PrototypeFeature } from '../prototypeFeatures'

/**
 * TRANSCRIPTS — the account section's course history, 2026-11-02.
 *
 * Built from Figma `I3NdgJJrSQ5A5oBRC3fStO` node `2009:28153`, cross-checked
 * against the live McKissock page at `/account/transcripts`.
 *
 * ⚠ THE LINKED NODE IS NOT THE PAGE. `2009:26768` is a section NAMED
 * "Transcripts" whose frames are all licence screens — Edit Active CE, Add
 * License, License Deleted, Licenses_All, the licence empty states. The
 * Transcripts design is one frame inside it, `2009:28153`, itself misnamed
 * "Licenses_All"; it is identifiable because it carries the page's disclaimer
 * verbatim. Anyone opening that link expecting transcripts will find licences.
 *
 * ⚠ AND THE FIGURES ARE INVENTED. Every completion and enrolment date in
 * `transcriptFixtures.ts` is authored, and the whole 2024–2025 history with
 * them — the course library holds one completed record across every brand, so
 * a transcript derived from it would be one row long. They are listed in the
 * decisions log for Product to confirm.
 */
const feature: PrototypeFeature = {
  id: 'xcel-transcripts',
  title: 'Transcripts',
  kind: 'guided',
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'not-ready',
  surface: 'end-to-end',
  owner: 'Jill',
  lastUpdated: '2026-11-02T20:30:00Z',
  accent: 'teal',
  icon: 'grid',
  brands: ['xcel'],
  blurb:
    'The learner’s whole course history on one page — every completion, including the ones that earned no certificate — with a search, three year filters, and a printable document the learner picks the scope of when they hold more than one licence.',
  tileBlurb:
    'The course history: every completion, searchable and filterable by year, with a printable transcript per profession and state.',
  pages: [
    {
      label: 'Transcripts — the page itself',
      note: 'The account section at ?section=transcripts. Fifteen completions, newest first, with the disclaimer leading and the two document links above the table.',
      to: '/dashboard-rebrand?demo=1&section=transcripts',
    },
    {
      label: 'The printed transcript — every course',
      note: 'What View opens, and what Download opens for a learner with one licence. The learner, the range, the course count and the credit-hour total, then the table and a footer total.',
      to: '/print/transcript',
    },
    {
      label: 'The printed transcript — one profession and state',
      note: 'What Export produces when a single row is chosen. The sheet names its own scope, because a partial transcript has to say so on its face.',
      to: '/print/transcript?groups=Insurance%20Pre-Licensing%7CTexas',
    },
    {
      label: 'The printed transcript — one year',
      note: 'Download pressed while the Completed This Year filter was on. The document is the range the learner was looking at, not a different one.',
      to: '/print/transcript?filter=this-year',
    },
  ],
  featureFlags: [],
  devHandoff: {
    flagsNote:
      'No review controls. Every state on this page is reached by using it — a filter, a search, or the Download link — so there is nothing to pin, and a flag would only hide a state a reviewer can already get to.',
    intro:
      'Three things: a page that is a disclaimer, a search, three filters and a table; a slide-over that asks which transcript to download when the learner has more than one; and the printed document itself. The page replaced a stub that read “Transcripts — not built yet”, which the account sub-nav had been pointing at for weeks.',
    components: [],
    uiComponents: [
      {
        id: 'transcripts-page',
        order: 1,
        name: 'Transcripts page',
        tabLabel: 'The page',
        location:
          'src/components/account/TranscriptsPanel.tsx, rendered by PlatformShell inside AccountSectionLayout at ?section=transcripts. /account/transcripts redirects there. Data: src/data/transcriptFixtures.ts.',
        summary:
          'The disclaimer leads, because it is the thing a learner most needs to know before relying on what follows: these are not official transcripts. Then a search over course name, profession and state; then the three filters with the result total beside them and the Download and View links on the same row; then the six-column table, newest completion first.',
        variants: [
          { name: 'All', when: 'The default. Every completion the learner has, fifteen in the current data.' },
          { name: 'Completed This Year', when: 'Only completions in the demo’s current year.', why: 'A renewal is argued year by year, so the year a board asks about is the one filter worth having.' },
          { name: 'Completed Previous Years', when: 'Everything before it. The two together cover the history exactly — no completion falls outside both.' },
          { name: 'Searching', when: 'Text is in the search box. It narrows whichever filter is on, so the total always reports what is on screen.' },
          { name: 'No results', when: 'A search or filter matches nothing, but the learner does have a history. Offers a different search, or All.', why: 'Telling this apart from an empty history is the difference between “clear your search” and “go take a course”.' },
          { name: 'No history', when: 'The learner has completed nothing at all. “Courses appear here once you complete them.”' },
        ],
        ctas: [
          { name: 'The column headers', does: 'Sort that column, with aria-sort and a rotating chevron. Opens on Date Completed, descending.' },
          { name: 'Download', does: 'Opens the pick-list when the learner holds more than one transcript; goes straight to the printed document when they hold one. A button rather than a link, because it does not always navigate.' },
          { name: 'View', does: 'Always opens the printed document in a new tab, covering everything on screen.' },
          { name: 'The search box', does: 'Matches course name, profession and state — the three things its placeholder names, and nothing else.' },
        ],
        statesMatrix: [
          { question: 'How is this different from Certificates?', answer: 'Certificates is proof — one card per issued document, with a reporting status. This is the history: every completion, including the ones that earned no certificate and never will. The zero-hour platform how-tos are the clearest case; they appear here and can never appear there.' },
          { question: 'Why are there zero-hour rows?', answer: 'A non-credit item earns no credit and is still something the learner completed. The design’s own data has one. The zero is printed rather than blanked, because an empty cell reads as missing data.' },
          { question: 'Why does the search ignore hours and dates?', answer: 'A learner typing “4” means a course with 4 in its name far more often than every four-hour course, and no date format a person types matches the ISO the record stores — so searching dates would look broken rather than absent.' },
          { question: 'Does “this year” follow the demo controls?', answer: 'Yes. It reads the same anchored date every other dated surface reads, so the filter cannot disagree with the course cards beside it, and it does not silently empty on 1 January.' },
          { question: 'What happens below 700px?', answer: 'Untested. A six-column table has no narrow layout yet, and neither does the account section around it.' },
        ],
        edgeCases: [
          'The result total says “1 Result” rather than “1 Results”.',
          'The two document links sit on the filter row only because their labels are short; at “Download All” and “View All” they needed 907px against this page’s 892 and dropped to a row of their own. Lengthening either label brings that back.',
        ],
        designSpec: {
          tokens: [
            { role: 'Table header rule', token: '--color-neutral-500' },
            { role: 'Row separator', token: '--color-neutral-light' },
            { role: 'Cell text', token: '--color-neutral-dark' },
            { role: 'Course name', token: '--color-text-primary' },
            { role: 'Document links', token: '--color-action' },
            { role: 'Result total', token: '--color-text-secondary' },
          ],
          responsive: [
            'Column widths are the design’s 1101px table as percentages — 28.3 / 25.6 / 13.7 / 9 / 11.6 / 11.7 — so they hold at any content width.',
            'The table is wrapped with 16px top corners over the 2px header rule, as the design has it.',
          ],
          sources: [
            'Figma I3NdgJJrSQ5A5oBRC3fStO node 2009:28153 (named "Licenses_All"; see the file header).',
            'src/components/account/TranscriptsPanel.tsx; src/data/transcriptFixtures.ts.',
            'Table cell values are GiftRecipientsTable’s, by value — the three account tables agree by number, not by import.',
          ],
        },
      },
      {
        id: 'transcripts-export-sheet',
        order: 2,
        name: 'Export Transcript sheet',
        tabLabel: 'The chooser',
        location: 'src/components/account/ExportTranscriptSheet.tsx, opened from the page’s Download link.',
        summary:
          'A slide-over listing one row per profession and state, with Select All, a live count of what is picked, and Export and Nevermind at the foot. A transcript is per profession and state, which is the whole reason this exists: a board in one state does not want another state’s continuing education on the same sheet, and a continuing-education renewal does not want pre-licensing hours counted into it.',
        variants: [
          { name: 'Opened', when: 'The learner holds more than one transcript. The notice says how many and that a choice is required; nothing is selected and Export is inert.', why: 'A transcript is a compliance document. Defaulting to everything would let one click send a board sheets covering professions it has no business seeing.' },
          { name: 'Some selected', when: 'One or more rows are ticked. The count updates and Export turns on.' },
          { name: 'All selected', when: 'Select All was pressed. The control then reads Clear All — the label says what pressing it does, rather than describing the state.' },
          { name: 'Never opened', when: 'The learner holds exactly one transcript. Download goes straight to the document.', why: 'Asking somebody which of their one document they meant produces a dialog that can only be dismissed.' },
        ],
        ctas: [
          { name: 'A row', does: 'Ticks or unticks that transcript. Checkboxes, not radios — a learner renewing two state licences wants both sheets.' },
          { name: 'Select All / Clear All', does: 'Ticks every row, or clears them.' },
          { name: 'Export', does: 'Opens the printed document for the chosen rows, in a new tab. Disabled until something is chosen.' },
          { name: 'Nevermind, Back, Escape, the backdrop', does: 'Close without exporting, and clear the selection so reopening starts fresh.' },
        ],
        statesMatrix: [
          { question: 'Why are the rows checkboxes when the design draws circles?', answer: 'Because the design also has Select All and a live “N Selected”, and neither means anything against a radio group. The control it describes is the one that allows more than one.' },
          { question: 'Do the rows follow the page’s filter?', answer: 'No, deliberately. The groups come from the whole history: a learner who narrowed to this year still owns every transcript they own, and hiding one because a filter excluded it would make the export depend on a control that has nothing to do with it.' },
          { question: 'Where are the licence expiry and the percent complete the design shows?', answer: 'Not built, and they cannot be. Those come from licence records, and Licenses was archived from this prototype on 2026-09-30 — inventing an expiry would be inventing a compliance deadline. The rows show the hours, the course count and the span the completions cover. See the decisions log.' },
          { question: 'What does a learner with no completions see?', answer: 'No Download at all in practice — the page is in its empty state. The sheet assumes a history.' },
        ],
        edgeCases: [
          'The notice says “1 Transcript Available” in the singular, though the page never opens the sheet in that case.',
          'The row list scrolls when a learner holds more licences than fit; the footer stays pinned.',
        ],
        designSpec: {
          tokens: [
            { role: 'Notice panel', token: '--color-neutral-75' },
            { role: 'Selected row fill and border', token: '--color-primary-100 / --color-primary-300' },
            { role: 'Select All', token: '--color-action' },
            { role: 'Row meta line', token: '--color-text-secondary' },
          ],
          responsive: ['A 480px slide-over; the list scrolls and the footer is fixed to the bottom.'],
          sources: [
            'src/components/account/ExportTranscriptSheet.tsx; grouping in src/data/transcriptFixtures.ts (transcriptGroups, inGroups, groupLabel).',
          ],
        },
      },
      {
        id: 'transcripts-print',
        order: 3,
        name: 'The printed transcript',
        tabLabel: 'The document',
        location:
          'src/pages/TranscriptPrintPage.tsx at /print/transcript, over src/components/layout/PrintDocumentShell.tsx. Outside AppLayout, so the tab opens with none of the app’s header or nav.',
        summary:
          'A browser-style document viewer — a dark toolbar with the filename and Download, Print and Close, over a white page with a shadow — so the new tab reads as a document rather than another app route. The page itself carries the learner, the range, the course count and the credit-hour total, the disclaimer, the table, and the total repeated at the foot. Download and Print both hand off to the browser’s own print dialog, which is what actually saves the file.',
        variants: [
          { name: 'Everything', when: 'No parameters. Every completion, titled “All completed courses”.' },
          { name: 'One year', when: '?filter= carries the page’s filter. A learner who pressed Download inside one year gets that year — otherwise the document is not the one they were looking at.' },
          { name: 'Chosen transcripts', when: '?groups= carries the sheet’s selection. The sheet names its own scope under the heading.', why: 'A board reading an untitled partial transcript has no way to know hours are missing, and the learner has no way to prove they are not.' },
          { name: 'Nothing matching', when: 'A ?groups= naming no real pair. “No matching transcript” and an empty-range line, rather than an unexplained blank page.' },
        ],
        ctas: [
          { name: 'Download and Print', does: 'Both call the browser’s print dialog. One action behind two labels, so a learner looking for either word is served and neither is lied to.' },
          { name: 'Close', does: 'Tries to close the tab, then falls back to the Transcripts page. The fallback carries the weight — these tabs are opened with noopener, so most browsers refuse to close them.' },
          { name: 'The toolbar and the prototype bar', does: 'Both are hidden from the printed output.' },
        ],
        statesMatrix: [
          { question: 'Does the disclaimer print?', answer: 'Yes, and it is the one thing on the page that must never be dropped to make room. A printed sheet without it is exactly the artefact the disclaimer warns against.' },
          { question: 'Is the credit-hour total trustworthy?', answer: 'It is a sum of the rows shown, so it follows the filter and the chosen transcripts. Non-credit rows contribute zero, which is why they can sit in the list without distorting it.' },
          { question: 'Why are the viewer’s three colours hardcoded?', answer: 'They are the browser’s PDF viewer colours, not this product’s. A brand token there would make the viewer follow the Brand control, which is wrong for something imitating the browser.' },
          { question: 'Does the search carry into the document?', answer: 'No. A transcript filtered to whatever somebody typed is not a document anyone wants, and the link says Download.' },
        ],
        edgeCases: [
          'The Study Calendar print view renders through the same shell and is unchanged by it — verified in the browser.',
        ],
        designSpec: {
          tokens: [
            { role: 'Document page', token: '--color-surface-card' },
            { role: 'Table header rule', token: '--color-neutral-500' },
            { role: 'Row separator', token: '--color-neutral-light' },
            { role: 'Viewer toolbar and ground', token: 'hardcoded #323639 / #525659 — the browser’s, not the brand’s' },
          ],
          responsive: ['The document page caps at 1100px and centres; the viewer body scrolls.'],
          sources: [
            'src/pages/TranscriptPrintPage.tsx; src/components/layout/PrintDocumentShell.tsx.',
            'The shell was extracted from PrintViewPage on 2026-11-02, unchanged, so the two print views cannot drift apart.',
          ],
        },
      },
    ],
    decisions: {
      items: [
        {
          question: 'What is a transcript, as a unit?',
          decision:
            'One per profession and state. A learner with several gets a pick-list; a learner with one is never asked. The grouping is what makes the sheet meaningful — a board in one state has no business seeing another state’s hours, and a continuing-education renewal should not have pre-licensing hours counted into it.',
          status: 'Decided',
        },
        {
          question: 'Does the page list only certificated completions?',
          decision:
            'No. Every completion, including non-credit items that earn no certificate and never will. That is the difference between this page and Certificates, and the design’s own data shows zero-hour rows.',
          status: 'Decided',
        },
        {
          question: 'Should the export default to everything?',
          decision:
            'No. Nothing is selected on open and Export is disabled until the learner chooses. A transcript is a compliance document, and one click should not send a board sheets covering professions it has no business seeing.',
          status: 'Decided',
        },
        {
          question: 'Do the table columns sort?',
          decision:
            'Yes, though the design’s headers are plain text. Both of the other account tables sort every column and are built to read as one component; a history is sorted by nature, and the alternative is a sort dropdown the design does not have either.',
          status: 'Decided',
        },
        {
          question: 'Which colours — the design’s or this product’s?',
          decision:
            'This product’s tokens. The frame is dressed in McKissock’s palette (a green active filter, orange links) and this app has a Brand control that reskins it, so the links take the action colour and the filters are the shared pill component. The difference is correct rather than a fidelity miss.',
          status: 'Decided',
        },
        {
          question: 'Are the completion dates and hour totals real?',
          decision:
            'No. Every completion and enrolment date is invented, and the whole 2024–2025 history with it: the course library holds one completed record across every brand, so a derived transcript would be one row long. The titles, hours and state are the real library’s, and the two professions are the certificate fixtures’ own strings. Product must confirm the figures before this reaches a customer. Current totals: 2026 — 6 courses, 40 hours; 2025 — 5 courses, 13 hours; 2024 — 4 courses, 40 hours; 93 hours overall.',
          status: 'Needs weigh-in',
          owner: 'Product',
        },
        {
          question: 'Where do the licence expiry and percent complete on the chooser’s rows come from?',
          decision:
            'Open, and they cannot be built yet. The design reads “License Expires 9/30/2025 · 55% Complete” per row; both come from licence records, and Licenses was archived from this prototype on 2026-09-30. Inventing an expiry would be inventing a compliance deadline, so the rows show the hours, the course count and the span instead. Restoring the licence data is the dependency.',
          status: 'Needs weigh-in',
          owner: 'Product, then Design',
        },
        {
          question: 'Is the state a code or a full name?',
          decision:
            'A full name, following the design and the certificate records, which already store full names. The live page shows two-letter codes, so the two disagree; the design is what was asked for.',
          status: 'Needs weigh-in',
          owner: 'Design, with Product',
        },
        {
          question: 'Does a course taken twice appear twice?',
          decision:
            'Yes, by the data model — a row is one completed enrolment, and a retake is its own completion with its own date. No fixture exercises it, so it has never been seen on screen.',
          status: 'Needs weigh-in',
          owner: 'Product',
        },
        {
          question: 'What does this page look like on a phone?',
          decision:
            'Open. A six-column table has no narrow layout, and neither does the account section around it.',
          status: 'Needs weigh-in',
          owner: 'Design',
        },
      ],
      openItems: [
        'Confirm or replace every invented completion and enrolment date, and the 93-hour total they produce.',
        'Restore licence records, so the chooser’s rows can carry the expiry and progress the design shows.',
        'Settle whether the state reads as a code or a full name, since the design and the live page disagree.',
        'Decide how a retaken course appears, and seed one so it can be seen.',
        'Lay the page out below 700px, with the rest of the account section.',
        'Replace the browser print dialog with a real generated document, if the transcript is ever to be an official one.',
      ],
    },
    designerNotes: [],
  },
}

export default feature
