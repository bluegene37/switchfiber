// CrudService is the single place table-driven pages build REST URLs. These
// tests pin the URL shape and argument passing so a change here is caught
// before every table page in the app breaks at once.
import { test, describe, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import apiClient from '../src/services/api.js'
import { CrudService, toPath, list, getById, create, update, remove, requestWithRouteFallback } from '../src/services/crud.js'

const original = {}
const calls = []
const stub = (verb, impl) => {
  original[verb] = apiClient[verb]
  apiClient[verb] = (...args) => {
    calls.push([verb, ...args])
    return impl ? impl(...args) : Promise.resolve({ ok: true })
  }
}

beforeEach(() => { calls.length = 0 })
afterEach(() => {
  for (const [verb, fn] of Object.entries(original)) apiClient[verb] = fn
  for (const k of Object.keys(original)) delete original[k]
})

describe('toPath', () => {
  test('normalizes leading and trailing slashes', () => {
    assert.equal(toPath('JobOrders'), '/JobOrders')
    assert.equal(toPath('/JobOrders'), '/JobOrders')
    assert.equal(toPath('JobOrders/'), '/JobOrders')
    assert.equal(toPath(' JobOrders/status-date '), '/JobOrders/status-date')
  })
})

describe('CrudService REST mapping', () => {
  test('list sends GET /{endpoint} with params', async () => {
    stub('get')
    await list('JobOrders', { status: 'Inprogress' })
    assert.deepEqual(calls, [['get', '/JobOrders', { params: { status: 'Inprogress' } }]])
  })

  test('list with no params sends params: undefined so axios adds no query string', async () => {
    stub('get')
    await list('/Users')
    assert.deepEqual(calls, [['get', '/Users', { params: undefined }]])
  })

  test('getById sends GET /{endpoint}/{id}', async () => {
    stub('get')
    await getById('Users', 7)
    assert.deepEqual(calls, [['get', '/Users/7', {}]])
  })

  test('create sends POST /{endpoint} with the payload untouched', async () => {
    stub('post')
    const payload = { name: 'Plan A', amount: 999 }
    await create('Plans', payload)
    assert.deepEqual(calls, [['post', '/Plans', payload, {}]])
  })

  test('update sends PUT /{endpoint}/{id} with the payload untouched', async () => {
    stub('put')
    const payload = { id: 3, status: 'Completed' }
    await update('JobOrders', 3, payload)
    assert.deepEqual(calls, [['put', '/JobOrders/3', payload, {}]])
  })

  test('remove sends DELETE /{endpoint}/{id}', async () => {
    stub('delete')
    await remove('Menus', 12)
    assert.deepEqual(calls, [['delete', '/Menus/12', {}]])
  })

  test('the CrudService object exposes every function', () => {
    for (const fn of ['toPath', 'list', 'getById', 'create', 'update', 'remove', 'requestWithRouteFallback']) {
      assert.equal(typeof CrudService[fn], 'function', `${fn} missing from CrudService`)
    }
  })
})

describe('requestWithRouteFallback', () => {
  test('retries the alternate route only on 404', async () => {
    stub('post', (path) => {
      if (path === '/AccesslevelMenu') return Promise.reject(Object.assign(new Error('nf'), { status: 404 }))
      return Promise.resolve({ created: true })
    })
    const res = await requestWithRouteFallback('post', '/AccesslevelMenu', '/AccessLevelMenu', { a: 1 })
    assert.deepEqual(res, { created: true })
    assert.deepEqual(calls.map(c => c[1]), ['/AccesslevelMenu', '/AccessLevelMenu'])
  })

  test('does not retry on a non-404 failure', async () => {
    stub('delete', () => Promise.reject(Object.assign(new Error('boom'), { status: 500 })))
    await assert.rejects(() => requestWithRouteFallback('delete', '/AccesslevelMenu/1', '/AccessLevelMenu/1'), /boom/)
    assert.equal(calls.length, 1)
  })

  test('omits the body argument when no payload is given', async () => {
    stub('delete')
    await requestWithRouteFallback('delete', 'AccesslevelMenu/1', 'AccessLevelMenu/1')
    assert.deepEqual(calls, [['delete', '/AccesslevelMenu/1']])
  })
})
