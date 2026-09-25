'use strict';

process.env.SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.BABY_ID = '11111111-1111-1111-1111-111111111111';

// Mock fetch to simulate Supabase REST/RPC responses without any network call.
global.fetch = async (url, opts = {}) => {
  const u = String(url);

  if (u.includes('/rpc/start_session')) {
    const body = JSON.parse(opts.body);
    return jsonResponse(200, {
      status: 'created',
      event: { id: body.p_id, details: { side: body.p_details.side } },
    });
  }

  if (u.includes('/rpc/end_session')) {
    return jsonResponse(200, {
      status: 'ended',
      event: {
        id: 'evt-1',
        started_at: '2026-09-25T10:00:00.000Z',
        ended_at: '2026-09-25T10:12:30.000Z',
      },
    });
  }

  if (u.includes('/rpc/upsert_event')) {
    const body = JSON.parse(opts.body);
    return jsonResponse(200, { id: body.p_event.id, kind: 'diaper' });
  }

  if (u.includes('/rest/v1/events') && u.includes('kind=eq.breastfeeding')) {
    return jsonResponse(200, [{ id: 'active-session-id' }]);
  }

  throw new Error(`Unhandled mock URL: ${u}`);
};

function jsonResponse(status, data) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(data),
    json: async () => data,
  };
}

const { handler } = require('./index.js');

function intentRequest(name, slots = {}) {
  return {
    request: {
      type: 'IntentRequest',
      intent: { name, slots },
    },
  };
}

async function main() {
  const cases = [
    ['LaunchRequest', { request: { type: 'LaunchRequest' } }],
    [
      'AvviaAllattamentoIntent (con slot lato=sinistra via value)',
      intentRequest('AvviaAllattamentoIntent', { lato: { name: 'lato', value: 'sinistra' } }),
    ],
    [
      'AvviaAllattamentoIntent (con resolution ER_SUCCESS_MATCH id=right)',
      intentRequest('AvviaAllattamentoIntent', {
        lato: {
          name: 'lato',
          value: 'destra',
          resolutions: {
            resolutionsPerAuthority: [
              { status: { code: 'ER_SUCCESS_MATCH' }, values: [{ value: { id: 'right', name: 'destra' } }] },
            ],
          },
        },
      }),
    ],
    [
      'AvviaAllattamentoIntent (slot mancante -> elicitation)',
      intentRequest('AvviaAllattamentoIntent', {}),
    ],
    ['TerminaAllattamentoIntent', intentRequest('TerminaAllattamentoIntent', {})],
    [
      'RegistraPannolinoIntent (tipo=bagnato)',
      intentRequest('RegistraPannolinoIntent', { tipo: { name: 'tipo', value: 'bagnato' } }),
    ],
    ['AMAZON.HelpIntent', intentRequest('AMAZON.HelpIntent', {})],
    ['AMAZON.StopIntent', intentRequest('AMAZON.StopIntent', {})],
    ['SessionEndedRequest', { request: { type: 'SessionEndedRequest' } }],
  ];

  for (const [label, event] of cases) {
    const result = await handler(event);
    console.log(`--- ${label} ---`);
    console.log(JSON.stringify(result, null, 2));
  }
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED', err);
  process.exit(1);
});
