import clsx from 'clsx'
import type { Baby } from '@/domain/types'

const palettes = ['bg-rose/15 text-rose-ink', 'bg-sky/15 text-sky', 'bg-violet/15 text-violet', 'bg-bottle/20 text-bottle', 'bg-growth/15 text-growth']

/** Avatar con iniziale (le foto sono fuori dall'MVP). */
export function BabyAvatar({ baby, size = 'md' }: { baby: Pick<Baby, 'id' | 'name'>; size?: 'md' | 'lg' }) {
  const hash = [...baby.id].reduce((a, c) => a + c.charCodeAt(0), 0)
  return (
    <span
      aria-hidden
      className={clsx(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        palettes[hash % palettes.length],
        size === 'md' ? 'size-11 text-lg' : 'size-14 text-2xl',
      )}
    >
      {baby.name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
