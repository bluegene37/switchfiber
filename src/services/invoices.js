import apiClient from './api'

export const InvoiceService = {
  getInvoices() {
    return apiClient.get('/Invoices')
  },
  getInvoiceById(id) {
    return apiClient.get(`/Invoices/${id}`)
  },
  /**
   * @param {import('../models/types').InvoiceDto} data
   */
  createInvoice(data) {
    return apiClient.post('/Invoices', data)
  },
  /**
   * @param {string|number} id
   * @param {import('../models/types').InvoiceDto} data
   */
  updateInvoice(id, data) {
    return apiClient.put(`/Invoices/${id}`, data)
  },
  deleteInvoice(id) {
    return apiClient.delete(`/Invoices/${id}`)
  },
  // Singular /api/Invoice endpoints support
  getInvoiceSingular() {
    return apiClient.get('/Invoice')
  },
  getInvoiceSingularById(id) {
    return apiClient.get(`/Invoice/${id}`)
  },
  createInvoiceSingular(data) {
    return apiClient.post('/Invoice', data)
  },
  updateInvoiceSingular(id, data) {
    return apiClient.put(`/Invoice/${id}`, data)
  },
  deleteInvoiceSingular(id) {
    return apiClient.delete(`/Invoice/${id}`)
  }
}
