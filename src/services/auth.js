import apiClient from './api'

export const AuthService = {
  /**
   * @param {import('../models/types').RequestPasswordResetRequest} data
   */
  requestPasswordReset(data) {
    return apiClient.post('/Auth/request-password-reset', data)
  },
  /**
   * @param {import('../models/types').ResetPasswordRequest} data
   */
  resetPassword(data) {
    return apiClient.post('/Auth/reset-password', data)
  }
}
