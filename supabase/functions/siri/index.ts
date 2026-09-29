// Endpoint per i Comandi Rapidi di iOS (Siri): avvia/termina l'allattamento e
// registra un pannolino. Uso personale: scrive sempre sullo stesso bambino.
//
// Autenticazione (token lunghi e casuali, revocabili cambiando il secret; la
// service_role key resta sul server):
//  - Siri/Comandi Rapidi: header `Authorization: Bearer <SIRI_TOKEN>`
//  - Alexa (Virtual Smart Home, che apre solo URL): `?token=<ALEXA_TOKEN>`.
//    Il token finisce in URL e log, per questo è separato da SIRI_TOKEN.
//
// Secret (`supabase secrets set`): BABY_ID e almeno uno tra SIRI_TOKEN e
// ALEXA_TOKEN. SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono già iniettati.
//
//   /siri?action=start&side=left|right
//   /siri?action=stop
//   /siri?action=diaper&type=wet|dirty|mixed
//
// Accetta POST (header Bearer) o GET/POST (token in query).
//
// Risponde sempre con JSON { ok, message }: `message` è pensato per essere
// letto da Siri con l'azione "Pronuncia testo".

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SIRI_TOKEN = Deno.env.get('SIRI_TOKEN')
const ALEXA_TOKEN = Deno.env.get('ALEXA_TOKEN')
const BABY_ID = Deno.env.get('BABY_ID')

const SIDES: Record<string, 'left' | 'right'> = {
  left: 'left',
  sinistra: 'left',
  right: 'right',
  destra: 'right',
}
const SIDE_LABELS = { left: 'sinistra', right: 'destra' }
const DIAPERS: Record<string, 'wet' | 'dirty' | 'mixed'> = {
  wet: 'wet',
  bagnato: 'wet',
  dirty: 'dirty',
  sporco: 'dirty',
  mixed: 'mixed',
  misto: 'mixed',
}
const DIAPER_LABELS = { wet: 'bagnato', dirty: 'sporco', mixed: 'misto' }

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

function reply(status: number, ok: boolean, message: string) {
  return new Response(JSON.stringify({ ok, message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function safeEqual(a: string, b: string) {
  const enc = new TextEncoder()
  const x = enc.encode(a)
  const y = enc.encode(b)
  let diff = x.length ^ y.length
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0)
  return diff === 0
}

async function rpc(fn: string, payload: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(`RPC ${fn} fallita (${res.status}): ${JSON.stringify(data)}`)
  return data
}

async function activeSessionId(): Promise<string | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/events?baby_id=eq.${BABY_ID}` +
    `&kind=eq.breastfeeding&ended_at=is.null&deleted_at=is.null&select=id`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`Lettura sessione attiva fallita (${res.status})`)
  const rows = await res.json()
  return rows[0]?.id ?? null
}

async function start(side: string | null) {
  const s = side ? SIDES[side.toLowerCase()] : undefined
  if (!s) return reply(400, false, 'Lato non valido: usa sinistra o destra.')
  const result = await rpc('start_session', {
    p_id: crypto.randomUUID(),
    p_baby_id: BABY_ID,
    p_kind: 'breastfeeding',
    p_details: { side: s },
  })
  if (result.status === 'already_active') {
    const active = SIDE_LABELS[result.event?.details?.side as 'left' | 'right']
    return reply(200, true, `C'è già un allattamento in corso${active ? ` dal lato ${active}` : ''}.`)
  }
  return reply(200, true, `Allattamento avviato a ${SIDE_LABELS[s]}.`)
}

async function stop() {
  const id = await activeSessionId()
  if (!id) return reply(200, true, "Non c'è nessun allattamento in corso.")
  const result = await rpc('end_session', { p_id: id })
  if (result.status === 'already_ended') return reply(200, true, "L'allattamento era già terminato.")
  const ms = new Date(result.event.ended_at).getTime() - new Date(result.event.started_at).getTime()
  const min = Math.max(0, Math.round(ms / 60000))
  return reply(200, true, `Allattamento terminato dopo ${min === 1 ? '1 minuto' : `${min} minuti`}.`)
}

async function diaper(type: string | null) {
  const t = type ? DIAPERS[type.toLowerCase()] : undefined
  if (!t) return reply(400, false, 'Tipo non valido: usa bagnato, sporco o misto.')
  await rpc('upsert_event', {
    p_event: { id: crypto.randomUUID(), baby_id: BABY_ID, kind: 'diaper', details: { type: t } },
  })
  return reply(200, true, `Pannolino ${DIAPER_LABELS[t]} registrato.`)
}

Deno.serve(async (req) => {
  if (!BABY_ID || (!SIRI_TOKEN && !ALEXA_TOKEN)) {
    return reply(500, false, 'Configurazione mancante sul server.')
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return reply(405, false, 'Metodo non consentito.')
  }

  const params = new URL(req.url).searchParams
  const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer /, '')
  const queryToken = params.get('token') ?? ''
  const authorized =
    (req.method === 'POST' && !!SIRI_TOKEN && safeEqual(bearer, SIRI_TOKEN)) ||
    (!!ALEXA_TOKEN && safeEqual(queryToken, ALEXA_TOKEN))
  if (!authorized) return reply(401, false, 'Non autorizzato.')

  try {
    switch (params.get('action')) {
      case 'start':
        return await start(params.get('side'))
      case 'stop':
        return await stop()
      case 'diaper':
        return await diaper(params.get('type'))
      default:
        return reply(400, false, 'Azione non valida.')
    }
  } catch (err) {
    console.error('Errore siri:', err)
    return reply(500, false, 'Non sono riuscito a registrare. Riprova tra poco.')
  }
})
