import type { ReactNode } from 'react'

/**
 * Contenitore dell'azione principale di un form (Salva). Resta attaccato al fondo
 * dello schermo finché il form è visibile, così si raggiunge col pollice anche
 * quando i campi non entrano tutti nello schermo.
 */
export function FormDock({ children }: { children: ReactNode }) {
  return <div className="form-dock">{children}</div>
}
