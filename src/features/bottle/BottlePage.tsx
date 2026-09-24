import { useMemo } from 'react'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stat, StatGrid } from '@/components/ui/Stat'
import { computeStats, rangeBounds } from '@/domain/stats'
import type { BabyEvent } from '@/domain/types'
import { useNow } from '@/lib/clock'
import { formatAgo } from '@/lib/time'
import { formatNumber, toMl } from '@/lib/units'
import { useActiveBaby } from '@/stores/babies'
import { useEventsOfKind } from '@/stores/selectors'
import { EventList } from '../events/EventList'
import { BottleForm } from './BottleForm'

export default function BottlePage() {
  const baby = useActiveBaby()!
  const bottles = useEventsOfKind(baby.id, 'bottle')
  const now = useNow()
  const last = bottles[0]
  const today = useMemo(() => {
    const { from, to } = rangeBounds('today', new Date())
    return computeStats(bottles, from, to).bottle
  }, [bottles])

  const dayTotal = (items: BabyEvent[]) => {
    const ml = items.reduce((sum, e) => sum + (e.kind === 'bottle' ? toMl(e.details.amount, e.details.unit) : 0), 0)
    return `${formatNumber(ml, 0)} ml`
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Biberon" />
      <Card className="space-y-3 p-4">
        <StatGrid>
          <Stat label="Ultimo" value={last ? `${formatNumber(last.details.amount, 0)} ml` : '—'} sub={last ? formatAgo(last.started_at, now) : undefined} />
          <Stat label="Oggi" value={`${formatNumber(today.totalMl, 0)} ml`} sub={`${today.count} biberon`} />
          <Stat label="Media" value={today.count ? `${formatNumber(today.avgMl, 0)} ml` : '—'} />
        </StatGrid>
      </Card>
      <Card className="p-4">
        <BottleForm key={bottles.length} babyId={baby.id} lastMilkType={last?.details.milk_type} lastAmount={last?.details.amount} />
      </Card>
      <section className="space-y-3">
        <SectionTitle>Storico</SectionTitle>
        {bottles.length === 0 ? <EmptyState title="Nessun biberon registrato" /> : <EventList events={bottles} dayExtra={dayTotal} />}
      </section>
    </div>
  )
}
