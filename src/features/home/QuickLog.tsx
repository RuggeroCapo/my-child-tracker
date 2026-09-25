import clsx from 'clsx'
import { ArrowRight, Plus } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { EventKind } from '@/domain/types'
import { KIND_META } from '../kinds'

export interface QuickLogProps {
  running: Set<EventKind>
  /** Riga sotto "Allattamento" quando non è in corso (es. "Tocca al destro"). */
  feedHint: string | null
  hints: Record<(typeof MINOR)[number], string>
  onQuick: (kind: EventKind) => void
}

const MINOR = ['diaper', 'bottle', 'pumping'] as const
const SECONDARY: EventKind[] = ['medication', 'measurement', 'vaccination']
const KEY_COLOR: Record<(typeof MINOR)[number], string> = { diaper: 'diaper', bottle: 'bottle', pumping: 'pump' }

/**
 * Sezione "Aggiungi" della home: un'unica console. In alto il tasto rosa
 * dell'allattamento, sotto tre tasti rotondi per le registrazioni frequenti,
 * in fondo le categorie rare come testo. Di giorno è vetro, di notte prugna.
 */
export function QuickLog({ running, feedHint, hints, onQuick }: QuickLogProps) {
  const feeding = KIND_META.breastfeeding
  const FeedIcon = feeding.icon
  const feedingRunning = running.has('breastfeeding')

  return (
    <section className="mt-9">
      <h2 className="font-display-tight text-2xl font-bold">Aggiungi</h2>
      <div className="console mt-3 rounded-[30px] p-2 text-night-ink">
        <button
          type="button"
          onClick={() => onQuick('breastfeeding')}
          className="feed-key flex h-[88px] w-full items-center gap-4 rounded-[22px] pl-4 pr-5 text-left text-night transition-[transform,filter] duration-150 ease-out-quart hover:brightness-[1.03] active:scale-[0.98]"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[oklch(0.98_0.02_30/0.3)] shadow-[inset_0_1px_0_oklch(0.99_0.02_30/0.4)]">
            <FeedIcon className="size-7" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-display-tight text-[26px] font-extrabold leading-none">{feeding.label}</span>
            {feedingRunning ? (
              <span className="mt-1.5 flex items-center gap-1.5 text-sm font-semibold">
                <span className="size-1.5 rounded-full bg-night animate-pulse-dot" aria-hidden />
                in corso
              </span>
            ) : (
              feedHint && <span className="mt-1.5 block text-sm font-medium text-night/75">{feedHint}</span>
            )}
          </span>
          {feedingRunning ? (
            <ArrowRight className="size-7 shrink-0" strokeWidth={2.5} aria-hidden />
          ) : (
            <Plus className="size-7 shrink-0" strokeWidth={2.5} aria-hidden />
          )}
        </button>

        <div className="mt-1 grid grid-cols-3">
          {MINOR.map((kind) => {
            const meta = KIND_META[kind]
            const Icon = meta.icon
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onQuick(kind)}
                style={{ '--k': `var(--color-${KEY_COLOR[kind]})` } as CSSProperties}
                className="group flex flex-col items-center rounded-[22px] pb-3 pt-4 transition-colors duration-150 ease-out-quart active:bg-night-ink/6"
              >
                <span className="console-key relative flex size-16 items-center justify-center rounded-full text-night transition-transform duration-150 ease-out-quart group-active:scale-[0.94]">
                  <Icon className="size-[30px]" aria-hidden />
                  {running.has(kind) && <span className="console-live absolute -right-0.5 -top-0.5 size-3.5 rounded-full animate-pulse-dot" aria-hidden />}
                </span>
                <span className="mt-2.5 text-[15px] font-semibold leading-tight">{meta.label}</span>
                <span className="mt-0.5 text-xs text-night-ink-2 tabular">{running.has(kind) ? 'in corso' : hints[kind]}</span>
              </button>
            )
          })}
        </div>

        <div className="mx-2 grid grid-cols-3 border-t border-night-line">
          {SECONDARY.map((kind) => {
            const meta = KIND_META[kind]
            const Icon = meta.icon
            return (
              <button
                key={kind}
                type="button"
                onClick={() => onQuick(kind)}
                className="flex h-12 items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium text-night-ink-2 transition-colors duration-150 ease-out-quart hover:text-night-ink active:bg-night-ink/6"
              >
                <Icon className={clsx('size-4', meta.text)} aria-hidden />
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
