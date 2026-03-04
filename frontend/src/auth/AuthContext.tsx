import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import type { User } from '../domain/auth'
import * as authService from '../application/auth/authService'

interface AuthState {
  status: 'loading' | 'authenticated' | 'unauthenticated'
  user: User | null
}

interface AuthContextValue extends AuthState {
  login(email: string, password: string): Promise<void>
  logout(): Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({ status: 'loading', user: null })

  useEffect(() => {
    let cancelled = false

    authService
      .getCurrentSession()
      .then((session) => {
        if (cancelled) return
        if (session) {
          setState({ status: 'authenticated', user: session.user })
        } else {
          setState({ status: 'unauthenticated', user: null })
        }
      })
      .catch(() => {
        if (cancelled) return
        setState({ status: 'unauthenticated', user: null })
      })

    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = async (email: string, password: string) => {
    const session = await authService.login(email, password)
    setState({ status: 'authenticated', user: session.user })
  }

  const handleLogout = async () => {
    await authService.logout()
    setState({ status: 'unauthenticated', user: null })
  }

  const value: AuthContextValue = {
    ...state,
    login: handleLogin,
    logout: handleLogout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return ctx
}

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#047857',
        }}
      >
        Comprobando sesión...
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/" replace state={{ from: location }} />
  }

  return children
}

