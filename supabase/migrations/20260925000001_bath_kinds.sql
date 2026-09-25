-- Allinea le migrazioni allo schema remoto: i tipi 'bath' e 'doctor_visit'
-- esistono già nell'enum del database in produzione (vedi database.types.ts).
-- File separato perché un nuovo valore di enum non si può usare nella stessa
-- transazione in cui viene aggiunto.
alter type public.event_kind add value if not exists 'bath';
alter type public.event_kind add value if not exists 'doctor_visit';

create table if not exists public.doctor_visit_events (
  event_id uuid primary key references public.events (id) on delete cascade,
  visit_type text not null
);

alter table public.doctor_visit_events enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'doctor_visit_events') then
    create policy doctor_visit_events_select on public.doctor_visit_events for select to authenticated
      using (public.is_event_member(event_id));
    create policy doctor_visit_events_insert on public.doctor_visit_events for insert to authenticated
      with check (public.is_event_member(event_id));
    create policy doctor_visit_events_update on public.doctor_visit_events for update to authenticated
      using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));
  end if;
end;
$$;
