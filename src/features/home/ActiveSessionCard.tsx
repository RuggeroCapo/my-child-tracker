import clsx from 'clsx'
import { ArrowLeftRight } from 'lucide-react'
import { useState } from 'react'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import type { EventOf } from '@/domain/types'
import { BREAST_SIDE_LABEL, PUMP_SIDE_LABEL } from '@/i18n/it'
import { useNow } from '@/lib/clock'
import { formatClock, formatTime } from '@/lib/time'
import { parseDecimal } from '@/lib/units'
import { useMemberName } from '@/stores/selectors'
import { endSession, switchBreastSide } from '@/sync/actions'

type Session = EventOf<'breastfeeding'> | EventOf<'pumping'>

/** Sessione in corso, identica su tutti i dispositivi: il timer deriva da started_at sul server. */
export function ActiveSessionCard({ event, compact }: { event: Session; compact?: boolean }) {
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
    <Card
      className={clsx(
        'relative overflow-hidden p-4 ring-1',
        isFeeding ? 'bg-feed/8 ring-feed/20' : 'bg-pump/8 ring-pump/20',
      )}
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <CategoryIcon kind={event.kind} />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-semibold">
            <span className={clsx('size-2 rounded-full animate-pulse-dot', isFeeding ? 'bg-feed' : 'bg-pump')} aria-hidden />
            {isFeeding ? 'Allattamento in corso' : 'Tiralatte in corso'}
          </p>
          <p className="text-sm text-ink-2">
            {side} · {formatTime(event.started_at)} → {formatTime(new Date(now))}
          </p>
        </div>
      </div>
      <div className={clsx('flex items-end justify-between gap-3', compact ? 'mt-2' : 'mt-3')}>
        <div>
          <p className={clsx('font-semibold tracking-tight tabular', compact ? 'text-4xl' : 'text-5xl')} role="timer" aria-label="Durata">
            {formatClock(elapsed)}
          </p>
          {startedBy && <p className="mt-1 text-xs text-ink-3">Avviato da {startedBy}</p>}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-[auto_1fr] gap-2">
        {isFeeding ? (
          <Button
            variant="outline"
            size="lg"
            icon={<ArrowLeftRight className="size-5" />}
            onClick={() => switchBreastSide(event)}
            aria-label={`Passa al seno ${event.details.side === 'left' ? 'destro' : 'sinistro'}`}
          >
            {event.details.side === 'left' ? 'Destro' : 'Sinistro'}
          </Button>
        ) : (
          <span />
        )}
        <Button
          size="lg"
          variant={isFeeding ? 'primary' : 'violet'}
          className={clsx(!isFeeding && 'col-span-2')}
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
          <Button block size="lg" variant="violet" onClick={finishPumping}>
            Termina e salva
          </Button>
        </div>
      </Sheet>
    </Card>
  )
}
