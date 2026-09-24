import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/**
 * Orologio allineato al server: i timer sono calcolati come
 * `serverNow() - started_at`, quindi due dispositivi mostrano lo stesso tempo
 * anche se i loro orologi non sono sincronizzati.
 */
let offsetMs = 0

export function serverNow(): number {
  return Date.now() + offsetMs
}

export function serverNowIso(): string {
  return new Date(serverNow()).toISOString()
}

export async function syncServerClock(): Promise<void> {
  const t0 = Date.now()
  const { data, error } = await supabase.rpc('server_now')
  const t1 = Date.now()
  if (error || !data) return
  // Scarta misure con latenza eccessiva (rete lenta): poco affidabili.
  if (t1 - t0 > 3000) return
  offsetMs = Date.parse(data) - (t0 + t1) / 2
}

const listeners = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribe(fn: () => void) {
  listeners.add(fn)
  if (!timer) timer = setInterval(() => listeners.forEach((l) => l()), 1000)
  return () => {
    listeners.delete(fn)
    if (listeners.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

/** Ora corrente (allineata al server) aggiornata ogni secondo. */
export function useNow(enabled = true): number {
  const [now, setNow] = useState(serverNow)
  useEffect(() => {
    if (!enabled) return
    return subscribe(() => setNow(serverNow()))
  }, [enabled])
  return now
}
