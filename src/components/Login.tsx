import { useState } from 'react'
import { signIn } from '../lib/auth'

interface FormErrors {
  email?: string
  password?: string
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}
  if (!email.trim()) {
    errors.email = 'El correo es requerido.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Ingresa un correo válido.'
  }
  if (!password) errors.password = 'La contraseña es requerida.'
  return errors
}

export function Login({ onGoToRegister }: { onGoToRegister?: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(email, password)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})

    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)

    if (error) {
      setServerError('Correo o contraseña incorrectos.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-white">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-gray-400">Accede a tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition bg-gray-800 focus:ring-2 focus:ring-blue-500/50 ${
                errors.email ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Tu contraseña"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition bg-gray-800 focus:ring-2 focus:ring-blue-500/50 ${
                errors.password ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>

        {onGoToRegister && (
          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
              className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
            >
              Regístrate
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
