import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { BabyEvent } from '@/domain/types'
import { supabase } from '@/lib/supabase'
import { useEvents } from '@/stores/events'
import { isEventPending } from '@/stores/outbox'

/**
 * Un solo canale Realtime per tutti i bambini dell'utente. Le notifiche su
 * `events` aggiornano subito i campi della riga (es. fine sessione) e
 * innescano un delta pull che porta anche i dettagli. Niente polling.
 */

export interface RealtimeHandlers {
  onEventsChanged: (babyId: string) => void
  onBabiesChanged: () => void
  onMedicationsChanged: (babyId: string) => void
  onSubscribed: () => void
}

let channel: RealtimeChannel | null = null
let channelKey = ''

type EventRow = Omit<BabyEvent, 'details'>

function applyRow(row: EventRow) {
  const existing = useEvents.getState().byId[row.id]
  if (!existing) return
  useEvents.getState().applyServer([{ ...existing, ...row, details: existing.details } as BabyEvent], {
    isPending: isEventPending,
  })
}

export function subscribeRealtime(babyIds: string[], handlers: RealtimeHandlers) {
  const key = [...babyIds].sort().join(',')
  if (channel && key === channelKey) return
  unsubscribeRealtime()
  if (babyIds.length === 0) return
  channelKey = key
  const list = `(${babyIds.join(',')})`

  channel = supabase
    .channel(`baby-sync-${Math.random().toString(36).slice(2, 10)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events', filter: `baby_id=in.${list}` },
      (payload: RealtimePostgresChangesPayload<EventRow>) => {
        const row = payload.new as EventRow | undefined
        if (row && 'id' in row && row.id) {
          applyRow(row)
          handlers.onEventsChanged(row.baby_id)
        }
      },
    )
    .on('postgres_changes', { event: '*', schema: 'public', table: 'babies', filter: `id=in.${list}` }, () =>
      handlers.onBabiesChanged(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'baby_members', filter: `baby_id=in.${list}` },
      () => handlers.onBabiesChanged(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'medications', filter: `baby_id=in.${list}` },
      (payload: RealtimePostgresChangesPayload<{ baby_id: string }>) => {
        const babyId = (payload.new as { baby_id?: string })?.baby_id
        if (babyId) handlers.onMedicationsChanged(babyId)
        else babyIds.forEach(handlers.onMedicationsChanged)
      },
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') handlers.onSubscribed()
    })
}

export function unsubscribeRealtime() {
  if (channel) void supabase.removeChannel(channel)
  channel = null
  channelKey = ''
}
