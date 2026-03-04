import { useEffect, useState } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useAuth } from '../auth/AuthContext'
import type { AgeGroupImpactBySexPoint, AgeGroupImpactPoint, CaregiverKpiSummary } from '../domain/health'
import {
  fetchAgeGroupImpactBySexSeries,
  fetchAgeGroupImpactSeries,
  fetchDashboardKpis,
} from '../application/health/caregiverImpactService'

type SectionKey = 'dashboard' | 'tendencias'

const defaultSections: Record<SectionKey, boolean> = {
  dashboard: false,
  tendencias: false,
}

function InformePage() {
  const { user } = useAuth()

  const [sections, setSections] = useState<Record<SectionKey, boolean>>(defaultSections)
  const [kpis, setKpis] = useState<CaregiverKpiSummary | null>(null)
  const [ageSeries, setAgeSeries] = useState<AgeGroupImpactPoint[]>([])
  const [sexAgeSeries, setSexAgeSeries] = useState<AgeGroupImpactBySexPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const [kpiSummary, ageImpact, sexImpact] = await Promise.all([
          fetchDashboardKpis(),
          fetchAgeGroupImpactSeries(),
          fetchAgeGroupImpactBySexSeries(),
        ])
        if (cancelled) return
        setKpis(kpiSummary)
        setAgeSeries(ageImpact)
        setSexAgeSeries(sexImpact)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'No se han podido cargar los datos para el informe'
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

  const toggleSection = (key: SectionKey) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleGeneratePdf = async () => {
    if (!kpis) return
    if (!Object.values(sections).some(Boolean)) return

    try {
      setGenerating(true)
      const doc = new jsPDF()
      const now = new Date()

      let y = 14

      doc.setFontSize(16)
      doc.setTextColor(4, 88, 64)
      doc.text('Informe de impacto profesional en cuidadores', 14, y)
      y += 8

      doc.setFontSize(10)
      doc.setTextColor(75, 85, 99)
      doc.text(`Fecha: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 14, y)
      if (user?.email) {
        doc.text(`Usuario: ${user.email}`, 120, y)
      }
      y += 8

      if (sections.dashboard) {
        doc.setFontSize(12)
        doc.setTextColor(4, 88, 64)
        doc.text('1. Vista Dashboard · resumen general', 14, y)
        y += 6

        doc.setFontSize(10)
        doc.setTextColor(31, 41, 55)
        doc.text(
          `Cuidadores con problemas profesionales (total): ${kpis.overallWithProblems.toFixed(1)}%`,
          16,
          y,
        )
        y += 5
        doc.text(`Hombres con problemas profesionales: ${kpis.menWithProblems.toFixed(1)}%`, 16, y)
        y += 5
        doc.text(`Mujeres con problemas profesionales: ${kpis.womenWithProblems.toFixed(1)}%`, 16, y)
        y += 8
      }

      if (sections.dashboard && ageSeries.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(4, 88, 64)
        doc.text('2. Vista Dashboard · problemas por grupo de edad', 14, y)
        y += 4

        autoTable(doc, {
          startY: y + 2,
          head: [['Grupo de edad', '% con problemas profesionales']],
          body: ageSeries.map((p) => [p.ageGroupLabel, `${p.value.toFixed(2)}%`]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [16, 185, 129] },
        })
        const anyDoc = doc as any
        if (anyDoc.lastAutoTable?.finalY) {
          y = anyDoc.lastAutoTable.finalY + 8
        }

        // Pequeño gráfico lineal por grupo de edad (similar al dashboard)
        const chartX = 16
        const chartY = y
        const chartWidth = 170
        const chartHeight = 38

        const maxValue = Math.max(...ageSeries.map((p) => p.value))
        if (maxValue > 0) {
          doc.setFontSize(9)
          doc.setTextColor(107, 114, 128)
          doc.text('Gráfico lineal · % con problemas por edad', chartX, chartY)

          const innerX = chartX + 10
          const innerY = chartY + 4
          const innerWidth = chartWidth - 16
          const innerHeight = chartHeight - 10

          // Eje base
          doc.setDrawColor(209, 213, 219)
          doc.line(innerX, innerY + innerHeight, innerX + innerWidth, innerY + innerHeight)

          const n = ageSeries.length
          const points = ageSeries.map((point, index) => {
            const t = n === 1 ? 0.5 : index / (n - 1)
            const x = innerX + t * innerWidth
            const yPoint =
              innerY + innerHeight - (point.value / maxValue) * (innerHeight - 4)
            return { x, y: yPoint, label: point.ageGroupLabel, value: point.value }
          })

          // Línea
          doc.setDrawColor(34, 197, 94)
          doc.setLineWidth(0.6)
          for (let i = 0; i < points.length - 1; i += 1) {
            const p1 = points[i]
            const p2 = points[i + 1]
            doc.line(p1.x, p1.y, p2.x, p2.y)
          }

          // Puntos y etiquetas
          doc.setFillColor(34, 197, 94)
          doc.setTextColor(55, 65, 81)
          doc.setFontSize(7)
          points.forEach((p) => {
            doc.circle(p.x, p.y, 1.2, 'F')
            doc.text(`${p.value.toFixed(1)}%`, p.x + 1.5, p.y - 1)
            doc.text(p.label, p.x - 6, innerY + innerHeight + 4)
          })

          y = innerY + innerHeight + 10
        }
      }

      if (sections.tendencias && sexAgeSeries.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(4, 88, 64)
        doc.text('3. Vista Tendencias · hombres vs mujeres', 14, y)

        autoTable(doc, {
          startY: y + 2,
          head: [['Grupo de edad', '% hombres con problemas', '% mujeres con problemas']],
          body: sexAgeSeries.map((p) => [
            p.ageGroupLabel,
            `${p.menWithProblems.toFixed(2)}%`,
            `${p.womenWithProblems.toFixed(2)}%`,
          ]),
          styles: { fontSize: 9 },
          headStyles: { fillColor: [56, 189, 248] },
        })
        const anyDoc = doc as any
        if (anyDoc.lastAutoTable?.finalY) {
          y = anyDoc.lastAutoTable.finalY + 8
        }

        // Gráfico lineal comparativo H/M por edad (similar a Tendencias en la web)
        const chartX = 16
        const chartY = y
        const chartWidth = 170
        const chartHeight = 42

        const maxValueHM = Math.max(
          ...sexAgeSeries.flatMap((p) => [p.menWithProblems, p.womenWithProblems]),
        )
        if (maxValueHM > 0) {
          doc.setFontSize(9)
          doc.setTextColor(107, 114, 128)
          doc.text('Gráfico lineal · Hombres (azul) vs Mujeres (naranja)', chartX, chartY)

          const innerX = chartX + 10
          const innerY = chartY + 4
          const innerWidth = chartWidth - 18
          const innerHeight = chartHeight - 10

          doc.setDrawColor(209, 213, 219)
          doc.line(innerX, innerY + innerHeight, innerX + innerWidth, innerY + innerHeight)

          const n = sexAgeSeries.length
          const menPoints = sexAgeSeries.map((point, index) => {
            const t = n === 1 ? 0.5 : index / (n - 1)
            const x = innerX + t * innerWidth
            const yPoint =
              innerY + innerHeight - (point.menWithProblems / maxValueHM) * (innerHeight - 4)
            return { x, y: yPoint, label: point.ageGroupLabel, value: point.menWithProblems }
          })

          const womenPoints = sexAgeSeries.map((point, index) => {
            const t = n === 1 ? 0.5 : index / (n - 1)
            const x = innerX + t * innerWidth
            const yPoint =
              innerY + innerHeight - (point.womenWithProblems / maxValueHM) * (innerHeight - 4)
            return { x, y: yPoint, label: point.ageGroupLabel, value: point.womenWithProblems }
          })

          // Línea hombres
          doc.setDrawColor(14, 165, 233)
          doc.setLineWidth(0.6)
          for (let i = 0; i < menPoints.length - 1; i += 1) {
            const p1 = menPoints[i]
            const p2 = menPoints[i + 1]
            doc.line(p1.x, p1.y, p2.x, p2.y)
          }

          // Línea mujeres
          doc.setDrawColor(249, 115, 22)
          for (let i = 0; i < womenPoints.length - 1; i += 1) {
            const p1 = womenPoints[i]
            const p2 = womenPoints[i + 1]
            doc.line(p1.x, p1.y, p2.x, p2.y)
          }

          // Puntos y etiquetas en el eje X
          doc.setFontSize(7)
          sexAgeSeries.forEach((point, index) => {
            const t = n === 1 ? 0.5 : index / (n - 1)
            const x = innerX + t * innerWidth

            const men = menPoints[index]
            const women = womenPoints[index]

            doc.setFillColor(14, 165, 233)
            doc.circle(men.x, men.y, 1.1, 'F')

            doc.setFillColor(249, 115, 22)
            doc.circle(women.x, women.y, 1.1, 'F')

            doc.setTextColor(55, 65, 81)
            doc.text(point.ageGroupLabel, x - 6, innerY + innerHeight + 4)
          })

          // Leyenda
          const legendY = innerY + innerHeight + 8
          doc.setFillColor(14, 165, 233)
          doc.circle(innerX, legendY, 1.1, 'F')
          doc.setTextColor(31, 41, 55)
          doc.setFontSize(8)
          doc.text('Hombres', innerX + 4, legendY + 1)

          doc.setFillColor(249, 115, 22)
          doc.circle(innerX + 28, legendY, 1.1, 'F')
          doc.text('Mujeres', innerX + 32, legendY + 1)

          y = legendY + 8
        }
      }

      // Sección de mapa salud eliminada del informe PDF (solo se mantiene en la aplicación web).

      doc.save('informe-healthdash.pdf')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <section>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Informe PDF</h1>
        <p style={{ marginTop: '0.35rem', color: '#6b7280' }}>
          Configura el contenido del informe y genera un PDF descargable.
        </p>
      </header>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Cargando datos para el informe...</p>
      ) : error ? (
        <p style={{ color: '#b91c1c' }}>{error}</p>
      ) : (
        <>
          <section
            style={{
              marginBottom: '1rem',
              padding: '0.9rem 1rem',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              backgroundColor: '#f9fafb',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '0.6rem',
            }}
          >
            <SectionToggle
              label="Dashboard"
              description="Incluye los KPIs y el resumen por grupos de edad."
              checked={sections.dashboard}
              onChange={() => toggleSection('dashboard')}
            />
            <SectionToggle
              label="Tendencias"
              description="Incluye la comparativa hombres vs mujeres por edad."
              checked={sections.tendencias}
              onChange={() => toggleSection('tendencias')}
            />
          </section>

          {Object.values(sections).some(Boolean) ? (
            <p style={{ marginBottom: '0.6rem', fontSize: '0.85rem', color: '#6b7280' }}>
              Se generará un informe con las secciones seleccionadas.
            </p>
          ) : (
            <p style={{ marginBottom: '0.6rem', fontSize: '0.85rem', color: '#b91c1c' }}>
              Marca al menos una sección para poder generar el informe.
            </p>
          )}

          <button
            type="button"
            onClick={handleGeneratePdf}
            disabled={generating || !kpis || !Object.values(sections).some(Boolean)}
            style={{
              padding: '0.7rem 1.4rem',
              borderRadius: 999,
              border: 'none',
              fontWeight: 600,
              background: Object.values(sections).some(Boolean)
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #e5e7eb, #e5e7eb)',
              color: Object.values(sections).some(Boolean) ? 'white' : '#6b7280',
              cursor: generating || !Object.values(sections).some(Boolean) ? 'default' : 'pointer',
              opacity: generating ? 0.8 : 1,
            }}
          >
            {generating ? 'Generando informe...' : 'Generar informe PDF'}
          </button>
        </>
      )}
    </section>
  )
}

interface SectionToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}

function SectionToggle({ label, description, checked, onChange }: SectionToggleProps) {
  return (
    <label
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        alignItems: 'flex-start',
        gap: '0.55rem',
        fontSize: '0.9rem',
        color: '#111827',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          width: 18,
          height: 18,
          borderRadius: 4,
          cursor: 'pointer',
        }}
      />
      <span>
        <span style={{ display: 'block', fontWeight: 600 }}>{label}</span>
        <span style={{ display: 'block', color: '#6b7280', fontSize: '0.8rem', marginTop: 2 }}>
          {description}
        </span>
      </span>
    </label>
  )
}

export default InformePage


