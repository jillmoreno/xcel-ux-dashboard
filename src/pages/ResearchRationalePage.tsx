import { useEffect } from 'react'
import { PrototypeBar } from '@/components/layout/PrototypeBar'

/**
 * Research & Rationale — embeds the standalone UX research / decision hub
 * (served from `public/research-rationale/index.html`) INSIDE the prototype
 * frame, so it opens in-context with the Common Dashboard chrome + a "Back"
 * to the overview, instead of a raw browser tab. Mirrors the QuestionList
 * iframe pattern in PrototypeHandoffDetailPage.
 */
export function ResearchRationalePage() {
  useEffect(() => {
    document.title = 'Research & Rationale — UX Prototype'
  }, [])

  const src = `${import.meta.env.BASE_URL}research-rationale/index.html`

  return (
    <div
      className="cre-prototype-stc-accent"
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--color-surface-page)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <PrototypeBar
        showHomeLink={false}
        back={{ to: '/', label: 'Back', title: 'Back to overview' }}
      />
      <iframe
        title="UX Research & Rationale"
        src={src}
        style={{ flex: '1 1 auto', width: '100%', minHeight: 0, border: 'none', display: 'block' }}
      />
    </div>
  )
}
