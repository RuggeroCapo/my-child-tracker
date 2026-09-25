import clsx from 'clsx'
import type { CSSProperties } from 'react'
import type { Baby } from '@/domain/types'

/** Tonalità OKLCH del monogramma: una per bambino, così fratelli e gemelli si distinguono. */
const HUES = [10, 250, 300, 60, 180]

export function babyHue(id: string) {
  const hash = [...id].reduce((a, c) => a + c.charCodeAt(0), 0)
  return HUES[hash % HUES.length]
}

/** Monogramma con iniziale (le foto sono fuori dall'MVP), negli stessi toni del velo. */
export function BabyAvatar({ baby, size = 'md' }: { baby: Pick<Baby, 'id' | 'name'>; size?: 'md' | 'lg' }) {
  return (
    <span
      aria-hidden
      style={{ '--h': babyHue(baby.id) } as CSSProperties}
      className={clsx(
        'monogram inline-flex shrink-0 items-center justify-center rounded-full font-display-tight font-extrabold text-night',
        size === 'md' ? 'size-11 text-lg' : 'size-14 text-2xl',
      )}
    >
      {baby.name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
