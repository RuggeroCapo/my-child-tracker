# Diario del bebè — backend Alexa (uso personale)

Backend AWS Lambda per la skill Alexa già creata su developer.amazon.com
("Start from Scratch", hosting "Provision your own"). Registra a voce eventi
di allattamento e cambio pannolino direttamente su Supabase, per il bambino e
l'utente fissi configurati nelle variabili d'ambiente. Nessun account-linking,
nessuna pubblicazione della skill: pensata per uso privato su un solo device
Echo.

## File

- `index.js` — handler Lambda (Node.js, nessuna dipendenza esterna: usa il
  `fetch` globale disponibile nei runtime Node.js 18+).
- `interaction-model.json` — modello di interazione it-IT da incollare nel
  JSON Editor della console Alexa (tab "Build").
- `smoke-test.js` — test locale con `fetch` mockato, utile solo in sviluppo
  (non va deployato).

## 1. Recuperare il BABY_ID

Nel progetto Supabase → **Table Editor** → tabella `babies`, copia l'`id`
(uuid) del bambino da tracciare. Servirà come variabile d'ambiente `BABY_ID`.

## 2. Creare la funzione Lambda

> **Regione AWS**: Alexa richiede che l'endpoint Lambda risieda in una delle
> regioni supportate in base alla lingua della skill. Per una skill **it-IT**
> usa **Europe (Ireland) — eu-west-1**. Crea la funzione in quella regione.

1. Vai su [AWS Lambda Console](https://console.aws.amazon.com/lambda/) →
   **Create function**.
2. **Author from scratch**, dai un nome (es. `diario-bebe-alexa`), runtime
   **Node.js 22.x** (o la LTS più recente disponibile), architettura
   `x86_64`.
3. Ruolo di esecuzione: va bene quello base che AWS crea automaticamente
   (`lambda-basic-execution`) — la funzione fa solo chiamate HTTPS in uscita,
   non tocca altri servizi AWS.
4. Dopo la creazione, apri il tab **Code**:
   - Poiché `index.js` non ha dipendenze, puoi incollarne il contenuto
     direttamente nell'editor inline di AWS (sostituendo il file
     `index.js` generato di default), oppure caricare uno zip contenente solo
     `index.js`.
   - **Handler**: lascia `index.handler` (default).
5. Tab **Configuration → Environment variables** → **Edit** → aggiungi:
   - `SUPABASE_URL` = URL del progetto Supabase (es. `https://xxxx.supabase.co`)
   - `SUPABASE_SERVICE_KEY` = la **service_role key** (Supabase → Settings →
     API → *Project API keys*). **Non è la anon key**: bypassa la RLS, non va
     mai esposta lato client.
   - `BABY_ID` = l'uuid recuperato al passo 1.
6. Tab **Configuration → Triggers** → **Add trigger** → seleziona
   **Alexa Skills Kit** → incolla lo **Skill ID** della skill (lo trovi nella
   console Alexa, tab **Endpoint**, oppure nell'URL della skill) → lascia
   "Skill ID verification" abilitata → **Add**.
7. Copia l'**ARN** della funzione (in alto a destra nella pagina Lambda,
   formato `arn:aws:lambda:eu-west-1:...:function:diario-bebe-alexa`).

## 3. Configurare la skill Alexa

1. Nella [console Alexa Developer](https://developer.amazon.com/alexa/console/ask),
   apri la skill → tab **Build** → **Interaction Model → JSON Editor**.
2. Sostituisci il contenuto con quello di `interaction-model.json` (puoi
   cambiare `invocationName` se preferisci un nome di invocazione diverso da
   "diario del bebè").
3. **Save Model** → **Build Model** (attendi il completamento).
4. Tab **Endpoint**:
   - Seleziona **AWS Lambda ARN**.
   - Incolla l'ARN copiato al passo 2.7 nel campo "Default Region".
   - **Save Endpoints**.

## 4. Test

- Tab **Test** della console Alexa: abilita i test in modalità
  **Development**, poi prova (testo o voce):
  - "apri diario del bebè"
  - "avvia allattamento a sinistra"
  - "termina allattamento"
  - "registra pannolino bagnato"
- Verifica su Supabase (Table Editor → `events` e le tabelle figlie) che gli
  eventi vengano scritti correttamente.
- Su un device Echo reale: se sei loggato con lo stesso account Amazon che ha
  creato la skill, questa è già disponibile in modalità development senza
  bisogno di pubblicarla — basta dire "Alexa, apri diario del bebè".

## Comportamento degli intent

| Intent | Comportamento |
|---|---|
| `AvviaAllattamentoIntent` | Se lo slot `lato` non viene riconosciuto, Alexa chiede "A sinistra o a destra?" tenendo la sessione aperta; rispondi semplicemente "sinistra" o "destra". Se un allattamento è già in corso, lo segnala invece di crearne uno duplicato (gestito da `start_session`, idempotente). |
| `TerminaAllattamentoIntent` | Cerca la sessione di allattamento attiva (`ended_at is null`) per `BABY_ID` e la termina, annunciando la durata in minuti. Se non c'è nessuna sessione attiva lo dice esplicitamente. |
| `RegistraPannolinoIntent` | Se lo slot `tipo` non viene riconosciuto, Alexa chiede "Bagnato, sporco o misto?". Altrimenti registra subito l'evento istantaneo. |

Qualsiasi errore di rete o risposta di errore da Supabase viene intercettato
e restituisce la risposta vocale di fallback "Non sono riuscito a registrare
l'evento. Riprova tra poco." (i dettagli dell'errore finiscono nei log
CloudWatch della funzione, utili per il debug).

## Troubleshooting

- **"There was a problem with the requested skill's response"**: controlla i
  log in CloudWatch (Lambda → tab **Monitor** → **View CloudWatch logs**).
- **Errore 401/403 dalla RPC**: la `SUPABASE_SERVICE_KEY` è sbagliata o è
  stata usata la anon key invece della service_role key.
- **Errore 404 dalla RPC**: nome funzione sbagliato o migrazioni non ancora
  applicate al progetto Supabase collegato.
- **"Non c'è nessun allattamento in corso" ma pensavi ce ne fosse uno**:
  verifica che `BABY_ID` combaci con quello usato dall'app web (un mismatch
  fa cercare la sessione sul bambino sbagliato).
- **La skill non risponde affatto dal device Echo**: verifica che il trigger
  Lambda abbia lo Skill ID corretto e che l'endpoint nella tab Alexa
  **Endpoint** punti all'ARN giusto (incluse eventuali versioni/alias).
