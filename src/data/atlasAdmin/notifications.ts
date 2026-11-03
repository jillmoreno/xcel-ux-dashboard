/**
 * ATLAS ADMIN — EVERYTHING THE PORTAL SENDS (2026-10-19). The reference's
 * Notifications page, verbatim in name, description, status and preview: four
 * that reach the admin (and anyone they add), six that reach recruits from the
 * admin. The Progress report's preview is drawn from the live roster on the
 * page; every other preview is the message as written here.
 */

export type NotificationAction = 'cadence' | 'recipients' | 'sample' | 'rules' | 'note' | 'day' | 'timing'

export type NotificationPreview = {
  from: string
  to: string
  replyTo?: string
  subject: string
  /** Paragraphs; a leading "Hi X," is its own paragraph. */
  body: string[]
  /** A short list under the body (licenses, next steps…). */
  items?: string[]
  /** A label-only extra line (fees…). */
  note?: string
  cta?: string
  /** A second, quieter answer under the CTA. */
  ctaAlt?: string
  footer?: string
}

export type NotificationDef = {
  id: string
  group: 'admin' | 'recruit'
  title: string
  description: string
  /** The status line while on, and while off. */
  onLine: string
  offLine: string
  defaultOn: boolean
  actions: NotificationAction[]
  /** Null for the Progress report, whose preview is built on the page. */
  preview: NotificationPreview | null
}

const FROM_YOU = 'Cody McClintock via Team Lead Portal'
const REPLIES = 'Sent from you. Replies come back to cody.mcclintock@example.com.'

