import clsx from 'clsx'
import { ArrowLeftRight, Maximize2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import type { BabyEvent, EventOf } from '@/domain/types'
import { BREAST_SIDE_LABEL, PUMP_SIDE_LABEL } from '@/i18n/it'
import { useNow } from '@/lib/clock'
import { formatClock, formatTime } from '@/lib/time'
import { parseDecimal } from '@/lib/units'
import { useMemberName } from '@/stores/selectors'
import { endSession, switchBreastSide } from '@/sync/actions'

type Session = EventOf<'breastfeeding'> | EventOf<'pumping'>

/** Sessione in corso, identica su tutti i dispositivi: il timer deriva da started_at sul server. */
export function ActiveSessionCard({
  event,
  compact,
  detailLink = true,
  onSwitched,
}: {
  event: Session
  compact?: boolean
  /** Icona in alto a destra che apre la pagina di dettaglio (solo allattamento). */
  detailLink?: boolean
  onSwitched?: (next: BabyEvent) => void
}) {
  const now = useNow()
  const elapsed = (now - Date.parse(event.started_at)) / 1000
  const startedBy = useMemberName(event.created_by)
  const [askAmount, setAskAmount] = useState(false)
  const [amount, setAmount] = useState('')
  const isFeeding = event.kind === 'breastfeeding'
  const side = isFeeding ? BREAST_SIDE_LABEL[event.details.side] : PUMP_SIDE_LABEL[event.details.side]

  function finishPumping() {
    const v = parseDecimal(amount)
    endSession(event, v !== null && v >= 0 ? { amount: v, unit: 'ml' } : undefined)
    setAskAmount(false)
    setAmount('')
  }

  return (
    <section
      className="night-panel relative overflow-hidden rounded-[28px] p-5 text-night-ink"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5">
        <span className={clsx('size-2.5 rounded-full animate-pulse-dot', isFeeding ? 'bg-feed' : 'bg-pump')} aria-hidden />
        <p className="font-semibold">{isFeeding ? 'Allattamento in corso' : 'Tiralatte in corso'}</p>
        {isFeeding && detailLink && (
          <Link
            to={`/breastfeeding/${event.id}`}
            aria-label="Dettagli allattamento"
            className="-mr-2 -mt-2 ml-auto flex size-11 items-center justify-center rounded-xl text-night-ink-2 transition-colors hover:bg-night-line hover:text-night-ink"
          >
            <Maximize2 className="size-5" />
          </Link>
        )}
      </div>
      <p className="mt-0.5 pl-5 text-sm text-night-ink-2 tabular">
        {side} · {formatTime(event.started_at)} → {formatTime(new Date(now))}
      </p>
      <p
        className={clsx(
          'font-display-tight font-extrabold leading-[0.9] tabular',
          compact ? 'mt-3 text-6xl' : 'mt-5 text-[88px]',
          isFeeding ? 'text-feed-glow' : 'text-night-ink',
        )}
        role="timer"
        aria-label="Durata"
      >
        {formatClock(elapsed)}
      </p>
      {startedBy && <p className="mt-2 text-xs text-night-ink-2">Avviato da {startedBy}</p>}
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-2">
        {isFeeding ? (
          <Button
            variant="night"
            size="lg"
            icon={<ArrowLeftRight className="size-5" />}
            onClick={() => {
              const next = switchBreastSide(event)
              if (next) onSwitched?.(next)
            }}
            aria-label={`Passa al seno ${event.details.side === 'left' ? 'destro' : 'sinistro'}`}
          >
            {event.details.side === 'left' ? 'Destro' : 'Sinistro'}
          </Button>
        ) : (
          <span />
        )}
        <Button
          size="lg"
          className={clsx('shadow-none', !isFeeding && 'col-span-2')}
          onClick={() => (isFeeding ? endSession(event) : setAskAmount(true))}
        >
          Termina
        </Button>
      </div>

      <Sheet open={askAmount} onClose={() => setAskAmount(false)} title="Termina tiralatte">
        <div className="space-y-4 pb-2">
          <p className="text-ink-2">
            Durata <strong className="tabular text-ink">{formatClock(elapsed)}</strong>
          </p>
          <Input label="Quantità estratta" optional big inputMode="decimal" suffix="ml" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          <Button block size="lg" onClick={finishPumping}>
            Termina e salva
          </Button>
        </div>
      </Sheet>
    </section>
  )
}
