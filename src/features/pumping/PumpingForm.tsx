import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormDock } from '@/components/ui/FormDock'
import { Input } from '@/components/ui/Field'
import type { EventOf, PumpSide } from '@/domain/types'
import { PUMP_SIDE_LABEL } from '@/i18n/it'
import { fromLocalInput, toLocalInput } from '@/lib/time'
import { parseDecimal } from '@/lib/units'
import { ChoiceGrid, DateTimeInput, NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'

export function PumpingForm({ babyId, initial, onSaved }: { babyId: string; initial?: EventOf<'pumping'>; onSaved?: () => void }) {
  const draft = useEventDraft(initial, 15)
  const [side, setSide] = useState<PumpSide>(initial?.details.side ?? 'both')
  const [amount, setAmount] = useState(initial?.details.amount != null ? String(initial.details.amount) : '')
  const active = initial ? initial.ended_at === null : false
  const [endedAt, setEndedAt] = useState(toLocalInput(initial?.ended_at ?? new Date()))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = amount.trim() ? parseDecimal(amount) : null
    if (value !== null && (value < 0 || value > 2000)) {
      draft.setError('Inserisci una quantità valida.')
      return
    }
    const ok = draft.save({
      baby_id: babyId,
      kind: 'pumping',
      ended_at: active ? null : fromLocalInput(endedAt),
      details: { side, amount: value, unit: 'ml' },
    })
    if (ok) onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ChoiceGrid<PumpSide>
        label="Lato"
        value={side}
        onChange={setSide}
        activeClass="ring-2 ring-pump bg-pump/12 text-ink"
        options={(['left', 'right', 'both'] as const).map((s) => ({ value: s, label: PUMP_SIDE_LABEL[s] }))}
      />
      <DateTimeInput label="Inizio" value={draft.startedAt} onChange={draft.setStartedAt} />
      {!active && <DateTimeInput label="Fine" value={endedAt} onChange={setEndedAt} />}
      <Input label="Quantità estratta" optional inputMode="decimal" suffix="ml" value={amount} onChange={(e) => setAmount(e.target.value)} />
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
