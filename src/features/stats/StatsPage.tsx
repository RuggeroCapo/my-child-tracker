import clsx from 'clsx'
import { useMemo, useState, type ReactNode } from 'react'
import { SyncBadge } from '@/app/SyncBadge'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Card } from '@/components/ui/Card'
import { Segmented } from '@/components/ui/Segmented'
import { Stat, StatGrid } from '@/components/ui/Stat'
import { referenceCurves, WHO_MAX_MONTHS } from '@/domain/growth/percentile'
import { computeStats, latestWithDelta, measurementSeries, rangeBounds, type DayBucket, type StatsRange } from '@/domain/stats'
import type { EventKind } from '@/domain/types'
import { ageInMonths, formatDuration, formatShortDate } from '@/lib/time'
import { formatNumber } from '@/lib/units'
import { useActiveBaby } from '@/stores/babies'
import { useBabyEvents } from '@/stores/selectors'
import { GrowthChart } from '../growth/GrowthChart'

export default function StatsPage() {
  const baby = useActiveBaby()!
  const events = useBabyEvents(baby.id)
  const [range, setRange] = useState<StatsRange>('7d')
  const stats = useMemo(() => {
    const { from, to } = rangeBounds(range, new Date())
    return computeStats(events, from, to)
  }, [events, range])
  const weights = useMemo(() => measurementSeries(events, 'weight'), [events])
  const weight = latestWithDelta(weights)
  const { feeding, diaper, bottle, pumping } = stats
  const sideTotal = feeding.leftSeconds + feeding.rightSeconds
  const leftPct = sideTotal ? Math.round((feeding.leftSeconds / sideTotal) * 100) : 0

  const age = ageInMonths(baby.birth_date, new Date())
  const xMax = Math.min(WHO_MAX_MONTHS, Math.max(3, Math.ceil(age + 1)))
  const curves = useMemo(
    () => (baby.sex && age <= WHO_MAX_MONTHS ? referenceCurves(baby.sex, 'weight', xMax) : undefined),
    [baby.sex, age, xMax],
  )

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pt-safe">
        <h1 className="text-2xl font-semibold">Statistiche</h1>
        <SyncBadge />
      </header>
      <Segmented<StatsRange>
        ariaLabel="Periodo"
        value={range}
        onChange={setRange}
        options={[
          { value: 'today', label: 'Oggi' },
          { value: '7d', label: '7 giorni' },
          { value: '30d', label: '30 giorni' },
        ]}
      />

      <StatCard kind="breastfeeding" title="Allattamento" summary={`${feeding.sessions} sessioni · ${formatDuration(feeding.totalSeconds)}`}>
        <StatGrid>
          <Stat label="Sessioni" value={feeding.sessions} />
          <Stat label="Totale" value={formatDuration(feeding.totalSeconds)} />
          <Stat label="Media" value={feeding.sessions ? formatDuration(feeding.avgSeconds) : '—'} />
        </StatGrid>
        {sideTotal > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-ink-2">
              <span>Sinistro {leftPct}% · {feeding.leftSessions}</span>
              <span>{feeding.rightSessions} · {100 - leftPct}% Destro</span>
            </div>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`Sinistro ${leftPct}%, destro ${100 - leftPct}%`}>
              <div className="bg-feed" style={{ width: `${leftPct}%` }} />
              <div className="bg-feed/35" style={{ width: `${100 - leftPct}%` }} />
            </div>
          </div>
        )}
        {range !== 'today' && <DayBars days={stats.days} value={(d) => d.feedings} label="Pasti al giorno (seno + biberon)" color="bg-feed" />}
      </StatCard>

      <StatCard kind="diaper" title="Pannolini" summary={`${diaper.total} totali`}>
        <StatGrid>
          <Stat label="Totale" value={diaper.total} />
          <Stat label="Bagnati" value={diaper.wet + diaper.mixed} />
          <Stat label="Sporchi" value={diaper.dirty + diaper.mixed} />
        </StatGrid>
        {range !== 'today' && <DayBars days={stats.days} value={(d) => d.diapers} label="Pannolini al giorno" color="bg-diaper" />}
      </StatCard>

      <StatCard kind="bottle" title="Biberon" summary={`${bottle.count} · ${formatNumber(bottle.totalMl, 0)} ml`}>
        <StatGrid>
          <Stat label="Numero" value={bottle.count} />
          <Stat label="Totale" value={`${formatNumber(bottle.totalMl, 0)} ml`} />
          <Stat label="Media" value={bottle.count ? `${formatNumber(bottle.avgMl, 0)} ml` : '—'} />
        </StatGrid>
        {bottle.count > 0 && (
          <p className="text-xs text-ink-2">
            Latte materno {formatNumber(bottle.breastMilkMl, 0)} ml · artificiale {formatNumber(bottle.formulaMl, 0)} ml
          </p>
        )}
      </StatCard>

      <StatCard kind="pumping" title="Tiralatte" summary={`${pumping.sessions} sessioni · ${formatNumber(pumping.totalMl, 0)} ml`}>
        <StatGrid>
          <Stat label="Sessioni" value={pumping.sessions} />
          <Stat label="Durata" value={formatDuration(pumping.totalSeconds)} />
          <Stat label="Quantità" value={`${formatNumber(pumping.totalMl, 0)} ml`} />
        </StatGrid>
      </StatCard>

      <StatCard kind="measurement" title="Crescita" summary={weight ? `Ultimo peso ${formatNumber(weight.latest.value, 3)} kg` : 'Nessun peso registrato'}>
        {weight ? (
          <>
            <StatGrid className="grid-cols-2">
              <Stat label="Ultimo peso" value={`${formatNumber(weight.latest.value, 3)} kg`} sub={formatShortDate(weight.latest.date)} />
              <Stat
                label="Variazione"
                value={weight.delta === null ? '—' : `${weight.delta >= 0 ? '+' : '−'}${formatNumber(Math.abs(weight.delta * 1000), 0)} g`}
                sub={weight.previous ? `dal ${formatShortDate(weight.previous.date)}` : undefined}
              />
            </StatGrid>
            <GrowthChart
              points={weights.map((p) => ({ x: ageInMonths(baby.birth_date, p.date), y: p.value })).filter((p) => p.x >= 0 && p.x <= xMax)}
              curves={curves}
              xMax={xMax}
              xLabel="Età (mesi)"
              unit="kg"
            />
          </>
        ) : null}
      </StatCard>
    </div>
  )
}

function StatCard({ kind, title, summary, children }: { kind: EventKind; title: string; summary: string; children: ReactNode }) {
  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-center gap-3">
        <CategoryIcon kind={kind} />
        <div className="min-w-0">
          <h2 className="font-semibold">{title}</h2>
          <p className="truncate text-sm text-ink-2">{summary}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

function DayBars({ days, value, label, color }: { days: DayBucket[]; value: (d: DayBucket) => number; label: string; color: string }) {
  const max = Math.max(1, ...days.map(value))
  return (
    <div className="space-y-1.5">
      <p className="text-xs text-ink-3">{label}</p>
      <div className="flex h-20 items-end gap-[3px]" role="img" aria-label={label}>
        {days.map((d) => (
          <div key={d.date.getTime()} className="flex h-full flex-1 flex-col justify-end" title={`${d.date.toLocaleDateString('it-IT')}: ${value(d)}`}>
            <div className={clsx('min-h-[2px] rounded-t-sm', color, value(d) === 0 && 'opacity-20')} style={{ height: `${(value(d) / max) * 100}%` }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-ink-3">
        <span>{days[0]?.date.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}</span>
        <span>Oggi</span>
      </div>
    </div>
  )
}

