import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const landingPath = path.resolve(__dirname, '../src/views/Landing.vue')

describe('Landing Page Widget Customization & Free APIs Suite', () => {
  const landingSource = fs.readFileSync(landingPath, 'utf8')

  test('Landing.vue implements widget preferences reactive state with local storage persistence', () => {
    assert.ok(
      landingSource.includes('sf_landing_widget_prefs'),
      'Landing.vue must persist widget preferences in localStorage under sf_landing_widget_prefs'
    )
    assert.ok(
      landingSource.includes('widgetPrefs'),
      'Landing.vue must declare reactive widgetPrefs'
    )
  })

  test('Landing.vue declares individual toggles for verses, quotes, TIL, pictures, and history', () => {
    assert.ok(landingSource.includes('showVerse'), 'Must support showVerse preference')
    assert.ok(landingSource.includes('showQuote'), 'Must support showQuote preference')
    assert.ok(landingSource.includes('showTil'), 'Must support showTil preference')
    assert.ok(landingSource.includes('showPicture'), 'Must support showPicture preference')
    assert.ok(landingSource.includes('showHistory'), 'Must support showHistory preference')
  })

  test('Landing.vue integrates vetted zero-key free APIs and curated collections', () => {
    assert.ok(landingSource.includes('bible-api.com'), 'Must integrate Bible API')
    assert.ok(landingSource.includes('POPULAR_INSPIRING_VERSES'), 'Must curate popular verses on love, family, grace, faith, hope')
    assert.ok(landingSource.includes('dummyjson.com/quotes') || landingSource.includes('quotes'), 'Must integrate Quotes API')
    assert.ok(landingSource.includes('uselessfacts.jsph.pl') || landingSource.includes('CURATED_TIL_INSIGHTS'), 'Must integrate TIL insights')
    assert.ok(landingSource.includes('picsum.photos') || landingSource.includes('CURATED_LANDSCAPES'), 'Must integrate curated photos')
    assert.ok(landingSource.includes('onthisday') || landingSource.includes('wikipedia'), 'Must integrate Today in History API')
  })

  test('Landing.vue provides shuffle and reload handlers for each free widget', () => {
    assert.ok(landingSource.includes('fetchBibleVerse'), 'Must provide fetchBibleVerse method')
    assert.ok(landingSource.includes('fetchQuote'), 'Must provide fetchQuote method')
    assert.ok(landingSource.includes('fetchTil'), 'Must provide fetchTil method')
    assert.ok(landingSource.includes('fetchPicture'), 'Must provide fetchPicture method')
    assert.ok(landingSource.includes('fetchTodayInHistory'), 'Must provide fetchTodayInHistory method')
  })

  test('Landing.vue places inspiration feed at top after user login info and before operational grid', () => {
    const inspirationIndex = landingSource.indexOf('sfa-tracker-inspiration-section')
    const clockIndex = landingSource.indexOf('sfa-tracker-clock-card')
    assert.ok(inspirationIndex > 0, 'Inspiration section must be present')
    assert.ok(clockIndex > 0, 'Clock card must be present')
    assert.ok(inspirationIndex < clockIndex, 'Inspiration section must appear before clock card')
  })

  test('Landing.vue positions time card in right column alongside operations calendar to reduce width and height', () => {
    const calendarIndex = landingSource.indexOf('Operations Calendar')
    const clockIndex = landingSource.indexOf('sfa-tracker-clock-card')
    assert.ok(calendarIndex > 0, 'Calendar must be present')
    assert.ok(clockIndex > 0, 'Clock must be present')
    assert.ok(calendarIndex < clockIndex, 'Clock card must be rendered in right column after calendar')
  })

  test('Landing.vue renders large image canvas for picture of the day', () => {
    assert.ok(
      landingSource.includes('height: 280px') || landingSource.includes('1000/600'),
      'Picture of the day must feature an enlarged image canvas'
    )
  })

  test('Landing.vue includes in-place Customize Feed controls', () => {
    assert.ok(
      landingSource.includes('openCustomizeModal') && landingSource.includes('closeCustomizeModal'),
      'Must provide openCustomizeModal and closeCustomizeModal functions'
    )
  })

  test('Landing.vue integrates single high-definition photography API (Lorem Picsum / Unsplash) without dog or cat APIs', () => {
    assert.ok(landingSource.includes('picsum.photos'), 'Must integrate Lorem Picsum HD photo API')
    assert.ok(landingSource.includes('CURATED_LANDSCAPES'), 'Must maintain curated landscapes collection')
    assert.ok(!landingSource.includes('dog.ceo'), 'Must not include dog.ceo API')
    assert.ok(!landingSource.includes('thecatapi.com'), 'Must not include thecatapi.com API')
    assert.ok(landingSource.includes('fetchPicture'), 'Must provide fetchPicture method')
  })

  test('Landing.vue does not contain NOC Technical Support & Dispatch or placeholder NOC contacts', () => {
    assert.ok(!landingSource.includes('NOC Technical Support'), 'Must not contain NOC Technical Support')
    assert.ok(!landingSource.includes('noc@switchfiber.ph'), 'Must not contain noc@switchfiber.ph')
  })

  test('Landing.vue configures Bible verse widget with King James Version (KJV)', () => {
    assert.ok(landingSource.includes('translation=kjv'), 'Must query KJV translation from Bible API')
    assert.ok(landingSource.includes('King James Version'), 'Must reference King James Version')
    assert.ok(!landingSource.includes('World English Bible'), 'Must not use World English Bible')
  })
})
