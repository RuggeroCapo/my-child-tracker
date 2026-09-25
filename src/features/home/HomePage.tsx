import { ArrowRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { EmptyState } from '@/components/ui/EmptyState'
import { BREAST_SIDE_LABEL } from '@/i18n/it'
import { isActiveSession, type BreastSide, type EventKind, type EventOf } from '@/domain/types'
import { useNow } from '@/lib/clock'
import { isSameDay } from '@/lib/time'
import { formatNumber } from '@/lib/units'
import { useActiveBaby, useBabies } from '@/stores/babies'
import { useBabyEvents } from '@/stores/selectors'
import { BabySwitcher } from '../babies/BabySwitcher'
import { EventList } from '../events/EventList'
import { KIND_META } from '../kinds'
import { ActiveSessionCard } from './ActiveSessionCard'
import { DayRibbon } from './DayRibbon'
import { HomeHeader } from './HomeHeader'
import { BottleQuickSheet, DiaperQuickSheet, FeedingQuickSheet, PumpingQuickSheet } from './QuickSheets'
import { QuickLog } from './QuickLog'
import { isMeal, StatusHero } from './StatusHero'

type QuickSheet = 'breastfeeding' | 'diaper' | 'bottle' | 'pumping' | null

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

  const feedingRunning = activeKinds.has('breastfeeding')

  return (
    <div className="pb-4">
      <HomeHeader
        baby={baby}
        canSwitch={babyCount > 1}
        onPress={() => (babyCount > 1 ? setSwitcher(true) : navigate(`/babies/${baby.id}/edit`))}
      />

      <div className="mt-6 space-y-3">
        {active.map((e) => (
          <ActiveSessionCard key={e.id} event={e} />
        ))}
        {!feedingRunning && <StatusHero lastMeal={lastMeal} lastDiaper={lastDiaper} suggestedSide={suggestedSide} now={now} />}
      </div>

      <QuickLog
        running={activeKinds}
        feedHint={suggestedSide ? `Tocca al ${BREAST_SIDE_LABEL[suggestedSide].toLowerCase()}` : null}
        hints={{
          diaper: `${count('diaper')} oggi`,
          bottle: lastBottle ? `ultimo ${formatNumber(lastBottle.details.amount, 1)} ${lastBottle.details.unit}` : 'nessuno',
          pumping: `${count('pumping')} oggi`,
        }}
        onQuick={onQuick}
      />

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
