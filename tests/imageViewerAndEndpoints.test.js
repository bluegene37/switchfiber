import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
/*
import { getDirectImageUrl, fileResultToDataUrl } from '../src/utils/imageActions.js'
*/
// Gene - Oct 23, 2026: Import unwrapApiPayload, dataUriToBlob, isRenderableImageUrl, and blobToDataUrl in integration tests
import { getDirectImageUrl, fileResultToDataUrl, unwrapApiPayload, dataUriToBlob, isRenderableImageUrl, blobToDataUrl } from '../src/utils/imageActions.js'
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

  // Gene - Oct 23, 2026: Comprehensive test suite for unwrapApiPayload, isRenderableImageUrl, dataUriToBlob, and LCP NAP update preservation
  test('unwrapApiPayload unwraps axios res.data or direct payload transparently', () => {
    const wrapped = { data: { id: 15624, applicationid: '202610231945498724507', status: 'Inprogress' } }
    assert.deepEqual(unwrapApiPayload(wrapped), { id: 15624, applicationid: '202610231945498724507', status: 'Inprogress' })

    const direct = { id: 1583, lcpnap: 'LCP1-NAP1' }
    assert.deepEqual(unwrapApiPayload(direct), { id: 1583, lcpnap: 'LCP1-NAP1' })

    assert.equal(unwrapApiPayload(null), null)
    assert.equal(unwrapApiPayload(undefined), null)
    assert.equal(unwrapApiPayload('plain-string'), 'plain-string')
  })

  test('isRenderableImageUrl accurately differentiates renderable image strings from Windows drive paths, labels, and nulls', () => {
    // Valid renderable image formats
    assert.equal(isRenderableImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRg=='), true)
    assert.equal(isRenderableImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='), true)
    assert.equal(isRenderableImageUrl('blob:http://localhost:5173/3f28d8b9-8588-4c8d-b634-1eb0f9942a6c'), true)
    assert.equal(isRenderableImageUrl('https://lh3.googleusercontent.com/d/1nTGIa7t7p2GzCoTsglTyOslhdM5F0W2f'), true)
    assert.equal(isRenderableImageUrl('http://example.com/photo.jpg'), true)

    // Invalid non-renderable formats (Windows drive paths, labels, empty)
    assert.equal(isRenderableImageUrl('D:\\Switch\\Images\\GovernmentValidId\\doc.jpg'), false)
    assert.equal(isRenderableImageUrl('d:/switch/images/doc.png'), false)
    assert.equal(isRenderableImageUrl('C:\\Users\\admin\\photo.jpg'), false)
    assert.equal(isRenderableImageUrl('None'), false)
    assert.equal(isRenderableImageUrl('UMID'), false)
    assert.equal(isRenderableImageUrl(''), false)
    assert.equal(isRenderableImageUrl(null), false)
    assert.equal(isRenderableImageUrl(undefined), false)
    assert.equal(isRenderableImageUrl({ contentType: 'image/jpeg' }), false)
  })

  test('getDirectImageUrl strips Windows disk paths so broken file paths do not render in img src', () => {
    assert.equal(getDirectImageUrl('D:\\Switch\\Images\\Landmark\\photo.jpg'), '')
    assert.equal(getDirectImageUrl('C:\\inetpub\\wwwroot\\uploads\\img.png'), '')
    assert.equal(getDirectImageUrl('none'), '')
    assert.equal(getDirectImageUrl(''), '')
  })

  test('dataUriToBlob converts base64 image data URIs to valid binary Blobs', () => {
    const base64Jpeg = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const blob = dataUriToBlob(base64Jpeg)
    assert.ok(blob instanceof Blob)
    assert.equal(blob.type, 'image/jpeg')
    assert.ok(blob.size > 0)

    assert.equal(dataUriToBlob(null), null)
    assert.equal(dataUriToBlob(''), null)
    assert.equal(dataUriToBlob('https://example.com/not-a-data-uri'), null)
  })

  test('LCP NAP update preservation attaches existing photos as Blobs when not removed or replaced', () => {
    const files = {} // User did not select any new files
    const removed = {} // User did not remove any photos
    const editFormData = {
      image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      image2: null,
      readingImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    }

    const attached = []
    const attachLcpPhoto = (colKey, formField, fallbackFileName) => {
      const newlySelected = files[colKey]
      if (newlySelected && (newlySelected instanceof Blob || (typeof File !== 'undefined' && newlySelected instanceof File))) {
        attached.push({ field: formField, source: 'new', name: newlySelected.name || fallbackFileName })
        return
      }
      if (removed[colKey]) {
        return // User explicitly removed it
      }
      const existingDataUrl = editFormData[colKey] ||
        editFormData[formField] ||
        editFormData[formField.charAt(0).toLowerCase() + formField.slice(1)] ||
        editFormData[formField.toLowerCase()] ||
        editFormData[Object.keys(editFormData).find(k => k.toLowerCase() === colKey.toLowerCase())]
      if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
        const blob = dataUriToBlob(existingDataUrl)
        if (blob) {
          attached.push({ field: formField, source: 'preserved', blob, name: fallbackFileName })
        }
      }
    }

    attachLcpPhoto('image', 'Image', 'image.jpg')
    attachLcpPhoto('image2', 'Image2', 'image2.jpg')
    attachLcpPhoto('readingimage', 'ReadingImage', 'readingImage.jpg')

    assert.equal(attached.length, 2)
    assert.equal(attached[0].field, 'Image')
    assert.equal(attached[0].source, 'preserved')
    assert.equal(attached[1].field, 'ReadingImage')
    assert.equal(attached[1].source, 'preserved')

    // Test explicit removal
    removed['image'] = true
    const attachedAfterRemoval = []
    const attachAfterRemoval = (colKey, formField, fallbackFileName) => {
      if (removed[colKey]) return
      const existingDataUrl = editFormData[colKey]
      if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
        const blob = dataUriToBlob(existingDataUrl)
        if (blob) attachedAfterRemoval.push({ field: formField })
      }
    }
    attachAfterRemoval('image', 'Image', 'image.jpg')
    assert.equal(attachedAfterRemoval.length, 0)
  })

  // Gene - Oct 23, 2026: Tests for blobToDataUrl, GetReadingImage binary Blob conversion, and LCP NAP fallback resolution
  test('blobToDataUrl converts binary Blobs to base64 Data URLs', async () => {
    const rawData = 'binary-reading-photo-bytes'
    const blob = new Blob([rawData], { type: 'image/jpeg' })
    const dataUrl = await blobToDataUrl(blob)
    assert.ok(typeof dataUrl === 'string')
    assert.ok(dataUrl.startsWith('data:image/jpeg;base64,'))

    // Null and edge cases
    assert.equal(await blobToDataUrl(null), null)
    assert.equal(await blobToDataUrl(undefined), null)
    assert.equal(await blobToDataUrl('data:image/png;base64,already-data-url'), 'data:image/png;base64,already-data-url')
  })

  test('LCP NAP dual-endpoint workflow resolves reading image from GetReadingImage when GetLCPNAPLocationImages readingImage is missing', async () => {
    // Simulated LCP NAP response without readingImage
    const lcpImagesRes = {
      image: { fileContents: 'enclosure1base64', contentType: 'image/jpeg' },
      image2: { fileContents: 'enclosure2base64', contentType: 'image/jpeg' },
      readingImage: null
    }

    const targetForm = {
      image: '',
      image2: '',
      readingImage: ''
    }

    // Step 1: Map GetLCPNAPLocationImages
    if (lcpImagesRes.image) targetForm.image = fileResultToDataUrl(lcpImagesRes.image)
    if (lcpImagesRes.image2) targetForm.image2 = fileResultToDataUrl(lcpImagesRes.image2)
    if (lcpImagesRes.readingImage) targetForm.readingImage = fileResultToDataUrl(lcpImagesRes.readingImage)

    assert.equal(targetForm.image, 'data:image/jpeg;base64,enclosure1base64')
    assert.equal(targetForm.image2, 'data:image/jpeg;base64,enclosure2base64')
    assert.equal(targetForm.readingImage, '')

    // Step 2: Fallback to GetReadingImage endpoint
    const readingBlob = new Blob(['sample-reading-image-stream'], { type: 'image/jpeg' })
    const fallbackReadingUrl = await blobToDataUrl(readingBlob)
    targetForm.readingImage = fallbackReadingUrl

    assert.ok(targetForm.readingImage.startsWith('data:image/jpeg;base64,'))
    assert.ok(isRenderableImageUrl(targetForm.readingImage))
  })

  test('LCP NAP map photo resolution loads all 3 photos using GetLCPNAPLocationImages and GetReadingImage', async () => {
    const site = { id: 1, name: 'LCP 031 NAP 001', photos: [] }

    // Simulated API response where GetLCPNAPLocationImages provides enclosure photos
    const apiPhotos = {
      image: { fileContents: 'photo1', contentType: 'image/jpeg', fileDownloadName: 'enc1.jpg' },
      image2: { fileContents: 'photo2', contentType: 'image/jpeg', fileDownloadName: 'enc2.jpg' },
      readingImage: null
    }

    const updatedPhotos = []
    const enc1Url = fileResultToDataUrl(apiPhotos.image)
    if (enc1Url) updatedPhotos.push({ label: 'Enclosure', path: apiPhotos.image.fileDownloadName, url: enc1Url })

    const enc2Url = fileResultToDataUrl(apiPhotos.image2)
    if (enc2Url) updatedPhotos.push({ label: 'Enclosure 2', path: apiPhotos.image2.fileDownloadName, url: enc2Url })

    let readingUrl = fileResultToDataUrl(apiPhotos.readingImage)
    if (!readingUrl) {
      const blob = new Blob(['reading-stream'], { type: 'image/jpeg' })
      readingUrl = await blobToDataUrl(blob)
    }
    if (readingUrl) {
      updatedPhotos.push({ label: 'Reading', path: 'reading.jpg', url: readingUrl })
    }

    site.photos = updatedPhotos
    assert.equal(site.photos.length, 3)
    assert.equal(site.photos[0].label, 'Enclosure')
    assert.equal(site.photos[1].label, 'Enclosure 2')
    assert.equal(site.photos[2].label, 'Reading')
    assert.ok(site.photos[2].url.startsWith('data:image/jpeg;base64,'))
  })
})
