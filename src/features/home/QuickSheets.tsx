import clsx from 'clsx'
import { CircleCheck } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Sheet } from '@/components/ui/Sheet'
import type { BreastSide, DiaperType, EventOf, MilkType, PumpSide, StoolAmount, StoolColor } from '@/domain/types'
import { DIAPER_LABEL, MILK_LABEL, PUMP_SIDE_LABEL } from '@/i18n/it'
import { haptic } from '@/lib/haptics'
import { parseDecimal } from '@/lib/units'
import { toast } from '@/stores/ui'
import { deleteEvent, quickAdd, saveEvent, startSession } from '@/sync/actions'
import { BOTTLE_PRESETS } from '../bottle/BottleForm'
import { DiaperTypeIcon, StoolPicker } from '../diaper/DiaperDetails'
import { primeLockScreenAudio } from '../breastfeeding/lockScreen'
import { NotesInput } from '../events/formParts'

const bigChoice =
  'press flex h-24 flex-col items-center justify-center gap-1 rounded-3xl border text-base font-semibold [--press:0.96]'

/** Allattamento: un tap sul lato e il timer parte. */
export function FeedingQuickSheet({
  open,
  onClose,
  babyId,
  suggested,
}: {
  open: boolean
  onClose: () => void
  babyId: string
  suggested: BreastSide | null
}) {
  function start(side: BreastSide) {
    primeLockScreenAudio()
    startSession(babyId, 'breastfeeding', { side })
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Avvia allattamento">
      <div className="grid grid-cols-2 gap-3">
        {(['left', 'right'] as const).map((side) => (
          <button
            key={side}
            type="button"
            onClick={() => start(side)}
            className={clsx(bigChoice, suggested === side ? 'border-feed bg-feed/12 text-ink' : 'border-line bg-surface text-ink-2')}
          >
            <span>{side === 'left' ? 'Sinistro' : 'Destro'}</span>
            {suggested === side && <span className="text-xs font-semibold text-rose-ink">Suggerito</span>}
          </button>
        ))}
      </div>
      <Link to="/breastfeeding?manual=1" onClick={onClose} className="mt-3 flex h-11 items-center justify-center text-center text-sm font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline">
        Inserisci un allattamento passato
      </Link>
    </Sheet>
  )
}

/** Pannolino: un tap registra; per lo sporco si aprono i dettagli facoltativi. */
export function DiaperQuickSheet({ open, onClose, babyId }: { open: boolean; onClose: () => void; babyId: string }) {
  const [saved, setSaved] = useState<EventOf<'diaper'> | null>(null)
  const [amount, setAmount] = useState<StoolAmount | null>(null)
  const [color, setColor] = useState<StoolColor | null>(null)
  const [notes, setNotes] = useState('')

  function close() {
    setSaved(null)
    setAmount(null)
    setColor(null)
    setNotes('')
    onClose()
  }

  function record(type: DiaperType) {
    const event = quickAdd(babyId, 'diaper', { type, stool_amount: null, stool_color: null }) as EventOf<'diaper'>
    if (type === 'wet') {
      toast({
        tone: 'success',
        title: 'Pannolino registrato',
        description: DIAPER_LABEL[type],
        action: { label: 'Annulla', onClick: () => deleteEvent(event, { undo: false }) },
      })
      close()
    } else {
      setSaved(event)
    }
  }

  function saveDetails() {
    if (saved && (amount || color || notes.trim())) {
      saveEvent({
        id: saved.id,
        baby_id: saved.baby_id,
        kind: 'diaper',
        started_at: saved.started_at,
        ended_at: null,
        notes: notes.trim() || null,
        details: { type: saved.details.type, stool_amount: amount, stool_color: color },
      }, { silent: true })
    }
    toast({ tone: 'success', title: 'Pannolino registrato', description: saved ? DIAPER_LABEL[saved.details.type] : undefined })
    close()
  }

  return (
    <Sheet open={open} onClose={saved ? saveDetails : close} title={saved ? 'Dettagli (facoltativi)' : 'Pannolino'}>
      {!saved ? (
        <>
          <div className="grid grid-cols-3 gap-3">
            {(['wet', 'dirty', 'mixed'] as const).map((t) => (
              <button key={t} type="button" onClick={() => record(t)} className={clsx(bigChoice, 'border-line bg-diaper/8 text-ink')}>
                <DiaperTypeIcon type={t} />
                <span className="text-sm">{DIAPER_LABEL[t]}</span>
              </button>
            ))}
          </div>
          <Link to="/diaper" onClick={close} className="mt-3 flex h-11 items-center justify-center text-center text-sm font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline">
            Storico pannolini
          </Link>
        </>
      ) : (
        <div className="space-y-4 pb-2">
          <p className="flex items-start gap-2.5 rounded-2xl bg-success/10 px-4 py-3 text-sm text-ink">
            <CircleCheck className="mt-px size-[18px] shrink-0 text-success" aria-hidden />
            <span>{DIAPER_LABEL[saved.details.type]} registrato. Puoi aggiungere qualche dettaglio.</span>
          </p>
          <StoolPicker amount={amount} color={color} onAmount={setAmount} onColor={setColor} />
          <NotesInput value={notes} onChange={setNotes} />
          <Button block size="lg" onClick={saveDetails}>
            Fatto
          </Button>
        </div>
      )}
    </Sheet>
  )
}

