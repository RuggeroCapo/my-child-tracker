import { Pencil, Plus, Trash } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Button, IconButton } from '@/components/ui/Button'
import { Card, SectionTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input, Select, Textarea } from '@/components/ui/Field'
import { PageHeader } from '@/components/ui/PageHeader'
import { Sheet } from '@/components/ui/Sheet'
import type { Medication } from '@/domain/types'
import { formatNumber, parseDecimal } from '@/lib/units'
import { useActiveBaby, useBabies } from '@/stores/babies'
import { useEventsOfKind } from '@/stores/selectors'
import { toast } from '@/stores/ui'
import { deleteMedication, saveMedication } from '@/sync/babies'
import { friendlyError } from '@/sync/errors'
import { EventList } from '../events/EventList'
import { DOSE_UNITS, MedicationForm } from './MedicationForm'

const EMPTY: Medication[] = []

export default function MedicationsPage() {
  const baby = useActiveBaby()!
  const history = useEventsOfKind(baby.id, 'medication')
  const registry = useBabies((s) => s.medications[baby.id] ?? EMPTY)
  const [logOpen, setLogOpen] = useState(false)
  const [editing, setEditing] = useState<Medication | 'new' | null>(null)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Medicine"
        action={
          <IconButton label="Registra somministrazione" onClick={() => setLogOpen(true)}>
            <Plus className="size-6" />
          </IconButton>
        }
      />
      <Button block size="lg" variant="success" icon={<Plus className="size-5" />} onClick={() => setLogOpen(true)}>
        Registra somministrazione
      </Button>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Registro medicine</SectionTitle>
          <Button size="sm" variant="ghost" icon={<Plus className="size-4" />} onClick={() => setEditing('new')}>
            Aggiungi
          </Button>
        </div>
        {registry.filter((m) => !m.archived).length === 0 ? (
          <EmptyState title="Registro vuoto">Aggiungi vitamine o farmaci ricorrenti per registrarli con un tocco.</EmptyState>
        ) : (
          <Card className="divide-y divide-line">
            {registry
              .filter((m) => !m.archived)
              .map((m) => (
                <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.name}</p>
                    <p className="truncate text-sm text-ink-2">
                      {m.default_dose != null ? `${formatNumber(m.default_dose)} ${m.default_unit ?? ''}` : 'Dose non impostata'}
                      {m.notes ? ` · ${m.notes}` : ''}
                    </p>
                  </div>
                  <IconButton label={`Modifica ${m.name}`} onClick={() => setEditing(m)}>
                    <Pencil className="size-4" />
                  </IconButton>
                </div>
              ))}
          </Card>
        )}
        <p className="px-1 text-xs text-ink-3">
          Le dosi sono quelle indicate da voi o dal pediatra: l'app non dà indicazioni mediche.
        </p>
      </section>

      <section className="space-y-3">
        <SectionTitle>Storico somministrazioni</SectionTitle>
        {history.length === 0 ? <EmptyState title="Nessuna somministrazione registrata" /> : <EventList events={history} />}
      </section>

      <Sheet open={logOpen} onClose={() => setLogOpen(false)} title="Somministrazione">
        <MedicationForm babyId={baby.id} onSaved={() => setLogOpen(false)} />
      </Sheet>
      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nuova medicina' : 'Modifica medicina'}>
        {editing !== null && (
          <RegistryForm babyId={baby.id} medication={editing === 'new' ? null : editing} onDone={() => setEditing(null)} />
        )}
      </Sheet>
    </div>
  )
}

function RegistryForm({ babyId, medication, onDone }: { babyId: string; medication: Medication | null; onDone: () => void }) {
  const [name, setName] = useState(medication?.name ?? '')
  const [dose, setDose] = useState(medication?.default_dose != null ? formatNumber(medication.default_dose) : '')
  const [unit, setUnit] = useState(medication?.default_unit ?? 'ml')
  const [notes, setNotes] = useState(medication?.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveMedication({
        id: medication?.id,
        baby_id: babyId,
        name: name.trim(),
        default_dose: dose.trim() ? parseDecimal(dose) : null,
        default_unit: unit,
        notes: notes.trim() || null,
      })
      onDone()
    } catch (err) {
      toast({ tone: 'error', title: 'Salvataggio non riuscito', description: friendlyError(err as never) })
    } finally {
      setSaving(false)
    }
  }

  async function onRemove() {
    if (!medication) return
    if (!window.confirm(`Rimuovere "${medication.name}" dal registro? Lo storico delle somministrazioni resta.`)) return
    try {
      await deleteMedication(medication)
      onDone()
    } catch (err) {
      toast({ tone: 'error', title: 'Operazione non riuscita', description: friendlyError(err as never) })
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 pb-2">
      <Input label="Nome" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="Es. Vitamina D" />
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input label="Dose abituale" optional inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} />
        <Select label="Unità" value={unit} onChange={(e) => setUnit(e.target.value)} className="w-36">
          {DOSE_UNITS.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </Select>
      </div>
      <Textarea label="Note" optional maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Es. al mattino, prescritta dal pediatra" />
      <Button type="submit" block size="lg" variant="success" loading={saving} disabled={!name.trim()}>
        Salva
      </Button>
      {medication && (
        <Button variant="ghost" block className="text-danger" icon={<Trash className="size-4" />} onClick={onRemove}>
          Rimuovi dal registro
        </Button>
      )}
    </form>
  )
}
