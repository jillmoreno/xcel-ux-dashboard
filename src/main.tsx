import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AccountProvider } from './context/AccountContext'
import { CtaTestProvider } from './context/CtaTestContext'
import { ThemeProvider } from './context/ThemeContext'
import './styles/tokens.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AccountProvider>
        <ThemeProvider>
          {/* OUTSIDE THE ROUTER'S PAGES, INSIDE THE ROUTER — the run is read
              once at mount and held (see `CtaTestContext`), so the provider has
              to sit above everything a participant can navigate to. It costs
              nothing when no `?dead=` is present: no listener is attached and
              the context is an empty set. */}
          <CtaTestProvider>
            <App />
          </CtaTestProvider>
        </ThemeProvider>
      </AccountProvider>
    </BrowserRouter>
  </StrictMode>,
)
