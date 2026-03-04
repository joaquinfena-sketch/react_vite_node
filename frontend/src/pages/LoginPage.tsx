import type { FormEvent } from 'react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      const from = (location.state as { from?: Location } | null)?.from
      navigate(from?.pathname ?? '/dashboard', { replace: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se ha podido iniciar sesión'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-emerald-50 px-4 py-6">
      <section className="w-full max-w-md rounded-2xl border border-emerald-200 bg-white px-7 py-8 shadow-2xl shadow-emerald-500/40">
        <header className="mb-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-emerald-700">HealthDash</h1>
          <p className="mt-2 text-sm text-slate-600">
            Accede al panel de salud pública de Andalucía
          </p>
        </header>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Usuario
            </label>
            <input
              id="email"
              type="text"
              required
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-full border border-emerald-200 bg-slate-50 px-3 py-2 text-sm text-emerald-950 outline-none ring-0 transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-full border border-emerald-200 bg-slate-50 px-3 py-2 text-sm text-emerald-950 outline-none ring-0 transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          {error ? (
            <p className="m-0 text-xs font-medium text-red-600">
              {error === 'Credenciales inválidas'
                ? 'Usuario o contraseña incorrectos. Prueba con admin / 1234.'
                : error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-emerald-50 shadow-sm transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-default disabled:opacity-70"
          >
            {submitting ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <section className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          <h2 className="text-sm font-semibold text-emerald-900">Credenciales de prueba</h2>
          <p className="mt-1">
            Para acceder a la demo del panel utiliza:
          </p>
          <ul className="mt-2 list-disc space-y-0.5 pl-5">
            <li>
              <span className="font-semibold">Usuario:</span> admin
            </li>
            <li>
              <span className="font-semibold">Contraseña:</span> 1234
            </li>
          </ul>
          <p className="mt-3 text-xs text-emerald-800/80">
            Los datos mostrados en la aplicación son ficticios y se utilizan únicamente con fines de demostración.
          </p>
        </section>
      </section>
    </main>
  )
}

export default LoginPage

