import type { FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormDock } from '@/components/ui/FormDock'
import type { EventOf } from '@/domain/types'
import { DateTimeInput, NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'

export function BathForm({ babyId, initial, onSaved }: { babyId: string; initial?: EventOf<'bath'>; onSaved?: () => void }) {
  const draft = useEventDraft(initial)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = draft.save({ baby_id: babyId, kind: 'bath', details: {} })
    if (ok) onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <DateTimeInput label="Data e ora" value={draft.startedAt} onChange={draft.setStartedAt} />
      <NotesInput value={draft.notes} onChange={draft.setNotes} />
      {draft.error && <p className="text-sm text-danger" role="alert">{draft.error}</p>}
      <FormDock>
        <Button type="submit" block size="lg">
          Salva
        </Button>
      </FormDock>
    </form>
  )
}
