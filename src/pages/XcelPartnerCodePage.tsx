import { useEffect, type CSSProperties } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { StandaloneBrowserChrome } from '@/components/layout/BrowserChromeBar'
import { XcelFooter } from '@/components/e2e/XcelFooter'
import { XcelSiteHeader } from '@/components/e2e/XcelSiteHeader'
import { PartnerCodeAskPage, type PartnerCodeAnswer } from '@/components/e2e/PartnerCodeAsk'
import { PARTNER_CODE_PARAM, usePartnerCodeAsk } from '@/data/inviteFlows'
import { useEndToEndDemoParams, useEndToEndPageChrome } from './endToEndDemo'
import './inviteFlow.css'

/**
 * "Do you have a Partner Code?" AS ITS OWN STEP — the `page` arm of the
 * `partner-code-ask` toggle (2026-10-22), between the cart and the checkout.
 *
 * ⚠ THE QUESTION ITSELF IS NOT HERE. It is in `PartnerCodeAsk`, shared with the
 * modal arm, so the two presentations cannot drift into asking different
 * things — which is the only way a comparison between them means anything.
 * This file is the page AROUND it: the site's header, the footer, and the
 * answer's consequence.
 *
 * ⚠ IT REDIRECTS WHEN THE TOGGLE IS ON `modal`, rather than 404-ing or drawing
 * a question the current arm does not ask. A reviewer who flips the toggle
 * while standing on this page is asking for the other arm, and the other arm's
 * home is the checkout.
 */
export function XcelPartnerCodePage() {
  useEndToEndDemoParams()
  useEndToEndPageChrome('Partner Code | XCEL')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const ask = usePartnerCodeAsk()

  useEffect(() => {
    if (ask === 'modal') {
      navigate({ pathname: '/end-to-end-demo/checkout', search: params.toString() }, { replace: true })
    }
  }, [ask, navigate, params])
  if (ask === 'modal') return null

  const answer = (value: PartnerCodeAnswer) => {
    const next = new URLSearchParams(params)
    next.set(PARTNER_CODE_PARAM, value)
    /* Both answers go to the same place — the difference is what the checkout
       then charges. `replace`, so Back from the checkout leaves the flow rather
       than returning to a question that has been answered. */
    navigate({ pathname: '/end-to-end-demo/checkout', search: next.toString() }, { replace: true })
  }

  return (
    <div style={PAGE}>
      <StandaloneBrowserChrome />
      {/* ⚠ NO PARTNER-CODE BAR HERE. The page's entire content is the
          question; a bar across the top inviting a code answers it above
          itself. */}
      <XcelSiteHeader partnerBar={false} />
      <main style={MAIN}>
        <PartnerCodeAskPage onAnswer={answer} />
      </main>
      <XcelFooter />
    </div>
  )
}

const PAGE: CSSProperties = { minHeight: '100%', background: 'var(--color-fixed-light)' }

const MAIN: CSSProperties = { background: 'var(--color-fixed-light)' }
