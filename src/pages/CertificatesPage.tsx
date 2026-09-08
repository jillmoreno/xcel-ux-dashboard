import { useMemo, useState, type CSSProperties } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CircleExclamation, Plus } from '@/icons'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterAccordion } from '@/components/catalog/FilterAccordion'
import { PillTabs, type PillTabItem } from '@/components/ui/PillTabs'
import { CertificateCard } from '@/components/certificates/CertificateCard'
import { CertificateActionPanel } from '@/components/certificates/CertificateActionPanel'
import { useAccount } from '@/context/AccountContext'
import { certificatesFor, type CertificateStatus } from '@/data/certificateFixtures'

type Tab = CertificateStatus

const SORT_OPTIONS = [
  { value: 'recent', label: 'Completion Date' },
  { value: 'alpha', label: 'Alphabetical' },
]

const TAB_LABELS: Record<Tab, string> = {
  'action-required': 'Action Required',
  completed: 'Certificates Issued',
  external: 'External Certificates',
}

export function CertificatesPage({
  embedded = false,
  hideSearch = false,
}: { embedded?: boolean; hideSearch?: boolean } = {}) {
  const { brand } = useAccount()
  const all = useMemo(() => certificatesFor(brand), [brand])
  const [params, setParams] = useSearchParams()
  const [detailId, setDetailId] = useState<string | null>(null)

  const search = params.get('q') ?? ''
  const sort = params.get('sort') ?? 'recent'

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { 'action-required': 0, completed: 0, external: 0 }
    for (const cert of all) c[cert.status] += 1
    return c
  }, [all])

  // Action Required tab only appears when something needs an action.
  const tabs: PillTabItem<Tab>[] = [
    ...(counts['action-required'] > 0
      ? [{ id: 'action-required' as Tab, label: TAB_LABELS['action-required'] }]
      : []),
    { id: 'completed', label: TAB_LABELS.completed },
    { id: 'external', label: TAB_LABELS.external },
  ]
  const requested = params.get('status') as Tab | null
  const tab: Tab = requested && tabs.some((t) => t.id === requested) ? requested : 'completed'

  // State filter (the only wired accordion; the rest are visual placeholders
  // matching the design's filter rail, like My Courses).
  const stateParam = params.get('state')
  const selectedStates = new Set(stateParam ? stateParam.split(',') : [])
  const allStates = useMemo(
    () => Array.from(new Set(all.map((c) => c.state))).sort(),
    [all],
  )

  const setParam = (key: string, value: string | null) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value == null || value === '') next.delete(key)
        else next.set(key, value)
        return next
      },
      { replace: true },
    )
  }

  const toggleState = (s: string) => {
    const next = new Set(selectedStates)
    if (next.has(s)) next.delete(s)
    else next.add(s)
    setParam('state', next.size === 0 ? null : Array.from(next).join(','))
  }

  const filtered = useMemo(() => {
    let list = all.filter((c) => c.status === tab)
    if (selectedStates.size > 0) list = list.filter((c) => selectedStates.has(c.state))
    if (search) list = list.filter((c) => c.title.toLowerCase().includes(search.toLowerCase()))
    list = [...list]
    if (sort === 'alpha') list.sort((a, b) => a.title.localeCompare(b.title))
    else list.sort((a, b) => b.completedDate.localeCompare(a.completedDate))
    return list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, tab, stateParam, search, sort])

  const detailRecord = all.find((c) => c.id === detailId) ?? null

  return (
    <div style={{ padding: embedded ? '0 0 64px' : '24px 64px 64px', width: '100%' }}>
      <PageHeader
        title="Certificates"
        hideTitle={embedded}
        right={
          // In the rebrand shell the section hero carries the search, so the
          // embedded page drops its own (mirrors the Resource Library panel).
          hideSearch ? undefined : (
            <SearchInput
              label="Search certificates"
              placeholder="Search certificates"
              value={search}
              onChange={(e) => setParam('q', e.target.value)}
              style={{ width: 360 }}
            />
          )
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '200px minmax(0, 1fr)', gap: 24, marginTop: 24 }}>
        <aside aria-label="Certificate filters" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            {filtered.length} Result{filtered.length === 1 ? '' : 's'}
          </p>
          <div>
            <label style={sortLabelStyle}>Sort By</label>
            <Select
              label="Sort by"
              options={SORT_OPTIONS}
              value={sort}
              onChange={(e) => setParam('sort', e.target.value === 'recent' ? null : e.target.value)}
              style={{ width: '100%' }}
              valueWeight={400}
            />
          </div>
          <div>
            <FilterAccordion label="Profession" />
            <FilterAccordion label="State" activeCount={selectedStates.size}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {allStates.map((s) => (
                  <Checkbox
                    key={s}
                    label={s}
                    value={s}
                    checked={selectedStates.has(s)}
                    onChange={() => toggleState(s)}
                  />
                ))}
              </div>
            </FilterAccordion>
            <FilterAccordion label="Course Type" />
            <FilterAccordion label="Completion Date" />
            <FilterAccordion label="Credit Type" />
            <FilterAccordion label="Reported" />
          </div>
        </aside>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={tabRowStyle}>
            <PillTabs
              label="Filter certificates by status"
              items={tabs}
              active={tab}
              onChange={(v) => setParam('status', v === 'completed' ? null : v)}
            />
            {tab === 'external' && (
              <button type="button" onClick={() => console.info('cert:add-external')} style={addExternalStyle}>
                Add External Certificate
                <Plus size={16} aria-hidden />
              </button>
            )}
          </div>

          {tab === 'action-required' && (
            <div style={warningBannerStyle}>
              <CircleExclamation size={18} aria-hidden style={{ flexShrink: 0 }} />
              <span>
                The following certificates require an action. Please view the certificate details for more
                information.
              </span>
            </div>
          )}

          {tab === 'external' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <p style={noteStyle}>
                Add qualifying external certificates such as courses, seminars, and conferences taken outside
                Colibri.
              </p>
              <p style={noteStyle}>
                <strong style={{ color: 'var(--color-text-primary)' }}>Note:</strong> Colibri is not responsible
                for reporting external certificates.
              </p>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              title="No certificates here"
              description="Try clearing a filter, or check another tab."
            />
          ) : (
            <div role="list" style={gridStyle}>
              {filtered.map((cert) => (
                // `display: grid` makes the card stretch to fill the
                // equal-height grid cell (its single child defaults to
                // stretch), so every card matches the tallest in its row.
                <div key={cert.id} role="listitem" style={{ display: 'grid' }}>
                  <CertificateCard data={cert} onOpen={setDetailId} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CertificateActionPanel open={detailId != null} onClose={() => setDetailId(null)} data={detailRecord} />
    </div>
  )
}

const sortLabelStyle: CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  marginBottom: 6,
}

const tabRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  flexWrap: 'wrap',
}

const addExternalStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-body)',
  fontSize: 14,
  fontWeight: 600,
  color: 'var(--color-action)',
}

const warningBannerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-warning-100)',
  color: 'var(--color-warning-800)',
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontWeight: 500,
}

const noteStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  color: 'var(--color-text-secondary)',
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
  gap: 20,
  // Equal-height rows: every row sizes to the tallest card (e.g. one whose
  // title wraps to two lines), so all certificate cards stay a consistent
  // height instead of one row being taller than the rest.
  gridAutoRows: '1fr',
}
