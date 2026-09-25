import { useState } from 'react'
import type { BabyEvent, EventInput } from '@/domain/types'
import { haptic } from '@/lib/haptics'
import { newId } from '@/lib/id'
import { FUTURE_TOLERANCE_MS, fromLocalInput, toLocalInput } from '@/lib/time'
import { toast } from '@/stores/ui'
import { saveEvent } from '@/sync/actions'

/** Stato comune dei form evento: orario, note, salvataggio. */
/** `minutesAgo`: per i nuovi eventi con durata, inizio proposto N minuti fa. */
export function useEventDraft(initial?: BabyEvent | null, minutesAgo = 0) {
  const [startedAt, setStartedAt] = useState(() =>
    toLocalInput(initial?.started_at ?? new Date(Date.now() - minutesAgo * 60_000)),
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [error, setError] = useState<string | null>(null)

  function save(
    input: Omit<EventInput, 'id' | 'started_at' | 'notes' | 'ended_at'> & { ended_at?: string | null; started_at?: string },
    opts: { successTitle?: string } = {},
  ): boolean {
    const started = input.started_at ?? fromLocalInput(startedAt)
    const limit = Date.now() + FUTURE_TOLERANCE_MS
    if (Date.parse(started) > limit || (input.ended_at && Date.parse(input.ended_at) > limit)) {
      setError("L'orario non può essere nel futuro.")
      haptic('error')
      return false
    }
    if (input.ended_at && Date.parse(input.ended_at) < Date.parse(started)) {
      setError("La fine deve essere successiva all'inizio.")
      haptic('error')
      return false
    }
    setError(null)
    saveEvent({
      ...input,
      id: initial?.id ?? newId(),
      started_at: started,
      ended_at: input.ended_at ?? null,
      notes: notes.trim() || null,
    } as EventInput)
    toast({ tone: 'success', title: opts.successTitle ?? (initial ? 'Modifiche salvate' : 'Evento salvato') })
    return true
  }

  return { startedAt, setStartedAt, notes, setNotes, error, setError, save }
}
