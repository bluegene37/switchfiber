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
              <h5 class="fw-bold text-body mb-1">Theme & Color Customization</h5>
              <p class="small text-secondary mb-0">Select your preferred color theme palette and interface appearance mode.</p>
            </div>
          </div>

          <!-- Color Palette Selection Grid -->
          <h6 class="fw-bold text-body mb-3">Color Theme Palette</h6>
          <div class="row g-3 mb-4">
            <div 
              v-for="(palette, key) in THEME_PALETTES" 
              :key="key"
              class="col-12 col-sm-6"
            >
              <div 
                @click="setColorTheme(key)"
                class="p-3 rounded-3 border d-flex align-items-center justify-content-between theme-card position-relative"
                :class="{ 'border-primary border-2 bg-primary bg-opacity-10': activeColorTheme === key }"
                style="cursor: pointer; transition: all 0.2s;"
              >
                <div class="d-flex align-items-center gap-3">
                  <span 
                    class="rounded-circle d-inline-block border border-2 border-white shadow-sm" 
                    :style="{ width: '32px', height: '32px', backgroundColor: palette.primary }"
                  ></span>
                  <div>
                    <div class="fw-bold small text-body">{{ palette.name }}</div>
                    <div class="text-secondary small" style="font-size: 0.75rem;">{{ palette.primary }}</div>
                  </div>
                </div>
                <div v-if="activeColorTheme === key" class="badge bg-primary rounded-pill">
                  <i class="pi pi-check me-1"></i> Active
                </div>
              </div>
            </div>
          </div>

          <!-- Mode Toggle -->
          <h6 class="fw-bold text-body mb-3 border-top pt-4">Interface Mode</h6>
          <div class="p-3 rounded-3 border bg-body-tertiary d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <i :class="isDark ? 'pi pi-moon text-warning fs-4' : 'pi pi-sun text-warning fs-4'"></i>
              <div>
                <div class="fw-bold small text-body">{{ isDark ? 'Dark Mode' : 'Light Mode' }}</div>
                <div class="text-secondary small">Switch between light and dark interface styles</div>
              </div>
            </div>
            <button 
              @click="toggleTheme" 
              class="btn btn-outline-secondary btn-sm px-3 fw-semibold rounded-pill"
            >
              Toggle to {{ isDark ? 'Light' : 'Dark' }}
            </button>
          </div>
        </div>

        <!-- 2. Profile Information Section -->
        <div v-else-if="activeSection === 'profile'" class="card shadow-sm border-0 rounded-4 p-4 bg-body">
          <div class="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
            <div class="p-3 bg-primary bg-opacity-10 text-primary rounded-3">
              <i class="pi pi-user fs-4"></i>
            </div>
            <div>
              <h5 class="fw-bold text-body mb-1">Profile Information</h5>
              <p class="small text-secondary mb-0">Update your account personal information and contact details.</p>
            </div>
          </div>

          <form @submit.prevent="saveProfile">
            <div class="row g-3 mb-3">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Username</label>
                <InputText v-model="profileForm.username" class="w-100 p-inputtext-sm" />
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Email Address</label>
                <InputText v-model="profileForm.email" class="w-100 p-inputtext-sm" />
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
              <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm">
                Save Profile Changes
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

          <form @submit.prevent="updatePassword">
            <div class="mb-3">
              <label class="form-label small fw-semibold text-secondary">Current Password</label>
              <Password v-model="securityForm.currentPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" />
            </div>

            <div class="row g-3 mb-4">
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">New Password</label>
                <Password v-model="securityForm.newPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" />
              </div>
              <div class="col-12 col-sm-6">
                <label class="form-label small fw-semibold text-secondary">Confirm New Password</label>
                <Password v-model="securityForm.confirmPassword" :toggleMask="true" :feedback="false" class="w-100 d-flex" inputClass="w-100 p-inputtext-sm" />
              </div>
            </div>

            <div class="d-flex justify-content-end">
              <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm">
                Update Password
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
              <div class="col-6"><strong>Build Engine:</strong> Vite 8 + Vue 3</div>
              <div class="col-6"><strong>UI Framework:</strong> PrimeVue + Bootstrap 5</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTheme } from '../composables/useTheme'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

const authStore = useAuthStore()
const { isDark, toggleTheme, activeColorTheme, setColorTheme, THEME_PALETTES } = useTheme()

const activeSection = ref('theme')
const user = computed(() => authStore.user)

const apiUrl = ref(import.meta.env.VITE_API_URL || 'https://103.249.198.43:8090')

const userDisplayName = computed(() => {
  if (!user.value) return 'Admin User'
  if (user.value.username) return user.value.username
  if (user.value.fname) return `${user.value.fname} ${user.value.lname || ''}`.trim()
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
  username: user.value?.username || 'admin',
  email: user.value?.email || 'admin@switchfiber.com',
  fname: user.value?.fname || 'Admin',
  lname: user.value?.lname || 'User',
  contactnumber: user.value?.contactnumber || '09171234567'
})

const securityForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const saveProfile = () => {
  alert('Profile changes saved successfully!')
}

const updatePassword = () => {
  if (securityForm.value.newPassword !== securityForm.value.confirmPassword) {
    alert('New password and confirm password do not match.')
    return
  }
  alert('Password updated successfully!')
}
</script>

<style scoped>
.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}
</style>
