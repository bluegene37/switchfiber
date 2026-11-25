// Gene - Nov, 26, 2026: Helper utilities for Subscriber (RadiusUser) Service Order history lookup, active ticket detection, and auto-fill draft mapping
import { normalizeRadiusUserRow } from './radiusUserNormalizer.js'

export const TERMINAL_SERVICE_ORDER_STATUS_TOKENS = new Set([
  'done',
  'completed',
  'resolved',
  'closed',
  'cancelled',
  'canceled',
  'failed'
])

export const HARD_CLOSED_STATUS_TOKENS = new Set([
  'cancelled',
  'canceled',
  'closed',
  'failed'
])

const normalizeToken = (val) =>
  String(val ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

const normalizeKey = (val) =>
  String(val ?? '').trim().toLowerCase()

const isEmptyOrSentinel = (val) => {
  if (val === null || val === undefined) return true
  const str = String(val).trim()
  return str === '' || str.toLowerCase() === 'null' || str.startsWith('0001-01-01')
}

const pickFirstNonEmpty = (obj, keys = [], fallback = '') => {
  if (!obj || typeof obj !== 'object') return fallback
  for (const key of keys) {
    const val = obj[key]
    if (!isEmptyOrSentinel(val)) {
      return typeof val === 'string' ? val.trim() : val
    }
  }
  return fallback
}

const getOrderSortTimestamp = (so) => {
  if (!so || typeof so !== 'object') return 0
  const dateRaw = so.modifiedDate || so.createdDate || so.assignedDate || so.dateInstalled || ''
  if (dateRaw) {
    const ts = Date.parse(dateRaw)
    if (!Number.isNaN(ts)) return ts
  }
  return 0
}

const sortServiceOrdersNewestFirst = (list = []) =>
  [...list].sort((a, b) => {
    const tsDiff = getOrderSortTimestamp(b) - getOrderSortTimestamp(a)
    if (tsDiff !== 0) return tsDiff
    return (Number(b?.id) || 0) - (Number(a?.id) || 0)
  })

/**
 * Determine whether a Service Order record is still active (open/in-progress/scheduled/pending)
 * rather than completed, resolved, closed, cancelled, or failed.
 */
export function isServiceOrderActive(serviceOrder) {
  if (!serviceOrder || typeof serviceOrder !== 'object') return false
  const visitToken = normalizeToken(serviceOrder.visitStatus ?? serviceOrder.visit_status)
  const supportToken = normalizeToken(serviceOrder.supportStatus ?? serviceOrder.support_status)

  if (HARD_CLOSED_STATUS_TOKENS.has(visitToken) || HARD_CLOSED_STATUS_TOKENS.has(supportToken)) {
    return false
  }
  if (visitToken) {
    return !TERMINAL_SERVICE_ORDER_STATUS_TOKENS.has(visitToken)
  }
  if (supportToken) {
    return !TERMINAL_SERVICE_ORDER_STATUS_TOKENS.has(supportToken)
  }
  return true
}

/**
 * Extract normalized lookup keys (`accountKey`, `usernameKey`, `primaryKey`)
 * from either a composite `{ radiusUser, billingDetails }` or flattened Subscriber record.
 */
export function getSubscriberLookupKeys(subscriber) {
  const flat = subscriber && (subscriber.radiusUser || subscriber.billingDetails)
    ? normalizeRadiusUserRow(subscriber)
    : (subscriber || {})
  const accountKey = normalizeKey(flat.accountNo ?? flat.accountNumber ?? flat.accountno)
  const usernameKey = normalizeKey(flat.username ?? flat.name)
  return {
    accountKey,
    usernameKey,
    primaryKey: accountKey || usernameKey || ''
  }
}

/**
 * Build lookup maps (`byAccount`, `byUsername`) over all Service Orders sorted newest-first.
 */
export function indexServiceOrdersBySubscriber(serviceOrders = []) {
  const byAccount = new Map()
  const byUsername = new Map()
  if (!Array.isArray(serviceOrders)) return { byAccount, byUsername }

  for (const so of serviceOrders) {
    if (!so || typeof so !== 'object') continue
    const acctKey = normalizeKey(so.accountNumber ?? so.accountNo)
    const userKey = normalizeKey(so.username)
    if (acctKey) {
      if (!byAccount.has(acctKey)) byAccount.set(acctKey, [])
      byAccount.get(acctKey).push(so)
    }
    if (userKey) {
      if (!byUsername.has(userKey)) byUsername.set(userKey, [])
      byUsername.get(userKey).push(so)
    }
  }

  for (const [k, arr] of byAccount.entries()) {
    byAccount.set(k, sortServiceOrdersNewestFirst(arr))
  }
  for (const [k, arr] of byUsername.entries()) {
    byUsername.set(k, sortServiceOrdersNewestFirst(arr))
  }

  return { byAccount, byUsername }
}

/**
 * Summarize all Service Order history (`all`, `active`, `past`, `latestActive`, `latest`)
 * for a given Subscriber record using a pre-built index.
 */
export function getSubscriberServiceOrderHistory(subscriber, index = { byAccount: new Map(), byUsername: new Map() }) {
  const empty = {
    all: [],
    active: [],
    past: [],
    latestActive: null,
    latest: null,
    hasActive: false,
    hasHistory: false
  }
  if (!subscriber || typeof subscriber !== 'object') return empty

  const { accountKey, usernameKey } = getSubscriberLookupKeys(subscriber)
  if (!accountKey && !usernameKey) return empty

  const combined = []
  const seenIds = new Set()
  const seenRefs = new Set()

  const collect = (list) => {
    if (!Array.isArray(list)) return
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const itemId = item.id !== undefined && item.id !== null && String(item.id).trim() !== ''
        ? String(item.id).trim()
        : ''
      if (itemId) {
        if (seenIds.has(itemId)) continue
        seenIds.add(itemId)
      } else {
        if (seenRefs.has(item)) continue
        seenRefs.add(item)
      }
      combined.push(item)
    }
  }

  if (accountKey && index?.byAccount) collect(index.byAccount.get(accountKey))
  if (usernameKey && index?.byUsername) collect(index.byUsername.get(usernameKey))

  const all = sortServiceOrdersNewestFirst(combined)
  const active = []
  const past = []
  for (const so of all) {
    if (isServiceOrderActive(so)) {
      active.push(so)
    } else {
      past.push(so)
    }
  }

  return {
    all,
    active,
    past,
    latestActive: active[0] || null,
    latest: all[0] || null,
    hasActive: active.length > 0,
    hasHistory: all.length > 0
  }
}

