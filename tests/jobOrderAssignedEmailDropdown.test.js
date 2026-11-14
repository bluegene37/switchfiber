import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = readFileSync(join(__dirname, '../src/components/DynamicApiTable.vue'), 'utf8').replace(/\r\n/g, '\n')
const activeSrc = src.replace(/\/\*[\s\S]*?\*\//g, '')
const templateOnly = src.slice(src.indexOf('<template>'), src.indexOf('\n</template>'))
const activeTemplate = templateOnly.replace(/<!--[\s\S]*?-->/g, '')

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  assert.notEqual(start, -1, `Expected marker "${startMarker}" to exist`)
  const end = source.indexOf(endMarker, start)
  assert.notEqual(end, -1, `Expected marker "${endMarker}" after "${startMarker}"`)
  return source.slice(start, end)
}

function makeReactiveHelpers() {
  const ref = (initial) => ({ value: initial })
  const computed = (getter) => ({
    get value() {
      return getter()
    }
  })
  const rowFieldOf = (row, field) => {
    if (!row || typeof row !== 'object') return ''
    if (row[field] !== undefined && row[field] !== null && String(row[field]).trim() !== '') {
      return String(row[field]).trim()
    }
    const target = field.toLowerCase()
    const key = Object.keys(row).find(k => k.toLowerCase() === target)
    return key && row[key] !== undefined && row[key] !== null ? String(row[key]).trim() : ''
  }
  return { ref, computed, rowFieldOf }
}

function loadAssignedUserOptionsHarness({ users = [], storeUsers = [], currentUser = null, rows = [] } = {}) {
  const { ref, computed, rowFieldOf } = makeReactiveHelpers()
  const stableCode = sliceBetween(
    activeSrc,
    'const getStableOptionsWithCurrent = (optionsList, currentVal) => {',
    '\n\nconst APPLICATION_REFERRER_LIST'
  )
  const optionsCode = sliceBetween(
    activeSrc,
    'const jobOrderSavedEmails = ref([])',
    'const assignedEmailFilterOptions ='
  )

  const usersList = ref(users)
  const userStore = { users: storeUsers }
  const authStore = { user: currentUser }
  const data = ref(rows)

  const loaded = new Function(
    'ref',
    'computed',
    'usersList',
    'userStore',
    'authStore',
    'data',
    'rowFieldOf',
    `${stableCode}\n${optionsCode}\nreturn { jobOrderSavedEmails, recordSavedAssignedEmail, assignedUserOptions, getAssignedUserOptions }`
  )(ref, computed, usersList, userStore, authStore, data, rowFieldOf)

  return { ...loaded, usersList, userStore, authStore, data }
}

function loadUserDisplayHarness({ users = [], storeUsers = [], currentUser = null } = {}) {
  const { ref, computed } = makeReactiveHelpers()
  const userHelpersCode = sliceBetween(
    activeSrc,
    'const isUserRefField = (col) => {',
    'const isCurrencyField ='
  )
  const isDateTimeSrc = sliceBetween(
    activeSrc,
    'function isDateTimeField(col) {',
    'const isDateField ='
  )
  const isDateSrc = sliceBetween(
    activeSrc,
    'const isDateField = (col) => {',
    '\n\nconst viewMaterialsList'
  )
  const formatDisplaySrc = sliceBetween(
    activeSrc,
    'const formatDisplayValue = (val, col) => {',
    '\n\nconst getDiscountTypeTooltip'
  )

  const usersList = ref(users)
  const userStore = { users: storeUsers }
  const authStore = { user: currentUser }
  const getFieldType = (col) => {
    const lower = String(col || '').toLowerCase().replace(/_/g, '')
    if (lower === 'assignedemail') return 'assignedemail_dropdown'
    return 'text'
  }

  return new Function(
    'computed',
    'usersList',
    'userStore',
    'authStore',
    'getFieldType',
    'parseDateForPicker',
    'parseTimeForPicker',
    'getAccessLevelLabel',
    'isCurrencyField',
    'isPaymentEndpoint',
    'isPhoneField',
    'normalizePhoneNumber',
    'vlansList',
    'lcpsList',
    'napsList',
    'portsList',
    'lcpnapsList',
    'lcpnapportsList',
    'plansList',
    'discountTypesList',
    'discountsList',
    'paymentMethodOptions',
    'paymentTypeOptions',
    `${userHelpersCode}\n${isDateTimeSrc}\n${isDateSrc}\n${formatDisplaySrc}\nreturn { isUserRefField, usersMap, getUserDisplayName, formatDisplayValue }`
  )(
    computed,
    usersList,
    userStore,
    authStore,
    getFieldType,
    () => null,
    () => null,
    (v) => String(v),
    () => false,
    { value: false },
    () => false,
    (v) => String(v || ''),
    { value: [] },
    { value: [] },
    { value: [] },
    { value: [] },
    { value: [] },
    { value: [] },
    { value: [] },
    { value: [] },
    { value: [] },
    { value: [] },
    { value: [] }
  )
}

