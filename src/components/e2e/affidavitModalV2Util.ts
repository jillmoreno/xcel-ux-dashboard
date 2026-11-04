import { ENTRIES, FORMS, type AffEntry, type AffForm, type AffidavitMoment } from '@/data/affidavitForms'

/* Split out of AffidavitModalV2.tsx so that file exports components only (fast
   refresh) — the same split as demoBarUtil.ts beside DemoBar.tsx. */

export type ResolvedAffidavit = {
  entry: AffEntry | undefined
  form: AffForm | null
  /** The line of authority a multi-form entry resolved to. */
  loa?: string
}

/** The demo course is Life & Health, so that line is preferred where a state
 *  has one form per line. */
export function resolveAffidavit(moment: AffidavitMoment, state: string, language: string): ResolvedAffidavit {
  const entry = ENTRIES.find((e) => e.m === moment && e.st === state)
  if (!entry) return { entry, form: null }
  if (entry.variants) {
    const loas = Object.keys(entry.variants)
    const loa = loas.includes('Life & Health') ? 'Life & Health' : loas[0]
    const byLang = loa ? entry.variants[loa] : undefined
    const key = byLang ? (byLang[language] ?? Object.values(byLang)[0]) : undefined
    return { entry, form: key ? (FORMS[key] ?? null) : null, loa }
  }
  return { entry, form: entry.status === 'ready' && entry.form ? (FORMS[entry.form] ?? null) : null }
}
