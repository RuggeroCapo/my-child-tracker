import { useMemo } from 'react'
import { percentileOf, referenceCurves, WHO_MAX_MONTHS } from '@/domain/growth/percentile'
import { latestWithDelta, measurementSeries } from '@/domain/stats'
import type { Baby, EventOf, MeasurementMetric } from '@/domain/types'
import { ageInMonths } from '@/lib/time'
import { CANONICAL_UNIT } from '@/lib/units'

export const METRIC_COLOR: Record<MeasurementMetric, string> = {
  weight: 'var(--color-diaper)',
  length: 'var(--color-growth)',
  head: 'var(--color-pump)',
}

export const METRIC_TABS: { value: MeasurementMetric; label: string }[] = [
  { value: 'weight', label: 'Peso' },
  { value: 'length', label: 'Altezza' },
  { value: 'head', label: 'Circonferenza' },
]

/** Misure di una metrica, finestra del grafico e curve OMS, condivisi da pagina e grafico a schermo intero. */
export function useGrowthData(baby: Baby, measurements: EventOf<'measurement'>[], metric: MeasurementMetric) {
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
  const points = useMemo(
    () =>
      series
        .map((p) => ({ x: ageInMonths(baby.birth_date, p.date), y: p.value }))
        .filter((p) => p.x >= 0 && p.x <= xMax),
    [series, baby.birth_date, xMax],
  )
  const pct =
    latest && baby.sex
      ? percentileOf(baby.sex, metric, ageInMonths(baby.birth_date, latest.latest.date), latest.latest.value)
      : null

  return { series, latest, pct, withinWho, lastAge, xMax, curves, points, unit: CANONICAL_UNIT[metric] }
}
