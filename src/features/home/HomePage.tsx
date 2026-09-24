import clsx from 'clsx'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { SyncBadge } from '@/app/SyncBadge'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { isActiveSession, type BreastSide, type EventKind, type EventOf } from '@/domain/types'
import { BREAST_SIDE_LABEL } from '@/i18n/it'
import { useNow } from '@/lib/clock'
import { formatAge, formatAgo, isSameDay } from '@/lib/time'
import { useActiveBaby, useBabies } from '@/stores/babies'
import { useBabyEvents } from '@/stores/selectors'
import { BabyAvatar } from '../babies/BabyAvatar'
import { BabySwitcher } from '../babies/BabySwitcher'
import { EventList } from '../events/EventList'
import { KIND_META } from '../kinds'
import { ActiveSessionCard } from './ActiveSessionCard'
import { BottleQuickSheet, DiaperQuickSheet, FeedingQuickSheet, PumpingQuickSheet } from './QuickSheets'

type QuickSheet = 'breastfeeding' | 'diaper' | 'bottle' | 'pumping' | null

const PRIMARY: EventKind[] = ['breastfeeding', 'diaper', 'bottle', 'pumping']
const SECONDARY: EventKind[] = ['medication', 'measurement', 'vaccination']

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
  const lastMeal = events.find((e) => e.kind === 'breastfeeding' || e.kind === 'bottle')
  const lastDiaper = events.find((e) => e.kind === 'diaper')
  const lastBottle = events.find((e): e is EventOf<'bottle'> => e.kind === 'bottle') ?? null
  const suggestedSide: BreastSide | null = lastFeed ? (lastFeed.details.side === 'left' ? 'right' : 'left') : null
  const today = useMemo(() => events.filter((e) => isSameDay(new Date(e.started_at), new Date())), [events])

  if (!baby) return null

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

  return (
    <div className="space-y-5">
      <header className="flex items-center gap-3 pt-safe">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl py-1 text-left"
          onClick={() => (babyCount > 1 ? setSwitcher(true) : navigate(`/babies/${baby.id}/edit`))}
          aria-label={babyCount > 1 ? 'Cambia bambino' : 'Profilo bambino'}
        >
          <BabyAvatar baby={baby} size="lg" />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-xl font-semibold">
              <span className="truncate">{baby.name}</span>
              {babyCount > 1 && <ChevronDown className="size-5 shrink-0 text-ink-3" />}
            </span>
            <span className="block text-sm text-ink-2">{formatAge(baby.birth_date)}</span>
          </span>
        </button>
        <SyncBadge />
      </header>

      {active.map((e) => (
        <ActiveSessionCard key={e.id} event={e} />
      ))}

      {(lastMeal || lastDiaper) && (
        <div className="grid grid-cols-2 gap-3">
          <LastInfo label="Ultimo pasto" value={lastMeal ? formatAgo(lastMeal.started_at, now) : '—'} detail={lastFeed && lastMeal === lastFeed ? BREAST_SIDE_LABEL[lastFeed.details.side] : lastMeal ? 'Biberon' : undefined} />
          <LastInfo label="Ultimo pannolino" value={lastDiaper ? formatAgo(lastDiaper.started_at, now) : '—'} />
        </div>
      )}

      <section className="space-y-3">
        <SectionTitle>Aggiungi</SectionTitle>
        <div className="grid grid-cols-4 gap-2.5">
          {PRIMARY.map((kind) => {
            const meta = KIND_META[kind]
            const Icon = meta.icon
            const running = activeKinds.has(kind)
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onQuick(kind)}
                className={clsx(
                  'relative flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-3xl text-xs font-semibold text-ink transition-transform active:scale-95',
                  meta.soft,
                )}
              >
                <Icon className={clsx('size-8', meta.text)} aria-hidden />
                {meta.label}
                {running && <span className={clsx('absolute right-2.5 top-2.5 size-2 rounded-full animate-pulse-dot', meta.solid)} aria-label="in corso" />}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {SECONDARY.map((kind) => {
            const meta = KIND_META[kind]
            const Icon = meta.icon
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onQuick(kind)}
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-surface text-sm font-medium text-ink shadow-[var(--shadow-card)] transition-transform active:scale-95 dark:shadow-none"
              >
                <Icon className={clsx('size-5', meta.text)} aria-hidden />
                {meta.label}
              </button>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Oggi</SectionTitle>
          <Link to="/diary" className="flex items-center text-sm font-medium text-ink-2">
            Diario <ChevronRight className="size-4" />
          </Link>
        </div>
        {today.length === 0 ? (
          <EmptyState icon={<CategoryIcon kind="breastfeeding" />} title="Nessun evento oggi">
            Usa i pulsanti qui sopra per registrare il primo.
          </EmptyState>
        ) : (
          <EventList events={today} />
        )}
      </section>

      <FeedingQuickSheet open={sheet === 'breastfeeding'} onClose={() => setSheet(null)} babyId={baby.id} suggested={suggestedSide} />
      <DiaperQuickSheet open={sheet === 'diaper'} onClose={() => setSheet(null)} babyId={baby.id} />
      {sheet === 'bottle' && <BottleQuickSheet open onClose={() => setSheet(null)} babyId={baby.id} last={lastBottle} />}
      <PumpingQuickSheet open={sheet === 'pumping'} onClose={() => setSheet(null)} babyId={baby.id} />
      <BabySwitcher open={switcher} onClose={() => setSwitcher(false)} />
    </div>
  )
}

function LastInfo({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs font-medium text-ink-3">{label}</p>
      <p className="mt-0.5 truncate text-[15px] font-semibold">{value}</p>
      {detail && <p className="truncate text-xs text-ink-2">{detail}</p>}
    </Card>
  )
}
