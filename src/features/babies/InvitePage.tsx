import { HeartHandshake, LoaderCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { toast } from '@/stores/ui'
import { acceptInvite, getInvite, type InviteInfo } from '@/sync/babies'
import { friendlyError } from '@/sync/errors'

const STATUS_TEXT: Record<Exclude<InviteInfo['status'], 'valid'>, string> = {
  already_member: 'Fai già parte di questo profilo.',
  revoked: 'Questo invito è stato revocato.',
  used: 'Questo invito è già stato utilizzato.',
  expired: 'Questo invito è scaduto. Chiedine uno nuovo.',
  not_found: 'Invito non trovato. Controlla il codice.',
}

export default function InvitePage() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [info, setInfo] = useState<InviteInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    getInvite(code)
      .then(setInfo)
      .catch((e) => setError(friendlyError(e)))
  }, [code])

  async function join() {
    setJoining(true)
    try {
      await acceptInvite(code)
      toast({ tone: 'success', title: `Ora segui anche tu ${info?.baby_name ?? ''}`.trim() })
      navigate('/', { replace: true })
    } catch (e) {
      toast({ tone: 'error', title: 'Invito non accettato', description: friendlyError(e as never) })
      setJoining(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center py-10">
      <Card className="flex flex-col items-center gap-4 p-6 text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-rose/12 text-rose">
          <HeartHandshake className="size-7" />
        </span>
        {!info && !error && <LoaderCircle className="size-6 animate-spin text-ink-3" aria-label="Caricamento" />}
        {error && <p className="text-ink-2">{error}</p>}
        {info?.status === 'valid' && (
          <>
            <div>
              <h1 className="text-xl font-semibold">Invito per {info.baby_name}</h1>
              <p className="mt-1 text-ink-2">
                {info.invited_by} ti invita a condividere il diario di {info.baby_name}: vedrete gli stessi eventi in tempo reale.
              </p>
            </div>
            <Button block size="lg" loading={joining} onClick={join}>
              Accetta invito
            </Button>
          </>
        )}
        {info && info.status !== 'valid' && (
          <>
            <p className="text-ink-2">{STATUS_TEXT[info.status]}</p>
            <Button variant="outline" block onClick={() => navigate('/', { replace: true })}>
              Vai alla home
            </Button>
          </>
        )}
        <Link to="/" className="text-sm text-ink-3 hover:underline">
          Annulla
        </Link>
      </Card>
    </div>
  )
}
