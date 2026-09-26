import { useEffect } from 'react'
import type { EventOf } from '@/domain/types'
import { BREAST_SIDE_LABEL } from '@/i18n/it'
import { serverNow } from '@/lib/clock'
import { formatTime } from '@/lib/time'
import { useActiveBaby } from '@/stores/babies'
import { useActiveSession } from '@/stores/selectors'
import { useSession } from '@/stores/session'
import { endSession, findActiveSession, switchBreastSide } from '@/sync/actions'

/**
 * Allattamento in corso sulla schermata di blocco.
 *
 * Una PWA non può disegnare sul lock screen, ma può comparire come "in riproduzione":
 * un audio muto in loop tiene viva la sessione multimediale, la Media Session API
 * mostra lato e orario d'inizio, e la barra di avanzamento conta la durata da sola
 * (anche con JS sospeso). Pausa = Termina, traccia successiva = cambio lato.
 */

let audio: HTMLAudioElement | null = null

function silentWavUrl(seconds: number): string {
  // PCM 16 bit mono a 8 kHz: tutti zeri. Chrome mostra i controlli solo per media > 5 s.
  const rate = 8000
  const dataBytes = rate * seconds * 2
  const view = new DataView(new ArrayBuffer(44 + dataBytes))
  const ascii = (at: number, s: string) => [...s].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)))
  ascii(0, 'RIFF')
  view.setUint32(4, 36 + dataBytes, true)
  ascii(8, 'WAVE')
  ascii(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, rate, true)
  view.setUint32(28, rate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  ascii(36, 'data')
  view.setUint32(40, dataBytes, true)
  return URL.createObjectURL(new Blob([view], { type: 'audio/wav' }))
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(silentWavUrl(10))
    audio.loop = true
  }
  return audio
}

/**
 * Da chiamare dentro il tap che avvia l'allattamento: iOS lascia partire l'audio
 * solo durante un gesto dell'utente, poi l'elemento resta sbloccato.
 */
export function primeLockScreenAudio() {
  if (!('mediaSession' in navigator)) return
  getAudio().play().catch(() => {})
}

const HANDLED = ['play', 'pause', 'nexttrack', 'seekto'] as const

function applyPosition(startedAt: string) {
  const elapsed = Math.max(0, (serverNow() - Date.parse(startedAt)) / 1000)
  // Durata "a scaglioni" di un'ora: a sinistra il tempo trascorso, a destra quanto manca all'ora.
  const duration = 3600 * Math.ceil((elapsed + 60) / 3600)
  try {
    navigator.mediaSession.setPositionState({ duration, position: elapsed, playbackRate: 1 })
  } catch {
    // Browser senza setPositionState: restano titolo e orario d'inizio.
  }
}

/** Montato una sola volta nell'app: segue l'allattamento in corso del bambino attivo. */
export function useFeedingLockScreen() {
  const baby = useActiveBaby()
  const active = useActiveSession(baby?.id, 'breastfeeding')
  const me = useSession((s) => s.session?.user.id)
  const babyId = baby?.id
  const activeId = active?.id ?? null
  const side = active?.details.side
  const startedAt = active?.started_at
  const startedByMe = !!active && active.created_by === me

  useEffect(() => {
    if (!('mediaSession' in navigator) || !babyId || !activeId || !side || !startedAt) return
    const session = navigator.mediaSession
    const el = getAudio()
    // Solo sul telefono di chi l'ha avviata (o dove è già in riproduzione, es. dopo un cambio lato
    // fatto dall'altro genitore): l'audio prende il controllo e interromperebbe la sua musica.
    if (el.paused && !startedByMe) return

    session.metadata = new MediaMetadata({
      title: `Allattamento · ${BREAST_SIDE_LABEL[side]}`,
      artist: `Dalle ${formatTime(startedAt)}`,
      album: baby?.name ?? '',
      artwork: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    })
    session.playbackState = 'playing'

    // Letta dallo store al momento del tocco: l'effetto non dipende dall'intero evento.
    const current = () => findActiveSession(babyId, 'breastfeeding') as EventOf<'breastfeeding'> | undefined
    const refresh = () => applyPosition(startedAt)
    session.setActionHandler('play', () => {
      el.play().catch(() => {})
      session.playbackState = 'playing'
      refresh()
    })
    session.setActionHandler('pause', () => {
      const event = current()
      el.pause()
      if (event) endSession(event)
    })
    session.setActionHandler('nexttrack', () => {
      const event = current()
      if (event) switchBreastSide(event)
    })
    // Il tempo non si sposta a mano: la barra torna subito dov'era.
    session.setActionHandler('seekto', refresh)

    // Audio non sbloccato (es. app riaperta, sessione avviata da Alexa): riparte al primo tocco.
    let armed = false
    let disposed = false
    const resumeOnTap = () => {
      armed = false
      el.play().then(refresh, () => {})
    }
    if (el.paused) {
      el.play().then(refresh, () => {
        if (disposed) return
        armed = true
        document.addEventListener('pointerdown', resumeOnTap, { once: true, capture: true })
      })
    }
    refresh()
    el.addEventListener('playing', refresh)
    const tick = setInterval(refresh, 15_000)

    return () => {
      disposed = true
      clearInterval(tick)
      el.removeEventListener('playing', refresh)
      if (armed) document.removeEventListener('pointerdown', resumeOnTap, { capture: true })
      for (const action of HANDLED) session.setActionHandler(action, null)
      // Il cambio lato rimonta l'effetto: l'audio continua, cambiano solo i metadati.
      if (!current()) {
        el.pause()
        session.metadata = null
        session.playbackState = 'none'
      }
    }
  }, [babyId, activeId, side, startedAt, startedByMe, baby?.name])
}
