import type { PrototypeFeature } from '../prototypeFeatures'

/**
 * LEARNER / ADMIN MODE in the Atlas header's profile menu — 2026-11-03.
 *
 * Designed on feat/atlas-admin (2026-10-20) and brought to feat/quick-links
 * the same week, behind the design control `atlas-header-mode-switch`. The
 * admin pages themselves are not on this branch, so Admin opens that
 * branch's build — the prototype's stand-in for a route the product owns.
 *
 * ⚠ THE INTRO WAS WRITTEN BY CLAUDE AT ERIC'S REQUEST ("write your own simple
 * summary"), not in his words. Replace it with his if he writes one.
 */
const feature: PrototypeFeature = {
  id: 'xcel-atlas-header-mode-switch',
  title: 'Profile menu — Learner / Admin mode',
  kind: 'guided',
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'not-ready',
  surface: 'atlas',
  owner: 'Eric',
  lastUpdated: '2026-11-03T00:00:00Z',
  accent: 'blue',
  icon: 'grid',
  brands: ['xcel'],
  blurb:
    'A person who is both a learner and an admin switches between the two from the profile menu, which always says which mode they are in.',
  tileBlurb:
    'The profile menu names the mode after the user’s name and offers Mode: Admin / Learner under the email — one switch for people who are both.',
  pages: [
    {
      label: 'Atlas Home — the menu closed',
      note: 'The header trigger reads “Jordan Navarro (Learner Mode)”. Open it to see the Mode pills under the email.',
      to: '/dashboard-rebrand?demo=1',
    },
  ],
  featureFlags: [
    { id: 'atlas-header-mode-switch', label: 'Profile menu: mode switch', note: 'On: the mode after the name and the Mode pills. Off: the menu as it was.' },
  ],
  devHandoff: {
    flagsNote:
      'Design bar → “Profile menu: mode switch” turns the whole thing on and off. Off, the menu is exactly as it was before: the name alone on the trigger, and no Mode row.',
    intro:
      'Some people are both a learner and an admin. Instead of a separate login or a hidden link, the profile menu tells them which side they are on and lets them switch with one click. The name in the header says the mode, and the menu has two small pills — Admin and Learner — with the current one selected.',
    components: [],
    uiComponents: [
      {
        id: 'atlas-header-mode-menu',
        order: 1,
        name: 'Profile menu — Learner / Admin mode',
        tabLabel: 'Mode switch',
        location:
          'The Atlas header’s profile menu, top right. src/components/layout/AtlasHeader.tsx (`modeMenu` prop, `AtlasHeaderMode` type), wired in AtlasHeaderConnected.tsx; the small pill is `.cre-atlas-hdr-pill--sm` in atlasHeader.css.',
        summary:
          'The trigger names the mode after the user’s name — “(Learner Mode)” or “(Admin Mode)”. Inside, under the email, “Mode:” and two pills: the current mode reads selected, the other one switches. The links below follow the mode: the learner’s Profile, Notifications, Transcripts and My Purchases, or the admin’s own list.',
        variants: [
          {
            name: 'Learner Mode',
            when: 'The person is in the learner product.',
            why: 'The name alone gave no hint that an admin side existed, or which side they were on.',
            action: 'Admin switches to the admin side.',
          },
          {
            name: 'Admin Mode',
            when: 'The person is in the admin product.',
            action: 'Learner switches back to the learner side. The links under the rule become the admin’s.',
          },
          {
            name: 'Learner only',
            when: 'The person has no admin role.',
            why: 'Offering a switch to a side they cannot use is a dead end.',
            action: 'No mode text on the trigger and no Mode row — the menu as it always was.',
          },
        ],
        ctas: [
          { name: 'The trigger (name and mode)', does: 'Opens and closes the profile menu.' },
          { name: 'Admin pill', does: 'In Learner Mode, switches to the admin side and lands on its Students page. In Admin Mode it is the selected pill and does nothing.' },
          { name: 'Learner pill', does: 'In Admin Mode, switches back to the learner side. In Learner Mode it is the selected pill and does nothing.' },
          { name: 'Profile · Notifications · Transcripts · My Purchases', does: 'Unchanged: open those account pages. Shown in Learner Mode only.' },
          { name: 'Logout', does: 'Unchanged.' },
        ],
        statesMatrix: [
          { question: 'Where does Admin take you?', answer: 'The admin side’s Students page. In this prototype that page lives on a separate build (feat/atlas-admin), so the switch opens that address; in the product it is a route in the same app.' },
          { question: 'Does switching keep the person’s context?', answer: 'It carries the page’s query along. There is no shared state between the two sides beyond who is signed in.' },
          { question: 'Why pills rather than a “Switch to … Mode” row?', answer: 'The pills say which mode is on and switch in the same control. A switch row did the second job only and was removed.' },
        ],
        edgeCases: [
          'The selected pill is not clickable — the cursor says so — so there is no “switch to where you already are”.',
          'The trigger gets wider by the length of “(Learner Mode)”; the header has room at desktop widths, narrow widths are untested.',
        ],
        designSpec: {
          tokens: [
            { role: 'Pills', token: 'the header pill (`.cre-atlas-hdr-pill`) at 85% — 26px tall, its own colours and selected state' },
            { role: '“Mode:” label', token: '--atlas-hdr-email, semi-bold' },
            { role: 'Trigger name / mode', token: 'name semi-bold, “(… Mode)” regular' },
          ],
          responsive: [
            'Desktop: the menu is 256px wide; the Mode row sits 8px under the email, its text level with the pills’ text.',
            'Links sit 8px under the first rule and 12px over the second.',
          ],
          sources: [
            'src/components/layout/AtlasHeader.tsx; src/components/layout/AtlasHeaderConnected.tsx; src/components/layout/atlasHeader.css.',
            'Designed on feat/atlas-admin, 2026-10-20 (commits 14b920b0, b01b430b, f4315f1e).',
          ],
        },
      },
    ],
    decisions: {
      items: [
        {
          question: 'Where does the switch live — a header pill, or the profile menu?',
          decision: 'The profile menu. It is about who the person is, and the menu is where the account lives; a pill in the main nav competes with Home and the course links.',
          status: 'Decided',
        },
        {
          question: 'Who sees the switch?',
          decision: 'Only people who hold an admin role. Everyone else gets the menu exactly as before. The prototype shows it to everyone so it can be reviewed.',
          status: 'Needs weigh-in',
          owner: 'Product',
        },
        {
          question: 'Which admin page does Admin open?',
          decision: 'Students, for now — the admin side’s first page. Remembering the last admin page visited is open.',
          status: 'Needs weigh-in',
          owner: 'Design',
        },
      ],
      openItems: ['Who sees the switch (role gating).', 'Which admin page the switch lands on.'],
    },
    designerNotes: [],
  },
}

export default feature
