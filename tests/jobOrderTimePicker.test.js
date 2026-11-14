import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const TABLE_PATH = path.resolve('src/components/DynamicApiTable.vue')
const tableSrc = fs.readFileSync(TABLE_PATH, 'utf8')

function sliceBetween(src, startMarker, endMarker, includeEnd = false) {
  const start = src.indexOf(startMarker)
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`)
  const end = src.indexOf(endMarker, start)
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`)
  return src.slice(start, includeEnd ? end + endMarker.length : end)
}

function makeGetFieldType(endpointOrBool = 'JobOrders') {
  const endpoint = typeof endpointOrBool === 'string'
    ? endpointOrBool
    : (endpointOrBool ? 'JobOrders' : 'ServiceOrders')
  const isJobOrder = endpoint.toLowerCase() === 'joborders'
  const isPayment = endpoint.toLowerCase() === 'payments'
  const fnSrc = sliceBetween(
    tableSrc,
    'function getFieldType(col) {',
    "\n  return 'text'\n}",
    true
  )
  const stubRef = (val = false) => ({ value: val })
  return new Function(
    'isPromotionEndpoint',
    'isInventoryItemEndpoint',
    'isPaymentEndpoint',
    'isJobOrderEndpoint',
    'isInvoiceEndpoint',
    'isDiscountEndpoint',
    'props',
    'normalizeColKey',
    'getEndpointColumnMeta',
    'schemaMeta',
    `${fnSrc}\nreturn getFieldType`
  )(
    stubRef(false),
    stubRef(false),
    stubRef(isPayment),
    stubRef(isJobOrder),
    stubRef(false),
    stubRef(false),
    { endpoint, columnTypes: {} },
    (col) => String(col || '').toLowerCase(),
    () => null,
    { value: {} }
  )
}

function makeFormatLabel(endpoint = 'JobOrders') {
  const fnSrc = sliceBetween(
    tableSrc,
    'function formatLabel(col) {',
    '\nfunction '
  )
  const stubRef = (val = false) => ({ value: val })
  return new Function(
    'isApplicationEndpoint',
    'isServiceOrderEndpoint',
    'isRadiusUserEndpoint',
    'isDiscountEndpoint',
    'isPromotionEndpoint',
    'isPaymentEndpoint',
    'isJobOrderEndpoint',
    'normalizeColKey',
    `${fnSrc}\nreturn formatLabel`
  )(
    stubRef(endpoint === 'Applications'),
    stubRef(endpoint === 'ServiceOrders'),
    stubRef(false),
    stubRef(false),
    stubRef(false),
    stubRef(endpoint === 'Payments'),
    stubRef(endpoint === 'JobOrders'),
    (col) => String(col || '').toLowerCase().replace(/_/g, '')
  )
}

function sliceAfter(src, afterMarker, startMarker, endMarker, includeEnd = false) {
  const after = src.indexOf(afterMarker)
  assert.notEqual(after, -1, `Missing anchor marker: ${afterMarker}`)
  const start = src.indexOf(startMarker, after)
  assert.notEqual(start, -1, `Missing start marker: ${startMarker}`)
  const end = src.indexOf(endMarker, start)
  assert.notEqual(end, -1, `Missing end marker: ${endMarker}`)
  return src.slice(start, includeEnd ? end + endMarker.length : end)
}

function makeParseDateForPicker() {
  const fnSrc = sliceAfter(
    tableSrc,
    '*/\n// Gene - Nov, 14, 2026: Safely parse local YYYY-MM-DD',
    'const parseDateForPicker = (val) => {',
    '\n\nconst parseTimeForPicker'
  )
  return new Function(`${fnSrc}\nreturn parseDateForPicker`)()
}

function makeParseTimeForPicker() {
  const fnSrc = sliceAfter(
    tableSrc,
    '*/\n// Gene - Nov, 14, 2026: Safely parse local YYYY-MM-DD',
    'const parseTimeForPicker = (val) => {',
    '\n\nconst serializeTimeForPayload'
  )
  return new Function(`${fnSrc}\nreturn parseTimeForPicker`)()
}

