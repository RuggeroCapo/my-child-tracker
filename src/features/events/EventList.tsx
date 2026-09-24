import { useMemo, useState } from 'react'
import { EventRow } from '@/components/EventRow'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { BabyEvent } from '@/domain/types'
import { formatDayLabel, startOfDay } from '@/lib/time'
import { EventDetailSheet } from './EventDetailSheet'

/** Eventi raggruppati per giorno; tap su un evento → dettaglio/modifica/elimina. */
export function EventList({
  events,
  pageSize = 60,
  dayExtra,
}: {
  events: BabyEvent[]
  pageSize?: number
  /** Riepilogo opzionale a destra dell'intestazione del giorno. */
  dayExtra?: (dayEvents: BabyEvent[]) => string | null
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [visible, setVisible] = useState(pageSize)
  const groups = useMemo(() => {
    const list = events.slice(0, visible)
    const map = new Map<number, BabyEvent[]>()
    for (const e of list) {
      const key = startOfDay(new Date(e.started_at)).getTime()
      const arr = map.get(key)
      if (arr) arr.push(e)
      else map.set(key, [e])
    }
    return [...map.entries()].map(([day, items]) => ({ day: new Date(day), items }))
  }, [events, visible])

  return (
    <div className="space-y-4">
      {groups.map(({ day, items }) => (
        <section key={day.getTime()} className="space-y-2">
          <div className="flex items-baseline justify-between px-1">
            <h3 className="text-sm font-semibold text-ink">{formatDayLabel(day)}</h3>
            {dayExtra && <span className="text-xs text-ink-3">{dayExtra(items)}</span>}
          </div>
          <Card className="divide-y divide-line overflow-hidden">
            {items.map((e) => (
              <EventRow key={e.id} event={e} onClick={() => setSelected(e.id)} />
            ))}
          </Card>
        </section>
      ))}
      {events.length > visible && (
        <Button variant="ghost" block onClick={() => setVisible((v) => v + pageSize)}>
          Mostra altri
        </Button>
      )}
      <EventDetailSheet eventId={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
