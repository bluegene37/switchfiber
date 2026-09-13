import apiClient from './api.js'

/**
 * Generic CRUD calls shared by every table-driven page.
 *
 * DynamicApiTable (and anything else that works on an endpoint name rather
 * than a fixed entity) goes through here instead of calling the axios client
 * directly, so URL building and the request shape live in one place. Callers
 * pass the endpoint name ("JobOrders", "Users", "JobOrders/status-date") and
 * the payload or id; the auth header, error flattening and 401 handling stay
 * in api.js.
 */

/** "JobOrders", "/JobOrders" and "JobOrders/" all resolve to "/JobOrders". */
export const toPath = (endpoint) => {
  const trimmed = String(endpoint ?? '').trim().replace(/^\/+|\/+$/g, '')
  return `/${trimmed}`
}

/** GET /{endpoint}, optionally with a query string. */
export const list = (endpoint, params, config = {}) => {
  return apiClient.get(toPath(endpoint), { ...config, params })
}

/** GET /{endpoint}/{id} */
export const getById = (endpoint, id, config = {}) => {
  return apiClient.get(`${toPath(endpoint)}/${id}`, config)
}

/** POST /{endpoint} */
export const create = (endpoint, payload, config = {}) => {
  return apiClient.post(toPath(endpoint), payload, config)
}

/** PUT /{endpoint}/{id} */
export const update = (endpoint, id, payload, config = {}) => {
  return apiClient.put(`${toPath(endpoint)}/${id}`, payload, config)
}

/** DELETE /{endpoint}/{id} */
export const remove = (endpoint, id, config = {}) => {
  return apiClient.delete(`${toPath(endpoint)}/${id}`, config)
}

/**
 * Send `verb` to `path`; if the server answers 404, retry once at `altPath`.
 *
 * Some ASP.NET routes are registered under a different casing than the one
 * the rest of the API uses (AccesslevelMenu vs AccessLevelMenu). A 404 from
 * the first spelling is a routing miss, not a missing record, so the second
 * spelling is tried before the error is surfaced.
 */
export const requestWithRouteFallback = async (verb, path, altPath, payload) => {
  const send = (target) => (payload === undefined
    ? apiClient[verb](toPath(target))
    : apiClient[verb](toPath(target), payload))
  try {
    return await send(path)
  } catch (err) {
    if (err.status !== 404) throw err
    return await send(altPath)
  }
}

export const CrudService = { toPath, list, getById, create, update, remove, requestWithRouteFallback }

export default CrudService
