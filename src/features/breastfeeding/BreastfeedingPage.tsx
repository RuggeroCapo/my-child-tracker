import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Sheet } from '@/components/ui/Sheet'
import { Stat, StatGrid } from '@/components/ui/Stat'
import { computeStats, rangeBounds } from '@/domain/stats'
import type { BreastSide } from '@/domain/types'
import { formatDuration } from '@/lib/time'
import { useActiveBaby } from '@/stores/babies'
import { useActiveSession, useEventsOfKind } from '@/stores/selectors'
import { startSession } from '@/sync/actions'
import { FeedingIcon } from '@/components/icons'
import { EventList } from '../events/EventList'
import { ActiveSessionCard } from '../home/ActiveSessionCard'
import { FeedingForm } from './FeedingForm'
import { primeLockScreenAudio } from './lockScreen'

export default function BreastfeedingPage() {
  const baby = useActiveBaby()!
  const feeds = useEventsOfKind(baby.id, 'breastfeeding')
  const active = useActiveSession(baby.id, 'breastfeeding')
  const [params, setParams] = useSearchParams()
  const [manual, setManual] = useState(params.get('manual') === '1')
  const last = feeds.find((e) => e.ended_at) ?? null
  const suggested: BreastSide | null = last ? (last.details.side === 'left' ? 'right' : 'left') : null
  const today = useMemo(() => {
    const { from, to } = rangeBounds('today', new Date())
    return computeStats(feeds, from, to).feeding
  }, [feeds])

  function closeManual() {
    setManual(false)
    if (params.has('manual')) setParams({}, { replace: true })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Allattamento"
        action={
          <IconButton label="Inserisci manualmente" onClick={() => setManual(true)}>
            <Plus className="size-6" />
          </IconButton>
        }
      />

      {active ? (
        <ActiveSessionCard event={active} />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(['left', 'right'] as const).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => {
                primeLockScreenAudio()
                startSession(baby.id, 'breastfeeding', { side })
              }}
              className={clsx(
                'flex h-36 flex-col items-center justify-center gap-2 rounded-3xl border-2 font-semibold transition-transform duration-150 ease-out-quart active:scale-[0.97]',
                suggested === side ? 'border-feed bg-feed/12 text-ink' : 'frost border-transparent text-ink-2',
              )}
            >
              <FeedingIcon className="size-8 text-feed" />
              Seno {side === 'left' ? 'sinistro' : 'destro'}
              <span className={clsx('text-xs font-semibold', suggested === side ? 'text-rose-ink' : 'invisible')}>Suggerito</span>
            </button>
          ))}
        </div>
      )}

      <Card className="space-y-3 p-4">
        <SectionTitle flush>Oggi</SectionTitle>
        <StatGrid>
          <Stat label="Sessioni" value={today.sessions} />
          <Stat label="Totale" value={formatDuration(today.totalSeconds)} />
          <Stat label="Sx / Dx" value={`${today.leftSessions} / ${today.rightSessions}`} />
        </StatGrid>
      </Card>

      <section className="space-y-3">
        <SectionTitle>Ultimi allattamenti</SectionTitle>
        {feeds.length === 0 ? (
          <EmptyState title="Nessun allattamento registrato">Scegli un lato per avviare il timer.</EmptyState>
        ) : (
          <EventList events={feeds} />
        )}
      </section>

      <Sheet open={manual} onClose={closeManual} title="Allattamento passato">
        <FeedingForm babyId={baby.id} onSaved={closeManual} />
      </Sheet>
    </div>
  )
}
