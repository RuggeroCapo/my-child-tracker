-- =============================================================================
-- Bebè — RPC
--
-- Tutte le funzioni che scrivono eventi sono SECURITY INVOKER: la RLS resta la
-- fonte dei permessi. Sono idempotenti rispetto all'id evento generato dal
-- client, così la coda offline può ripeterle senza creare duplicati.
-- Il server è la fonte autorevole dei timestamp: se il client non passa un
-- orario esplicito viene usato now() del database.
-- =============================================================================

create function public.server_now()
returns timestamptz
language sql
stable
as $$
  select now();
$$;

-- Evento + dettaglio in un unico documento JSON (stessa forma per pull, RPC e
-- client).
create function public.event_json(p_event_id uuid)
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
    end
  )
  from public.events e
  where e.id = p_event_id;
$$;

-- Sincronizzazione incrementale con paginazione keyset su (updated_at, id).
create function public.pull_events(
  p_baby_ids uuid[],
  p_since timestamptz default null,
  p_after_id uuid default null,
  p_limit integer default 500
)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with page as (
    select e.id, e.updated_at
    from public.events e
    where e.baby_id = any (p_baby_ids)
      and (
        p_since is null
        or (e.updated_at, e.id) > (p_since, coalesce(p_after_id, '00000000-0000-0000-0000-000000000000'::uuid))
      )
    order by e.updated_at, e.id
    limit least(greatest(p_limit, 1), 1000)
  )
  select coalesce(jsonb_agg(public.event_json(page.id) order by page.updated_at, page.id), '[]'::jsonb)
  from page;
$$;

-- -----------------------------------------------------------------------------
-- Dettagli: scrittura del sottotipo a partire dal JSON
-- -----------------------------------------------------------------------------
create function public.write_event_details(p_event_id uuid, p_kind public.event_kind, p_details jsonb)
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
  end case;
end;
$$;

