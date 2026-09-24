import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { Stat, StatGrid } from '@/components/ui/Stat'
import { computeStats, rangeBounds, type StatsRange } from '@/domain/stats'
import type { PumpSide } from '@/domain/types'
import { PUMP_SIDE_LABEL } from '@/i18n/it'
import { formatDuration } from '@/lib/time'
import { formatNumber } from '@/lib/units'
import { useActiveBaby } from '@/stores/babies'
import { useActiveSession, useEventsOfKind } from '@/stores/selectors'
import { startSession } from '@/sync/actions'
import { EventList } from '../events/EventList'
import { ActiveSessionCard } from '../home/ActiveSessionCard'
import { PumpingForm } from './PumpingForm'

export default function PumpingPage() {
  const baby = useActiveBaby()!
  const sessions = useEventsOfKind(baby.id, 'pumping')
  const active = useActiveSession(baby.id, 'pumping')
  const [side, setSide] = useState<PumpSide>(sessions[0]?.details.side ?? 'both')
  const [range, setRange] = useState<StatsRange>('today')
  const [params, setParams] = useSearchParams()
  const [manual, setManual] = useState(params.get('manual') === '1')
  const totals = useMemo(() => {
    const { from, to } = rangeBounds(range, new Date())
    return computeStats(sessions, from, to).pumping
  }, [sessions, range])

  function closeManual() {
    setManual(false)
    if (params.has('manual')) setParams({}, { replace: true })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tiralatte"
        action={
          <IconButton label="Registra senza timer" onClick={() => setManual(true)}>
            <Plus className="size-6" />
          </IconButton>
        }
      />
      {active ? (
        <ActiveSessionCard event={active} />
      ) : (
        <Card className="space-y-4 p-4">
          <Segmented<PumpSide>
            tone="violet"
            ariaLabel="Lato"
            value={side}
            onChange={setSide}
            options={(['left', 'right', 'both'] as const).map((s) => ({ value: s, label: PUMP_SIDE_LABEL[s] }))}
          />
          <button
            type="button"
            onClick={() => startSession(baby.id, 'pumping', { side, amount: null, unit: 'ml' })}
            className={clsx('flex h-16 w-full items-center justify-center rounded-2xl bg-violet text-lg font-semibold text-white shadow-sm shadow-violet/25 active:scale-[0.98]')}
          >
            Avvia timer
          </button>
        </Card>
      )}

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <SectionTitle className="px-0">Totali</SectionTitle>
          <Segmented<StatsRange>
            className="w-56"
            tone="violet"
            ariaLabel="Periodo"
            value={range}
            onChange={setRange}
            options={[
              { value: 'today', label: 'Oggi' },
              { value: '7d', label: '7 gg' },
              { value: '30d', label: '30 gg' },
            ]}
          />
        </div>
        <StatGrid>
          <Stat label="Sessioni" value={totals.sessions} />
          <Stat label="Durata" value={formatDuration(totals.totalSeconds)} />
          <Stat label="Quantità" value={`${formatNumber(totals.totalMl, 0)} ml`} />
        </StatGrid>
      </Card>

      <section className="space-y-3">
        <SectionTitle>Storico</SectionTitle>
        {sessions.length === 0 ? <EmptyState title="Nessuna sessione registrata" /> : <EventList events={sessions} />}
      </section>

      <Sheet open={manual} onClose={closeManual} title="Sessione tiralatte">
        <PumpingForm babyId={baby.id} onSaved={closeManual} />
      </Sheet>
    </div>
  )
}
