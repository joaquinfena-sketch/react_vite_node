import type { Router } from 'express'
import {
  getAgeGroupImpactBySexSeries,
  getAgeGroupImpactSeries,
  getAllCaregiverRecords,
  getCaregiverKpiSummary,
} from '../../infrastructure/caregivers/FileCaregiverRepository'

export function registerCaregiverRoutes(router: Router) {
  router.get('/caregivers/kpis', (_req, res) => {
    const summary = getCaregiverKpiSummary()
    res.json(summary)
  })

  router.get('/caregivers/age-series', (_req, res) => {
    const series = getAgeGroupImpactSeries()
    res.json(series)
  })

  router.get('/caregivers/age-by-sex', (_req, res) => {
    const series = getAgeGroupImpactBySexSeries()
    res.json(series)
  })

  router.get('/caregivers/all', (_req, res) => {
    const records = getAllCaregiverRecords()
    res.json(records)
  })
}

