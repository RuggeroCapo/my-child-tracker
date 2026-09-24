import {
  isActiveSession,
  type BabyEvent,
  type DetailsByKind,
  type EventInput,
  type EventOf,
  type TimedKind,
} from '@/domain/types'
import { serverNowIso } from '@/lib/clock'
import { newId } from '@/lib/id'
import { useEvents } from '@/stores/events'
import { useOutbox, type OutboxOp } from '@/stores/outbox'
import { useSession } from '@/stores/session'
import { toast } from '@/stores/ui'
import { flushOutbox } from './outbox'

/**
 * Azioni sugli eventi: aggiornano subito lo store locale (UI istantanea,
 * anche offline) e accodano l'operazione per il server.
 */

function me(): string | null {
  return useSession.getState().session?.user.id ?? null
}

function duration(start: string, end: string | null): number | null {
  if (!end) return null
  return Math.max(0, Math.floor((Date.parse(end) - Date.parse(start)) / 1000))
}

type OpWithoutMeta = OutboxOp extends infer O ? (O extends OutboxOp ? Omit<O, 'opId' | 'queuedAt'> : never) : never

function enqueue(op: OpWithoutMeta) {
  useOutbox.getState().enqueue({ ...op, opId: newId(), queuedAt: Date.now() } as OutboxOp)
  void flushOutbox()
}

function localEvent(input: EventInput, existing?: BabyEvent): BabyEvent {
  const now = serverNowIso()
  return {
    ...input,
    duration_seconds: duration(input.started_at, input.ended_at),
    created_by: existing?.created_by ?? me(),
    ended_by: input.ended_at ? (existing?.ended_by ?? me()) : null,
    updated_by: me(),
    created_at: existing?.created_at ?? now,
    updated_at: now,
    deleted_at: existing?.deleted_at ?? null,
  } as BabyEvent
}

/** Crea o modifica un evento. `useServerTime`: orario "adesso" deciso dal server. */
export function saveEvent(input: EventInput, opts: { useServerTime?: boolean } = {}): BabyEvent {
  const existing = useEvents.getState().byId[input.id]
  const event = localEvent(input, existing)
  useEvents.getState().setLocal(event)
  enqueue({ type: 'upsert', eventId: input.id, input, useServerTime: opts.useServerTime })
  return event
}

/** Evento "adesso" con un tap (pannolino, biberon...). */
export function quickAdd<K extends BabyEvent['kind']>(
  babyId: string,
  kind: K,
  details: DetailsByKind[K],
  notes: string | null = null,
): BabyEvent {
  return saveEvent(
    { id: newId(), baby_id: babyId, kind, started_at: serverNowIso(), ended_at: null, notes, details } as EventInput,
    { useServerTime: true },
  )
}

export function findActiveSession(babyId: string, kind: TimedKind): BabyEvent | undefined {
  return Object.values(useEvents.getState().byId).find(
    (e) => e.baby_id === babyId && e.kind === kind && isActiveSession(e),
  )
}

export function startSession<K extends TimedKind>(babyId: string, kind: K, details: DetailsByKind[K]): BabyEvent {
  const active = findActiveSession(babyId, kind)
  if (active) return active
  const id = newId()
  const startedAt = serverNowIso()
  const event = localEvent({ id, baby_id: babyId, kind, started_at: startedAt, ended_at: null, notes: null, details } as EventInput)
  useEvents.getState().setLocal(event)
  enqueue({ type: 'start', eventId: id, babyId, kind, details, startedAt })
  return event
}

export function endSession(event: BabyEvent, details?: Partial<DetailsByKind[TimedKind]>) {
  if (event.ended_at) return
  const endedAt = serverNowIso()
  useEvents.getState().setLocal({
    ...event,
    ended_at: endedAt,
    ended_by: me(),
    duration_seconds: duration(event.started_at, endedAt),
    details: { ...event.details, ...details },
    updated_at: endedAt,
  } as BabyEvent)
  enqueue({ type: 'end', eventId: event.id, endedAt, details })
}

export function switchBreastSide(event: EventOf<'breastfeeding'>): BabyEvent | null {
  if (event.ended_at) return null
  const at = serverNowIso()
  const newEventId = newId()
  const store = useEvents.getState()
  store.setLocal({ ...event, ended_at: at, ended_by: me(), duration_seconds: duration(event.started_at, at), updated_at: at })
  const next = localEvent({
    id: newEventId,
    baby_id: event.baby_id,
    kind: 'breastfeeding',
    started_at: at,
    ended_at: null,
    notes: null,
    details: { side: event.details.side === 'left' ? 'right' : 'left' },
  })
  store.setLocal(next)
  enqueue({ type: 'switch', eventId: event.id, newEventId, at })
  return next
}

export function deleteEvent(event: BabyEvent, opts: { undo?: boolean } = { undo: true }) {
  const at = serverNowIso()
  useEvents.getState().setLocal({ ...event, deleted_at: at, updated_at: at })
  enqueue({ type: 'delete', eventId: event.id })
  if (opts.undo) {
    toast({
      tone: 'success',
      title: 'Evento eliminato',
      action: { label: 'Annulla', onClick: () => restoreEvent(event) },
    })
  }
}

export function restoreEvent(event: BabyEvent) {
  useEvents.getState().setLocal({ ...event, deleted_at: null, updated_at: serverNowIso() })
  enqueue({ type: 'restore', eventId: event.id })
}
