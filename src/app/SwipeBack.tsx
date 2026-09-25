import { useEffect } from 'react'
import { haptic } from '@/lib/haptics'
import { swipeBack } from './navTransition'

/** Il gesto parte solo da questa striscia sul bordo sinistro (px). */
const EDGE = 28
/** Oltre questa frazione di larghezza, o con uno scatto abbastanza veloce, si torna indietro. */
const COMMIT_RATIO = 0.35
const COMMIT_VELOCITY = 0.5 // px/ms
/** Prima di decidere se è un gesto orizzontale il dito deve muoversi di tanto così. */
const SLOP = 8

const isIOS =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1))

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface Gesture {
  id: number
  x0: number
  y0: number
  /** null finché non si capisce se è orizzontale; false = lasciato allo scroll. */
  horizontal: boolean | null
  dx: number
  lastX: number
  lastT: number
  velocity: number
  armed: boolean
  page: HTMLElement
  back: HTMLElement
}

/**
 * "Indietro" trascinando dal bordo sinistro, come nelle app native: la
 * schermata segue il dito e, superata la soglia, esce e torna quella di prima.
 * Rispecchia il pulsante indietro di PageHeader (data-swipe-back): dove non c'è,
 * non c'è neanche il gesto.
 *
 * Su iOS in Safari il browser ha già il suo gesto (e lo anima da sé): lì ci
 * attiviamo solo nell'app installata, dove altrimenti non esisterebbe.
 */
export function SwipeBack() {
  useEffect(() => {
    if (isIOS && !isStandalone()) return
    let g: Gesture | null = null

    function clear(page: HTMLElement) {
      page.style.removeProperty('transform')
      page.style.removeProperty('transition')
      page.style.removeProperty('will-change')
      page.classList.remove('swipe-back-edge')
    }

    function settle(page: HTMLElement, transition: string, transform: string, then: () => void) {
      if (reducedMotion()) return then()
      page.style.transition = transition
      page.style.transform = transform
      let finished = false
      const finish = () => {
        if (finished) return
        finished = true
        page.removeEventListener('transitionend', onTransitionEnd)
        then()
      }
      const onTransitionEnd = (e: TransitionEvent) => {
        if (e.target === page) finish()
      }
      page.addEventListener('transitionend', onTransitionEnd)
      // Se la transizione non parte (valore identico, scheda in background) non restiamo appesi.
      setTimeout(finish, 500)
    }

    function onStart(e: TouchEvent) {
      if (g || e.touches.length !== 1) return
      const t = e.touches[0]
      if (t.clientX > EDGE) return
      const target = e.target as Element | null
      // Fogli aperti e superfici che gestiscono già il proprio trascinamento (grafici) vincono.
      if (document.querySelector('[aria-modal="true"]') || target?.closest('.touch-none, [data-no-swipe-back]')) return
      const back = document.querySelector<HTMLElement>('[data-swipe-back]')
      const page = back?.closest<HTMLElement>('.vt-page')
      if (!back || !page) return
      g = { id: t.identifier, x0: t.clientX, y0: t.clientY, horizontal: null, dx: 0, lastX: t.clientX, lastT: e.timeStamp, velocity: 0, armed: false, page, back }
    }

    function onMove(e: TouchEvent) {
      if (!g || g.horizontal === false) return
      const t = Array.from(e.changedTouches).find((x) => x.identifier === g!.id)
      if (!t) return
      const dx = t.clientX - g.x0
      const dy = t.clientY - g.y0
      if (g.horizontal === null) {
        if (Math.hypot(dx, dy) < SLOP) return
        g.horizontal = dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.2
        if (!g.horizontal) {
          g = null
          return
        }
        g.page.style.transition = 'none'
        g.page.style.willChange = 'transform'
        g.page.classList.add('swipe-back-edge')
      }
      if (e.cancelable) e.preventDefault()
      const dt = Math.max(1, e.timeStamp - g.lastT)
      // Velocità smussata sugli ultimi movimenti: conta lo scatto finale, non la media.
      g.velocity = 0.6 * ((t.clientX - g.lastX) / dt) + 0.4 * g.velocity
      g.lastX = t.clientX
      g.lastT = e.timeStamp
      g.dx = Math.max(0, dx)
      g.page.style.transform = `translateX(${g.dx}px)`
      const armed = g.dx > window.innerWidth * COMMIT_RATIO
      if (armed !== g.armed) {
        g.armed = armed
        if (armed) haptic('tick')
      }
    }

    function onEnd(e: TouchEvent) {
      if (!g) return
      const cur = g
      if (!Array.from(e.changedTouches).some((x) => x.identifier === cur.id)) return
      g = null
      if (!cur.horizontal) return
      const width = window.innerWidth
      const commit =
        e.type === 'touchend' &&
        (cur.dx > width * COMMIT_RATIO || (cur.velocity > COMMIT_VELOCITY && cur.dx > 32))
      const { page, back } = cur
      if (commit) {
        // Esce alla velocità del dito (mai sotto i 120ms né oltre i 260ms), poi si naviga.
        const remaining = width - cur.dx
        const ms = Math.round(Math.min(260, Math.max(120, remaining / Math.max(cur.velocity, 1.2))))
        settle(page, `transform ${ms}ms var(--ease-out-quart)`, `translateX(${width}px)`, () =>
          swipeBack(() => back.click(), () => clear(page)),
        )
      } else {
        settle(page, 'transform var(--spring-ms) var(--ease-spring)', 'translateX(0px)', () => clear(page))
      }
    }

    const opts = { passive: false } as const
    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, opts)
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onEnd)
    }
  }, [])

  return null
}
