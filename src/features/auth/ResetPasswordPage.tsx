import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { FullScreenLoader } from '@/app/Screens'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { supabase } from '@/lib/supabase'
import { useSession } from '@/stores/session'
import { toast } from '@/stores/ui'
import { AuthLayout } from './AuthLayout'

export function ResetPasswordPage() {
  const { session, ready } = useSession()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!ready) return <FullScreenLoader />
  if (!session) {
    return (
      <AuthLayout title="Link non valido" subtitle="Il link è scaduto o è già stato usato." footer={<Link to="/forgot-password" className="font-semibold text-rose-ink underline-offset-2 hover:underline">Richiedi un nuovo link</Link>}>
        <span />
      </AuthLayout>
    )
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('Aggiornamento non riuscito. Riprova.')
      return
    }
    useSession.getState().set({ recovering: false })
    toast({ tone: 'success', title: 'Password aggiornata' })
    navigate('/', { replace: true })
  }

  return (
    <AuthLayout title="Nuova password">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input label="Nuova password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} error={error} />
        <Button type="submit" block size="lg" loading={loading}>
          Salva password
        </Button>
      </form>
    </AuthLayout>
  )
}
