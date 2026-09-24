import { create } from 'zustand'
import type { DetailsByKind, EventInput, TimedKind } from '@/domain/types'

interface OpBase {
  opId: string
  eventId: string
  /** Date.now() al momento dell'accodamento. */
  queuedAt: number
}

export type OutboxOp =
  | (OpBase & { type: 'upsert'; input: EventInput; useServerTime?: boolean })
  | (OpBase & {
      type: 'start'
      babyId: string
      kind: TimedKind
      details: DetailsByKind[TimedKind]
      startedAt: string
    })
  | (OpBase & { type: 'end'; endedAt: string; details?: Record<string, unknown> })
  | (OpBase & { type: 'switch'; newEventId: string; at: string })
  | (OpBase & { type: 'delete' })
  | (OpBase & { type: 'restore' })

export function opTouches(op: OutboxOp, eventId: string): boolean {
  return op.eventId === eventId || (op.type === 'switch' && op.newEventId === eventId)
}

interface OutboxState {
  ops: OutboxOp[]
  enqueue: (op: OutboxOp) => void
  remove: (opId: string) => void
  /** Scarta tutte le operazioni che riguardano un evento (es. sessione rifiutata). */
  dropForEvent: (eventId: string) => void
  reset: (ops?: OutboxOp[]) => void
}

export const useOutbox = create<OutboxState>()((set) => ({
  ops: [],
  enqueue: (op) => set((s) => ({ ops: [...s.ops, op] })),
  remove: (opId) => set((s) => ({ ops: s.ops.filter((o) => o.opId !== opId) })),
  dropForEvent: (eventId) => set((s) => ({ ops: s.ops.filter((o) => !opTouches(o, eventId)) })),
  reset: (ops) => set({ ops: ops ?? [] }),
}))

export function isEventPending(eventId: string): boolean {
  return useOutbox.getState().ops.some((o) => opTouches(o, eventId))
}
