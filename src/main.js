import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import ToastService from 'primevue/toastservice'

import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)

// Global Error Boundary & Logging
app.config.errorHandler = (err, instance, info) => {
  console.error('[SwitchFiber Fault Guard]:', err, info)
}

app.use(createPinia())
app.use(router)
app.use(ToastService)
app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.dark',
            cssLayer: {
                name: 'primevue',
                order: 'bootstrap, primevue'
            }
        }
    }
})

app.mount('#app')
