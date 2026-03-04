import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'
import type { CaregiverProfessionalImpactRecord } from '../domain/health'
import { fetchAllCaregiverImpactRecords } from '../application/health/caregiverImpactService'

function getIntensityColor(value: number, maxValue: number): string {
  if (maxValue <= 0) return '#bbf7d0'
  const t = Math.min(1, value / maxValue)
  const start = { r: 224, g: 242, b: 254 }
  const end = { r: 22, g: 163, b: 74 }
  const r = Math.round(start.r + (end.r - start.r) * t)
  const g = Math.round(start.g + (end.g - start.g) * t)
  const b = Math.round(start.b + (end.b - start.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function MapaSaludPage() {
  const [records, setRecords] = useState<CaregiverProfessionalImpactRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'puntos' | 'calor'>('puntos')
  const [selectedProvinces, setSelectedProvinces] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        setLoading(true)
        const data = await fetchAllCaregiverImpactRecords()
        if (cancelled) return

        const withCoords = data.filter(
          (record) =>
            record.professionalProblemsCode === 'sitieneproblemasprofesionales' &&
            record.lat != null &&
            record.lng != null,
        )

        setRecords(withCoords)
      } catch (err) {
        if (cancelled) return
        const message = err instanceof Error ? err.message : 'No se han podido cargar los datos del mapa'
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

  const provinces = useMemo(() => {
    const map = new Map<string, string>()
    records.forEach((record) => {
      if (record.provinceCode && record.provinceName) {
        map.set(record.provinceCode, record.provinceName)
      }
    })
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }))
  }, [records])

  const maxValue = useMemo(
    () => records.reduce((max, r) => (r.value > max ? r.value : max), 0),
    [records],
  )

  const filteredRecords = useMemo(() => {
    if (selectedProvinces.length === 0) return []
    return records.filter((record) =>
      record.provinceCode ? selectedProvinces.includes(record.provinceCode) : false,
    )
  }, [records, selectedProvinces])

  const toggleProvince = (code: string) => {
    setSelectedProvinces((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    )
  }

  const PROVINCE_BOUNDS: Record<string, [[number, number], [number, number]]> = {
    H: [
      [37.4, -7.3],
      [37.1, -6.6],
    ],
    SE: [
      [37.6, -6.4],
      [37.1, -5.4],
    ],
    CO: [
      [38.1, -5.3],
      [37.6, -4.3],
    ],
    JA: [
      [38.1, -4.3],
      [37.3, -3.1],
    ],
    CA: [
      [36.8, -6.6],
      [36.2, -5.2],
    ],
    MA: [
      [37.1, -5.1],
      [36.4, -3.4],
    ],
    GR: [
      [37.6, -3.9],
      [36.9, -2.6],
    ],
    AL: [
      [37.0, -2.8],
      [36.5, -1.8],
    ],
  }

  return (
    <section>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.6rem', margin: 0 }}>Mapa salud</h1>
        <p style={{ marginTop: '0.35rem', color: '#6b7280' }}>
          Mapa geográfico de Andalucía con el porcentaje de cuidadores que declara tener problemas
          profesionales por provincia.
        </p>
      </header>

      {loading ? (
        <p style={{ color: '#6b7280' }}>Cargando datos...</p>
      ) : error ? (
        <p style={{ color: '#b91c1c' }}>{error}</p>
      ) : (
        <section
          style={{
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            backgroundColor: 'white',
            padding: '1.25rem 1.5rem',
          }}
        >
          <header
            style={{
              marginBottom: '0.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '1rem',
            }}
          >
            <div>
              <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#065f46' }}>Andalucía · mapa geográfico</h2>
              <p style={{ marginTop: '0.3rem', color: '#6b7280', fontSize: '0.9rem' }}>
                Proyección geográfica ficticia de los porcentajes de cuidadores con problemas profesionales
                por provincia.
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                alignItems: 'flex-end',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  padding: 2,
                  borderRadius: 999,
                  border: '1px solid #d1fae5',
                  backgroundColor: '#ecfdf5',
                  gap: 2,
                  alignSelf: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={() => setViewMode('puntos')}
                  style={{
                    padding: '0.25rem 0.7rem',
                    borderRadius: 999,
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: viewMode === 'puntos' ? '#22c55e' : 'transparent',
                    color: viewMode === 'puntos' ? '#ecfdf5' : '#065f46',
                    cursor: 'pointer',
                  }}
                >
                  Puntos
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('calor')}
                  style={{
                    padding: '0.25rem 0.7rem',
                    borderRadius: 999,
                    border: 'none',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: viewMode === 'calor' ? '#22c55e' : 'transparent',
                    color: viewMode === 'calor' ? '#ecfdf5' : '#065f46',
                    cursor: 'pointer',
                  }}
                >
                  Mapa de calor
                </button>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'nowrap',
                  gap: '0.25rem',
                  overflowX: 'auto',
                  paddingTop: '0.15rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const allCodes = provinces.map((p) => p.code)
                    const allSelected =
                      selectedProvinces.length === allCodes.length && allCodes.length > 0
                    setSelectedProvinces(allSelected ? [] : allCodes)
                  }}
                  style={{
                    padding: '0.18rem 0.6rem',
                    borderRadius: 999,
                    border: '1px solid #d1fae5',
                    backgroundColor:
                      selectedProvinces.length === provinces.length && provinces.length > 0
                        ? '#22c55e'
                        : 'white',
                    color:
                      selectedProvinces.length === provinces.length && provinces.length > 0
                        ? '#ecfdf5'
                        : '#065f46',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Andalucía (todas)
                </button>
                {provinces.map((province) => {
                  const active = selectedProvinces.includes(province.code)
                  return (
                    <button
                      key={province.code}
                      type="button"
                      onClick={() => toggleProvince(province.code)}
                      style={{
                        padding: '0.18rem 0.55rem',
                        borderRadius: 999,
                        border: '1px solid #d1fae5',
                        backgroundColor: active ? '#16a34a' : 'white',
                        color: active ? '#ecfdf5' : '#065f46',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      {province.name}
                    </button>
                  )
                })}
              </div>
            </div>
          </header>

          <div style={{ height: 420, borderRadius: 16, overflow: 'hidden' }}>
            <MapContainer
              center={[37.4, -4.7]}
              zoom={7}
              scrollWheelZoom={false}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredRecords.map((record, index) => {
                const value = record.value
                const color = getIntensityColor(value, maxValue)
                const radius =
                  viewMode === 'puntos'
                    ? 6
                    : 6 + (value / (maxValue || 1)) * 10

                return (
                  <CircleMarker
                    key={`${record.provinceCode}-${index}`}
                    center={[record.lat!, record.lng!]}
                    radius={radius}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: viewMode === 'puntos' ? 0.7 : 0.5,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <strong>{record.provinceName ?? 'Provincia'}</strong>
                      <br />
                      {record.value.toFixed(1)}% cuidadores con problemas profesionales
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </section>
      )}
    </section>
  )
}

export default MapaSaludPage



