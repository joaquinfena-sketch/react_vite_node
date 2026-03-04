import fs from 'fs'
import path from 'path'
import type {
  AgeGroupCode,
  AgeGroupImpactBySexPoint,
  AgeGroupImpactPoint,
  CaregiverKpiSummary,
  CaregiverRecord,
  ProfessionalProblemsCode,
  SexCode,
} from '../../domain/caregivers'

type RawItem = {
  Nombre: string
  MetaData: {
    T3_Variable: string
    Nombre: string
    Codigo: string
  }[]
  Data: { Valor: number }[]
}

const PROVINCES = [
  { code: 'H', name: 'Huelva', lat: 37.26, lng: -6.95 },
  { code: 'SE', name: 'Sevilla', lat: 37.39, lng: -5.99 },
  { code: 'CO', name: 'Córdoba', lat: 37.88, lng: -4.78 },
  { code: 'JA', name: 'Jaén', lat: 37.77, lng: -3.79 },
  { code: 'CA', name: 'Cádiz', lat: 36.53, lng: -6.29 },
  { code: 'MA', name: 'Málaga', lat: 36.72, lng: -4.42 },
  { code: 'GR', name: 'Granada', lat: 37.18, lng: -3.6 },
  { code: 'AL', name: 'Almería', lat: 36.84, lng: -2.46 },
]

function mapToRecord(item: RawItem, index: number): CaregiverRecord {
  const sexMeta = item.MetaData.find((m) => m.T3_Variable === 'Sexo')
  const ageMeta = item.MetaData.find((m) => m.T3_Variable === 'Edad del cuidador')
  const problemsMeta = item.MetaData.find((m) => m.T3_Variable === 'Problemas profesionales')

  const sexCode = (sexMeta?.Codigo ?? 'total') as SexCode
  const ageGroupCode = (ageMeta?.Codigo ?? 'total') as AgeGroupCode
  const professionalProblemsCode = (problemsMeta?.Codigo ?? 'total') as ProfessionalProblemsCode

  const baseProvince = PROVINCES[index % PROVINCES.length]
  const jitterSeed = (index % 7) - 3
  const latOffset = (jitterSeed * 0.02) / 2
  const lngOffset = ((-jitterSeed) * 0.02) / 2

  return {
    sexCode,
    sexLabel: sexMeta?.Nombre ?? 'Total',
    ageGroupCode,
    ageGroupLabel: ageMeta?.Nombre ?? 'Total',
    professionalProblemsCode,
    professionalProblemsLabel: problemsMeta?.Nombre ?? 'Total',
    value: item.Data[0]?.Valor ?? 0,
    provinceCode: baseProvince.code,
    provinceName: baseProvince.name,
    lat: baseProvince.lat + latOffset,
    lng: baseProvince.lng + lngOffset,
  }
}

function loadAllRecords(): CaregiverRecord[] {
  const filePath = path.join(__dirname, '../../../../frontend/src/data/caregiver_impact_raw.json')
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as RawItem[]
  return parsed.map((item, index) => mapToRecord(item, index))
}

const ALL_RECORDS: CaregiverRecord[] = loadAllRecords()

export function getAllCaregiverRecords(): CaregiverRecord[] {
  return ALL_RECORDS
}

export function getCaregiverKpiSummary(): CaregiverKpiSummary {
  const records = ALL_RECORDS

  const findValue = (sexCode: SexCode) =>
    records.find(
      (r) =>
        r.sexCode === sexCode &&
        r.ageGroupCode === 'total' &&
        r.professionalProblemsCode === 'sitieneproblemasprofesionales',
    )?.value ?? 0

  return {
    overallWithProblems: findValue('total'),
    menWithProblems: findValue('hombre'),
    womenWithProblems: findValue('mujer'),
  }
}

export function getAgeGroupImpactSeries(): AgeGroupImpactPoint[] {
  const records = ALL_RECORDS.filter(
    (r) =>
      r.sexCode === 'total' &&
      r.professionalProblemsCode === 'sitieneproblemasprofesionales' &&
      r.ageGroupCode !== 'total',
  )

  const order: AgeGroupCode[] = ['hasta29anos', 'de30a44anos', 'de45a64anos', 'de65a79anos', 'de80ymasanos']

  const points: AgeGroupImpactPoint[] = records.map((r) => ({
    ageGroupCode: r.ageGroupCode,
    ageGroupLabel: r.ageGroupLabel,
    value: r.value,
  }))

  points.sort((a, b) => order.indexOf(a.ageGroupCode) - order.indexOf(b.ageGroupCode))

  return points
}

export function getAgeGroupImpactBySexSeries(): AgeGroupImpactBySexPoint[] {
  const base = ALL_RECORDS.filter(
    (r) => r.professionalProblemsCode === 'sitieneproblemasprofesionales' && r.ageGroupCode !== 'total',
  )

  const order: AgeGroupCode[] = ['hasta29anos', 'de30a44anos', 'de45a64anos', 'de65a79anos', 'de80ymasanos']

  const byAge = new Map<AgeGroupCode, AgeGroupImpactBySexPoint>()

  for (const record of base) {
    const existing = byAge.get(record.ageGroupCode) ?? {
      ageGroupCode: record.ageGroupCode,
      ageGroupLabel: record.ageGroupLabel,
      menWithProblems: 0,
      womenWithProblems: 0,
    }

    if (record.sexCode === 'hombre') {
      existing.menWithProblems = record.value
    } else if (record.sexCode === 'mujer') {
      existing.womenWithProblems = record.value
    }

    byAge.set(record.ageGroupCode, existing)
  }

  const series = Array.from(byAge.values())
  series.sort((a, b) => order.indexOf(a.ageGroupCode) - order.indexOf(b.ageGroupCode))
  return series
}

