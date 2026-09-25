import clsx from 'clsx'
import { ArrowRight, ChevronDown, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { SyncBadge } from '@/app/SyncBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { isActiveSession, type BreastSide, type EventKind, type EventOf } from '@/domain/types'
import { useNow } from '@/lib/clock'
import { formatAge, isSameDay } from '@/lib/time'
import { formatNumber } from '@/lib/units'
import { useActiveBaby, useBabies } from '@/stores/babies'
import { useBabyEvents } from '@/stores/selectors'
import { BabySwitcher } from '../babies/BabySwitcher'
import { EventList } from '../events/EventList'
import { KIND_META } from '../kinds'
import { ActiveSessionCard } from './ActiveSessionCard'
import { DayRibbon } from './DayRibbon'
import { BottleQuickSheet, DiaperQuickSheet, FeedingQuickSheet, PumpingQuickSheet } from './QuickSheets'
import { isMeal, StatusHero } from './StatusHero'

type QuickSheet = 'breastfeeding' | 'diaper' | 'bottle' | 'pumping' | null

const SECONDARY: EventKind[] = ['medication', 'measurement', 'vaccination']

const todayFmt = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`
}

export function HomePage() {
  const baby = useActiveBaby()
  const babyCount = useBabies((s) => s.babies.length)
  const events = useBabyEvents(baby?.id)
  const navigate = useNavigate()
  const now = useNow()
  const [sheet, setSheet] = useState<QuickSheet>(null)
  const [switcher, setSwitcher] = useState(false)

  const active = useMemo(
    () => events.filter(isActiveSession) as (EventOf<'breastfeeding'> | EventOf<'pumping'>)[],
    [events],
  )
  const activeKinds = new Set<EventKind>(active.map((e) => e.kind))
  const lastFeed = events.find((e): e is EventOf<'breastfeeding'> => e.kind === 'breastfeeding')
  const lastMeal = events.find(isMeal)
  const lastDiaper = events.find((e): e is EventOf<'diaper'> => e.kind === 'diaper')
  const lastBottle = events.find((e): e is EventOf<'bottle'> => e.kind === 'bottle') ?? null
  const suggestedSide: BreastSide | null = lastFeed ? (lastFeed.details.side === 'left' ? 'right' : 'left') : null
  const today = useMemo(() => events.filter((e) => isSameDay(new Date(e.started_at), new Date())), [events])

  if (!baby) return null

  const count = (kind: EventKind) => today.filter((e) => e.kind === kind).length
  const meals = today.filter(isMeal).length
  const bottleMl = today.reduce((sum, e) => (e.kind === 'bottle' && e.details.unit === 'ml' ? sum + e.details.amount : sum), 0)
  const summary = [plural(meals, 'pasto', 'pasti'), plural(count('diaper'), 'cambio', 'cambi')]
  if (bottleMl > 0) summary.push(`${formatNumber(bottleMl)} ml di biberon`)

  function onQuick(kind: EventKind) {
    if (kind === 'breastfeeding' || kind === 'pumping') {
      if (activeKinds.has(kind)) navigate(KIND_META[kind].path)
      else setSheet(kind)
    } else if (kind === 'diaper' || kind === 'bottle') {
      setSheet(kind)
    } else {
      navigate(KIND_META[kind].path)
    }
  }

  const minorKeys: { kind: EventKind; hint: string }[] = [
    { kind: 'diaper', hint: `${count('diaper')} oggi` },
    { kind: 'bottle', hint: lastBottle ? `ultimo ${formatNumber(lastBottle.details.amount, 1)} ${lastBottle.details.unit}` : 'nessuno' },
    { kind: 'pumping', hint: activeKinds.has('pumping') ? 'in corso' : `${count('pumping')} oggi` },
  ]
  const feeding = KIND_META.breastfeeding
  const FeedIcon = feeding.icon
  const feedingRunning = activeKinds.has('breastfeeding')

  return (
    <div className="pb-4">
      <header className="pt-safe">
        <div className="flex min-h-8 items-center justify-between gap-3">
          <p className="text-sm font-medium capitalize text-ink-2">{todayFmt.format(new Date(now))}</p>
          <SyncBadge />
        </div>
        <button
          type="button"
          className="-mx-1 mt-1 flex max-w-full items-baseline gap-2 rounded-2xl px-1 text-left"
          onClick={() => (babyCount > 1 ? setSwitcher(true) : navigate(`/babies/${baby.id}/edit`))}
          aria-label={babyCount > 1 ? 'Cambia bambino' : 'Profilo bambino'}
        >
          <span className="truncate font-display-tight text-[44px] font-extrabold leading-none">{baby.name}</span>
          {babyCount > 1 && <ChevronDown className="size-6 shrink-0 self-center text-ink-3" />}
        </button>
        <p className="mt-1 text-[15px] text-ink-2">{formatAge(baby.birth_date)}</p>
      </header>

      <div className="mt-6 space-y-3">
        {active.map((e) => (
          <ActiveSessionCard key={e.id} event={e} />
        ))}
        {!feedingRunning && <StatusHero lastMeal={lastMeal} lastDiaper={lastDiaper} suggestedSide={suggestedSide} now={now} />}
      </div>

      <section className="mt-9">
        <h2 className="font-display-tight text-2xl font-bold">Aggiungi</h2>
        <button
          type="button"
          onClick={() => onQuick('breastfeeding')}
          className="mt-3 flex h-[84px] w-full items-center gap-4 rounded-[24px] bg-feed px-5 text-left text-night transition-transform duration-150 ease-out-quart hover:bg-rose/92 active:scale-[0.98]"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-night/10">
            <FeedIcon className="size-7" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display-tight text-[26px] font-extrabold leading-tight">{feeding.label}</span>
            {feedingRunning && (
              <span className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold">
                <span className="size-1.5 rounded-full bg-night animate-pulse-dot" aria-hidden />
                in corso
              </span>
            )}
          </span>
          {feedingRunning ? (
            <ArrowRight className="size-7 shrink-0" strokeWidth={2.5} aria-hidden />
          ) : (
            <Plus className="size-7 shrink-0" strokeWidth={2.5} aria-hidden />
          )}
        </button>

        <div className="mt-2.5 grid grid-cols-3 gap-2.5">
          {minorKeys.map(({ kind, hint }) => {
            const meta = KIND_META[kind]
            const Icon = meta.icon
            const running = activeKinds.has(kind)
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onQuick(kind)}
                className={clsx(
                  'relative flex h-[118px] flex-col items-start justify-between rounded-[22px] p-3.5 text-left transition-transform duration-150 ease-out-quart active:scale-[0.97]',
                  meta.soft,
                )}
              >
                <Icon className={clsx('size-8', meta.text)} aria-hidden />
                <span className="min-w-0 max-w-full">
                  <span className="block truncate text-[15px] font-semibold leading-tight text-ink">{meta.label}</span>
                  <span className="block truncate text-xs text-ink-2 tabular">{hint}</span>
                </span>
                {running && <span className={clsx('absolute right-3.5 top-3.5 size-2 rounded-full animate-pulse-dot', meta.solid)} aria-hidden />}
              </button>
            )
          })}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-2">
          {SECONDARY.map((kind) => {
            const meta = KIND_META[kind]
            const Icon = meta.icon
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onQuick(kind)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface pl-3 pr-4 text-sm font-medium text-ink transition-[background-color,transform] duration-150 ease-out-quart hover:bg-surface-2 active:scale-[0.97] active:bg-surface-2"
              >
                <Icon className={clsx('size-[18px]', meta.text)} aria-hidden />
                {meta.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display-tight text-2xl font-bold">Oggi</h2>
            {today.length > 0 && <p className="mt-0.5 text-sm text-ink-2 tabular">{summary.join(' · ')}</p>}
          </div>
          <Link to="/diary" className="-mr-2 flex h-11 items-center gap-1 rounded-xl px-2 text-sm font-semibold text-ink transition-colors hover:bg-surface-2">
            Diario <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-5">
          <DayRibbon events={today} now={now} />
        </div>
        <div className="mt-5">
          {today.length === 0 ? (
            <EmptyState title="Ancora niente oggi">Ogni registrazione compare qui e sulla riga delle 24 ore.</EmptyState>
          ) : (
            <EventList events={today} showDayHeaders={false} />
          )}
        </div>
      </section>

      <FeedingQuickSheet open={sheet === 'breastfeeding'} onClose={() => setSheet(null)} babyId={baby.id} suggested={suggestedSide} />
      <DiaperQuickSheet open={sheet === 'diaper'} onClose={() => setSheet(null)} babyId={baby.id} />
      {sheet === 'bottle' && <BottleQuickSheet open onClose={() => setSheet(null)} babyId={baby.id} last={lastBottle} />}
      <PumpingQuickSheet open={sheet === 'pumping'} onClose={() => setSheet(null)} babyId={baby.id} />
      <BabySwitcher open={switcher} onClose={() => setSwitcher(false)} />
    </div>
  )
}
