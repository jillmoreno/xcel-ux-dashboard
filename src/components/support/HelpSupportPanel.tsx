import { useState, type CSSProperties } from 'react'
import { LifeRing, MessageCircle, HelpCircle, Phone } from '@/icons'
import { useAccount } from '@/context/AccountContext'
import { supportConfigFor } from '@/data/support/supportFixtures'
import { SupportCard } from './SupportCard'
import { CustomerSupportSheet } from './CustomerSupportSheet'
import { LiveChatWidget } from './LiveChatWidget'

/**
 * Help & Support section body (Elite "Help & Support" screen), rendered by the
 * Dashboard Rebrand shell for `?section=support`. A grid of four entry cards:
 *   - Customer Support → the CustomerSupportSheet slide-over (issue form).
 *   - Live Chat        → the floating LiveChatWidget (topics → chat → end).
 *   - FAQs             → opens the brand's external FAQ page in a new tab.
 *   - Contact Us       → opens the brand's external contact page in a new tab.
 *
 * ⚠ CONTACT US STOPPED BEING A SHEET on 2026-10-07 (the direct ask). It opened
 * `ContactUsSheet`, which lists `phoneLines` — and XCEL's is EMPTY, the fixture
 * carrying a TODO saying the number is unknown and deliberately not invented.
 * So the only brand in the union opened a slide-over with nothing in it. The
 * card now behaves like FAQs: a brand-keyed URL, a new tab. `ContactUsSheet`
 * is kept, unreferenced — see ARCHIVED_ITEMS `support-contact-us-sheet`.
 *
 * Open to members AND non-members — support isn't gated. The section hero
 * ("Help & Support" + description) is owned by the shell's SectionShell.
 */
export function HelpSupportPanel() {
  const { brand } = useAccount()
  const { faqUrl, contactUrl } = supportConfigFor(brand)
  const [customerOpen, setCustomerOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  return (
    <div>
      <div style={gridStyle}>
        <SupportCard
          icon={LifeRing}
          title="Customer Support"
          description="Get help and answers to common questions."
          action="Get help"
          onSelect={() => setCustomerOpen(true)}
        />
        <SupportCard
          icon={MessageCircle}
          title="Live Chat"
          description="Talk via chat with a support representative."
          action="Get help"
          onSelect={() => setChatOpen(true)}
        />
        <SupportCard
          icon={HelpCircle}
          title="FAQs"
          description="Browse answers to frequently asked questions."
          action="Open FAQs"
          onSelect={() => window.open(faqUrl, '_blank', 'noopener,noreferrer')}
        />
        <SupportCard
          icon={Phone}
          title="Contact Us"
          /* ⚠ "BY PHONE" WENT WITH THE SHEET. It described what the slide-over
             listed; the contact page carries whatever routes the site offers,
             and promising a phone line is the one thing the fixture's TODO says
             nobody has confirmed. The action mirrors "Open FAQs" — the other
             card that leaves the product. */
          description="Reach our support team."
          action="Open contact page"
          onSelect={() => window.open(contactUrl, '_blank', 'noopener,noreferrer')}
        />
      </div>

      {/* Sheets stay mounted (toggling `open`) so their success toasts survive
          close. The chat widget mounts only while open — no toast to preserve,
          and a fresh mount resets its state cleanly. */}
      <CustomerSupportSheet open={customerOpen} onClose={() => setCustomerOpen(false)} />
      {chatOpen && <LiveChatWidget onClose={() => setChatOpen(false)} />}
    </div>
  )
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
  gap: 20,
  maxWidth: 1040,
  alignItems: 'stretch',
}
