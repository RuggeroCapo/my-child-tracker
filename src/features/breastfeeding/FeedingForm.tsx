import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import type { BreastSide, EventOf } from '@/domain/types'
import { BREAST_SIDE_LABEL } from '@/i18n/it'
import { fromLocalInput, toLocalInput } from '@/lib/time'
import { ChoiceGrid, DateTimeInput, NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'

/** Inserimento manuale / modifica di un allattamento. */
export function FeedingForm({ babyId, initial, onSaved }: { babyId: string; initial?: EventOf<'breastfeeding'>; onSaved?: () => void }) {
  const draft = useEventDraft(initial, 15)
  const [side, setSide] = useState<BreastSide>(initial?.details.side ?? 'left')
  const active = initial ? initial.ended_at === null : false
  const [endedAt, setEndedAt] = useState(toLocalInput(initial?.ended_at ?? new Date()))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = draft.save({
      baby_id: babyId,
      kind: 'breastfeeding',
      ended_at: active ? null : fromLocalInput(endedAt),
      details: { side },
    })
    if (ok) onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ChoiceGrid<BreastSide>
        label="Lato"
        columns={2}
        value={side}
        onChange={setSide}
        options={(['left', 'right'] as const).map((s) => ({ value: s, label: BREAST_SIDE_LABEL[s] }))}
      />
      <DateTimeInput label="Inizio" value={draft.startedAt} onChange={draft.setStartedAt} />
      {!active && <DateTimeInput label="Fine" value={endedAt} onChange={setEndedAt} min={draft.startedAt} />}
      <NotesInput value={draft.notes} onChange={draft.setNotes} />
      {draft.error && <p className="text-sm text-danger" role="alert">{draft.error}</p>}
      <Button type="submit" block size="lg">
        Salva
      </Button>
    </form>
  )
}
