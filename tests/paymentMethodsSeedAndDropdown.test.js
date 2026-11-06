// Gene - Nov 6, 2026: Comprehensive test suite for Payment Methods seeding, service catalog, and DynamicApiTable dropdown wiring
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import https from 'node:https'
import { DEFAULT_PAYMENT_METHODS, PaymentMethodService } from '../src/services/paymentMethods.js'
import { paymentMethodsSeedData, paymentTypesSeedData } from '../scripts/seed_payment_methods.js'

test('Payment Methods Seed Data & Service Catalog', async (t) => {
  await t.test('DEFAULT_PAYMENT_METHODS includes all standard payment options', () => {
    const names = DEFAULT_PAYMENT_METHODS.map(m => m.name)
    assert.ok(names.includes('Cash'), 'Should include Cash')
    assert.ok(names.includes('GCash'), 'Should include GCash')
    assert.ok(names.includes('Maya'), 'Should include Maya')
    assert.ok(names.includes('Bank Transfer'), 'Should include Bank Transfer')
    assert.ok(names.includes('Credit / Debit Card'), 'Should include Credit / Debit Card')
    assert.ok(names.includes('Check'), 'Should include Check')
    assert.ok(names.includes('Bayad Center / OTC'), 'Should include Bayad Center / OTC')
  })

  await t.test('Each standard payment method has name and descriptive summary', () => {
    for (const item of DEFAULT_PAYMENT_METHODS) {
      assert.ok(typeof item.name === 'string' && item.name.length > 0, `Method must have name: ${item.name}`)
      assert.ok(typeof item.description === 'string' && item.description.length > 5, `Method must have description: ${item.description}`)
    }
  })

  await t.test('PaymentMethodService defines all standard REST methods and seeder helper', () => {
    assert.equal(typeof PaymentMethodService.getPaymentMethods, 'function')
    assert.equal(typeof PaymentMethodService.getPaymentMethodById, 'function')
    assert.equal(typeof PaymentMethodService.createPaymentMethod, 'function')
    assert.equal(typeof PaymentMethodService.updatePaymentMethod, 'function')
    assert.equal(typeof PaymentMethodService.deletePaymentMethod, 'function')
    assert.equal(typeof PaymentMethodService.seedDefaultPaymentMethods, 'function')
  })

  await t.test('seedDefaultPaymentMethods runs idempotently and only creates missing methods', async () => {
    const mockCreated = []
    const mockExisting = [
      { id: 1, name: 'Cash', description: 'Existing cash' }
    ]

    const mockService = {
      ...PaymentMethodService,
      getPaymentMethods: async () => ({ data: mockExisting }),
      createPaymentMethod: async (data) => {
        mockCreated.push(data)
        return { data: { id: mockCreated.length + 10, ...data } }
      }
    }

    const result = await mockService.seedDefaultPaymentMethods(99)
    assert.equal(result.existing.length, 1)
    // 7 standard methods minus 1 existing Cash = 6 created
    assert.equal(result.created.length, 6)
    assert.equal(result.total, 7)
    assert.ok(!mockCreated.some(c => c.name.toLowerCase() === 'cash'), 'Should not re-create Cash')
  })
})

