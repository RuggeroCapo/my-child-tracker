import clsx from 'clsx'
import type { EventKind } from '@/domain/types'
import { KIND_META } from '@/features/kinds'

export function CategoryIcon({ kind, size = 'md', className }: { kind: EventKind; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const meta = KIND_META[kind]
  const Icon = meta.icon
  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full',
        meta.soft,
        meta.text,
        size === 'sm' && 'size-8',
        size === 'md' && 'size-10',
        size === 'lg' && 'size-12',
        className,
      )}
    >
      <Icon className={size === 'sm' ? 'size-4' : size === 'md' ? 'size-5' : 'size-6'} />
    </span>
  )
}
