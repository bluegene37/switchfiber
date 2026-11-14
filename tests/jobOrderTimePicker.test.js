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

function makeGetFieldType(isJobOrder) {
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
    stubRef(false),
    stubRef(isJobOrder),
    stubRef(false),
    stubRef(false),
    { endpoint: isJobOrder ? 'JobOrders' : 'ServiceOrders', columnTypes: {} },
    (col) => String(col || '').toLowerCase(),
    () => null,
    { value: {} }
  )
}

function makeFormatLabel() {
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
    'normalizeColKey',
    `${fnSrc}\nreturn formatLabel`
  )(
    stubRef(false),
    stubRef(false),
    stubRef(false),
    stubRef(false),
    stubRef(false),
    stubRef(false),
    (col) => String(col || '').toLowerCase()
  )
}

function makeParseTimeForPicker() {
  const fnSrc = sliceBetween(
    tableSrc,
    'const parseTimeForPicker = (val) => {',
    '\n\nconst getRowCoordinateValue'
  )
  return new Function(`${fnSrc}\nreturn parseTimeForPicker`)()
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

test('getFieldType classifies JobOrder startTimeStamp/endTimeStamp as time only for JobOrders', () => {
  const joGetFieldType = makeGetFieldType(true)
  assert.equal(joGetFieldType('startTimeStamp'), 'time')
  assert.equal(joGetFieldType('endTimeStamp'), 'time')
  assert.equal(joGetFieldType('dateInstalled'), 'date')

  const otherGetFieldType = makeGetFieldType(false)
  assert.equal(otherGetFieldType('startTimestamp'), 'date')
  assert.equal(otherGetFieldType('stopTimestamp'), 'date')
})

test('DynamicApiTable template renders 3 timeOnly 12h DatePicker blocks (Create, View, Edit)', () => {
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
})

test('formatLabel maps startTimeStamp to Start Time and endTimeStamp to End Time', () => {
  const formatLabel = makeFormatLabel()
  assert.equal(formatLabel('startTimeStamp'), 'Start Time')
  assert.equal(formatLabel('endTimeStamp'), 'End Time')
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
