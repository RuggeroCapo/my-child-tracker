import { describe, expect, it } from 'vitest'
import { computeStats, latestWithDelta, measurementSeries, rangeBounds } from './stats'
import type { BabyEvent } from './types'

const base = {
  baby_id: 'b',
  notes: null,
  created_by: null,
  ended_by: null,
  updated_by: null,
  created_at: '2025-01-15T00:00:00Z',
  updated_at: '2025-01-15T00:00:00Z',
  deleted_at: null,
}

function at(h: number, m = 0, day = 15) {
  return new Date(2025, 0, day, h, m).toISOString()
}

function feed(id: string, start: string, minutes: number | null, side: 'left' | 'right'): BabyEvent {
  return {
    ...base,
    id,
    kind: 'breastfeeding',
    started_at: start,
    ended_at: minutes === null ? null : new Date(new Date(start).getTime() + minutes * 60_000).toISOString(),
    duration_seconds: minutes === null ? null : minutes * 60,
    details: { side },
  }
}

const events: BabyEvent[] = [
  feed('f1', at(8), 14, 'right'),
  feed('f2', at(5), 18, 'left'),
  feed('f3', at(10), null, 'left'), // in corso
  { ...feed('f4', at(4), 30, 'left'), deleted_at: at(6) }, // eliminato
  { ...base, id: 'd1', kind: 'diaper', started_at: at(9), ended_at: null, duration_seconds: null, details: { type: 'wet', stool_amount: null, stool_color: null } },
  { ...base, id: 'd2', kind: 'diaper', started_at: at(7), ended_at: null, duration_seconds: null, details: { type: 'mixed', stool_amount: 'small', stool_color: 'yellow' } },
  { ...base, id: 'b1', kind: 'bottle', started_at: at(11), ended_at: null, duration_seconds: null, details: { amount: 90, unit: 'ml', milk_type: 'breast_milk' } },
  { ...base, id: 'b2', kind: 'bottle', started_at: at(12), ended_at: null, duration_seconds: null, details: { amount: 4, unit: 'oz', milk_type: 'formula' } },
  { ...base, id: 'b0', kind: 'bottle', started_at: at(12, 0, 13), ended_at: null, duration_seconds: null, details: { amount: 60, unit: 'ml', milk_type: 'formula' } },
  { ...base, id: 'm1', kind: 'measurement', started_at: at(9, 0, 1), ended_at: null, duration_seconds: null, details: { items: [{ metric: 'weight', value: 5800, unit: 'g' }] } },
  { ...base, id: 'm2', kind: 'measurement', started_at: at(9, 0, 15), ended_at: null, duration_seconds: null, details: { items: [{ metric: 'weight', value: 6.2, unit: 'kg' }, { metric: 'length', value: 61, unit: 'cm' }] } },
]

describe('computeStats', () => {
  const now = new Date(2025, 0, 15, 23, 0)

  it('calcola le statistiche di oggi', () => {
    const { from, to } = rangeBounds('today', now)
    const s = computeStats(events, from, to)
    expect(s.feeding.sessions).toBe(3)
    expect(s.feeding.totalSeconds).toBe(32 * 60)
    expect(s.feeding.avgSeconds).toBe(16 * 60)
    expect(s.feeding.leftSeconds).toBe(18 * 60)
    expect(s.feeding.rightSessions).toBe(1)
    expect(s.diaper).toEqual({ total: 2, wet: 1, dirty: 0, mixed: 1 })
    expect(s.bottle.count).toBe(2)
    expect(s.bottle.totalMl).toBeCloseTo(90 + 4 * 29.5735, 3)
    expect(s.days).toHaveLength(1)
  })

  it('include più giorni negli ultimi 7 giorni', () => {
    const { from, to } = rangeBounds('7d', now)
    const s = computeStats(events, from, to)
    expect(s.bottle.count).toBe(3)
    expect(s.days).toHaveLength(7)
    expect(s.days[4].bottleMl).toBe(60)
  })
})

describe('crescita', () => {
  it('converte le unità e calcola la variazione', () => {
    const series = measurementSeries(events, 'weight')
    expect(series.map((p) => p.value)).toEqual([5.8, 6.2])
    const d = latestWithDelta(series)!
    expect(d.delta).toBeCloseTo(0.4, 6)
  })
})
