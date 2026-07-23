<template>
  <div class="card shadow-lg border-0 rounded-4 p-4 p-sm-5" style="width: 100%; max-width: 420px;">
    <div class="text-center mb-4">
      <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3 shadow-sm p-2" style="width: 64px; height: 64px;">
        <img src="/favicon.svg" alt="Switch Fiber Logo" style="width: 40px; height: 40px;" />
      </div>
      <h2 class="fw-bolder text-dark mb-1">Switch Fiber</h2>
      <p class="small text-secondary fw-medium">Distributed Fiber Network Management</p>
    </div>

    <!-- Error Alert Banner -->
    <div v-if="errorMessage" class="alert alert-danger d-flex align-items-center rounded-3 p-2.5 mb-3 small" role="alert">
      <i class="pi pi-exclamation-triangle me-2 fs-5 flex-shrink-0"></i>
      <div>{{ errorMessage }}</div>
    </div>

    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label for="usernameOrEmail" class="form-label small fw-semibold text-secondary">Username or Email</label>
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">
            <i class="pi pi-user text-secondary"></i>
          </span>
          <InputText 
            v-model="usernameOrEmail" 
            id="usernameOrEmail" 
            type="text" 
            required 
            class="form-control border-start-0 ps-0" 
            placeholder="Enter username or email" 
          />
        </div>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label small fw-semibold text-secondary">Password</label>
        <div class="input-group flex-nowrap">
          <span class="input-group-text bg-white border-end-0">
            <i class="pi pi-lock text-secondary"></i>
          </span>
          <Password 
            v-model="password" 
            inputId="password"
            :toggleMask="true" 
            :feedback="false"
            required 
            class="flex-grow-1"
            inputClass="form-control border-start-0 ps-0 rounded-start-0 w-100"
            placeholder="••••••••" 
          />
        </div>
      </div>

      <div class="d-flex align-items-center justify-content-between mt-3 mb-4">
        <div class="d-flex align-items-center">
          <Checkbox v-model="rememberMe" inputId="remember-me" :binary="true" />
          <label for="remember-me" class="ms-2 small text-secondary" style="cursor: pointer;">
            Remember me
          </label>
        </div>
        <div class="small">
          <a href="#" @click.prevent="alert('Please contact your administrator to reset your password.')" class="fw-semibold text-primary text-decoration-none">
            Forgot password?
          </a>
        </div>
      </div>

      <button 
        type="submit" 
        :disabled="isLoading" 
        class="btn btn-primary w-100 py-2.5 fw-bold shadow-sm"
      >
        <span v-if="!isLoading">Sign in</span>
        <span v-else class="d-flex align-items-center justify-content-center gap-2">
          <i class="pi pi-spinner pi-spin"></i> Authenticating...
        </span>
      </button>
    </form>
    
    <div class="mt-4 text-center small text-muted">
      <p class="mb-0" style="font-size: 0.75rem;">Switch Fiber Network Operations &copy; 2026</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'

const router = useRouter()
const authStore = useAuthStore()

const usernameOrEmail = ref('')
const password = ref('')
const rememberMe = ref(true)
const isLoading = ref(false)
const errorMessage = ref(null)

const handleLogin = async () => {
  if (!usernameOrEmail.value || !password.value) return
  
  isLoading.value = true
  errorMessage.value = null
  try {
    await authStore.login({
      usernameOrEmail: usernameOrEmail.value,
      password: password.value,
      rememberMe: rememberMe.value
    })
    router.push('/dashboard')
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = error.message || 'Failed to authenticate. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}
</script>
