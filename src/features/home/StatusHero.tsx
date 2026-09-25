import type { BabyEvent, BreastSide, EventOf } from '@/domain/types'
import { BREAST_SIDE_LABEL, DIAPER_LABEL } from '@/i18n/it'
import { formatAgo, formatDuration, formatTime } from '@/lib/time'
import { formatNumber } from '@/lib/units'

type Meal = EventOf<'breastfeeding'> | EventOf<'bottle'>

function ago(iso: string, now: number) {
  const s = formatAgo(iso, now)
  return s === 'adesso' ? 'proprio ora' : s
}

function mealDetail(meal: Meal): string {
  if (meal.kind === 'bottle') return `Biberon da ${formatNumber(meal.details.amount, 1)} ${meal.details.unit}`
  const side = `Seno ${BREAST_SIDE_LABEL[meal.details.side].toLowerCase()}`
  return meal.duration_seconds ? `${side}, ${formatDuration(meal.duration_seconds)}` : side
}

/**
 * La risposta alla domanda delle 3 di notte: "quando ha mangiato l'ultima volta?".
 * Scritta come una frase, non come un cruscotto.
 */
export function StatusHero({
  lastMeal,
  lastDiaper,
  suggestedSide,
  now,
}: {
  lastMeal: Meal | undefined
  lastDiaper: EventOf<'diaper'> | undefined
  suggestedSide: BreastSide | null
  now: number
}) {
  return (
    <section aria-label="Situazione" className="night-panel rounded-[28px] px-5 pb-5 pt-6 text-night-ink short:pb-4 short:pt-5">
      {lastMeal ? (
        <>
          <p className="font-display-tight text-[40px] font-bold leading-[1.02] short:text-[34px]">
            Ha mangiato <span className="text-feed-glow">{ago(lastMeal.started_at, now)}</span>
          </p>
          <p className="mt-2 text-[15px] text-night-ink-2">
            {mealDetail(lastMeal)} · alle {formatTime(lastMeal.started_at)}
          </p>
        </>
      ) : (
        <>
          <p className="font-display-tight text-[40px] font-bold leading-[1.02] short:text-[34px]">Nessun pasto, per ora.</p>
          <p className="mt-2 text-[15px] text-night-ink-2">Il primo tocco qui sotto avvia il diario.</p>
        </>
      )}

      {(suggestedSide || lastDiaper) && (
        <dl className="mt-6 grid grid-cols-2 short:mt-4 border-t border-night-line pt-4 text-sm">
          {suggestedSide && (
            <div className="pr-3">
              <dt className="text-night-ink-2">Prossimo lato</dt>
              <dd className="mt-0.5 font-display text-xl font-bold">{BREAST_SIDE_LABEL[suggestedSide]}</dd>
            </div>
          )}
          {lastDiaper && (
            <div className={suggestedSide ? 'border-l border-night-line pl-4' : ''}>
              <dt className="text-night-ink-2">Cambio</dt>
              <dd className="mt-0.5 font-display text-xl font-bold">{ago(lastDiaper.started_at, now)}</dd>
              <dd className="text-xs text-night-ink-2">{DIAPER_LABEL[lastDiaper.details.type]}</dd>
            </div>
          )}
        </dl>
      )}
    </section>
  )
}

export function isMeal(e: BabyEvent): e is Meal {
  return e.kind === 'breastfeeding' || e.kind === 'bottle'
}
