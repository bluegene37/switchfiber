// Field search inside the Create / Update / View dialogs: the query narrows each
// section card to its matching fields instead of jumping to one. This tests the
// pure filter the component drives its v-show bindings from.
import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { filterFormSections, fieldMatchesQuery } from '../src/utils/formFieldSearch.js'

const labelFor = (col) => ({
  billingDay: 'Billing Day',
  installationFee: 'Installation Fee',
  emailAddress: 'Email Address',
  region: 'Province',
  barangay1: 'Barangay',
  status: 'Status'
}[col] || col)

const aliasesFor = (col) => (col === 'barangay1' ? ['Barangay 1', 'Barangay 2'] : [])

const sections = [
  { key: 'quick', title: 'Quick Fields', columns: ['status', 'billingDay'] },
  { key: 'profile', title: 'Customer Profile', columns: ['emailAddress', 'region', 'barangay1'] },
  { key: 'billing', title: 'Billing', columns: ['installationFee', 'billingDay'] }
]

describe('fieldMatchesQuery', () => {
  test('is case-insensitive against the label', () => {
    assert.equal(fieldMatchesQuery('billing day', { label: 'Billing Day', key: 'billingDay' }), true)
    assert.equal(fieldMatchesQuery('BILLING', { label: 'Billing Day', key: 'billingDay' }), true)
  })

  test('matches the raw column key and the label with spaces removed', () => {
    assert.equal(fieldMatchesQuery('billingday', { label: 'Billing Day', key: 'billingDay' }), true)
    assert.equal(fieldMatchesQuery('region', { label: 'Province', key: 'region' }), true)
  })

  test('requires every typed word to match', () => {
    assert.equal(fieldMatchesQuery('bill day', { label: 'Billing Day', key: 'billingDay' }), true)
    assert.equal(fieldMatchesQuery('bill fee', { label: 'Billing Day', key: 'billingDay' }), false)
  })

  test('matches aliases for combined fields', () => {
    assert.equal(fieldMatchesQuery('barangay 2', { label: 'Barangay', key: 'barangay1', aliases: ['Barangay 2'] }), true)
  })

  test('an empty or whitespace query matches everything', () => {
    assert.equal(fieldMatchesQuery('   ', { label: 'x', key: 'x' }), true)
    assert.equal(fieldMatchesQuery('', { label: 'x', key: 'x' }), true)
  })
})

describe('filterFormSections', () => {
  test('with no query every section and field is shown', () => {
    const r = filterFormSections(sections, '', { labelFor, aliasesFor })
    assert.equal(r.active, false)
    assert.equal(r.shown, 7)
    assert.equal(r.total, 7)
    assert.equal(r.isSectionShown('profile'), true)
    assert.equal(r.isFieldShown('profile', 'region'), true)
  })

  test('keeps matching fields under their own section and hides the rest', () => {
    const r = filterFormSections(sections, 'billing day', { labelFor, aliasesFor })
    assert.equal(r.active, true)
    assert.equal(r.isSectionShown('quick'), true)
    assert.equal(r.isFieldShown('quick', 'billingDay'), true)
    assert.equal(r.isFieldShown('quick', 'status'), false)
    assert.equal(r.isSectionShown('billing'), true)
    assert.equal(r.isFieldShown('billing', 'billingDay'), true)
    assert.equal(r.isFieldShown('billing', 'installationFee'), false)
    assert.equal(r.isSectionShown('profile'), false)
    assert.equal(r.shown, 2)
    assert.equal(r.shownInSection('quick'), 1)
    assert.equal(r.shownInSection('billing'), 1)
    assert.equal(r.shownInSection('profile'), 0)
  })

  test('a query that matches the section title shows that whole section', () => {
    const r = filterFormSections(sections, 'customer', { labelFor, aliasesFor })
    assert.equal(r.isSectionShown('profile'), true)
    assert.equal(r.isFieldShown('profile', 'emailAddress'), true)
    assert.equal(r.isFieldShown('profile', 'barangay1'), true)
    assert.equal(r.isSectionShown('billing'), false)
    assert.equal(r.shown, 3)
  })

  test('reports nothing shown when nothing matches', () => {
    const r = filterFormSections(sections, 'zzz', { labelFor, aliasesFor })
    assert.equal(r.shown, 0)
    assert.equal(r.isSectionShown('quick'), false)
    assert.equal(r.isFieldShown('quick', 'status'), false)
  })

  test('tolerates sections without columns', () => {
    const r = filterFormSections([{ key: 'items', title: 'Materials' }], 'mat', { labelFor, aliasesFor })
    assert.equal(r.isSectionShown('items'), true)
    assert.equal(r.total, 0)
  })
})
