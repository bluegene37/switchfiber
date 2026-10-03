import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dynamicTablePath = path.resolve(__dirname, '../src/components/DynamicApiTable.vue')
const dynamicTableSrc = fs.readFileSync(dynamicTablePath, 'utf8')
const stylePath = path.resolve(__dirname, '../src/style.css')
const styleSrc = fs.readFileSync(stylePath, 'utf8')
const dashboardPath = path.resolve(__dirname, '../src/views/Dashboard.vue')
const dashboardSrc = fs.readFileSync(dashboardPath, 'utf8')

describe('Rescheduled vs Scheduled Status Badge Color Separation', () => {
  test('DynamicApiTable getStatusBadgeConfig differentiates Rescheduled from Scheduled', () => {
    // Check that lower === 'rescheduled' or 'reschedule' returns purple classes
    assert.match(dynamicTableSrc, /lower === 'rescheduled'/, 'getStatusBadgeConfig must handle rescheduled')
    assert.match(dynamicTableSrc, /lower === 'reschedule'/, 'getStatusBadgeConfig must handle reschedule')
    assert.match(dynamicTableSrc, /sfa-status-rescheduled badge-purple text-purple/, 'getStatusBadgeConfig must return purple badge classes for rescheduled')
  })

  test('Scheduled status receives blue/info styling while Rescheduled receives purple styling', () => {
    // Extract active getStatusBadgeConfig function body from DynamicApiTable (skip commented-out block)
    const matches = [...dynamicTableSrc.matchAll(/const getStatusBadgeConfig = \(val\) => \{([\s\S]*?)\n\}/g)]
    assert.ok(matches.length > 0, 'Must find getStatusBadgeConfig function')
    // The active implementation is the last definition
    const activeFn = matches[matches.length - 1]
    const fnBody = activeFn[1]

    // Simulate getStatusBadgeConfig behavior
    const simGetStatusBadgeConfig = new Function('val', `${fnBody}`)

    const scheduledConfig = simGetStatusBadgeConfig('Scheduled')
    const rescheduledConfig = simGetStatusBadgeConfig('Rescheduled')
    const rescheduleConfig = simGetStatusBadgeConfig('Reschedule')

    // Scheduled should be blue/info
    assert.match(scheduledConfig.class, /text-info/, 'Scheduled badge must use text-info (blue)')
    assert.match(scheduledConfig.class, /bg-info/, 'Scheduled badge must use bg-info (blue)')

    // Rescheduled and Reschedule should be purple and NOT blue
    assert.match(rescheduledConfig.class, /badge-purple|text-purple|sfa-status-rescheduled/, 'Rescheduled badge must use purple classes')
    assert.doesNotMatch(rescheduledConfig.class, /text-info/, 'Rescheduled badge must NOT use text-info')
    assert.doesNotMatch(rescheduledConfig.class, /bg-info/, 'Rescheduled badge must NOT use bg-info')

    assert.match(rescheduleConfig.class, /badge-purple|text-purple|sfa-status-rescheduled/, 'Reschedule badge must use purple classes')
    assert.doesNotMatch(rescheduleConfig.class, /text-info/, 'Reschedule badge must NOT use text-info')

    // Ensure they have different classes
    assert.notEqual(scheduledConfig.class, rescheduledConfig.class, 'Scheduled and Rescheduled must have different badge styles')
  })

  test('style.css defines sfa-status-rescheduled and badge-purple with purple colors and dark mode', () => {
    assert.match(styleSrc, /\.sfa-status-rescheduled/, 'style.css must define .sfa-status-rescheduled')
    assert.match(styleSrc, /\.badge-purple/, 'style.css must define .badge-purple')
    assert.match(styleSrc, /#7c3aed|124,\s*58,\s*237/, 'style.css must use purple color tokens')
    assert.match(styleSrc, /html\[data-bs-theme="dark"\]\s+\.sfa-status-rescheduled/, 'style.css must support dark mode for rescheduled')
  })

  test('DynamicApiTable selected row styles preserve purple text on highlighted row', () => {
    assert.match(dynamicTableSrc, /\.highlight-selected-row[\s\S]*?\.badge\.text-purple/, 'DynamicApiTable must style text-purple on selected rows')
    assert.match(dynamicTableSrc, /\.highlight-selected-row[\s\S]*?\.badge\.sfa-status-rescheduled/, 'DynamicApiTable must style sfa-status-rescheduled on selected rows')
  })

  test('Dashboard.vue handles rescheduled status without color conflict', () => {
    assert.match(dashboardSrc, /isRescheduled/, 'Dashboard must define isRescheduled helper')
    assert.match(dashboardSrc, /sfa-status-rescheduled badge-purple text-purple/, 'Dashboard Tag must apply purple classes for rescheduled')
    assert.match(dashboardSrc, /reschedule:\s*\{\s*label:\s*'Rescheduled',\s*color:\s*'#7c3aed'\s*\}/, 'Dashboard charts must map reschedule to purple')
  })
})
