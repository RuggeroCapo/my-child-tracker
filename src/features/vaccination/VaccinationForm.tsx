import { useId, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import type { EventOf } from '@/domain/types'
import { fromLocalInput, toDateInput, toLocalInput } from '@/lib/time'
import { NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'

/** Suggerimenti di nomi comuni (solo autocompletamento, nessun calendario vaccinale). */
const COMMON_VACCINES = [
  'Esavalente',
  'Pneumococco',
  'Meningococco B',
  'Meningococco ACWY',
  'Rotavirus',
  'Morbillo-Parotite-Rosolia-Varicella (MPRV)',
  'Varicella',
  'Influenza',
  'Epatite B',
  'Anticorpo monoclonale RSV',
]

export function VaccinationForm({ babyId, initial, onSaved }: { babyId: string; initial?: EventOf<'vaccination'>; onSaved?: () => void }) {
  const draft = useEventDraft(initial)
  const listId = useId()
  const [name, setName] = useState(initial?.details.vaccine_name ?? '')
  const [dose, setDose] = useState(initial?.details.dose_number ? String(initial.details.dose_number) : '')
  const [date, setDate] = useState(draft.startedAt.slice(0, 10))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      draft.setError('Inserisci il nome del vaccino.')
      return
    }
    // Le vaccinazioni si registrano per giorno: si conserva l'orario originale,
    // altrimenti l'ora attuale (se oggi) o mezzogiorno.
    const isToday = date === toDateInput(new Date())
    const time = initial ? draft.startedAt.slice(10) : isToday ? toLocalInput(new Date()).slice(10) : 'T12:00'
    const ok = draft.save({
      baby_id: babyId,
      kind: 'vaccination',
      started_at: fromLocalInput(`${date}${time}`),
      details: { vaccine_name: name.trim(), dose_number: dose ? Number(dose) : null },
    })
    if (ok) onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Nome vaccino" required maxLength={80} list={listId} value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Esavalente" />
      <datalist id={listId}>
        {COMMON_VACCINES.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
      <Select label="Dose" value={dose} onChange={(e) => setDose(e.target.value)}>
        <option value="">Non specificata</option>
        {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
          <option key={n} value={n}>
            {n}ª dose
          </option>
        ))}
      </Select>
      <Input label="Data" type="date" required max={toDateInput(new Date())} value={date} onChange={(e) => setDate(e.target.value)} />
      <NotesInput value={draft.notes} onChange={draft.setNotes} />
      {draft.error && <p className="text-sm text-danger" role="alert">{draft.error}</p>}
      <Button type="submit" block size="lg" variant="violet">
        Salva
      </Button>
    </form>
  )
}
