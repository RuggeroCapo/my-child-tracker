import { MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { supabase } from '@/lib/supabase'
import { AuthLayout } from './AuthLayout'

export function SignupPage() {
  const [params] = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.')
      return
    }
    setLoading(true)
    setError(null)
    const next = params.get('next') ?? '/'
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: `${window.location.origin}${next}`,
      },
    })
    setLoading(false)
    if (error) {
      setError(error.message.includes('registered') ? 'Esiste già un account con questa email.' : 'Registrazione non riuscita. Riprova.')
      return
    }
    // Con la conferma email attiva la sessione arriva dopo il click sul link.
    if (!data.session) setSent(true)
  }

  if (sent) {
    return (
      <AuthLayout title="Controlla la posta" footer={<Link to="/login" className="font-semibold text-rose-ink underline-offset-2 hover:underline">Torna all'accesso</Link>}>
        <div className="flex flex-col items-center gap-3 text-center text-ink-2">
          <MailCheck className="size-10 text-rose-ink" aria-hidden />
          <p>
            Ti abbiamo inviato un link a <strong className="text-ink">{email}</strong> per confermare l'account.
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout
      title="Crea un account"
      subtitle="Un'unica app, sempre con te e con chi si prende cura del tuo bebè"
      footer={
        <>
          Hai già un account?{' '}
          <Link to={`/login${params.size ? `?${params}` : ''}`} className="font-semibold text-rose-ink underline-offset-2 hover:underline">
            Accedi
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Il tuo nome" autoComplete="given-name" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} hint="Visibile agli altri genitori" />
        <Input label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} error={error} hint="Almeno 8 caratteri" />
        <Button type="submit" block size="lg" loading={loading}>
          Registrati
        </Button>
      </form>
    </AuthLayout>
  )
}
