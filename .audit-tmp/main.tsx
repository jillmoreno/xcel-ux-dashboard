import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import App from '@/App'
import { AccountProvider } from '@/context/AccountContext'
import { CtaTestProvider } from '@/context/CtaTestContext'
import { ThemeProvider } from '@/context/ThemeContext'
import '@/styles/tokens.css'

// Scratch entry for the UX audit only. Initial route comes from the hash so
// the same static build can open any product URL: #/dashboard-rebrand?demo=1...
const initial = window.location.hash.slice(1) || '/dashboard-rebrand?demo=1&section=compass&ff=compass-mvp-version:refined'
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MemoryRouter initialEntries={[initial]}>
      <AccountProvider><ThemeProvider><CtaTestProvider><App /></CtaTestProvider></ThemeProvider></AccountProvider>
    </MemoryRouter>
  </StrictMode>,
)