/**
 * Map a composite or flattened Subscriber (`RadiusUser`) record into an
 * auto-filled Service Order Create dialog draft.
 */
export function mapSubscriberToServiceOrderDraft(subscriber, { currentUser = '', currentUserEmail = '' } = {}) {
  const flat = subscriber && (subscriber.radiusUser || subscriber.billingDetails)
    ? normalizeRadiusUserRow(subscriber)
    : (subscriber || {})

  const rawDateInstalled = pickFirstNonEmpty(flat, ['dateInstalled', 'date_installed'], '')
  const safeDateInstalled = !isEmptyOrSentinel(rawDateInstalled) ? rawDateInstalled : ''

  return {
    accountNumber: pickFirstNonEmpty(flat, ['accountNo', 'accountNumber', 'accountno'], ''),
    fullName: pickFirstNonEmpty(flat, ['fullName', 'fullname'], ''),
    contactNumber: pickFirstNonEmpty(flat, ['contactNumber', 'contactnumber'], ''),
    emailAddress: pickFirstNonEmpty(flat, ['emailAddress', 'emailaddress', 'userEmail'], ''),
    dateInstalled: safeDateInstalled,
    addressCoordinates: pickFirstNonEmpty(flat, ['addressCoordinates', 'coordinates', 'coordinate'], ''),
    region: pickFirstNonEmpty(flat, ['region'], ''),
    city: pickFirstNonEmpty(flat, ['city'], ''),
    barangay: pickFirstNonEmpty(flat, ['barangay'], ''),
    address: pickFirstNonEmpty(flat, ['address', 'location'], ''),
    plan: pickFirstNonEmpty(flat, ['plan'], ''),
    provider: pickFirstNonEmpty(flat, ['provider'], 'SWITCH'),
    connectionType: pickFirstNonEmpty(flat, ['connectionType', 'connection_type'], 'Fiber'),
    username: pickFirstNonEmpty(flat, ['username', 'name'], ''),
    routerModemSN: pickFirstNonEmpty(flat, ['routerModemSn', 'routerModemSN', 'router_modem_sn'], ''),
    routerModel: pickFirstNonEmpty(flat, ['routerModel', 'router_model'], ''),
    lcp: pickFirstNonEmpty(flat, ['lcp'], ''),
    nap: pickFirstNonEmpty(flat, ['nap'], ''),
    port: pickFirstNonEmpty(flat, ['port'], ''),
    vlan: pickFirstNonEmpty(flat, ['vlan'], ''),
    supportStatus: 'Pending',
    visitStatus: 'Scheduled',
    priorityLevel: 'Medium',
    requestedBy: String(currentUser || '').trim(),
    userEmail: String(currentUserEmail || '').trim()
  }
}
