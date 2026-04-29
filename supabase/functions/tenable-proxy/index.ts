import '@supabase/functions-js/edge-runtime.d.ts'

const TENABLE_BASE_URL = 'https://cloud.tenable.com'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405)
  }

  // ---------------------------------------------------------------------------
  // Parse and validate body
  // ---------------------------------------------------------------------------

  let accessKey: string
  let secretKey: string
  let endpoint: string
  let method: string
  let body: unknown

  try {
    const payload = await req.json()
    accessKey = payload.accessKey
    secretKey = payload.secretKey
    endpoint = payload.endpoint
    method = (payload.method ?? 'GET').toUpperCase()
    body = payload.body ?? undefined
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  // Credentials
  if (!accessKey || typeof accessKey !== 'string' || accessKey.trim() === '') {
    return json({ error: "Missing required parameter: 'accessKey'." }, 400)
  }
  if (!secretKey || typeof secretKey !== 'string' || secretKey.trim() === '') {
    return json({ error: "Missing required parameter: 'secretKey'." }, 400)
  }

  // Endpoint — must be a relative path, no SSRF vectors
  if (!endpoint || typeof endpoint !== 'string') {
    return json({ error: "Missing required parameter: 'endpoint'." }, 400)
  }
  if (!endpoint.startsWith('/')) {
    return json({ error: "'endpoint' must start with '/' (e.g. \"/assets\")." }, 400)
  }
  if (endpoint.includes('://') || endpoint.includes('..')) {
    return json({ error: 'Invalid endpoint.' }, 400)
  }

  // Method allow-list
  const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  if (!ALLOWED_METHODS.includes(method)) {
    return json({ error: `Method '${method}' is not allowed.` }, 400)
  }

  // ---------------------------------------------------------------------------
  // Forward to Tenable
  // ---------------------------------------------------------------------------

  let tenableResponse: Response
  try {
    tenableResponse = await fetch(`${TENABLE_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'X-ApiKeys': `accessKey=${accessKey.trim()};secretKey=${secretKey.trim()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    console.error('Network error reaching Tenable:', err)
    return json({ error: 'Could not connect to Tenable API. Check your network connectivity.' }, 502)
  }

  // ---------------------------------------------------------------------------
  // Parse Tenable response
  // ---------------------------------------------------------------------------

  const contentType = tenableResponse.headers.get('content-type') ?? ''
  let responseData: unknown

  if (contentType.includes('application/json')) {
    try {
      responseData = await tenableResponse.json()
    } catch {
      responseData = { error: 'Tenable returned malformed JSON.', status: tenableResponse.status }
    }
  } else {
    // Non-JSON response (e.g. 401 HTML page from Tenable)
    const text = await tenableResponse.text()
    responseData = tenableResponse.ok
      ? { raw: text }
      : { error: `Tenable returned an unexpected response (${tenableResponse.status}).`, raw: text }
  }

  // Translate common Tenable HTTP status codes into readable error messages
  if (!tenableResponse.ok) {
    const status = tenableResponse.status
    const detail =
      status === 401
        ? 'Invalid credentials. Verify the Access Key and Secret Key.'
        : status === 403
          ? 'Access denied. The API keys do not have permission for this endpoint.'
          : status === 404
            ? 'Endpoint not found in the Tenable API.'
            : status === 429
              ? 'Rate limit exceeded. Wait a moment and try again.'
              : status >= 500
                ? 'Tenable API returned a server error. Try again later.'
                : null

    if (detail) {
      return json({ error: detail, upstream: responseData }, status)
    }
  }

  return json(responseData, tenableResponse.status)
})
