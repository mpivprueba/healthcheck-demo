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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed. Use POST.' }, 405)
  }

  // Parse request body
  let endpoint: string
  let method: string
  let body: unknown

  try {
    const payload = await req.json()
    endpoint = payload.endpoint
    method = (payload.method ?? 'GET').toUpperCase()
    body = payload.body ?? undefined
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400)
  }

  // Validate endpoint
  if (!endpoint || typeof endpoint !== 'string') {
    return json({ error: "Missing required parameter: 'endpoint'." }, 400)
  }
  if (!endpoint.startsWith('/')) {
    return json({ error: "'endpoint' must start with '/' (e.g. \"/assets\")." }, 400)
  }
  // Prevent SSRF — reject anything that tries to escape the path
  if (endpoint.includes('://') || endpoint.includes('..')) {
    return json({ error: 'Invalid endpoint.' }, 400)
  }

  // Read Tenable credentials from environment
  const accessKey = Deno.env.get('TENABLE_ACCESS_KEY')
  const secretKey = Deno.env.get('TENABLE_SECRET_KEY')

  if (!accessKey || !secretKey) {
    console.error('Tenable API keys not configured in Edge Function secrets.')
    return json({ error: 'Proxy not configured: missing API keys.' }, 500)
  }

  // Forward request to Tenable
  let tenableResponse: Response
  try {
    tenableResponse = await fetch(`${TENABLE_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'X-ApiKeys': `accessKey=${accessKey};secretKey=${secretKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch (err) {
    console.error('Failed to reach Tenable:', err)
    return json({ error: 'Could not connect to Tenable API.' }, 502)
  }

  // Parse Tenable response
  let responseData: unknown
  const contentType = tenableResponse.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      responseData = await tenableResponse.json()
    } catch {
      responseData = { raw: await tenableResponse.text() }
    }
  } else {
    responseData = { raw: await tenableResponse.text() }
  }

  return json(responseData, tenableResponse.status)
})
