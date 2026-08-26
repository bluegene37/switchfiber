import apiClient from './api'

/**
 * Audit Trail — every write the API records, one row per request.
 *
 * The list endpoints all return the same LogTrail row shape; they differ only
 * in how the set is narrowed. The Entity dropdown on the by-entity screen is
 * grouped client-side from the full getLogTrails download, so there is no
 * lookup endpoint here.
 *
 * Dates are ISO 8601 strings (`DateFrom` / `DateTo`), matching the query
 * parameter names the API declares.
 */
export const LogTrailService = {
  getLogTrails() {
    return apiClient.get('/LogTrail')
  },
  getLogsByTransactionDate(dateFrom, dateTo) {
    return apiClient.get('/LogTrail/GetLogsByTransactionDate', {
      params: { DateFrom: dateFrom, DateTo: dateTo }
    })
  },
  getLogsByEntityAndDate(entity, dateFrom, dateTo) {
    return apiClient.get('/LogTrail/GetLogsByEntityAndDate', {
      params: { Entity: entity, DateFrom: dateFrom, DateTo: dateTo }
    })
  },
  getLogsByUserAndDate(username, dateFrom, dateTo) {
    return apiClient.get('/LogTrail/GetLogsByUserAndDate', {
      params: { Username: username, DateFrom: dateFrom, DateTo: dateTo }
    })
  }
}
