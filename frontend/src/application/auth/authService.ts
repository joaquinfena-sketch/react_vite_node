import type { AuthSession } from '../../domain/auth'
import type { AuthRepository } from '../../domain/auth'
import { InMemoryAuthRepository } from '../../infrastructure/auth/InMemoryAuthRepository'

const repository: AuthRepository = new InMemoryAuthRepository()

export async function login(email: string, password: string): Promise<AuthSession> {
  return repository.login(email, password)
}

export async function logout(): Promise<void> {
  return repository.logout()
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  return repository.getCurrentSession()
}

