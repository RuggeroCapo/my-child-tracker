import clsx from 'clsx'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import type { EventOf, Medication } from '@/domain/types'
import { formatNumber, parseDecimal } from '@/lib/units'
import { useBabies } from '@/stores/babies'
import { DateTimeInput, NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'

export const DOSE_UNITS = ['ml', 'mg', 'gocce', 'compresse', 'bustine', 'supposte', 'UI', 'g']

const EMPTY: Medication[] = []

/**
 * Registra una somministrazione. L'app non suggerisce dosi: i valori
 * predefiniti vengono solo dal registro compilato dai genitori.
 */
export function MedicationForm({ babyId, initial, onSaved }: { babyId: string; initial?: EventOf<'medication'>; onSaved?: () => void }) {
  const meds = useBabies((s) => s.medications[babyId] ?? EMPTY).filter((m) => !m.archived)
  const draft = useEventDraft(initial)
  const [medicationId, setMedicationId] = useState<string | null>(initial?.details.medication_id ?? null)
  const [name, setName] = useState(initial?.details.name ?? '')
  const [dose, setDose] = useState(initial ? String(initial.details.dose).replace('.', ',') : '')
  const [unit, setUnit] = useState(initial?.details.unit ?? 'ml')

  function pick(m: Medication) {
    setMedicationId(m.id)
    setName(m.name)
    if (m.default_dose != null) setDose(formatNumber(m.default_dose))
    if (m.default_unit) setUnit(m.default_unit)
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = parseDecimal(dose)
    if (!name.trim()) {
      draft.setError('Inserisci il nome della medicina.')
      return
    }
    if (!value || value <= 0) {
      draft.setError('Inserisci una dose valida.')
      return
    }
    const linked = meds.find((m) => m.id === medicationId && m.name === name.trim())
    const ok = draft.save({
      baby_id: babyId,
      kind: 'medication',
      details: { medication_id: linked?.id ?? null, name: name.trim(), dose: value, unit },
    })
    if (ok) onSaved?.()
  }

  const units = DOSE_UNITS.includes(unit) ? DOSE_UNITS : [unit, ...DOSE_UNITS]

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {meds.length > 0 && (
        <div className="space-y-1.5">
          <p className="px-1 text-sm font-medium text-ink-2">Dal registro</p>
          <div className="flex flex-wrap gap-2">
            {meds.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pick(m)}
                className={clsx(
                  'h-11 rounded-full border border-line px-4 text-sm font-medium transition-colors',
                  medicationId === m.id && name === m.name ? 'bg-med/12 text-ink ring-2 ring-med' : 'text-ink-2 hover:bg-surface-2',
                )}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <Input label="Nome medicinale" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Vitamina D" />
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input label="Dose" inputMode="decimal" required value={dose} onChange={(e) => setDose(e.target.value)} placeholder="2,5" />
        <Select label="Unità" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-36">
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
      </div>
      <DateTimeInput label="Data e ora" value={draft.startedAt} onChange={draft.setStartedAt} />
      <NotesInput value={draft.notes} onChange={draft.setNotes} />
      {draft.error && <p className="text-sm text-danger" role="alert">{draft.error}</p>}
      <Button type="submit" block size="lg">
        Salva
      </Button>
    </form>
  )
}
