import apiClient from './api.js'

// export const JobOrderService = {
//   getJobOrders() {
//     return apiClient.get('/JobOrders')
//   },
//   /**
//    * Query job orders filtered by status and/or date window
//    * @param {{ status?: string, dateFrom?: string, dateTo?: string, fromDate?: string, toDate?: string }} [params]
//    */
//   getJobOrdersByStatusDate(params) {
//     return apiClient.get('/JobOrders/status-date', { params })
//   },
//   getJobOrderById(id) {
//     return apiClient.get(`/JobOrders/${id}`)
//   },
//   /**
//    * @param {import('../models/types').CreateJobOrderRequest} data 
//    */
//   createJobOrder(data) {
//     return apiClient.post('/JobOrders', data)
//   },
//   /**
//    * @param {string|number} id 
//    * @param {import('../models/types').UpdateJobOrderRequest} data 
//    */
//   updateJobOrder(id, data) {
//     return apiClient.put(`/JobOrders/${id}`, data)
//   },
//   deleteJobOrder(id) {
//     return apiClient.delete(`/JobOrders/${id}`)
//   }
// }
// Gene - Nov 5, 2026: Added getJobOrderImage(id) to fetch Job Order photos from GET /api/JobOrders/{id}/GetJobOrderImage
export const JobOrderService = {
  getJobOrders() {
    return apiClient.get('/JobOrders')
  },
  /**
   * Query job orders filtered by status and/or date window
   * @param {{ status?: string, dateFrom?: string, dateTo?: string, fromDate?: string, toDate?: string }} [params]
   */
  getJobOrdersByStatusDate(params) {
    return apiClient.get('/JobOrders/status-date', { params })
  },
  getJobOrderById(id) {
    return apiClient.get(`/JobOrders/${id}`)
  },
  /**
   * Fetch binary / base64 image files for a Job Order
   * @param {string|number} id
   */
  getJobOrderImage(id) {
    return apiClient.get(`/JobOrders/${id}/GetJobOrderImage`)
  },
  /**
   * @param {import('../models/types').CreateJobOrderRequest} data 
   */
  createJobOrder(data) {
    return apiClient.post('/JobOrders', data)
  },
  /**
   * @param {string|number} id 
   * @param {import('../models/types').UpdateJobOrderRequest|FormData} data 
   */
  /*
  updateJobOrder(id, data) {
    return apiClient.put(`/JobOrders/${id}`, data)
  },
  */
  // Gene - Nov 5, 2026: Pass multipart/form-data header when updating Job Order with FormData payload to prevent 415 error
  updateJobOrder(id, data, config = {}) {
    if (typeof FormData !== 'undefined' && data instanceof FormData) {
      return apiClient.put(`/JobOrders/${id}`, data, {
        ...config,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(config && config.headers)
        }
      })
    }
    return apiClient.put(`/JobOrders/${id}`, data, config)
  },
  deleteJobOrder(id) {
    return apiClient.delete(`/JobOrders/${id}`)
  }
}
