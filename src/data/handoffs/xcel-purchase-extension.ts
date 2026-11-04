import type { PrototypeFeature } from '../prototypeFeatures'

/**
 * PURCHASE EXTENSION — buying more access to a course, 2026-11-03.
 *
 * ⚠ THIS ROW WAS ALREADY BEING CITED BEFORE IT EXISTED. Three places in the
 * Atlas Home handoffs point a reader here — "See the Purchase Extension
 * handoff", "the flow behind it is specified on its own Development row",
 * "they are written up on the Purchase Extension row, which exists for exactly
 * this". None of that was true until today: the button has been drawn in three
 * states since 2026-10-21 and the document explaining it was a forward
 * reference to nothing.
 *
 * ⚠ THE ROW THUMBNAILS ARE CAPTURES, THE PREVIEWS ARE LIVE. Each component's
 * detail page renders the real component from the registry, so the spec cannot
 * drift from the implementation. The four PNGs are only the 104x68 pictures on
 * the row list, which the field's own note says to prefer: a live miniature of
 * these components reads as a blank plate (three of the four are mostly white
 * at that size), costs a render per visible row, and puts its text in the DOM
 * where find-in-page hits it. They are padded to the tile's ratio so `cover`
 * cannot crop the Purchase Extension button off the right, which is the one
 * thing each picture is for. Re-shoot them when the access row changes.
 *
 * ⚠ IT IS A GATHERING, NOT A NEW DESIGN. Nothing here is invented. The trigger
 * arithmetic is `courseExpiryTier`'s, the three button treatments are the
 * course head's, the expired message and its thirty-day window are the pace
 * card's, and the expired course card's "Enrol again" is the fourth surface
 * making the same offer in different words. What this row adds is the thing no
 * single surface could carry: they do not all promise the same outcome, and the
 * flow behind every one of them is unbuilt.
 */
