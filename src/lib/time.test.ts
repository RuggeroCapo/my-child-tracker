import { describe, expect, it } from 'vitest'
import { formatAge, formatClock, formatDuration } from './time'

describe('time', () => {
  it('formatta il timer', () => {
    expect(formatClock(272)).toBe('04:32')
    expect(formatClock(3872)).toBe('1:04:32')
    expect(formatClock(-3)).toBe('00:00')
  })
  it('formatta le durate', () => {
    expect(formatDuration(30)).toBe('30 s')
    expect(formatDuration(14 * 60)).toBe('14 min')
    expect(formatDuration(2 * 3600 + 34 * 60)).toBe('2 h 34 min')
  })
  it("formatta l'età", () => {
    const now = new Date(2025, 3, 15)
    expect(formatAge('2025-04-10', now)).toBe('5 giorni')
    expect(formatAge('2025-03-20', now)).toBe('3 settimane')
    expect(formatAge('2025-01-12', now)).toBe('3 mesi')
    expect(formatAge('2023-02-01', now)).toBe('2 anni e 2 mesi')
  })
})
