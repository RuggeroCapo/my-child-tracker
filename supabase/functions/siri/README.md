# Siri / Comandi Rapidi

Endpoint per avviare e terminare l'allattamento (e registrare un pannolino) a
voce con Siri, tramite l'app Comandi di iOS.

## 1. Deploy

```bash
# token lungo casuale, es.: openssl rand -hex 32
npx supabase secrets set SIRI_TOKEN=<token> ALEXA_TOKEN=<altro token> BABY_ID=<uuid da tabella babies>
npx supabase functions deploy siri --no-verify-jwt
```

URL: `https://<ref>.supabase.co/functions/v1/siri`

Per revocare l'accesso basta cambiare il secret. `ALEXA_TOKEN` è separato da
`SIRI_TOKEN` perché viaggia nell'URL (e quindi nei log): imposta solo quelli che usi.

## 2. Comandi Rapidi

Crea un comando per ognuno, con queste azioni:

1. **Ottieni contenuto dell'URL**
   - URL: `https://<ref>.supabase.co/functions/v1/siri?action=start&side=left`
   - Metodo: `POST`
   - Intestazioni: `Authorization` = `Bearer <token>`
2. **Ottieni valore del dizionario** → chiave `message`
3. **Pronuncia testo** (il risultato del passo 2)

| Nome del comando (frase per Siri) | Query string |
| --- | --- |
| Allattamento sinistra | `?action=start&side=left` |
| Allattamento destra | `?action=start&side=right` |
| Fine allattamento | `?action=stop` |
| Pannolino bagnato / sporco / misto | `?action=diaper&type=wet` / `dirty` / `mixed` |

Poi: "Ehi Siri, allattamento sinistra". Funziona anche da Apple Watch,
HomePod, tasto Azione e widget in Home.

Prova rapida da terminale:

```bash
curl -X POST -H "Authorization: Bearer <token>" \
  "https://<ref>.supabase.co/functions/v1/siri?action=stop"
```

## Alexa (Virtual Smart Home)

Le skill di [Virtual Smart Home](https://www.virtualsmarthome.xyz/) aprono un
URL quando un dispositivo virtuale o una routine viene attivata. Usa la
variante con token in query (GET):

```
https://<ref>.supabase.co/functions/v1/siri?action=start&side=left&token=<ALEXA_TOKEN>
```

Un URL (e quindi un interruttore/routine) per azione: `start&side=left`,
`start&side=right`, `stop`, `diaper&type=wet|dirty|mixed`. Poi, ad esempio,
"Alexa, accendi allattamento sinistra". Non ho verificato come la skill
gestisca il testo della risposta: l'azione viene comunque registrata.
