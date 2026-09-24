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
})
