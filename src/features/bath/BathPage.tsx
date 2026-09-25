import { Bath, Plus } from 'lucide-react'
import { useState } from 'react'
import { IconButton } from '@/components/ui/Button'
import { SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Sheet } from '@/components/ui/Sheet'
import { useActiveBaby } from '@/stores/babies'
import { useEventsOfKind } from '@/stores/selectors'
import { toast } from '@/stores/ui'
import { deleteEvent, quickAdd } from '@/sync/actions'
import { EventList } from '../events/EventList'
import { BathForm } from './BathForm'

export default function BathPage() {
  const baby = useActiveBaby()!
  const baths = useEventsOfKind(baby.id, 'bath')
  const [form, setForm] = useState(false)

  function record() {
    const e = quickAdd(baby.id, 'bath', {})
    toast({
      tone: 'success',
      title: 'Bagnetto registrato',
      action: { label: 'Annulla', onClick: () => deleteEvent(e, { undo: false }) },
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Bagnetto"
        action={
          <IconButton label="Aggiungi con dettagli" onClick={() => setForm(true)}>
            <Plus className="size-6" />
          </IconButton>
        }
      />
      <button
        type="button"
        onClick={record}
        className="flex h-28 w-full flex-col items-center justify-center gap-2 rounded-3xl bg-bath/10 text-base font-semibold text-ink transition-[background-color,transform] duration-150 ease-out-quart hover:bg-bath/15 active:scale-[0.97]"
      >
        <Bath className="size-8 text-bath" aria-hidden />
        Bagnetto fatto adesso
      </button>
      <p className="-mt-2 px-1 text-sm text-ink-2">Un tocco registra il bagnetto adesso. Usa + per scegliere l'orario o aggiungere una nota.</p>

      <section className="space-y-3">
        <SectionTitle>Ultimi bagnetti</SectionTitle>
        {baths.length === 0 ? <EmptyState title="Nessun bagnetto registrato">Tocca il pulsante qui sopra per registrare il primo.</EmptyState> : <EventList events={baths} />}
      </section>

      <Sheet open={form} onClose={() => setForm(false)} title="Bagnetto">
        <BathForm babyId={baby.id} onSaved={() => setForm(false)} />
      </Sheet>
    </div>
  )
}
