import { useContext } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AccountContext } from '@/context/AccountContext'
import { useFeatureFlag } from '@/context/FeatureFlagContext'
import { isE2ELikeVersion, resolveDashboardVersion } from '@/data/dashboardVersions'

/**
 * THE ACCOUNT PAGES IN THE LEARNING PAGES' CLOTHES — 2026-11-03, Eric's
 * request: Profile, Notifications, Transcripts and My Purchases styled as My
 * Certificates is, with the account nav as a Quick Links-style card in Quick
 * Links' place. On the baseline versions (Jill/Atlas-Main and the End-to-End
 * Demo), behind the design control `atlas-account-quick-links`.
 *
 * ⚠ ONE HOOK, READ BY THREE PLACES — `useSectionBreadcrumb` (the header),
 * the shell's section gutter and `SectionContent`'s account layout — so the
 * header, the gutter and the nav card cannot disagree about which pages
 * changed. The context rather than `useAccount`, so it reads `false` instead
 * of throwing where there is no AccountProvider.
 */
export function useAtlasAccountPages(): boolean {
  const on = useFeatureFlag('atlas-account-quick-links').enabled
  const [params] = useSearchParams()
  const account = useContext(AccountContext)
  if (!on || !account) return false
  return isE2ELikeVersion(resolveDashboardVersion(params.get('version'), account.brand))
}
