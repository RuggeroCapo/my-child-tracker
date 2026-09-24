import clsx from 'clsx'
import { Droplet } from 'lucide-react'
import { StoolIcon } from '@/components/icons'
import type { DiaperType, StoolAmount, StoolColor } from '@/domain/types'
import { STOOL_AMOUNT_LABEL, STOOL_COLOR_HEX, STOOL_COLOR_LABEL } from '@/i18n/it'

const AMOUNT_DOT: Record<StoolAmount, string> = { small: 'size-2.5', medium: 'size-4', large: 'size-6' }

/** Quantità (icone) e colore (palette) delle feci: dettagli facoltativi. */
export function StoolPicker({
  amount,
  color,
  onAmount,
  onColor,
}: {
  amount: StoolAmount | null
  color: StoolColor | null
  onAmount: (a: StoolAmount | null) => void
  onColor: (c: StoolColor | null) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="px-1 text-sm font-medium text-ink-2">Quantità</p>
        <div role="radiogroup" aria-label="Quantità" className="grid grid-cols-3 gap-2">
          {(Object.keys(AMOUNT_DOT) as StoolAmount[]).map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={amount === a}
              onClick={() => onAmount(amount === a ? null : a)}
              className={clsx(
                'flex h-16 flex-col items-center justify-center gap-1.5 rounded-2xl border border-line text-sm font-medium',
                amount === a ? 'bg-bottle/15 text-ink ring-2 ring-bottle' : 'text-ink-2 hover:bg-surface-2',
              )}
            >
              <span className={clsx('rounded-full bg-[#9a6a3a]', AMOUNT_DOT[a])} aria-hidden />
              {STOOL_AMOUNT_LABEL[a]}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="px-1 text-sm font-medium text-ink-2">
          Colore{color && <span className="font-normal text-ink-3"> · {STOOL_COLOR_LABEL[color]}</span>}
        </p>
        <div role="radiogroup" aria-label="Colore" className="flex flex-wrap gap-3 px-1">
          {(Object.keys(STOOL_COLOR_HEX) as StoolColor[]).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={color === c}
              aria-label={STOOL_COLOR_LABEL[c]}
              title={STOOL_COLOR_LABEL[c]}
              onClick={() => onColor(color === c ? null : c)}
              className={clsx(
                'size-11 rounded-full border border-black/10 transition-transform',
                color === c ? 'scale-110 ring-2 ring-sky ring-offset-2 ring-offset-surface' : 'hover:scale-105',
              )}
              style={{ backgroundColor: STOOL_COLOR_HEX[c] }}
            />
          ))}
        </div>
        {(color === 'red' || color === 'white' || color === 'black') && (
          <p className="px-1 text-xs text-ink-3">Se noti colori insoliti, confrontati con il pediatra.</p>
        )}
      </div>
    </div>
  )
}

export function DiaperTypeIcon({ type }: { type: DiaperType }) {
  if (type === 'wet') return <Droplet className="size-7 text-diaper" aria-hidden />
  if (type === 'dirty') return <StoolIcon className="size-7 text-[#a0692f]" />
  return (
    <span className="flex" aria-hidden>
      <Droplet className="size-6 text-diaper" />
      <StoolIcon className="size-6 text-[#a0692f]" />
    </span>
  )
}
