// TODO(data): replace with real catalog API integration.
// FHEA = Fitzgerald Health Education Associates — nurse-practitioner
// certification & recertification exam review (FNP / AGNP / PMHNP / ENP).
// Content modeled on https://www.fhea.com.
//
// FHEA reuses Elite's healthcare bundle (memberships, filter labels, states)
// and APPENDS FHEA-specific exam-review content so the Recommended for You
// page's FHEA shelves populate:
//   • My Interests            — interest-tagged self-paced courses
//   • Free Webinars           — webinar + price 0
//   • Review Packages         — packages with "Review Package" in the title
//   • Livestream Review Programs — webinar + "Exam Review" in the title
//   • Onsite Review Programs  — in-person + "Exam Review" in the title
//
// The appended items carry FHEA-only interest tags (FNP Certification / AGNP /
// Cardiology) so they never bleed into Elite's own shelves and vice-versa.

import { createImagePicker } from '@/utils/topicImage'
import { eliteBundle } from './elite'
import type { CatalogBundle, IndividualCourse, Package } from './types'

// One picker per module evaluation so every appended FHEA course gets a
// brand-unique Unsplash image. HMR-safe.
const pickImage = createImagePicker()

// National NP-certification reach — keep a broad state set so the page's State
// filter reads cleanly.
const NATIONAL = ['Texas', 'California', 'Florida', 'New York']

const _FHEA_COURSES_BASE: IndividualCourse[] = [
  // ---- Self-paced online (My Interests) ----
  {
    id: 'c-fhea-fnp-pharm',
    title: 'FNP Pharmacology Deep Dive',
    hours: 15,
    states: NATIONAL,
    delivery: 'online',
    price: 79,
    rating: 4.8,
    ratingCount: 356,
    badge: 'elective',
    imageQuery: 'pharmacology',
    tags: ['FNP Certification'],
    pharmacologyHours: 15,
  },
  {
    id: 'c-fhea-ecg',
    title: 'ECG Interpretation for Nurse Practitioners',
    hours: 8,
    states: NATIONAL,
    delivery: 'online',
    price: 59,
    rating: 4.7,
    ratingCount: 214,
    badge: 'elective',
    imageQuery: 'critical-care',
    tags: ['Cardiology'],
  },
  {
    id: 'c-fhea-agnp-pearls',
    title: 'AGNP Clinical Pearls',
    hours: 10,
    states: NATIONAL,
    delivery: 'online',
    price: 69,
    rating: 4.6,
    ratingCount: 148,
    badge: 'elective',
    imageQuery: 'palliative',
    tags: ['AGNP'],
  },
  {
    id: 'c-fhea-fnp-primary',
    title: 'Primary Care Essentials for the FNP',
    hours: 12,
    states: NATIONAL,
    delivery: 'online',
    price: 65,
    rating: 4.8,
    ratingCount: 271,
    badge: 'elective',
    imageQuery: 'medical-safety',
    tags: ['FNP Certification'],
  },
  // ---- Free webinars (Free Webinars — webinar + price 0) ----
  {
    id: 'c-fhea-free-thyroid',
    title: 'Thyroid Disorders in Primary Care',
    hours: 1,
    states: NATIONAL,
    delivery: 'webinar',
    price: 0,
    rating: 4.7,
    ratingCount: 402,
    badge: 'elective',
    imageQuery: 'awareness',
    schedule: 'Wed, June 3 | 7:00 pm-8:00 pm ET',
  },
  {
    id: 'c-fhea-free-antibiotic',
    title: 'Antibiotic Stewardship for NPs',
    hours: 1,
    states: NATIONAL,
    delivery: 'webinar',
    price: 0,
    rating: 4.6,
    ratingCount: 318,
    badge: 'elective',
    imageQuery: 'compliance',
    schedule: 'Thu, June 11 | 7:00 pm-8:00 pm ET',
  },
  {
    id: 'c-fhea-free-htn',
    title: 'Managing Hypertension: Guidelines Update',
    hours: 1,
    states: NATIONAL,
    delivery: 'webinar',
    price: 0,
    rating: 4.8,
    ratingCount: 456,
    badge: 'elective',
    imageQuery: 'critical-care',
    tags: ['Cardiology'],
    schedule: 'Tue, June 16 | 7:00 pm-8:00 pm ET',
  },
  {
    id: 'c-fhea-free-derm',
    title: 'Dermatology Essentials for NPs',
    hours: 1,
    states: NATIONAL,
    delivery: 'webinar',
    price: 0,
    rating: 4.5,
    ratingCount: 189,
    badge: 'elective',
    imageQuery: 'pain-management',
    schedule: 'Wed, June 24 | 7:00 pm-8:00 pm ET',
  },
  // ---- Livestream review programs (webinar + "Exam Review") ----
  {
    id: 'c-fhea-live-fnp',
    title: 'FNP Certification Exam Review — Live Stream',
    hours: 20,
    states: NATIONAL,
    delivery: 'webinar',
    price: 299,
    rating: 4.9,
    ratingCount: 512,
    badge: 'mandatory',
    imageQuery: 'pharmacology',
    tags: ['FNP Certification'],
    schedule: 'Sat–Sun, July 11–12 | 9:00 am-5:00 pm ET',
  },
  {
    id: 'c-fhea-live-agnp',
    title: 'AGNP Certification Exam Review — Live Stream',
    hours: 20,
    states: NATIONAL,
    delivery: 'webinar',
    price: 299,
    rating: 4.8,
    ratingCount: 287,
    badge: 'mandatory',
    imageQuery: 'palliative',
    tags: ['AGNP'],
    schedule: 'Sat–Sun, July 18–19 | 9:00 am-5:00 pm ET',
  },
  {
    id: 'c-fhea-live-pmhnp',
    title: 'PMHNP Certification Exam Review — Live Stream',
    hours: 18,
    states: NATIONAL,
    delivery: 'webinar',
    price: 299,
    rating: 4.8,
    ratingCount: 231,
    badge: 'mandatory',
    imageQuery: 'mental-health',
    schedule: 'Sat–Sun, July 25–26 | 9:00 am-5:00 pm ET',
  },
  {
    id: 'c-fhea-live-enp',
    title: 'ENP Certification Exam Review — Live Stream',
    hours: 16,
    states: NATIONAL,
    delivery: 'webinar',
    price: 279,
    rating: 4.7,
    ratingCount: 143,
    badge: 'mandatory',
    imageQuery: 'critical-care',
    schedule: 'Sat–Sun, Aug 1–2 | 9:00 am-5:00 pm ET',
  },
  // ---- Onsite review programs (in-person + "Exam Review") ----
  {
    id: 'c-fhea-onsite-fnp',
    title: 'FNP Certification Exam Review — Onsite Intensive',
    hours: 24,
    states: ['Texas'],
    delivery: 'in-person',
    price: 399,
    rating: 4.9,
    ratingCount: 176,
    badge: 'mandatory',
    imageQuery: 'pharmacology',
    tags: ['FNP Certification'],
    schedule: 'Fri–Sun, Aug 14–16 | 8:00 am-4:00 pm CT',
    location: 'Austin, TX',
  },
  {
    id: 'c-fhea-onsite-agnp',
    title: 'AGNP Certification Exam Review — Onsite',
    hours: 24,
    states: ['California'],
    delivery: 'in-person',
    price: 399,
    rating: 4.8,
    ratingCount: 98,
    badge: 'mandatory',
    imageQuery: 'palliative',
    tags: ['AGNP'],
    schedule: 'Fri–Sun, Aug 21–23 | 8:00 am-4:00 pm PT',
    location: 'Los Angeles, CA',
  },
  {
    id: 'c-fhea-onsite-pmhnp',
    title: 'PMHNP Certification Exam Review — Onsite',
    hours: 20,
    states: ['Florida'],
    delivery: 'in-person',
    price: 379,
    rating: 4.7,
    ratingCount: 82,
    badge: 'mandatory',
    imageQuery: 'mental-health',
    schedule: 'Fri–Sun, Sep 4–6 | 8:00 am-4:00 pm ET',
    location: 'Orlando, FL',
  },
  {
    id: 'c-fhea-onsite-natl',
    title: 'National NP Certification Exam Review — Onsite Bootcamp',
    hours: 28,
    states: ['New York'],
    delivery: 'in-person',
    price: 449,
    rating: 4.9,
    ratingCount: 121,
    badge: 'mandatory',
    imageQuery: 'medical-safety',
    schedule: 'Thu–Sun, Sep 17–20 | 8:00 am-4:00 pm ET',
    location: 'New York, NY',
  },
]

