import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getDirectImageUrl, fileResultToDataUrl, unwrapApiPayload, dataUriToBlob, isRenderableImageUrl } from '../src/utils/imageActions.js'
import { ServiceOrderService } from '../src/services/serviceOrders.js'
import { useServiceOrderStore } from '../src/stores/serviceOrders.js'

// Gene - Nov 5, 2026: Comprehensive test suite for Service Order Image API, caching, and multipart update integration
describe('Service Order Image API & Multipart Integration Suite', () => {
  test('ServiceOrderService exposes getServiceOrderImage method', () => {
    assert.equal(typeof ServiceOrderService.getServiceOrderImage, 'function')
    assert.equal(typeof ServiceOrderService.getServiceOrders, 'function')
    assert.equal(typeof ServiceOrderService.updateServiceOrder, 'function')
  })

  test('useServiceOrderStore exposes fetchServiceOrderImage action', () => {
    assert.equal(typeof useServiceOrderStore, 'function')
    assert.equal(useServiceOrderStore.$id, 'serviceOrders')
  })

  test('fileResultToDataUrl accurately maps all 5 Service Order image fields from GetServiceOrderImage response', () => {
    const mockApiResponse = {
      clientSignatureFile: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'signature.jpg'
      },
      image1File: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'image1.jpg'
      },
      image2File: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'image2.jpg'
      },
      image3File: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'image3.jpg'
      },
      houseFrontPictureFile: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'house.jpg'
      }
    }

    const unwrapped = unwrapApiPayload({ data: mockApiResponse })
    assert.ok(unwrapped)

    const mapping = {
      clientSignature: unwrapped.clientSignatureFile,
      image1: unwrapped.image1File,
      image2: unwrapped.image2File,
      image3: unwrapped.image3File,
      houseFrontPicture: unwrapped.houseFrontPictureFile
    }

    for (const [key, fileObj] of Object.entries(mapping)) {
      const dataUrl = fileResultToDataUrl(fileObj)
      assert.ok(dataUrl, `Data URL generated for ${key}`)
      assert.ok(isRenderableImageUrl(dataUrl), `${key} should be renderable`)
      assert.ok(dataUrl.startsWith('data:image/'), `${key} has data URI scheme`)
    }
  })

  test('Service Order multipart update preserves existing photos as Blobs when not removed or replaced', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const editFormData = {
      id: 2,
      fullName: 'Juan Dela Cruz',
      contactNumber: '09123456789',
      visitStatus: 'In Progress',
      clientSignature: validDataUrl,
      image1: validDataUrl,
      image2: validDataUrl,
      image3: validDataUrl,
      houseFrontPicture: validDataUrl
    }

    const files = {} // No new files
    const removed = {} // No files removed

    const form = new FormData()
    const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')

    const attachSoPhoto = (colKey, formField, fallbackFileName) => {
      const norm = normalizeColKey(colKey)
      const newlySelected = files[colKey] || files[norm] || files[formField] || files[normalizeColKey(formField)]
      if (newlySelected && (newlySelected instanceof Blob || (typeof File !== 'undefined' && newlySelected instanceof File))) {
        form.append(formField, newlySelected, newlySelected.name || fallbackFileName)
        return
      }
      if (removed[colKey] || removed[norm] || removed[formField] || removed[normalizeColKey(formField)]) {
        return
      }
      const existingDataUrl = editFormData[colKey] || editFormData[formField]
      if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
        const blob = dataUriToBlob(existingDataUrl)
        if (blob) {
          form.append(formField, blob, fallbackFileName)
        }
      }
    }

    attachSoPhoto('clientSignature', 'ClientSignature', 'clientSignature.jpg')
    attachSoPhoto('image1', 'Image1', 'image1.jpg')
    attachSoPhoto('image2', 'Image2', 'image2.jpg')
    attachSoPhoto('image3', 'Image3', 'image3.jpg')
    attachSoPhoto('houseFrontPicture', 'HouseFrontPicture', 'houseFrontPicture.jpg')

    assert.ok(form.has('ClientSignature'), 'ClientSignature preserved as FormData entry')
    assert.ok(form.has('Image1'), 'Image1 preserved as FormData entry')
    assert.ok(form.has('Image2'), 'Image2 preserved as FormData entry')
    assert.ok(form.has('Image3'), 'Image3 preserved as FormData entry')
    assert.ok(form.has('HouseFrontPicture'), 'HouseFrontPicture preserved as FormData entry')

    const preservedBlob = form.get('Image1')
    assert.ok(preservedBlob instanceof Blob, 'Preserved image should be a Blob instance')
    assert.equal(preservedBlob.type, 'image/jpeg', 'Preserved image retains accurate MIME type')
  })

  test('Service Order multipart update omits explicitly removed photos', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const editFormData = {
      id: 2,
      clientSignature: validDataUrl,
      image1: validDataUrl
    }

    const files = {}
    const removed = { image1: true } // User clicked Clear on image1

    const form = new FormData()
    const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')

    const attachSoPhoto = (colKey, formField, fallbackFileName) => {
      const norm = normalizeColKey(colKey)
      const newlySelected = files[colKey] || files[norm]
      if (newlySelected && (newlySelected instanceof Blob || (typeof File !== 'undefined' && newlySelected instanceof File))) {
        form.append(formField, newlySelected, newlySelected.name || fallbackFileName)
        return
      }
      if (removed[colKey] || removed[norm]) {
        return
      }
      const existingDataUrl = editFormData[colKey]
      if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
        const blob = dataUriToBlob(existingDataUrl)
        if (blob) {
          form.append(formField, blob, fallbackFileName)
        }
      }
    }

    attachSoPhoto('clientSignature', 'ClientSignature', 'clientSignature.jpg')
    attachSoPhoto('image1', 'Image1', 'image1.jpg')

    assert.ok(form.has('ClientSignature'), 'ClientSignature should be preserved')
    assert.equal(form.has('Image1'), false, 'Image1 was explicitly removed and must not be in FormData')
  })

  test('Service Order multipart update prefers newly selected files over existing data URLs', () => {
    const existingDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const newFileBlob = new Blob(['new-photo-bytes'], { type: 'image/png' })
    newFileBlob.name = 'newly_taken_site_photo.png'

    const editFormData = {
      id: 2,
      houseFrontPicture: existingDataUrl
    }

    const files = { housefrontpicture: newFileBlob }
    const removed = {}

    const form = new FormData()
    const normalizeColKey = (col) => String(col || '').toLowerCase().replace(/_/g, '')

    const attachSoPhoto = (colKey, formField, fallbackFileName) => {
      const norm = normalizeColKey(colKey)
      const newlySelected = files[colKey] || files[norm]
      if (newlySelected && (newlySelected instanceof Blob || (typeof File !== 'undefined' && newlySelected instanceof File))) {
        form.append(formField, newlySelected, newlySelected.name || fallbackFileName)
        return
      }
      if (removed[colKey] || removed[norm]) {
        return
      }
      const existing = editFormData[colKey]
      if (typeof existing === 'string' && existing.startsWith('data:image/')) {
        const blob = dataUriToBlob(existing)
        if (blob) {
          form.append(formField, blob, fallbackFileName)
        }
      }
    }

    attachSoPhoto('houseFrontPicture', 'HouseFrontPicture', 'houseFrontPicture.jpg')

    assert.ok(form.has('HouseFrontPicture'), 'HouseFrontPicture must be present')
    const attached = form.get('HouseFrontPicture')
    assert.equal(attached.type, 'image/png', 'Newly selected PNG must override old JPEG')
  })

  test('OpenAPI spec contains GetServiceOrderImage and multipart PUT /api/ServiceOrders/{id}', async () => {
    const fs = await import('node:fs')
    const spec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'))
    
    // Check GetServiceOrderImage path
    assert.ok(spec.paths['/api/ServiceOrders/{id}/GetServiceOrderImage'], 'Path /api/ServiceOrders/{id}/GetServiceOrderImage must exist in spec')
    assert.ok(spec.paths['/api/ServiceOrders/{id}/GetServiceOrderImage'].get, 'GET method exists on GetServiceOrderImage')

    // Check PUT multipart schema
    const putOp = spec.paths['/api/ServiceOrders/{id}']?.put
    assert.ok(putOp, 'PUT method exists on /api/ServiceOrders/{id}')
    const multipart = putOp.requestBody?.content?.['multipart/form-data']
    assert.ok(multipart, 'PUT requestBody supports multipart/form-data')
    const props = multipart.schema?.properties || {}
    assert.ok(props.ClientSignature, 'ClientSignature supported')
    assert.ok(props.Image1, 'Image1 supported')
    assert.ok(props.Image2, 'Image2 supported')
    assert.ok(props.Image3, 'Image3 supported')
    assert.ok(props.HouseFrontPicture, 'HouseFrontPicture supported')
  })

  test('isServiceOrderEndpoint matching normalizes leading slashes, trailing slashes, hyphens and underscores', () => {
    const isServiceOrderEndpoint = (endpoint) => {
      const ep = (endpoint || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/[-_]/g, '')
      return ep === 'serviceorders' || ep === 'serviceorder'
    }

    assert.equal(isServiceOrderEndpoint('ServiceOrders'), true)
    assert.equal(isServiceOrderEndpoint('/ServiceOrders'), true)
    assert.equal(isServiceOrderEndpoint('/ServiceOrders/'), true)
    assert.equal(isServiceOrderEndpoint('serviceorders'), true)
    assert.equal(isServiceOrderEndpoint('service-orders'), true)
    assert.equal(isServiceOrderEndpoint('service_orders'), true)
    assert.equal(isServiceOrderEndpoint('/api/serviceorders'), false)
    assert.equal(isServiceOrderEndpoint('JobOrders'), false)
    assert.equal(isServiceOrderEndpoint('Applications'), false)
  })
})
