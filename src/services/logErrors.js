import apiClient from './api'

/**
 * Error Logs — failures the API recorded, in the same row shape as the audit
 * trail. Mirrors LogTrailService, with one naming difference the API itself
 * carries: the plain date range is `GetLogsByDateRange` here and
 * `GetLogsByTransactionDate` on LogTrail.
 *
 * Dates are ISO 8601 strings (`DateFrom` / `DateTo`), matching the query
 * parameter names the API declares.
 */
export const LogErrorService = {
  getLogErrors() {
    return apiClient.get('/LogError')
  },
  getLogsByDateRange(dateFrom, dateTo) {
    return apiClient.get('/LogError/GetLogsByDateRange', {
      params: { DateFrom: dateFrom, DateTo: dateTo }
    })
  },
  getLogsByEntityAndDate(entity, dateFrom, dateTo) {
    return apiClient.get('/LogError/GetLogsByEntityAndDate', {
      params: { Entity: entity, DateFrom: dateFrom, DateTo: dateTo }
    })
  },
  getLogsByUserAndDate(username, dateFrom, dateTo) {
    return apiClient.get('/LogError/GetLogsByUserAndDate', {
      params: { Username: username, DateFrom: dateFrom, DateTo: dateTo }
    })
  }
}
