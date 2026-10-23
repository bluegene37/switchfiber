import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getDirectImageUrl, fileResultToDataUrl } from '../src/utils/imageActions.js'
import { ApplicationService } from '../src/services/applications.js'
import { LcpNapLocationService } from '../src/services/lcpNapLocations.js'

describe('Image Viewer & Endpoints Integration Suite', () => {
  test('getDirectImageUrl resolves Google Drive links to direct renderable image URLs', () => {
    const driveOpenUrl = 'https://drive.google.com/open?id=1nTGIa7t7p2GzCoTsglTyOslhdM5F0W2f'
    assert.equal(
      getDirectImageUrl(driveOpenUrl),
      'https://lh3.googleusercontent.com/d/1nTGIa7t7p2GzCoTsglTyOslhdM5F0W2f'
    )

    const driveFileUrl = 'https://drive.google.com/file/d/19iJdlwNZlEJvYgdVZ6aXVimJWyIqy126/view?usp=sharing'
    assert.equal(
      getDirectImageUrl(driveFileUrl),
      'https://lh3.googleusercontent.com/d/19iJdlwNZlEJvYgdVZ6aXVimJWyIqy126'
    )

    const directLh3 = 'https://lh3.googleusercontent.com/d/19iJdlwNZlEJvYgdVZ6aXVimJWyIqy126'
    assert.equal(getDirectImageUrl(directLh3), directLh3)

    const base64Url = 'data:image/jpeg;base64,/9j/4AAQSkZJRg=='
    assert.equal(getDirectImageUrl(base64Url), base64Url)

    const standardUrl = 'https://example.com/photos/sample.jpg'
    assert.equal(getDirectImageUrl(standardUrl), standardUrl)
  })

  test('fileResultToDataUrl parses API FileContentResult into browser-renderable data URLs', () => {
    const fileResult = {
      fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
      contentType: 'image/jpeg',
      fileDownloadName: 'test.jpg'
    }

    const dataUrl = fileResultToDataUrl(fileResult)
    assert.equal(dataUrl, 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD')

    // Null or invalid result handling
    assert.equal(fileResultToDataUrl(null), null)
    assert.equal(fileResultToDataUrl(undefined), null)
  })

  test('ApplicationService exposes getApplicationImages method', () => {
    assert.equal(typeof ApplicationService.getApplicationImages, 'function')
  })

  test('LcpNapLocationService exposes getLcpNapLocationImages and getReadingImage methods', () => {
    assert.equal(typeof LcpNapLocationService.getLcpNapLocationImages, 'function')
    assert.equal(typeof LcpNapLocationService.getReadingImage, 'function')
  })
})
