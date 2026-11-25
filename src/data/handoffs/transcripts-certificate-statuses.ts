import type { PrototypeFeature } from '../prototypeFeatures'

/**
 * CERTIFICATES & TRANSCRIPTS — THE PRD STATUSES, 2026-11-25, Jillienne: the
 * page caught up to the Certificates and Transcripts PRD (Chi Wang, Atlas
 * Platform Space — https://colibrigroup.atlassian.net/wiki/spaces/ATLAS/pages/6424854531/;
 * §3a the table, §3b the certificate and its statuses) on a copy of the
 * 2026-11-19 page, `TranscriptsPanelV2`, behind `transcripts-certificate-statuses`.
 *
 * Six changes: three controls out of scope removed; the program a link to its
 * course; one empty state; five certificate statuses; the invented expiry rule
 * replaced with the states' own; Chi's sub-heading at the top in place of the
 * "not official" disclaimer.
 *
 * ⚠ FOUR OPEN QUESTIONS carried here on purpose, with their owners: what voids
 * a certificate and what the cell should say; "Learner Home" against the
 * `/courses/:id` route this prototype has; the address step's route; and every
 * invented figure in the demo rows. Empty beats invented.
 */
const feature: PrototypeFeature = {
  id: 'transcripts-certificate-statuses',
  title: 'Certificates & Transcripts — the PRD statuses',
  kind: 'guided',
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'not-ready',
  surface: 'atlas',
  owner: 'Jill',
  lastUpdated: '2026-11-25T15:12:43Z',
  accent: 'blue',
  icon: 'grid',
  brands: ['xcel'],
  blurb:
    'The Certificates & Transcripts page to the PRD: the pre-licensing history with a certificate status on every row, the program linking to its course, one empty state, expiry from each state’s own rule, and Chi’s sub-heading in place of the disclaimer.',
  tileBlurb:
    'Certificates & Transcripts to the PRD: five certificate statuses from the states’ own expiry rules, the program as a link, Chi’s sub-heading, no search or filters.',
  pages: [
    {
      label: 'Certificates & Transcripts — from the nav row',
      note: 'The page a developer builds from: the sub-heading, the count, the seven pre-licensing rows with every certificate status on screen at once. The program on the Florida Life & Health row is a link; the others have no course in the library and are text.',
      to: '/dashboard-rebrand?demo=1&section=certificates',
    },
    {
      label: 'Transcripts — from the profile dropdown',
      note: 'The same component under the account area’s address. The page is reached two ways and must be the same page both ways; this is the second way.',
      to: '/dashboard-rebrand?demo=1&section=transcripts',
    },
    {
      label: 'The page before the PRD — the control turned off',
      note: 'The 2026-11-19 page: the disclaimer, the search, the year filters, Download Transcript, the continuing-education rows, and a certificate cell with the invented five-month expiry. Kept so the two can be read side by side.',
      to: '/dashboard-rebrand?demo=1&section=certificates&ff=transcripts-certificate-statuses:off',
    },
  ],
  featureFlags: [
    { id: 'transcripts-certificate-statuses', label: 'Certificates & Transcripts — the PRD statuses', note: 'On (2026-11-25): the page documented here. Off: the 2026-11-19 page, untouched, at both addresses.' },
    { id: 'atlas-certificates-transcripts-body', label: 'Certificates page shows the transcripts', note: 'On since 2026-11-19: the Certificates & Transcripts row renders the transcript table as its body. Off restores the certificate cards, and this handoff’s page is then only under the profile dropdown’s Transcripts.' },
  ],
  devHandoff: {
    flagsNote:
      'Two controls. The first picks this page or the one before it; the second is the earlier decision that made the Certificates row a transcript table at all. Neither is a product setting.',
    intro:
      'One page, reached two ways, with six changes against the PRD. The search, the year filters and Download Transcript are gone — the PRD lists search and export under "Later or elsewhere" — and the count stays, because with the filters gone it is the only thing that says how much history there is. The program name opens the course. Before the first completion the page says what will appear here and links to My Courses. The Certificate cell carries one of five statuses — Ready, Expired, Not required, Address required, Voided — derived from the state’s own rule and the fixture’s day, never stored. The expiry comes from the nineteen regulated states’ terms in the PRD, not a flat five months. And Chi’s sub-heading sits under the title where the "not official" disclaimer stood.',
    components: [],
    uiComponents: [
      {
        id: 'transcripts-prd-page',
        order: 1,
        name: 'The page — sub-heading, count, table, empty state',
        tabLabel: 'The page',
        location:
          'src/components/account/TranscriptsPanelV2.tsx, a copy of TranscriptsPanel.tsx (the 2026-11-19 page, never edited). The flag transcripts-certificate-statuses chooses between them at both call sites in src/components/layout/PlatformShell.tsx: CertificatesOrTranscripts (?section=certificates) and TranscriptsSection (?section=transcripts). The rows are prelicensingTranscriptsFor in src/data/transcriptFixtures.ts.',
        summary:
          'Chi’s sub-heading under the shell’s "Certificates & Transcripts" title, then "Showing N Results", then the table: Program · License Line · State · Hours · Completed · Final Score · Certificate, sortable on every column but the last, newest completion first. Each column sizes to its widest content with 40px after it; Program wraps at 260; the Certificate cell wraps at 300 so its sentences cannot squeeze the program name. The rows are the learner’s pre-licensing history — the PRD is pre-licensing only; continuing education, prep review and livestream exam review are out of its scope and stay on the page before this one.',
        variants: [
          { name: 'Default', when: 'The learner has at least one completion.', detail: 'The sub-heading, the count and the table. No search box, no filter pills, no Download Transcript, no disclaimer.', why: 'Three controls the PRD puts later or elsewhere were taking the top of a page whose job on 12 January is the table and the certificate.' },
          { name: 'Empty', when: 'No completions yet.', detail: '"Your certificates and transcript appear here" over "Finish a program and we’ll add it to this page, with the certificate you need for your state exam." and a Go to My Courses button. One emptiness only: the "no results" case went with the search and the filters.', why: 'A page with nothing on it needs to say what will be there and where to go to earn it; a second empty state for a search that no longer exists would be a message with no cause.' },
        ],
        ctas: [
          { name: 'The program name', does: 'A link to /courses/{courseId} — the course’s own page, the nearest thing this prototype has to the PRD’s "Learner Home" (see the questions). Only a row with a course in the library is a link; a row without one is text, not a dead link.' },
          { name: 'A column heading', does: 'Sorts the table on that column; pressing it again reverses the sort. Certificate is not sortable.' },
          { name: 'Go to My Courses (empty state only)', does: 'Opens the shell’s own My Courses page (?section=courses), the rest of the query kept. Not the product route /my-learning/courses: the shell blocks that from inside the rebrand with a toast, which is the dead end View Certificate hit on the My Courses card.' },
        ],
        statesMatrix: [
          { question: 'What happens when there is no data yet?', answer: 'The empty state, with the My Courses button. The demo rows never produce it; the state is reached only with an empty list, which is how a new learner arrives.' },
          { question: 'While it loads? If it fails?', answer: 'Not designed. The prototype reads a fixture synchronously; a build reading an API needs a loading row and an error row, neither drawn here.' },
          { question: 'When the text is too long?', answer: 'Program wraps inside its 260; the Certificate cell wraps inside its 300. Every other column is one line and takes its width from its content.' },
          { question: 'Where did the search, the filters and Download Transcript go?', answer: 'Off this page, kept on the page before it and in the print route. The PRD lists search and export under "Later or elsewhere". The export sheet, the print page and the four data helpers they read stay in the code untouched — see the Archive.' },
        ],
        edgeCases: [
          'A row whose course is not in the library (every demo row but the Florida Life & Health one) draws the program as plain text; nothing on the row suggests a link that is not there.',
          'The hours shown are the state-approved hours for the licence line where the record carries them, else the course’s own hours.',
          'The count reads "Showing 1 Result" at one, as the earlier page did.',
        ],
        designSpec: {
          tokens: [
            { role: 'Sub-heading', token: '--font-body · 16px over 28 · --color-text-primary' },
            { role: 'Count', token: '--font-body · 14px over 22 · --color-text-secondary' },
            { role: 'Program link', token: '--color-primary-500, 600 weight, no underline' },
            { role: 'Table card, header and cells', token: 'the account tables’ own (atlasAccountTableStyles) — the 1px rule all round, the column titles on the header’s bottom line' },
            { role: 'Empty state', token: 'EmptyState: --color-surface-card on --color-border-subtle, the action on --color-action' },
          ],
          responsive: [
            'The table is as wide as its columns and never wider than the page; Program holds 260 and the Certificate cell gives way first. Nothing below the desktop has been laid out for this page.',
          ],
          sources: [
            'The final prototype is the source of truth: /dashboard-rebrand?demo=1&section=certificates.',
            'The Certificates and Transcripts PRD (Chi Wang), §3a — https://colibrigroup.atlassian.net/wiki/spaces/ATLAS/pages/6424854531/.',
            'src/components/account/TranscriptsPanelV2.tsx and src/data/transcriptFixtures.ts.',
          ],
        },
      },
      {
        id: 'transcripts-certificate-cell',
        order: 2,
        name: 'The Certificate cell — five statuses',
        tabLabel: 'Certificate cell',
        location:
          'CertificateCell in src/components/account/TranscriptsPanelV2.tsx. The status is certificateStatus(row, today) in src/data/transcriptFixtures.ts, reading the state’s rule from src/data/stateCertificateRules.ts and the day from FIXTURE_TODAY.',
        summary:
          'One cell, five states, derived and never stored: Ready, Expired, Not required, Address required, Voided. The certificate icon is the download, present on Ready and Expired — the two that have a document. Valid until sits inside the cell after the icon, as the 2026-11-19 page drew it, rather than in the PRD’s separate column; that is a deliberate divergence from §3a field 8, logged in the questions. The expiry is the state’s own term from the PRD’s table — nineteen regulated states, each with its term counted from completion; any other state is unregulated and its row reads Not required.',
        variants: [
          { name: 'Ready', when: 'A regulated state, on or before the valid-until day — or a state whose certificate never expires.', detail: 'The certificate icon, then "Valid till 7/14/2026" with the date in semi-bold, or "No expiry" for Minnesota, New Jersey and New York.', action: 'Download and print the certificate.', why: 'The date is the one thing a learner checks before an exam appointment; it sits beside the thing it qualifies.' },
          { name: 'Expired', when: 'The day after the valid-until day.', detail: 'The certificate icon, then "Expired 4/18/2026" in semi-bold and " · Retake the course to sit the exam" in the secondary ink.', action: 'Download it for her records; retake the course.', why: 'An expired certificate is still hers to keep, so the download stays; what she can do next is said in the same breath as the date.' },
          { name: 'Not required', when: 'A state outside the PRD’s nineteen — one of the thirty-three unregulated ones.', detail: '"Not required" in semi-bold, then " · Texas doesn’t require one — this row is your record". No icon, no valid-until.', why: 'A learner in an unregulated state would otherwise look for a document that will never come; the row says plainly that the record is the thing.' },
          { name: 'Address required', when: 'Arkansas, Colorado, Connecticut, Florida or Georgia, with no home address on file.', detail: '"Add your home address" as a text action, then " to release the certificate". No icon until the address is in.', action: 'Add the address.', why: 'Five states release the certificate only against a home address, collected in the affidavit flow after the exam; the cell names the one thing standing between her and the document.' },
          { name: 'Voided', when: 'The row is marked voided.', detail: '"Voided", in the primary ink, nothing else — a draft. The PRD does not define what voids a certificate; see the questions.', why: 'A voided certificate must not be downloadable or read as valid; the treatment is built so the cell has somewhere to go when the trigger is defined.' },
        ],
        ctas: [
          { name: 'The certificate icon (Ready, Expired)', does: 'Drawn, not wired — labelled "Download certificate — {program}" so it reads as the action it will be. There is no certificate document in this repo; the certificates data has the same TODO.' },
          { name: 'Add your home address (Address required)', does: 'Drawn, not wired. The address is collected in the affidavit flow after the exam (Afsana’s), which this prototype opens as a modal on Home at ?affidavit=1; the address step has no route of its own — see the questions.' },
        ],
        statesMatrix: [
          { question: 'Which day decides Expired?', answer: 'The day after the valid-until day, by calendar date — the PRD’s Pacific Time is the boundary, and a date with no clock cannot land on the wrong side of it. On the valid-until day itself the certificate is still Ready.' },
          { question: 'Where does the expiry term come from?', answer: 'The PRD §3a table, verbatim, in stateCertificateRules.ts: Arkansas 2 years, California 3, Colorado 1, Connecticut 1, Florida 4, Georgia 1, Illinois 1, Indiana 6 months, Kentucky 1 year, Michigan 1, Minnesota none, Mississippi 1, Nevada 2, New Jersey none, New York none, Ohio 180 days, Oregon 1 year, West Virginia 6 months, Wisconsin 1 year. Counted from completion; the PRD allows completion or issue, which are one date for us.' },
          { question: 'Ohio: 180 days or six months?', answer: '180 days, counted exactly — they differ by up to four days and a regulator counting days will not round. Pinned in a test, with the no-expiry states and the day-after flip.' },
          { question: 'How does the page know the clock?', answer: 'It does not. certificateStatus reads FIXTURE_TODAY, the day every dated surface in the prototype reads; the Demo bar’s day control moves them all together. new Date() would desynchronise this page from the course cards beside it.' },
          { question: 'Who has a home address on file?', answer: 'In the demo, the row says: a per-row switch, read only in the five states. In a build it is a learner-level fact from the profile, not a transcript field — see the questions.' },
        ],
        edgeCases: [
          'A no-expiry state is Ready for ever; an unregulated state is Not required for ever, whatever the dates.',
          'Voided wins over every other state, including Not required.',
          'A month-term that lands on a day the later month lacks clamps to that month’s last day: 31 August plus six months is 28 February.',
          'The Ohio pair is PRD §3a field 3 in miniature — one course, two licence lines (Life, Health), two rows, two completion dates, and two different statuses on the demo day.',
        ],
        designSpec: {
          tokens: [
            { role: 'Certificate icon', token: '--color-primary-500 (FileCertificateRegular, 16)' },
            { role: 'Status word, the date', token: '600 weight in the cell’s own ink' },
            { role: 'The sentence after it', token: '--color-text-secondary' },
            { role: 'Add your home address', token: '--color-primary-500, 600 weight, a text button' },
          ],
          responsive: ['The cell wraps inside 300px; the icon stays on the first line beside the status.'],
          sources: [
            'The final prototype is the source of truth: /dashboard-rebrand?demo=1&section=certificates — every status on screen at once.',
            'The Certificates and Transcripts PRD (Chi Wang), §3b.',
            'src/components/account/TranscriptsPanelV2.tsx (CertificateCell), src/data/transcriptFixtures.ts (certificateStatus) and src/data/stateCertificateRules.ts.',
          ],
        },
      },
    ],
    decisions: {
      items: [
        {
          question: 'A copy of the page, or a conditional inside it?',
          decision:
            'A copy, TranscriptsPanelV2, with the flag choosing at both call sites. The 2026-11-19 layout is someone else’s work in progress, and a conditional inside that file is how two designers collide. The original is untouched and is what the flag’s off position draws.',
          status: 'Decided',
        },
        {
          question: 'Do the search, the year filters and Download Transcript stay?',
          decision:
            'No. The PRD lists search and export under "Later or elsewhere" for 12 January, and the year filters went with them. The count stays above the table. The print route, the export sheet and the data helpers they read stay in the code, unlinked from this page — unwiring is not deleting. Archive row transcripts-search-filters-export.',
          status: 'Decided',
        },
        {
          question: 'Does Valid until get its own column, as PRD §3a field 8 draws it?',
          decision:
            'No — it stays inside the Certificate cell, after the icon, as the page drew it on 2026-11-19. A deliberate divergence from the PRD, logged here so nobody reads it as an oversight: one cell says the status and its date in one place, and the table keeps its seven columns.',
          status: 'Decided',
        },
        {
          question: 'Where does the expiry come from?',
          decision:
            'From the states’ own rules — the nineteen regulated states and their terms in the PRD §3a table, in src/data/stateCertificateRules.ts. The flat five months and the three hard-coded no-expiry ids on the earlier page were invented and are gone from this one.',
          status: 'Decided',
        },
        {
          question: 'Does the "not official" disclaimer stay, reworded?',
          decision:
            'Removed, not reworded. It told a learner this page was no substitute for a signed certificate, on a page that now hands her the signed certificate; keeping it would contradict the thing beside it. Chi’s sub-heading stands in its place. The copy is kept verbatim in Archive row transcripts-not-official-disclaimer.',
          status: 'Decided',
        },
        {
          question: 'Where does the empty state’s My Courses link go?',
          decision:
            'The shell’s own My Courses page (?section=courses), not the product route /my-learning/courses the PRD names. The shell blocks /my-learning/* from inside the rebrand with a toast — the same dead end the My Courses card’s View Certificate hit — and a link to a toast is no link.',
          status: 'Decided',
        },
        {
          question: 'What voids a certificate, and what should the cell say?',
          decision:
            'Open. The PRD does not define Voided; its proctor case (§3c) removes the row from the page entirely, so Voided is not that. The cell treatment is built and reads "Voided" as a draft; the trigger and the wording are not invented. Empty beats invented.',
          status: 'Needs weigh-in',
          owner: 'Jill',
        },
        {
          question: 'The program opens "Learner Home" — which route is that?',
          decision:
            'Open. This prototype has no route called Learner Home; /courses/:id (the course’s own page) is the nearest thing that exists, and the link is built against it. Whether Learner Home is the Atlas Home with the course active (?section=dashboard with the course chosen, as the My Courses card does) or the course page is for Jill to decide.',
          status: 'Needs weigh-in',
          owner: 'Jill',
        },
        {
          question: 'Where does "Add your home address" go?',
          decision:
            'Open. The address is collected in the affidavit flow after the exam, which Afsana owns; this prototype opens that flow as a modal on Home (?affidavit=1) and has no route for the address step on its own. The control is drawn and not wired until there is one.',
          status: 'Needs weigh-in',
          owner: 'Jill, with Afsana',
        },
        {
          question: 'Are the demo rows’ figures real?',
          decision:
            'No — every date, hour count and score on the seven pre-licensing rows is invented, and listed here for Product to confirm before any of it reaches a customer. Georgia Life & Health: enrolled 1/12/2026, completed 3/2/2026, 40 hours, 86%. Florida Property & Casualty (voided): 11/3/2025, 2/10/2026, 40 hours, 81%. Texas Property & Casualty: 12/2/2025, 1/24/2026, 20 hours, 90%. Ohio Life: 12/1/2025, 1/15/2026, 20 hours, 88%. New York Life, Accident & Health: 9/29/2025, 11/12/2025, 40 hours, 95%. Ohio Health: 9/2/2025, 10/20/2025, 20 hours, 84%. Florida Life & Health: 8/19/2024, 10/4/2024, 40 hours, 92%. The hour counts in particular are guesses at each state’s pre-licensing requirement.',
          status: 'Needs weigh-in',
          owner: 'Product',
        },
        {
          question: 'Where does "home address on file" live?',
          decision:
            'Open. It is a learner-level fact — the profile has an address or it does not — carried per row in the demo so every status could be shown at once. A build reads it from the learner, not the transcript record.',
          status: 'Needs weigh-in',
          owner: 'Engineering',
        },
        {
          question: 'Is the empty state’s copy final?',
          decision:
            'A draft, handed back: "Your certificates and transcript appear here" / "Finish a program and we’ll add it to this page, with the certificate you need for your state exam." / "Go to My Courses".',
          status: 'Needs weigh-in',
          owner: 'Chi',
        },
      ],
      openItems: [
        'Define what voids a certificate and what the Voided cell says (2026-11-25).',
        'Decide what "Learner Home" is for the program link — the course page it links to now, or Home with the course active (2026-11-25).',
        'Give the address step a route, or decide the affidavit modal is it, and wire "Add your home address" (2026-11-25).',
        'Confirm or replace every invented date, hour count and score on the seven demo rows (2026-11-25).',
        'Read "home address on file" from the learner, not the row, in a build (2026-11-25).',
        'Confirm the empty state’s copy (2026-11-25).',
        'Wire the certificate icon to the certificate document when one exists; the certificates data carries the same TODO.',
      ],
    },
    designerNotes: [],
  },
}

export default feature
