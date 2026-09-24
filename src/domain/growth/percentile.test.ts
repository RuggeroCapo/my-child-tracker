import { describe, expect, it } from 'vitest'
import { lmsAt, normalCdf, normalInv, percentileOf, valueAtPercentile, zScore } from './percentile'

describe('WHO LMS', () => {
  it('restituisce la mediana WHO al 50° percentile', () => {
    // Bambine, peso a 0 mesi: M = 3.2322 kg
    const lms = lmsAt('female', 'weight', 0)!
    expect(valueAtPercentile(lms, 50)).toBeCloseTo(3.2322, 4)
  })

  it('riproduce i percentili pubblicati nelle tabelle WHO', () => {
    // Maschi, peso a 1 mese: 5° = 3.566165, 95° = 5.542933
    const lms = lmsAt('male', 'weight', 1)!
    expect(valueAtPercentile(lms, 5)).toBeCloseTo(3.566165, 2)
    expect(valueAtPercentile(lms, 95)).toBeCloseTo(5.542933, 2)
    // Bambine, circonferenza cranica a 0 mesi: 5° = 31.93054
    expect(valueAtPercentile(lmsAt('female', 'head', 0)!, 5)).toBeCloseTo(31.93054, 2)
  })

  it('interpola tra i mesi', () => {
    const a = lmsAt('male', 'length', 2)!
    const b = lmsAt('male', 'length', 3)!
    const mid = lmsAt('male', 'length', 2.5)!
    expect(mid.M).toBeCloseTo((a.M + b.M) / 2, 6)
  })

  it('è fuori range oltre i 24 mesi', () => {
    expect(lmsAt('male', 'weight', 25)).toBeNull()
    expect(percentileOf('male', 'weight', 30, 12)).toBeNull()
  })

  it('percentile e valore sono inversi', () => {
    const lms = lmsAt('female', 'weight', 6)!
    const v = valueAtPercentile(lms, 85)
    expect(percentileOf('female', 'weight', 6, v)).toBeCloseTo(85, 1)
    expect(zScore(lms, lms.M)).toBeCloseTo(0, 6)
  })

  it('normale standard', () => {
    expect(normalCdf(0)).toBeCloseTo(0.5, 6)
    expect(normalCdf(1.96)).toBeCloseTo(0.975, 3)
    expect(normalInv(0.975)).toBeCloseTo(1.96, 3)
    expect(normalInv(0.03)).toBeCloseTo(-1.8808, 3)
  })
})