test('assignedUserOptions labels users by Name description, stores raw email as value, and merges JO-saved emails', () => {
  const {
    jobOrderSavedEmails,
    recordSavedAssignedEmail,
    assignedUserOptions,
    getAssignedUserOptions
  } = loadAssignedUserOptionsHarness({
    users: [
      { id: 1, fname: 'Gene Ray', mname: 'S.', lname: 'Medel', email: 'bluegene37@gmail.com', username: 'bluegene37' },
      { id: 2, description: 'Dispatch Team Lead', email: 'dispatch@switchfiber.com', username: 'dispatch1' }
    ],
    rows: [
      { id: 101, assignedEmail: 'tech1@switchfiber.com' },
      { id: 102, assignedEmail: 'BlueGene37@gmail.com' }
    ]
  })

  jobOrderSavedEmails.value = ['field.tech@switchfiber.com', 'DISPATCH@switchfiber.com']

  const options = assignedUserOptions.value
  const gene = options.find(o => o.value === 'bluegene37@gmail.com')
  assert.ok(gene, 'User from /Users should be present')
  assert.equal(gene.label, 'Gene Ray S. Medel', 'Dropdown label must show user full name description without raw email suffix')
  assert.equal(gene.value, 'bluegene37@gmail.com', 'Option value must remain the email for saving')
  assert.equal(gene.email, 'bluegene37@gmail.com')

  const descUser = options.find(o => o.value === 'dispatch@switchfiber.com')
  assert.ok(descUser, 'User with description field should be present')
  assert.equal(descUser.label, 'Dispatch Team Lead', 'Description should take precedence over username')

  assert.equal(
    options.filter(o => o.value.toLowerCase() === 'bluegene37@gmail.com').length,
    1,
    'Duplicate email casing from JobOrders rows should deduplicate against /Users'
  )
  assert.equal(
    options.filter(o => o.value.toLowerCase() === 'dispatch@switchfiber.com').length,
    1,
    'Duplicate email casing from jobOrderSavedEmails should deduplicate against /Users'
  )

  const joTech = options.find(o => o.value === 'tech1@switchfiber.com')
  assert.deepEqual(joTech, {
    label: 'tech1@switchfiber.com',
    value: 'tech1@switchfiber.com',
    name: 'tech1@switchfiber.com',
    email: 'tech1@switchfiber.com'
  })

  const fieldTech = options.find(o => o.value === 'field.tech@switchfiber.com')
  assert.ok(fieldTech, 'Emails loaded from jobOrderSavedEmails should appear across all forms')

  recordSavedAssignedEmail('new.installer@switchfiber.com')
  recordSavedAssignedEmail('NEW.INSTALLER@switchfiber.com')
  assert.equal(
    assignedUserOptions.value.filter(o => o.value.toLowerCase() === 'new.installer@switchfiber.com').length,
    1,
    'Newly saved JO email should appear immediately without case duplicates'
  )

  const stableExisting = getAssignedUserOptions('BlueGene37@gmail.com')
  assert.equal(
    stableExisting.filter(o => String(o.value).toLowerCase() === 'bluegene37@gmail.com').length,
    1,
    'Edit mode must reuse matched option cleanly for mixed-case stored emails'
  )

  const stableUnknown = getAssignedUserOptions('legacy.tech@switchfiber.com')
  assert.equal(stableUnknown[0].value, 'legacy.tech@switchfiber.com')
})

