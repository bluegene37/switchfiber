// Gene - Nov 5, 2026: REST API service for /api/PaymentTypes
import apiClient from './api.js'

/*
export const PaymentTypeService = {
  getPaymentTypes(params) {
    return apiClient.get('/PaymentTypes', { params })
  },
  getPaymentTypeById(id) {
    return apiClient.get(`/PaymentTypes/${id}`)
  },
  createPaymentType(data) {
    return apiClient.post('/PaymentTypes', data)
  },
  updatePaymentType(id, data) {
    return apiClient.put(`/PaymentTypes/${id}`, data)
  },
  deletePaymentType(id, params) {
    return apiClient.delete(`/PaymentTypes/${id}`, { params })
  }
}
*/

// Gene - Nov 7, 2026: Standard default payment types catalog for Philippine ISP billing & fee classification
export const DEFAULT_PAYMENT_TYPES = [
  {
    name: 'Monthly Subscription',
    description: 'Recurring monthly internet fiber plan subscription fee'
  },
  {
    name: 'Installation Fee',
    description: 'One-time fiber optical installation, modem setup, and activation fee'
  },
  {
    name: 'Reconnection Fee',
    description: 'Line reconnection fee for temporarily suspended accounts'
  },
  {
    name: 'Device / Router Fee',
    description: 'Payment for additional mesh Wi-Fi nodes, routers, or optical network terminals'
  },
  {
    name: 'Advance Payment',
    description: 'Advance billing credit or security deposit applied to subscriber account'
  }
]

// Gene - Nov 7, 2026: Extended PaymentTypeService with seedDefaultPaymentTypes helper
export const PaymentTypeService = {
  getPaymentTypes(params) {
    return apiClient.get('/PaymentTypes', { params })
  },
  getPaymentTypeById(id) {
    return apiClient.get(`/PaymentTypes/${id}`)
  },
  createPaymentType(data) {
    return apiClient.post('/PaymentTypes', data)
  },
  updatePaymentType(id, data) {
    return apiClient.put(`/PaymentTypes/${id}`, data)
  },
  deletePaymentType(id, params) {
    return apiClient.delete(`/PaymentTypes/${id}`, { params })
  },
  async seedDefaultPaymentTypes(userId = 1) {
    const res = await this.getPaymentTypes()
    const existing = Array.isArray(res?.data) ? res.data : []
    const created = []

    for (const item of DEFAULT_PAYMENT_TYPES) {
      const match = existing.find(e =>
        String(e.name || '').trim().toLowerCase() === item.name.trim().toLowerCase()
      )
      if (!match) {
        const postRes = await this.createPaymentType({
          name: item.name,
          description: item.description,
          createdBy: Number(userId) || 1,
          modifiedBy: Number(userId) || 1
        })
        created.push(postRes?.data || item)
      }
    }
    return { existing, created, total: existing.length + created.length }
  }
}

export default PaymentTypeService
