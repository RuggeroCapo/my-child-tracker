import clsx from 'clsx'
import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormDock } from '@/components/ui/FormDock'
import { Input } from '@/components/ui/Field'
import type { EventOf, MilkType } from '@/domain/types'
import { MILK_LABEL } from '@/i18n/it'
import { haptic } from '@/lib/haptics'
import { parseDecimal } from '@/lib/units'
import { ChoiceGrid, DateTimeInput, NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'

export const BOTTLE_PRESETS = [30, 60, 90, 120, 150, 180]

export function BottleForm({
  babyId,
  initial,
  onSaved,
  lastMilkType,
  lastAmount,
}: {
  babyId: string
  initial?: EventOf<'bottle'>
  onSaved?: () => void
  lastMilkType?: MilkType
  lastAmount?: number
}) {
  const draft = useEventDraft(initial)
  const [amount, setAmount] = useState(String(initial?.details.amount ?? lastAmount ?? 90))
  const [milk, setMilk] = useState<MilkType>(initial?.details.milk_type ?? lastMilkType ?? 'breast_milk')

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const value = parseDecimal(amount)
    if (!value || value <= 0 || value > 2000) {
      draft.setError('Inserisci una quantità valida.')
      return
    }
    const ok = draft.save({
      baby_id: babyId,
      kind: 'bottle',
      details: { amount: value, unit: 'ml', milk_type: milk },
    })
    if (ok) onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Quantità" big inputMode="decimal" suffix="ml" value={amount} onChange={(e) => setAmount(e.target.value)} />
      <div className="grid grid-cols-3 gap-2">
        {BOTTLE_PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              haptic('tick')
              setAmount(String(p))
            }}
            className={clsx(
              'press h-11 rounded-full border border-line px-4 text-sm font-medium tabular [--press:0.95]',
              parseDecimal(amount) === p ? 'bg-bottle/15 text-ink ring-2 ring-bottle' : 'text-ink-2 hover:bg-surface-2 active:bg-surface-2',
            )}
          >
            {p} ml
          </button>
        ))}
      </div>
      <ChoiceGrid<MilkType>
        label="Tipo di latte"
        value={milk}
        onChange={setMilk}
        activeClass="ring-2 ring-bottle bg-bottle/12 text-ink"
        options={(['breast_milk', 'formula', 'other'] as const).map((m) => ({ value: m, label: MILK_LABEL[m] }))}
      />
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
