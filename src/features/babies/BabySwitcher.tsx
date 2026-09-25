import clsx from 'clsx'
import { Check, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Sheet } from '@/components/ui/Sheet'
import { haptic } from '@/lib/haptics'
import { formatAge } from '@/lib/time'
import { useBabies } from '@/stores/babies'
import { BabyAvatar } from './BabyAvatar'

export function BabySwitcher({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { babies, activeBabyId, setActive } = useBabies()
  const navigate = useNavigate()
  return (
    <Sheet open={open} onClose={onClose} title="I miei bambini">
      <ul className="space-y-2">
        {babies.map((b) => (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => {
                if (b.id !== activeBabyId) haptic('tap')
                setActive(b.id)
                onClose()
              }}
              className={clsx(
                'press flex w-full items-center gap-3 rounded-2xl p-3 text-left [--press:0.98]',
                b.id === activeBabyId ? 'bg-rose/10' : 'hover:bg-surface-2 active:bg-surface-2',
              )}
            >
              <BabyAvatar baby={b} />
              <span className="flex-1">
                <span className="block font-semibold">{b.name}</span>
                <span className="block text-sm text-ink-2">{formatAge(b.birth_date)}</span>
              </span>
              {b.id === activeBabyId && <Check className="size-5 text-rose-ink" aria-label="Selezionato" />}
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => {
          onClose()
          navigate('/babies/new')
        }}
        className="press mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-line text-sm font-medium text-ink-2 [--press:0.98] hover:bg-surface-2 active:bg-surface-2"
      >
        <Plus className="size-4" /> Aggiungi bambino
      </button>
    </Sheet>
  )
}
