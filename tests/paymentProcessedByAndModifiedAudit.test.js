// Gene - Nov, 11, 2026: Regression suite for Create & Update modifiedBy/userEmail stamping across endpoints and Payment processedBy auto-update based on logged-in user
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const tableSrc = fs.readFileSync(path.join(rootDir, 'src/components/DynamicApiTable.vue'), 'utf8')
const paymentServiceSrc = fs.readFileSync(path.join(rootDir, 'src/services/payments.js'), 'utf8')
const permissionsSrc = fs.readFileSync(path.join(rootDir, 'src/composables/usePermissions.js'), 'utf8')

describe('Create & Update Modified By Audit Stamping & Payment Processed By Auto-Update', () => {
  test('getLoggedInProcessedBy resolves logged-in user display name with fallback chain (fname+lname -> name -> usersMap -> username -> email -> id)', () => {
    assert.ok(
      tableSrc.includes('const getLoggedInProcessedBy = () =>'),
      'DynamicApiTable.vue must define getLoggedInProcessedBy helper'
    )
    assert.ok(
      tableSrc.includes('cur.fname || cur.firstName || cur.first_name') &&
      tableSrc.includes('cur.lname || cur.lastName || cur.last_name'),
      'getLoggedInProcessedBy must prioritize full name from fname and lname'
    )
    assert.ok(
      tableSrc.includes('usersMap.value.has(Number(cur.id))'),
      'getLoggedInProcessedBy must consult usersMap by user ID when session only holds id/username'
    )
    assert.ok(
      tableSrc.includes('if (cur.username && String(cur.username).trim()) return String(cur.username).trim()'),
      'getLoggedInProcessedBy must fall back to username'
    )
  })

  test('usePermissions refreshUserFromServer syncs fname, lname, username, and email into authStore.user', () => {
    assert.ok(
      permissionsSrc.includes('if (row.fname && row.fname !== authStore.user?.fname) profilePatch.fname = row.fname'),
      'refreshUserFromServer must sync fname from /Users/{id} into authStore.user'
    )
    assert.ok(
      permissionsSrc.includes('if (row.lname && row.lname !== authStore.user?.lname) profilePatch.lname = row.lname'),
      'refreshUserFromServer must sync lname from /Users/{id} into authStore.user'
    )
    assert.ok(
      permissionsSrc.includes('if (row.email && row.email !== authStore.user?.email) profilePatch.email = row.email'),
      'refreshUserFromServer must sync email from /Users/{id} into authStore.user'
    )
  })

  test('Payment openCreateDialog and openEditDialog auto-populate and auto-update processedBy, modifiedBy, and userEmail from the logged-in user', () => {
    assert.ok(
      tableSrc.includes('const resolvedProcessedBy = getLoggedInProcessedBy() || currentUser') &&
      tableSrc.includes('formData.value.processedBy = resolvedProcessedBy'),
      'openCreateDialog must auto-populate formData.value.processedBy from the logged-in user'
    )
    assert.ok(
      tableSrc.includes("const loggedInProcessedBy = getLoggedInProcessedBy() || String(authStore.user?.id || '')") &&
      tableSrc.includes('editFormData.value.processedBy = loggedInProcessedBy'),
      'openEditDialog must auto-update editFormData.value.processedBy to the logged-in user'
    )
    assert.ok(
      tableSrc.includes('const refreshedProcessedBy = getLoggedInProcessedBy() || currentUser') &&
      tableSrc.includes('editFormData.value.processedBy = refreshedProcessedBy'),
      'openEditDialog must re-apply logged-in processedBy after fetchFormLookups resolves usersMap'
    )
  })

  test('Payment saveData (Create) and saveEdit (Update) stamp processedBy, modifiedBy, modifiedDate, and userEmail from the logged-in user', () => {
    const saveEditStart = tableSrc.indexOf('const saveEdit = async () =>')
    const saveEditEnd = tableSrc.indexOf('const confirmDelete = (record) =>', saveEditStart)
    assert.ok(saveEditStart > -1 && saveEditEnd > saveEditStart, 'saveEdit must exist in DynamicApiTable.vue')
    const saveEditSlice = tableSrc.slice(saveEditStart, saveEditEnd)

    assert.ok(
      saveEditSlice.includes('const loggedInProcBy = getLoggedInProcessedBy() || String(loggedInUserId)') &&
      saveEditSlice.includes('finalPayload.processedBy = String(loggedInProcBy)'),
      'saveEdit must unconditionally auto-update finalPayload.processedBy to the logged-in user on Payment PUT'
    )
    assert.ok(
      saveEditSlice.includes('finalPayload.modifiedBy = String(loggedInUserId)') &&
      saveEditSlice.includes('finalPayload.modifiedDate = localAuditTimestamp()') &&
      saveEditSlice.includes('finalPayload.userEmail = currentUserEmail'),
      'saveEdit must stamp modifiedBy, modifiedDate, and userEmail on Payment PUT'
    )
  })

  test('detectEditConflict ignores processedby, modifiedby, and useremail on Payments so auto-updating processedBy never raises a false conflict', () => {
    assert.ok(
      tableSrc.includes("['accountbalance', 'dateprocessed', 'modifieddate', 'modifiedby', 'processedby', 'useremail', 'timestamp', 'rowversion'].includes(normalizeColKey(col))"),
      'detectEditConflict must exclude processedby, modifiedby, and useremail for Payments'
    )
  })

  test('PaymentService createPayment and updatePayment stamp processedBy, modifiedBy, and userEmail from the logged-in session', () => {
    assert.ok(
      paymentServiceSrc.includes('const getLoggedInPaymentUser = () =>'),
      'src/services/payments.js must define getLoggedInPaymentUser helper'
    )
    assert.ok(
      paymentServiceSrc.includes('processedBy: String(data.processedBy || processedBy || userId)') &&
      paymentServiceSrc.includes('modifiedBy: String(data.modifiedBy || userId)'),
      'PaymentService.createPayment must stamp processedBy and modifiedBy from logged-in user'
    )
    assert.ok(
      paymentServiceSrc.includes('processedBy: String(processedBy || data.processedBy || userId)') &&
      paymentServiceSrc.includes("modifiedBy: String(userId || data.modifiedBy || '1')"),
      'PaymentService.updatePayment must update processedBy and modifiedBy to the logged-in user'
    )
  })

  test('Create and Update across endpoints update modifiedBy and userEmail to the logged-in user while preserving createdBy/createdDate on Update', () => {
    assert.ok(
      tableSrc.includes("userEmail: normStr(authStore.user?.email || payload.userEmail || 'admin@switchfiber.com')"),
      'buildBillingPayload must prioritize authStore.user.email so userEmail reflects the modifier'
    )
    assert.ok(
      tableSrc.includes("userEmail: normStr(authStore.user?.email || payload.userEmail || 'admin@switchfiber.com', 100)"),
      'buildInventoryItemPayload must prioritize authStore.user.email so userEmail reflects the modifier'
    )
    assert.ok(
      tableSrc.includes('if (isPlanEndpoint.value || isDiscountEndpoint.value || isDiscountTypeEndpoint.value)'),
      'saveEdit must preserve createdBy and createdDate from editBaseSnapshot on Plans, Discounts, and DiscountTypes'
    )
    assert.ok(
      tableSrc.includes('payload.userEmail = authStore.user?.email || payload.userEmail || currentUserEmail'),
      'ServiceOrders update must stamp userEmail from the logged-in user'
    )
    assert.ok(
      tableSrc.includes("form.append('UserEmail', capStr(authStore.user?.email || payload.userEmail || currentUserEmail, 100))"),
      'LCPNAP update must stamp UserEmail from the logged-in user'
    )
  })
})
