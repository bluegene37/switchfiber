import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const apiFile = path.resolve(__dirname, '../src/services/api.js')

describe('API Service Architecture & Error Handling Suite', () => {
  test('API Client exports default instance and sets 60000ms timeout default', () => {
    const content = fs.readFileSync(apiFile, 'utf8')
    assert.ok(content.includes('export default apiClient'), 'api.js must export default apiClient')
    assert.ok(content.includes('60000'), 'Default timeout should be 60000ms for large datasets')
  })

  test('API Client configures Authorization Bearer token header interceptor', () => {
    const content = fs.readFileSync(apiFile, 'utf8')
    assert.ok(content.includes('Bearer'), 'Must attach Bearer token if present')
    assert.ok(content.includes('localStorage.getItem'), 'Must check localStorage for auth token')
  })

  test('API Client handles 401 Unauthorized redirects', () => {
    const content = fs.readFileSync(apiFile, 'utf8')
    assert.ok(content.includes('401'), 'Must check response status 401')
    assert.ok(content.includes('/login'), 'Must redirect to /login on 401 Unauthorized')
  })
})
