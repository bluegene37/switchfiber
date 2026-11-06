// Gene - Nov 5, 2026: REST API service for /api/PaymentMethods
import apiClient from './api.js'

/*
export const PaymentMethodService = {
  getPaymentMethods(params) {
    return apiClient.get('/PaymentMethods', { params })
  },
  getPaymentMethodById(id) {
    return apiClient.get(`/PaymentMethods/${id}`)
  },
  createPaymentMethod(data) {
    return apiClient.post('/PaymentMethods', data)
  },
  updatePaymentMethod(id, data) {
    return apiClient.put(`/PaymentMethods/${id}`, data)
  },
  deletePaymentMethod(id, params) {
    return apiClient.delete(`/PaymentMethods/${id}`, { params })
  }
}
*/

// Gene - Nov 6, 2026: Standard default payment methods catalog for Philippine ISP billing & payments
export const DEFAULT_PAYMENT_METHODS = [
  {
    name: 'Cash',
    description: 'Direct cash payment received over the counter or collected by field technician/agent'
  },
  {
    name: 'GCash',
    description: 'GCash e-wallet payment via QR code, payment link, or direct mobile number transfer'
  },
  {
    name: 'Maya',
    description: 'Maya (formerly PayMaya) e-wallet, Maya app, and national QR Ph standard payment'
  },
  {
    name: 'Bank Transfer',
    description: 'Online or over-the-counter bank deposit (BDO, BPI, UnionBank, Metrobank, RCBC)'
  },
  {
    name: 'Credit / Debit Card',
    description: 'Visa / Mastercard / JCB credit or debit card payment via POS terminal or online gateway'
  },
  {
    name: 'Check',
    description: 'Corporate check or manager\'s check payment for business and enterprise accounts'
  },
  {
    name: 'Bayad Center / OTC',
    description: 'Authorized over-the-counter payment partners (7-Eleven, Bayad Center, Cebuana Lhuillier, M Lhuillier)'
  }
]

// Gene - Nov 6, 2026: Extended PaymentMethodService with seedDefaultPaymentMethods helper
export const PaymentMethodService = {
  getPaymentMethods(params) {
    return apiClient.get('/PaymentMethods', { params })
  },
  getPaymentMethodById(id) {
    return apiClient.get(`/PaymentMethods/${id}`)
  },
  createPaymentMethod(data) {
    return apiClient.post('/PaymentMethods', data)
  },
  updatePaymentMethod(id, data) {
    return apiClient.put(`/PaymentMethods/${id}`, data)
  },
  deletePaymentMethod(id, params) {
    return apiClient.delete(`/PaymentMethods/${id}`, { params })
  },
  async seedDefaultPaymentMethods(userId = 1) {
    const res = await this.getPaymentMethods()
    const existing = Array.isArray(res?.data) ? res.data : []
    const created = []

    for (const item of DEFAULT_PAYMENT_METHODS) {
      const match = existing.find(e =>
        String(e.name || '').trim().toLowerCase() === item.name.trim().toLowerCase()
      )
      if (!match) {
        const postRes = await this.createPaymentMethod({
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

export default PaymentMethodService
