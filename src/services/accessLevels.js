import apiClient from './api'

export const AccessLevelService = {
  getAccessLevels() {
    return apiClient.get('/AccessLevel')
  },
  getAccessLevelById(id) {
    return apiClient.get(`/AccessLevel/${id}`)
  },
  /**
   * @param {import('../models/types').CreateAccessLevelRequest} data
   */
  createAccessLevel(data = {}) {
    const rawUser = typeof window !== 'undefined'
      ? (localStorage.getItem('user') || sessionStorage.getItem('user'))
      : null
    let userId = '1'
    try {
      const parsed = JSON.parse(rawUser || '{}')
      if (parsed?.id) userId = String(parsed.id)
    } catch {}

    const payload = {
      name: data?.name !== undefined && data?.name !== null ? String(data.name).trim() : '',
      description: data?.description !== undefined && data?.description !== null ? String(data.description).trim() : '',
      createdBy: data?.createdBy !== undefined && data?.createdBy !== null ? String(data.createdBy) : userId,
      createdDate: null,
      modifiedBy: data?.modifiedBy !== undefined && data?.modifiedBy !== null ? String(data.modifiedBy) : userId,
      modifiedDate: null
    }
    return apiClient.post('/AccessLevel', payload)
  },
  /**
   * @param {string|number} id
   * @param {import('../models/types').UpdateAccessLevelRequest} data
   */
  updateAccessLevel(id, data = {}) {
    const rawUser = typeof window !== 'undefined'
      ? (localStorage.getItem('user') || sessionStorage.getItem('user'))
      : null
    let userId = '1'
    try {
      const parsed = JSON.parse(rawUser || '{}')
      if (parsed?.id) userId = String(parsed.id)
    } catch {}

    const payload = {
      name: data?.name !== undefined && data?.name !== null ? String(data.name).trim() : '',
      description: data?.description !== undefined && data?.description !== null ? String(data.description).trim() : '',
      modifiedBy: data?.modifiedBy !== undefined && data?.modifiedBy !== null ? String(data.modifiedBy) : userId,
      modifiedDate: null
    }
    return apiClient.put(`/AccessLevel/${id}`, payload)
  },
  deleteAccessLevel(id) {
    return apiClient.delete(`/AccessLevel/${id}`)
  }
}
