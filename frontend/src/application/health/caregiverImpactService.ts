import type {
  AgeGroupImpactBySexPoint,
  AgeGroupImpactPoint,
  CaregiverKpiSummary,
  CaregiverProfessionalImpactRecord,
} from '../../domain/health'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api'

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`)
  if (!response.ok) {
    throw new Error(`Error al llamar a la API (${response.status})`)
  }
  return (await response.json()) as T
}

export async function fetchDashboardKpis(): Promise<CaregiverKpiSummary> {
  return getJson<CaregiverKpiSummary>('/caregivers/kpis')
}

export async function fetchAgeGroupImpactSeries(): Promise<AgeGroupImpactPoint[]> {
  return getJson<AgeGroupImpactPoint[]>('/caregivers/age-series')
}

export async function fetchAgeGroupImpactBySexSeries(): Promise<AgeGroupImpactBySexPoint[]> {
  return getJson<AgeGroupImpactBySexPoint[]>('/caregivers/age-by-sex')
}

export async function fetchAllCaregiverImpactRecords(): Promise<CaregiverProfessionalImpactRecord[]> {
  return getJson<CaregiverProfessionalImpactRecord[]>('/caregivers/all')
}

