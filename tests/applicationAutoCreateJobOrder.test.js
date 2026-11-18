// Gene - Nov, 18, 2026: Unit & integration tests for automated Job Order creation from unlinked Applications
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CLOSED_APPLICATION_STATUSES,
  isApplicationEligibleForJobOrder,
  resolveJobOrderInitialStatusFromApplication,
  resolvePlanIdFromDesiredPlan,
  extractCoordinatesFromApplication,
  getCanonicalApplicationId,
  hasApplicationHouseFrontPhoto,
  mapApplicationToJobOrderSeed,
  buildApplicationJobOrderSummary
} from '../src/utils/applicationJobOrderAutomation.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicTableSrc = fs.readFileSync(path.resolve(__dirname, '../src/components/DynamicApiTable.vue'), 'utf8')

const stripHtmlComments = (src) => src.replace(/<!--[\s\S]*?-->/g, '')
const stripBlockComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '')

const SAMPLE_PLANS = [
  { id: 101, name: 'Fiber Unli 1299', value: 'Fiber Unli 1299', label: 'Fiber Unli 1299 (₱1,299)' },
  { id: 202, name: 'Fiber Pro 1899', value: 'Fiber Pro 1899', label: 'Fiber Pro 1899 (₱1,899)' }
]

describe('Application -> Job Order Eligibility & Status Mapping', () => {
  test('isApplicationEligibleForJobOrder allows active/open statuses and excludes closed/invalid statuses', () => {
    assert.ok(CLOSED_APPLICATION_STATUSES.has('cancelled'))
    assert.ok(CLOSED_APPLICATION_STATUSES.has('duplicate'))
    assert.ok(CLOSED_APPLICATION_STATUSES.has('nofacility'))
    assert.ok(CLOSED_APPLICATION_STATUSES.has('noslot'))

    for (const status of ['Schedule', 'Inprogress', 'Approved', 'Done', 'Submitted', '']) {
      assert.equal(
        isApplicationEligibleForJobOrder({ id: 1, status }),
        true,
        `Expected status "${status}" to be eligible`
      )
    }

    for (const status of ['Cancelled', 'canceled', 'Duplicate', 'No Facility', 'No Slot', 'no-facility', 'no_slot']) {
      assert.equal(
        isApplicationEligibleForJobOrder({ id: 2, status }),
        false,
        `Expected status "${status}" to be ineligible`
      )
    }

    assert.equal(isApplicationEligibleForJobOrder(null), false)
    assert.equal(isApplicationEligibleForJobOrder(undefined), false)
  })

  test('resolveJobOrderInitialStatusFromApplication smart-matches Schedule -> Scheduled and defaults others to Inprogress', () => {
    assert.equal(resolveJobOrderInitialStatusFromApplication({ status: 'Schedule' }), 'Scheduled')
    assert.equal(resolveJobOrderInitialStatusFromApplication({ status: 'scheduled' }), 'Scheduled')
    assert.equal(resolveJobOrderInitialStatusFromApplication({ status: 'Inprogress' }), 'Inprogress')
    assert.equal(resolveJobOrderInitialStatusFromApplication({ status: 'Approved' }), 'Inprogress')
    assert.equal(resolveJobOrderInitialStatusFromApplication({ status: 'Done' }), 'Inprogress')
    assert.equal(resolveJobOrderInitialStatusFromApplication({ status: 'Submitted' }), 'Inprogress')
    assert.equal(resolveJobOrderInitialStatusFromApplication({ status: '' }), 'Inprogress')
  })
})

