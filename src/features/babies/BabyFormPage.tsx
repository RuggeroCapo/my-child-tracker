import { useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { Segmented } from '@/components/ui/Segmented'
import type { BabySex } from '@/domain/types'
import { toDateInput } from '@/lib/time'
import { useBabies } from '@/stores/babies'
import { useMyRole } from '@/stores/selectors'
import { toast } from '@/stores/ui'
import { createBaby, deleteBaby, updateBaby } from '@/sync/babies'
import { friendlyError } from '@/sync/errors'

type SexChoice = BabySex | 'unset'

export default function BabyFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const existing = useBabies((s) => s.babies.find((b) => b.id === id))
  const role = useMyRole()
  const [name, setName] = useState(existing?.name ?? '')
  const [birthDate, setBirthDate] = useState(existing?.birth_date ?? toDateInput(new Date()))
  const [sex, setSex] = useState<SexChoice>(existing?.sex ?? 'unset')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isEdit = Boolean(id)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const input = { name: name.trim(), birth_date: birthDate, sex: sex === 'unset' ? null : sex }
      if (isEdit && id) await updateBaby(id, input)
      else await createBaby(input)
      toast({ tone: 'success', title: isEdit ? 'Profilo aggiornato' : `Profilo di ${input.name} creato` })
      if (isEdit) navigate(-1)
      else navigate('/', { replace: true })
    } catch (err) {
      toast({ tone: 'error', title: 'Salvataggio non riuscito', description: friendlyError(err as never) })
    } finally {
      setSaving(false)
    }
  }

  async function onDelete() {
    if (!id || !existing) return
    if (!window.confirm(`Eliminare definitivamente il profilo di ${existing.name} e tutti i suoi eventi per tutti i genitori?`)) return
    setDeleting(true)
    try {
      await deleteBaby(id)
      toast({ tone: 'success', title: 'Profilo eliminato' })
      navigate('/', { replace: true })
    } catch (err) {
      toast({ tone: 'error', title: 'Eliminazione non riuscita', description: friendlyError(err as never) })
      setDeleting(false)
    }
  }

  return (
    <>
      <PageHeader title={isEdit ? 'Profilo bambino' : 'Nuovo bambino'} />
      <form onSubmit={onSubmit} className="space-y-5 pt-2">
        <Input label="Nome" required maxLength={60} autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome del bambino" />
        <Input label="Data di nascita" type="date" required max={toDateInput(new Date())} value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <div className="space-y-1.5">
          <p className="px-1 text-sm font-medium text-ink-2">Sesso</p>
          <Segmented<SexChoice>
            ariaLabel="Sesso"
            value={sex}
            onChange={setSex}
            options={[
              { value: 'female', label: 'Femmina' },
              { value: 'male', label: 'Maschio' },
              { value: 'unset', label: 'Non indicato' },
            ]}
          />
          <p className="px-1 text-xs text-ink-3">Serve per mostrare le curve di crescita OMS corrette.</p>
        </div>
        <Button type="submit" block size="lg" loading={saving} disabled={!name.trim()}>
          Salva
        </Button>
        {isEdit && role === 'owner' && (
          <Button variant="ghost" block loading={deleting} onClick={onDelete}>
            Elimina profilo
          </Button>
        )}
      </form>
    </>
  )
}
