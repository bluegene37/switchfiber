import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/Login.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/lcp',
      name: 'lcp',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/lcnap',
      name: 'lcnap',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/lcnap_port',
      name: 'lcnap_port',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/nap',
      name: 'nap',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/port',
      name: 'port',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/vlan',
      name: 'vlan',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/router',
      name: 'router',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/plan',
      name: 'plan',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/application',
      name: 'application',
      component: () => import('../views/ApplicationList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/application/in-progress',
      name: 'application-in-progress',
      component: () => import('../views/ApplicationList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/application/done',
      name: 'application-done',
      component: () => import('../views/ApplicationList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/application/approved',
      name: 'application-approved',
      component: () => import('../views/ApplicationList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/application_list',
      name: 'application_list',
      component: () => import('../views/ApplicationList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/user',
      name: 'user',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/menu',
      name: 'menu',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/access_level',
      name: 'access_level',
      component: () => import('../views/AccessLevelManagement.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/access_level_menu',
      name: 'access_level_menu',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/job_order',
      name: 'job_order',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/invoice',
      name: 'invoice',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/billing',
      name: 'billing',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/disconnection',
      name: 'disconnection',
      component: () => import('../views/FileMaintenance.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/data-viewer',
      name: 'api-viewer',
      component: () => import('../views/Api.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/models',
      name: 'models',
      component: () => import('../views/Models.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/Settings.vue'),
      meta: { requiresAuth: true }
    },
    // {
    //   path: '/connections',
    //   name: 'connections',
    //   component: () => import('../views/ComingSoon.vue'),
    //   meta: { requiresAuth: true }
    // },
    // {
    //   path: '/billing',
    //   name: 'billing',
    //   component: () => import('../views/ComingSoon.vue'),
    //   meta: { requiresAuth: true }
    // },
    // {
    //   path: '/monitoring',
    //   name: 'monitoring',
    //   component: () => import('../views/ComingSoon.vue'),
    //   meta: { requiresAuth: true }
    // }
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/NotFound.vue')
    }
  ]
})

// Navigation Guard — returns values instead of calling next(), which is
// deprecated in Vue Router 5.
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : undefined }
  }
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }
  return true
})

// A stale lazy-chunk reference after a redeploy throws on navigation; a single
// hard reload pulls the new build instead of leaving the user on a dead screen.
router.onError((err, to) => {
  const message = String(err?.message || '')
  if (/dynamically imported module|Importing a module script failed|Failed to fetch/i.test(message)) {
    window.location.assign(to.fullPath)
  }
})

export default router
