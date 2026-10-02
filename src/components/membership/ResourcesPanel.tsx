import type { CSSProperties } from 'react'
import { useAccount } from '@/context/AccountContext'
import { resourcesFor } from '@/data/membership/resourcesFixtures'
import { ResourceCard } from './ResourceCard'

/**
 * Free Content panel — the Dashboard Rebrand shell's "Free Content" rail
 * section. Mirrors `PartnerOfferingsPanel`: an auto-fill grid of cards, each an
 * outbound link (blog, podcast, …) rendered by `ResourceCard`.
 *
 * Members and non-members see the IDENTICAL page — there is no non-member variant
 * and no `locked` prop, because everything on it is free. That is the point of
 * the section, so a gate here would be a contradiction rather than a
 * restriction. (It used to take `locked={!isMember}` and show a "Member
 * Exclusive" pill on any resource without an `openToAll` flag, which locked
 * Fitzgerald's genuinely free NP podcasts away from non-members.)
 */
export function ResourcesPanel({
  compass = false,
}: {
  /** The Atlas/Compass version's treatment (2026-10-01) — the shell passes
   *  it; see `ResourceCard`'s `compass`. */
  compass?: boolean
} = {}) {
  const { brand } = useAccount()
  const resources = resourcesFor(brand)

  return (
    <section
      aria-label="Free Content"
      style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
    >
      {resources.length === 0 ? (
        <p style={emptyStyle}>No resources published for this brand yet.</p>
      ) : (
        <div role="list" style={compass ? { ...gridStyle, gap: 20 } : gridStyle}>
          {resources.map((resource) => (
            <div key={resource.id} role="listitem">
              <ResourceCard data={resource} compass={compass} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ─── styles (mirror PartnerOfferingsPanel) ────────────────────────── */

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 265px)',
  gap: 16,
}

const emptyStyle: CSSProperties = {
  margin: 0,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  fontStyle: 'italic',
  color: 'var(--color-text-tertiary)',
}
