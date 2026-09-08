import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DASHBOARD_VERSIONS,
  readDefaultDashboardVersion,
  type DashboardVersionId,
} from '@/data/dashboardVersions'
import { DashboardV1 } from '@/components/dashboard/versions/DashboardV1'
import { DashboardV2 } from '@/components/dashboard/versions/DashboardV2'
import { DashboardV3 } from '@/components/dashboard/versions/DashboardV3'
import { DashboardV4 } from '@/components/dashboard/versions/DashboardV4'
import { DashboardV5 } from '@/components/dashboard/versions/DashboardV5'
import { DashboardMVP } from '@/components/dashboard/versions/DashboardMVP'

// The selected dashboard version persists across navigations: switching
// to V2 and clicking away to Catalog / My Learning shouldn't drop the
// learner back on V1 when they return to /dashboard. The URL param stays
// the override (so deep links like /dashboard?version=v2 still work for
// sharing), but in its absence we read the last-chosen version from
// localStorage instead of falling back to the global default.
const STORAGE_KEY = 'cgp.dashboard.version'

function isValidVersion(value: string | null): value is DashboardVersionId {
  return value != null && DASHBOARD_VERSIONS.some((v) => v.id === value)
}

function readStoredVersion(): DashboardVersionId | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return isValidVersion(raw) ? raw : null
  } catch {
    return null
  }
}

export function DashboardPage() {
  const [params] = useSearchParams()
  const requested = params.get('version')
  const urlVersion: DashboardVersionId | null = isValidVersion(requested) ? requested : null

  // Whenever the URL explicitly carries a version, remember it so
  // future visits to /dashboard (no query string) land on the same one.
  useEffect(() => {
    if (urlVersion == null) return
    try {
      window.localStorage.setItem(STORAGE_KEY, urlVersion)
    } catch {
      // Ignore quota / private-mode errors — URL still drives this paint.
    }
  }, [urlVersion])

  const version: DashboardVersionId =
    urlVersion ?? readStoredVersion() ?? readDefaultDashboardVersion()

  switch (version) {
    case 'mvp':
      return <DashboardMVP />
    case 'v5':
      return <DashboardV5 />
    case 'v4':
      return <DashboardV4 />
    case 'v3':
      return <DashboardV3 />
    case 'v2':
      return <DashboardV2 />
    case 'v1':
    default:
      return <DashboardV1 />
  }
}
