// Address -> map pin for records without stored coordinates (all Applications,
// the ~118 Job Orders with a blank addressCoordinates). The lookup tries the
// most specific address first and widens until something resolves.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildAddressQueries, buildAddressQueryTiers, extractEmbeddedCoordinates } from '../src/services/geocoding.js'

describe('buildAddressQueries', () => {
  test('most specific first, then barangay+city+province, then city+province', () => {
    const q = buildAddressQueries({ street: '12 Rizal St', barangay: 'Tagpos', city: 'Binangonan', province: 'Rizal' })
    assert.deepEqual(q, [
      '12 Rizal St, Tagpos, Binangonan, Rizal, Philippines',
      'Tagpos, Binangonan, Rizal, Philippines',
      'Binangonan, Rizal, Philippines'
    ])
  })

  test('skips blank parts and never repeats a query', () => {
    const q = buildAddressQueries({ street: '', barangay: 'Tagpos', city: 'Binangonan', province: 'Rizal' })
    assert.deepEqual(q, ['Tagpos, Binangonan, Rizal, Philippines', 'Binangonan, Rizal, Philippines'])
  })

  test('strips the "(Barangay, City, Province)" echo the Job Order form stores as the street', () => {
    const q = buildAddressQueries({ street: '(Apo-Aporawan, Aborlan, Rizal)', barangay: 'Apo-Aporawan', city: 'Aborlan', province: 'Rizal' })
    assert.deepEqual(q, ['Apo-Aporawan, Aborlan, Rizal, Philippines', 'Aborlan, Rizal, Philippines'])
  })

  test('drops digits-only or placeholder streets that are not addresses', () => {
    assert.deepEqual(buildAddressQueries({ street: '9123456789', city: 'Binangonan', province: 'Rizal' }), ['Binangonan, Rizal, Philippines'])
    assert.deepEqual(buildAddressQueries({ street: 'Test', barangay: 'Test', city: 'Aborlan', province: 'Rizal' }), ['Aborlan, Rizal, Philippines'])
  })

  test('returns nothing when there is no city and no province', () => {
    assert.deepEqual(buildAddressQueries({ street: 'Somewhere' }), [])
  })

  test('reports the real precision of each query, not its position', () => {
    const levels = (parts) => buildAddressQueryTiers(parts).map(t => t.level)
    assert.deepEqual(levels({ street: '12 Rizal St', barangay: 'Tagpos', city: 'Binangonan', province: 'Rizal' }), ['street', 'barangay', 'city'])
    assert.deepEqual(levels({ street: '(Pag-asa, Binangonan, Rizal)', barangay: 'Pag-asa', city: 'Binangonan', province: 'Rizal' }), ['barangay', 'city'])
    assert.deepEqual(levels({ city: 'Binangonan', province: 'Rizal' }), ['city'])
  })

  test('a GPS note typed into the street line is read as exact coordinates and kept out of the query', () => {
    const street = 'J. P. Rizal Avenue, Brgy. Poblacion, Binangonan, GPS: 14.46476, 121.19234'
    assert.deepEqual(extractEmbeddedCoordinates(street), { lat: 14.46476, lng: 121.19234 })
    assert.equal(extractEmbeddedCoordinates('12 Rizal St'), null)
    assert.equal(buildAddressQueries({ street, barangay: 'Poblacion', city: 'Binangonan', province: 'Rizal' })[0],
      'J. P. Rizal Avenue, Brgy. Poblacion, Binangonan, Poblacion, Binangonan, Rizal, Philippines')
  })
})
