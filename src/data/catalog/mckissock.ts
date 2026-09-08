// TODO(data): replace with real catalog API integration.
// Content modeled on https://www.mckissock.com — McKissock is well known for
// appraiser CE, real-estate license education, and home-inspector CE.

import { createImagePicker } from '@/utils/topicImage'
import type { CatalogBundle, IndividualCourse, Membership, Package, Series } from './types'

// One picker per module evaluation so every McKissock course + series
// gets a brand-unique Unsplash image. HMR-safe.
const pickImage = createImagePicker()

const STATE_ABBR: Record<string, string> = {
  Alabama: 'AL',
  Florida: 'FL',
  Georgia: 'GA',
  Illinois: 'IL',
  'North Carolina': 'NC',
  'South Carolina': 'SC',
  Tennessee: 'TN',
  Texas: 'TX',
  Virginia: 'VA',
  Pennsylvania: 'PA',
  Ohio: 'OH',
}

const MEMBERSHIPS: Membership[] = [
  {
    id: 'm-mck-appraisal-unlimited',
    title: 'Appraisal CE Unlimited Membership',
    hours: 40,
    states: ['TX', 'FL', 'PA', 'OH'],
    price: 159,
    badge: 'mandatory',
  },
  {
    id: 'm-mck-pro-path',
    title: 'Real Estate Pro Path Membership',
    hours: 36,
    states: ['TX', 'FL', 'PA', 'OH'],
    price: 219,
    badge: 'elective',
  },
  {
    id: 'm-mck-home-inspector',
    title: 'Home Inspector CE Membership',
    hours: 24,
    states: ['TX', 'FL', 'PA', 'OH'],
    price: 139,
    badge: 'elective',
  },
  {
    id: 'm-mck-supervisor-mentor',
    title: 'Supervisor + Mentor Network Membership',
    hours: 30,
    states: ['TX', 'FL'],
    price: 189,
    badge: 'mandatory',
  },
]

const PACKAGES: Package[] = [
  {
    id: 'p-mck-tx-appraiser-renewal',
    title: 'Texas Certified Residential Appraiser 28-Hour Renewal',
    hours: 28,
    states: ['TX'],
    price: 169,
  },
  {
    id: 'p-mck-fl-appraiser',
    title: 'Florida 30-Hour Appraisal CE Package',
    hours: 30,
    states: ['FL'],
    price: 179,
  },
  {
    id: 'p-mck-pa-re-renewal',
    title: 'Pennsylvania Real Estate 14-Hour Renewal',
    hours: 14,
    states: ['PA'],
    price: 89,
  },
  {
    id: 'p-mck-oh-appraiser',
    title: 'Ohio Appraisal CE Complete Renewal',
    hours: 28,
    states: ['OH'],
    price: 159,
  },
  {
    id: 'p-mck-7-hr-usp',
    title: '7-Hour USPAP Update',
    hours: 7,
    states: ['TX', 'FL', 'PA', 'OH'],
    price: 79,
  },
]

