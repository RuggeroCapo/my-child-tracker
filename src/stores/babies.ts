import { create } from 'zustand'
import type { Baby, BabyMember, Medication } from '@/domain/types'

const ACTIVE_KEY = 'bebe-active-baby'

function readActive(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

interface BabiesState {
  babies: Baby[]
  members: Record<string, BabyMember[]>
  medications: Record<string, Medication[]>
  activeBabyId: string | null
  /** true dopo il primo caricamento (da cache locale o dal server). */
  loaded: boolean
  setBabies: (babies: Baby[], members: Record<string, BabyMember[]>) => void
  setMedications: (babyId: string, meds: Medication[]) => void
  setActive: (babyId: string | null) => void
  reset: (state?: Partial<Pick<BabiesState, 'babies' | 'members' | 'medications' | 'loaded'>>) => void
}

export const useBabies = create<BabiesState>()((set) => ({
  babies: [],
  members: {},
  medications: {},
  activeBabyId: readActive(),
  loaded: false,
  setBabies: (babies, members) =>
    set((s) => {
      const active = babies.some((b) => b.id === s.activeBabyId) ? s.activeBabyId : (babies[0]?.id ?? null)
      if (active !== s.activeBabyId) persistActive(active)
      return { babies, members, activeBabyId: active, loaded: true }
    }),
  setMedications: (babyId, meds) => set((s) => ({ medications: { ...s.medications, [babyId]: meds } })),
  setActive: (babyId) => {
    persistActive(babyId)
    set({ activeBabyId: babyId })
  },
  reset: (state) =>
    set({
      babies: state?.babies ?? [],
      members: state?.members ?? {},
      medications: state?.medications ?? {},
      loaded: state?.loaded ?? false,
    }),
}))

function persistActive(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {
    // storage non disponibile (es. navigazione privata)
  }
}

export function useActiveBaby(): Baby | null {
  return useBabies((s) => s.babies.find((b) => b.id === s.activeBabyId) ?? null)
}
