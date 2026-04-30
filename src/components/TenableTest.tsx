import { useEffect, useState } from 'react'
import { getAssets, type TenableAssetsResponse } from '../lib/tenable'
import type { TenableCredentials } from '../App'

interface Props {
  credentials: TenableCredentials
}

type Status = 'loading' | 'success' | 'error'

export function TenableTest({ credentials }: Props) {
  const [status, setStatus] = useState<Status>('loading')
  const [data, setData] = useState<TenableAssetsResponse | null>(null)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    getAssets(credentials, { limit: 5 })
      .then((res) => {
        setData(res)
        setStatus('success')
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err))
        setStatus('error')
      })
  }, [])

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: '#0D1E2E' }}>
      <div
        className="mx-auto max-w-3xl rounded-xl border p-6"
        style={{ backgroundColor: '#0F2235', borderColor: '#1B3A5C' }}
      >
        <h2 className="mb-1 text-lg font-semibold" style={{ color: '#E2EDF8' }}>
          Tenable Connection Test
        </h2>
        <p className="mb-6 text-sm" style={{ color: '#7B9DBF' }}>
          Llamada a <code className="rounded px-1 py-0.5 text-xs" style={{ backgroundColor: '#091829', color: '#7ECEFF' }}>/assets?limit=5</code>
        </p>

        {status === 'loading' && (
          <div className="flex items-center gap-3" style={{ color: '#7B9DBF' }}>
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span className="text-sm">Conectando con Tenable…</span>
          </div>
        )}

        {status === 'error' && (
          <div
            className="rounded-lg border p-4"
            style={{ backgroundColor: '#2A1010', borderColor: '#7B2020' }}
          >
            <div className="mb-2 flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="#F4A0A0" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#F4A0A0' }}>Error de conexión</span>
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs" style={{ color: '#F4A0A0' }}>
              {error}
            </pre>
          </div>
        )}

        {status === 'success' && data && (
          <div className="flex flex-col gap-4">
            <div
              className="flex items-center gap-2 rounded-lg border p-3"
              style={{ backgroundColor: '#0A2010', borderColor: '#1B5E2A' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 shrink-0" stroke="#6FCF8E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-sm font-semibold" style={{ color: '#6FCF8E' }}>
                Conexión exitosa — {data.total.toLocaleString()} assets en total
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: '#7B9DBF' }}>
                Primeros {data.assets.length} assets recibidos
              </p>
              <div className="flex flex-col gap-2">
                {data.assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-lg border px-4 py-3 text-sm"
                    style={{ backgroundColor: '#091829', borderColor: '#1B3A5C' }}
                  >
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="font-mono text-xs" style={{ color: '#7ECEFF' }}>
                        {asset.ipv4[0] ?? asset.ipv6[0] ?? '—'}
                      </span>
                      <span style={{ color: '#E2EDF8' }}>
                        {asset.fqdn[0] ?? asset.hostname[0] ?? asset.id}
                      </span>
                      {asset.operating_system[0] && (
                        <span className="text-xs" style={{ color: '#7B9DBF' }}>
                          {asset.operating_system[0]}
                        </span>
                      )}
                      <span className="ml-auto text-xs" style={{ color: '#4A6A8A' }}>
                        last seen {new Date(asset.last_seen).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <details className="rounded-lg border" style={{ borderColor: '#1B3A5C' }}>
              <summary
                className="cursor-pointer px-4 py-2 text-xs font-medium uppercase tracking-wider"
                style={{ color: '#7B9DBF' }}
              >
                Raw JSON
              </summary>
              <pre
                className="overflow-x-auto p-4 text-xs"
                style={{ color: '#7ECEFF', backgroundColor: '#091829' }}
              >
                {JSON.stringify(data, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}
