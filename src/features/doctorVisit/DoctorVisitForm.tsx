import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormDock } from '@/components/ui/FormDock'
import { Input } from '@/components/ui/Field'
import type { EventOf } from '@/domain/types'
import { DateTimeInput, NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'

/** Suggerimenti per il tipo di visita (solo autocompletamento). */
const COMMON_VISITS = [
  'Pediatra',
  'Bilancio di salute',
  'Controllo peso',
  'Pronto soccorso',
  'Ortopedico (anche)',
  'Oculista',
  'Otorino',
  'Dermatologo',
  'Cardiologo',
  'Ecografia',
]

export function DoctorVisitForm({ babyId, initial, onSaved }: { babyId: string; initial?: EventOf<'doctor_visit'>; onSaved?: () => void }) {
  const draft = useEventDraft(initial)
  const listId = useId()
  const [visitType, setVisitType] = useState(initial?.details.visit_type ?? '')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!visitType.trim()) {
      draft.setError('Inserisci il tipo di visita.')
      return
    }
    const ok = draft.save({ baby_id: babyId, kind: 'doctor_visit', details: { visit_type: visitType.trim() } })
    if (ok) onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Tipo di visita" required maxLength={80} list={listId} value={visitType} onChange={(e) => setVisitType(e.target.value)} placeholder="Es. Pediatra" />
      <datalist id={listId}>
        {COMMON_VISITS.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
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
