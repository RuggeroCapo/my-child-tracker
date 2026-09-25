/**
 * Vibrazioni brevissime come conferma tattile, solo dove aiutano davvero:
 * un evento salvato o una sessione avviata senza guardare lo schermo, una
 * scelta che scatta, un gesto che supera la soglia. Mai per richiamare
 * l'attenzione, mai per eventi che arrivano dall'altro genitore.
 *
 * Android usa `navigator.vibrate`. Safari su iOS non lo supporta: da iOS 18 un
 * clic sull'etichetta di un `<input switch>` produce lo stesso "tic" del
 * sistema, e lo usiamo al suo posto (i pattern diventano uno o più tic).
 */

export type Haptic =
  /** Una scelta che scatta: segmento, rotella, soglia di un gesto. */
  | 'tick'
  /** Un'azione leggera: cambio lato, annulla. */
  | 'tap'
  /** Registrato: salvataggio, avvio o fine di una sessione. */
  | 'success'
  /** Un'azione che toglie qualcosa: eliminazione. */
  | 'warning'
  /** Non è andata: dato non valido. */
  | 'error'

/** Durate in ms (vibra, pausa, vibra...): corte e morbide, niente ronzii. */
const PATTERN: Record<Haptic, number | number[]> = {
  tick: 5,
  tap: 9,
  success: [8, 60, 12],
  warning: [14, 80, 8],
  error: [10, 50, 10, 50, 10],
}
const IOS_TICKS: Record<Haptic, number> = { tick: 1, tap: 1, success: 2, warning: 2, error: 3 }
const IOS_TICK_GAP = 110

const PREF_KEY = 'bebe-haptics'
/** Tic ravvicinati (rotella veloce) oltre questa frequenza si perdono: il motore non li distingue. */
const TICK_MIN_GAP = 35
/** Due conferme in fila per lo stesso gesto (es. salva + dettagli) diventano una. */
const FEEDBACK_MIN_GAP = 250

const canVibrate = typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
const canSwitchTick =
  !canVibrate &&
  typeof HTMLInputElement !== 'undefined' &&
  'switch' in HTMLInputElement.prototype &&
  typeof navigator !== 'undefined' &&
  navigator.maxTouchPoints > 0

export const hapticsSupported = canVibrate || canSwitchTick

let enabled = readPref()
let lastTick = 0
let lastFeedback = 0

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off'
  } catch {
    return true
  }
}

export function hapticsEnabled() {
  return enabled
}

export function setHapticsEnabled(on: boolean) {
  enabled = on
  try {
    if (on) localStorage.removeItem(PREF_KEY)
    else localStorage.setItem(PREF_KEY, 'off')
  } catch {
    // ignore
  }
}

function switchTick() {
  const label = document.createElement('label')
  label.ariaHidden = 'true'
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.head.appendChild(label)
  label.click()
  label.remove()
}

export function haptic(kind: Haptic) {
  if (!enabled || !hapticsSupported || typeof document === 'undefined' || document.visibilityState !== 'visible') return
  // Chrome rifiuta (e segnala in console) le vibrazioni prima del primo tocco.
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
  const now = performance.now()
  if (kind === 'tick') {
    if (now - lastTick < TICK_MIN_GAP) return
    lastTick = now
  } else {
    if (now - lastFeedback < FEEDBACK_MIN_GAP) return
    lastFeedback = now
  }
  try {
    if (canVibrate) {
      navigator.vibrate(PATTERN[kind])
      return
    }
    switchTick()
    for (let i = 1; i < IOS_TICKS[kind]; i++) setTimeout(switchTick, i * IOS_TICK_GAP)
  } catch {
    // Un feedback mancato non deve mai rompere l'azione che l'ha chiesto.
  }
}
