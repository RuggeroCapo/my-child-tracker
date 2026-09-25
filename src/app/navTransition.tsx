import { lazy, startTransition, useLayoutEffect, useState, type ComponentType, type ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { Router, UNSAFE_createBrowserHistory, type Location, type NavigationType } from 'react-router'

/**
 * Transizioni di schermata con la View Transitions API.
 *
 * Non usiamo <ViewTransition> di React: React rende sincroni gli aggiornamenti
 * dentro `popstate` e così il "indietro" non si animerebbe mai. Qui è il router
 * stesso ad aprire `document.startViewTransition`, per avanti, indietro e schede.
 * Il CSS (index.css) legge la direzione da <html data-nav> e anima gli elementi
 * con `view-transition-name: page` (classe .vt-page) e `tab-bar` (.vt-tab-bar).
 */

export type NavDirection = 'forward' | 'back' | 'tab' | 'none'

export const TAB_PATHS = ['/', '/diary', '/stats', '/more']

/** Profondità di una schermata: le schede stanno a 0, i dettagli scendono con il percorso. */
function depth(pathname: string) {
  if (TAB_PATHS.includes(pathname)) return 0
  return pathname.split('/').filter(Boolean).length
}

export function navDirection(from: Location, to: Location, type: NavigationType): NavDirection {
  if (from.pathname === to.pathname) return 'none'
  const a = depth(from.pathname)
  const b = depth(to.pathname)
  if (a === 0 && b === 0) return 'tab'
  if (b > a) return 'forward'
  if (b < a) return 'back'
  // Stessa profondità: un replace (es. cambio lato) non è un cambio di schermata.
  if (type === 'REPLACE') return 'none'
  return type === 'POP' ? 'back' : 'forward'
}

function canAnimate() {
  return (
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** Il browser ha già animato questo "indietro" (swipe su iOS, predictive back su Android). */
function browserAnimated() {
  const e = window.event
  return e instanceof PopStateEvent && e.hasUAVisualTransition === true
}

/** Posizione di scroll per voce di cronologia: il ripristino lo facciamo noi, dopo il cambio di DOM. */
const scrollByKey = new Map<string, number>()

/** Come <BrowserRouter>, ma ogni cambio di schermata passa da una View Transition. */
export function TransitionRouter({ children }: { children: ReactNode }) {
  const [history] = useState(() => UNSAFE_createBrowserHistory({ v5Compat: true }))
  const [state, setState] = useState({
    action: history.action,
    location: history.location,
    scrollTo: null as number | null,
  })

  useLayoutEffect(() => {
    window.history.scrollRestoration = 'manual'
    let current = history.location
    return history.listen(({ action, location }) => {
      const from = current
      current = location
      scrollByKey.set(from.key, window.scrollY)
      const dir = navDirection(from, location, action)
      // Schermata nuova dall'alto; tornando indietro, dov'eravamo.
      const scrollTo = dir === 'none' ? null : action === 'POP' ? (scrollByKey.get(location.key) ?? 0) : 0
      const next = { action, location, scrollTo }

      if (dir === 'none' || !canAnimate() || browserAnimated()) {
        startTransition(() => setState(next))
        return
      }
      document.documentElement.dataset.nav = dir
      const done = () => {
        if (current === location) delete document.documentElement.dataset.nav
      }
      // Il callback gira dopo la foto della schermata vecchia: il DOM nuovo va scritto subito.
      document.startViewTransition(() => flushSync(() => setState(next))).finished.then(done, done)
    })
  }, [history])

  // Dentro flushSync gira ancora nel callback della transizione, prima della foto nuova.
  useLayoutEffect(() => {
    if (state.scrollTo !== null) window.scrollTo(0, state.scrollTo)
  }, [state])

  return (
    <Router location={state.location} navigationType={state.action} navigator={history}>
      {children}
    </Router>
  )
}

/**
 * React.lazy che si può precaricare. Una volta caricato il modulo renderizza il
 * componente direttamente: dentro una View Transition (flushSync) un lazy
 * sospeso mostrerebbe il loader a tutto schermo invece della pagina.
 */
export function lazyPage<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let Loaded: ComponentType<P> | undefined
  let pending: Promise<ComponentType<P>> | undefined
  const preload = () =>
    (pending ??= load().then((m) => {
      Loaded = m.default
      return m.default
    }))
  const Lazy = lazy(() => preload().then((C) => ({ default: C })))
  function LazyPage(props: P) {
    // Scelto una volta per montaggio: cambiare tipo a metà rimonterebbe la pagina.
    const [C] = useState(() => Loaded ?? Lazy)
    return <C {...props} />
  }
  LazyPage.preload = preload
  return LazyPage
}

/** Precarica le pagine quando il browser è libero, così la prima apertura anima subito. */
export function preloadWhenIdle(pages: { preload: () => Promise<unknown> }[]) {
  const run = () => void Promise.all(pages.map((p) => p.preload())).catch(() => {})
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, 1500)
}
