import clsx from 'clsx'
import { ChevronRight, CloudOff } from 'lucide-react'
import type { BabyEvent } from '@/domain/types'
import { describeEvent } from '@/features/kinds'
import { formatTime } from '@/lib/time'
import { CategoryIcon } from './CategoryIcon'

export function EventRow({ event, onClick, showChevron = true }: { event: BabyEvent; onClick?: () => void; showChevron?: boolean }) {
  const { title, subtitle } = describeEvent(event)
  const content = (
    <>
      <span className="w-12 shrink-0 text-sm font-medium text-ink-2 tabular">{formatTime(event.started_at)}</span>
      <CategoryIcon kind={event.kind} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium text-ink">{title}</span>
        <span className="block truncate text-sm text-ink-2">{subtitle}</span>
      </span>
      {event._local && <CloudOff className="size-4 shrink-0 text-ink-3" aria-label="In attesa di sincronizzazione" />}
      {onClick && showChevron && <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />}
    </>
  )
  const cls = 'flex w-full items-center gap-3 px-4 py-3 text-left'
  return onClick ? (
    <button type="button" onClick={onClick} className={clsx(cls, 'transition-colors hover:bg-surface-2 active:bg-surface-2')}>
      {content}
    </button>
  ) : (
    <div className={cls}>{content}</div>
  )
}
