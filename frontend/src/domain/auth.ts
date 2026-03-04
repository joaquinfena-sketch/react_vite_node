export interface User {
  id: string
  email: string
  name: string
}

export interface AuthSession {
  user: User
}

export interface AuthRepository {
  login(email: string, password: string): Promise<AuthSession>
  logout(): Promise<void>
  getCurrentSession(): Promise<AuthSession | null>
}

