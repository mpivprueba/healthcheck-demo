import { useState } from 'react'

interface TenableCredentials {
  accessKey: string
  secretKey: string
}

interface TenableConnectProps {
  onConnect: (credentials: TenableCredentials) => void
}

export function TenableConnect({ onConnect }: TenableConnectProps) {
  const [accessKey, setAccessKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [error, setError] = useState('')

  function handleConnect() {
    if (!accessKey.trim() || !secretKey.trim()) {
      setError(
        !accessKey.trim() && !secretKey.trim()
          ? 'Ambos campos son requeridos.'
          : !accessKey.trim()
            ? 'El Access Key es requerido.'
            : 'El Secret Key es requerido.',
      )
      return
    }
    setError('')
    onConnect({ accessKey: accessKey.trim(), secretKey: secretKey.trim() })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConnect()
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: '#0D1E2E' }}
    >
      <div
        className="w-full max-w-md rounded-xl border p-8 shadow-2xl"
        style={{ backgroundColor: '#0F2235', borderColor: '#1B3A5C' }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: '#1B3A5C' }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6"
              stroke="#2E75B6"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: '#E2EDF8' }}>
              Conectar Tenable
            </h1>
            <p className="mt-1 text-sm" style={{ color: '#7B9DBF' }}>
              Ingrese las credenciales API del cliente
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-5">
          {/* Access Key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#7B9DBF' }}>
              Access Key
            </label>
            <input
              type="text"
              value={accessKey}
              onChange={(e) => {
                setAccessKey(e.target.value)
                if (error) setError('')
              }}
              onKeyDown={handleKeyDown}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              spellCheck={false}
              autoComplete="off"
              className="w-full rounded-lg border px-4 py-3 text-sm font-mono outline-none transition-colors"
              style={{
                backgroundColor: '#091829',
                borderColor: error && !accessKey.trim() ? '#E05353' : '#1B3A5C',
                color: '#E2EDF8',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor =
                  error && !accessKey.trim() ? '#E05353' : '#2E75B6'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor =
                  error && !accessKey.trim() ? '#E05353' : '#1B3A5C'
              }}
            />
          </div>

          {/* Secret Key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wider" style={{ color: '#7B9DBF' }}>
              Secret Key
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={(e) => {
                  setSecretKey(e.target.value)
                  if (error) setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="••••••••••••••••••••••••••••••••"
                autoComplete="off"
                className="w-full rounded-lg border px-4 py-3 pr-12 text-sm font-mono outline-none transition-colors"
                style={{
                  backgroundColor: '#091829',
                  borderColor: error && !secretKey.trim() ? '#E05353' : '#1B3A5C',
                  color: '#E2EDF8',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor =
                    error && !secretKey.trim() ? '#E05353' : '#2E75B6'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor =
                    error && !secretKey.trim() ? '#E05353' : '#1B3A5C'
                }}
              />
              <button
                type="button"
                onClick={() => setShowSecret((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors"
                style={{ color: '#7B9DBF' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#2E75B6')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#7B9DBF')}
                tabIndex={-1}
                aria-label={showSecret ? 'Ocultar Secret Key' : 'Mostrar Secret Key'}
              >
                {showSecret ? (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div
              className="flex items-center gap-2 rounded-lg border px-4 py-3 text-sm"
              style={{ backgroundColor: '#2A1010', borderColor: '#7B2020', color: '#F4A0A0' }}
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Connect button */}
          <button
            type="button"
            onClick={handleConnect}
            className="mt-1 w-full rounded-lg py-3 text-sm font-semibold tracking-wide transition-all"
            style={{ backgroundColor: '#2E75B6', color: '#FFFFFF' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1B3A5C')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2E75B6')}
          >
            Conectar
          </button>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs" style={{ color: '#4A6A8A' }}>
          Las credenciales se mantienen solo en memoria de la sesión y nunca se persisten.
        </p>
      </div>
    </div>
  )
}
