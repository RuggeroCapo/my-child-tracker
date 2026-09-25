import { Bath, ChartSpline, Pill, Stethoscope, Syringe } from 'lucide-react'
import type { ComponentType, SVGProps } from 'react'
import { BottleIcon, DiaperIcon, FeedingIcon, PumpIcon } from '@/components/icons'
import type { BabyEvent, EventKind } from '@/domain/types'
import {
  BREAST_SIDE_LABEL,
  DIAPER_LABEL,
  KIND_LABEL,
  METRIC_SHORT,
  MILK_LABEL,
  PUMP_SIDE_LABEL,
  STOOL_AMOUNT_LABEL,
  STOOL_COLOR_LABEL,
} from '@/i18n/it'
import { formatDuration } from '@/lib/time'
import { formatNumber } from '@/lib/units'

type Icon = ComponentType<SVGProps<SVGSVGElement> & { className?: string }>

export interface KindMeta {
  label: string
  icon: Icon
  /** Classi statiche (Tailwind deve poterle rilevare). */
  text: string
  soft: string
  solid: string
  path: string
}

/**
 * Registro dei tipi di evento. Per aggiungere una nuova categoria (es. sonno)
 * basta estendere l'enum `event_kind` lato DB, i tipi e questa mappa.
 */
export const KIND_META: Record<EventKind, KindMeta> = {
  breastfeeding: { label: KIND_LABEL.breastfeeding, icon: FeedingIcon, text: 'text-feed', soft: 'bg-feed/12', solid: 'bg-feed', path: '/breastfeeding' },
  diaper: { label: KIND_LABEL.diaper, icon: DiaperIcon, text: 'text-diaper', soft: 'bg-diaper/12', solid: 'bg-diaper', path: '/diaper' },
  bottle: { label: KIND_LABEL.bottle, icon: BottleIcon, text: 'text-bottle', soft: 'bg-bottle/14', solid: 'bg-bottle', path: '/bottle' },
  pumping: { label: KIND_LABEL.pumping, icon: PumpIcon, text: 'text-pump', soft: 'bg-pump/12', solid: 'bg-pump', path: '/pumping' },
  medication: { label: 'Medicine', icon: Pill, text: 'text-med', soft: 'bg-med/12', solid: 'bg-med', path: '/medications' },
  vaccination: { label: 'Vaccini', icon: Syringe, text: 'text-vax', soft: 'bg-vax/12', solid: 'bg-vax', path: '/vaccinations' },
  measurement: { label: 'Crescita', icon: ChartSpline, text: 'text-growth', soft: 'bg-growth/12', solid: 'bg-growth', path: '/growth' },
  bath: { label: KIND_LABEL.bath, icon: Bath, text: 'text-bath', soft: 'bg-bath/12', solid: 'bg-bath', path: '/bath' },
  doctor_visit: { label: KIND_LABEL.doctor_visit, icon: Stethoscope, text: 'text-visit', soft: 'bg-visit/12', solid: 'bg-visit', path: '/doctor-visit' },
}

function volume(amount: number, unit: string) {
  return `${formatNumber(amount, 1)} ${unit}`
}

/** Titolo e sottotitolo di un evento per liste e timeline. */
export function describeEvent(e: BabyEvent): { title: string; subtitle: string } {
  switch (e.kind) {
    case 'breastfeeding':
      return {
        title: KIND_LABEL.breastfeeding,
        subtitle: [
          BREAST_SIDE_LABEL[e.details.side],
          e.ended_at ? formatDuration(e.duration_seconds ?? 0) : 'in corso',
        ].join(' · '),
      }
    case 'diaper': {
      const parts = [DIAPER_LABEL[e.details.type]]
      if (e.details.stool_amount) parts.push(STOOL_AMOUNT_LABEL[e.details.stool_amount].toLowerCase())
      if (e.details.stool_color) parts.push(STOOL_COLOR_LABEL[e.details.stool_color].toLowerCase())
      return { title: KIND_LABEL.diaper, subtitle: parts.join(' · ') }
    }
    case 'bottle':
      return {
        title: KIND_LABEL.bottle,
        subtitle: `${volume(e.details.amount, e.details.unit)} · ${MILK_LABEL[e.details.milk_type].toLowerCase()}`,
      }
    case 'pumping': {
      const parts = [PUMP_SIDE_LABEL[e.details.side]]
      parts.push(e.ended_at ? formatDuration(e.duration_seconds ?? 0) : 'in corso')
      if (e.details.amount) parts.push(volume(e.details.amount, e.details.unit))
      return { title: KIND_LABEL.pumping, subtitle: parts.join(' · ') }
    }
    case 'medication':
      return { title: e.details.name, subtitle: `${formatNumber(e.details.dose)} ${e.details.unit}` }
    case 'vaccination':
      return {
        title: e.details.vaccine_name,
        subtitle: e.details.dose_number ? `${e.details.dose_number}ª dose` : KIND_LABEL.vaccination,
      }
    case 'measurement':
      return {
        title: KIND_LABEL.measurement,
        subtitle: e.details.items.map((i) => `${METRIC_SHORT[i.metric]} ${formatNumber(i.value)} ${i.unit}`).join(' · '),
      }
    case 'bath':
      return {
        title: KIND_LABEL.bath,
        subtitle: e.ended_at ? formatDuration(e.duration_seconds ?? 0) : 'in corso',
      }
    case 'doctor_visit':
      return { title: e.details.visit_type, subtitle: KIND_LABEL.doctor_visit }
  }
}