const _INDIVIDUAL_COURSES_BASE: IndividualCourse[] = [
  {
    id: 'c-mck-uspap-7hr',
    title: '7-Hour USPAP Update Course',
    hours: 7,
    states: ['Texas', 'Florida', 'Pennsylvania', 'Ohio'],
    delivery: 'online',
    price: 79,
    rating: 4.7,
    ratingCount: 1124,
    badge: 'mandatory',
    imageQuery: 'uspap',
    releasedAt: '2026-05-08',
    isNew: true,
    tags: ['USPAP'],
  },
  {
    id: 'c-mck-residential-report',
    title: 'Residential Appraiser Site Valuation & Cost Approach',
    hours: 15,
    states: ['Texas', 'Florida'],
    delivery: 'online',
    price: 139,
    rating: 4.6,
    ratingCount: 412,
    badge: 'mandatory',
    imageQuery: 'appraisal-report',
    tags: ['Residential'],
    isNew: true,
  },
  {
    id: 'c-mck-fha-checklist',
    title: 'FHA & The Appraisal Process',
    hours: 5,
    states: ['Texas', 'Florida', 'Pennsylvania'],
    delivery: 'online',
    price: 59,
    rating: 4.8,
    ratingCount: 297,
    badge: 'elective',
    imageQuery: 'fha',
  },
  {
    id: 'c-mck-income-approach',
    title: 'Income Approach Case Studies',
    hours: 7,
    states: ['Texas', 'Ohio'],
    delivery: 'webinar',
    price: 89,
    rating: 4.6,
    ratingCount: 184,
    badge: 'elective',
    imageQuery: 'income-approach',
    schedule: 'Wed, May 27 | 9:00 am-4:00 pm CT',
    // Demo: this learner is already enrolled — used by the "You're already
    // enrolled" modal (date/time switch). Same live webinar offered on several
    // dates; the learner holds the May 27 session and can move to another.
    enrolled: true,
    enrolledSessionId: 'ses-may27',
    sessions: [
      { id: 'ses-may27', day: 'Wednesday', date: 'May 27, 2026', time: '9:00 am – 4:00 pm CT', seatsLeft: 6 },
      { id: 'ses-jun10', day: 'Wednesday', date: 'June 10, 2026', time: '9:00 am – 4:00 pm CT', seatsLeft: 18 },
      { id: 'ses-jun24', day: 'Tuesday', date: 'June 24, 2026', time: '12:00 pm – 7:00 pm CT', seatsLeft: 3 },
      { id: 'ses-jul15', day: 'Wednesday', date: 'July 15, 2026', time: '9:00 am – 4:00 pm CT', seatsLeft: 0 },
    ],
  },
  {
    id: 'c-mck-niche-markets',
    title: 'Appraising Niche & Manufactured Homes',
    hours: 6,
    states: ['Florida', 'Pennsylvania'],
    delivery: 'online',
    price: 69,
    rating: 4.5,
    ratingCount: 142,
    badge: 'elective',
    imageQuery: 'manufactured-home',
    releasedAt: '2026-05-12',
    isNew: true,
  },
  {
    id: 'c-mck-fair-housing',
    title: 'Fair Housing & Bias in Appraisals',
    hours: 4,
    states: ['Texas', 'Florida', 'Pennsylvania', 'Ohio'],
    delivery: 'online',
    price: 49,
    rating: 4.9,
    ratingCount: 612,
    badge: 'mandatory',
    imageQuery: 'fair-housing',
    releasedAt: '2026-05-15',
    isNew: true,
    tags: ['Fair Housing'],
    // Demo: already enrolled — used by the "You're already enrolled" modal
    // (modality switch). Offered in three formats that intentionally surface
    // BOTH commerce outcomes for a Plus (lowest-tier) member:
    //   • Self-paced Online   — included (the current enrollment)
    //   • Live Webinar        — included → a clean, free switch
    //   • In-Person Classroom — priced (includedFromTier 'high') → switching
    //     costs money / prompts an upgrade, so the modal shows a real price wall.
    enrolled: true,
    enrolledModality: 'md-online',
    modalities: [
      {
        id: 'md-online',
        delivery: 'online',
        label: 'Self-paced Online',
        blurb: 'Start anytime · complete at your own pace',
        price: 49,
      },
      {
        id: 'md-webinar',
        delivery: 'webinar',
        label: 'Live Webinar',
        blurb: 'Instructor-led · scheduled sessions',
        price: 69,
      },
      {
        id: 'md-inperson',
        delivery: 'in-person',
        label: 'In-Person Classroom',
        blurb: 'Charlotte campus · printed materials included',
        price: 89,
        // Only Premier-tier members get the in-person seat at no cost; a Plus
        // member sees a price + upgrade prompt when switching to it.
        entitlement: { includedFromTier: 'high' },
      },
    ],
  },
  {
    id: 'c-mck-appraisal-review-workshop',
    title: 'Appraisal Review Workshop — 7-Hour Update',
    hours: 7,
    states: ['Texas', 'Florida', 'Ohio'],
    delivery: 'webinar',
    price: 99,
    rating: 4.8,
    ratingCount: 356,
    badge: 'mandatory',
    imageQuery: 'appraisal-review',
    schedule: 'Tue, Jun 2 | 9:00 am-4:00 pm CT',
    // Demo: enrolled with BOTH switch dimensions wired — the learner holds the
    // Live Webinar on Jun 2, so the Manage Enrollment hub shows BOTH action
    // rows: "Switch date/time" (move to another webinar session) AND "Switch
    // format" (move to self-paced online / in-person). The current session +
    // current format both appear in the hub summary.
    enrolled: true,
    enrolledSessionId: 'ses-arw-jun2',
    enrolledModality: 'md-arw-webinar',
    sessions: [
      { id: 'ses-arw-jun2', day: 'Tuesday', date: 'June 2, 2026', time: '9:00 am – 4:00 pm CT', seatsLeft: 9 },
      { id: 'ses-arw-jun16', day: 'Tuesday', date: 'June 16, 2026', time: '9:00 am – 4:00 pm CT', seatsLeft: 22 },
      { id: 'ses-arw-jun30', day: 'Thursday', date: 'June 30, 2026', time: '12:00 pm – 7:00 pm CT', seatsLeft: 4 },
      { id: 'ses-arw-jul21', day: 'Tuesday', date: 'July 21, 2026', time: '9:00 am – 4:00 pm CT', seatsLeft: 0 },
    ],
    modalities: [
      {
        id: 'md-arw-online',
        delivery: 'online',
        label: 'Self-paced Online',
        blurb: 'Start anytime · complete at your own pace',
        price: 79,
      },
      {
        id: 'md-arw-webinar',
        delivery: 'webinar',
        label: 'Live Webinar',
        blurb: 'Instructor-led · scheduled sessions',
        price: 99,
      },
      {
        id: 'md-arw-inperson',
        delivery: 'in-person',
        label: 'In-Person Classroom',
        blurb: 'Dallas campus · printed materials included',
        price: 129,
        // Premier-tier only at no cost; a Plus member hits a price/upgrade wall.
        entitlement: { includedFromTier: 'high' },
      },
    ],
  },
  {
    id: 'c-mck-supervisor-trainee',
    title: 'Supervisory Appraiser / Trainee Appraiser Course',
    hours: 4,
    states: ['Texas', 'Florida'],
    delivery: 'online',
    price: 49,
    rating: 4.7,
    ratingCount: 233,
    badge: 'mandatory',
    imageQuery: 'supervisor',
  },
  {
    id: 'c-mck-rural-property',
    title: 'Appraising Rural Residential Properties',
    hours: 7,
    states: ['Texas', 'Ohio'],
    delivery: 'online',
    price: 79,
    rating: 4.6,
    ratingCount: 168,
    badge: 'elective',
    imageQuery: 'rural-property',
  },
  {
    id: 'c-mck-podcast-appraisal-insights',
    title: 'Appraisal Insights — Industry Podcast Series',
    hours: 4,
    states: ['Texas', 'Florida', 'Pennsylvania'],
    delivery: 'podcast',
    price: 39,
    rating: 4.7,
    ratingCount: 88,
    badge: 'elective',
    imageQuery: 'podcast-appraisal',
  },
  // Quick-win sub-1-hour micro-courses for the "Quick wins" shelf.
  {
    id: 'c-mck-quick-uad-fields',
    title: 'UAD Field-by-Field Refresher',
    hours: 0.5,
    states: ['Texas', 'Florida'],
    delivery: 'online',
    price: 9,
    rating: 4.6,
    ratingCount: 36,
    badge: 'mandatory',
    imageQuery: 'uad',
    releasedAt: '2026-05-18',
  },
  {
    id: 'c-mck-quick-comps-grid',
    title: 'Comps Grid Pitfalls in 30 Minutes',
    hours: 0.5,
    states: ['Texas'],
    delivery: 'online',
    price: 9,
    rating: 4.5,
    ratingCount: 22,
    badge: 'elective',
    imageQuery: 'comps',
  },
  {
    id: 'c-mck-quick-uspap-rules',
    title: 'USPAP Standard 1 — Quick Refresher',
    hours: 0.5,
    states: ['Texas', 'Florida'],
    delivery: 'online',
    price: 9,
    rating: 4.7,
    ratingCount: 48,
    badge: 'mandatory',
    imageQuery: 'uspap',
    tags: ['USPAP'],
  },
  {
    id: 'c-mck-quick-ansi-standards',
    title: 'ANSI Standards Quick Reference',
    hours: 0.5,
    states: ['Texas', 'Florida'],
    delivery: 'online',
    price: 9,
    rating: 4.5,
    ratingCount: 26,
    badge: 'elective',
    imageQuery: 'appraisal-report',
  },
  // Additional podcasts so the Podcast Spotlight shelf clears the
  // 4-item minimum. Stay aligned with McKissock's appraisal focus.
  {
    id: 'c-mck-podcast-uspap-conversations',
    title: 'USPAP Conversations — Weekly Briefing',
    hours: 3,
    states: ['Texas', 'Florida', 'Pennsylvania'],
    delivery: 'podcast',
    price: 29,
    rating: 4.6,
    ratingCount: 64,
    badge: 'mandatory',
    imageQuery: 'podcast-appraisal',
  },
  {
    id: 'c-mck-podcast-field-notes',
    title: 'Field Notes from Working Appraisers',
    hours: 4,
    states: ['Texas', 'Florida'],
    delivery: 'podcast',
    price: 29,
    rating: 4.5,
    ratingCount: 42,
    badge: 'elective',
    imageQuery: 'podcast-appraisal',
  },
  {
    id: 'c-mck-podcast-rural-routes',
    title: 'Rural Routes — Appraising Outside the City',
    hours: 2,
    states: ['Texas', 'Pennsylvania'],
    delivery: 'podcast',
    price: 19,
    rating: 4.7,
    ratingCount: 51,
    badge: 'elective',
    imageQuery: 'rural-property',
  },
]

