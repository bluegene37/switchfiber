// Gene - Nov, 26, 2026: Unit & integration tests for Subscriber-to-ServiceOrder auto-fill and Active Service Order history navigation
import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPinia, setActivePinia } from 'pinia'

import apiClient from '../src/services/api.js'
import { useServiceOrderStore } from '../src/stores/serviceOrders.js'
import {
  isServiceOrderActive,
  getSubscriberLookupKeys,
  indexServiceOrdersBySubscriber,
  getSubscriberServiceOrderHistory,
  mapSubscriberToServiceOrderDraft
} from '../src/utils/subscriberServiceOrder.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const readRepoFile = (rel) => fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8')

const dynamicTableSrc = readRepoFile('src/components/DynamicApiTable.vue')
const serviceOrderListSrc = readRepoFile('src/views/ServiceOrderList.vue')

describe('Subscriber ServiceOrder History & Auto-Fill Utilities', () => {
  test('isServiceOrderActive treats open statuses as active and terminal statuses as closed', () => {
    for (const activeRow of [
      { visitStatus: 'Scheduled', supportStatus: 'Pending' },
      { visitStatus: 'Dispatched', supportStatus: 'For Visit' },
      { visitStatus: 'In Progress', supportStatus: 'In Progress' },
      { visitStatus: 'inprogress', supportStatus: 'inprogress' },
      { visitStatus: 'Reschedule', supportStatus: 'Pending' },
      { visitStatus: '', supportStatus: 'For Visit' },
      { visitStatus: '', supportStatus: '' }
    ]) {
      assert.equal(isServiceOrderActive(activeRow), true, `Expected active for ${JSON.stringify(activeRow)}`)
    }

    for (const closedRow of [
      { visitStatus: 'Done', supportStatus: 'Resolved' },
      { visitStatus: 'Completed', supportStatus: 'Closed' },
      { visitStatus: 'Cancelled', supportStatus: 'Pending' },
      { visitStatus: 'Scheduled', supportStatus: 'Cancelled' },
      { visitStatus: 'Failed', supportStatus: 'Pending' },
      { visitStatus: '', supportStatus: 'Resolved' },
      { visitStatus: 'Done', supportStatus: '' }
    ]) {
      assert.equal(isServiceOrderActive(closedRow), false, `Expected closed for ${JSON.stringify(closedRow)}`)
    }
  })

  test('mapSubscriberToServiceOrderDraft flattens composite RadiusUser and maps all ServiceOrder fields cleanly', () => {
    const compositeSubscriber = {
      radiusUser: {
        name: 'sub_pppoe_01',
        group: 'SwitchLite-P699',
        disabled: false
      },
      billingDetails: {
        id: 861,
        accountNo: '202309171',
        fullName: 'Juan Dela Cruz',
        contactNumber: '09171234567',
        emailAddress: 'juan@example.com',
        dateInstalled: '2025-05-01T00:00:00',
        addressCoordinates: '14.4655, 121.1922',
        region: 'Rizal',
        city: 'Binangonan',
        barangay: 'Libis (Pob.)',
        address: '123 Rizal St',
        plan: 'SwitchLite - P699',
        provider: 'SWITCH',
        connectionType: 'Fiber',
        username: 'sub_pppoe_01',
        routerModemSn: 'SN-ONT-9988',
        routerModel: 'Huawei EG8145V5',
        lcp: 'LCP-01',
        nap: 'NAP-02',
        port: 'P4',
        vlan: '101'
      }
    }

    const draft = mapSubscriberToServiceOrderDraft(compositeSubscriber, {
      currentUser: 'Tech Agent',
      currentUserEmail: 'tech@example.com'
    })

    assert.equal(draft.accountNumber, '202309171')
    assert.equal(draft.fullName, 'Juan Dela Cruz')
    assert.equal(draft.contactNumber, '09171234567')
    assert.equal(draft.emailAddress, 'juan@example.com')
    assert.equal(draft.dateInstalled, '2025-05-01T00:00:00')
    assert.equal(draft.addressCoordinates, '14.4655, 121.1922')
    assert.equal(draft.region, 'Rizal')
    assert.equal(draft.city, 'Binangonan')
    assert.equal(draft.barangay, 'Libis (Pob.)')
    assert.equal(draft.address, '123 Rizal St')
    assert.equal(draft.plan, 'SwitchLite - P699')
    assert.equal(draft.provider, 'SWITCH')
    assert.equal(draft.connectionType, 'Fiber')
    assert.equal(draft.username, 'sub_pppoe_01')
    assert.equal(draft.routerModemSN, 'SN-ONT-9988')
    assert.equal(draft.routerModel, 'Huawei EG8145V5')
    assert.equal(draft.lcp, 'LCP-01')
    assert.equal(draft.nap, 'NAP-02')
    assert.equal(draft.port, 'P4')
    assert.equal(draft.vlan, '101')
    assert.equal(draft.supportStatus, 'Pending')
    assert.equal(draft.visitStatus, 'Scheduled')
    assert.equal(draft.priorityLevel, 'Medium')
    assert.equal(draft.requestedBy, 'Tech Agent')
    assert.equal(draft.userEmail, 'tech@example.com')

    // .NET sentinel date 0001-01-01 must be stripped to ''
    const sentinelDraft = mapSubscriberToServiceOrderDraft({
      accountNo: '202309999',
      dateInstalled: '0001-01-01T00:00:00',
      name: 'user999'
    })
    assert.equal(sentinelDraft.dateInstalled, '')
    assert.equal(sentinelDraft.username, 'user999')
  })

  test('indexServiceOrdersBySubscriber and getSubscriberServiceOrderHistory match by accountNo or username, deduplicate, and separate active vs past', () => {
    const orders = [
      { id: 10, accountNumber: 'ACCT-1', username: 'user_a', visitStatus: 'Done', supportStatus: 'Resolved', createdDate: '2026-10-01T10:00:00Z' },
      { id: 15, accountNumber: 'ACCT-1', username: 'user_a', visitStatus: 'Scheduled', supportStatus: 'Pending', createdDate: '2026-11-20T10:00:00Z' },
      { id: 18, accountNumber: '', username: 'user_a', visitStatus: 'In Progress', supportStatus: 'For Visit', createdDate: '2026-11-25T12:00:00Z' },
      { id: 22, accountNumber: 'ACCT-2', username: 'user_b', visitStatus: 'Completed', supportStatus: 'Done', createdDate: '2026-11-10T09:00:00Z' }
    ]

    const idx = indexServiceOrdersBySubscriber(orders)
    const keys = getSubscriberLookupKeys({ accountNo: 'ACCT-1', name: 'user_a' })
    assert.equal(keys.accountKey, 'acct-1')
    assert.equal(keys.usernameKey, 'user_a')

    const histA = getSubscriberServiceOrderHistory({ accountNo: 'ACCT-1', name: 'user_a' }, idx)
    assert.equal(histA.all.length, 3)
    assert.equal(histA.active.length, 2)
    assert.equal(histA.past.length, 1)
    assert.equal(histA.hasActive, true)
    assert.equal(histA.hasHistory, true)
    assert.equal(histA.latestActive?.id, 18) // newest active first
    assert.equal(histA.latest?.id, 18)

    const histB = getSubscriberServiceOrderHistory({ billingDetails: { accountNo: 'ACCT-2' }, radiusUser: { name: 'user_b' } }, idx)
    assert.equal(histB.all.length, 1)
    assert.equal(histB.active.length, 0)
    assert.equal(histB.past.length, 1)
    assert.equal(histB.hasActive, false)
    assert.equal(histB.hasHistory, true)
    assert.equal(histB.latest?.id, 22)

    const histNone = getSubscriberServiceOrderHistory({ accountNo: 'UNKNOWN' }, idx)
    assert.equal(histNone.hasActive, false)
    assert.equal(histNone.hasHistory, false)
    assert.deepEqual(histNone.all, [])
  })
})

