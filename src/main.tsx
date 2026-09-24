import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { App } from './app/App'
import { initAuth } from './app/auth'
import { applyTheme, useUi } from './stores/ui'
import './styles/index.css'

applyTheme(useUi.getState().theme)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(useUi.getState().theme))
initAuth()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
