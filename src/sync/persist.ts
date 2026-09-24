import { createStore, delMany, getMany, setMany } from 'idb-keyval'
import { useBabies } from '@/stores/babies'
import { useEvents } from '@/stores/events'
import { useOutbox } from '@/stores/outbox'

/**
 * Persistenza locale in IndexedDB (per utente): permette di aprire l'app e
 * registrare eventi senza rete. I dati restano comunque autorevoli su Supabase.
 */
const store = typeof indexedDB !== 'undefined' ? createStore('bebe', 'kv') : undefined

const keys = (userId: string) => ({
  events: `${userId}:events`,
  outbox: `${userId}:outbox`,
  babies: `${userId}:babies`,
})

export async function hydrate(userId: string): Promise<void> {
  if (!store) return
  const k = keys(userId)
  try {
    const [events, outbox, babies] = await getMany([k.events, k.outbox, k.babies], store)
    if (events) useEvents.getState().reset(events)
    if (outbox) useOutbox.getState().reset(outbox)
    if (babies) useBabies.getState().reset({ ...babies, loaded: babies.babies?.length > 0 })
  } catch (e) {
    console.warn('hydrate failed', e)
  }
}

function debounce(fn: () => void, ms: number) {
  let t: ReturnType<typeof setTimeout> | null = null
  const run = () => {
    t = null
    fn()
  }
  const debounced = () => {
    if (t) clearTimeout(t)
    t = setTimeout(run, ms)
  }
  debounced.flush = () => {
    if (t) {
      clearTimeout(t)
      run()
    }
  }
  return debounced
}

export function startPersisting(userId: string): () => void {
  if (!store) return () => {}
  const k = keys(userId)
  const saveEvents = debounce(() => {
    const { byId, cursors } = useEvents.getState()
    void setMany([[k.events, { byId, cursors }]], store).catch(() => {})
  }, 400)
  // La coda va salvata subito: l'app può essere chiusa appena dopo un tap.
  const saveOutbox = debounce(() => {
    void setMany([[k.outbox, useOutbox.getState().ops]], store).catch(() => {})
  }, 20)
  const saveBabies = debounce(() => {
    const { babies, members, medications } = useBabies.getState()
    void setMany([[k.babies, { babies, members, medications }]], store).catch(() => {})
  }, 400)

  const unsubs = [
    useEvents.subscribe(saveEvents),
    useOutbox.subscribe(saveOutbox),
    useBabies.subscribe(saveBabies),
  ]
  const flushAll = () => {
    saveOutbox.flush()
    saveEvents.flush()
    saveBabies.flush()
  }
  const onHide = () => document.visibilityState === 'hidden' && flushAll()
  document.addEventListener('visibilitychange', onHide)
  window.addEventListener('pagehide', flushAll)
  return () => {
    flushAll()
    unsubs.forEach((u) => u())
    document.removeEventListener('visibilitychange', onHide)
    window.removeEventListener('pagehide', flushAll)
  }
}

export async function clearPersisted(userId: string): Promise<void> {
  if (!store) return
  const k = keys(userId)
  await delMany([k.events, k.outbox, k.babies], store).catch(() => {})
}
