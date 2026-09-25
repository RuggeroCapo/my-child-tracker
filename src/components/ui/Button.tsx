import clsx from 'clsx'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'night'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  /** L'unica azione piena in rosa: testo scuro, il bianco sul rosa non regge il contrasto. */
  primary: 'bg-rose text-night hover:bg-rose/90',
  secondary: 'bg-surface-2 text-ink hover:bg-line/70',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
  /** Per i pulsanti secondari sopra il pannello bg-night. */
  night: 'border border-night-line text-night-ink hover:bg-night-line/60',
}

const sizes: Record<Size, string> = {
  sm: 'h-11 px-3 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-4 text-[15px] rounded-2xl gap-2',
  lg: 'h-14 px-5 text-base rounded-2xl gap-2',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  block?: boolean
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  block,
  loading,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex select-none items-center justify-center font-semibold transition-[color,background-color,transform] duration-150 ease-out-quart active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  )
}

export function IconButton({
  label,
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={clsx(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-[color,background-color,transform] duration-150 ease-out-quart hover:bg-surface-2 hover:text-ink active:scale-95 active:bg-surface-2',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
