export interface RpcError {
  code?: string
  message: string
  details?: string | null
  hint?: string | null
}

/**
 * Errore temporaneo (rete assente, server non raggiungibile, token scaduto):
 * l'operazione resta in coda e viene ritentata. Gli altri errori (vincoli,
 * permessi, dati non validi) sono definitivi.
 */
export function isTransientError(error: RpcError | null | undefined, status?: number): boolean {
  if (!error) return false
  if (status === 0 || status === undefined) return true
  if (status >= 500 || status === 408 || status === 429) return true
  if (status === 401 || error.code === 'PGRST301' || error.code === 'PGRST303') return true
  // Nessun codice SQLSTATE/PostgREST: errore di rete (fetch fallita).
  if (!error.code) return true
  // Serializzazione / deadlock / timeout.
  return ['40001', '40P01', '57014', '53300'].includes(error.code)
}

const MESSAGES: Record<string, string> = {
  invite_not_found: 'Invito non trovato. Controlla il codice.',
  invite_used: 'Questo invito è già stato utilizzato.',
  invite_expired: 'Questo invito è scaduto. Chiedine uno nuovo.',
  event_in_future: "L'orario non può essere nel futuro.",
  birth_date_in_future: 'La data di nascita non può essere nel futuro.',
  event_not_found: "L'evento non esiste più.",
  not_authenticated: 'Sessione scaduta: accedi di nuovo.',
}

export function friendlyError(error: RpcError | null | undefined): string {
  if (!error) return 'Si è verificato un errore.'
  if (MESSAGES[error.message]) return MESSAGES[error.message]
  if (error.code === '42501') return 'Non hai i permessi per questa operazione.'
  if (error.code === '23514' || error.code === '22023' || error.code === '22P02') return 'Dati non validi.'
  if (!error.code) return 'Connessione assente. Riprova.'
  return 'Si è verificato un errore. Riprova.'
}