-- -----------------------------------------------------------------------------
-- Inserimento / modifica generica (idempotente sull'id)
-- -----------------------------------------------------------------------------
create function public.upsert_event(p_event jsonb)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_id uuid := (p_event ->> 'id')::uuid;
  v_kind public.event_kind := (p_event ->> 'kind')::public.event_kind;
  v_existing public.events;
  v_started timestamptz := coalesce((p_event ->> 'started_at')::timestamptz, now());
  v_ended timestamptz := (p_event ->> 'ended_at')::timestamptz;
  v_notes text := nullif(trim(p_event ->> 'notes'), '');
begin
  if v_id is null or v_kind is null then
    raise exception 'id_and_kind_required' using errcode = '22023';
  end if;
  -- Nessun evento nel futuro (piccola tolleranza per orologi disallineati).
  if v_started > now() + interval '5 minutes' or v_ended > now() + interval '5 minutes' then
    raise exception 'event_in_future' using errcode = '22023';
  end if;

  select * into v_existing from public.events where id = v_id;

  if found then
    if v_existing.kind <> v_kind then
      raise exception 'kind_mismatch' using errcode = '22023';
    end if;
    update public.events set
      started_at = v_started,
      ended_at = v_ended,
      ended_by = case
        when v_ended is null then null
        when v_existing.ended_at is null then auth.uid()
        else v_existing.ended_by
      end,
      notes = v_notes
    where id = v_id;
  else
    insert into public.events (id, baby_id, kind, started_at, ended_at, ended_by, notes, created_by)
    values (
      v_id,
      (p_event ->> 'baby_id')::uuid,
      v_kind,
      v_started,
      v_ended,
      case when v_ended is not null then auth.uid() end,
      v_notes,
      auth.uid()
    );
  end if;

  perform public.write_event_details(v_id, v_kind, p_event -> 'details');

  return public.event_json(v_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- Sessioni con timer (allattamento, tiralatte)
-- -----------------------------------------------------------------------------

-- Avvia una sessione. Se ne esiste già una attiva dello stesso tipo per il
-- bambino (avviata da un altro dispositivo) la restituisce invece di crearne
-- un duplicato.
create function public.start_session(
  p_id uuid,
  p_baby_id uuid,
  p_kind public.event_kind,
  p_details jsonb,
  p_started_at timestamptz default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_active uuid;
begin
  if p_kind not in ('breastfeeding', 'pumping') then
    raise exception 'not_a_session' using errcode = '22023';
  end if;

  if exists (select 1 from public.events where id = p_id) then
    return jsonb_build_object('status', 'exists', 'event', public.event_json(p_id));
  end if;

  select id into v_active from public.events
  where baby_id = p_baby_id and kind = p_kind and ended_at is null and deleted_at is null;
  if found then
    return jsonb_build_object('status', 'already_active', 'event', public.event_json(v_active));
  end if;

  begin
    insert into public.events (id, baby_id, kind, started_at, created_by)
    values (p_id, p_baby_id, p_kind, least(coalesce(p_started_at, now()), now()), auth.uid());
  exception when unique_violation then
    -- Due avvii contemporanei: vince il primo.
    select id into v_active from public.events
    where baby_id = p_baby_id and kind = p_kind and ended_at is null and deleted_at is null;
    return jsonb_build_object('status', 'already_active', 'event', public.event_json(v_active));
  end;

  perform public.write_event_details(p_id, p_kind, p_details);

  return jsonb_build_object('status', 'created', 'event', public.event_json(p_id));
end;
$$;

-- Termina una sessione. Solo il primo "Termina" ha effetto: gli altri
-- ricevono lo stato già registrato con status = 'already_ended'.
create function public.end_session(
  p_id uuid,
  p_ended_at timestamptz default null,
  p_details jsonb default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_event public.events;
begin
  update public.events
  set ended_at = greatest(started_at, least(coalesce(p_ended_at, now()), now())),
      ended_by = auth.uid()
  where id = p_id and ended_at is null and deleted_at is null
  returning * into v_event;

  if not found then
    if not exists (select 1 from public.events where id = p_id) then
      raise exception 'event_not_found' using errcode = 'P0002';
    end if;
    return jsonb_build_object('status', 'already_ended', 'event', public.event_json(p_id));
  end if;

  if p_details is not null then
    perform public.write_event_details(
      p_id,
      v_event.kind,
      coalesce(public.event_json(p_id) -> 'details', '{}'::jsonb) || p_details
    );
  end if;

  return jsonb_build_object('status', 'ended', 'event', public.event_json(p_id));
end;
$$;

-- Cambia lato durante l'allattamento: termina la sessione corrente e ne avvia
-- una nuova sull'altro lato nello stesso istante, in modo atomico.
create function public.switch_breast_side(
  p_id uuid,
  p_new_id uuid,
  p_at timestamptz default null
)
returns jsonb
language plpgsql
set search_path = ''
as $$
declare
  v_ended jsonb;
  v_event public.events;
  v_side public.breast_side;
  v_started jsonb;
begin
  if exists (select 1 from public.events where id = p_new_id) then
    return jsonb_build_object(
      'status', 'exists',
      'ended', public.event_json(p_id),
      'event', public.event_json(p_new_id)
    );
  end if;

  v_ended := public.end_session(p_id, p_at);
  if v_ended ->> 'status' = 'already_ended' then
    return jsonb_build_object('status', 'already_ended', 'ended', v_ended -> 'event', 'event', null);
  end if;

  select * into v_event from public.events where id = p_id;
  if v_event.kind <> 'breastfeeding' then
    raise exception 'not_breastfeeding' using errcode = '22023';
  end if;
  select case side when 'left' then 'right' else 'left' end::public.breast_side
  into v_side from public.feeding_sessions where event_id = p_id;

  v_started := public.start_session(
    p_new_id, v_event.baby_id, 'breastfeeding',
    jsonb_build_object('side', v_side), v_event.ended_at
  );

  return jsonb_build_object(
    'status', v_started ->> 'status',
    'ended', public.event_json(p_id),
    'event', v_started -> 'event'
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Eliminazione (soft delete) e ripristino
-- -----------------------------------------------------------------------------
create function public.delete_event(p_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  update public.events set deleted_at = now()
  where id = p_id and deleted_at is null;
  if not exists (select 1 from public.events where id = p_id) then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;
  return public.event_json(p_id);
end;
$$;

create function public.restore_event(p_id uuid)
returns jsonb
language plpgsql
set search_path = ''
as $$
begin
  update public.events set deleted_at = null
  where id = p_id and deleted_at is not null;
  if not exists (select 1 from public.events where id = p_id) then
    raise exception 'event_not_found' using errcode = 'P0002';
  end if;
  return public.event_json(p_id);
end;
$$;

-- -----------------------------------------------------------------------------
-- Bambini, inviti, membri
-- -----------------------------------------------------------------------------
create function public.create_baby(
  p_name text,
  p_birth_date date,
  p_sex public.baby_sex default null
)
returns public.babies
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_baby public.babies;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  if p_birth_date > current_date + 1 then
    raise exception 'birth_date_in_future' using errcode = '22023';
  end if;

  insert into public.babies (name, birth_date, sex, created_by)
  values (trim(p_name), p_birth_date, p_sex, v_uid)
  returning * into v_baby;

  insert into public.baby_members (baby_id, user_id, role)
  values (v_baby.id, v_uid, 'owner');

  return v_baby;
end;
$$;

create function public.normalize_invite_code(p_code text)
returns text
language sql
immutable
as $$
  select upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
$$;

-- Genera un codice d'invito monouso valido 7 giorni (solo owner, via RLS).
create function public.create_invite(p_baby_id uuid)
returns public.baby_invites
language plpgsql
set search_path = ''
as $$
declare
  v_invite public.baby_invites;
begin
  insert into public.baby_invites (baby_id, code, created_by)
  values (
    p_baby_id,
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)),
    auth.uid()
  )
  returning * into v_invite;
  return v_invite;
end;
$$;

-- Informazioni sull'invito da mostrare prima di accettarlo.
create function public.get_invite(p_code text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_invite public.baby_invites;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_invite from public.baby_invites
  where code = public.normalize_invite_code(p_code);
  if not found then
    return jsonb_build_object('status', 'not_found');
  end if;

  v_status := case
    when exists (
      select 1 from public.baby_members
      where baby_id = v_invite.baby_id and user_id = auth.uid()
    ) then 'already_member'
    when v_invite.revoked_at is not null then 'revoked'
    when v_invite.accepted_at is not null then 'used'
    when v_invite.expires_at < now() then 'expired'
    else 'valid'
  end;

  return jsonb_build_object(
    'status', v_status,
    'baby_id', v_invite.baby_id,
    'baby_name', (select name from public.babies where id = v_invite.baby_id),
    'invited_by', (select display_name from public.profiles where id = v_invite.created_by),
    'expires_at', v_invite.expires_at
  );
end;
$$;

create function public.accept_invite(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_invite public.baby_invites;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select * into v_invite from public.baby_invites
  where code = public.normalize_invite_code(p_code)
  for update;

  if not found then
    raise exception 'invite_not_found' using errcode = 'P0002';
  end if;

  if exists (
    select 1 from public.baby_members where baby_id = v_invite.baby_id and user_id = v_uid
  ) then
    return v_invite.baby_id;
  end if;

  if v_invite.revoked_at is not null or v_invite.accepted_at is not null then
    raise exception 'invite_used' using errcode = '22023';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'invite_expired' using errcode = '22023';
  end if;

  insert into public.baby_members (baby_id, user_id, role)
  values (v_invite.baby_id, v_uid, 'member');

  update public.baby_invites
  set accepted_by = v_uid, accepted_at = now()
  where id = v_invite.id;

  return v_invite.baby_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Permessi di esecuzione: solo utenti autenticati
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
