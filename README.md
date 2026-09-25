# Bebè — diario condiviso del neonato

PWA mobile-first per registrare in pochi tap allattamenti, pannolini, biberon, tiralatte, medicine, vaccinazioni e misurazioni, con **sincronizzazione in tempo reale** tra i dispositivi dei genitori e **funzionamento offline**.

Stack: React 19 · TypeScript · Vite · Tailwind CSS 4 · Zustand · Supabase (Auth, Postgres, RLS, Realtime) · vite-plugin-pwa.

## Funzionalità (MVP)

| Area | Cosa fa |
| --- | --- |
| Allattamento | Avvio in 2 tap (lato suggerito), timer condiviso, "cambia lato", termina da qualsiasi dispositivo, inserimento manuale |
| Pannolini | Bagnato / sporco / misto con un tocco; quantità, colore e note facoltativi; annulla |
| Biberon | Quantità con preset, tipo di latte, ultimo biberon, totale giornaliero |
| Tiralatte | Sinistro / destro / entrambi, timer o inserimento manuale, quantità, totali |
| Medicine | Registro modificabile (vitamine, farmaci) e storico somministrazioni. Nessun suggerimento di dosaggio |
| Vaccinazioni | Nome, dose, data, note; modifica ed eliminazione |
| Crescita | Peso, lunghezza, circonferenza cranica; grafico con curve percentili OMS 0–24 mesi per sesso |
| Diario | Cronologia con filtri, dettaglio, modifica ed eliminazione (con annulla) |
| Statistiche | Oggi / 7 / 30 giorni: sessioni, durate, lato S/D, pannolini, biberon, tiralatte, peso |
| Condivisione | Link d'invito monouso (7 giorni); ruoli owner / member |


## Avvio in locale

Requisiti: Node 20+, Docker (per Supabase locale)..

```bash
npm install
npx supabase start          # avvia Postgres, Auth, Realtime e applica le migrazioni
cp .env.example .env.local  # incolla API_URL e ANON_KEY stampati da `supabase start`
npm run dev                 # http://localhost:5173
```

In locale la conferma email è disattivata; le email (es. recupero password) sono visibili su Mailpit: http://127.0.0.1:54324.

### Script

| Comando | Descrizione |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + build di produzione con service worker |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Test unitari (Vitest): statistiche, percentili OMS, formattazione |
| `npx supabase test db` | Test pgTAP: RLS, inviti, concorrenza delle sessioni |
| `npm run test:e2e` | Playwright contro Supabase locale: due genitori in tempo reale, offline, tutte le funzionalità |
| `npm run db:types` | Rigenera `src/lib/database.types.ts` dallo schema locale |
| `node scripts/generate-icons.mjs` | Rigenera le icone PWA |

## Deploy

1. Crea un progetto su [supabase.com](https://supabase.com) e collega il repo: `npx supabase link --project-ref <ref>`.
2. Applica lo schema: `npx supabase db push`.
3. In **Authentication → URL Configuration** imposta *Site URL* sul dominio dell'app e aggiungi `https://<dominio>/**` ai *Redirect URLs* (link di conferma, recupero password, inviti).
4. Facoltativo: abilita Google in **Authentication → Providers** e imposta `VITE_ENABLE_GOOGLE_AUTH=true`.
5. Pubblica la cartella `dist/` su un hosting statico (Vercel, Netlify, Cloudflare Pages…) con le variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, configurando il fallback SPA verso `index.html`.

L'app deve essere servita in HTTPS per l'installazione come PWA (iOS: Condividi → *Aggiungi a Home*).

## Architettura

```
UI (React, un modulo per dominio in src/features)
  │ azioni ottimistiche
  ▼
Store Zustand ── events (specchio locale, IndexedDB)
              ── outbox (coda scritture offline, IndexedDB)
  │ sync engine (src/sync)
  ▼
Supabase: RPC transazionali ─ delta pull (updated_at) ─ Realtime (postgres_changes)
```

- **Il backend è la fonte autorevole.** Le scritture passano da RPC Postgres (`upsert_event`, `start_session`, `end_session`, `switch_breast_side`, `delete_event`…) eseguite con i permessi dell'utente (RLS). Evento e dettaglio vengono scritti nella stessa transazione.
- **Idempotenza.** Gli id sono UUID generati dal client: ripetere un'operazione dopo un errore di rete non crea duplicati.
- **Concorrenza.** Un indice unico parziale garantisce al massimo una sessione attiva per tipo e bambino. Un secondo "Avvia" restituisce la sessione esistente; un secondo "Termina" riceve `already_ended` (l'app mostra *Sessione già terminata · Terminata da …*).
- **Timer condiviso.** Il timer è `ora del server − started_at`; all'avvio l'app stima lo scarto tra orologio locale e server, così tutti i dispositivi mostrano lo stesso tempo.
- **Timestamp lato server.** Le azioni "adesso" usano `now()` del database; solo le operazioni rimaste in coda offline inviano l'orario registrato sul dispositivo.
- **Realtime senza polling.** Un solo canale per utente ascolta `events`, `babies`, `baby_members` e `medications`. Ogni notifica aggiorna subito la riga e avvia un delta pull che porta anche i dettagli; al ricollegamento del canale si recupera ciò che è stato perso.
- **Offline.** L'app parte dalla cache IndexedDB, registra gli eventi localmente e svuota la coda al ritorno online. Il service worker mette in cache la shell dell'app, non le API.
- **Eliminazioni.** Sono soft delete (`deleted_at`), così si propagano via Realtime e delta sync e possono essere annullate.

### Database

`profiles` · `babies` · `baby_members` (owner/member) · `baby_invites` · `medications` (registro) · `events` (supertipo) → `feeding_sessions`, `diaper_events`, `bottle_events`, `pumping_sessions`, `medication_events`, `vaccinations`, `measurements`.

Migrazioni in `supabase/migrations`, test in `supabase/tests`.

### Permessi

- **Membri** (owner e member): leggono, creano, modificano ed eliminano gli eventi del bambino.
- **Owner**: modifica ed elimina il profilo del bambino, crea inviti, rimuove i member.
- Un member può lasciare un profilo; nessun utente vede dati di bambini a cui non appartiene.

### Aggiungere un nuovo tipo di evento

1. Nuovo valore nell'enum `event_kind` e tabella di dettaglio (migrazione + policy + ramo in `write_event_details`/`event_json`).
2. Tipi in `src/domain/types.ts` e voce in `src/features/kinds.tsx`.
3. Form in `src/features/<tipo>/` registrato in `src/features/events/EventForm.tsx`.

## Curve di crescita

Standard di crescita OMS (2006), tabelle LMS mensili 0–24 mesi per peso, lunghezza e circonferenza cranica, distribuite da CDC/NCHS. Il percentile è mostrato come dato descrittivo e **non** costituisce una valutazione medica.

## Note

L'app non fornisce consigli medici e non modifica dosi: le informazioni registrate non sostituiscono il parere del pediatra.
