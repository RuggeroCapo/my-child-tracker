import { create } from 'zustand'
import type { BabyEvent } from '@/domain/types'

export interface SyncCursor {
  updatedAt: string
  id: string
}

interface EventsState {
  byId: Record<string, BabyEvent>
  /** Cursore di sincronizzazione incrementale per bambino. */
  cursors: Record<string, SyncCursor>
  /** Applica righe provenienti dal server rispettando le modifiche locali in attesa. */
  applyServer: (rows: BabyEvent[], opts?: { force?: boolean; isPending?: (id: string) => boolean }) => void
  /** Modifica ottimistica locale. */
  setLocal: (event: BabyEvent) => void
  removeLocal: (id: string) => void
  setCursor: (babyId: string, cursor: SyncCursor) => void
  reset: (state?: Pick<EventsState, 'byId' | 'cursors'>) => void
}

/**
 * Regola di merge: una riga server sostituisce quella locale se la locale è
 * ottimistica (non ancora confermata) oppure se è più recente o uguale.
 * Le righe con operazioni ancora in coda vengono lasciate stare, a meno che
 * non si tratti della conferma dell'operazione stessa (`force`).
 */
export function shouldApply(existing: BabyEvent | undefined, incoming: BabyEvent): boolean {
  if (!existing) return true
  if (existing._local) return true
  return incoming.updated_at >= existing.updated_at
}

export const useEvents = create<EventsState>()((set) => ({
  byId: {},
  cursors: {},
  applyServer: (rows, opts) =>
    set((state) => {
      if (rows.length === 0) return state
      let byId: Record<string, BabyEvent> | null = null
      for (const row of rows) {
        if (!row || !row.id) continue
        const current = (byId ?? state.byId)[row.id]
        if (!opts?.force) {
          if (opts?.isPending?.(row.id)) continue
          if (!shouldApply(current, row)) continue
        }
        byId ??= { ...state.byId }
        byId[row.id] = row
      }
      return byId ? { byId } : state
    }),
  setLocal: (event) => set((state) => ({ byId: { ...state.byId, [event.id]: { ...event, _local: true } } })),
  removeLocal: (id) =>
    set((state) => {
      if (!state.byId[id]) return state
      const byId = { ...state.byId }
      delete byId[id]
      return { byId }
    }),
  setCursor: (babyId, cursor) =>
    set((state) => {
      const current = state.cursors[babyId]
      if (current && (current.updatedAt > cursor.updatedAt || (current.updatedAt === cursor.updatedAt && current.id >= cursor.id))) {
        return state
      }
      return { cursors: { ...state.cursors, [babyId]: cursor } }
    }),
  reset: (next) => set({ byId: next?.byId ?? {}, cursors: next?.cursors ?? {} }),
}))
