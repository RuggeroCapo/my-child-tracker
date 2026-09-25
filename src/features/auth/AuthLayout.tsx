import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'

export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="vt-page mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10 pt-safe">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo size={72} />
        <h1 className="mt-5 font-display-tight text-[34px] font-extrabold leading-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-pretty text-ink-2">{subtitle}</p>}
      </div>
      {children}
      {footer && <div className="mt-8 text-center text-sm text-ink-2">{footer}</div>}
    </div>
  )
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6a5.1 5.1 0 0 1-2.2 3.3v2.8h3.6c2-1.9 3.2-4.7 3.2-8.2Z" />
      <path fill="#34A853" d="M12 23c3 0 5.5-1 7.4-2.7l-3.6-2.8c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2v2.9A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.7 14c-.2-.7-.4-1.3-.4-2s.1-1.4.4-2V7.1H2a11 11 0 0 0 0 9.8L5.7 14Z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2 7.1L5.7 10c.9-2.7 3.4-4.6 6.3-4.6Z" />
    </svg>
  )
}
