import { MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './AuthLayout'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) setError('Invio non riuscito. Riprova tra qualche minuto.')
    else setSent(true)
  }

  return (
    <AuthLayout
      title="Recupera l'accesso"
      subtitle={sent ? undefined : 'Ti invieremo un link per scegliere una nuova password'}
      footer={<Link to="/login" className="font-semibold text-rose">Torna all'accesso</Link>}
    >
      {sent ? (
        <div className="flex flex-col items-center gap-3 text-center text-ink-2">
          <MailCheck className="size-10 text-rose" aria-hidden />
          <p>
            Se esiste un account per <strong className="text-ink">{email}</strong>, riceverai a breve un'email con il link.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} error={error} />
          <Button type="submit" block size="lg" loading={loading}>
            Invia link
          </Button>
        </form>
      )}
    </AuthLayout>
  )
}
