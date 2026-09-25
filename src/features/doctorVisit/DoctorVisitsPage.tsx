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
import { DoctorVisitForm } from './DoctorVisitForm'

export default function DoctorVisitsPage() {
  const baby = useActiveBaby()!
  const visits = useEventsOfKind(baby.id, 'doctor_visit')
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-5">
      <PageHeader title="Visite mediche" />
      <Button block size="lg" icon={<Plus className="size-5" />} onClick={() => setOpen(true)}>
        Registra visita
      </Button>
      <section className="space-y-3">
        <SectionTitle>Storico</SectionTitle>
        {visits.length === 0 ? (
          <EmptyState title="Nessuna visita registrata">Tieni traccia di controlli dal pediatra e visite specialistiche.</EmptyState>
        ) : (
          <EventList events={visits} />
        )}
      </section>
      <Sheet open={open} onClose={() => setOpen(false)} title="Visita medica">
        <DoctorVisitForm babyId={baby.id} onSaved={() => setOpen(false)} />
      </Sheet>
    </div>
  )
}