test('Create and Edit Select components bind label/email filterFields and custom #value / #option slots', () => {
  const assignedSelectMatches = activeTemplate.match(
    /<Select[\s\S]*?getFieldType\(col\)\s*===\s*'assignedemail_dropdown'[\s\S]*?<\/Select>/g
  )
  assert.ok(assignedSelectMatches, 'Expected assignedemail_dropdown Select blocks in template')
  assert.equal(assignedSelectMatches.length, 2, 'Expected both Create and Edit assignedemail_dropdown Selects')

  const createSelect = assignedSelectMatches.find(block => block.includes('v-model="formData[col]"'))
  const editSelect = assignedSelectMatches.find(block => block.includes('v-model="editFormData[col]"'))
  assert.ok(createSelect, 'Create Select for assignedemail_dropdown should exist')
  assert.ok(editSelect, 'Edit Select for assignedemail_dropdown should exist')

  for (const selectBlock of [createSelect, editSelect]) {
    assert.match(selectBlock, /optionLabel="label"/)
    assert.match(selectBlock, /optionValue="value"/)
    assert.match(selectBlock, /:filterFields="\['label', 'email', 'value'\]"/)
    assert.match(selectBlock, /<template #value="slotProps">[\s\S]*getUserDisplayName\(slotProps\.value\)[\s\S]*<\/template>/)
    assert.match(selectBlock, /<template #option="slotProps">[\s\S]*slotProps\.option\.label[\s\S]*slotProps\.option\.email[\s\S]*<\/template>/)
  }
})

test('isUserRefField, usersMap, and formatDisplayValue resolve assignedEmail to Name across View Details, table, and exports', () => {
  const { isUserRefField, getUserDisplayName, formatDisplayValue } = loadUserDisplayHarness({
    users: [
      { id: 1, fname: 'Gene Ray', lname: 'Medel', email: 'bluegene37@gmail.com', username: 'bluegene37' },
      { id: 2, description: 'North Team Coordinator', email: 'north@switchfiber.com', username: 'northuser' }
    ]
  })

  assert.equal(isUserRefField('assignedEmail'), true)
  assert.equal(isUserRefField('assigned_email'), true)
  assert.equal(getUserDisplayName('bluegene37@gmail.com'), 'Gene Ray Medel')
  assert.equal(getUserDisplayName('NORTH@switchfiber.com'), 'North Team Coordinator')
  assert.equal(formatDisplayValue('bluegene37@gmail.com', 'assignedEmail'), 'Gene Ray Medel')
  assert.equal(formatDisplayValue('BLUEGENE37@GMAIL.COM', 'assignedEmail'), 'Gene Ray Medel')
  assert.equal(formatDisplayValue('tech1@switchfiber.com', 'assignedEmail'), 'tech1@switchfiber.com')
})

test('fetchJobOrderAssignedEmailsLookup loads JobOrders emails and wires across table lookups, forms, and save hooks', async () => {
  const { ref, rowFieldOf } = makeReactiveHelpers()
  const lookupFnCode = sliceBetween(
    activeSrc,
    'let jobOrderEmailsLookupPromise = null',
    '\n// Drops every cached lookup'
  )

  const jobOrderSavedEmails = ref([])
  const CrudService = {
    async list(endpoint) {
      assert.equal(endpoint, 'JobOrders')
      return [
        { id: 1, assignedEmail: 'tech1@switchfiber.com' },
        { id: 2, assignedEmail: 'TECH1@switchfiber.com' },
        { id: 3, assignedEmail: '' },
        { id: 4, AssignedEmail: 'bluegene37@gmail.com' }
      ]
    }
  }
  const unwrapList = (res) => (Array.isArray(res) ? res : [])

  const fetchJobOrderAssignedEmailsLookup = new Function(
    'CrudService',
    'unwrapList',
    'rowFieldOf',
    'jobOrderSavedEmails',
    `${lookupFnCode}\nreturn fetchJobOrderAssignedEmailsLookup`
  )(CrudService, unwrapList, rowFieldOf, jobOrderSavedEmails)

  await fetchJobOrderAssignedEmailsLookup()
  assert.deepEqual(jobOrderSavedEmails.value, ['tech1@switchfiber.com', 'bluegene37@gmail.com'])

  assert.match(activeSrc, /hasAssignedEmailDropdown = computed\([\s\S]*assignedemail_dropdown/)
  assert.match(activeSrc, /refreshTableLookups = \(\) => \{[\s\S]*hasAssignedEmailDropdown\.value\) fetchJobOrderAssignedEmailsLookup\(\)/)
  assert.match(activeSrc, /fetchFormLookups = \(\) => \{[\s\S]*await Promise\.allSettled\(pendingUserLookups\)/)
  assert.match(activeSrc, /const invalidateLookups = \(\) => \{[\s\S]*jobOrderEmailsLookupPromise = null/)
  assert.match(activeSrc, /const createRes = await CrudService\.create\(props\.endpoint, finalPayload\)[\s\S]{0,250}recordSavedAssignedEmail\(/)
  assert.match(activeSrc, /await CrudService\.update\(props\.endpoint, updatedId, finalPayload, updateReqConfig\)[\s\S]{0,250}recordSavedAssignedEmail\(/)
})
