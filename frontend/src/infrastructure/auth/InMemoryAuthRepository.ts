import type { AuthRepository, AuthSession, User } from '../../domain/auth'

const STORAGE_KEY = 'healthdash_auth_session'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'

function loadSessionFromStorage(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AuthSession
    if (!parsed?.user?.email) return null
    return parsed
  } catch {
    return null
  }
}

function saveSessionToStorage(session: AuthSession | null): void {
  try {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY)
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
    }
  } catch {
    // ignoramos errores de almacenamiento
  }
}

export class InMemoryAuthRepository implements AuthRepository {
  private session: AuthSession | null

  constructor() {
    this.session = typeof window !== 'undefined' ? loadSessionFromStorage() : null
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      let message = 'No se ha podido iniciar sesión'
      try {
        const body = (await response.json()) as { message?: string }
        if (body?.message) message = body.message
      } catch {
        // ignoramos errores de parseo
      }
      throw new Error(message)
    }

    const data = (await response.json()) as { user: User }
    this.session = { user: data.user }
    saveSessionToStorage(this.session)
    return this.session
  }

  async logout(): Promise<void> {
    this.session = null
    saveSessionToStorage(null)
  }

  async getCurrentSession(): Promise<AuthSession | null> {
    if (this.session) {
      return this.session
    }

    if (typeof window === 'undefined') {
      return null
    }

    this.session = loadSessionFromStorage()
    return this.session
  }
}

