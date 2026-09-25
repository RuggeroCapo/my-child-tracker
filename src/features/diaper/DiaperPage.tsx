import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Sheet } from '@/components/ui/Sheet'
import { Stat, StatGrid } from '@/components/ui/Stat'
import { computeStats, rangeBounds } from '@/domain/stats'
import type { DiaperType } from '@/domain/types'
import { DIAPER_LABEL } from '@/i18n/it'
import { useActiveBaby } from '@/stores/babies'
import { useEventsOfKind } from '@/stores/selectors'
import { toast } from '@/stores/ui'
import { deleteEvent, quickAdd } from '@/sync/actions'
import { EventList } from '../events/EventList'
import { DiaperTypeIcon } from './DiaperDetails'
import { DiaperForm } from './DiaperForm'

export default function DiaperPage() {
  const baby = useActiveBaby()!
  const diapers = useEventsOfKind(baby.id, 'diaper')
  const [form, setForm] = useState(false)
  const today = useMemo(() => {
    const { from, to } = rangeBounds('today', new Date())
    return computeStats(diapers, from, to).diaper
  }, [diapers])

  function record(type: DiaperType) {
    const e = quickAdd(baby.id, 'diaper', { type, stool_amount: null, stool_color: null })
    toast({
      tone: 'success',
      title: 'Pannolino registrato',
      description: DIAPER_LABEL[type],
      action: { label: 'Annulla', onClick: () => deleteEvent(e, { undo: false }) },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pannolini"
        action={
          <IconButton label="Aggiungi con dettagli" onClick={() => setForm(true)}>
            <Plus className="size-6" />
          </IconButton>
        }
      />
      <div className="grid grid-cols-3 gap-3">
        {(['wet', 'dirty', 'mixed'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => record(t)}
            className="flex h-28 flex-col items-center justify-center gap-2 rounded-3xl bg-diaper/10 text-sm font-semibold text-ink transition-[background-color,transform] duration-150 ease-out-quart hover:bg-diaper/15 active:scale-[0.97]"
          >
            <DiaperTypeIcon type={t} />
            {DIAPER_LABEL[t]}
          </button>
        ))}
      </div>
      <p className="-mt-2 px-1 text-sm text-ink-2">Un tocco registra il cambio adesso. Usa + per orario, quantità e colore.</p>

      <Card className="space-y-3 p-4">
        <SectionTitle flush>Oggi</SectionTitle>
        <StatGrid>
          <Stat label="Totale" value={today.total} />
          <Stat label="Bagnati" value={today.wet + today.mixed} />
          <Stat label="Sporchi" value={today.dirty + today.mixed} />
        </StatGrid>
      </Card>

      <section className="space-y-3">
        <SectionTitle>Ultimi pannolini</SectionTitle>
        {diapers.length === 0 ? <EmptyState title="Nessun pannolino registrato">Tocca un tipo qui sopra per registrare il primo cambio.</EmptyState> : <EventList events={diapers} />}
      </section>

      <Sheet open={form} onClose={() => setForm(false)} title="Pannolino">
        <DiaperForm babyId={baby.id} onSaved={() => setForm(false)} />
      </Sheet>
    </div>
  )
}