describe('Application -> Job Order Field Automation & Plan Resolution', () => {
  test('resolvePlanIdFromDesiredPlan resolves plan names and labels to numeric Plan IDs and falls back gracefully', () => {
    assert.equal(resolvePlanIdFromDesiredPlan('Fiber Unli 1299', SAMPLE_PLANS), '101')
    assert.equal(resolvePlanIdFromDesiredPlan('fiber pro 1899 (₱1,899)', SAMPLE_PLANS), '202')
    assert.equal(resolvePlanIdFromDesiredPlan(202, SAMPLE_PLANS), '202')
    assert.equal(resolvePlanIdFromDesiredPlan('Legacy Custom Plan', SAMPLE_PLANS), 'Legacy Custom Plan')
    assert.equal(resolvePlanIdFromDesiredPlan('', SAMPLE_PLANS), '')
  })

  test('extractCoordinatesFromApplication prefers explicit coordinates and extracts GPS(...) fallback from remarks', () => {
    assert.equal(
      extractCoordinatesFromApplication({ addressCoordinates: '14.464800, 121.193200', remarks: 'GPS(house photo) 14.1,121.2' }),
      '14.464800, 121.193200'
    )
    assert.equal(
      extractCoordinatesFromApplication({ remarks: 'Near plaza | GPS(house photo) 14.464812,121.193245' }),
      '14.464812,121.193245'
    )
    assert.equal(extractCoordinatesFromApplication({ remarks: 'No coordinates recorded' }), '')
  })

  test('mapApplicationToJobOrderSeed maps all Application fields cleanly for CreateJobOrderRequest', () => {
    const appRecord = {
      id: 4512,
      applicationId: 'APP-4512',
      firstName: 'Juan',
      middleName: 'Dela',
      lastName: 'Cruz',
      mobileNumber: '09171234567',
      secondaryMobileNumber: '09187654321',
      emailAddress: 'juan.cruz@example.com',
      installationAddress: '123 Mabini St.',
      region: 'Rizal',
      city: 'Binangonan',
      barangay: 'Calumpang',
      landmark: 'Across Municipal Hall',
      desiredPlan: 'Fiber Unli 1299',
      referredBy: 'Maria Santos',
      referrersAccountNumber: 'ACC-9001',
      visitBy: 'Agent A',
      visitWith: 'Agent B',
      visitWithOther: 'Field Tech',
      remarks: 'Call before arrival | GPS(house photo) 14.464812,121.193245',
      status: 'Schedule',
      houseFrontPicture: 'house_front_4512.jpg'
    }

    assert.equal(getCanonicalApplicationId(appRecord), 'APP-4512')
    assert.equal(hasApplicationHouseFrontPhoto(appRecord), true)

    const seed = mapApplicationToJobOrderSeed(appRecord, { plansList: SAMPLE_PLANS })
    assert.deepEqual(seed, {
      applicationId: 'APP-4512',
      firstName: 'Juan',
      middleInitial: 'Dela',
      lastName: 'Cruz',
      contactNumber: '09171234567',
      secondContactNumber: '09187654321',
      emailAddress: 'juan.cruz@example.com',
      applicantEmailAddress: 'juan.cruz@example.com',
      address: '123 Mabini St.',
      region: 'Rizal',
      city: 'Binangonan',
      barangay: 'Calumpang',
      installationLandmark: 'Across Municipal Hall',
      location: 'Across Municipal Hall',
      addressCoordinates: '14.464812,121.193245',
      planId: '101',
      referredBy: 'Maria Santos',
      referrersAccountNumber: 'ACC-9001',
      visitBy: 'Agent A',
      visitWith: 'Agent B',
      visitWithOther: 'Field Tech',
      remarks: 'Call before arrival | GPS(house photo) 14.464812,121.193245',
      status: 'Scheduled',
      billingDay: null,
      installationFee: null,
      houseFront: 'house_front_4512.jpg'
    })
  })

  test('buildApplicationJobOrderSummary produces readable summary entries including House Front Photo transfer notice', () => {
    const summary = buildApplicationJobOrderSummary({
      id: 88,
      firstName: 'Ana',
      lastName: 'Reyes',
      mobileNumber: '09170001111',
      emailAddress: 'ana@example.com',
      installationAddress: '45 Rizal Ave',
      barangay: 'Tagpos',
      city: 'Binangonan',
      region: 'Rizal',
      desiredPlan: 'Fiber Pro 1899',
      status: 'Approved',
      houseFrontPicture: 'house.jpg'
    }, { plansList: SAMPLE_PLANS })

    const byKey = Object.fromEntries(summary.map(entry => [entry.key, entry.value]))
    assert.equal(byKey.applicationId, '#88')
    assert.equal(byKey.applicant, 'Ana Reyes')
    assert.equal(byKey.contactNumber, '09170001111')
    assert.equal(byKey.emailAddress, 'ana@example.com')
    assert.equal(byKey.address, '45 Rizal Ave, Tagpos, Binangonan, Rizal')
    assert.equal(byKey.plan, 'Fiber Pro 1899 (₱1,899)')
    assert.equal(byKey.status, 'Inprogress')
    assert.equal(byKey.houseFront, 'Will be copied from Application')
  })
})

