// Calls go through the Supabase Edge Function to avoid CORS and keep API keys server-side.
// Strip any trailing path (e.g. /rest/v1/) so the functions URL is always correct.
const _supabaseBase = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/(rest\/v1\/?)?$/, '')
const PROXY_URL = `${_supabaseBase}/functions/v1/tenable-proxy`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export interface TenableCredentials {
  accessKey: string
  secretKey: string
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TenableAsset {
  id: string
  fqdn: string[]
  ipv4: string[]
  ipv6: string[]
  mac_address: string[]
  hostname: string[]
  operating_system: string[]
  agent_name: string[]
  last_seen: string
  last_scan_time: string | null
  sources: { name: string; first_seen: string; last_seen: string }[]
}

export interface TenableAssetsResponse {
  assets: TenableAsset[]
  total: number
}

export interface TenableVulnerability {
  plugin_id: number
  plugin_name: string
  plugin_family: string
  severity: number        // 0 info · 1 low · 2 medium · 3 high · 4 critical
  severity_name: 'info' | 'low' | 'medium' | 'high' | 'critical'
  count: number
  vpr_score: number | null
  cvss_base_score: number | null
  first_found: string
  last_found: string
}

export interface TenableVulnerabilitiesResponse {
  vulnerabilities: TenableVulnerability[]
  total: number
}

export interface TenableScan {
  id: number
  uuid: string
  name: string
  status: string
  enabled: boolean
  creation_date: number
  last_modification_date: number
  starttime: string | null
  timezone: string | null
  type: string
}

export interface TenableScansResponse {
  scans: TenableScan[] | null
  timestamp: number
}

export interface TenableError {
  statusCode: number
  message: string
}

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function tenableFetch<T>(
  credentials: TenableCredentials,
  endpoint: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  console.log('[tenableFetch] POST →', PROXY_URL)
  console.log('[tenableFetch] ANON_KEY (first 20):', ANON_KEY ? ANON_KEY.slice(0, 20) + '…' : '(empty/undefined)')
  const response = await fetch(PROXY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': ANON_KEY,
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      endpoint,
      method: options.method ?? 'GET',
      body: options.body,
      accessKey: credentials.accessKey,
      secretKey: credentials.secretKey,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    const message = (data as { error?: string })?.error ?? `Proxy error ${response.status}`
    const error = new Error(message) as Error & { statusCode: number }
    error.statusCode = response.status
    throw error
  }

  return data as T
}

// ---------------------------------------------------------------------------
// 1. Assets
// ---------------------------------------------------------------------------

export interface GetAssetsOptions {
  /** Maximum number of assets to return (default: 100, max: 5000). */
  limit?: number
  /** Offset for pagination. */
  offset?: number
}

/**
 * Returns the list of assets tracked by Tenable VM.
 * Endpoint: GET /assets
 */
export async function getAssets(
  credentials: TenableCredentials,
  options: GetAssetsOptions = {},
): Promise<TenableAssetsResponse> {
  const params = new URLSearchParams()
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.offset !== undefined) params.set('offset', String(options.offset))

  const query = params.size > 0 ? `?${params}` : ''
  return tenableFetch<TenableAssetsResponse>(credentials, `/assets${query}`)
}

// ---------------------------------------------------------------------------
// 2. Vulnerabilities by asset
// ---------------------------------------------------------------------------

export interface GetVulnerabilitiesByAssetOptions {
  /** Minimum severity to include: 0 info, 1 low, 2 medium, 3 high, 4 critical. */
  minSeverity?: 0 | 1 | 2 | 3 | 4
  /** Maximum number of results (default: 100). */
  limit?: number
  /** Offset for pagination. */
  offset?: number
}

/**
 * Returns the list of vulnerabilities detected on a specific asset.
 * Endpoint: GET /workbenches/assets/{asset_id}/vulnerabilities/info
 */
export async function getVulnerabilitiesByAsset(
  credentials: TenableCredentials,
  assetId: string,
  options: GetVulnerabilitiesByAssetOptions = {},
): Promise<TenableVulnerabilitiesResponse> {
  const params = new URLSearchParams()
  if (options.minSeverity !== undefined)
    params.set('filter.0.filter', 'severity')
  if (options.minSeverity !== undefined)
    params.set('filter.0.quality', 'gte')
  if (options.minSeverity !== undefined)
    params.set('filter.0.value', String(options.minSeverity))
  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.offset !== undefined) params.set('offset', String(options.offset))

  const query = params.size > 0 ? `?${params}` : ''
  return tenableFetch<TenableVulnerabilitiesResponse>(
    credentials,
    `/workbenches/assets/${assetId}/vulnerabilities/info${query}`,
  )
}

// ---------------------------------------------------------------------------
// 3. Scan summary
// ---------------------------------------------------------------------------

export interface GetScansOptions {
  /** Unix timestamp — only return scans modified after this date. */
  lastModificationDate?: number
  /** Filter by folder id. */
  folderId?: number
}

/**
 * Returns the list of scans with their current status.
 * Endpoint: GET /scans
 */
export async function getScans(
  credentials: TenableCredentials,
  options: GetScansOptions = {},
): Promise<TenableScansResponse> {
  const params = new URLSearchParams()
  if (options.lastModificationDate !== undefined)
    params.set('last_modification_date', String(options.lastModificationDate))
  if (options.folderId !== undefined)
    params.set('folder_id', String(options.folderId))

  const query = params.size > 0 ? `?${params}` : ''
  return tenableFetch<TenableScansResponse>(credentials, `/scans${query}`)
}
