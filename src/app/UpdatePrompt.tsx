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
    <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
      <div className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-bg shadow-lg">
        <span>Nuova versione disponibile</span>
        <button type="button" className="inline-flex items-center gap-1 font-semibold" onClick={() => void updateServiceWorker(true)}>
          <RefreshCw className="size-4" /> Aggiorna
        </button>
        <button type="button" className="opacity-70" onClick={() => setNeedRefresh(false)}>
          Più tardi
        </button>
      </div>
    </div>
  )
}