const FHEA_COURSES: IndividualCourse[] = _FHEA_COURSES_BASE.map((c) => ({
  ...c,
  imageUrl: pickImage(c.imageQuery),
}))

// Review packages — the "Review Packages" shelf matches on `title` containing
// "Review Package".
const FHEA_PACKAGES: Package[] = [
  {
    id: 'p-fhea-fnp-review',
    title: 'FNP Certification Review Package',
    hours: 60,
    states: NATIONAL,
    price: 349,
  },
  {
    id: 'p-fhea-agnp-review',
    title: 'AGNP Certification Review Package',
    hours: 55,
    states: NATIONAL,
    price: 349,
  },
  {
    id: 'p-fhea-pmhnp-review',
    title: 'PMHNP Certification Review Package',
    hours: 50,
    states: NATIONAL,
    price: 329,
  },
  {
    id: 'p-fhea-enp-review',
    title: 'ENP Certification Review Package',
    hours: 45,
    states: NATIONAL,
    price: 299,
  },
]

export const fitzgeraldBundle: CatalogBundle = {
  ...eliteBundle,
  heroTitle: 'NP Certification Exam Review',
  heroSubtitle: 'Certification & recertification review for nurse practitioners',
  packages: [...eliteBundle.packages, ...FHEA_PACKAGES],
  individualCourses: [...eliteBundle.individualCourses, ...FHEA_COURSES],
  totalResults:
    eliteBundle.memberships.length +
    eliteBundle.packages.length +
    FHEA_PACKAGES.length +
    eliteBundle.individualCourses.length +
    FHEA_COURSES.length,
}
