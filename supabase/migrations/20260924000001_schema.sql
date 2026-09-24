-- =============================================================================
-- Bebè — schema iniziale
--
-- Modello:  auth.users ─ profiles ─ baby_members ─ babies ─ events ─ <dettagli>
--
-- `events` è il supertipo di tutti gli eventi registrabili (allattamento,
-- pannolino, ...). Ogni tipo ha una tabella di dettaglio 1:1 con PK = event_id.
-- Le scritture passano dalle RPC in `..._functions.sql`, che scrivono evento e
-- dettaglio nella stessa transazione e aggiornano sempre `events.updated_at`:
-- così basta ascoltare `events` in Realtime e usare `updated_at` come cursore
-- per la sincronizzazione incrementale.
-- Le eliminazioni sono soft delete (`deleted_at`) per propagarle via Realtime
-- e delta sync a tutti i dispositivi.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Tipi
-- -----------------------------------------------------------------------------
create type public.member_role as enum ('owner', 'member');
create type public.baby_sex as enum ('female', 'male');
create type public.event_kind as enum (
  'breastfeeding', 'diaper', 'bottle', 'pumping', 'medication', 'vaccination', 'measurement'
);
create type public.breast_side as enum ('left', 'right');
create type public.pump_side as enum ('left', 'right', 'both');
create type public.diaper_type as enum ('wet', 'dirty', 'mixed');
create type public.stool_amount as enum ('small', 'medium', 'large');
create type public.stool_color as enum ('yellow', 'green', 'brown', 'black', 'red', 'white');
create type public.milk_type as enum ('breast_milk', 'formula', 'other');
create type public.volume_unit as enum ('ml', 'oz');
create type public.measurement_metric as enum ('weight', 'length', 'head');

-- -----------------------------------------------------------------------------
-- Utility
-- -----------------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profili utente
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 60),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Genitore'
    ), 60)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Bambini e membri
-- -----------------------------------------------------------------------------
create table public.babies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 60),
  birth_date date not null,
  sex public.baby_sex,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger babies_updated_at before update on public.babies
  for each row execute function public.set_updated_at();

