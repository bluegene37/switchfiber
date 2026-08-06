<template>
  <div class="d-flex flex-column gap-4">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">System & Account Settings</h1>
        <p class="small text-secondary mt-1 mb-0">Customize application theme colors, manage user profile, security, and system preferences.</p>
      </div>
    </div>

    <!-- Main Content Container -->
    <div class="row g-4">
      <!-- Left Column: Navigation Tabs & Profile Overview Card -->
      <div class="col-12 col-lg-4">
        <!-- Profile Card -->
        <div class="card shadow-sm border-0 rounded-4 p-4 text-center mb-4 bg-body">
          <div class="position-relative d-inline-block mx-auto mb-3">
            <div 
              class="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center fw-bold shadow-sm mx-auto border border-3 border-white" 
              style="width: 88px; height: 88px; font-size: 2.25rem;"
            >
              {{ userInitial }}
            </div>
            <span class="position-absolute bottom-0 end-0 p-2 bg-success border border-light rounded-circle" title="Online"></span>
          </div>
          <h5 class="fw-bold text-body mb-1">{{ userDisplayName }}</h5>
          <p class="small text-secondary mb-3">{{ user?.email || 'admin@switchfiber.com' }}</p>
          <div class="d-inline-flex align-items-center gap-1.5 px-3 py-1 bg-primary bg-opacity-10 text-primary rounded-pill small fw-semibold mx-auto">
            <i class="pi pi-shield"></i> {{ userRole }}
          </div>
        </div>

        <!-- Quick Navigation -->
        <div class="list-group shadow-sm border-0 rounded-4 overflow-hidden">
          <button 
            @click="activeSection = 'theme'" 
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
            :class="{ 'bg-primary text-white fw-bold': activeSection === 'theme' }"
          >
            <div class="d-flex align-items-center gap-3">
              <i class="pi pi-palette fs-5"></i>
              <span>Theme & Appearance</span>
            </div>
            <i class="pi pi-chevron-right small"></i>
          </button>
          
          <button 
            @click="activeSection = 'profile'" 
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
            :class="{ 'bg-primary text-white fw-bold': activeSection === 'profile' }"
          >
            <div class="d-flex align-items-center gap-3">
              <i class="pi pi-user fs-5"></i>
              <span>Profile Information</span>
            </div>
            <i class="pi pi-chevron-right small"></i>
          </button>

          <button 
            @click="activeSection = 'security'" 
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
            :class="{ 'bg-primary text-white fw-bold': activeSection === 'security' }"
          >
            <div class="d-flex align-items-center gap-3">
              <i class="pi pi-lock fs-5"></i>
              <span>Security & Password</span>
            </div>
            <i class="pi pi-chevron-right small"></i>
          </button>

          <button 
            @click="activeSection = 'system'" 
            class="list-group-item list-group-item-action d-flex align-items-center justify-content-between p-3 border-0"
            :class="{ 'bg-primary text-white fw-bold': activeSection === 'system' }"
          >
            <div class="d-flex align-items-center gap-3">
              <i class="pi pi-server fs-5"></i>
              <span>API & System Info</span>
            </div>
            <i class="pi pi-chevron-right small"></i>
          </button>
        </div>
      </div>

      <!-- Right Column: Settings Content Panes -->
      <div class="col-12 col-lg-8">

        <!-- 1. Theme & Appearance Section -->
        <div v-if="activeSection === 'theme'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-palette fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">Theme & Interface Appearance</h5>
              <p class="small text-secondary mb-0">Switch between Light and Dark mode for optimal viewing comfort.</p>
            </div>
          </div>

          <!-- Active Brand Theme Badge -->
          <div class="p-3 rounded-3 border bg-body-tertiary mb-4 d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <span 
                class="rounded-circle d-inline-block border border-2 border-white shadow-sm" 
                style="width: 32px; height: 32px; background-color: #e74c5a;"
              ></span>
              <div>
                <div class="fw-bold small text-body">SwitchFiber Warm Rose Theme</div>
                <div class="text-secondary small" style="font-size: 0.75rem;">Eye-Friendly Warm Rose Palette (#e74c5a)</div>
              </div>
            </div>
            <span class="badge bg-primary rounded-pill px-3 py-2">
              <i class="pi pi-check me-1"></i> Active Theme
            </span>
          </div>

          <!-- Mode Toggle -->
          <h6 class="fw-bold text-body mb-3 border-top pt-3">Interface Mode (Light / Dark)</h6>
          <div class="p-3 rounded-3 border bg-body-tertiary d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <i :class="isDark ? 'pi pi-moon text-warning fs-4' : 'pi pi-sun text-warning fs-4'"></i>
              <div>
                <div class="fw-bold small text-body">{{ isDark ? 'Dark Mode' : 'Light Mode' }}</div>
                <div class="text-secondary small">Toggle between Light and Dark themes anytime</div>
              </div>
            </div>
            <button 
              @click="toggleTheme" 
              class="btn btn-primary btn-sm px-4 fw-bold rounded-pill shadow-sm"
            >
              Switch to {{ isDark ? 'Light Mode' : 'Dark Mode' }}
            </button>
          </div>
        </div>

        <!-- 2. Profile Information Section -->
        <div v-if="activeSection === 'profile'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-user fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">Profile Information</h5>
              <p class="small text-secondary mb-0">Update your account personal information and contact details.</p>
            </div>
          </div>

          <!-- Alert Notification Banner -->
          <div v-if="profileMsg.text" :class="['alert d-flex align-items-center rounded-3 p-3 mb-3 small', profileMsg.isError ? 'alert-danger' : 'alert-success']" role="alert">
            <i :class="['pi me-2 fs-5 flex-shrink-0', profileMsg.isError ? 'pi-exclamation-triangle' : 'pi-check-circle']"></i>
            <div>{{ profileMsg.text }}</div>
          </div>

          <form @submit.prevent="saveProfile">
            <div class="row g-3 mb-3">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Username</label>
                <InputText v-model="profileForm.username" class="w-100 p-inputtext-sm" required />
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Email Address</label>
                <InputText v-model="profileForm.email" type="email" class="w-100 p-inputtext-sm" required />
              </div>
            </div>

            <div class="row g-3 mb-3">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">First Name</label>
                <InputText v-model="profileForm.fname" class="w-100 p-inputtext-sm" />
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Last Name</label>
                <InputText v-model="profileForm.lname" class="w-100 p-inputtext-sm" />
              </div>
            </div>

            <div class="mb-4">
              <label class="form-label small fw-semibold text-secondary">Contact Number</label>
              <InputText v-model="profileForm.contactnumber" class="w-100 p-inputtext-sm" />
            </div>

            <div class="d-flex justify-content-end gap-2">
              <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm d-flex align-items-center gap-2" :disabled="isSavingProfile">
                <span v-if="isSavingProfile" class="spinner-border spinner-border-sm" role="status"></span>
                <i v-else class="pi pi-check"></i>
                <span>{{ isSavingProfile ? 'Saving...' : 'Save Profile Changes' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 3. Security Section -->
        <div v-else-if="activeSection === 'security'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-lock fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">Security & Password</h5>
              <p class="small text-secondary mb-0">Ensure your account security by updating your account password.</p>
            </div>
          </div>

          <!-- Alert Notification Banner -->
          <div v-if="securityMsg.text" :class="['alert d-flex align-items-center rounded-3 p-3 mb-3 small', securityMsg.isError ? 'alert-danger' : 'alert-success']" role="alert">
            <i :class="['pi me-2 fs-5 flex-shrink-0', securityMsg.isError ? 'pi-exclamation-triangle' : 'pi-check-circle']"></i>
            <div>{{ securityMsg.text }}</div>
          </div>

          <form @submit.prevent="updatePassword">
            <div class="mb-3">
              <label class="form-label small fw-semibold text-secondary">Current Password</label>
              <Password v-model="securityForm.currentPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" required />
            </div>

            <div class="row g-3 mb-4">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">New Password</label>
                <Password v-model="securityForm.newPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" required />
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Confirm New Password</label>
                <Password v-model="securityForm.confirmPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" required />
              </div>
            </div>

            <div class="d-flex justify-content-end">
              <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm d-flex align-items-center gap-2" :disabled="isUpdatingPassword">
                <span v-if="isUpdatingPassword" class="spinner-border spinner-border-sm" role="status"></span>
                <i v-else class="pi pi-lock-open"></i>
                <span>{{ isUpdatingPassword ? 'Updating...' : 'Update Password' }}</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 4. System & API Info -->
        <div v-else-if="activeSection === 'system'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-server fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">API & System Configuration</h5>
              <p class="small text-secondary mb-0">Backend environment parameters and system build information.</p>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-semibold text-secondary">Target API Endpoint Host</label>
            <InputText :modelValue="apiUrl" readonly class="w-100 p-inputtext-sm bg-body-tertiary" />
          </div>

          <div class="p-3 rounded-3 bg-body-tertiary border text-secondary small">
            <div class="row g-2">
              <div class="col-6"><strong>Application:</strong> Switch Fiber Management Platform</div>
              <div class="col-6"><strong>Version:</strong> v1.2.0-production</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import apiClient from '../services/api'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

const authStore = useAuthStore()
const { isDark, toggleTheme } = useTheme()
const toast = useToast()

const activeSection = ref('profile')
const user = computed(() => authStore.user)

const apiUrl = ref(import.meta.env.VITE_API_URL || 'https://103.249.198.43:8090')

const isSavingProfile = ref(false)
const isUpdatingPassword = ref(false)
const profileMsg = ref({ text: '', isError: false })
const securityMsg = ref({ text: '', isError: false })

const userDisplayName = computed(() => {
  if (!user.value) return 'Admin User'
  if (user.value.fname || user.value.lname) return `${user.value.fname || ''} ${user.value.lname || ''}`.trim()
  if (user.value.username) return user.value.username
  return user.value.email || 'Admin User'
})

const userInitial = computed(() => {
  return (userDisplayName.value || 'A').charAt(0).toUpperCase()
})

const userRole = computed(() => {
  if (!user.value) return 'Super Admin'
  return user.value.role || (user.value.accesslevel_id === 1 ? 'Super Admin' : 'User')
})

const profileForm = ref({
  username: user.value?.username || '',
  email: user.value?.email || '',
  fname: user.value?.fname || '',
  lname: user.value?.lname || '',
  contactnumber: user.value?.contactnumber || ''
})

const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Load full user record from API on mount to sync profile details
const loadUserProfile = async () => {
  if (!user.value || !user.value.id) return
  try {
    const res = await apiClient.get(`/Users/${user.value.id}`).catch(() => null)
    if (res && (res.id || res.username)) {
      profileForm.value.username = res.username || user.value.username || ''
      profileForm.value.email = res.userEmail || res.email || user.value.email || ''
      profileForm.value.fname = res.fname || res.firstName || user.value.fname || ''
      profileForm.value.lname = res.lname || res.lastName || user.value.lname || ''
      profileForm.value.contactnumber = res.contactnumber || res.contactNumber || user.value.contactnumber || ''
    }
  } catch (err) {
    console.warn('Could not fetch latest user details:', err)
  }
}

onMounted(() => {
  loadUserProfile()
})

const saveProfile = async () => {
  profileMsg.value = { text: '', isError: false }
  if (!profileForm.value.username.trim() || !profileForm.value.email.trim()) {
    profileMsg.value = { text: 'Username and Email address are required.', isError: true }
    return
  }

  isSavingProfile.value = true
  try {
    const userId = Number(user.value?.id || 1)
    const existingUser = await apiClient.get(`/Users/${userId}`).catch(() => null)

    const updatePayload = {
      ...(existingUser || {}),
      id: userId,
      username: profileForm.value.username.trim(),
      fname: profileForm.value.fname.trim(),
      lname: profileForm.value.lname.trim(),
      name: `${profileForm.value.fname.trim()} ${profileForm.value.lname.trim()}`.trim(),
      userEmail: profileForm.value.email.trim(),
      email: profileForm.value.email.trim(),
      contactNumber: profileForm.value.contactnumber.trim(),
      contactnumber: profileForm.value.contactnumber.trim(),
      // Form Audit Trail Standard: UPDATE (PUT) populates modifiedBy with logged-in user id
      modifiedBy: userId
    }

    await apiClient.put(`/Users/${userId}`, updatePayload).catch(async () => {
      return await apiClient.put('/Users', updatePayload)
    })

    // Update authStore reactivity & storage for instant application UI refresh
    if (authStore.user) {
      authStore.user.username = updatePayload.username
      authStore.user.fname = updatePayload.fname
      authStore.user.lname = updatePayload.lname
      authStore.user.email = updatePayload.email
      authStore.user.contactnumber = updatePayload.contactnumber

      const storage = localStorage.getItem('token') ? localStorage : sessionStorage
      storage.setItem('user', JSON.stringify(authStore.user))
    }

    profileMsg.value = { text: 'Profile information updated successfully!', isError: false }
    toast.add({ severity: 'success', summary: 'Success', detail: 'Profile updated successfully!', life: 4000 })
  } catch (err) {
    console.error('Error saving profile:', err)
    profileMsg.value = { text: err.message || 'Failed to update profile. Please try again.', isError: true }
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to update profile.', life: 4000 })
  } finally {
    isSavingProfile.value = false
  }
}

const updatePassword = async () => {
  securityMsg.value = { text: '', isError: false }

  if (!securityForm.value.currentPassword) {
    securityMsg.value = { text: 'Please enter your current password.', isError: true }
    return
  }
  if (!securityForm.value.newPassword) {
    securityMsg.value = { text: 'Please enter a new password.', isError: true }
    return
  }
  if (securityForm.value.newPassword.length < 3) {
    securityMsg.value = { text: 'New password must be at least 3 characters long.', isError: true }
    return
  }
  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    securityMsg.value = { text: 'New password and confirmation password do not match.', isError: true }
    return
  }

  isUpdatingPassword.value = true
  try {
    const userId = Number(user.value?.id || 1)
    const existingUser = await apiClient.get(`/Users/${userId}`).catch(() => null)

    if (existingUser && existingUser.password && String(existingUser.password) !== String(securityForm.value.currentPassword)) {
      securityMsg.value = { text: 'Current password entered is incorrect.', isError: true }
      isUpdatingPassword.value = false
      return
    }

    const passwordPayload = {
      ...(existingUser || {}),
      id: userId,
      password: securityForm.value.newPassword,
      // Form Audit Trail Standard: UPDATE (PUT) populates modifiedBy with logged-in user id
      modifiedBy: userId
    }

    await apiClient.put(`/Users/${userId}`, passwordPayload).catch(async () => {
      return await apiClient.put('/Users', passwordPayload)
    })

    securityForm.value.currentPassword = ''
    securityForm.value.newPassword = ''
    securityForm.value.confirmPassword = ''

    securityMsg.value = { text: 'Password updated successfully!', isError: false }
    toast.add({ severity: 'success', summary: 'Password Changed', detail: 'Password updated successfully!', life: 4000 })
  } catch (err) {
    console.error('Error updating password:', err)
    securityMsg.value = { text: err.message || 'Failed to update password. Please try again.', isError: true }
    toast.add({ severity: 'error', summary: 'Error', detail: err.message || 'Failed to update password.', life: 4000 })
  } finally {
    isUpdatingPassword.value = false
  }
}
</script>

<style scoped>
.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>
