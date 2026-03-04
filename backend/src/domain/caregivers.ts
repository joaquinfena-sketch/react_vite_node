export type SexCode = 'total' | 'hombre' | 'mujer'

export type AgeGroupCode =
  | 'total'
  | 'hasta29anos'
  | 'de30a44anos'
  | 'de45a64anos'
  | 'de65a79anos'
  | 'de80ymasanos'

export type ProfessionalProblemsCode =
  | 'total'
  | 'sitieneproblemasprofesionales'
  | 'notieneningunproblemarelacionadoconsuvidaprofesional'

export interface CaregiverRecord {
  sexCode: SexCode
  sexLabel: string
  ageGroupCode: AgeGroupCode
  ageGroupLabel: string
  professionalProblemsCode: ProfessionalProblemsCode
  professionalProblemsLabel: string
  value: number
  provinceCode?: string
  provinceName?: string
  lat?: number
  lng?: number
}

export interface CaregiverKpiSummary {
  overallWithProblems: number
  menWithProblems: number
  womenWithProblems: number
}

export interface AgeGroupImpactPoint {
  ageGroupCode: AgeGroupCode
  ageGroupLabel: string
  value: number
}

export interface AgeGroupImpactBySexPoint {
  ageGroupCode: AgeGroupCode
  ageGroupLabel: string
  menWithProblems: number
  womenWithProblems: number
}

