import { syncServerClock } from '@/lib/clock'
import { useBabies } from '@/stores/babies'
import { useEvents } from '@/stores/events'
import { useOutbox } from '@/stores/outbox'
import { useUi } from '@/stores/ui'
import { loadBabies, loadMedications } from './babies'
import { flushOutbox, resetOutboxRunner } from './outbox'
import { clearPersisted, hydrate, startPersisting } from './persist'
import { pullBaby } from './pull'
import { subscribeRealtime, unsubscribeRealtime } from './realtime'

/**
 * Ciclo di sincronizzazione:
 *   cache locale → coda offline → bambini → delta pull → Realtime.
 * Si ripete al ritorno online, quando l'app torna in primo piano e quando il
 * canale Realtime si riconnette.
 */

let currentUser: string | null = null
let cleanup: (() => void)[] = []
let resyncing: Promise<void> | null = null
let resyncAgain = false
let retryTimer: ReturnType<typeof setTimeout> | null = null

const pullTimers = new Map<string, ReturnType<typeof setTimeout>>()

function schedulePull(babyId: string, delay = 120) {
  const t = pullTimers.get(babyId)
  if (t) clearTimeout(t)
  pullTimers.set(
    babyId,
    setTimeout(() => {
      pullTimers.delete(babyId)
      void pullBaby(babyId).catch(() => scheduleResync(5000))
    }, delay),
  )
}

let babiesTimer: ReturnType<typeof setTimeout> | null = null
function scheduleBabiesReload() {
  if (babiesTimer) clearTimeout(babiesTimer)
  babiesTimer = setTimeout(() => {
    babiesTimer = null
    void loadBabies()
      .then(ensureSubscriptions)
      .catch(() => {})
  }, 200)
}

const medsTimers = new Map<string, ReturnType<typeof setTimeout>>()
function scheduleMedsReload(babyId: string) {
  const t = medsTimers.get(babyId)
  if (t) clearTimeout(t)
  medsTimers.set(
    babyId,
    setTimeout(() => {
      medsTimers.delete(babyId)
      void loadMedications([babyId]).catch(() => {})
    }, 200),
  )
}

function ensureSubscriptions() {
  const ids = useBabies.getState().babies.map((b) => b.id)
  subscribeRealtime(ids, {
    onEventsChanged: (babyId) => schedulePull(babyId),
    onBabiesChanged: scheduleBabiesReload,
    onMedicationsChanged: scheduleMedsReload,
    onSubscribed: () => {
      // Recupera ciò che è successo mentre il canale era disconnesso.
      void flushOutbox()
      useBabies.getState().babies.forEach((b) => schedulePull(b.id, 0))
    },
  })
  // Bambini appena aggiunti: primo download completo.
  const cursors = useEvents.getState().cursors
  ids.filter((id) => !cursors[id]).forEach((id) => schedulePull(id, 0))
}

function scheduleResync(delay: number) {
  if (retryTimer) return
  retryTimer = setTimeout(() => {
    retryTimer = null
    void resync()
  }, delay)
}

async function doResync() {
  const ui = useUi.getState()
  if (!navigator.onLine) {
    ui.setSyncStatus('offline')
    return
  }
  ui.setSyncStatus('syncing')
  try {
    await syncServerClock()
    await flushOutbox()
    const babies = await loadBabies()
    const ids = babies.map((b) => b.id)
    await Promise.all([loadMedications(ids), ...ids.map((id) => pullBaby(id))])
    ensureSubscriptions()
    ui.setSyncStatus(useOutbox.getState().ops.length ? 'syncing' : 'synced')
  } catch (e) {
    console.warn('resync failed', e)
    ui.setSyncStatus(navigator.onLine ? 'error' : 'offline')
    scheduleResync(10_000)
  }
}

export function resync(): Promise<void> {
  if (!currentUser) return Promise.resolve()
  if (resyncing) {
    resyncAgain = true
    return resyncing
  }
  resyncing = doResync().finally(() => {
    resyncing = null
    if (resyncAgain) {
      resyncAgain = false
      void resync()
    }
  })
  return resyncing
}

export async function startSync(userId: string): Promise<void> {
  if (currentUser === userId) return
  if (currentUser) await stopSync()
  currentUser = userId

  await hydrate(userId)
  if (currentUser !== userId) return
  cleanup.push(startPersisting(userId))

  const onOnline = () => void resync()
  const onOffline = () => useUi.getState().setSyncStatus('offline')
  const onVisible = () => document.visibilityState === 'visible' && void resync()
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  document.addEventListener('visibilitychange', onVisible)
  cleanup.push(() => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
    document.removeEventListener('visibilitychange', onVisible)
  })

  // Nuovi bambini (creati o accettati via invito) → nuovo canale + primo download.
  let babyKey = ''
  cleanup.push(
    useBabies.subscribe((state) => {
      const key = state.babies.map((b) => b.id).sort().join(',')
      if (key === babyKey) return
      babyKey = key
      if (state.loaded && currentUser) ensureSubscriptions()
    }),
  )

  void resync()
}

export async function stopSync(opts: { clearLocal?: boolean } = {}): Promise<void> {
  const userId = currentUser
  currentUser = null
  cleanup.forEach((fn) => fn())
  cleanup = []
  unsubscribeRealtime()
  resetOutboxRunner()
  pullTimers.forEach(clearTimeout)
  pullTimers.clear()
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  useEvents.getState().reset()
  useOutbox.getState().reset()
  useBabies.getState().reset()
  if (userId && opts.clearLocal) await clearPersisted(userId)
}
