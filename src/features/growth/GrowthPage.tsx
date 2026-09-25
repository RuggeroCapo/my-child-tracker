import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { formatPercentile, percentileOf, referenceCurves, WHO_MAX_MONTHS } from '@/domain/growth/percentile'
import { latestWithDelta, measurementSeries } from '@/domain/stats'
import type { MeasurementMetric } from '@/domain/types'
import { METRIC_LABEL } from '@/i18n/it'
import { ageInMonths, formatShortDate } from '@/lib/time'
import { CANONICAL_UNIT, formatNumber } from '@/lib/units'
import { useActiveBaby } from '@/stores/babies'
import { useEventsOfKind } from '@/stores/selectors'
import { EventList } from '../events/EventList'
import { GrowthChart } from './GrowthChart'
import { MeasurementForm } from './MeasurementForm'

const COLORS: Record<MeasurementMetric, string> = { weight: 'var(--color-diaper)', length: 'var(--color-growth)', head: 'var(--color-pump)' }

export default function GrowthPage() {
  const baby = useActiveBaby()!
  const measurements = useEventsOfKind(baby.id, 'measurement')
  const [metric, setMetric] = useState<MeasurementMetric>('weight')
  const [open, setOpen] = useState(false)

  const series = useMemo(() => measurementSeries(measurements, metric), [measurements, metric])
  const latest = latestWithDelta(series)
  const currentAge = ageInMonths(baby.birth_date, new Date())
  const withinWho = currentAge <= WHO_MAX_MONTHS
  const lastAge = series.length ? ageInMonths(baby.birth_date, series[series.length - 1].date) : 0
  const xMax = Math.min(WHO_MAX_MONTHS, Math.max(3, Math.ceil(Math.max(currentAge, lastAge) + 1)))
  const curves = useMemo(
    () => (baby.sex && withinWho ? referenceCurves(baby.sex, metric, xMax) : undefined),
    [baby.sex, metric, xMax, withinWho],
  )
  const points = series
    .map((p) => ({ x: ageInMonths(baby.birth_date, p.date), y: p.value }))
    .filter((p) => p.x >= 0 && p.x <= xMax)
  const unit = CANONICAL_UNIT[metric]
  const pct =
    latest && baby.sex
      ? percentileOf(baby.sex, metric, ageInMonths(baby.birth_date, latest.latest.date), latest.latest.value)
      : null

  return (
    <div className="space-y-5">
      <PageHeader title="Crescita" />
      <Segmented<MeasurementMetric>
        ariaLabel="Misura"
        value={metric}
        onChange={setMetric}
        options={[
          { value: 'weight', label: 'Peso' },
          { value: 'length', label: 'Altezza' },
          { value: 'head', label: 'Circonferenza' },
        ]}
      />

      <Card className="space-y-4 p-4">
        {latest ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-semibold tabular">
                {formatNumber(latest.latest.value, metric === 'weight' ? 3 : 1)} <span className="text-lg text-ink-2">{unit}</span>
              </p>
              <p className="text-sm text-ink-2">
                {formatShortDate(latest.latest.date)}
                {latest.delta !== null && (
                  <>
                    {' · '}
                    {latest.delta >= 0 ? '+' : '−'}
                    {formatNumber(Math.abs(metric === 'weight' ? latest.delta * 1000 : latest.delta), metric === 'weight' ? 0 : 1)}{' '}
                    {metric === 'weight' ? 'g' : 'cm'} dalla precedente
                  </>
                )}
              </p>
            </div>
            {pct !== null && (
              <div className="text-right">
                <p className="text-xs text-ink-3">Percentile OMS</p>
                <p className="text-xl font-semibold tabular">{formatPercentile(pct)}</p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-ink-2">Nessuna misura di {METRIC_LABEL[metric].toLowerCase()} registrata.</p>
        )}

        <GrowthChart points={points} curves={curves} xMax={xMax} xLabel="Età (mesi)" unit={unit} color={COLORS[metric]} />

        {!baby.sex && withinWho && (
          <p className="rounded-2xl bg-surface-2 px-3 py-2 text-xs text-ink-2">
            Per vedere le curve OMS indica il sesso nel{' '}
            <Link to={`/babies/${baby.id}/edit`} className="font-semibold text-rose-ink underline underline-offset-2">
              profilo del bambino
            </Link>
            .
          </p>
        )}
        {!withinWho && <p className="text-xs text-ink-3">Le curve OMS incluse coprono i primi 24 mesi.</p>}
        {curves && (
          <p className="text-xs text-ink-3">
            Curve: standard di crescita OMS per {baby.sex === 'female' ? 'bambine' : 'bambini'}. Il percentile descrive la
            posizione rispetto ai bambini della stessa età e sesso: non è una valutazione medica. Per dubbi rivolgiti al pediatra.
          </p>
        )}
      </Card>

      <Button block size="lg" variant="outline" icon={<Plus className="size-5" />} onClick={() => setOpen(true)}>
        Aggiungi misurazione
      </Button>

      <section className="space-y-3">
        <SectionTitle>Ultime misurazioni</SectionTitle>
        {measurements.length === 0 ? <EmptyState title="Nessuna misurazione">Aggiungi peso, altezza o circonferenza dopo ogni visita dal pediatra.</EmptyState> : <EventList events={measurements} />}
      </section>

      <Sheet open={open} onClose={() => setOpen(false)} title="Nuova misurazione">
        <MeasurementForm babyId={baby.id} onSaved={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}
