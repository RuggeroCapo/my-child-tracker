import { Copy, Crown, Share2, UserMinus, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { formatShortDate } from '@/lib/time'
import { useActiveBaby, useBabies } from '@/stores/babies'
import { useMyRole } from '@/stores/selectors'
import { useSession } from '@/stores/session'
import { toast } from '@/stores/ui'
import { createInvite, removeMember } from '@/sync/babies'
import { friendlyError } from '@/sync/errors'

function formatCode(code: string) {
  return code.match(/.{1,4}/g)?.join('-') ?? code
}

export default function MembersPage() {
  const baby = useActiveBaby()!
  const members = useBabies((s) => s.members[baby.id] ?? [])
  const role = useMyRole()
  const me = useSession((s) => s.session?.user.id)
  const navigate = useNavigate()
  const [invite, setInvite] = useState<{ code: string; expires_at: string } | null>(null)
  const [creating, setCreating] = useState(false)
  const isOwner = role === 'owner'
  const link = invite ? `${window.location.origin}/invite/${invite.code}` : ''

  async function newInvite() {
    setCreating(true)
    try {
      setInvite(await createInvite(baby.id))
    } catch (e) {
      toast({ tone: 'error', title: 'Invito non creato', description: friendlyError(e as never) })
    } finally {
      setCreating(false)
    }
  }

  async function share() {
    if (!invite) return
    const text = `Ti invito a seguire ${baby.name} su Bebè: ${link}`
    if (navigator.share) {
      try {
        await navigator.share({ title: `Invito per ${baby.name}`, text, url: link })
        return
      } catch {
        // annullato dall'utente: si ricade sulla copia
      }
    }
    await copy()
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link)
      toast({ tone: 'success', title: 'Link copiato' })
    } catch {
      toast({ tone: 'info', title: 'Copia il codice', description: formatCode(invite!.code) })
    }
  }

  async function remove(userId: string, name: string) {
    const self = userId === me
    if (!window.confirm(self ? `Vuoi smettere di seguire ${baby.name}?` : `Rimuovere ${name}? Non vedrà più il diario di ${baby.name}.`)) return
    try {
      await removeMember(baby.id, userId)
      toast({ tone: 'success', title: self ? 'Hai lasciato il profilo' : `${name} rimosso` })
      if (self) navigate('/', { replace: true })
    } catch (e) {
      toast({ tone: 'error', title: 'Operazione non riuscita', description: friendlyError(e as never) })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Genitori e caregiver" />
      <Card className="divide-y divide-line overflow-hidden">
        {members.map((m) => (
          <div key={m.user_id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-sky/12 font-semibold text-sky">
              {m.display_name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">
                {m.display_name}
                {m.user_id === me && <span className="font-normal text-ink-3"> (tu)</span>}
              </span>
              <span className="flex items-center gap-1 text-sm text-ink-2">
                {m.role === 'owner' ? (
                  <>
                    <Crown className="size-3.5" /> Proprietario
                  </>
                ) : (
                  'Membro'
                )}
              </span>
            </span>
            {m.role === 'member' && (isOwner || m.user_id === me) && (
              <IconButton label={m.user_id === me ? 'Lascia' : `Rimuovi ${m.display_name}`} onClick={() => remove(m.user_id, m.display_name)}>
                <UserMinus className="size-5" />
              </IconButton>
            )}
          </div>
        ))}
      </Card>

      {isOwner ? (
        <section className="space-y-3">
          <SectionTitle>Invita</SectionTitle>
          {invite ? (
            <Card className="space-y-4 p-4 text-center">
              <p className="text-sm text-ink-2">Condividi questo link con l'altro genitore o caregiver. Vale una sola volta.</p>
              <p className="rounded-2xl bg-surface-2 py-3 font-mono text-2xl font-semibold tracking-widest" aria-label="Codice invito">
                {formatCode(invite.code)}
              </p>
              <p className="text-xs text-ink-3">Scade il {formatShortDate(invite.expires_at)}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" icon={<Copy className="size-4" />} onClick={copy}>
                  Copia link
                </Button>
                <Button icon={<Share2 className="size-4" />} onClick={share}>
                  Condividi
                </Button>
              </div>
            </Card>
          ) : (
            <Button block size="lg" variant="secondary" icon={<UserPlus className="size-5" />} loading={creating} onClick={newInvite}>
              Crea link d'invito
            </Button>
          )}
        </section>
      ) : (
        <p className="px-1 text-sm text-ink-3">Solo il proprietario del profilo può invitare o rimuovere persone.</p>
      )}
    </div>
  )
}