export function BottleQuickSheet({
  open,
  onClose,
  babyId,
  last,
}: {
  open: boolean
  onClose: () => void
  babyId: string
  last: EventOf<'bottle'> | null
}) {
  const [amount, setAmount] = useState(String(last?.details.amount ?? 90))
  const [milk, setMilk] = useState<MilkType>(last?.details.milk_type ?? 'breast_milk')
  const value = parseDecimal(amount)

  function save() {
    if (!value || value <= 0) return
    quickAdd(babyId, 'bottle', { amount: value, unit: 'ml', milk_type: milk })
    toast({ tone: 'success', title: 'Biberon registrato', description: `${value} ml · ${MILK_LABEL[milk].toLowerCase()}` })
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Biberon">
      <div className="space-y-4 pb-2">
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            aria-label="Diminuisci di 10 ml"
            onClick={() => setAmount(String(Math.max(10, (value ?? 0) - 10)))}
            className="size-14 rounded-full bg-surface-2 text-2xl font-semibold text-ink-2 transition-[background-color,transform] duration-150 hover:bg-line/70 active:scale-95"
          >
            −
          </button>
          <label className="flex items-baseline gap-1">
            <input
              aria-label="Quantità in ml"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28 bg-transparent text-center text-5xl font-semibold tabular outline-none"
            />
            <span className="text-lg text-ink-3">ml</span>
          </label>
          <button
            type="button"
            aria-label="Aumenta di 10 ml"
            onClick={() => setAmount(String((value ?? 0) + 10))}
            className="size-14 rounded-full bg-surface-2 text-2xl font-semibold text-ink-2 transition-[background-color,transform] duration-150 hover:bg-line/70 active:scale-95"
          >
            +
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {BOTTLE_PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                haptic('tick')
                setAmount(String(p))
              }}
              className={clsx('press h-11 rounded-full border border-line px-4 text-sm font-medium tabular [--press:0.95]', value === p ? 'bg-bottle/15 text-ink ring-2 ring-bottle' : 'text-ink-2 hover:bg-surface-2 active:bg-surface-2')}
            >
              {p} ml
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(['breast_milk', 'formula'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                if (milk !== m) haptic('tick')
                setMilk(m)
              }}
              className={clsx('press h-12 rounded-2xl border border-line text-sm font-medium [--press:0.96]', milk === m ? 'bg-bottle/15 text-ink ring-2 ring-bottle' : 'text-ink-2 hover:bg-surface-2 active:bg-surface-2')}
            >
              {MILK_LABEL[m]}
            </button>
          ))}
        </div>
        <Button block size="lg" onClick={save} disabled={!value || value <= 0}>
          Salva
        </Button>
        <Link to="/bottle" onClick={onClose} className="flex h-11 items-center justify-center text-center text-sm font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline">
          Altre opzioni e storico
        </Link>
      </div>
    </Sheet>
  )
}

export function PumpingQuickSheet({ open, onClose, babyId }: { open: boolean; onClose: () => void; babyId: string }) {
  function start(side: PumpSide) {
    startSession(babyId, 'pumping', { side, amount: null, unit: 'ml' })
    onClose()
  }
  return (
    <Sheet open={open} onClose={onClose} title="Avvia tiralatte">
      <div className="grid grid-cols-3 gap-3">
        {(['left', 'right', 'both'] as const).map((s) => (
          <button key={s} type="button" onClick={() => start(s)} className={clsx(bigChoice, 'border-line bg-pump/8 text-ink')}>
            {PUMP_SIDE_LABEL[s]}
          </button>
        ))}
      </div>
      <Link to="/pumping?manual=1" onClick={onClose} className="mt-3 flex h-11 items-center justify-center text-center text-sm font-medium text-ink-2 underline-offset-2 hover:text-ink hover:underline">
        Registra senza timer
      </Link>
    </Sheet>
  )
}
