import { ENTRIES, FORMS, type AffEntry, type AffField, type AffForm, type AffidavitMoment } from '@/data/affidavitForms'

/* Split out of AffidavitModalV2.tsx so that file exports components only (fast
   refresh) — the same split as demoBarUtil.ts beside DemoBar.tsx. */

export type ResolvedAffidavit = {
  entry: AffEntry | undefined
  form: AffForm | null
  /** The line of authority a multi-form entry resolved to. */
  loa?: string
}

/** Where a state signs one form per line of authority, the Design bar's
 *  Line of authority picks it (Life & Health, the demo course's line, by
 *  default); a state with no form for that line shows its first, as the
 *  explorer's picker falls back. Language works the same way. */
export function resolveAffidavit(
  moment: AffidavitMoment,
  state: string,
  language: string,
  lineOfAuthority = 'Life & Health',
): ResolvedAffidavit {
  const entry = ENTRIES.find((e) => e.m === moment && e.st === state)
  if (!entry) return { entry, form: null }
  if (entry.byLanguage) {
    const key = entry.byLanguage[language] ?? Object.values(entry.byLanguage)[0]
    return { entry, form: key ? (FORMS[key] ?? null) : null }
  }
  if (entry.variants) {
    const loas = Object.keys(entry.variants)
    const loa = loas.includes(lineOfAuthority) ? lineOfAuthority : loas[0]
    const byLang = loa ? entry.variants[loa] : undefined
    const key = byLang ? (byLang[language] ?? Object.values(byLang)[0]) : undefined
    return { entry, form: key ? (FORMS[key] ?? null) : null, loa }
  }
  return { entry, form: entry.status === 'ready' && entry.form ? (FORMS[entry.form] ?? null) : null }
}

/** The form without its Middle Name field — the Design bar's "Affidavit
 *  middle name" set to Off (2026-11-06, undecided). */
export function withoutMiddle(form: AffForm): AffForm {
  const strip = (l: AffField[] | undefined): AffField[] | undefined =>
    l?.filter((x) => x.id !== 'middle' && x.id !== 'p_middle').map((x) => (x.row ? { ...x, row: strip(x.row) } : x.flagGroup ? { ...x, flagGroup: strip(x.flagGroup) } : x))
  return { ...form, fields: strip(form.fields) ?? [], pages: form.pages.map((p) => (p.fields ? { ...p, fields: strip(p.fields) } : p)) }
}
