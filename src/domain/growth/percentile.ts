import type { BabySex, MeasurementMetric } from '@/domain/types'
import type { Lms } from './types'
import { WHO_LMS } from './who-data'

export const WHO_MAX_MONTHS = 24

/** Percentili mostrati come curve di riferimento. */
export const REFERENCE_PERCENTILES = [3, 15, 50, 85, 97] as const

/** Parametri LMS interpolati linearmente tra i mesi della tabella WHO. */
export function lmsAt(sex: BabySex, metric: MeasurementMetric, ageMonths: number): Lms | null {
  const table = WHO_LMS[sex][metric]
  if (ageMonths < 0 || ageMonths > WHO_MAX_MONTHS) return null
  const i = Math.min(Math.floor(ageMonths), table.length - 2)
  const [m0, L0, M0, S0] = table[i]
  const [m1, L1, M1, S1] = table[i + 1]
  const t = (ageMonths - m0) / (m1 - m0)
  return { L: L0 + (L1 - L0) * t, M: M0 + (M1 - M0) * t, S: S0 + (S1 - S0) * t }
}

/** Valore corrispondente allo z-score dato (metodo LMS di Cole). */
export function valueAtZ({ L, M, S }: Lms, z: number): number {
  if (Math.abs(L) < 1e-9) return M * Math.exp(S * z)
  return M * Math.pow(1 + L * S * z, 1 / L)
}

export function zScore({ L, M, S }: Lms, value: number): number {
  if (Math.abs(L) < 1e-9) return Math.log(value / M) / S
  return (Math.pow(value / M, L) - 1) / (L * S)
}

/** Funzione di ripartizione della normale standard (Abramowitz–Stegun 7.1.26). */
export function normalCdf(z: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(z) / Math.SQRT2))
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-(z * z) / 2)
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2
}

/** Inversa della normale standard (algoritmo di Acklam). */
export function normalInv(p: number): number {
  if (p <= 0 || p >= 1) throw new RangeError('p must be in (0, 1)')
  const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239]
  const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572]
  const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783]
  const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416]
  const pl = 0.02425
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p))
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  const q = p - 0.5
  const r = q * q
  return ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
}

export function valueAtPercentile(lms: Lms, percentile: number): number {
  return valueAtZ(lms, normalInv(percentile / 100))
}

/** Percentile (0–100) di una misura; `null` fuori dall'intervallo WHO 0–24 mesi. */
export function percentileOf(
  sex: BabySex,
  metric: MeasurementMetric,
  ageMonths: number,
  value: number,
): number | null {
  const lms = lmsAt(sex, metric, ageMonths)
  if (!lms || value <= 0) return null
  return normalCdf(zScore(lms, value)) * 100
}

export interface ReferenceCurve {
  percentile: number
  points: { month: number; value: number }[]
}

/** Curve percentili di riferimento campionate ogni `step` mesi. */
export function referenceCurves(
  sex: BabySex,
  metric: MeasurementMetric,
  maxMonths = WHO_MAX_MONTHS,
  step = 0.25,
): ReferenceCurve[] {
  return REFERENCE_PERCENTILES.map((percentile) => {
    const points: { month: number; value: number }[] = []
    for (let m = 0; m <= maxMonths + 1e-9; m += step) {
      const lms = lmsAt(sex, metric, Math.min(m, WHO_MAX_MONTHS))
      if (lms) points.push({ month: m, value: valueAtPercentile(lms, percentile) })
    }
    return { percentile, points }
  })
}

/** Etichetta descrittiva del percentile (nessuna valutazione clinica). */
export function formatPercentile(p: number): string {
  if (p < 1) return '< 1°'
  if (p > 99) return '> 99°'
  return `${Math.round(p)}°`
}