const feature: PrototypeFeature = {
  id: 'xcel-purchase-extension',
  title: 'Purchase Extension',
  kind: 'guided',
  status: 'ready',
  category: 'dev-handoff',
  devStatus: 'needs-discussion',
  surface: 'atlas',
  owner: 'Jill',
  lastUpdated: '2026-11-03T00:00:00Z',
  accent: 'gold',
  icon: 'flag',
  brands: ['xcel'],
  blurb:
    'The offer to buy more time on a course that is running out or has run out — four surfaces that already make it, one countdown that decides when, and no flow behind any of them.',
  tileBlurb:
    'Buying more time on an expiring course: four surfaces offer it, the countdown decides when, and nothing is wired. The open questions are the deliverable.',
  pages: [
    {
      label: 'A week left — the offer appears',
      note: 'Set Expires to 7 days. The access row turns amber and Purchase Extension joins the other two buttons; nothing is taken away, because the learner can still work.',
      to: '/dashboard-rebrand?demo=1&section=dashboard',
    },
    {
      label: 'The last days — the offer turns red',
      note: 'Set Expires to 1 day. The row steps to the error tone and the button re-outlines with it. On the last usable day the count becomes a sentence rather than a zero.',
      to: '/dashboard-rebrand?demo=1&section=dashboard',
    },
    {
      label: 'Access gone — the offer is all that is left',
      note: 'Set Expires to Expired. Course Overview and Begin/Resume both come off and a single primary Purchase Extension stands where they were; the pace card below gives the percentage reached and the thirty-day window.',
      to: '/dashboard-rebrand?demo=1&section=dashboard',
    },
    {
      label: 'The expired course card — the fourth surface, in other words',
      note: 'My Courses draws an expired course with "Enrol again →" rather than Purchase Extension, and that wording was chosen to avoid promising the work comes back. See the decisions log.',
      to: '/dashboard-rebrand?demo=1&section=courses',
    },
  ],
  featureFlags: [
    { id: 'atlas-v3-progress', label: 'Progress', note: 'Which of the five course states Home opens on. Expired is the one that strips the head down to the purchase button.' },
    { id: 'hybrid-course-expiry', label: 'Course expiry', note: 'The access window the countdown is measured against. The Demo bar’s Expires control is the fast way to the three states.' },
  ],
  devHandoff: {
    flagsNote:
      'Neither control belongs to this feature — they are how a reviewer reaches its states. There is no extension flag, because there is no extension: every button below is drawn and inert.',
    intro:
      'One offer, four places, no flow. A countdown decides when the offer appears and how loudly; the course head carries it as a button in three treatments; the pace card argues for it once access has gone; and the expired course card in My Courses makes the same offer in different words. Everything in this row is already on screen. What is not built is what happens when any of it is pressed — and the four surfaces do not currently agree on what the learner would be buying.',
    components: [],
    uiComponents: [
      {
        id: 'extension-trigger',
        thumbnail: '/prototype-thumbs/components/xcel-purchase-extension-extension-trigger.png',
        order: 1,
        name: 'When the offer appears',
        tabLabel: 'The trigger',
        location:
          'src/data/courseExpiry.ts — courseExpiryTier, EXPIRY_SOON_DAYS (7), EXPIRY_URGENT_DAYS (2). Read by the course head in both Home files.',
        summary:
          'One function decides all of it, and it counts in days the learner can actually study in rather than days on the calendar. The access date is the day access dies, so reaching it is already expired, and the usable count is the gap minus one. Seven usable days or fewer is the warning tone; two or fewer is the error tone; the date itself and anything past it is expired. A completed course never warns, whatever its dates say.',
        variants: [
          { name: 'Normal', when: 'More than seven usable days, or the course has no access date at all. No offer anywhere.', why: 'An offer with no deadline behind it is an advertisement, and the course head has better things to carry.' },
          { name: 'Soon', when: 'Seven or fewer usable days, more than two. Warning tone.' },
          { name: 'Urgent', when: 'Two or fewer usable days. Error tone. The last usable day reads as a sentence, not a zero.', why: 'A literal "0 days" reads as a bug rather than as urgency.' },
          { name: 'Expired', when: 'The access date has arrived or passed, and the course is unfinished.' },
          { name: 'Completed', when: 'The course is finished. Always normal, whatever the dates say.', why: 'A finished course has nothing left to extend, and a warning on one is noise the learner cannot act on.' },
        ],
        ctas: [],
        statesMatrix: [
          { question: 'Why usable days rather than days until the date?', answer: 'Because "under seven days" has to mean seven days of work. Counting to the date itself fires the warning a day before the figure beside it justifies, and tells a learner they have a day they do not have.' },
          { question: 'Is this the same thing the course cards use for their badges?', answer: 'No, and the two are not rivals. The catalogue badge asks whether a card in a grid of thirteen should wear a marker, over a window defaulting to 60 days and clamped to half the enrolment. This asks a hero question about one course the learner is looking at. Same module, two spans, deliberately.' },
          { question: 'What happens between the access date and the end of the grace window?', answer: 'Nothing is modelled. The product knows expired and not-expired; the thirty-day window named in the expired message is a constant, not a countdown. See the decisions log.' },
        ],
        edgeCases: [
          'A course with no access date never reaches any of these states, and the access row is omitted rather than drawn empty.',
        ],
        designSpec: {
          tokens: [
            { role: 'Soon', token: '--color-warning-700' },
            { role: 'Urgent', token: '--color-error-600' },
            { role: 'Expired', token: '--color-neutral-800' },
          ],
          responsive: [],
          sources: ['src/data/courseExpiry.ts — courseExpiryTier and the two day constants.'],
        },
      },
      {
        id: 'extension-course-head',
        thumbnail: '/prototype-thumbs/components/xcel-purchase-extension-extension-course-head.png',
        order: 2,
        name: 'The button on the course head',
        tabLabel: 'The button',
        location:
          'AtlasCourseHeadRow in src/components/compass/AtlasHomeEricE2E.tsx and src/components/compass/AtlasHomeJillMain.tsx. The full anatomy of the head is on the Atlas Home — Course Head handoff; this card covers the button only.',
        summary:
          'Purchase Extension appears first in the action row from seven usable days out, outlined in the tone of whichever state the countdown is in. On the last usable day it still only joins the other two buttons — the learner can work today, so nothing is taken away. Once access has gone the head drops to this button alone, at primary weight, because there is nothing left for it to compete with.',
        variants: [
          { name: 'Alongside, in the warning tone', when: 'Seven or fewer usable days. Outlined; Course Overview and Begin or Resume both stay.' },
          { name: 'Alongside, in the error tone', when: 'Two or fewer usable days. The same button, re-outlined.' },
          { name: 'Alone and primary', when: 'Access has gone. Course Overview comes off — it opens the course, and there is no course to open — and Begin or Resume has nothing to resume.', why: 'Access ending is not another point on the progress scale. The course stops being something to resume and becomes something to buy, and the eyebrow, the tense, the panel and the button all change together because they are saying one thing.' },
          { name: 'Absent', when: 'More than seven usable days, no access date, or the course is complete.' },
        ],
        ctas: [
          { name: 'Purchase Extension', does: '⚠ Drawn, not wired — it is bound to an empty function and does nothing in any of its three states. What it should do is the whole open question below.' },
        ],
        statesMatrix: [
          { question: 'Why does it not replace the other buttons until access is gone?', answer: 'Because until then the learner can still study, and the useful thing is to let them. Taking away Begin or Resume on the last day would push somebody toward a purchase at the one moment they could still finish without one.' },
          { question: 'Can a course be complete and expired at once?', answer: 'Not today — both read the same control, so the combination cannot be produced. It is documented as a gap on the course head’s own handoff rather than hidden here.' },
          { question: 'Does the button look the same on both Home files?', answer: 'Yes. Both pass it the same way and it is the same component; the two Homes are copies that have not diverged on this.' },
        ],
        edgeCases: [
          'With the demo’s navigation links switched off the button is bound to an empty function rather than removed, so it still draws and still does nothing — which is the same behaviour it has everywhere else.',
        ],
        designSpec: {
          tokens: [
            { role: 'Outline, soon', token: '--color-warning-700' },
            { role: 'Outline, urgent', token: '--color-error-600' },
            { role: 'Primary, expired', token: '--color-action' },
          ],
          responsive: ['The action row wraps the third button to its own line when the three do not fit.'],
          sources: [
            'AtlasCourseHeadRow in src/components/compass/AtlasHomeEricE2E.tsx (onPurchaseExtension) and the matching block in AtlasHomeJillMain.tsx.',
          ],
        },
      },
      {
        id: 'extension-argument',
        thumbnail: '/prototype-thumbs/components/xcel-purchase-extension-extension-argument.png',
        order: 3,
        name: 'The argument for it',
        tabLabel: 'The pitch',
        location:
          'src/components/compass/AtlasPaceRingCard.tsx — the expired message and EXTENSION_GRACE_DAYS; the access-bound branch of the no-plan state.',
        summary:
          'Two places make the case rather than the offer. Once access has gone the pace card strips to the dial, relabels it "Progress paused", and says how far the learner got and that an extension within thirty days picks it up where they left off. Separately, when no honest study plan fits because access runs out first, the card names the access window as the binding deadline and offers to extend it — the exam branch offers nothing, because a booked exam cannot be extended.',
        variants: [
          { name: 'Progress paused', when: 'Access has gone. The pace, the week goal, the estimated completion and the exam row all go; the percentage reached and the thirty-day window remain.', why: 'A plan is advice about a future the learner no longer has. How far they got is the one fact still worth showing, and it is the argument for buying more time.' },
          { name: 'No plan fits — access-bound', when: 'There is not enough access left for any honest plan. The card names the access window and offers to extend it.' },
          { name: 'No plan fits — exam-bound', when: 'The exam is too close. The card names the exam and offers nothing.', why: 'An extension cannot move an exam, so offering one here would be selling something that does not solve the problem. The exam is checked first.' },
          { name: 'Exam after access ends', when: 'The plan is built to the access date and the exam sits below it as a milestone the plan does not reach.', detail: 'This is the clearest case for an extension in the product: the gap between the two dates is exactly what buying more time would close, and the card draws that gap without naming it as a reason.' },
        ],
        ctas: [
          { name: 'Extend your access', does: '⚠ Drawn, not wired. Shown only in the access-bound no-plan branch. It is the same offer the course head makes, in a second place and different words.' },
        ],
        statesMatrix: [
          { question: 'Where does thirty days come from?', answer: 'It is a given figure, not a derivation — a business rule written as a constant for that reason. Nothing in the product knows how long a lapsed enrolment keeps its progress.' },
          { question: 'Does the window count down?', answer: 'No. It says thirty days whether access ended today or three weeks ago, which is wrong the moment anybody treats it as a deadline. If it becomes real it has to count down, and it then belongs with the other date helpers rather than beside the copy.' },
          { question: 'Why does the dial stay when everything else goes?', answer: 'Because the percentage is what the extension would restart, so it is both the one live fact and the pitch.' },
        ],
        edgeCases: [
          'A learner with a booked exam still ahead sees the plan disappear anyway — an exam does not keep a plan alive when there is nothing left to study.',
        ],
        designSpec: {
          tokens: [
            { role: 'Paused dial', token: '--color-neutral-800' },
          ],
          responsive: [],
          sources: ['src/components/compass/AtlasPaceRingCard.tsx — EXTENSION_GRACE_DAYS and the expired branch.'],
        },
      },
      {
        id: 'extension-course-card',
        thumbnail: '/prototype-thumbs/components/xcel-purchase-extension-extension-course-card.png',
        order: 4,
        name: 'The same offer in My Courses',
        tabLabel: 'Enrol again',
        location: 'src/components/courses/CourseCard.tsx — the expired card’s footer link.',
        summary:
          'An expired course in My Courses takes a text link reading "Enrol again" in its footer, beside a progress bar still showing the frozen percentage. It is the same situation as the course head’s expired state and it makes a deliberately different promise: the wording was chosen to avoid implying that the learner’s work comes back, and the comment in the source says in as many words not to soften it.',
        variants: [
          { name: 'Expired course', when: 'The card is in its expired treatment. The link takes the footer’s left slot.' },
          { name: 'Anything else', when: 'No link — there is nothing to re-enrol in.' },
        ],
        ctas: [
          { name: 'Enrol again', does: '⚠ Drawn, not wired; it logs and stops. A text link rather than a button because it is a utility beside the content, not the card’s primary action.' },
        ],
        statesMatrix: [
          { question: 'Is this the same offer as Purchase Extension?', answer: 'That is the question this row exists to force. The two surfaces describe the same learner in the same situation and promise different things — one says their progress resumes, the other was worded specifically to avoid saying so. Both cannot be right.' },
          { question: 'Why does the card still show the old percentage?', answer: 'To show the learner what they did. The bar beside the link is carrying the distinction between what was achieved and what would be restored, which is the whole reason the link avoids the word restore.' },
        ],
        edgeCases: [
          'The link wins its slot over the Jump Back In marker and the certificate marker; in practice an expired course can hold neither, so they never compete.',
        ],
        designSpec: {
          tokens: [{ role: 'Link', token: '--color-action' }],
          responsive: [],
          sources: ['src/components/courses/CourseCard.tsx — the enrolAgain branch and its note.'],
        },
      },
    ],
    decisions: {
      items: [
        {
          question: 'When is the offer made?',
          decision:
            'From seven usable days of access out, escalating inside two, and standing alone once access has gone. Counted in days the learner can study in, not days on the calendar.',
          status: 'Decided',
        },
        {
          question: 'Does the offer replace the other actions?',
          decision:
            'Only once access has gone. Until then it joins them, because a learner who can still study should be allowed to rather than pushed toward a purchase.',
          status: 'Decided',
        },
        {
          question: 'Is an extension offered when the EXAM is the problem?',
          decision:
            'No. An extension cannot move a booked exam, and offering one there would be selling something that does not solve the learner’s problem. The exam is checked before the access window for exactly this reason.',
          status: 'Decided',
        },
        {
          question: 'What is actually being sold?',
          decision:
            'Open, and it is the first question. More days on the existing window, a fresh window of a fixed length, or the course again at full price are three different products with three different prices, and the button is drawn in three states without any of them being chosen. Nothing can be built until this is answered.',
          status: 'Needs weigh-in',
          owner: 'Product',
        },
        {
          question: 'Does the learner get their progress back?',
          decision:
            'Open, and the product currently says both. The pace card promises an extension lets them "pick up where you left off"; the expired course card’s link was worded to avoid implying the work returns, with a note in the source saying not to soften it. One of those has to change, and which one changes depends on what the platform can actually restore after a lapse.',
          status: 'Needs weigh-in',
          owner: 'Product and Engineering',
        },
        {
          question: 'Is the thirty-day window real?',
          decision:
            'Open. It is a constant in the expired message and it does not count down, so it says thirty days whether access ended today or three weeks ago. Either it is a real deadline — in which case it has to count down and live with the other date helpers — or it is approximate and the copy should not state a number.',
          status: 'Needs weigh-in',
          owner: 'Product',
        },
        {
          question: 'Where does the button go?',
          decision:
            'Open. A checkout, a sheet over Home, or the existing invite-and-purchase checkout are all plausible and imply different amounts of work. The invite checkout already exists and already sells a course, which makes it the cheapest route to try first.',
          status: 'Needs weigh-in',
          owner: 'Design and Engineering',
        },
        {
          question: 'Does the offer change with how much of the course was finished?',
          decision:
            'Open. A learner at 90% and one at 5% are in different situations, and the expired pace card already prints the percentage — so the information to vary the offer is on screen whether or not the offer uses it.',
          status: 'Needs weigh-in',
          owner: 'Product',
        },
        {
          question: 'Should four surfaces make this offer at all?',
          decision:
            'Open. The course head, the pace card’s expired message, the no-plan branch and the My Courses card each carry a version of it, in three different wordings. That is defensible if they are one offer stated for different contexts and a problem if nobody has decided they are.',
          status: 'Needs weigh-in',
          owner: 'Design',
        },
      ],
      openItems: [
        'Decide what an extension sells — more days, a new window, or the course again.',
        'Settle whether progress is restored, and make the two surfaces that disagree say the same thing.',
        'Confirm or drop the thirty-day figure; if it is real, make it count down.',
        'Choose the destination, starting with whether the existing checkout can carry it.',
        'Decide whether the offer varies with progress.',
        'Agree one wording across the four surfaces, or write down why they differ.',
      ],
    },
    designerNotes: [],
  },
}

export default feature
