import type { Session } from '@supabase/supabase-js'
import { create } from 'zustand'

interface SessionState {
  session: Session | null
  /** true quando lo stato di autenticazione iniziale è noto. */
  ready: boolean
  /** true dopo il link "recupera password": mostra la schermata di reset. */
  recovering: boolean
  set: (s: Partial<Omit<SessionState, 'set'>>) => void
}

export const useSession = create<SessionState>()((set) => ({
  session: null,
  ready: false,
  recovering: false,
  set: (s) => set(s),
}))

export function useUserId(): string | null {
  return useSession((s) => s.session?.user.id ?? null)
}
