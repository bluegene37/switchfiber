import { defineStore } from 'pinia'
import { ref } from 'vue'
import { BillingDetailService } from '../services/billingDetails'

export const useBillingDetailStore = defineStore('billingDetails', () => {
  const billingDetails = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchBillingDetails = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await BillingDetailService.getBillingDetails()
      billingDetails.value = response || []
    } catch (err) {
      error.value = err.message || 'Failed to fetch billing details'
    } finally {
      isLoading.value = false
    }
  }

  return { billingDetails, isLoading, error, fetchBillingDetails }
})
