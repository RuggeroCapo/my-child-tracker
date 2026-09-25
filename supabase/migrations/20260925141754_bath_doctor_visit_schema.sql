-- =============================================================================
-- Segue 20260925141722: aggiunge tabella dettaglio e RLS per 'doctor_visit',
-- e permette a 'bath' di avere started_at/ended_at come le sessioni con timer.
-- =============================================================================

-- Il bagnetto è un evento con durata (come allattamento/tiralatte), ma senza
-- sessione "attiva" concorrente: niente unique index dedicato.
alter table public.events drop constraint events_only_sessions_end;
alter table public.events add constraint events_only_sessions_end check (
  ended_at is null or kind in ('breastfeeding', 'pumping', 'bath')
);

create table public.doctor_visit_events (
  event_id uuid primary key references public.events (id) on delete cascade,
  visit_type text not null check (char_length(trim(visit_type)) between 1 and 80)
);

alter table public.doctor_visit_events enable row level security;

create policy doctor_visit_events_select on public.doctor_visit_events for select to authenticated
  using (public.is_event_member(event_id));
create policy doctor_visit_events_insert on public.doctor_visit_events for insert to authenticated
  with check (public.is_event_member(event_id));
create policy doctor_visit_events_update on public.doctor_visit_events for update to authenticated
  using (public.is_event_member(event_id)) with check (public.is_event_member(event_id));

alter publication supabase_realtime add table public.doctor_visit_events;

-- -----------------------------------------------------------------------------
-- write_event_details / event_json: aggiungono i due nuovi kind.
-- -----------------------------------------------------------------------------
create or replace function public.write_event_details(p_event_id uuid, p_kind public.event_kind, p_details jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_item jsonb;
  v_metrics public.measurement_metric[] := '{}';
begin
  -- Il bagnetto non ha dettagli propri.
  if p_kind = 'bath' then
    return;
  end if;

  if p_details is null or jsonb_typeof(p_details) <> 'object' then
    raise exception 'details_required' using errcode = '22023';
  end if;

  case p_kind
    when 'breastfeeding' then
      insert into public.feeding_sessions (event_id, side)
      values (p_event_id, (p_details ->> 'side')::public.breast_side)
      on conflict (event_id) do update set side = excluded.side;

    when 'diaper' then
      insert into public.diaper_events (event_id, type, stool_amount, stool_color)
      values (
        p_event_id,
        (p_details ->> 'type')::public.diaper_type,
        (p_details ->> 'stool_amount')::public.stool_amount,
        (p_details ->> 'stool_color')::public.stool_color
      )
      on conflict (event_id) do update set
        type = excluded.type,
        stool_amount = excluded.stool_amount,
        stool_color = excluded.stool_color;

    when 'bottle' then
      insert into public.bottle_events (event_id, amount, unit, milk_type)
      values (
        p_event_id,
        (p_details ->> 'amount')::numeric,
        coalesce((p_details ->> 'unit')::public.volume_unit, 'ml'),
        (p_details ->> 'milk_type')::public.milk_type
      )
      on conflict (event_id) do update set
        amount = excluded.amount, unit = excluded.unit, milk_type = excluded.milk_type;

    when 'pumping' then
      insert into public.pumping_sessions (event_id, side, amount, unit)
      values (
        p_event_id,
        (p_details ->> 'side')::public.pump_side,
        (p_details ->> 'amount')::numeric,
        coalesce((p_details ->> 'unit')::public.volume_unit, 'ml')
      )
      on conflict (event_id) do update set
        side = excluded.side, amount = excluded.amount, unit = excluded.unit;

    when 'medication' then
      insert into public.medication_events (event_id, medication_id, name, dose, unit)
      values (
        p_event_id,
        (p_details ->> 'medication_id')::uuid,
        trim(p_details ->> 'name'),
        (p_details ->> 'dose')::numeric,
        trim(p_details ->> 'unit')
      )
      on conflict (event_id) do update set
        medication_id = excluded.medication_id,
        name = excluded.name,
        dose = excluded.dose,
        unit = excluded.unit;

    when 'vaccination' then
      insert into public.vaccinations (event_id, vaccine_name, dose_number)
      values (
        p_event_id,
        trim(p_details ->> 'vaccine_name'),
        (p_details ->> 'dose_number')::smallint
      )
      on conflict (event_id) do update set
        vaccine_name = excluded.vaccine_name, dose_number = excluded.dose_number;

    when 'measurement' then
      if jsonb_typeof(p_details -> 'items') <> 'array' or jsonb_array_length(p_details -> 'items') = 0 then
        raise exception 'measurement_items_required' using errcode = '22023';
      end if;
      for v_item in select * from jsonb_array_elements(p_details -> 'items') loop
        v_metrics := v_metrics || (v_item ->> 'metric')::public.measurement_metric;
        insert into public.measurements (event_id, metric, value, unit)
        values (
          p_event_id,
          (v_item ->> 'metric')::public.measurement_metric,
          (v_item ->> 'value')::numeric,
          v_item ->> 'unit'
        )
        on conflict (event_id, metric) do update set value = excluded.value, unit = excluded.unit;
      end loop;
      delete from public.measurements m
      where m.event_id = p_event_id and not (m.metric = any (v_metrics));

    when 'doctor_visit' then
      insert into public.doctor_visit_events (event_id, visit_type)
      values (p_event_id, trim(p_details ->> 'visit_type'))
      on conflict (event_id) do update set visit_type = excluded.visit_type;

    else
      null; -- 'bath' già gestito sopra
  end case;
end;
$$;

create or replace function public.event_json(p_event_id uuid)
returns jsonb
language sql
stable
set search_path = ''
as $$
  select to_jsonb(e) || jsonb_build_object(
    'details',
    case e.kind
      when 'breastfeeding' then
        (select to_jsonb(d) - 'event_id' from public.feeding_sessions d where d.event_id = e.id)
      when 'diaper' then
        (select to_jsonb(d) - 'event_id' from public.diaper_events d where d.event_id = e.id)
      when 'bottle' then
        (select to_jsonb(d) - 'event_id' from public.bottle_events d where d.event_id = e.id)
      when 'pumping' then
        (select to_jsonb(d) - 'event_id' from public.pumping_sessions d where d.event_id = e.id)
      when 'medication' then
        (select to_jsonb(d) - 'event_id' from public.medication_events d where d.event_id = e.id)
      when 'vaccination' then
        (select to_jsonb(d) - 'event_id' from public.vaccinations d where d.event_id = e.id)
      when 'measurement' then
        jsonb_build_object('items', coalesce((
          select jsonb_agg(to_jsonb(d) - 'event_id' order by d.metric)
          from public.measurements d where d.event_id = e.id
        ), '[]'::jsonb))
      when 'doctor_visit' then
        (select to_jsonb(d) - 'event_id' from public.doctor_visit_events d where d.event_id = e.id)
      when 'bath' then
        '{}'::jsonb
    end
  )
  from public.events e
  where e.id = p_event_id;
$$;
