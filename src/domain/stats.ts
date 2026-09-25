import { addDays, startOfDay } from '@/lib/time'
import { toCanonical, toMl } from '@/lib/units'
import type { BabyEvent, EventOf, MeasurementMetric } from './types'

export type StatsRange = 'today' | '7d' | '30d'

export const RANGE_DAYS: Record<StatsRange, number> = { today: 1, '7d': 7, '30d': 30 }

export function rangeBounds(range: StatsRange, now: Date): { from: Date; to: Date; days: number } {
  const days = RANGE_DAYS[range]
  return { from: startOfDay(addDays(now, -(days - 1))), to: now, days }
}

function live(events: BabyEvent[]): BabyEvent[] {
  return events.filter((e) => !e.deleted_at)
}

function ofKind<K extends BabyEvent['kind']>(events: BabyEvent[], kind: K): EventOf<K>[] {
  return events.filter((e) => e.kind === kind) as EventOf<K>[]
}

function inRange(e: BabyEvent, from: Date, to: Date): boolean {
  const t = new Date(e.started_at).getTime()
  return t >= from.getTime() && t <= to.getTime()
}

export interface DayBucket {
  date: Date
  feedings: number
  bottleMl: number
  diapers: number
}

export interface PeriodStats {
  feeding: {
    sessions: number
    totalSeconds: number
    avgSeconds: number
    leftSeconds: number
    rightSeconds: number
    leftSessions: number
    rightSessions: number
  }
  diaper: { total: number; wet: number; dirty: number; mixed: number }
  bottle: { count: number; totalMl: number; avgMl: number; breastMilkMl: number; formulaMl: number }
  pumping: { sessions: number; totalSeconds: number; totalMl: number }
  medication: { count: number }
  days: DayBucket[]
}

/** Statistiche del periodo; le sessioni ancora in corso non entrano nelle durate. */
export function computeStats(allEvents: BabyEvent[], from: Date, to: Date): PeriodStats {
  const events = live(allEvents).filter((e) => inRange(e, from, to))

  const feeds = ofKind(events, 'breastfeeding')
  const endedFeeds = feeds.filter((e) => e.duration_seconds !== null)
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const feedTotal = sum(endedFeeds.map((e) => e.duration_seconds ?? 0))
  const left = endedFeeds.filter((e) => e.details.side === 'left')
  const right = endedFeeds.filter((e) => e.details.side === 'right')

  const diapers = ofKind(events, 'diaper')
  const bottles = ofKind(events, 'bottle')
  const bottleMl = bottles.map((e) => toMl(e.details.amount, e.details.unit))
  const pumps = ofKind(events, 'pumping').filter((e) => e.ended_at !== null)

  const days: DayBucket[] = []
  for (let d = startOfDay(from); d <= to; d = addDays(d, 1)) {
    const next = addDays(d, 1)
    const dayEvents = events.filter((e) => {
      const t = new Date(e.started_at).getTime()
      return t >= d.getTime() && t < next.getTime()
    })
    days.push({
      date: d,
      feedings: dayEvents.filter((e) => e.kind === 'breastfeeding' || e.kind === 'bottle').length,
      bottleMl: sum(ofKind(dayEvents, 'bottle').map((e) => toMl(e.details.amount, e.details.unit))),
      diapers: dayEvents.filter((e) => e.kind === 'diaper').length,
    })
  }

  return {
    feeding: {
      sessions: feeds.length,
      totalSeconds: feedTotal,
      avgSeconds: endedFeeds.length ? feedTotal / endedFeeds.length : 0,
      leftSeconds: sum(left.map((e) => e.duration_seconds ?? 0)),
      rightSeconds: sum(right.map((e) => e.duration_seconds ?? 0)),
      leftSessions: left.length,
      rightSessions: right.length,
    },
    diaper: {
      total: diapers.length,
      wet: diapers.filter((e) => e.details.type === 'wet').length,
      dirty: diapers.filter((e) => e.details.type === 'dirty').length,
      mixed: diapers.filter((e) => e.details.type === 'mixed').length,
    },
    bottle: {
      count: bottles.length,
      totalMl: sum(bottleMl),
      avgMl: bottles.length ? sum(bottleMl) / bottles.length : 0,
      breastMilkMl: sum(
        bottles.filter((e) => e.details.milk_type === 'breast_milk').map((e) => toMl(e.details.amount, e.details.unit)),
      ),
      formulaMl: sum(
        bottles.filter((e) => e.details.milk_type === 'formula').map((e) => toMl(e.details.amount, e.details.unit)),
      ),
    },
    pumping: {
      sessions: pumps.length,
      totalSeconds: sum(pumps.map((e) => e.duration_seconds ?? 0)),
      totalMl: sum(pumps.map((e) => (e.details.amount ? toMl(e.details.amount, e.details.unit) : 0))),
    },
    medication: { count: ofKind(events, 'medication').length },
    days,
  }
}

export interface MeasurementPoint {
  eventId: string
  date: Date
  /** Valore nell'unità canonica (kg / cm). */
  value: number
}

/** Serie storica di una metrica, in ordine cronologico. */
export function measurementSeries(allEvents: BabyEvent[], metric: MeasurementMetric): MeasurementPoint[] {
  const points: MeasurementPoint[] = []
  for (const e of ofKind(live(allEvents), 'measurement')) {
    const item = e.details.items.find((i) => i.metric === metric)
    if (item) points.push({ eventId: e.id, date: new Date(e.started_at), value: toCanonical(metric, item.value, item.unit) })
  }
  return points.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Ultimo valore registrato per ciascuna misura (in unità canoniche). */
export function latestMeasurements(allEvents: BabyEvent[]): Record<MeasurementMetric, MeasurementPoint | null> {
  const metrics: MeasurementMetric[] = ['weight', 'length', 'head']
  return Object.fromEntries(
    metrics.map((m) => {
      const series = measurementSeries(allEvents, m)
      return [m, series.length ? series[series.length - 1] : null]
    }),
  ) as Record<MeasurementMetric, MeasurementPoint | null>
}

export interface LatestWithDelta {
  latest: MeasurementPoint
  previous: MeasurementPoint | null
  delta: number | null
}

export function latestWithDelta(series: MeasurementPoint[]): LatestWithDelta | null {
  if (series.length === 0) return null
  const latest = series[series.length - 1]
  const previous = series.length > 1 ? series[series.length - 2] : null
  return { latest, previous, delta: previous ? latest.value - previous.value : null }
}
