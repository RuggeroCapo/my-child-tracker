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
      <main className="vt-page px-4 pb-28">
        <Outlet />
      </main>
      {/* Snapshot a parte: resta ferma tra le schede, scende/risale entrando in un dettaglio. */}
      <nav
        aria-label="Navigazione principale"
        className="vt-tab-bar fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-safe backdrop-blur"
      >
        <div className="mx-auto flex max-w-lg">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'group flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors duration-150',
                  isActive ? 'font-semibold text-rose-ink' : 'text-ink-3 hover:text-ink-2',
                )
              }
            >
              <Icon
                className="size-6 transition-transform duration-150 ease-out-quart group-active:scale-90"
                aria-hidden
              />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
