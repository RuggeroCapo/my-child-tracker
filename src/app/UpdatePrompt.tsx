import { RefreshCw } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

/** Avviso discreto quando è disponibile una nuova versione dell'app. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      // Controlla aggiornamenti ogni ora quando l'app resta aperta a lungo.
      if (registration) setInterval(() => void registration.update(), 60 * 60 * 1000)
    },
  })

  if (!needRefresh) return null
  return (
    <div className="fixed inset-x-0 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4">
      <div className="flex items-center gap-1 rounded-2xl bg-night py-1 pl-4 pr-1 text-sm text-night-ink shadow-[0_8px_24px_oklch(0.3_0.05_350/0.2)]" role="status">
        <span className="mr-2">Nuova versione disponibile</span>
        <button type="button" className="inline-flex h-11 items-center gap-1.5 rounded-xl px-3 font-semibold hover:bg-night-line/60" onClick={() => void updateServiceWorker(true)}>
          <RefreshCw className="size-4" aria-hidden /> Aggiorna
        </button>
        <button type="button" className="h-11 rounded-xl px-3 text-night-ink-2 hover:bg-night-line/60" onClick={() => setNeedRefresh(false)}>
          Più tardi
        </button>
      </div>
    </div>
  )
}
