import clsx from 'clsx'
import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { SyncBadge } from '@/app/SyncBadge'
import { CategoryIcon } from '@/components/CategoryIcon'
import { IconButton } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { Sheet } from '@/components/ui/Sheet'
import type { EventKind } from '@/domain/types'
import { KIND_LABEL } from '@/i18n/it'
import { useActiveBaby } from '@/stores/babies'
import { useBabyEvents } from '@/stores/selectors'
import { EventForm } from '../events/EventForm'
import { EventList } from '../events/EventList'

const FILTERS: { id: string; label: string; kinds: EventKind[] | null }[] = [
  { id: 'all', label: 'Tutti', kinds: null },
  { id: 'food', label: 'Alimentazione', kinds: ['breastfeeding', 'bottle', 'pumping'] },
  { id: 'diaper', label: 'Pannolini', kinds: ['diaper'] },
  { id: 'med', label: 'Medicine', kinds: ['medication'] },
  { id: 'vax', label: 'Vaccinazioni', kinds: ['vaccination'] },
  { id: 'growth', label: 'Crescita', kinds: ['measurement'] },
  { id: 'bath', label: 'Bagnetto', kinds: ['bath'] },
  { id: 'visit', label: 'Visite mediche', kinds: ['doctor_visit'] },
]

const ADDABLE: EventKind[] = ['breastfeeding', 'diaper', 'bottle', 'pumping', 'medication', 'vaccination', 'measurement']

export default function DiaryPage() {
  const baby = useActiveBaby()!
  const events = useBabyEvents(baby.id)
  const [filter, setFilter] = useState('all')
  const [adding, setAdding] = useState<EventKind | 'pick' | null>(null)
  const kinds = FILTERS.find((f) => f.id === filter)?.kinds
  const filtered = useMemo(() => (kinds ? events.filter((e) => kinds.includes(e.kind)) : events), [events, kinds])

  return (
    <div className="space-y-4">
      <header className="sticky top-0 z-20 -mx-4 space-y-3 glass-header px-4 pb-3 pt-safe">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-display-tight text-[34px] font-extrabold leading-none">Diario</h1>
          <div className="flex items-center gap-1">
            <SyncBadge />
            <IconButton label="Aggiungi evento" onClick={() => setAdding('pick')}>
              <Plus className="size-6" />
            </IconButton>
          </div>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]" role="tablist" aria-label="Filtri">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'h-11 shrink-0 rounded-full px-4 text-sm font-medium transition-colors duration-150',
                filter === f.id ? 'rose-lit font-semibold text-night' : 'frost text-ink-2 hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <EmptyState title={kinds ? 'Nessun evento in questa categoria' : 'Il diario è ancora vuoto'}>
          {kinds ? 'Scegli "Tutti" per vedere l\'intero diario.' : 'Registra dalla home o con il + qui sopra.'}
        </EmptyState>
      ) : (
        <EventList events={filtered} />
      )}

      <Sheet
        open={adding !== null}
        onClose={() => setAdding(null)}
        title={adding && adding !== 'pick' ? KIND_LABEL[adding] : 'Aggiungi evento'}
      >
        {adding === 'pick' ? (
          <div className="grid grid-cols-3 gap-2 pb-2">
            {ADDABLE.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setAdding(k)}
                className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-surface-2 text-sm font-medium transition-[background-color,transform] duration-150 hover:bg-line/60 active:scale-[0.97]"
              >
                <CategoryIcon kind={k} />
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
        ) : adding ? (
          <EventForm babyId={baby.id} kind={adding} onSaved={() => setAdding(null)} />
        ) : null}
      </Sheet>
    </div>
  )
}
