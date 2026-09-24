import { Baby, KeyRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { signOut } from '@/app/auth'

/** Primo accesso: crea il profilo del bambino oppure unisciti con un codice d'invito. */
export default function WelcomePage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')

  function join(e: FormEvent) {
    e.preventDefault()
    const clean = code.replace(/[^a-z0-9]/gi, '')
    if (clean) navigate(`/invite/${clean}`)
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center gap-6 py-10 pt-safe">
      <div className="flex flex-col items-center text-center">
        <Logo size={64} />
        <h1 className="mt-4 text-2xl font-semibold">Benvenuto!</h1>
        <p className="mt-1 text-ink-2">Inizia creando il profilo del tuo bambino.</p>
      </div>
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-rose/12 text-rose">
            <Baby className="size-6" />
          </span>
          <div>
            <p className="font-semibold">Nuovo profilo bambino</p>
            <p className="text-sm text-ink-2">Potrai invitare l'altro genitore in seguito</p>
          </div>
        </div>
        <Button block size="lg" onClick={() => navigate('/babies/new')}>
          Aggiungi bambino
        </Button>
      </Card>
      <Card className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-sky/12 text-sky">
            <KeyRound className="size-5" />
          </span>
          <div>
            <p className="font-semibold">Hai ricevuto un invito?</p>
            <p className="text-sm text-ink-2">Apri il link oppure inserisci il codice</p>
          </div>
        </div>
        <form onSubmit={join} className="flex gap-2">
          <Input aria-label="Codice invito" placeholder="ABCD-EFGH-1234" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="font-mono tracking-wider" />
          <Button type="submit" variant="secondary" className="h-12" disabled={!code.trim()}>
            Unisciti
          </Button>
        </form>
      </Card>
      <p className="text-center text-sm text-ink-3">
        <Link to="/login" onClick={() => void signOut()} className="underline-offset-2 hover:underline">
          Esci
        </Link>
      </p>
    </div>
  )
}
