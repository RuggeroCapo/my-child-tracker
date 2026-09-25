import type { Database } from '@/lib/database.types'

type Enums = Database['public']['Enums']

export type EventKind = Enums['event_kind']
export type BreastSide = Enums['breast_side']
export type PumpSide = Enums['pump_side']
export type DiaperType = Enums['diaper_type']
export type StoolAmount = Enums['stool_amount']
export type StoolColor = Enums['stool_color']
export type MilkType = Enums['milk_type']
export type VolumeUnit = Enums['volume_unit']
export type MeasurementMetric = Enums['measurement_metric']
export type BabySex = Enums['baby_sex']
export type MemberRole = Enums['member_role']

export interface FeedingDetails {
  side: BreastSide
}
export interface DiaperDetails {
  type: DiaperType
  stool_amount: StoolAmount | null
  stool_color: StoolColor | null
}
export interface BottleDetails {
  amount: number
  unit: VolumeUnit
  milk_type: MilkType
}
export interface PumpingDetails {
  side: PumpSide
  amount: number | null
  unit: VolumeUnit
}
export interface MedicationDetails {
  medication_id: string | null
  name: string
  dose: number
  unit: string
}
export interface VaccinationDetails {
  vaccine_name: string
  dose_number: number | null
}
export interface MeasurementItem {
  metric: MeasurementMetric
  value: number
  unit: string
}
export interface MeasurementDetails {
  items: MeasurementItem[]
}
export type BathDetails = Record<string, never>
export interface DoctorVisitDetails {
  visit_type: string
}

export interface DetailsByKind {
  breastfeeding: FeedingDetails
  diaper: DiaperDetails
  bottle: BottleDetails
  pumping: PumpingDetails
  medication: MedicationDetails
  vaccination: VaccinationDetails
  measurement: MeasurementDetails
  bath: BathDetails
  doctor_visit: DoctorVisitDetails
}

interface EventBase {
  id: string
  baby_id: string
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  notes: string | null
  created_by: string | null
  ended_by: string | null
  updated_by: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
  /** Solo client: modifica ottimistica non ancora confermata dal server. */
  _local?: boolean
}

export type EventOf<K extends EventKind> = EventBase & { kind: K; details: DetailsByKind[K] }

export type BabyEvent = { [K in EventKind]: EventOf<K> }[EventKind]

/** Dati minimi per creare/modificare un evento (upsert_event). */
export type EventInput = {
  [K in EventKind]: {
    id: string
    baby_id: string
    kind: K
    started_at: string
    ended_at: string | null
    notes: string | null
    details: DetailsByKind[K]
  }
}[EventKind]

export interface Baby {
  id: string
  name: string
  birth_date: string
  sex: BabySex | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface BabyMember {
  baby_id: string
  user_id: string
  role: MemberRole
  display_name: string
}

export interface Medication {
  id: string
  baby_id: string
  name: string
  default_dose: number | null
  default_unit: string | null
  notes: string | null
  archived: boolean
  updated_at: string
}

export type TimedKind = 'breastfeeding' | 'pumping'

export function isTimedKind(kind: EventKind): kind is TimedKind {
  return kind === 'breastfeeding' || kind === 'pumping'
}

export function isActiveSession(e: BabyEvent): boolean {
  return isTimedKind(e.kind) && e.ended_at === null && e.deleted_at === null
}
