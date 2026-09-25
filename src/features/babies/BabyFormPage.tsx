import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { FormDock } from '@/components/ui/FormDock'
import { Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import type { BabySex, MeasurementItem, MeasurementMetric } from '@/domain/types'
import { newId } from '@/lib/id'
import { formatShortDate, toDateInput } from '@/lib/time'
import { formatNumber, parseDecimal } from '@/lib/units'
import { useBabies } from '@/stores/babies'
import { useLatestMeasurements, useMyRole } from '@/stores/selectors'
import { toast } from '@/stores/ui'
import { saveEvent } from '@/sync/actions'
import { createBaby, deleteBaby, updateBaby } from '@/sync/babies'
import { friendlyError } from '@/sync/errors'
import { MEASUREMENT_LIMITS } from '../growth/MeasurementForm'

type SexChoice = BabySex | 'unset'

const METRICS: { metric: MeasurementMetric; label: string; unit: string; digits: number; placeholder: string; error: string }[] = [
  { metric: 'weight', label: 'Peso', unit: 'kg', digits: 3, placeholder: '6,2', error: 'il peso' },
  { metric: 'length', label: 'Altezza / lunghezza', unit: 'cm', digits: 1, placeholder: '61', error: "l'altezza" },
  { metric: 'head', label: 'Circonferenza cranica', unit: 'cm', digits: 1, placeholder: '40', error: 'la circonferenza' },
]

export default function BabyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = useBabies((s) => s.babies.find((b) => b.id === id))
  const role = useMyRole()
  const [name, setName] = useState(existing?.name ?? '')
  const [birthDate, setBirthDate] = useState(existing?.birth_date ?? toDateInput(new Date()))
  const [sex, setSex] = useState<SexChoice>(existing?.sex ?? 'unset')
  const latest = useLatestMeasurements(id)
  const initialMeasure = (m: MeasurementMetric) => {
    const p = latest[m]
    return p ? formatNumber(p.value, METRICS.find((x) => x.metric === m)!.digits) : ''
  }
  const [measures, setMeasures] = useState<Record<MeasurementMetric, string>>(() => ({
    weight: initialMeasure('weight'),
    length: initialMeasure('length'),
    head: initialMeasure('head'),
  }))
  const lastMeasuredAt = Object.values(latest).reduce<Date | null>((acc, p) => (p && (!acc || p.date > acc) ? p.date : acc), null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isEdit = Boolean(id)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    // Le misure modificate diventano una nuova misurazione: lo storico resta intatto.
    const items: MeasurementItem[] = []
    if (isEdit) {
      for (const { metric, unit, error } of METRICS) {
        const raw = measures[metric].trim()
        if (!raw || raw === initialMeasure(metric)) continue
        const v = parseDecimal(raw)
        const [min, max] = MEASUREMENT_LIMITS[metric]
        if (v === null || v < min || v > max) {
          toast({ tone: 'error', title: `Valore non valido per ${error}.` })
          return
        }
        items.push({ metric, value: v, unit })
      }
    }
    setSaving(true)
    try {
      const input = { name: name.trim(), birth_date: birthDate, sex: sex === 'unset' ? null : sex }
      if (isEdit && id) {
        if (items.length) {
          saveEvent({
            id: newId(),
            baby_id: id,
            kind: 'measurement',
            started_at: new Date().toISOString(),
            ended_at: null,
            notes: null,
            details: { items },
          })
        }
        const profileChanged =
          !existing || input.name !== existing.name || input.birth_date !== existing.birth_date || input.sex !== existing.sex
        if (profileChanged) await updateBaby(id, input)
      } else await createBaby(input)
      toast({ tone: 'success', title: isEdit ? 'Profilo aggiornato' : `Profilo di ${input.name} creato` })
      if (isEdit) navigate(-1)
      else navigate('/', { replace: true })
    } catch (err) {
      toast({ tone: 'error', title: 'Salvataggio non riuscito', description: friendlyError(err as never) })
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!id || !existing) return
    if (!window.confirm(`Eliminare definitivamente il profilo di ${existing.name} e tutti i suoi eventi per tutti i genitori?`)) return
    setDeleting(true)
    try {
      await deleteBaby(id)
      toast({ tone: 'success', title: 'Profilo eliminato' })
      navigate('/', { replace: true })
    } catch (err) {
      toast({ tone: 'error', title: 'Eliminazione non riuscita', description: friendlyError(err as never) })
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Profilo bambino' : 'Nuovo bambino'} />
      <form onSubmit={onSubmit} className="space-y-5 pt-2">
        <Input label="Nome" required maxLength={60} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome del bambino" />
        <Input label="Data di nascita" type="date" required max={toDateInput(new Date())} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <div className="space-y-1.5">
          <p className="px-1 text-sm font-medium text-ink-2">Sesso</p>
          <Segmented<SexChoice>
            ariaLabel="Sesso"
            value={sex}
            onChange={setSex}
            options={[
              { value: 'female', label: 'Femmina' },
              { value: 'male', label: 'Maschio' },
              { value: 'unset', label: 'Non indicato' },
            ]}
          />
          <p className="px-1 text-xs text-ink-3">Serve per mostrare le curve di crescita OMS corrette.</p>
        </div>
        {isEdit && (
          <fieldset className="space-y-4">
            <legend className="px-1 pb-1 text-sm font-medium text-ink-2">Misure attuali</legend>
            {METRICS.map(({ metric, label, unit, placeholder }) => (
              <Input
                key={metric}
                label={label}
                optional
                inputMode="decimal"
                suffix={unit}
                placeholder={placeholder}
                value={measures[metric]}
                onChange={(e) => setMeasures((m) => ({ ...m, [metric]: e.target.value }))}
              />
            ))}
            <p className="px-1 text-xs text-ink-3">
              {lastMeasuredAt ? `Ultima misurazione: ${formatShortDate(lastMeasuredAt)}. ` : ''}
              Ogni modifica viene registrata come nuova misurazione nella Crescita.
            </p>
          </fieldset>
        )}
        <FormDock>
          <Button type="submit" block size="lg" loading={saving} disabled={!name.trim()}>
            Salva
          </Button>
        </FormDock>
        {isEdit && role === 'owner' && (
          <Button variant="ghost" block loading={deleting} onClick={onDelete}>
            Elimina profilo
          </Button>
        )}
      </form>
    </>
  )
}
