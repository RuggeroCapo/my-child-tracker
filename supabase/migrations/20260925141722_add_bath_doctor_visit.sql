-- =============================================================================
-- Aggiunge i tipi evento 'bath' (bagnetto) e 'doctor_visit' (visita medica),
-- necessari per importare lo storico da un altro tracker.
--
-- I nuovi valori enum vanno in una migrazione a sé: Postgres non permette di
-- usarli (es. in un CHECK) nella stessa transazione in cui vengono aggiunti.
-- Il seguito è in 20260925141754_bath_doctor_visit_schema.sql.
-- =============================================================================

alter type public.event_kind add value 'bath';
alter type public.event_kind add value 'doctor_visit';
