const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

let supabasePromise
let sessionExpiredHandler

export function isExpiredSessionError(message) {
  return /jwt.{0,20}expir|expir.{0,20}jwt|invalid jwt|token is expired|invalid refresh token|refresh token.{0,30}(invalid|expired|not found)/i.test(message || '')
}

function isExpiredTokenResponse(response, body) {
  return [400, 401, 403].includes(response.status) && isExpiredSessionError(body)
}

async function supabaseFetch(input, init) {
  const response = await fetch(input, init)
  if (sessionExpiredHandler && [400, 401, 403].includes(response.status)) {
    const body = await response.clone().text()
    if (isExpiredTokenResponse(response, body)) {
      await sessionExpiredHandler()
      return new Response(JSON.stringify({
        message: 'Your session has expired. Please log in again.',
        code: 'session_expired',
        details: null,
        hint: null,
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }
  return response
}

export function onSessionExpired(handler) {
  sessionExpiredHandler = handler
  return () => {
    if (sessionExpiredHandler === handler) sessionExpiredHandler = undefined
  }
}

export function requireSupabase() {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY (or the equivalent NEXT_PUBLIC_* variables) to your .env file.',
    )
  }

  if (!supabasePromise) {
    supabasePromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(supabaseUrl, supabaseKey, {
          global: { fetch: supabaseFetch },
        }),
      )
      .catch((error) => {
        supabasePromise = undefined
        throw error
      })
  }

  return supabasePromise
}
