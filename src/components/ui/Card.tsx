import clsx from 'clsx'
import type { HTMLAttributes } from 'react'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('frost rounded-[var(--radius-card)]', className)}
      {...rest}
    />
  )
}

/** `flush` dentro una Card: allinea il titolo al contenuto invece che al margine della pagina. */
export function SectionTitle({ className, flush, ...rest }: HTMLAttributes<HTMLHeadingElement> & { flush?: boolean }) {
  return <h2 className={clsx(!flush && 'px-1', 'font-display-snug text-lg font-bold text-ink', className)} {...rest} />
}
