import express from 'express'
import cors from 'cors'
import { registerCaregiverRoutes } from './caregivers.routes'
import { registerAuthRoutes } from './auth.routes'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: 'http://localhost:5173',
    }),
  )
  app.use(express.json())

  const apiRouter = express.Router()
  registerCaregiverRoutes(apiRouter)
  registerAuthRoutes(apiRouter)

  app.use('/api', apiRouter)

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  return app
}

