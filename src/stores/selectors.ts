import { useMemo } from 'react'
import { isActiveSession, type BabyEvent, type EventKind, type EventOf, type TimedKind } from '@/domain/types'
import { useActiveBaby, useBabies } from './babies'
import { useEvents } from './events'
import { useSession } from './session'

/** Eventi non eliminati del bambino, dal più recente. */
export function useBabyEvents(babyId: string | null | undefined): BabyEvent[] {
  const byId = useEvents((s) => s.byId)
  return useMemo(() => {
    if (!babyId) return []
    return Object.values(byId)
      .filter((e) => e.baby_id === babyId && !e.deleted_at)
      .sort((a, b) => (a.started_at < b.started_at ? 1 : a.started_at > b.started_at ? -1 : 0))
  }, [byId, babyId])
}

export function useEventsOfKind<K extends EventKind>(babyId: string | null | undefined, kind: K): EventOf<K>[] {
  const all = useBabyEvents(babyId)
  return useMemo(() => all.filter((e) => e.kind === kind) as EventOf<K>[], [all, kind])
}

export function useActiveSession<K extends TimedKind>(babyId: string | null | undefined, kind: K): EventOf<K> | null {
  const all = useEventsOfKind(babyId, kind)
  return useMemo(() => all.find((e) => isActiveSession(e as BabyEvent)) ?? null, [all])
}

export function useEvent(id: string | null | undefined): BabyEvent | null {
  return useEvents((s) => (id ? (s.byId[id] ?? null) : null))
}

export function useMyRole() {
  const baby = useActiveBaby()
  const userId = useSession((s) => s.session?.user.id)
  const members = useBabies((s) => (baby ? s.members[baby.id] : undefined))
  return members?.find((m) => m.user_id === userId)?.role ?? null
}

/** Nome del genitore (per "Avviato da ..."). */
export function useMemberName(userId: string | null | undefined): string | null {
  const me = useSession((s) => s.session?.user.id)
  const members = useBabies((s) => s.members)
  if (!userId) return null
  if (userId === me) return 'te'
  for (const list of Object.values(members)) {
    const m = list.find((x) => x.user_id === userId)
    if (m) return m.display_name
  }
  return null
}