const INDIVIDUAL_COURSES: IndividualCourse[] = _INDIVIDUAL_COURSES_BASE.map((c) => ({
  ...c,
  imageUrl: pickImage(c.imageQuery),
}))

// Curated multi-course series — same shape + role as cre.ts's `SERIES`.
// Instructor names match the brand's existing instructor pool and
// courseIds reference real entries above so the Sheet's "Included
// courses" tab resolves to actual items.
const SERIES: Series[] = [
  {
    id: 'mck-series-uspap-2026',
    title: '2026 USPAP & Bias Refresher',
    blurb:
      'Pair the federal USPAP update with the bias and fair-housing module — the two-course track every appraiser needs this cycle.',
    instructor: 'Dan Bradley, AQB',
    instructorTitle: 'Lead Appraisal Instructor',
    courseCount: 3,
    totalHours: 17,
    imageUrl: pickImage('uspap'),
    courseIds: ['c-mck-uspap-7hr', 'c-mck-fair-housing', 'c-mck-quick-uspap-rules'],
    badge: 'mandatory',
  },
  {
    id: 'mck-series-residential-deep-dive',
    title: 'Residential Appraisal Deep Dive',
    blurb:
      'Four hands-on courses on residential reports, comps grids, and rural property — everything a residential appraiser hits weekly.',
    instructor: 'Rachel Massey, SRA',
    instructorTitle: 'Residential Appraisal Expert',
    courseCount: 4,
    totalHours: 22,
    imageUrl: pickImage('appraisal-report'),
    courseIds: [
      'c-mck-residential-report',
      'c-mck-rural-property',
      'c-mck-niche-markets',
      'c-mck-quick-comps-grid',
    ],
    badge: 'elective',
  },
  {
    id: 'mck-series-income-approach',
    title: 'Income Approach Mastery',
    blurb:
      'A three-course track on income capitalization, FHA, and the appraisal report templates lenders expect.',
    instructor: 'Tom Inman, MAI',
    instructorTitle: 'Commercial Appraisal Instructor',
    courseCount: 3,
    totalHours: 15,
    imageUrl: pickImage('income-approach'),
    courseIds: ['c-mck-income-approach', 'c-mck-fha-checklist', 'c-mck-residential-report'],
    badge: 'elective',
  },
  {
    id: 'mck-series-supervisory',
    title: 'Building a Supervisory Practice',
    blurb:
      'Set up a trainee program from scratch — workflow, mentorship cadence, and the federal documentation appraisers miss.',
    instructor: 'Linda Walker',
    instructorTitle: 'Trainee Mentor Program Lead',
    courseCount: 3,
    totalHours: 12,
    imageUrl: pickImage('supervisor'),
    courseIds: ['c-mck-supervisor-trainee', 'c-mck-uspap-7hr', 'c-mck-quick-uspap-rules'],
    badge: 'mandatory',
  },
]

