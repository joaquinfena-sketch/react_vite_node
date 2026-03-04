import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type {
  AgeGroupCode,
  CaregiverProfessionalImpactRecord,
  ProfessionalProblemsCode,
  SexCode,
} from '../domain/health'
import { fetchAllCaregiverImpactRecords } from '../application/health/caregiverImpactService'

type SexFilter = SexCode | 'all'
type AgeFilter = AgeGroupCode | 'all'
type ProblemsFilter = ProfessionalProblemsCode | 'all'

const sexOptions: { value: SexFilter; label: string }[] = [
  { value: 'all', label: 'Todos los sexos' },
  { value: 'hombre', label: 'Hombres' },
  { value: 'mujer', label: 'Mujeres' },
]

const ageOptions: { value: AgeFilter; label: string }[] = [
  { value: 'all', label: 'Todas las edades' },
  { value: 'hasta29anos', label: 'Hasta 29 años' },
  { value: 'de30a44anos', label: 'De 30 a 44 años' },
  { value: 'de45a64anos', label: 'De 45 a 64 años' },
  { value: 'de65a79anos', label: 'De 65 a 79 años' },
  { value: 'de80ymasanos', label: 'De 80 y más años' },
]

const problemsOptions: { value: ProblemsFilter; label: string }[] = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'sitieneproblemasprofesionales', label: 'Sí tiene problemas profesionales' },
  {
    value: 'notieneningunproblemarelacionadoconsuvidaprofesional',
    label: 'No tiene problemas profesionales',
  },
]

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`
}

function ExploradorPage() {
  const [records, setRecords] = useState<CaregiverProfessionalImpactRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [sexFilter, setSexFilter] = useState<SexFilter>('all')
  const [ageFilter, setAgeFilter] = useState<AgeFilter>('all')
  const [problemsFilter, setProblemsFilter] = useState<ProblemsFilter>('all')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await fetchAllCaregiverImpactRecords()
        if (cancelled) return
        setRecords(data)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'No se ha podido cargar el explorador'
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

  const filtered = records.filter((record) => {
    if (sexFilter !== 'all' && record.sexCode !== sexFilter) return false
    if (ageFilter !== 'all' && record.ageGroupCode !== ageFilter) return false
    if (problemsFilter !== 'all' && record.professionalProblemsCode !== problemsFilter) return false
    return true
  })

  return (
    <section className="space-y-4">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold text-slate-900">Explorador de datos</h1>
        <p className="mt-1 text-sm text-slate-500">
          Filtra y explora los porcentajes de cuidadores con y sin problemas profesionales.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-slate-500">Cargando datos...</p>
      ) : error ? (
        <p className="text-sm font-medium text-red-600">{error}</p>
      ) : (
        <>
          <section className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FilterSelect
              label="Sexo"
              value={sexFilter}
              onChange={(value) => setSexFilter(value as SexFilter)}
              options={sexOptions}
            />
            <FilterSelect
              label="Edad del cuidador"
              value={ageFilter}
              onChange={(value) => setAgeFilter(value as AgeFilter)}
              options={ageOptions}
            />
            <FilterSelect
              label="Problemas profesionales"
              value={problemsFilter}
              onChange={(value) => setProblemsFilter(value as ProblemsFilter)}
              options={problemsOptions}
            />
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 space-y-3">
            <div className="text-xs md:text-sm text-slate-500">
              Mostrando{' '}
              <strong className="font-semibold text-emerald-700">{filtered.length}</strong> filas de{' '}
              {records.length}.
            </div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => exportFilteredToCsv(filtered, sexFilter, ageFilter, problemsFilter)}
                disabled={filtered.length === 0}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  filtered.length === 0
                    ? 'cursor-default border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-emerald-500 bg-emerald-500 text-emerald-50 hover:bg-emerald-600',
                ].join(' ')}
              >
                Exportar resultados a CSV
              </button>
              <button
                type="button"
                onClick={() => exportFilteredToPdf(filtered, sexFilter, ageFilter, problemsFilter)}
                disabled={filtered.length === 0}
                className={[
                  'rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                  filtered.length === 0
                    ? 'cursor-default border-slate-200 bg-slate-100 text-slate-400'
                    : 'border-sky-500 bg-sky-500 text-sky-50 hover:bg-sky-600',
                ].join(' ')}
              >
                Exportar resultados a PDF
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">Sexo</th>
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">
                      Edad del cuidador
                    </th>
                    <th className="px-3 py-2 text-left text-slate-500 font-medium">
                      Tipo de indicador
                    </th>
                    <th className="px-3 py-2 text-right text-slate-500 font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record, index) => (
                    <tr
                      key={`${record.sexCode}-${record.ageGroupCode}-${record.professionalProblemsCode}-${index}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2">{record.sexLabel}</td>
                      <td className="px-3 py-2">{record.ageGroupLabel}</td>
                      <td className="px-3 py-2">{record.professionalProblemsLabel}</td>
                      <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                        {formatPercent(record.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  )
}