export const ADMIN_NOTIFICATIONS: NotificationDef[] = [
  {
    id: 'progress-report',
    group: 'admin',
    title: 'Progress report',
    description:
      'Who stopped moving and who to call first. Trending low, quiet 2 days, and ready with no exam date each open a filtered roster. Recruits you hide on Students are left out.',
    onLine: '',
    offLine: 'Paused · nobody gets it until you turn it back on',
    defaultOn: true,
    actions: ['cadence', 'recipients', 'sample'],
    preview: null,
  },
  {
    id: 'falls-behind',
    group: 'admin',
    title: 'Someone falls behind',
    description: 'One email the moment a recruit crosses a line you set, instead of waiting for the weekly.',
    onLine: 'Active · never opened after 10 days · quiet 14 days · finished with no exam date',
    offLine: 'Off · you hear about it in the weekly report',
    defaultOn: true,
    actions: ['rules'],
    preview: {
      from: 'Team Lead Portal',
      to: 'Cody McClintock',
      subject: 'Jordan Ellis: day 12, still not started',
      body: ['Jordan enrolled 12 days ago and has not started the course. Day-10 rule fired.', 'Suggested next step: Call. Day 10+ with no start.'],
      cta: 'View recruit',
    },
  },
  {
    id: 'finishes',
    group: 'admin',
    title: 'Someone finishes',
    description: 'Course complete, how long it took against your 14 day target, and the next step to give them.',
    onLine: 'Active · sent within the hour',
    offLine: 'Off · completions show on Students only',
    defaultOn: true,
    actions: [],
    preview: {
      from: 'Team Lead Portal',
      to: 'Cody McClintock',
      subject: 'Morgan Blake finished. Add their exam date',
      body: ['Morgan completed Life & Health Pre-Licensing in 20 days (target 14). Score on file.', 'State next steps (NY): NY Life Producer Exam. No exam date captured yet.'],
      cta: 'Add exam date',
    },
  },
  {
    id: 'license-expiring',
    group: 'admin',
    title: 'A license is expiring',
    description: 'A heads up on producers in your scope at 60, 30 and 7 days out, so renewals do not lapse quietly.',
    onLine: 'Active · 60, 30 and 7 days out',
    offLine: 'Off · nobody is told until the license has already lapsed',
    defaultOn: false,
    actions: [],
    preview: {
      from: 'Team Lead Portal',
      to: 'Cody McClintock',
      subject: '2 licenses in your scope renew in 30 days',
      body: ['Two producers in your scope have a renewal inside 30 days. Neither has enough CE hours yet.'],
      items: ['Morgan Blake · TX Life · expires Oct 9 · 8 of 24 hours', 'Casey Morgan · NY Life · expires Oct 18 · 4 of 15 hours'],
      cta: 'Open licensed students',
    },
  },
  {
    id: 'invite',
    group: 'recruit',
    title: 'Invite',
    description: 'Your note, the product, the price, and a pre-applied code so they land on checkout ready to go.',
    onLine: 'Active · resend unlocks 24 hours after the last send',
    offLine: 'Off · invites go out without your note',
    defaultOn: true,
    actions: ['note'],
    preview: {
      from: FROM_YOU,
      to: 'Jamie Rivera',
      subject: 'You are invited to Life Pre-Licensing at agency price',
      body: ['Hi Jamie,', '“Excited to get you licensed this month.” Cody McClintock', 'Premier Package · agency price. No partner code. applied.'],
      cta: 'Open your invite',
      footer: REPLIES,
    },
  },
  {
    id: 'day-10',
    group: 'recruit',
    title: 'Day 10 nudge',
    description: 'Sent when they have not opened the course. Comes from you, with a magic link straight to chapter one.',
    onLine: 'Active · day 10 · once per recruit',
    offLine: 'Off · nobody is nudged before the weekly report',
    defaultOn: true,
    actions: ['day'],
    preview: {
      from: FROM_YOU,
      to: 'Jordan Ellis',
      replyTo: 'Cody McClintock',
      subject: 'Quick check-in from Cody: ready for Chapter 1?',
      body: ['Hi Jordan,', 'Cody here, just checking in. Your course is ready whenever you are. Most people who pass start in the first week. This note goes out on day 10.'],
      cta: 'Continue to Chapter 1',
      footer: 'Reply to this email to reach Cody McClintock directly. ' + REPLIES,
    },
  },
  {
    id: 'quiet-7',
    group: 'recruit',
    title: 'Quiet 7 days',
    description:
      'They have not been in the course for a week. We email them from you, then text if we have a number, so they come back before they go cold.',
    onLine: 'Active · sent after 7 days with no activity · email first, then text if we have a number',
    offLine: 'Off · quiet recruits are only flagged to you',
    defaultOn: true,
    actions: [],
    preview: {
      from: FROM_YOU,
      to: 'Casey Morgan',
      replyTo: 'Cody McClintock',
      subject: 'Casey, we saved your place in the course',
      body: [
        'Hi Casey,',
        'It has been a week since you were last in Life Pre-Licensing. Your progress is saved. Most people who pass come back the same week they pause, before the material goes cold.',
      ],
      cta: 'Pick up where you left off',
      footer: 'Reply to this email to reach Cody McClintock directly. If this stays unopened and we have a mobile number, the same note goes out as a text. ' + REPLIES,
    },
  },
  {
    id: 'next-steps',
    group: 'recruit',
    title: 'Next steps on completion',
    description: 'The state checklist, what the exam costs, and a place to tell you when they are sitting it.',
    onLine: 'Active · sent the day they finish',
    offLine: 'Off · finishers get the course certificate only',
    defaultOn: true,
    actions: [],
    preview: {
      from: 'Team Lead Portal',
      to: 'Morgan Blake',
      subject: 'You finished. Here is how to schedule your NY exam',
      body: ['Congrats on finishing the course.'],
      items: ['Complete approved pre-licensing course', 'Schedule exam with Pearson VUE', 'Apply for license within 2 years of exam pass', 'Fingerprint / background check as required'],
      note: 'Est. fees: $15 + exam fee',
      cta: 'Tell us your exam date',
      footer: REPLIES,
    },
  },
  {
    id: 'exam-score',
    group: 'recruit',
    title: 'Collect exam score',
    description: 'One question, three answers, no login. This is how you stop guessing who actually got licensed.',
    onLine: 'Active · sends 7 days after they complete all their training',
    offLine: 'Off · exam results come in only when someone asks',
    defaultOn: true,
    actions: ['timing'],
    preview: {
      from: FROM_YOU,
      to: 'Morgan Blake',
      subject: 'Morgan, how did the exam go?',
      body: ['You finished your course on March 4. If you have taken the NY Life Producer Exam since then, we would like to know how it went so we can log it.'],
      cta: 'I passed',
      ctaAlt: 'I did not pass · I have not taken it yet',
      footer: 'One question, no login required. Cody McClintock sees your answer, nobody else. ' + REPLIES,
    },
  },
  {
    id: 'ce-behind',
    group: 'recruit',
    title: 'CE behind pace',
    description: 'Halfway through the renewal cycle with under half the hours logged. Only reaches licensed producers.',
    onLine: 'Active · halfway through the renewal cycle',
    offLine: 'Off · turn on once your first producers are licensed',
    defaultOn: false,
    actions: [],
    preview: {
      from: FROM_YOU,
      to: 'Morgan Blake',
      replyTo: 'Cody McClintock',
      subject: 'Morgan, you are halfway through your CE cycle',
      body: [
        'Your Texas Life license renews in 11 months. You have 8 of 24 hours logged, including ethics. Most producers who stay current log a little each quarter rather than all of it at the end.',
      ],
      cta: 'See what hours you still need',
      footer: 'Reply to this email to reach Cody McClintock directly. ' + REPLIES,
    },
  },
]