describe('DynamicApiTable.vue Application -> Create Job Order UI & API Wiring', () => {
  const activeTemplate = stripHtmlComments(dynamicTableSrc.slice(0, dynamicTableSrc.indexOf('<script')))
  const activeScript = stripBlockComments(dynamicTableSrc.slice(dynamicTableSrc.indexOf('<script')))

  test('renders both View Job Order and Create Job Order dynamically in row actions and View Details footer', () => {
    assert.ok(activeTemplate.includes('getApplicationJobOrderLinkState(slotProps.data) === \'linked\''), 'Row actions must check linked state')
    assert.ok(activeTemplate.includes('getApplicationJobOrderLinkState(slotProps.data) === \'unlinked\' && isApplicationEligibleForJobOrder(slotProps.data) && !readOnly'), 'Row actions must gate Create Job Order to unlinked eligible rows')
    assert.ok(activeTemplate.includes('@click="openCreateJobOrderFromAppDialog(slotProps.data)"'), 'Row actions Create Job Order must open confirmation dialog')

    assert.ok(activeTemplate.includes('getApplicationJobOrderLinkState(viewFormData) === \'linked\''), 'View Details modal footer must check linked state')
    assert.ok(activeTemplate.includes('getApplicationJobOrderLinkState(viewFormData) === \'unlinked\' && isApplicationEligibleForJobOrder(viewFormData) && !readOnly'), 'View Details modal footer must gate Create Job Order to unlinked eligible records')
    assert.ok(activeTemplate.includes('@click="openCreateJobOrderFromAppDialog(viewFormData)"'), 'View Details modal Create Job Order must open confirmation dialog')
  })

  test('confirmation dialog sfa-tracker-dialog-create-job-order is wired to confirmCreateJobOrderFromApp', () => {
    assert.ok(activeTemplate.includes('class="sfa-tracker-dialog-create-job-order"'), 'Must render confirmation dialog')
    assert.ok(activeTemplate.includes('@click="confirmCreateJobOrderFromApp"'), 'Confirm button must trigger confirmCreateJobOrderFromApp')
  })

  test('confirmCreateJobOrderFromApp invokes JobOrderService.createJobOrder without mutating source Application via ApplicationService.updateApplication', () => {
    const fnMatch = activeScript.match(/const confirmCreateJobOrderFromApp = async \(\) => \{([\s\S]*?)\n\}\n\nconst locateTargetRecordFromRoute/)
    assert.ok(fnMatch, 'confirmCreateJobOrderFromApp function must exist in DynamicApiTable.vue')
    const fnBody = fnMatch[1]
    assert.ok(fnBody.includes('JobOrderService.createJobOrder(joPayload)'), 'Must call JobOrderService.createJobOrder')
    assert.ok(fnBody.includes('JobOrderService.getJobOrderByApplicationId'), 'Must run duplicate-prevention pre-check')
    assert.ok(fnBody.includes('JobOrderService.updateJobOrder(createdId, form)'), 'Must transfer HouseFront photo via JobOrderService.updateJobOrder')
    assert.equal(fnBody.includes('ApplicationService.updateApplication'), false, 'Must NOT modify the source Application status or record')
  })
})
