'use strict';

/**
 * Backend Lambda per la skill Alexa "Diario del bebè".
 *
 * Uso strettamente personale: scrive sempre sullo stesso bambino (BABY_ID)
 * usando la service_role key di Supabase, senza account-linking né OAuth.
 * Nessuna dipendenza esterna: usa il `fetch` globale di Node.js 18+.
 *
 * Variabili d'ambiente richieste:
 *  - SUPABASE_URL          URL del progetto Supabase (es. https://xxxx.supabase.co)
 *  - SUPABASE_SERVICE_KEY  service_role key (Supabase → Settings → API)
 *  - BABY_ID               uuid del bambino (tabella `babies`)
 */

const { randomUUID } = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const BABY_ID = process.env.BABY_ID;

const SIDE_LABELS = { left: 'sinistra', right: 'destra' };
const DIAPER_LABELS = { wet: 'bagnato', dirty: 'sporco', mixed: 'misto' };

// Mappe di fallback usate quando Alexa non restituisce una risoluzione slot
// (ER_SUCCESS_MATCH), ad es. in input testuali dal simulatore.
const LATO_FALLBACK = {
  sinistra: 'left',
  sinistro: 'left',
  left: 'left',
  destra: 'right',
  destro: 'right',
  right: 'right',
};

const TIPO_FALLBACK = {
  bagnato: 'wet',
  pipi: 'wet',
  wet: 'wet',
  sporco: 'dirty',
  cacca: 'dirty',
  dirty: 'dirty',
  misto: 'mixed',
  mixed: 'mixed',
};

// ---------------------------------------------------------------------------
// Helpers Supabase
// ---------------------------------------------------------------------------

function assertEnv() {
  const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'BABY_ID'].filter(
    (key) => !process.env[key],
  );
  if (missing.length > 0) {
    throw new Error(`Variabili d'ambiente mancanti: ${missing.join(', ')}`);
  }
}

async function callRpc(functionName, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    throw new Error(
      `RPC ${functionName} fallita (${res.status}): ${JSON.stringify(data)}`,
    );
  }

  return data;
}

async function getActiveBreastfeedingSessionId() {
  const url =
    `${SUPABASE_URL}/rest/v1/events` +
    `?baby_id=eq.${BABY_ID}&kind=eq.breastfeeding&ended_at=is.null&deleted_at=is.null&select=id`;

  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Lettura sessione attiva fallita (${res.status}): ${text}`);
  }

  const rows = await res.json();
  return rows.length > 0 ? rows[0].id : null;
}

// ---------------------------------------------------------------------------
// Helpers slot Alexa
// ---------------------------------------------------------------------------

function normalize(value) {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function resolveSlotId(slot) {
  const authorities = slot?.resolutions?.resolutionsPerAuthority;
  if (!Array.isArray(authorities)) return null;
  for (const authority of authorities) {
    if (authority?.status?.code === 'ER_SUCCESS_MATCH' && authority.values?.length) {
      return authority.values[0].value.id;
    }
  }
  return null;
}

function resolveLato(slot) {
  return resolveSlotId(slot) || LATO_FALLBACK[normalize(slot?.value)] || null;
}

function resolveTipo(slot) {
  return resolveSlotId(slot) || TIPO_FALLBACK[normalize(slot?.value)] || null;
}

// ---------------------------------------------------------------------------
// Helpers risposta Alexa
// ---------------------------------------------------------------------------

function say(speechText, { endSession = true, repromptText = null } = {}) {
  const response = {
    outputSpeech: { type: 'PlainText', text: speechText },
    shouldEndSession: endSession,
  };
  if (repromptText) {
    response.reprompt = { outputSpeech: { type: 'PlainText', text: repromptText } };
  }
  return { version: '1.0', response };
}

const FALLBACK_SPEECH = "Non sono riuscito a registrare l'evento. Riprova tra poco.";

// ---------------------------------------------------------------------------
// Intent handlers
// ---------------------------------------------------------------------------

async function handleAvviaAllattamento(intent) {
  const side = resolveLato(intent.slots?.lato);
  if (!side) {
    return say('A sinistra o a destra?', {
      endSession: false,
      repromptText: 'Dì sinistra o destra.',
    });
  }

  const result = await callRpc('start_session', {
    p_id: randomUUID(),
    p_baby_id: BABY_ID,
    p_kind: 'breastfeeding',
    p_details: { side },
  });

  if (result.status === 'already_active') {
    const activeSide = SIDE_LABELS[result.event?.details?.side] || '';
    return say(`C'è già un allattamento in corso${activeSide ? ` dal lato ${activeSide}` : ''}.`);
  }

  return say(`Allattamento avviato a ${SIDE_LABELS[side]}.`);
}

async function handleTerminaAllattamento() {
  const activeId = await getActiveBreastfeedingSessionId();
  if (!activeId) {
    return say('Non c\'è nessun allattamento in corso al momento.');
  }

  const result = await callRpc('end_session', { p_id: activeId });

  if (result.status === 'already_ended') {
    return say('L\'allattamento era già stato terminato.');
  }

  const startedAt = new Date(result.event.started_at).getTime();
  const endedAt = new Date(result.event.ended_at).getTime();
  const minutes = Math.max(0, Math.round((endedAt - startedAt) / 60000));
  const minutesText = minutes === 1 ? '1 minuto' : `${minutes} minuti`;

  return say(`Allattamento terminato dopo ${minutesText}.`);
}

async function handleRegistraPannolino(intent) {
  const type = resolveTipo(intent.slots?.tipo);
  if (!type) {
    return say('Bagnato, sporco o misto?', {
      endSession: false,
      repromptText: 'Dì bagnato, sporco o misto.',
    });
  }

  await callRpc('upsert_event', {
    p_event: {
      id: randomUUID(),
      baby_id: BABY_ID,
      kind: 'diaper',
      details: { type },
    },
  });

  return say(`Pannolino ${DIAPER_LABELS[type]} registrato.`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

exports.handler = async (event) => {
  try {
    assertEnv();

    const request = event.request;

    if (request.type === 'LaunchRequest') {
      return say(
        'Ciao! Puoi dire: avvia allattamento, termina allattamento, oppure registra pannolino.',
        { endSession: false, repromptText: 'Cosa vuoi registrare?' },
      );
    }

    if (request.type === 'SessionEndedRequest') {
      return { version: '1.0', response: {} };
    }

    if (request.type === 'IntentRequest') {
      const intent = request.intent;
      switch (intent.name) {
        case 'AvviaAllattamentoIntent':
          return await handleAvviaAllattamento(intent);
        case 'TerminaAllattamentoIntent':
          return await handleTerminaAllattamento();
        case 'RegistraPannolinoIntent':
          return await handleRegistraPannolino(intent);
        case 'AMAZON.HelpIntent':
          return say(
            'Puoi dire: avvia allattamento a sinistra o a destra, termina allattamento, oppure registra pannolino bagnato, sporco o misto.',
            { endSession: false, repromptText: 'Cosa vuoi fare?' },
          );
        case 'AMAZON.CancelIntent':
        case 'AMAZON.StopIntent':
          return say('A presto!');
        default:
          return say(
            'Non ho capito. Puoi dire avvia allattamento, termina allattamento o registra pannolino.',
            { endSession: false, repromptText: 'Cosa vuoi fare?' },
          );
      }
    }

    return say('Richiesta non supportata.');
  } catch (err) {
    console.error('Errore skill Diario del bebè:', err);
    return say(FALLBACK_SPEECH);
  }
};
