import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import type { EventOf, MeasurementItem, MeasurementMetric } from '@/domain/types'
import { formatNumber, parseDecimal } from '@/lib/units'
import { DateTimeInput, NotesInput } from '../events/formParts'
import { useEventDraft } from '../events/useEventDraft'

const LIMITS: Record<MeasurementMetric, [number, number]> = {
  weight: [0.3, 40],
  length: [20, 130],
  head: [20, 60],
}

export function MeasurementForm({ babyId, initial, onSaved }: { babyId: string; initial?: EventOf<'measurement'>; onSaved?: () => void }) {
  const draft = useEventDraft(initial)
  const initialValue = (metric: MeasurementMetric) => {
    const item = initial?.details.items.find((i) => i.metric === metric)
    if (!item) return ''
    // Il form lavora in kg / cm.
    const v = metric === 'weight' && item.unit === 'g' ? item.value / 1000 : item.value
    return formatNumber(v, 3)
  }
  const [weight, setWeight] = useState(initialValue('weight'))
  const [length, setLength] = useState(initialValue('length'))
  const [head, setHead] = useState(initialValue('head'))

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    const items: MeasurementItem[] = []
    const entries: [MeasurementMetric, string, string][] = [
      ['weight', weight, 'kg'],
      ['length', length, 'cm'],
      ['head', head, 'cm'],
    ]
    for (const [metric, raw, unit] of entries) {
      if (!raw.trim()) continue
      const v = parseDecimal(raw)
      const [min, max] = LIMITS[metric]
      if (v === null || v < min || v > max) {
        draft.setError(`Valore non valido per ${metric === 'weight' ? 'il peso' : metric === 'length' ? "l'altezza" : 'la circonferenza'}.`)
        return
      }
      items.push({ metric, value: v, unit })
    }
    if (items.length === 0) {
      draft.setError('Inserisci almeno una misura.')
      return
    }
    const ok = draft.save({ baby_id: babyId, kind: 'measurement', details: { items } }, { successTitle: 'Misurazione salvata' })
    if (ok) onSaved?.()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input label="Peso" optional inputMode="decimal" suffix="kg" placeholder="6,2" value={weight} onChange={(e) => setWeight(e.target.value)} />
      <Input label="Altezza / lunghezza" optional inputMode="decimal" suffix="cm" placeholder="61" value={length} onChange={(e) => setLength(e.target.value)} />
      <Input label="Circonferenza cranica" optional inputMode="decimal" suffix="cm" placeholder="40" value={head} onChange={(e) => setHead(e.target.value)} />
      <DateTimeInput label="Data e ora" value={draft.startedAt} onChange={draft.setStartedAt} />
      <NotesInput value={draft.notes} onChange={draft.setNotes} />
      {draft.error && <p className="text-sm text-danger" role="alert">{draft.error}</p>}
      <Button type="submit" block size="lg" className="bg-growth text-white hover:bg-growth/90">
        Salva
      </Button>
    </form>
  )
}
