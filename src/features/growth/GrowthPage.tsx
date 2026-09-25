import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { formatPercentile } from '@/domain/growth/percentile'
import type { MeasurementMetric } from '@/domain/types'
import { METRIC_LABEL } from '@/i18n/it'
import { formatShortDate } from '@/lib/time'
import { formatNumber } from '@/lib/units'
import { useActiveBaby } from '@/stores/babies'
import { useEventsOfKind } from '@/stores/selectors'
import { EventList } from '../events/EventList'
import { GrowthChart } from './GrowthChart'
import { GrowthExplorer } from './GrowthExplorer'
import { METRIC_COLOR, METRIC_TABS, useGrowthData } from './growthData'
import { MeasurementForm } from './MeasurementForm'

export default function GrowthPage() {
  const baby = useActiveBaby()!
  const measurements = useEventsOfKind(baby.id, 'measurement')
  const [metric, setMetric] = useState<MeasurementMetric>('weight')
  const [open, setOpen] = useState(false)

  const [explorerOpen, setExplorerOpen] = useState(false)
  const { latest, pct, withinWho, xMax, curves, points, unit } = useGrowthData(baby, measurements, metric)

  return (
    <div className="space-y-5">
      <PageHeader title="Crescita" />
      <Segmented<MeasurementMetric>
        ariaLabel="Misura"
        value={metric}
        onChange={setMetric}
        options={METRIC_TABS}
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

        <GrowthChart
          points={points}
          curves={curves}
          xMax={xMax}
          xLabel="Età (mesi)"
          unit={unit}
          color={METRIC_COLOR[metric]}
          onExpand={() => setExplorerOpen(true)}
        />

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

      <GrowthExplorer
        open={explorerOpen}
        onClose={() => setExplorerOpen(false)}
        baby={baby}
        measurements={measurements}
        metric={metric}
        onMetricChange={setMetric}
      />

      <Sheet open={open} onClose={() => setOpen(false)} title="Nuova misurazione">
        <MeasurementForm babyId={baby.id} onSaved={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}
