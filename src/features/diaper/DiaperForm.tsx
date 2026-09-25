import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { FormDock } from '@/components/ui/FormDock'
import type { DiaperType, EventOf, StoolAmount, StoolColor } from '@/domain/types'
import { DIAPER_LABEL } from '@/i18n/it'
import { ChoiceGrid, DateTimeInput, NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'
import { StoolPicker } from './DiaperDetails'

export function DiaperForm({ babyId, initial, onSaved }: { babyId: string; initial?: EventOf<'diaper'>; onSaved?: () => void }) {
  const draft = useEventDraft(initial)
  const [type, setType] = useState<DiaperType>(initial?.details.type ?? 'wet')
  const [amount, setAmount] = useState<StoolAmount | null>(initial?.details.stool_amount ?? null)
  const [color, setColor] = useState<StoolColor | null>(initial?.details.stool_color ?? null)

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const dirty = type !== 'wet'
    const ok = draft.save({
      baby_id: babyId,
      kind: 'diaper',
      details: { type, stool_amount: dirty ? amount : null, stool_color: dirty ? color : null },
    })
    if (ok) onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <ChoiceGrid<DiaperType>
        label="Tipo"
        value={type}
        onChange={setType}
        activeClass="ring-2 ring-diaper bg-diaper/10 text-ink"
        options={(['wet', 'dirty', 'mixed'] as const).map((t) => ({ value: t, label: DIAPER_LABEL[t] }))}
      />
      {type !== 'wet' && <StoolPicker amount={amount} color={color} onAmount={setAmount} onColor={setColor} />}
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
