import type { MeasurementMetric, VolumeUnit } from '@/domain/types'

export const ML_PER_OZ = 29.5735

export function toMl(amount: number, unit: VolumeUnit): number {
  return unit === 'oz' ? amount * ML_PER_OZ : amount
}

/** Converte una misurazione nell'unità canonica (kg per il peso, cm per le lunghezze). */
export function toCanonical(metric: MeasurementMetric, value: number, unit: string): number {
  if (metric === 'weight') {
    if (unit === 'g') return value / 1000
    if (unit === 'lb') return value * 0.45359237
    return value
  }
  return unit === 'in' ? value * 2.54 : value
}

export const CANONICAL_UNIT: Record<MeasurementMetric, string> = {
  weight: 'kg',
  length: 'cm',
  head: 'cm',
}

const numberFmt = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 })

export function formatNumber(n: number, maxFractionDigits = 2): string {
  if (maxFractionDigits === 2) return numberFmt.format(n)
  return new Intl.NumberFormat('it-IT', { maximumFractionDigits: maxFractionDigits }).format(n)
}

/** Accetta sia "2,5" sia "2.5". */
export function parseDecimal(input: string): number | null {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (normalized === '') return null
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}
