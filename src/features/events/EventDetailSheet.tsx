import { Pencil, Trash } from 'lucide-react'
import { useState } from 'react'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import { KIND_LABEL } from '@/i18n/it'
import { formatShortDate, formatTime } from '@/lib/time'
import { useEvent, useMemberName } from '@/stores/selectors'
import { deleteEvent } from '@/sync/actions'
import { describeEvent } from '../kinds'
import { EventForm } from './EventForm'

export function EventDetailSheet({ eventId, onClose }: { eventId: string | null; onClose: () => void }) {
  // Tiene l'ultimo evento mostrato, così il foglio ha ancora un contenuto mentre si chiude.
  const [shownId, setShownId] = useState(eventId)
  if (eventId && eventId !== shownId) setShownId(eventId)
  const event = useEvent(shownId)
  const [editing, setEditing] = useState(false)
  const createdBy = useMemberName(event?.created_by)
  const endedBy = useMemberName(event?.ended_by)

  const close = () => {
    setEditing(false)
    onClose()
  }

  if (!event) return null
  const { title, subtitle } = describeEvent(event)

  return (
    <Sheet open={Boolean(eventId)} onClose={close} title={editing ? `Modifica ${KIND_LABEL[event.kind].toLowerCase()}` : undefined}>
      {editing ? (
        <EventForm babyId={event.baby_id} kind={event.kind} initial={event} onSaved={close} />
      ) : (
        <div className="space-y-5 pb-2">
          <div className="flex items-center gap-3 pt-2">
            <CategoryIcon kind={event.kind} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate font-display-snug text-xl font-bold">{title}</h2>
              <p className="text-ink-2">{subtitle}</p>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-ink-2">{event.ended_at ? 'Inizio' : 'Data e ora'}</dt>
            <dd className="text-ink">
              {formatShortDate(event.started_at)}, {formatTime(event.started_at)}
            </dd>
            {event.ended_at && (
              <>
                <dt className="text-ink-2">Fine</dt>
                <dd className="text-ink">{formatTime(event.ended_at)}</dd>
              </>
            )}
            {createdBy && (
              <>
                <dt className="text-ink-2">Registrato da</dt>
                <dd className="text-ink">{createdBy}</dd>
              </>
            )}
            {endedBy && event.ended_by !== event.created_by && (
              <>
                <dt className="text-ink-2">Terminato da</dt>
                <dd className="text-ink">{endedBy}</dd>
              </>
            )}
            {event.notes && (
              <>
                <dt className="text-ink-2">Note</dt>
                <dd className="whitespace-pre-wrap text-ink">{event.notes}</dd>
              </>
            )}
          </dl>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>
              Modifica
            </Button>
            <Button
              variant="ghost"
              icon={<Trash className="size-4" />}
              onClick={() => {
                deleteEvent(event)
                close()
              }}
            >
              Elimina
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
