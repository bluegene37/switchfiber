import apiClient from './api'

/**
 * Audit Trail — every write the API records, one row per request.
 *
 * The list endpoints all return the same LogTrail row shape; they differ only
 * in how the set is narrowed. `getEntities` is the odd one out: it answers with
 * a flat array of entity names ("JobOrder", "User"), which is what populates the
 * Entity dropdown on the by-entity screen rather than a table of its own.
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
  },
  /** The distinct entity names logged in the range — a lookup, not a log list. */
  getEntities(dateFrom, dateTo) {
    return apiClient.get('/LogTrail/GetEntityByDate', {
      params: { DateFrom: dateFrom, DateTo: dateTo }
    })
  }
}