function makeSerializeTimeForPayload() {
  const fnSrc = sliceBetween(
    tableSrc,
    'const serializeTimeForPayload = (val, anchorVal = null) => {',
    '\n\nconst getRowCoordinateValue'
  )
  return new Function(`${fnSrc}\nreturn serializeTimeForPayload`)()
}

function makeDateTimeAndDisplayHelpers(endpoint = 'JobOrders') {
  const getFieldType = makeGetFieldType(endpoint)
  const parseDateForPicker = makeParseDateForPicker()
  const parseTimeForPicker = makeParseTimeForPicker()

  const isDateTimeSrc = sliceBetween(
    tableSrc,
    'function isDateTimeField(col) {',
    '\n\nconst isDateField'
  )
  const isDateFieldSrc = sliceBetween(
    tableSrc,
    'const isDateField = (col) => {',
    '\n\nconst viewMaterialsList'
  )
  const formatDisplaySrc = sliceBetween(
    tableSrc,
    'const formatDisplayValue = (val, col) => {',
    '\n\nconst getDiscountTypeTooltip'
  )

  return new Function(
    'getFieldType',
    'parseDateForPicker',
    'parseTimeForPicker',
    'isUserRefField',
    'getUserDisplayName',
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
    `${isDateTimeSrc}\n${isDateFieldSrc}\n${formatDisplaySrc}\nreturn { isDateTimeField, isDateField, formatDisplayValue }`
  )(
    getFieldType,
    parseDateForPicker,
    parseTimeForPicker,
    (col) => {
      const l = String(col || '').toLowerCase().replace(/_/g, '')
      return l.includes('modifiedby') || l.includes('createdby') || l === 'verifiedby' || l === 'processedby'
    },
    (val) => (String(val) === '1' ? 'Gene Admin' : `User #${val}`),
    (val) => String(val),
    () => false,
    { value: endpoint === 'Payments' },
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

function makeColumnsEvaluators(endpoint = 'JobOrders') {
  const isCreatedSrc = sliceBetween(
    tableSrc,
    'function isCreatedOrModifiedField(col) {',
    '\n\nconst isStatusColumn'
  )
  const joColsSrc = sliceBetween(
    tableSrc,
    'const JOB_ORDER_COLUMNS = [',
    '\n]',
    true
  )
  const colsBodySrc = sliceBetween(
    tableSrc,
    'const columns = computed(() => {',
    '\n})\n\n// Check if a field is configured',
    false
  )
  const isAuditSrc = sliceBetween(
    tableSrc,
    'function isAuditField(col) {',
    '\n\nconst exportMenu'
  )

  return new Function(
    'props',
    'allRawColumns',
    'isJobOrderEndpoint',
    'isApplicationEndpoint',
    'normalizeColKey',
    'CONCISE_ENDPOINT_COLUMNS',
    `${isCreatedSrc}\n${joColsSrc}\n${isAuditSrc}\n${colsBodySrc.replace(
      'const columns = computed(() => {',
      'function evalColumns() {'
    )}\n}\nreturn { JOB_ORDER_COLUMNS, isCreatedOrModifiedField, isAuditField, evalColumns }`
  )
}

function makeBuildJobOrderPayload(overrides = {}) {
  const fnSrc = sliceBetween(
    tableSrc,
    'const buildJobOrderPayload = ',
    '\n  return jobOrder\n}',
    true
  )
  return new Function(
    'normalizePhoneNumber',
    'editingRecordId',
    'defaultNewStatus',
    'localAuditTimestamp',
    'applyJobOrderCreationAudit',
    'isJobOrderCompleted',
    `${fnSrc}\nreturn buildJobOrderPayload`
  )(
    (v) => v || '',
    { value: overrides.editingId ?? null },
    () => 'Pending',
    () => '2026-11-14T12:00:00',
    (obj) => obj,
    { value: overrides.isCompleted ?? false }
  )
}

test('getFieldType classifies all time fields as time and all business/audit date fields as date across endpoints', () => {
  const joGetFieldType = makeGetFieldType('JobOrders')
  assert.equal(joGetFieldType('startTimeStamp'), 'time')
  assert.equal(joGetFieldType('endTimeStamp'), 'time')
  assert.equal(joGetFieldType('dateInstalled'), 'date')
  assert.equal(joGetFieldType('installationDate'), 'date')
  assert.equal(joGetFieldType('modifiedDate'), 'date')

  const soGetFieldType = makeGetFieldType('ServiceOrders')
  assert.equal(soGetFieldType('startTimestamp'), 'time')
  assert.equal(soGetFieldType('stopTimestamp'), 'time')
  assert.equal(soGetFieldType('assignedDate'), 'date')
  assert.equal(soGetFieldType('dateInstalled'), 'date')
  assert.equal(soGetFieldType('techModifiedDate'), 'date')

  const genericGetFieldType = makeGetFieldType('BillingDetails')
  for (const timeCol of ['startTime', 'endTime', 'stopTime', 'timeIn', 'timeOut', 'preferredTime']) {
    assert.equal(genericGetFieldType(timeCol), 'time', `${timeCol} should classify as time`)
  }
  for (const dateCol of [
    'dueDate',
    'paymentDate',
    'balanceUpdateDate',
    'startDate',
    'endDate',
    'usedDate',
    'processDate',
    'dateProcessed',
    'dateTime',
    'timestamp',
    'createdDate',
    'modifiedDate',
  ]) {
    assert.equal(genericGetFieldType(dateCol), 'date', `${dateCol} should classify as date`)
  }
})

test('DynamicApiTable template renders 3 timeOnly 12h DatePicker blocks plus View date-time vs date-only DatePickers', () => {
  const templateEnd = tableSrc.indexOf('\n</template>')
  assert.notEqual(templateEnd, -1)
  const templateSrc = tableSrc.slice(0, templateEnd)

  const timeBranches = [...templateSrc.matchAll(/<DatePicker\s+v-else-if="getFieldType\(col\) === 'time'"[\s\S]{0,600}?\/>/g)]
  assert.equal(timeBranches.length, 3, 'Expected Create, View, and Edit time DatePicker branches')

  const joined = timeBranches.map((m) => m[0]).join('\n')
  for (const branch of timeBranches) {
    assert.match(branch[0], /<DatePicker\b/)
    assert.match(branch[0], /\btimeOnly\b/)
    assert.match(branch[0], /hourFormat="12"/)
    assert.match(branch[0], /icon="pi pi-clock"/)
  }

  assert.match(joined, /v-model="formData\[col\]"/)
  assert.match(joined, /:modelValue="parseTimeForPicker\(viewFormData\[col\]\)"/)
  assert.match(joined, /\bdisabled\b/)
  assert.match(joined, /v-model="editFormData\[col\]"/)

  assert.match(
    templateSrc,
    /<DatePicker\s+v-else-if="getFieldType\(col\) === 'date' && isDateTimeField\(col\)"[\s\S]{0,400}?showTime[\s\S]{0,120}?hourFormat="12"/,
    'View modal should display date & 12-hour time for audit/system date-time fields'
  )
})

test('formatLabel maps time columns and Job Order modifiedBy/modifiedDate columns', () => {
  const joFormatLabel = makeFormatLabel('JobOrders')
  assert.equal(joFormatLabel('startTimeStamp'), 'Start Time')
  assert.equal(joFormatLabel('endTimeStamp'), 'End Time')
  assert.equal(joFormatLabel('stopTimestamp'), 'Stop Time')
  assert.equal(joFormatLabel('startTime'), 'Start Time')
  assert.equal(joFormatLabel('endTime'), 'End Time')
  assert.equal(joFormatLabel('stopTime'), 'Stop Time')
  assert.equal(joFormatLabel('modifiedBy'), 'Modified By')
  assert.equal(joFormatLabel('modifiedDate'), 'Modified Date & Time')
})

test('Job Orders table includes Modified By and Modified Date & Time while Create/Edit forms keep them hidden', () => {
  const createJoEval = makeColumnsEvaluators('JobOrders')
  const rawCols = [
    'id', 'status', 'accountNo', 'applicationId', 'firstName', 'lastName',
    'contactNumber', 'address', 'planId', 'onsiteStatus', 'billingStatus',
    'assignedEmail', 'createdBy', 'createdDate', 'modifiedBy', 'modifiedDate', 'rowVersion',
  ]
  const joRes = createJoEval(
    { endpoint: 'JobOrders' },
    { value: rawCols },
    { value: true },
    { value: false },
    (col) => String(col || '').toLowerCase().replace(/_/g, ''),
    { JobOrders: null }
  )
  // Pass CONCISE_ENDPOINT_COLUMNS mapped to the parsed JOB_ORDER_COLUMNS
  const joWithConcise = createJoEval(
    { endpoint: 'JobOrders' },
    { value: rawCols },
    { value: true },
    { value: false },
    (col) => String(col || '').toLowerCase().replace(/_/g, ''),
    { JobOrders: joRes.JOB_ORDER_COLUMNS }
  )
  const visibleJoCols = joWithConcise.evalColumns()
  assert.ok(joRes.JOB_ORDER_COLUMNS.includes('modifiedBy'))
  assert.ok(joRes.JOB_ORDER_COLUMNS.includes('modifiedDate'))
  assert.ok(visibleJoCols.includes('modifiedBy'), 'Job Orders table should show modifiedBy')
  assert.ok(visibleJoCols.includes('modifiedDate'), 'Job Orders table should show modifiedDate')
  assert.ok(!visibleJoCols.includes('createdBy'), 'Job Orders table should keep createdBy hidden')
  assert.ok(!visibleJoCols.includes('createdDate'), 'Job Orders table should keep createdDate hidden')
  assert.ok(!visibleJoCols.includes('rowVersion'), 'Job Orders table should keep rowVersion hidden')

  // Even when sparse API rows omit modifiedBy / modifiedDate or use aliases, JobOrders retains them
  const joSparse = createJoEval(
    { endpoint: 'JobOrders' },
    { value: ['id', 'status', 'accountNo', 'assignedEmail'] },
    { value: true },
    { value: false },
    (col) => String(col || '').toLowerCase().replace(/_/g, ''),
    { JobOrders: joRes.JOB_ORDER_COLUMNS }
  ).evalColumns()
  assert.ok(joSparse.includes('modifiedBy'))
  assert.ok(joSparse.includes('modifiedDate'))

  // Form columns rule (!isAuditField) must still exclude modifiedBy/modifiedDate from Create and Edit dialogs
  assert.equal(joRes.isAuditField('modifiedBy'), true)
  assert.equal(joRes.isAuditField('modifiedDate'), true)
  const formCols = rawCols.filter((c) => !joRes.isAuditField(c))
  assert.ok(!formCols.includes('modifiedBy'))
  assert.ok(!formCols.includes('modifiedDate'))

  // Other endpoints still hide modifiedBy / modifiedDate from the table
  const createOtherEval = makeColumnsEvaluators('Applications')
  const otherCols = createOtherEval(
    { endpoint: 'Applications' },
    { value: ['id', 'firstName', 'modifiedBy', 'modifiedDate'] },
    { value: false },
    { value: true },
    (col) => String(col || '').toLowerCase().replace(/_/g, ''),
    {}
  ).evalColumns()
  assert.ok(!otherCols.includes('modifiedBy'))
  assert.ok(!otherCols.includes('modifiedDate'))
})

test('formatDisplayValue shows time-only for Time fields, date-only for Date fields, Date & Time for Modified Date & Time, and resolves Modified By', () => {
  const { isDateTimeField, isDateField, formatDisplayValue } = makeDateTimeAndDisplayHelpers('JobOrders')

  assert.equal(isDateTimeField('modifiedDate'), true)
  assert.equal(isDateTimeField('createdDate'), true)
  assert.equal(isDateTimeField('dateInstalled'), false)
  assert.equal(isDateTimeField('startTimeStamp'), false)

  assert.equal(isDateField('modifiedDate'), true)
  assert.equal(isDateField('startTimeStamp'), true)
  assert.equal(isDateField('dateInstalled'), true)

  // Time fields -> 12h clock only
  assert.equal(formatDisplayValue('2026-11-14T09:30:00', 'startTimeStamp'), '09:30 AM')
  assert.equal(formatDisplayValue('2026-11-14T14:45:00', 'endTimeStamp'), '02:45 PM')

  // Pure business date field with T00:00:00 -> date-only (no 12:00:00 AM noise)
  const dateOnlyFormatted = formatDisplayValue('2026-11-14T00:00:00', 'dateInstalled')
  assert.match(dateOnlyFormatted, /Nov 14, 2026/)
  assert.ok(!/AM|PM|:/.test(dateOnlyFormatted), `Expected date-only without time, got: ${dateOnlyFormatted}`)

  // Audit Modified Date & Time -> includes both date and 12-hour time
  const modFormatted = formatDisplayValue('2026-11-14T14:25:10', 'modifiedDate')
  assert.match(modFormatted, /Nov 14, 2026/)
  assert.match(modFormatted, /2:25:10 PM/)

  // Modified By -> resolved user display name
  assert.equal(formatDisplayValue(1, 'modifiedBy'), 'Gene Admin')

  // .NET sentinel 0001-01-01 -> '-'
  assert.equal(formatDisplayValue('0001-01-01T00:00:00', 'modifiedDate'), '-')
  assert.equal(formatDisplayValue('0001-01-01T00:00:00', 'startTimeStamp'), '-')
})

test('serializeTimeForPayload serializes local YYYY-MM-DDTHH:mm:ss without UTC Z shift and handles ServiceOrders time fields', () => {
  const serializeTimeForPayload = makeSerializeTimeForPayload()
  const localTime = new Date(2026, 10, 14, 16, 20, 0)
  const serialized = serializeTimeForPayload(localTime, new Date(2026, 10, 21, 0, 0, 0))
  assert.equal(serialized, '2026-11-21T16:20:00')
  assert.ok(!serialized.endsWith('Z'))
  assert.equal(serializeTimeForPayload('', null), null)
  assert.equal(serializeTimeForPayload('0001-01-01T00:00:00', null), null)

  assert.match(
    tableSrc,
    /const serializedTime = serializeTimeForPayload\(val,\s*payload\.assignedDate \|\| payload\.dateInstalled \|\| null\)/,
    'ServiceOrders saveEdit FormData serialization must use local serializeTimeForPayload'
  )
})

test('parseTimeForPicker parses Date, ISO timestamp, 24h time, and 12h AM/PM strings', () => {
  const parseTimeForPicker = makeParseTimeForPicker()

  const existing = new Date(2026, 10, 14, 8, 45, 0)
  assert.equal(parseTimeForPicker(existing), existing)

  const fromIso = parseTimeForPicker('2026-11-14T09:30:00')
  assert.ok(fromIso instanceof Date)
  assert.equal(fromIso.getHours(), 9)
  assert.equal(fromIso.getMinutes(), 30)

  const from24h = parseTimeForPicker('14:45')
  assert.ok(from24h instanceof Date)
  assert.equal(from24h.getHours(), 14)
  assert.equal(from24h.getMinutes(), 45)

  const from12h = parseTimeForPicker('02:15 PM')
  assert.ok(from12h instanceof Date)
  assert.equal(from12h.getHours(), 14)
  assert.equal(from12h.getMinutes(), 15)

  assert.equal(parseTimeForPicker(null), null)
  assert.equal(parseTimeForPicker(''), null)
  assert.equal(parseTimeForPicker('not-a-time'), null)
})

test('buildJobOrderPayload serializes time fields as local YYYY-MM-DDTHH:mm:ss anchored to dateInstalled and preserves null when blank', () => {
  const buildJobOrderPayload = makeBuildJobOrderPayload()

  const startDate = new Date(2026, 10, 14, 9, 5, 0)
  const payload = buildJobOrderPayload({
    dateInstalled: new Date(2026, 10, 20, 0, 0, 0),
    startTimeStamp: startDate,
    endTimeStamp: '02:30 PM',
  })

  assert.equal(payload.startTimeStamp, '2026-11-20T09:05:00')
  assert.equal(payload.endTimeStamp, '2026-11-20T14:30:00')
  assert.ok(!payload.startTimeStamp.endsWith('Z'))
  assert.ok(!payload.endTimeStamp.endsWith('Z'))

  const blankPayload = buildJobOrderPayload({
    startTimeStamp: null,
    endTimeStamp: '',
  })
  assert.equal(blankPayload.startTimeStamp, null)
  assert.equal(blankPayload.endTimeStamp, null)
})
