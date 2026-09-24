import type { BabyEvent, EventKind, EventOf } from '@/domain/types'
import { BottleForm } from '../bottle/BottleForm'
import { FeedingForm } from '../breastfeeding/FeedingForm'
import { DiaperForm } from '../diaper/DiaperForm'
import { MeasurementForm } from '../growth/MeasurementForm'
import { MedicationForm } from '../medication/MedicationForm'
import { PumpingForm } from '../pumping/PumpingForm'
import { VaccinationForm } from '../vaccination/VaccinationForm'

/** Form di creazione/modifica per qualsiasi tipo di evento. */
export function EventForm({
  babyId,
  kind,
  initial,
  onSaved,
}: {
  babyId: string
  kind: EventKind
  initial?: BabyEvent
  onSaved?: () => void
}) {
  const props = { babyId, onSaved }
  switch (kind) {
    case 'breastfeeding':
      return <FeedingForm {...props} initial={initial as EventOf<'breastfeeding'>} />
    case 'diaper':
      return <DiaperForm {...props} initial={initial as EventOf<'diaper'>} />
    case 'bottle':
      return <BottleForm {...props} initial={initial as EventOf<'bottle'>} />
    case 'pumping':
      return <PumpingForm {...props} initial={initial as EventOf<'pumping'>} />
    case 'medication':
      return <MedicationForm {...props} initial={initial as EventOf<'medication'>} />
    case 'vaccination':
      return <VaccinationForm {...props} initial={initial as EventOf<'vaccination'>} />
    case 'measurement':
      return <MeasurementForm {...props} initial={initial as EventOf<'measurement'>} />
  }
}
