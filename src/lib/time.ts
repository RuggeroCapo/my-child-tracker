const DAY_MS = 86_400_000

const timeFmt = new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit' })
const dayFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
const shortDateFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
const dayMonthFmt = new Intl.DateTimeFormat('it-IT', { day: 'numeric', month: 'short' })

export function formatTime(iso: string | Date): string {
  return timeFmt.format(typeof iso === 'string' ? new Date(iso) : iso)
}

export function formatShortDate(iso: string | Date): string {
  return shortDateFmt.format(typeof iso === 'string' ? new Date(iso) : iso)
}

export function formatDayMonth(d: Date): string {
  return dayMonthFmt.format(d)
}

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime()
}

/** "Oggi", "Ieri" oppure "mercoledì 15 gennaio". */
export function formatDayLabel(d: Date, now: Date = new Date()): string {
  const diff = Math.round((startOfDay(now).getTime() - startOfDay(d).getTime()) / DAY_MS)
  if (diff === 0) return 'Oggi'
  if (diff === 1) return 'Ieri'
  const s = dayFmt.format(d)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Timer: 04:32 oppure 1:04:32. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`
}

/** Durata leggibile: "45 s", "12 min", "2 h 34 min". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  if (s < 60) return `${s} s`
  const totalMin = Math.round(s / 60)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** "adesso", "5 min fa", "2 h 10 min fa", "ieri alle 22:30". */
export function formatAgo(iso: string, now: number): string {
  const diffSec = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (diffSec < 60) return 'adesso'
  if (diffSec < 12 * 3600) return `${formatDuration(diffSec)} fa`
  const d = new Date(iso)
  return `${formatDayLabel(d, new Date(now)).toLowerCase()} alle ${formatTime(d)}`
}

/** Età del bambino: "5 giorni", "3 settimane", "4 mesi", "1 anno e 2 mesi". */
export function formatAge(birthDate: string, now: Date = new Date()): string {
  const birth = new Date(`${birthDate}T00:00:00`)
  const days = Math.floor((startOfDay(now).getTime() - birth.getTime()) / DAY_MS)
  if (days < 0) return 'in arrivo'
  if (days < 14) return days === 1 ? '1 giorno' : `${days} giorni`
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  if (now.getDate() < birth.getDate()) months -= 1
  if (months < 2) {
    const weeks = Math.floor(days / 7)
    return `${weeks} settimane`
  }
  if (months < 24) return `${months} mesi`
  const years = Math.floor(months / 12)
  const rest = months % 12
  const y = years === 1 ? '1 anno' : `${years} anni`
  if (rest === 0) return y
  return `${y} e ${rest === 1 ? '1 mese' : `${rest} mesi`}`
}

/** Età in mesi (frazionari) usando il mese medio WHO di 30,4375 giorni. */
export function ageInMonths(birthDate: string, at: Date): number {
  const birth = new Date(`${birthDate}T00:00:00`)
  return (at.getTime() - birth.getTime()) / DAY_MS / 30.4375
}

/** Valore per <input type="datetime-local"> nel fuso locale. */
export function toLocalInput(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function fromLocalInput(value: string): string {
  return new Date(value).toISOString()
}

export function toDateInput(d: Date): string {
  return toLocalInput(d).slice(0, 10)
}

/** Tolleranza sul futuro accettata dai form (orologi non perfettamente allineati). */
export const FUTURE_TOLERANCE_MS = 5 * 60_000

/**
 * Cambia l'ora di un valore datetime-local mantenendo il giorno.
 * Se l'orario risultante cade nel futuro, passa al giorno prima:
 * alle 3 di notte "23:30" significa ieri sera.
 */
export function withLocalTime(value: string, time: string, now: Date = new Date()): string {
  const next = `${value.slice(0, 10)}T${time}`
  if (new Date(next).getTime() > now.getTime() + FUTURE_TOLERANCE_MS) {
    return `${toDateInput(addDays(new Date(next), -1))}T${time}`
  }
  return next
}

/** Sposta un valore datetime-local di N giorni mantenendo l'ora. */
export function shiftLocalDay(value: string, days: number): string {
  return toLocalInput(addDays(new Date(value), days))
}
