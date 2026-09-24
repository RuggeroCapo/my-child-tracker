import type { Baby, BabyMember, BabySex, Medication } from '@/domain/types'
import { supabase } from '@/lib/supabase'
import { useBabies } from '@/stores/babies'

export async function loadBabies(): Promise<Baby[]> {
  const { data, error } = await supabase
    .from('babies')
    .select('*, baby_members(baby_id, user_id, role, profiles(display_name))')
    .order('created_at')
  if (error) throw error
  const members: Record<string, BabyMember[]> = {}
  const babies: Baby[] = data.map(({ baby_members, ...baby }) => {
    members[baby.id] = baby_members
      .map((m) => ({
        baby_id: m.baby_id,
        user_id: m.user_id,
        role: m.role,
        display_name: m.profiles?.display_name ?? 'Genitore',
      }))
      .sort((a, b) => (a.role === b.role ? a.display_name.localeCompare(b.display_name) : a.role === 'owner' ? -1 : 1))
    return baby
  })
  useBabies.getState().setBabies(babies, members)
  return babies
}

export async function loadMedications(babyIds: string[]): Promise<void> {
  if (babyIds.length === 0) return
  const { data, error } = await supabase.from('medications').select('*').in('baby_id', babyIds).order('name')
  if (error) throw error
  const byBaby: Record<string, Medication[]> = Object.fromEntries(babyIds.map((id) => [id, []]))
  for (const m of data) byBaby[m.baby_id]?.push(m)
  for (const id of babyIds) useBabies.getState().setMedications(id, byBaby[id])
}

export async function createBaby(input: { name: string; birth_date: string; sex: BabySex | null }) {
  const { data, error } = await supabase.rpc('create_baby', {
    p_name: input.name,
    p_birth_date: input.birth_date,
    p_sex: input.sex ?? undefined,
  })
  if (error) throw error
  await loadBabies()
  useBabies.getState().setActive(data.id)
  return data
}

export async function updateBaby(id: string, patch: { name: string; birth_date: string; sex: BabySex | null }) {
  const { error } = await supabase.from('babies').update(patch).eq('id', id)
  if (error) throw error
  await loadBabies()
}

export async function deleteBaby(id: string) {
  const { error } = await supabase.from('babies').delete().eq('id', id)
  if (error) throw error
  await loadBabies()
}

export async function removeMember(babyId: string, userId: string) {
  const { error } = await supabase.from('baby_members').delete().eq('baby_id', babyId).eq('user_id', userId)
  if (error) throw error
  await loadBabies()
}

export async function createInvite(babyId: string) {
  const { data, error } = await supabase.rpc('create_invite', { p_baby_id: babyId })
  if (error) throw error
  return data
}

export interface InviteInfo {
  status: 'valid' | 'already_member' | 'revoked' | 'used' | 'expired' | 'not_found'
  baby_id?: string
  baby_name?: string
  invited_by?: string
  expires_at?: string
}

export async function getInvite(code: string): Promise<InviteInfo> {
  const { data, error } = await supabase.rpc('get_invite', { p_code: code })
  if (error) throw error
  return data as unknown as InviteInfo
}

export async function acceptInvite(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('accept_invite', { p_code: code })
  if (error) throw error
  await loadBabies()
  useBabies.getState().setActive(data)
  return data
}

export async function saveMedication(med: {
  id?: string
  baby_id: string
  name: string
  default_dose: number | null
  default_unit: string | null
  notes: string | null
  archived?: boolean
}) {
  const { error } = med.id
    ? await supabase.from('medications').update(med).eq('id', med.id)
    : await supabase.from('medications').insert(med)
  if (error) throw error
  await loadMedications([med.baby_id])
}

export async function deleteMedication(med: Medication) {
  const { error } = await supabase.from('medications').delete().eq('id', med.id)
  if (error) throw error
  await loadMedications([med.baby_id])
}

export async function updateDisplayName(userId: string, displayName: string) {
  const { error } = await supabase.from('profiles').update({ display_name: displayName }).eq('id', userId)
  if (error) throw error
  await loadBabies()
}
