import { Trash } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import type { EventOf } from '@/domain/types'
import { BREAST_SIDE_LABEL } from '@/i18n/it'
import { formatDuration, formatShortDate, formatTime } from '@/lib/time'
import { useEvent, useMemberName } from '@/stores/selectors'
import { deleteEvent } from '@/sync/actions'
import { ActiveSessionCard } from '../home/ActiveSessionCard'
import { FeedingForm } from './FeedingForm'

/** Dettaglio di un allattamento (in corso o concluso): lato, orari, note. */
export default function FeedingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const found = useEvent(id)
  const createdBy = useMemberName(found?.created_by)
  const endedBy = useMemberName(found?.ended_by)
  const [leaving, setLeaving] = useState(false)

  if (leaving) return null
  // Niente redirect: dopo un reload lo store eventi può essere ancora vuoto per un attimo.
  if (!found || found.deleted_at || found.kind !== 'breastfeeding') {
    return (
      <div className="space-y-5">
        <PageHeader title="Allattamento" />
        <EmptyState title="Allattamento non trovato">Potrebbe essere stato eliminato.</EmptyState>
      </div>
    )
  }
  const event = found as EventOf<'breastfeeding'>
  const active = event.ended_at === null

  return (
    <div className="space-y-5 pb-6 short:space-y-4">
      <PageHeader title={active ? 'Allattamento in corso' : 'Allattamento'} />

      {active ? (
        <ActiveSessionCard event={event} compact detailLink={false} onSwitched={(next) => navigate(`/breastfeeding/${next.id}`, { replace: true })} />
      ) : (
        // La risposta in una frase: i valori modificabili sono già nel form qui sotto.
        <div className="px-1">
          <p className="font-display-snug text-2xl font-bold">
            {BREAST_SIDE_LABEL[event.details.side]}, {formatDuration(event.duration_seconds ?? 0)}
          </p>
          <p className="mt-0.5 text-sm text-ink-2 tabular">
            {formatShortDate(event.started_at)} · {formatTime(event.started_at)} → {formatTime(event.ended_at!)}
          </p>
        </div>
      )}

      <Card className="p-4">
        {/* Rimonta quando la sessione termina, così il form mostra anche l'orario di fine. */}
        <FeedingForm key={`${event.id}-${active}`} babyId={event.baby_id} initial={event} />
      </Card>

      {(createdBy || (endedBy && event.ended_by !== event.created_by)) && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 px-1 text-sm">
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
        </dl>
      )}

      <Button
        variant="ghost"
        block
        icon={<Trash className="size-4" />}
        onClick={() => {
          setLeaving(true)
          deleteEvent(event)
          navigate(-1)
        }}
      >
        Elimina
      </Button>
    </div>
  )
}