test('DynamicApiTable Component Wiring for Payment Methods', async (t) => {
  const dynamicApiTablePath = path.resolve('src/components/DynamicApiTable.vue')
  const content = fs.readFileSync(dynamicApiTablePath, 'utf8')

  await t.test('DynamicApiTable declares paymentMethodOptions with standard fallback list', () => {
    assert.match(content, /const paymentMethodOptions = ref\(\[/, 'Declares paymentMethodOptions ref')
    assert.match(content, /\{ label: 'Cash', value: 'Cash' \}/, 'Includes Cash')
    assert.match(content, /\{ label: 'GCash', value: 'GCash' \}/, 'Includes GCash')
    assert.match(content, /\{ label: 'Maya', value: 'Maya' \}/, 'Includes Maya')
    assert.match(content, /\{ label: 'Bank Transfer', value: 'Bank Transfer' \}/, 'Includes Bank Transfer')
  })

  await t.test('DynamicApiTable implements fetchPaymentMethodsLookup with single-flight promise', () => {
    assert.match(content, /let paymentMethodsPromise = null/, 'Declares paymentMethodsPromise')
    assert.match(content, /const fetchPaymentMethodsLookup =/, 'Declares fetchPaymentMethodsLookup')
    assert.match(content, /CrudService\.list\('PaymentMethods'\)/, 'Calls CrudService.list(PaymentMethods)')
  })

  await t.test('DynamicApiTable includes fetchPaymentMethodsLookup inside fetchFormLookups', () => {
    assert.match(content, /await fetchPaymentMethodsLookup\(\)/, 'Awaits fetchPaymentMethodsLookup in form lookups')
  })

  await t.test('DynamicApiTable declares needsPaymentMethodLookup and watches it on table load', () => {
    assert.match(content, /const needsPaymentMethodLookup = computed\(\(\) =>/, 'Declares needsPaymentMethodLookup')
    assert.match(content, /isPaymentEndpoint\.value\s*\|\|\s*isPaymentMethodEndpoint\.value/, 'Checks isPaymentEndpoint and isPaymentMethodEndpoint')
    assert.match(content, /if \(needsPaymentMethodLookup\.value\) fetchPaymentMethodsLookup\(\)/, 'Invokes fetchPaymentMethodsLookup in refreshTableLookups')
    assert.match(content, /watch\(\[.*needsPaymentMethodLookup.*\], refreshTableLookups/, 'Watches needsPaymentMethodLookup for reactive updates')
  })

  await t.test('DynamicApiTable features Seed Payment Methods button on PaymentMethods endpoint', () => {
    assert.match(content, /v-if="isPaymentMethodEndpoint"/, 'Renders conditionally for PaymentMethods')
    assert.match(content, /@click="seedPaymentMethodsViaApi"/, 'Binds click to seedPaymentMethodsViaApi')
    assert.match(content, /const isSeedingPaymentMethods = ref\(false\)/, 'Declares loading state ref')
    assert.match(content, /const seedPaymentMethodsViaApi = async \(\) =>/, 'Implements seedPaymentMethodsViaApi')
  })

  await t.test('openCreateDialog defaults paymentMethod and transactionType from paymentMethodOptions', () => {
    assert.match(content, /formData\.value\.paymentMethod = defaultMethod/, 'Sets paymentMethod to defaultMethod')
    assert.match(content, /formData\.value\.transactionType = defaultMethod/, 'Sets transactionType to defaultMethod')
  })
})

test('Standalone Seeder Script Verification', async (t) => {
  await t.test('paymentMethodsSeedData contains all required payment channels', () => {
    assert.ok(Array.isArray(paymentMethodsSeedData))
    assert.ok(paymentMethodsSeedData.length >= 7)
    const names = paymentMethodsSeedData.map(p => p.name)
    assert.ok(names.includes('Cash'))
    assert.ok(names.includes('GCash'))
    assert.ok(names.includes('Maya'))
    assert.ok(names.includes('Bank Transfer'))
    assert.ok(names.includes('Credit / Debit Card'))
    assert.ok(names.includes('Check'))
    assert.ok(names.includes('Bayad Center / OTC'))
  })

  await t.test('paymentTypesSeedData contains standard subscription and fee types', () => {
    assert.ok(Array.isArray(paymentTypesSeedData))
    assert.ok(paymentTypesSeedData.length >= 5)
    const names = paymentTypesSeedData.map(p => p.name)
    assert.ok(names.includes('Monthly Subscription'))
    assert.ok(names.includes('Installation Fee'))
    assert.ok(names.includes('Reconnection Fee'))
    assert.ok(names.includes('Device / Router Fee'))
    assert.ok(names.includes('Advance Payment'))
  })
})

test('Live Server Verification for /api/PaymentMethods', async (t) => {
  await t.test('GET /api/PaymentMethods returns seeded standard payment methods', async () => {
    const res = await new Promise((resolve, reject) => {
      https.get('https://admin.switchfiber.ph/api/PaymentMethods', (resp) => {
        let d = ''
        resp.on('data', chunk => d += chunk)
        resp.on('end', () => {
          try {
            resolve({ status: resp.statusCode, body: JSON.parse(d) })
          } catch (e) {
            reject(e)
          }
        })
      }).on('error', reject)
    })

    assert.equal(res.status, 200, 'GET /api/PaymentMethods should return 200 OK')
    assert.ok(Array.isArray(res.body), 'Response body should be an array')
    assert.ok(res.body.length >= 7, `Expected at least 7 payment methods, got ${res.body.length}`)

    const names = res.body.map(item => item.name)
    assert.ok(names.includes('Cash'), 'Server must contain Cash')
    assert.ok(names.includes('GCash'), 'Server must contain GCash')
    assert.ok(names.includes('Maya'), 'Server must contain Maya')
    assert.ok(names.includes('Bank Transfer'), 'Server must contain Bank Transfer')
    assert.ok(names.includes('Credit / Debit Card'), 'Server must contain Credit / Debit Card')
    assert.ok(names.includes('Check'), 'Server must contain Check')
    assert.ok(names.includes('Bayad Center / OTC'), 'Server must contain Bayad Center / OTC')
  })
})
