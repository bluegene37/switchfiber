import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const PROJECT = '/Users/bluegene37/WebstormProjects/switchfiber'

const APPLICATION_ROW = {
  id: 1,
  timestamp: '2026-08-14T09:15:00',
  emailAddress: 'juan.delacruz@example.com',
  region: 'REGION IV-A (CALABARZON)',
  city: 'Cabuyao',
  barangay: 'Marinig',
  referredBy: 'Walk-in',
  firstName: 'Juan',
  middleName: 'Santos',
  lastName: 'Dela Cruz',
  mobileNumber: '09171234567',
  secondaryMobileNumber: '09281234567',
  installationAddress: '123 Mabini St., Marinig, Cabuyao, Laguna',
  landmark: 'Beside the barangay hall',
  desiredPlan: 1,
  proofOfBilling: '',
  governmentValidId: '',
  secondGovernmentValidId: '',
  houseFrontPicture: '',
  termsAndConditionsAgreement: 'Agree',
  firstNearestLandmark: 'Corner sari-sari store',
  secondNearestLandmark: 'Blue gate',
  applicablePromo: 'Free installation',
  documentPicture: '',
  pictureofstatmentbillingfromotherprovider: '',
  referrersAccountNumber: 'SF-100234',
  applyingFor: 'New Installation',
  status: 'In Progress',
  visitBy: 'Tech Team A',
  visitWith: 'Rico',
  visitWithOther: '',
  remarks: 'Customer prefers weekend installation.',
  modifiedBy: 'admin',
  modifiedDate: '2026-08-15T10:00:00',
  userEmail: 'admin@switchfiber.ph',
  created: '2026-08-14T09:15:00',
  createdBy: 'webform',
  lastModified: '2026-08-15T10:00:00',
  lastModifiedBy: 'admin'
}

// Serves canned payloads for every /api call the component makes.
function stubApi() {
  return {
    name: 'stub-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/api')) return next()
        const path = req.url.split('?')[0].replace(/^\/api\/?/, '').toLowerCase()
        let payload = []
        if (path.startsWith('radiususer')) {
          // Verbatim capture of GET https://103.249.198.43:8090/api/RadiusUser
          payload = [
            { id: '', attributes: '', disabled: false, group: 'SwitchLite', name: 'accountt0601261206', otp_secret: '', password: 'switchfiber2023!', shared_users: 0 },
            { id: '', attributes: '', disabled: false, group: 'SwitchLite', name: 'account3t30812261612', otp_secret: '', password: 'switchfiber2023!', shared_users: 0 },
            { id: '', attributes: '', disabled: false, group: 'SwitchLite', name: 'account6t0815261113', otp_secret: '', password: 'switchfiber2023!', shared_users: 0 },
            { id: '', attributes: '', disabled: true, group: 'SwitchFast', name: 'account7t0815261114', otp_secret: '', password: 'switchfiber2023!', shared_users: 0 }
          ]
        } else if (path.startsWith('applications')) {
          payload = [APPLICATION_ROW, { ...APPLICATION_ROW, id: 2, firstName: 'Maria', status: 'Done' }]
        } else if (path.startsWith('plans')) {
          payload = [{ id: 1, planName: 'SwitchFiber 50Mbps', price: 1499 }]
        } else if (path.startsWith('billingstatuses')) {
          payload = [{ id: 1, name: 'Current' }]
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(payload))
      })
    }
  }
}

export default defineConfig({
  root: PROJECT,
  configFile: false,
  plugins: [vue(), stubApi()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', `file://${PROJECT}/`)) }
  },
  server: { port: 5199, strictPort: true }
})
