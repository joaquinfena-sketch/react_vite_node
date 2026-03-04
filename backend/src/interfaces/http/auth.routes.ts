import type { Router } from 'express'
import { z } from 'zod'
import type { User } from '../../domain/auth'

const HARD_CODED_USER: User = {
  id: 'user-1',
  email: 'admin',
  name: 'Admin',
}

const HARD_CODED_PASSWORD = '1234'

const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
})

export function registerAuthRoutes(router: Router) {
  router.post('/auth/login', (req, res) => {
    const parseResult = loginSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ message: 'Datos de login inválidos' })
    }

    const { email, password } = parseResult.data
    const normalizedEmail = email.trim().toLowerCase()

    if (normalizedEmail !== HARD_CODED_USER.email.toLowerCase() || password !== HARD_CODED_PASSWORD) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    return res.json({ user: HARD_CODED_USER })
  })
}

