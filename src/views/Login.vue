<template>
  <div class="card shadow-lg border-0 rounded-4 p-4 p-sm-5 bg-body" style="width: 100%; max-width: 420px;">
    <div class="text-center mb-4">
      <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3 shadow-sm p-2" style="width: 64px; height: 64px;">
        <img src="/logo.png" alt="Switch Fiber Logo" style="width: 40px; height: 40px; object-fit: contain;" />
      </div>
      <h2 class="fw-bolder text-body mb-1">Switch Fiber</h2>
      <p class="small text-secondary fw-medium">Distributed Fiber Network Management</p>
    </div>

    <!-- Error Alert Banner -->
    <div v-if="errorMessage" class="alert alert-danger d-flex align-items-center rounded-3 p-2.5 mb-3 small" role="alert">
      <i class="pi pi-exclamation-triangle me-2 fs-5 flex-shrink-0"></i>
      <div>{{ errorMessage }}</div>
    </div>

    <!-- Informational Banner (password reset feedback) -->
    <div v-if="infoMessage" class="alert alert-info d-flex align-items-center rounded-3 p-2.5 mb-3 small" role="status">
      <i class="pi pi-info-circle me-2 fs-5 flex-shrink-0"></i>
      <div>{{ infoMessage }}</div>
    </div>

    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label for="usernameOrEmail" class="form-label small fw-semibold text-secondary">Username or Email</label>
        <div class="login-field-group border rounded-3 bg-body d-flex align-items-center px-3">
          <i class="pi pi-user text-secondary flex-shrink-0 me-2" style="font-size: 0.95rem;"></i>
          <InputText 
            v-model="usernameOrEmail" 
            id="usernameOrEmail" 
            type="text" 
            required 
            class="form-control border-0 shadow-none bg-transparent ps-0 py-2 w-100" 
            placeholder="Enter username or email" 
          />
        </div>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label small fw-semibold text-secondary">Password</label>
        <div class="login-field-group border rounded-3 bg-body d-flex align-items-center px-3">
          <i class="pi pi-lock text-secondary flex-shrink-0 me-2" style="font-size: 0.95rem;"></i>
          <Password 
            v-model="password" 
            inputId="password"
            :toggleMask="true" 
            :feedback="false"
            required 
            class="flex-grow-1 border-0 shadow-none bg-transparent"
            inputClass="form-control border-0 shadow-none bg-transparent ps-0 py-2 w-100"
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
          <button type="button" @click="handleForgotPassword" :disabled="isResetting" class="btn btn-link p-0 border-0 shadow-none align-baseline fw-semibold text-primary text-decoration-none small">
            {{ isResetting ? 'Sending…' : 'Forgot password?' }}
          </button>
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
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import apiClient from '../services/api'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Checkbox from 'primevue/checkbox'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const usernameOrEmail = ref('')
const password = ref('')
const rememberMe = ref(true)
const isLoading = ref(false)
const isResetting = ref(false)
const errorMessage = ref(null)
const infoMessage = ref(null)

const handleLogin = async () => {
  if (!usernameOrEmail.value || !password.value) return

  isLoading.value = true
  errorMessage.value = null
  infoMessage.value = null
  try {
    await authStore.login({
      usernameOrEmail: usernameOrEmail.value,
      password: password.value,
      rememberMe: rememberMe.value
    })
    // Return the user to the screen the guard bounced them off of.
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/dashboard'
    router.push(redirect.startsWith('/') ? redirect : '/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'Failed to authenticate. Please check your credentials.'
  } finally {
    isLoading.value = false
  }
}

const handleForgotPassword = async () => {
  errorMessage.value = null
  infoMessage.value = null

  const entered = usernameOrEmail.value.trim()
  if (!entered.includes('@')) {
    infoMessage.value = 'Enter your account email address above, then tap "Forgot password?" again.'
    return
  }

  isResetting.value = true
  try {
    await apiClient.post('/Auth/request-password-reset', { email: entered })
  } catch {
    // Deliberately not surfaced: a per-address error would reveal which
    // addresses have accounts.
  } finally {
    isResetting.value = false
    infoMessage.value = `If an account exists for ${entered}, a reset link is on its way. Check your inbox.`
  }
}
</script>

<style scoped>
.login-field-group {
  height: 44px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.login-field-group:focus-within {
  border-color: var(--bs-primary) !important;
  box-shadow: 0 0 0 3px rgba(231, 76, 90, 0.18) !important;
}

:deep(.login-field-group .p-password),
:deep(.login-field-group .p-password-input) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}

.login-field-group .form-control,
.login-field-group .form-control:focus,
.login-field-group .p-inputtext,
.login-field-group .p-inputtext:focus,
.login-field-group input,
.login-field-group input:focus {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}
</style>
