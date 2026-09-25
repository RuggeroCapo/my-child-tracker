import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { Sheet } from '@/components/ui/Sheet'
import { useActiveBaby } from '@/stores/babies'
import { useEventsOfKind } from '@/stores/selectors'
import { EventList } from '../events/EventList'
import { VaccinationForm } from './VaccinationForm'

export default function VaccinationsPage() {
  const baby = useActiveBaby()!
  const vaccinations = useEventsOfKind(baby.id, 'vaccination')
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-5">
      <PageHeader title="Vaccinazioni" />
      <Button block size="lg" icon={<Plus className="size-5" />} onClick={() => setOpen(true)}>
        Registra vaccinazione
      </Button>
      <section className="space-y-3">
        <SectionTitle>Storico</SectionTitle>
        {vaccinations.length === 0 ? (
          <EmptyState title="Nessuna vaccinazione registrata">Tieni traccia dei vaccini e delle dosi effettuate.</EmptyState>
        ) : (
          <EventList events={vaccinations} />
        )}
      </section>
      <Sheet open={open} onClose={() => setOpen(false)} title="Vaccinazione">
        <VaccinationForm babyId={baby.id} onSaved={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}
