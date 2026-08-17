// Throwaway harness: renders the real Sidebar + FileMaintenance view against
// stubbed /api responses, so the Disconnection menu and its RadiusUser list can be
// checked without logging into the live backend.
import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory, RouterView } from 'vue-router'
import PrimeVue from 'primevue/config'
import Aura from '@primevue/themes/aura'

import 'bootstrap/dist/css/bootstrap.min.css'

import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'

import Sidebar from '../src/components/Sidebar.vue'
import FileMaintenance from '../src/views/FileMaintenance.vue'
import '../src/style.css'

// A session the auth store will accept, so the sidebar fetches permissions.
sessionStorage.setItem('user', JSON.stringify({ id: 1, username: 'harness', accesslevel_id: 1 }))

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/disconnection' },
    { path: '/disconnection', name: 'disconnection', component: FileMaintenance },
    { path: '/:pathMatch(.*)*', component: FileMaintenance }
  ]
})

const Root = {
  setup() {
    return () => h('div', { class: 'd-flex', style: 'min-height: 100vh' }, [
      h(Sidebar, { isOpen: true, isCollapsed: false }),
      h('main', { class: 'flex-grow-1 p-4', style: 'min-width: 0' }, [h(RouterView)])
    ])
  }
}

const app = createApp(Root)
app.use(createPinia())
app.use(router)
app.use(ToastService)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: { name: 'primevue', order: 'bootstrap, primevue' }
    }
  }
})
app.directive('tooltip', Tooltip)
app.mount('#app')
