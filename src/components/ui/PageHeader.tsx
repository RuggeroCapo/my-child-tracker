import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { IconButton } from './Button'

export function PageHeader({ title, back = true, action }: { title: string; back?: boolean; action?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-2 flex items-center gap-1 bg-bg/90 px-2 pb-2 pt-safe backdrop-blur">
      {back ? (
        <IconButton label="Indietro" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}>
          <ArrowLeft className="size-6" />
        </IconButton>
      ) : (
        <span className="w-2" />
      )}
      <h1 className="min-w-0 flex-1 truncate text-center text-lg font-semibold">{title}</h1>
      <div className="flex min-w-11 justify-end">{action}</div>
    </header>
  )
}
