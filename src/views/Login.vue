<template>
  <div class="card shadow-lg border-0 rounded-4 p-4 p-sm-5" style="width: 100%; max-width: 400px;">
    <div class="text-center mb-4">
      <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10 mb-3 shadow-sm" style="width: 64px; height: 64px;">
        <i class="pi pi-bolt text-primary fs-2"></i>
      </div>
      <h2 class="fw-bolder text-dark mb-1">Switch Fiber</h2>
      <p class="small text-secondary fw-medium">Distributed Fiber Network Management</p>
    </div>

    <form @submit.prevent="handleLogin">
      <div class="mb-3">
        <label for="email" class="form-label small fw-semibold text-secondary">Email Address</label>
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">
            <i class="pi pi-envelope text-secondary"></i>
          </span>
          <InputText 
            v-model="email" 
            id="email" 
            type="email" 
            required 
            class="form-control border-start-0 ps-0" 
            placeholder="admin@switchfiber.com" 
          />
        </div>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label small fw-semibold text-secondary">Password</label>
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0">
            <i class="pi pi-lock text-secondary"></i>
          </span>
          <Password 
            v-model="password" 
            inputId="password"
            :toggleMask="true" 
            :feedback="false"
            required 
            inputClass="form-control border-start-0 ps-0 w-100"
            class="w-100 d-flex"
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
          <a href="#" class="fw-semibold text-primary text-decoration-none">
            Forgot password?
          </a>
        </div>
      </div>

      <button 
        type="submit" 
        :disabled="isLoading" 
        class="btn btn-primary w-100 py-2 fw-bold shadow-sm"
      >
        <span v-if="!isLoading">Sign in</span>
        <i v-else class="pi pi-spinner pi-spin"></i>
      </button>
    </form>
    
    <div class="mt-4 text-center small text-muted">
      <p class="mb-0" style="font-size: 0.75rem;">Protected by reCAPTCHA and subject to the Switch Fiber Privacy Policy.</p>
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

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)

const handleLogin = async () => {
  if (!email.value || !password.value) return
  
  isLoading.value = true
  try {
    await authStore.login({ email: email.value, password: password.value })
    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed', error)
  } finally {
    isLoading.value = false
  }
}
</script>
