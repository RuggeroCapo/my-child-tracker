import type {
  BreastSide,
  DiaperType,
  EventKind,
  MeasurementMetric,
  MilkType,
  PumpSide,
  StoolAmount,
  StoolColor,
} from '@/domain/types'

/** Testi dell'interfaccia legati al dominio (punto unico per future traduzioni). */
export const KIND_LABEL: Record<EventKind, string> = {
  breastfeeding: 'Allattamento',
  diaper: 'Pannolino',
  bottle: 'Biberon',
  pumping: 'Tiralatte',
  medication: 'Medicina',
  vaccination: 'Vaccinazione',
  measurement: 'Misurazione',
  bath: 'Bagnetto',
  doctor_visit: 'Visita medica',
}

export const BREAST_SIDE_LABEL: Record<BreastSide, string> = { left: 'Sinistro', right: 'Destro' }
export const PUMP_SIDE_LABEL: Record<PumpSide, string> = { left: 'Sinistro', right: 'Destro', both: 'Entrambi' }
export const DIAPER_LABEL: Record<DiaperType, string> = { wet: 'Bagnato', dirty: 'Sporco', mixed: 'Bagnato + sporco' }
export const STOOL_AMOUNT_LABEL: Record<StoolAmount, string> = { small: 'Poco', medium: 'Medio', large: 'Tanto' }
export const STOOL_COLOR_LABEL: Record<StoolColor, string> = {
  yellow: 'Giallo',
  green: 'Verde',
  brown: 'Marrone',
  black: 'Nero',
  red: 'Rossastro',
  white: 'Chiaro',
}
export const STOOL_COLOR_HEX: Record<StoolColor, string> = {
  yellow: '#E8B931',
  green: '#6B8E23',
  brown: '#8B5A2B',
  black: '#2B2B2B',
  red: '#B5423A',
  white: '#E9E4D4',
}
export const MILK_LABEL: Record<MilkType, string> = {
  breast_milk: 'Latte materno',
  formula: 'Latte artificiale',
  other: 'Altro',
}
export const METRIC_LABEL: Record<MeasurementMetric, string> = {
  weight: 'Peso',
  length: 'Lunghezza',
  head: 'Circonferenza cranica',
}
export const METRIC_SHORT: Record<MeasurementMetric, string> = { weight: 'Peso', length: 'Altezza', head: 'Cranio' }
