import type { Baby } from '@/domain/types'
import { formatAge } from '@/lib/time'
import { formatNumber } from '@/lib/units'
import { useLatestMeasurements } from '@/stores/selectors'
import { SyncBadge } from '@/app/SyncBadge'
import { BabyAvatar } from '../babies/BabyAvatar'

type Props = {
  baby: Baby
  canSwitch: boolean
  onPress: () => void
}

export function HomeHeader({ baby, canSwitch, onPress }: Props) {
  const age = formatAge(baby.birth_date)
  const latest = useLatestMeasurements(baby.id)
  const details = [
    age,
    latest.weight && `${formatNumber(latest.weight.value)} kg`,
    latest.length && `${formatNumber(latest.length.value, 1)} cm`,
  ].filter(Boolean)
  const actionLabel = canSwitch ? 'Cambia bambino' : 'Profilo bambino'

  return (
    <header className="pt-safe">
      <div
        role="button"
        tabIndex={0}
        onClick={onPress}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onPress()
          }
        }}
        aria-label={actionLabel}
        className="frost group relative flex min-h-20 w-full short:min-h-16 short:py-2.5 cursor-pointer items-center justify-between gap-4 rounded-[28px] p-3.5 pl-4 pr-4 text-left transition-all duration-150 ease-out-quart active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <div className="shrink-0 transition-transform duration-150 group-hover:scale-105">
          <BabyAvatar baby={baby} size="lg" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display-tight text-[30px] font-extrabold leading-tight tracking-tight text-ink sm:text-[34px]">
            {baby.name}
          </h1>
          <p className="mt-0.5 truncate text-sm font-medium text-ink-2 tabular">
            {details.join(' · ')}
          </p>
        </div>

        <div onClick={(e) => e.stopPropagation()} className="shrink-0 empty:hidden">
          <SyncBadge />
        </div>
      </div>
    </header>
  )
}
