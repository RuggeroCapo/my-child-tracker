import clsx from 'clsx'
import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'violet' | 'amber'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-rose text-white hover:bg-rose-strong shadow-sm shadow-rose/25',
  secondary: 'bg-sky/12 text-sky hover:bg-sky/20 dark:text-sky-300',
  outline: 'border border-line bg-surface text-ink hover:bg-surface-2',
  ghost: 'text-ink-2 hover:bg-surface-2',
  danger: 'bg-danger text-white hover:bg-danger/90',
  success: 'bg-med text-white hover:bg-med/90',
  violet: 'bg-violet text-white hover:bg-violet/90 shadow-sm shadow-violet/25',
  amber: 'bg-bottle text-white hover:bg-bottle/90 shadow-sm shadow-bottle/25',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm rounded-xl gap-1.5',
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
        'inline-flex select-none items-center justify-center font-semibold transition-colors active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
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
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-surface-2 active:scale-95',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
