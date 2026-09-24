import { supabase } from '@/lib/supabase'
import { useSession } from '@/stores/session'
import { startSync, stopSync } from '@/sync/engine'

let initialized = false

/** Collega Supabase Auth allo store di sessione e al motore di sincronizzazione. */
export function initAuth() {
  if (initialized) return
  initialized = true

  supabase.auth.onAuthStateChange((event, session) => {
    const prev = useSession.getState().session?.user.id ?? null
    const next = session?.user.id ?? null
    useSession.getState().set({
      session,
      ready: true,
      ...(event === 'PASSWORD_RECOVERY' ? { recovering: true } : {}),
    })
    if (next && next !== prev) {
      // Fuori dal callback: evita deadlock con le chiamate a supabase-js.
      setTimeout(() => void startSync(next), 0)
    } else if (!next && prev) {
      setTimeout(() => void stopSync({ clearLocal: event === 'SIGNED_OUT' }), 0)
    }
  })
}

export async function signOut() {
  await stopSync({ clearLocal: true })
  await supabase.auth.signOut({ scope: 'local' })
}
