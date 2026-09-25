-- Registrazione del bagnetto: event_json e write_event_details gestiscono
-- 'bath' (nessun dettaglio) e 'doctor_visit'.

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
      when 'bath' then
        '{}'::jsonb
      when 'doctor_visit' then
        (select to_jsonb(d) - 'event_id' from public.doctor_visit_events d where d.event_id = e.id)
    end
  )
  from public.events e
  where e.id = p_event_id;
$$;

create or replace function public.write_event_details(p_event_id uuid, p_kind public.event_kind, p_details jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_item jsonb;
  v_metrics public.measurement_metric[] := '{}';
begin
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

    when 'bath' then
      -- Il bagnetto non ha dettagli propri: orario e note stanno su events.
      null;

    when 'doctor_visit' then
      insert into public.doctor_visit_events (event_id, visit_type)
      values (p_event_id, trim(p_details ->> 'visit_type'))
      on conflict (event_id) do update set visit_type = excluded.visit_type;
  end case;
end;
$$;