export const mckissockBundle: CatalogBundle = {
  heroTitle: 'Course Catalog',
  heroSubtitle: 'Appraisal, real-estate CE & professional development',
  professionOptions: [
    { value: 'appraisal-ce', label: 'Appraisal Continuing Education' },
    { value: 'appraisal-qe', label: 'Appraisal Qualifying Education' },
    { value: 'real-estate-ce', label: 'Real Estate Continuing Education' },
    { value: 'home-inspection', label: 'Home Inspection CE' },
  ],
  licensedStates: ['Texas', 'Florida'],
  additionalStates: ['Pennsylvania', 'Ohio', 'Georgia', 'North Carolina', 'Illinois', 'Tennessee', 'Virginia'],
  instructors: ['Dan Bradley, AQB', 'Rachel Massey, SRA', 'Tom Inman, MAI', 'Linda Walker', 'Marcus O’Neil'],
  memberships: MEMBERSHIPS,
  packages: PACKAGES,
  individualCourses: INDIVIDUAL_COURSES,
  series: SERIES,
  totalResults: MEMBERSHIPS.length + PACKAGES.length + INDIVIDUAL_COURSES.length,
  memberStates: new Set(['Texas']),
  stateAbbr: STATE_ABBR,
  filterLabels: {
    professionFilter: 'Discipline',
    hoursFilter: 'Credit Hours',
    creditTypeFilter: 'Credit Type',
    creditTypeOptions: [
      { value: 'mandatory', label: 'Mandatory' },
      { value: 'non-credit', label: 'Non-Credit' },
    ],
    showStateRail: true,
  },
}
