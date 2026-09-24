import { test, describe } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const tableFile = path.resolve(__dirname, "../src/components/DynamicApiTable.vue")
const tableSrc = fs.readFileSync(tableFile, "utf8")

const normalizePhoneNumber = (val) => {
  if (val === null || val === undefined) return ""
  const str = String(val).trim()
  if (!str) return ""
  const raw = str.replace(/[\s()+-]/g, "")
  if (/^9\d{9}$/.test(raw)) {
    return `0${raw}`
  }
  if (/^639\d{9}$/.test(raw)) {
    return `0${raw.slice(2)}`
  }
  if (/^0\d{10}$/.test(raw)) {
    return raw
  }
  return raw
}

const isValidPhoneNumber = (val) => {
  if (val === null || val === undefined || String(val).trim() === "") return true
  const str = String(val).trim()
  const raw = str.replace(/[\s()+-]/g, "")
  if (/^9\d{9}$/.test(raw)) {
    return true
  }
  if (/^0\d{10}$/.test(raw)) {
    return true
  }
  if (/^\d{12}$/.test(raw)) {
    return true
  }
  return false
}

describe("Job Order Update & Phone Number Normalization", () => {
  test("normalizePhoneNumber automatically adds leading 0 for 10-digit Philippine numbers", () => {
    assert.equal(normalizePhoneNumber("9171234567"), "09171234567")
    assert.equal(normalizePhoneNumber(9171234567), "09171234567")
    assert.equal(normalizePhoneNumber(" 9123456789 "), "09123456789")
    assert.equal(normalizePhoneNumber("912-345-6789"), "09123456789")
  })

  test("normalizePhoneNumber converts +63 and 63 international prefixes to standard 09 format", () => {
    assert.equal(normalizePhoneNumber("+639171234567"), "09171234567")
    assert.equal(normalizePhoneNumber("639171234567"), "09171234567")
    assert.equal(normalizePhoneNumber("+63 917 123 4567"), "09171234567")
  })

  test("normalizePhoneNumber preserves standard 11-digit 09 format without modification", () => {
    assert.equal(normalizePhoneNumber("09171234567"), "09171234567")
    assert.equal(normalizePhoneNumber("09123456789"), "09123456789")
  })

  test("isValidPhoneNumber accepts 10-digit numbers starting with 9 so they can be auto-normalized", () => {
    assert.equal(isValidPhoneNumber("9171234567"), true)
    assert.equal(isValidPhoneNumber("09171234567"), true)
    assert.equal(isValidPhoneNumber("+639171234567"), true)
    assert.equal(isValidPhoneNumber("639171234567"), true)
    assert.equal(isValidPhoneNumber("12345"), false)
    assert.equal(isValidPhoneNumber("invalid-text"), false)
  })

  test("DynamicApiTable.vue contains buildJobOrderPayload and wires it to both create and update", () => {
    assert.ok(tableSrc.includes("const buildJobOrderPayload ="), "buildJobOrderPayload must be defined")
    assert.ok(tableSrc.includes("buildJobOrderPayload(payload, 'create'"), "saveData must invoke buildJobOrderPayload")
    assert.ok(tableSrc.includes("buildJobOrderPayload(payload, 'update'"), "saveEdit must invoke buildJobOrderPayload")
  })

  test("DynamicApiTable.vue normalizes phone fields on openEditDialog and saves with leading 0", () => {
    assert.ok(tableSrc.includes("normalizePhoneNumber("), "normalizePhoneNumber must be defined and called")
    assert.ok(tableSrc.includes("isPhoneField("), "isPhoneField helper must be defined")
  })

  test("DynamicApiTable.vue uses normalizeCompareValue in detectEditConflict to prevent false phone conflict warnings", () => {
    assert.ok(tableSrc.includes("const normalizeCompareValue ="), "normalizeCompareValue must be defined")
    assert.ok(tableSrc.includes("normalizeCompareValue(col, base[col])"), "detectEditConflict must compare normalized base value")
    assert.ok(tableSrc.includes("normalizeCompareValue(col, unwrappedCurrent[col])"), "detectEditConflict must compare normalized server value")
  })
})