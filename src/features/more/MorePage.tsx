import { Baby, Bath, ChartSpline, ChevronRight, LogOut, Monitor, Moon, Pill, Stethoscope, Sun, Syringe, UserRound, Users } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { signOut } from '@/app/auth'
import { SyncBadge } from '@/app/SyncBadge'
import { Button } from '@/components/ui/Button'
import { FormDock } from '@/components/ui/FormDock'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/Segmented'
import { Sheet } from '@/components/ui/Sheet'
import { formatAge } from '@/lib/time'
import { useActiveBaby, useBabies } from '@/stores/babies'
import { useOutbox } from '@/stores/outbox'
import { useSession } from '@/stores/session'
import { toast, useUi, type ThemePref } from '@/stores/ui'
import { updateDisplayName } from '@/sync/babies'
import { friendlyError } from '@/sync/errors'
import { BabyAvatar } from '../babies/BabyAvatar'

export default function MorePage() {
  const baby = useActiveBaby()!
  const session = useSession((s) => s.session)
  const members = useBabies((s) => s.members[baby.id] ?? [])
  const myName = members.find((m) => m.user_id === session?.user.id)?.display_name ?? ''
  const theme = useUi((s) => s.theme)
  const setTheme = useUi((s) => s.setTheme)
  const pending = useOutbox((s) => s.ops.length)
  const navigate = useNavigate()
  const [nameOpen, setNameOpen] = useState(false)

  async function logout() {
    if (pending > 0 && !window.confirm(`Ci sono ${pending} modifiche non ancora sincronizzate che andrebbero perse. Uscire comunque?`)) return
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between pt-safe">
        <h1 className="font-display-tight text-[34px] font-extrabold leading-none">Altro</h1>
        <SyncBadge />
      </header>

      <Card className="divide-y divide-line overflow-hidden">
        <Link to={`/babies/${baby.id}/edit`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
          <BabyAvatar baby={baby} />
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{baby.name}</span>
            <span className="block text-sm text-ink-2">{formatAge(baby.birth_date)} · profilo bambino</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
        </Link>
        <Row to="/members" icon={<Users className="size-5 text-sky" />} label="Genitori e caregiver" detail={`${members.length} ${members.length === 1 ? 'persona' : 'persone'}`} />
        <Row to="/growth" icon={<ChartSpline className="size-5 text-growth" />} label="Crescita e curve OMS" />
        <Row to="/medications" icon={<Pill className="size-5 text-med" />} label="Registro medicine" />
        <Row to="/vaccinations" icon={<Syringe className="size-5 text-vax" />} label="Vaccinazioni" />
        <Row to="/bath" icon={<Bath className="size-5 text-bath" />} label="Bagnetto" />
        <Row to="/doctor-visit" icon={<Stethoscope className="size-5 text-visit" />} label="Visite mediche" />
        <Row to="/babies/new" icon={<Baby className="size-5 text-rose-ink" />} label="Aggiungi un altro bambino" />
      </Card>

      <Card className="space-y-3 p-4">
        <p className="font-display-snug text-lg font-bold">Tema</p>
        <Segmented<ThemePref>
          ariaLabel="Tema"
          value={theme}
          onChange={setTheme}
          options={[
            { value: 'light', label: 'Chiaro' },
            { value: 'dark', label: 'Scuro' },
            { value: 'system', label: 'Sistema' },
          ]}
        />
        <p className="flex items-center gap-2 text-xs text-ink-3">
          {theme === 'light' ? <Sun className="size-3.5" /> : theme === 'dark' ? <Moon className="size-3.5" /> : <Monitor className="size-3.5" />}
          {theme === 'system' ? 'Segue le impostazioni del dispositivo' : 'Tema fisso'}
        </p>
      </Card>

      <Card className="divide-y divide-line overflow-hidden">
        <button type="button" onClick={() => setNameOpen(true)} className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-2">
          <span className="flex size-11 shrink-0 items-center justify-center"><UserRound className="size-5 text-ink-2" /></span>
          <span className="min-w-0 flex-1">
            <span className="block font-medium">{myName || 'Il tuo nome'}</span>
            <span className="block truncate text-sm text-ink-2">{session?.user.email}</span>
          </span>
          <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
        </button>
        <button type="button" onClick={logout} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-ink-2 transition-colors hover:bg-surface-2 hover:text-ink">
          <span className="flex size-11 shrink-0 items-center justify-center"><LogOut className="size-5" /></span>
          <span className="font-medium">Esci</span>
        </button>
      </Card>

      <p className="px-2 text-center text-xs text-ink-3">
        Bebè v{__APP_VERSION__} · Le informazioni registrate non sostituiscono il parere del pediatra.
      </p>

      <Sheet open={nameOpen} onClose={() => setNameOpen(false)} title="Il tuo nome">
        <NameForm userId={session!.user.id} initial={myName} onDone={() => setNameOpen(false)} />
      </Sheet>
    </div>
  )
}

function Row({ to, icon, label, detail }: { to: string; icon: ReactNode; label: string; detail?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2">
      <span className="flex size-11 shrink-0 items-center justify-center">{icon}</span>
      <span className="flex-1 font-medium">{label}</span>
      {detail && <span className="text-sm text-ink-3">{detail}</span>}
      <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden />
    </Link>
  )
}

function NameForm({ userId, initial, onDone }: { userId: string; initial: string; onDone: () => void }) {
  const [name, setName] = useState(initial)
  const [saving, setSaving] = useState(false)
  return (
    <form
      className="space-y-4 pb-2"
      onSubmit={async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
          await updateDisplayName(userId, name.trim())
          onDone()
        } catch (err) {
          toast({ tone: 'error', title: 'Salvataggio non riuscito', description: friendlyError(err as never) })
        } finally {
          setSaving(false)
        }
      }}
    >
      <Input label="Nome visibile agli altri genitori" required maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
      <FormDock>
        <Button type="submit" block size="lg" loading={saving} disabled={!name.trim()}>
          Salva
        </Button>
      </FormDock>
    </form>
  )
}
