import { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { AgeGroupImpactBySexPoint } from '../domain/health'
import { fetchAgeGroupImpactBySexSeries } from '../application/health/caregiverImpactService'

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function TendenciasPage() {
  const [series, setSeries] = useState<AgeGroupImpactBySexPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await fetchAgeGroupImpactBySexSeries()
        if (cancelled) return
        setSeries(data)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'No se han podido cargar las tendencias'
        setError(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="space-y-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Tendencias</h1>
        <p className="mt-1 text-sm text-slate-500">
          Comparativa de problemas profesionales entre hombres y mujeres según edad.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando tendencias...</p>
      ) : error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
          <header className="mb-4 space-y-1">
            <h2 className="text-base font-semibold text-emerald-800">
              Hombres vs mujeres por grupo de edad
            </h2>
            <p className="text-xs md:text-sm text-slate-500">
              Porcentaje de cuidadores que declara tener problemas profesionales, por sexo y edad.
            </p>
          </header>

          <div className="w-full h-72">
            <ResponsiveContainer>
              <LineChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="ageGroupLabel" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                  width={40}
                />
                <Tooltip
                  formatter={(value, key) => {
                    const numericValue = typeof value === 'number' ? value : 0
                    const label = key === 'menWithProblems' ? 'Hombres' : 'Mujeres'
                    return [formatPercent(numericValue), label]
                  }}
                  labelFormatter={(label) => `Edad: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="menWithProblems"
                  name="Hombres"
                  stroke="#0ea5e9"
                  strokeWidth={2.2}
                  dot={{ r: 4, fill: '#0284c7', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="womenWithProblems"
                  name="Mujeres"
                  stroke="#f97316"
                  strokeWidth={2.2}
                  dot={{ r: 4, fill: '#ea580c', strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}
    </section>
  )
}

export default TendenciasPage


