-- Test RLS e concorrenza. Esecuzione: `npx supabase test db`
begin;
create extension if not exists pgtap with schema extensions;

select plan(27);

-- Utenti di test -------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data, aud, role) values
  ('11111111-1111-1111-1111-111111111111', 'mamma@test.it', '{"display_name":"Giulia"}', 'authenticated', 'authenticated'),
  ('22222222-2222-2222-2222-222222222222', 'papa@test.it', '{"display_name":"Marco"}', 'authenticated', 'authenticated'),
  ('33333333-3333-3333-3333-333333333333', 'estraneo@test.it', '{}', 'authenticated', 'authenticated');

create function pg_temp.login(p_uid uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
$$;

select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Giulia', 'il profilo viene creato alla registrazione');

-- Creazione bambino ---------------------------------------------------------------
select pg_temp.login('11111111-1111-1111-1111-111111111111');
create temp table ctx as
  select (public.create_baby('Sofia', current_date - 90, 'female')).id as baby_id;
grant select on ctx to authenticated;

select is(
  (select role::text from public.baby_members where user_id = auth.uid()),
  'owner', 'chi crea il bambino ne è owner');

-- Il papà non vede nulla prima dell'invito ---------------------------------------
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is((select count(*) from public.babies)::int, 0, 'un non membro non vede il bambino');

-- Invito ----------------------------------------------------------------------------
select pg_temp.login('22222222-2222-2222-2222-222222222222');
select throws_ok(
  format('select public.create_invite(%L)', (select baby_id from ctx)),
  '42501', null, 'un non owner non può creare inviti');

select pg_temp.login('11111111-1111-1111-1111-111111111111');
create temp table invite as select (public.create_invite((select baby_id from ctx))).code as code;
grant select on invite to authenticated;

select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is(
  public.get_invite(lower((select code from invite))) ->> 'status', 'valid',
  'il codice è valido (case-insensitive)');
select is(public.accept_invite((select code from invite)), (select baby_id from ctx), 'il papà accetta l''invito');
select is((select count(*) from public.babies)::int, 1, 'il papà ora vede il bambino');
select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Giulia', 'i co-genitori vedono i rispettivi profili');

update public.babies set name = 'Hacked';
select is((select name from public.babies), 'Sofia', 'un member non può modificare il profilo del bambino');

select pg_temp.login('33333333-3333-3333-3333-333333333333');
select throws_ok(
  format('select public.accept_invite(%L)', (select code from invite)),
  '22023', 'invite_used', 'un invito è monouso');
select is((select count(*) from public.babies)::int, 0, 'l''estraneo non vede il bambino');

-- Sessioni concorrenti -------------------------------------------------------
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select is(
  public.start_session('aaaaaaaa-0000-0000-0000-000000000001', (select baby_id from ctx),
    'breastfeeding', '{"side":"left"}') ->> 'status',
  'created', 'la mamma avvia l''allattamento');
select is(
  public.start_session('aaaaaaaa-0000-0000-0000-000000000001', (select baby_id from ctx),
    'breastfeeding', '{"side":"left"}') ->> 'status',
  'exists', 'ripetere lo stesso avvio è idempotente');

select pg_temp.login('22222222-2222-2222-2222-222222222222');
select is(
  public.start_session('bbbbbbbb-0000-0000-0000-000000000002', (select baby_id from ctx),
    'breastfeeding', '{"side":"right"}') #>> '{event,id}',
  'aaaaaaaa-0000-0000-0000-000000000001',
  'un secondo avvio restituisce la sessione già attiva');
select is(
  public.end_session('aaaaaaaa-0000-0000-0000-000000000001') ->> 'status',
  'ended', 'il papà termina l''allattamento');

select pg_temp.login('11111111-1111-1111-1111-111111111111');
select is(
  public.end_session('aaaaaaaa-0000-0000-0000-000000000001') ->> 'status',
  'already_ended', 'la mamma riprova a terminare: già terminato');
select is(
  (select ended_by from public.events where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  '22222222-2222-2222-2222-222222222222'::uuid, 'ended_by è chi ha terminato per primo');
select is(
  (select count(*) from public.events where kind = 'breastfeeding')::int, 1,
  'nessun evento duplicato');

-- Cambio lato -------------------------------------------------------------------
select public.start_session('aaaaaaaa-0000-0000-0000-000000000003', (select baby_id from ctx),
  'breastfeeding', '{"side":"left"}');
select is(
  public.switch_breast_side('aaaaaaaa-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000004')
    #>> '{event,details,side}',
  'right', 'il cambio lato avvia l''altro seno');
select is(
  (select count(*) from public.events where kind = 'breastfeeding' and ended_at is null)::int, 1,
  'dopo il cambio lato c''è una sola sessione attiva');

-- Eventi generici --------------------------------------------------------------
select public.upsert_event(jsonb_build_object(
  'id', 'cccccccc-0000-0000-0000-000000000001', 'baby_id', (select baby_id from ctx),
  'kind', 'diaper', 'details', jsonb_build_object('type', 'mixed', 'stool_color', 'yellow')));
select public.upsert_event(jsonb_build_object(
  'id', 'cccccccc-0000-0000-0000-000000000001', 'baby_id', (select baby_id from ctx),
  'kind', 'diaper', 'details', jsonb_build_object('type', 'dirty', 'stool_color', 'green')));
select is(
  (select count(*) from public.events where kind = 'diaper')::int, 1, 'upsert idempotente');
select is(
  (select stool_color::text from public.diaper_events), 'green', 'upsert aggiorna il dettaglio');

select is(
  jsonb_array_length(public.upsert_event(jsonb_build_object(
    'id', 'cccccccc-0000-0000-0000-000000000002', 'baby_id', (select baby_id from ctx),
    'kind', 'measurement', 'details', jsonb_build_object('items', jsonb_build_array(
      jsonb_build_object('metric', 'weight', 'value', 6.2, 'unit', 'kg'),
      jsonb_build_object('metric', 'length', 'value', 61, 'unit', 'cm')
    )))) #> '{details,items}'),
  2, 'una misurazione può registrare più metriche');

select pg_temp.login('22222222-2222-2222-2222-222222222222');
select isnt(
  public.delete_event('cccccccc-0000-0000-0000-000000000001') ->> 'deleted_at', null,
  'un member può eliminare (soft delete) un evento');

-- Estraneo ----------------------------------------------------------------------------
select pg_temp.login('33333333-3333-3333-3333-333333333333');
select is((select count(*) from public.events)::int, 0, 'l''estraneo non vede eventi');
select throws_ok(
  format($q$select public.upsert_event(jsonb_build_object('id', gen_random_uuid(), 'baby_id', %L,
    'kind', 'diaper', 'details', '{"type":"wet"}'::jsonb))$q$, (select baby_id from ctx)),
  '42501', null, 'l''estraneo non può creare eventi');

-- Membri ----------------------------------------------------------------------------
select pg_temp.login('22222222-2222-2222-2222-222222222222');
delete from public.baby_members where user_id = '11111111-1111-1111-1111-111111111111';
select pg_temp.login('11111111-1111-1111-1111-111111111111');
select is((select count(*) from public.baby_members)::int, 2, 'un member non può rimuovere l''owner');

select * from finish();
rollback;
