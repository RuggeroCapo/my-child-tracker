import type { BabyEvent } from '@/domain/types'
import { supabase } from '@/lib/supabase'
import { useBabies } from '@/stores/babies'
import { useEvents } from '@/stores/events'
import { isEventPending, useOutbox, type OutboxOp } from '@/stores/outbox'
import { toast, useUi } from '@/stores/ui'
import { friendlyError, isTransientError, type RpcError } from './errors'
import { fetchEvent } from './pull'

/**
 * Coda delle scritture. Ogni operazione viene eseguita in ordine FIFO tramite
 * RPC idempotenti: se la rete cade a metà, ripeterla non crea duplicati.
 * Gli errori temporanei fermano la coda (ritentata con backoff); quelli
 * definitivi scartano l'operazione e ripristinano lo stato del server.
 */

/** Entro questa finestra si lascia che sia il server a mettere il timestamp. */
const FRESH_MS = 15_000

type Outcome = 'done' | 'transient'

let flushing = false
let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = 2000

function nameOf(userId: string | null): string | null {
  if (!userId) return null
  for (const list of Object.values(useBabies.getState().members)) {
    const m = list.find((x) => x.user_id === userId)
    if (m) return m.display_name
  }
  return null
}

/** Applica la risposta del server; se altre operazioni sullo stesso evento sono in coda, aspetta la loro conferma. */
function applyAck(op: OutboxOp, event: BabyEvent | null | undefined) {
  if (!event) return
  const others = useOutbox.getState().ops.some((o) => o.opId !== op.opId && (o.eventId === event.id || (o.type === 'switch' && o.newEventId === event.id)))
  if (!others) useEvents.getState().applyServer([event], { force: true })
}

async function rollback(eventId: string) {
  try {
    const server = await fetchEvent(eventId)
    if (server) useEvents.getState().applyServer([server], { force: true })
    else useEvents.getState().removeLocal(eventId)
  } catch {
    // Verrà riallineato dal prossimo pull.
  }
}

async function execute(op: OutboxOp): Promise<Outcome> {
  const fresh = Date.now() - op.queuedAt < FRESH_MS

  const call = async (): Promise<{ data: unknown; error: RpcError | null; status: number }> => {
    switch (op.type) {
      case 'upsert': {
        const payload = { ...op.input, started_at: op.useServerTime && fresh ? null : op.input.started_at }
        return supabase.rpc('upsert_event', { p_event: payload as never })
      }
      case 'start':
        return supabase.rpc('start_session', {
          p_id: op.eventId,
          p_baby_id: op.babyId,
          p_kind: op.kind,
          p_details: op.details as never,
          p_started_at: fresh ? undefined : op.startedAt,
        })
      case 'end':
        return supabase.rpc('end_session', {
          p_id: op.eventId,
          p_ended_at: fresh ? undefined : op.endedAt,
          p_details: (op.details ?? undefined) as never,
        })
      case 'switch':
        return supabase.rpc('switch_breast_side', {
          p_id: op.eventId,
          p_new_id: op.newEventId,
          p_at: fresh ? undefined : op.at,
        })
      case 'delete':
        return supabase.rpc('delete_event', { p_id: op.eventId })
      case 'restore':
        return supabase.rpc('restore_event', { p_id: op.eventId })
    }
  }

  let result: Awaited<ReturnType<typeof call>>
  try {
    result = await call()
  } catch (e) {
    console.warn('outbox network error', e)
    return 'transient'
  }
  const { data, error, status } = result

  if (error) {
    if (isTransientError(error, status)) {
      if (status === 401 || error.code === 'PGRST301' || error.code === 'PGRST303') {
        await supabase.auth.refreshSession().catch(() => {})
      }
      return 'transient'
    }
    useOutbox.getState().remove(op.opId)
    if (error.message === 'event_not_found') {
      // Evento mai arrivato al server (es. sessione sostituita): nulla da fare.
      useEvents.getState().removeLocal(op.eventId)
    } else {
      toast({ tone: 'error', title: 'Modifica non salvata', description: friendlyError(error) })
      await rollback(op.eventId)
      if (op.type === 'switch') await rollback(op.newEventId)
    }
    return 'done'
  }

  handleSuccess(op, data)
  return 'done'
}

function handleSuccess(op: OutboxOp, data: unknown) {
  const outbox = useOutbox.getState()
  const events = useEvents.getState()

  switch (op.type) {
    case 'start': {
      const res = data as { status: string; event: BabyEvent }
      outbox.remove(op.opId)
      if (res.status === 'already_active' && res.event.id !== op.eventId) {
        // Un altro dispositivo ha avviato prima la stessa sessione: si adotta la sua.
        outbox.dropForEvent(op.eventId)
        events.removeLocal(op.eventId)
        events.applyServer([res.event], { force: true })
        const who = nameOf(res.event.created_by)
        toast({
          tone: 'info',
          title: res.event.kind === 'breastfeeding' ? 'Allattamento già in corso' : 'Tiralatte già in corso',
          description: who ? `Avviato da ${who}` : 'Avviato da un altro dispositivo',
        })
        return
      }
      applyAck(op, res.event)
      return
    }
    case 'end': {
      const res = data as { status: string; event: BabyEvent }
      outbox.remove(op.opId)
      if (res.status === 'already_ended') {
        events.applyServer([res.event], { force: true })
        const who = nameOf(res.event.ended_by)
        toast({
          tone: 'warning',
          title: 'Sessione già terminata',
          description: who ? `Terminata da ${who}` : 'Questa sessione risulta già conclusa',
        })
        return
      }
      applyAck(op, res.event)
      return
    }
    case 'switch': {
      const res = data as { status: string; ended: BabyEvent; event: BabyEvent | null }
      outbox.remove(op.opId)
      if (res.status === 'already_ended') {
        outbox.dropForEvent(op.newEventId)
        events.removeLocal(op.newEventId)
        events.applyServer([res.ended], { force: true })
        toast({ tone: 'warning', title: 'Sessione già terminata', description: 'Il cambio lato non è stato applicato' })
        return
      }
      applyAck(op, res.ended)
      if (res.event && res.event.id !== op.newEventId) {
        outbox.dropForEvent(op.newEventId)
        events.removeLocal(op.newEventId)
        events.applyServer([res.event], { force: true })
      } else {
        applyAck({ ...op, eventId: op.newEventId }, res.event)
      }
      return
    }
    default: {
      outbox.remove(op.opId)
      applyAck(op, data as BabyEvent)
    }
  }
}

function scheduleRetry() {
  if (retryTimer) return
  retryTimer = setTimeout(() => {
    retryTimer = null
    void flushOutbox()
  }, retryDelay)
  retryDelay = Math.min(retryDelay * 2, 60_000)
}

function updateStatus() {
  const ui = useUi.getState()
  if (!navigator.onLine) ui.setSyncStatus('offline')
  else if (useOutbox.getState().ops.length > 0) ui.setSyncStatus('syncing')
  else ui.setSyncStatus('synced')
}

export async function flushOutbox(): Promise<void> {
  if (flushing) return
  flushing = true
  try {
    for (;;) {
      const op = useOutbox.getState().ops[0]
      if (!op) {
        retryDelay = 2000
        break
      }
      if (!navigator.onLine) break
      updateStatus()
      const outcome = await execute(op)
      if (outcome === 'transient') {
        scheduleRetry()
        break
      }
    }
  } finally {
    flushing = false
    updateStatus()
  }
}

export function resetOutboxRunner() {
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  retryDelay = 2000
}

export { isEventPending }
