import clsx from 'clsx'
import type { HTMLAttributes } from 'react'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx('rounded-[var(--radius-card)] bg-surface shadow-[var(--shadow-card)] dark:shadow-none', className)}
      {...rest}
    />
  )
}

export function SectionTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={clsx('px-1 text-[15px] font-semibold text-ink', className)} {...rest} />
}
