import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AccountProvider } from './context/AccountContext'
import { ThemeProvider } from './context/ThemeContext'
import './styles/tokens.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AccountProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AccountProvider>
    </BrowserRouter>
  </StrictMode>,
)
