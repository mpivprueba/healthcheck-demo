import { useState } from 'react'
import { signUp } from '../lib/auth'
import type { UserRole } from '../types'

interface FormErrors {
  fullName?: string
  email?: string
  password?: string
  role?: string
}

function validate(fullName: string, email: string, password: string, role: string): FormErrors {
  const errors: FormErrors = {}
  if (!fullName.trim()) errors.fullName = 'El nombre completo es requerido.'
  if (!email.trim()) {
    errors.email = 'El correo es requerido.'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Ingresa un correo válido.'
  }
  if (!password) {
    errors.password = 'La contraseña es requerida.'
  } else if (password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres.'
  }
  if (!role) errors.role = 'Selecciona un rol.'
  return errors
}

export function Register({ onGoToLogin }: { onGoToLogin?: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError('')

    const validationErrors = validate(fullName, email, password, role)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors({})

    setLoading(true)
    const { error } = await signUp(email, password, fullName, role as UserRole)
    setLoading(false)

    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
            <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-white">Revisa tu correo</h2>
          <p className="text-sm leading-relaxed text-gray-400">
            Te enviamos un enlace de confirmación a{' '}
            <span className="font-medium text-white">{email}</span>. Confirma tu cuenta para
            poder iniciar sesión.
          </p>
          {onGoToLogin && (
            <button
              type="button"
              onClick={onGoToLogin}
              className="mt-6 text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
            >
              Ir al inicio de sesión
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-white">Crear cuenta</h1>
          <p className="mt-1 text-sm text-gray-400">Completa los datos para registrarte</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Nombre completo */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Nombre completo
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="María García"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition bg-gray-800 focus:ring-2 focus:ring-blue-500/50 ${
                errors.fullName ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1.5 text-xs text-red-400">{errors.fullName}</p>
            )}
          </div>

          {/* Correo */}
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

          {/* Contraseña */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition bg-gray-800 focus:ring-2 focus:ring-blue-500/50 ${
                errors.password ? 'border-red-500' : 'border-gray-700 focus:border-blue-500'
              }`}
            />
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-300">Rol</label>
            <div className="grid grid-cols-2 gap-3">
              {(['customer', 'consultant'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRole(option)}
                  className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition ${
                    role === option
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                      : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                  }`}
                >
                  {option === 'customer' ? 'Cliente' : 'Consultor'}
                </button>
              ))}
            </div>
            {errors.role && (
              <p className="mt-1.5 text-xs text-red-400">{errors.role}</p>
            )}
          </div>

          {/* Error del servidor */}
          {serverError && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-sm text-red-400">{serverError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        {onGoToLogin && (
          <p className="mt-6 text-center text-sm text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              className="font-medium text-blue-400 hover:text-blue-300 hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
