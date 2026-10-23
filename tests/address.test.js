import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../public/data/philippines')

describe('Philippine PSGC Geographic Data Suite', () => {
  test('Regions dataset is valid and non-empty', () => {
    const regionsPath = path.join(dataDir, 'regions.json')
    assert.ok(fs.existsSync(regionsPath), 'regions.json must exist in public/data/philippines')
    const raw = fs.readFileSync(regionsPath, 'utf8')
    const data = JSON.parse(raw)
    assert.ok(Array.isArray(data), 'regions data must be an array')
    assert.ok(data.length >= 17, 'Must have at least 17 Philippine regions (NCR, Region I-XIII, BARMM, CAR, CARAGA)')

    const sample = data[0]
    assert.ok(sample.code, 'Region must have a code')
    assert.ok(sample.name, 'Region must have a name')
  })

  test('Provinces dataset is valid', () => {
    const provincesPath = path.join(dataDir, 'provinces.json')
    assert.ok(fs.existsSync(provincesPath), 'provinces.json must exist')
    const data = JSON.parse(fs.readFileSync(provincesPath, 'utf8'))
    assert.ok(Array.isArray(data), 'provinces must be an array')
    assert.ok(data.length > 50, 'Philippines has 80+ provinces')
  })

  test('Cities and Municipalities dataset is valid', () => {
    const citiesPath = path.join(dataDir, 'cities.json')
    assert.ok(fs.existsSync(citiesPath), 'cities.json must exist')
    const data = JSON.parse(fs.readFileSync(citiesPath, 'utf8'))
    assert.ok(Array.isArray(data), 'cities must be an array')
    assert.ok(data.length > 100, 'Must have hundreds of cities/municipalities')
  })

  // Gene - Oct 23, 2026: Verify CALABARZON province to city mapping and bundled address integration
  test('CALABARZON provinces map to valid cities and municipalities', () => {
    const provincesPath = path.join(dataDir, 'provinces.json')
    const citiesPath = path.join(dataDir, 'cities.json')
    const provinces = JSON.parse(fs.readFileSync(provincesPath, 'utf8'))
    const cities = JSON.parse(fs.readFileSync(citiesPath, 'utf8'))

    const CALABARZON_REGION_CODE = '040000000'
    const calabarzonProvinces = provinces.filter(p => p.regionCode === CALABARZON_REGION_CODE)
    assert.equal(calabarzonProvinces.length, 5, 'CALABARZON must have exactly 5 provinces (Batangas, Cavite, Laguna, Quezon, Rizal)')

    // Every CALABARZON province must have cities/municipalities associated with it
    calabarzonProvinces.forEach(prov => {
      const provCities = cities.filter(c => c.provinceCode === prov.code)
      assert.ok(provCities.length > 10, `${prov.name} must have multiple cities/municipalities (found ${provCities.length})`)
    })

    // Specifically test Rizal (where the plant lives in Binangonan)
    const rizal = calabarzonProvinces.find(p => p.name === 'Rizal')
    assert.ok(rizal, 'Rizal province must exist')
    const rizalCities = cities.filter(c => c.provinceCode === rizal.code)
    assert.ok(rizalCities.some(c => c.name === 'Binangonan'), 'Binangonan must be in Rizal cities')
  })

  test('DynamicApiTable bundles cities data and omits virtualScroller on city/barangay dropdowns', () => {
    const tablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
    const content = fs.readFileSync(tablePath, 'utf8')
    assert.ok(content.includes('import defaultCities from'), 'DynamicApiTable must import defaultCities')
    assert.ok(content.includes('defaultFormattedCities'), 'DynamicApiTable must define defaultFormattedCities')
    assert.ok(!content.includes("getFieldType(col) === 'city_dropdown'\" class=\"position-relative\">\n                <Select\n                  :id=\"col\"\n                  v-model=\"formData[col]\"\n                  :options=\"createCityOptions\"\n                  optionLabel=\"label\"\n                  optionValue=\"value\"\n                  :filter=\"true\"\n                  :disabled=\"isCityDisabled(formData)\"\n                  @change=\"onCityChanged(formData)\"\n                  :virtualScrollerOptions"), 'City dropdown must not use virtualScrollerOptions')
  })
})