describe('useServiceOrderStore Cache & Draft Handoff + UI Wiring', () => {
  const originalGet = apiClient.get

  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    apiClient.get = originalGet
  })

  test('useServiceOrderStore deduplicates ensureServiceOrdersLoaded and handles one-shot pendingCreateDraft', async () => {
    let fetchCount = 0
    apiClient.get = async () => {
      fetchCount++
      return [{ id: 101, accountNumber: 'ACCT-101', visitStatus: 'Scheduled' }]
    }

    const store = useServiceOrderStore()
    await store.ensureServiceOrdersLoaded()
    await store.ensureServiceOrdersLoaded()
    assert.equal(fetchCount, 1)
    assert.equal(store.hasLoadedList, true)
    assert.equal(store.serviceOrders.length, 1)

    store.invalidateListCache()
    assert.equal(store.hasLoadedList, false)
    await store.ensureServiceOrdersLoaded()
    assert.equal(fetchCount, 2)

    store.setPendingCreateDraft({ accountNumber: 'ACCT-101', fullName: 'Sample' })
    const consumed = store.consumePendingCreateDraft()
    assert.deepEqual(consumed, { accountNumber: 'ACCT-101', fullName: 'Sample' })
    assert.equal(store.consumePendingCreateDraft(), null)
  })

  test('DynamicApiTable and ServiceOrderList wire Subscriber Create Service Order, History card, and locator routing', () => {
    assert.ok(dynamicTableSrc.includes('sfa-tracker-subscriber-create-so-btn'))
    assert.ok(dynamicTableSrc.includes('sfa-tracker-subscriber-active-so-btn'))
    assert.ok(dynamicTableSrc.includes('sfa-tracker-subscriber-so-history-btn'))
    assert.ok(dynamicTableSrc.includes('sfa-tracker-subscriber-so-history-card'))
    assert.ok(dynamicTableSrc.includes('sfa-tracker-subscriber-view-active-so-btn'))
    assert.ok(dynamicTableSrc.includes('sfa-tracker-subscriber-view-create-so-btn'))
    assert.ok(dynamicTableSrc.includes('createServiceOrderFromSubscriber'))
    assert.ok(dynamicTableSrc.includes('goToSubscriberServiceOrder'))
    assert.ok(dynamicTableSrc.includes('goToSubscriberServiceOrderHistory'))
    assert.ok(dynamicTableSrc.includes('consumePendingServiceOrderDraft'))
    assert.ok(dynamicTableSrc.includes('locateServiceOrderId'))
    assert.ok(dynamicTableSrc.includes('createFromSubscriber'))
    assert.ok(serviceOrderListSrc.includes('route.query.allDates'))
    assert.ok(serviceOrderListSrc.includes('route.query.locateServiceOrderId'))
  })
})
