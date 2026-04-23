import { useState } from 'react'
import { Login } from './Login'
import { Register } from './Register'

type AuthView = 'login' | 'register'

export function Auth() {
  const [view, setView] = useState<AuthView>('login')

  if (view === 'register') {
    return (
      <Register
        onGoToLogin={() => setView('login')}
      />
    )
  }

  return (
    <Login
      onGoToRegister={() => setView('register')}
    />
  )
}
