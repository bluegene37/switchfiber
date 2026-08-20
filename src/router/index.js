import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const APP_TITLE = 'Switch Fiber'

// Browser-tab label per route, keyed by route name and worded to match the sidebar
// menu entry that leads there. A route missing from here just shows APP_TITLE.
const ROUTE_TITLES = {
  login: 'Sign In',
  dashboard: 'Dashboard',
  application: 'All Application',
  'application-in-progress': 'In Progress',
  'application-done': 'Done',
  'application-approved': 'Approved',
  application_list: 'All Application',
  'job-orders': 'All Job Orders',
  'job-orders-inprogress': 'In Progress',
  'job-orders-completed': 'Completed',
  'job-orders-activated': 'Activated',
  job_order: 'Job Order',
  invoice: 'Invoice',
  billing: 'Billing',
  lcp: 'LCP',
  lcnap: 'LCNAP',
  lcnap_port: 'LCNAP Port',
  nap: 'NAP',
  port: 'Port',
  vlan: 'VLAN',
  router: 'Router',
  plan: 'Plan',
  user: 'User',
  menu: 'Menu',
  access_level: 'Access Level',
  access_level_menu: 'Access Level Menu',
  disconnection: 'Disconnection',
  'api-viewer': 'API Viewer',
  models: 'Models',
  settings: 'Settings',
  'not-found': 'Page Not Found'
}

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
      path: '/job-orders',
      name: 'job-orders',
      component: () => import('../views/JobOrderList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/job-orders/inprogress',
      name: 'job-orders-inprogress',
      component: () => import('../views/JobOrderList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/job-orders/completed',
      name: 'job-orders-completed',
      component: () => import('../views/JobOrderList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/job-orders/activated',
      name: 'job-orders-activated',
      component: () => import('../views/JobOrderList.vue'),
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

// Runs after the guard has settled, so a redirected navigation titles the tab with
// where the user actually landed rather than where they aimed.
//
// Page first, brand last — the usual convention (Stripe, Linear, GitHub, Jira).
// Browser tabs truncate from the right, so the leading text is what stays readable
// once several tabs are open; putting "Switch Fiber" first would leave every tab
// showing the same visible prefix.
router.afterEach((to) => {
  const label = ROUTE_TITLES[to.name]
  document.title = label ? `${label} | ${APP_TITLE}` : APP_TITLE
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
