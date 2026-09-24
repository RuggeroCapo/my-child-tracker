import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { googleAuthEnabled, supabase } from '@/lib/supabase'
import { AuthLayout, GoogleIcon } from './AuthLayout'

export function LoginPage() {
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      setError(
        error.message.includes('Email not confirmed')
          ? 'Conferma prima il tuo indirizzo email (controlla la posta).'
          : error.status === 400
            ? 'Email o password non corretti.'
            : 'Impossibile accedere. Controlla la connessione.',
      )
    }
  }

  async function google() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${next}` },
    })
  }

  return (
    <AuthLayout
      title="Il mio Bebè"
      subtitle="Un diario condiviso per i momenti più importanti"
      footer={
        <>
          Non hai un account?{' '}
          <Link to={`/signup${params.size ? `?${params}` : ''}`} className="font-semibold text-rose">
            Registrati
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Email" type="email" autoComplete="email" inputMode="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit" block size="lg" loading={loading}>
          Accedi
        </Button>
        <div className="text-center">
          <Link to="/forgot-password" className="text-sm font-medium text-ink-2 underline-offset-2 hover:underline">
            Password dimenticata?
          </Link>
        </div>
      </form>
      {googleAuthEnabled && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs text-ink-3">
            <span className="h-px flex-1 bg-line" /> oppure <span className="h-px flex-1 bg-line" />
          </div>
          <Button variant="outline" block size="lg" icon={<GoogleIcon />} onClick={google}>
            Continua con Google
          </Button>
        </>
      )}
    </AuthLayout>
  )
}