function exportFilteredToCsv(
  filtered: CaregiverProfessionalImpactRecord[],
  sexFilter: SexFilter,
  ageFilter: AgeFilter,
  problemsFilter: ProblemsFilter,
) {
  if (filtered.length === 0) return

  const sexLabel = sexOptions.find((o) => o.value === sexFilter)?.label ?? 'Todos los sexos'
  const ageLabel = ageOptions.find((o) => o.value === ageFilter)?.label ?? 'Todas las edades'
  const problemsLabel =
    problemsOptions.find((o) => o.value === problemsFilter)?.label ?? 'Todos los tipos'

  const lines: string[] = []
  lines.push('Filtro sexo;Filtro edad del cuidador;Filtro problemas profesionales')
  lines.push(`"${sexLabel}";"${ageLabel}";"${problemsLabel}"`)
  lines.push('')
  lines.push('Sexo;Edad del cuidador;Tipo de indicador;Valor (%)')

  for (const record of filtered) {
    lines.push(
      `"${record.sexLabel}";"${record.ageGroupLabel}";"${record.professionalProblemsLabel}";"${record.value.toFixed(
        2,
      )}"`,
    )
  }

  const csvContent = lines.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
  link.href = url
  link.setAttribute('download', `explorador-healthdash-${timestamp}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function exportFilteredToPdf(
  filtered: CaregiverProfessionalImpactRecord[],
  sexFilter: SexFilter,
  ageFilter: AgeFilter,
  problemsFilter: ProblemsFilter,
) {
  if (filtered.length === 0) return

  const sexLabel = sexOptions.find((o) => o.value === sexFilter)?.label ?? 'Todos los sexos'
  const ageLabel = ageOptions.find((o) => o.value === ageFilter)?.label ?? 'Todas las edades'
  const problemsLabel =
    problemsOptions.find((o) => o.value === problemsFilter)?.label ?? 'Todos los tipos'

  const doc = new jsPDF()
  const now = new Date()
  let y = 14

  doc.setFontSize(16)
  doc.setTextColor(4, 88, 64)
  doc.text('Explorador de datos · Exportación', 14, y)
  y += 8

  doc.setFontSize(10)
  doc.setTextColor(75, 85, 99)
  doc.text(`Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, y)
  y += 7

  doc.text(`Filtro sexo: ${sexLabel}`, 14, y)
  y += 5
  doc.text(`Filtro edad del cuidador: ${ageLabel}`, 14, y)
  y += 5
  doc.text(`Filtro problemas profesionales: ${problemsLabel}`, 14, y)
  y += 6

  autoTable(doc, {
    startY: y,
    head: [['Sexo', 'Edad del cuidador', 'Tipo de indicador', 'Valor (%)']],
    body: filtered.map((record) => [
      record.sexLabel,
      record.ageGroupLabel,
      record.professionalProblemsLabel,
      record.value.toFixed(2),
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [14, 165, 233] },
  })

  const timestamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-')
  doc.save(`explorador-healthdash-${timestamp}.pdf`)
}

interface FilterSelectProps<T extends string> {
  label: string
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
}

function FilterSelect<T extends string>({ label, value, onChange, options }: FilterSelectProps<T>) {
  return (
    <label className="grid gap-1 text-xs md:text-sm text-slate-700">
      <span className="font-medium">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="min-w-[180px] rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs md:text-sm text-emerald-950 outline-none ring-0 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export default ExploradorPage


