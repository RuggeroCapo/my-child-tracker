import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { TransitionRouter } from './app/navTransition'
import { initAuth } from './app/auth'
import { applyTheme, useUi } from './stores/ui'
import './styles/index.css'

applyTheme(useUi.getState().theme)
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(useUi.getState().theme))
initAuth()
// Senza un ascoltatore touchstart Safari su iOS non applica :active: niente feedback alla pressione.
document.addEventListener('touchstart', () => {}, { passive: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TransitionRouter>
      <App />
    </TransitionRouter>
  </StrictMode>,
)
