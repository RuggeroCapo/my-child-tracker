import type { BabyEvent } from '@/domain/types'
import { supabase } from '@/lib/supabase'
import { useEvents } from '@/stores/events'
import { isEventPending } from '@/stores/outbox'

const PAGE = 500
/** Sovrapposizione del delta: copre transazioni lente committate dopo il cursore. */
const OVERLAP_MS = 30_000

/** Scarica gli eventi modificati dall'ultimo cursore (o tutti al primo avvio). */
export async function pullBaby(babyId: string): Promise<number> {
  const cursor = useEvents.getState().cursors[babyId]
  let since: string | undefined = cursor
    ? new Date(Date.parse(cursor.updatedAt) - OVERLAP_MS).toISOString()
    : undefined
  let afterId: string | undefined
  let total = 0

  for (;;) {
    const { data, error } = await supabase.rpc('pull_events', {
      p_baby_ids: [babyId],
      p_since: since,
      p_after_id: afterId,
      p_limit: PAGE,
    })
    if (error) throw error
    const rows = (data ?? []) as unknown as BabyEvent[]
    useEvents.getState().applyServer(rows, { isPending: isEventPending })
    total += rows.length
    if (rows.length === 0) break
    const last = rows[rows.length - 1]
    useEvents.getState().setCursor(babyId, { updatedAt: last.updated_at, id: last.id })
    if (rows.length < PAGE) break
    since = last.updated_at
    afterId = last.id
  }
  return total
}

export async function fetchEvent(id: string): Promise<BabyEvent | null> {
  const { data, error } = await supabase.rpc('event_json', { p_event_id: id })
  if (error) throw error
  return (data as unknown as BabyEvent | null) ?? null
}
