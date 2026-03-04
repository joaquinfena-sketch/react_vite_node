import { useEffect, useState } from 'react'
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import type { AgeGroupImpactPoint, CaregiverKpiSummary } from '../domain/health'
import { fetchAgeGroupImpactSeries, fetchDashboardKpis } from '../application/health/caregiverImpactService'

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function DashboardPage() {
  const [kpis, setKpis] = useState<CaregiverKpiSummary | null>(null)
  const [ageSeries, setAgeSeries] = useState<AgeGroupImpactPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const [kpiSummary, ageImpact] = await Promise.all([fetchDashboardKpis(), fetchAgeGroupImpactSeries()])
        if (cancelled) return
        setKpis(kpiSummary)
        setAgeSeries(ageImpact)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'No se han podido cargar los datos'
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

  if (loading) {
    return (
      <section className="space-y-2">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cuidadores y problemas profesionales · Cargando datos...
          </p>
        </header>
      </section>
    )
  }

  if (error) {
    return (
      <section className="space-y-2">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Cuidadores y problemas profesionales</p>
        </header>
        <p className="text-sm font-medium text-red-600">{error}</p>
      </section>
    )
  }

  if (!kpis) {
    return null
  }

  return (
    <section className="space-y-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          Impacto de los cuidados en la vida profesional por sexo y grupos de edad.
        </p>
      </header>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
        <KpiCard
          title="Cuidadores con problemas profesionales"
          subtitle="Total población cuidadora"
          value={formatPercent(kpis.overallWithProblems)}
          accent="primary"
        />
        <KpiCard
          title="Hombres con problemas profesionales"
          subtitle="Cuidadores hombres"
          value={formatPercent(kpis.menWithProblems)}
          accent="soft"
        />
        <KpiCard
          title="Mujeres con problemas profesionales"
          subtitle="Cuidadoras mujeres"
          value={formatPercent(kpis.womenWithProblems)}
          accent="soft"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white px-5 py-4 space-y-4">
        <header className="space-y-1">
          <h2 className="text-base font-semibold text-emerald-800">
            Problemas profesionales por grupo de edad
          </h2>
          <p className="text-xs md:text-sm text-slate-500">
            Porcentaje de cuidadores que declara tener problemas en su vida profesional, según edad.
          </p>
        </header>

        <div className="w-full h-64 mb-3">
          <ResponsiveContainer>
            <LineChart data={ageSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="ageGroupLabel" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 12 }}
                domain={[0, 100]}
                width={40}
              />
              <Tooltip
                formatter={(value?: number) =>
                  typeof value === 'number' ? [formatPercent(value), '% con problemas'] : ['', '']
                }
                labelFormatter={(label) => `Edad: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#22c55e"
                strokeWidth={2.4}
                dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-xs md:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-3 py-2 text-left text-slate-500 font-medium">
                  Grupo de edad
                </th>
                <th className="px-3 py-2 text-right text-slate-500 font-medium">
                  % con problemas profesionales
                </th>
              </tr>
            </thead>
            <tbody>
              {ageSeries.map((point) => (
                <tr key={point.ageGroupCode} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">{point.ageGroupLabel}</td>
                  <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                    {formatPercent(point.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

interface KpiCardProps {
  title: string
  subtitle: string
  value: string
  accent?: 'primary' | 'soft'
}

function KpiCard({ title, subtitle, value, accent = 'primary' }: KpiCardProps) {
  const isPrimary = accent === 'primary'

  return (
    <article
      className={[
        'rounded-2xl border px-4 py-3 shadow-sm',
        isPrimary
          ? 'border-emerald-100 bg-gradient-to-br from-emerald-50 to-emerald-100/80'
          : 'border-slate-200 bg-white',
      ].join(' ')}
    >
      <p className="text-xs md:text-sm text-slate-500">{subtitle}</p>
      <h3 className="mt-1 text-sm font-medium text-emerald-900">{title}</h3>
      <p className="mt-1 text-2xl font-semibold text-emerald-700">{value}</p>
    </article>
  )
}

export default DashboardPage


