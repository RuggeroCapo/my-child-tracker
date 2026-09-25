import clsx from 'clsx'
import { BookOpen, ChartColumn, House, Menu } from 'lucide-react'
import { NavLink, Outlet } from 'react-router'

const tabs = [
  { to: '/', label: 'Home', icon: House, end: true },
  { to: '/diary', label: 'Diario', icon: BookOpen },
  { to: '/stats', label: 'Statistiche', icon: ChartColumn },
  { to: '/more', label: 'Altro', icon: Menu },
]

export function AppLayout() {
  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg">
      <main className="vt-page px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      {/* Bottoni flottanti in vetro: la scheda attiva si allarga in una pillola con l'etichetta.
          Ogni bottone ha il proprio nome di transizione: un nome sul contenitore farebbe da
          "backdrop root" e il vetro non sfocherebbe più la pagina sotto. */}
      <nav
        aria-label="Navigazione principale"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      >
        <div className="flex items-center gap-2">
          {tabs.map(({ to, label, icon: Icon, end }, i) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              style={{ viewTransitionName: `tab-${i}` }}
              className={({ isActive }) =>
                clsx(
                  'vt-tab press pointer-events-auto flex h-14 items-center justify-center rounded-full [--press:0.92]',
                  isActive ? 'tab-active gap-2 pl-4 pr-5 font-semibold text-night' : 'glass w-14 text-ink-2 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="size-6 shrink-0" aria-hidden />
                  {isActive && <span className="text-[15px]">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
