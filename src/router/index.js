import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { abortPendingNavigationRequests } from '../services/api'

const APP_TITLE = 'SwitchFiber Admin'

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
  'lcp-nap-map': 'LCP NAP Map',
  'lcp-nap-records': 'LCP NAP Records',
  'audit-trail': 'All Audit Trail',
  'audit-trail-by-date': 'By Transaction Date',
  'audit-trail-by-entity': 'By Entity & Date',
  'audit-trail-by-user': 'By User & Date',
  'error-logs': 'All Error Logs',
  'error-logs-by-date': 'By Date Range',
  'error-logs-by-entity': 'By Entity & Date',
  'error-logs-by-user': 'By User & Date',
  'service-orders': 'Service Orders',
  'service-orders-pending': 'Pending Service Orders',
  'service-orders-inprogress': 'In Progress Service Orders',
  'service-orders-resolved': 'Resolved Service Orders',
  'service-orders-completed': 'Completed Service Orders',
  'service-orders-cancelled': 'Cancelled Service Orders',
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
      path: '/lcp-nap-locations',
      redirect: '/lcp-nap-locations/map'
    },
    {
      path: '/lcp-nap-locations/map',
      name: 'lcp-nap-map',
      component: () => import('../views/LcpNapMap.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/lcp-nap-locations/records',
      name: 'lcp-nap-records',
      component: () => import('../views/LcpNapRecords.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/logs',
      redirect: '/logs/audit-trail'
    },
    // Audit Trail (/api/LogTrail) and Error Logs (/api/LogError) each expose one
    // unfiltered list plus three narrowing endpoints. Every route below is the
    // same LogsView, which reads its endpoint and filter controls from the path.
    {
      path: '/logs/audit-trail',
      name: 'audit-trail',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, title: 'All Audit Trail' }
    },
    {
      path: '/logs/audit-trail/by-date',
      name: 'audit-trail-by-date',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, title: 'Audit Trail by Transaction Date' }
    },
    {
      path: '/logs/audit-trail/by-entity',
      name: 'audit-trail-by-entity',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, title: 'Audit Trail by Entity' }
    },
    {
      path: '/logs/audit-trail/by-user',
      name: 'audit-trail-by-user',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, title: 'Audit Trail by User' }
    },
    {
      path: '/logs/error-logs',
      name: 'error-logs',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, title: 'All Error Logs' }
    },
    {
      path: '/logs/error-logs/by-date',
      name: 'error-logs-by-date',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, title: 'Error Logs by Date Range' }
    },
    {
      path: '/logs/error-logs/by-entity',
      name: 'error-logs-by-entity',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, title: 'Error Logs by Entity' }
    },
    {
      path: '/logs/error-logs/by-user',
      name: 'error-logs-by-user',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true, title: 'Error Logs by User' }
    },
    {
      path: '/service-orders',
      name: 'service-orders',
      component: () => import('../views/ServiceOrderList.vue'),
      meta: { requiresAuth: true, title: 'Service Orders' }
    },
    {
      path: '/service-orders/pending',
      name: 'service-orders-pending',
      component: () => import('../views/ServiceOrderList.vue'),
      meta: { requiresAuth: true, title: 'Pending Service Orders' }
    },
    {
      path: '/service-orders/inprogress',
      name: 'service-orders-inprogress',
      component: () => import('../views/ServiceOrderList.vue'),
      meta: { requiresAuth: true, title: 'In Progress Service Orders' }
    },
    {
      path: '/service-orders/resolved',
      name: 'service-orders-resolved',
      component: () => import('../views/ServiceOrderList.vue'),
      meta: { requiresAuth: true, title: 'Resolved Service Orders' }
    },
    {
      path: '/service-orders/completed',
      name: 'service-orders-completed',
      component: () => import('../views/ServiceOrderList.vue'),
      meta: { requiresAuth: true, title: 'Completed Service Orders' }
    },
    {
      path: '/service-orders/cancelled',
      name: 'service-orders-cancelled',
      component: () => import('../views/ServiceOrderList.vue'),
      meta: { requiresAuth: true, title: 'Cancelled Service Orders' }
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
router.beforeEach((to, from) => {
  // Leaving a page kills its in-flight GETs. Without this, a slow API can hold
  // every connection to our origin and the lazy import of the next view queues
  // behind them — the click seems ignored until the API answers or times out.
  if (from.matched.length > 0) {
    abortPendingNavigationRequests()
  }

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
// Formats the tab header title as 'SwitchFiber - Admin | [Menu Name]' so the brand and admin role are prominent.
router.afterEach((to) => {
  const label = ROUTE_TITLES[to.name]
  document.title = label ? `SwitchFiber - Admin | ${label}` : 'SwitchFiber - Admin'
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