create table public.baby_members (
  baby_id uuid not null references public.babies (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (baby_id, user_id)
);

create index baby_members_user_idx on public.baby_members (user_id);

create table public.baby_invites (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  code text not null unique,
  created_by uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references public.profiles (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz
);

create index baby_invites_baby_idx on public.baby_invites (baby_id);

-- -----------------------------------------------------------------------------
-- Registro medicine (modificabile dall'utente: vitamine, farmaci ricorrenti)
-- -----------------------------------------------------------------------------
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 80),
  default_dose numeric(8, 2) check (default_dose is null or default_dose > 0),
  default_unit text check (default_unit is null or char_length(default_unit) between 1 and 20),
  notes text check (notes is null or char_length(notes) <= 500),
  archived boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index medications_baby_idx on public.medications (baby_id);

create trigger medications_updated_at before update on public.medications
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Eventi (supertipo)
-- -----------------------------------------------------------------------------
create table public.events (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references public.babies (id) on delete cascade,
  kind public.event_kind not null,
  -- Momento dell'evento; per le sessioni con timer è l'inizio.
  started_at timestamptz not null default now(),
  -- Fine delle sessioni con timer (allattamento, tiralatte). NULL = in corso.
  ended_at timestamptz,
  duration_seconds integer generated always as (
    case when ended_at is null then null
    else greatest(0, floor(extract(epoch from (ended_at - started_at))))::integer end
  ) stored,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  ended_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint events_end_after_start check (ended_at is null or ended_at >= started_at),
  constraint events_only_sessions_end check (
    ended_at is null or kind in ('breastfeeding', 'pumping')
  )
);

create index events_baby_started_idx on public.events (baby_id, started_at desc);
create index events_baby_updated_idx on public.events (baby_id, updated_at, id);

-- Concorrenza: al massimo una sessione attiva per tipo e bambino.
create unique index events_one_active_session_idx on public.events (baby_id, kind)
  where ended_at is null and deleted_at is null and kind in ('breastfeeding', 'pumping');

create function public.events_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  if tg_op = 'UPDATE' then
    -- Campi immutabili.
    new.id := old.id;
    new.baby_id := old.baby_id;
    new.kind := old.kind;
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  else
    new.created_at := now();
  end if;
  return new;
end;
$$;

create trigger events_before_write before insert or update on public.events
  for each row execute function public.events_before_write();

-- -----------------------------------------------------------------------------
-- Dettagli per tipo
-- -----------------------------------------------------------------------------
create table public.feeding_sessions (
  event_id uuid primary key references public.events (id) on delete cascade,
  side public.breast_side not null
);

create table public.diaper_events (
  event_id uuid primary key references public.events (id) on delete cascade,
  type public.diaper_type not null,
  stool_amount public.stool_amount,
  stool_color public.stool_color,
  constraint diaper_stool_only_if_dirty check (
    type <> 'wet' or (stool_amount is null and stool_color is null)
  )
);

create table public.bottle_events (
  event_id uuid primary key references public.events (id) on delete cascade,
  amount numeric(6, 1) not null check (amount > 0 and amount <= 2000),
  unit public.volume_unit not null default 'ml',
  milk_type public.milk_type not null
);

create table public.pumping_sessions (
  event_id uuid primary key references public.events (id) on delete cascade,
  side public.pump_side not null,
  amount numeric(6, 1) check (amount is null or (amount >= 0 and amount <= 2000)),
  unit public.volume_unit not null default 'ml'
);

create table public.medication_events (
  event_id uuid primary key references public.events (id) on delete cascade,
  medication_id uuid references public.medications (id) on delete set null,
  name text not null check (char_length(trim(name)) between 1 and 80),
  dose numeric(8, 2) not null check (dose > 0),
  unit text not null check (char_length(unit) between 1 and 20)
);

create index medication_events_medication_idx on public.medication_events (medication_id);

create table public.vaccinations (
  event_id uuid primary key references public.events (id) on delete cascade,
  vaccine_name text not null check (char_length(trim(vaccine_name)) between 1 and 80),
  dose_number smallint check (dose_number is null or dose_number between 1 and 10)
);

create table public.measurements (
  event_id uuid not null references public.events (id) on delete cascade,
  metric public.measurement_metric not null,
  value numeric(7, 3) not null check (value > 0),
  unit text not null,
  primary key (event_id, metric),
  constraint measurements_unit_valid check (
    (metric = 'weight' and unit in ('kg', 'g', 'lb'))
    or (metric in ('length', 'head') and unit in ('cm', 'in'))
  )
);

-- =============================================================================
-- Row Level Security
-- =============================================================================
create function public.is_baby_member(p_baby_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.baby_members m
    where m.baby_id = p_baby_id and m.user_id = (select auth.uid())
  );
$$;

create function public.is_baby_owner(p_baby_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.baby_members m
    where m.baby_id = p_baby_id and m.user_id = (select auth.uid()) and m.role = 'owner'
  );
$$;

create function public.is_event_member(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.events e
    join public.baby_members m on m.baby_id = e.baby_id
    where e.id = p_event_id and m.user_id = (select auth.uid())
  );
$$;

create function public.shares_baby_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.baby_members mine
    join public.baby_members theirs on theirs.baby_id = mine.baby_id
    where mine.user_id = (select auth.uid()) and theirs.user_id = p_user_id
  );
$$;

alter table public.profiles enable row level security;
alter table public.babies enable row level security;
alter table public.baby_members enable row level security;
alter table public.baby_invites enable row level security;
alter table public.medications enable row level security;
alter table public.events enable row level security;
alter table public.feeding_sessions enable row level security;
alter table public.diaper_events enable row level security;
alter table public.bottle_events enable row level security;
alter table public.pumping_sessions enable row level security;
alter table public.medication_events enable row level security;
alter table public.vaccinations enable row level security;
alter table public.measurements enable row level security;

-- profiles: il proprio profilo e quelli dei co-genitori
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_baby_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- babies: lettura ai membri, modifica/eliminazione all'owner.
-- La creazione avviene tramite RPC create_baby (crea anche la membership owner).
create policy babies_select on public.babies for select to authenticated
  using (public.is_baby_member(id));
create policy babies_update on public.babies for update to authenticated
  using (public.is_baby_owner(id)) with check (public.is_baby_owner(id));
create policy babies_delete on public.babies for delete to authenticated
  using (public.is_baby_owner(id));

-- baby_members: i membri vedono gli altri membri; l'owner rimuove i member;
-- un member può uscire da solo. L'ingresso avviene tramite accept_invite.
create policy baby_members_select on public.baby_members for select to authenticated
  using (public.is_baby_member(baby_id));
create policy baby_members_delete on public.baby_members for delete to authenticated
  using (
    role = 'member'
    and (public.is_baby_owner(baby_id) or user_id = (select auth.uid()))
  );

-- baby_invites: solo l'owner
create policy baby_invites_select on public.baby_invites for select to authenticated
  using (public.is_baby_owner(baby_id));
create policy baby_invites_insert on public.baby_invites for insert to authenticated
  with check (public.is_baby_owner(baby_id) and created_by = (select auth.uid()));
create policy baby_invites_update on public.baby_invites for update to authenticated
  using (public.is_baby_owner(baby_id)) with check (public.is_baby_owner(baby_id));

-- medications: tutti i membri
create policy medications_select on public.medications for select to authenticated
  using (public.is_baby_member(baby_id));
create policy medications_insert on public.medications for insert to authenticated
  with check (public.is_baby_member(baby_id));
create policy medications_update on public.medications for update to authenticated
  using (public.is_baby_member(baby_id)) with check (public.is_baby_member(baby_id));
create policy medications_delete on public.medications for delete to authenticated
  using (public.is_baby_member(baby_id));

-- events: tutti i membri leggono, creano e modificano (soft delete incluso).
-- Nessuna policy DELETE: l'eliminazione fisica non è consentita ai client.
create policy events_select on public.events for select to authenticated
  using (public.is_baby_member(baby_id));
create policy events_insert on public.events for insert to authenticated
  with check (public.is_baby_member(baby_id) and created_by = (select auth.uid()));
create policy events_update on public.events for update to authenticated
  using (public.is_baby_member(baby_id)) with check (public.is_baby_member(baby_id));

-- dettagli: stessi permessi dell'evento padre
do $$
declare
  t text;
begin
  foreach t in array array[
    'feeding_sessions', 'diaper_events', 'bottle_events', 'pumping_sessions',
    'medication_events', 'vaccinations', 'measurements'
  ] loop
    execute format(
      'create policy %1$s_select on public.%1$I for select to authenticated using (public.is_event_member(event_id))', t);
    execute format(
      'create policy %1$s_insert on public.%1$I for insert to authenticated with check (public.is_event_member(event_id))', t);
    execute format(
      'create policy %1$s_update on public.%1$I for update to authenticated using (public.is_event_member(event_id)) with check (public.is_event_member(event_id))', t);
  end loop;
end;
$$;

-- Una misurazione può rimuovere una metrica in modifica.
create policy measurements_delete on public.measurements for delete to authenticated
  using (public.is_event_member(event_id));

-- Nessun accesso anonimo.
revoke all on all tables in schema public from anon;

-- =============================================================================
-- Realtime
-- =============================================================================
alter publication supabase_realtime add table
  public.events, public.babies, public.baby_members, public.medications;
