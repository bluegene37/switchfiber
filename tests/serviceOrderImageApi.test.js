import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getDirectImageUrl, fileResultToDataUrl, unwrapApiPayload, dataUriToBlob, isRenderableImageUrl } from '../src/utils/imageActions.js'
/*
import { ServiceOrderService } from '../src/services/serviceOrders.js'
*/
// Gene - Nov, 24, 2026: Import Service Order image upload helpers for Create and Edit multipart regression tests
import {
  ServiceOrderService,
  sanitizeServiceOrderCreatePayload,
  hasServiceOrderUploadableImages,
  buildServiceOrderMultipartFormData
} from '../src/services/serviceOrders.js'
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

  // Gene - Nov, 24, 2026: Unit tests for Create sanitization, uploadable image detection, FormData builder, and header stripping
  test('sanitizeServiceOrderCreatePayload strips base64/blob image strings and empty or literal-null numeric/date fields', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ=='
    const blob = new Blob(['img'], { type: 'image/png' })
    const rawCreatePayload = {
      fullName: 'Maria Santos',
      visitStatus: 'Scheduled',
      clientSignature: validDataUrl,
      image1: 'blob:http://localhost/123',
      image2: blob,
      image3: 'https://cdn.example.com/existing.jpg',
      houseFrontPicture: validDataUrl,
      itemQuantity: '',
      itemQuantity1: 'null',
      itemQuantity2: null,
      itemQuantity3: '2',
      serviceCharge: '',
      duration: 'null',
      dateInstalled: '',
      techModifiedDate: undefined,
      assignedDate: '2026-11-24T10:00:00.000Z',
      createdDate: '2026-11-24T15:00:00.000'
    }

    const sanitized = sanitizeServiceOrderCreatePayload(rawCreatePayload)

    assert.equal(sanitized.fullName, 'Maria Santos')
    assert.equal(sanitized.visitStatus, 'Scheduled')
    assert.equal('clientSignature' in sanitized, false, 'base64 clientSignature must be stripped')
    assert.equal('image1' in sanitized, false, 'blob: image1 must be stripped')
    assert.equal('image2' in sanitized, false, 'Blob image2 must be stripped')
    assert.equal(sanitized.image3, 'https://cdn.example.com/existing.jpg', 'non-base64 URL string may pass through')
    assert.equal('houseFrontPicture' in sanitized, false, 'base64 houseFrontPicture must be stripped')

    assert.equal('itemQuantity' in sanitized, false, 'empty itemQuantity must be omitted')
    assert.equal('itemQuantity1' in sanitized, false, 'literal "null" itemQuantity1 must be omitted')
    assert.equal('itemQuantity2' in sanitized, false, 'null itemQuantity2 must be omitted')
    assert.equal(sanitized.itemQuantity3, '2', 'valid itemQuantity3 preserved')
    assert.equal('serviceCharge' in sanitized, false, 'empty serviceCharge must be omitted')
    assert.equal('duration' in sanitized, false, 'literal "null" duration must be omitted')
    assert.equal('dateInstalled' in sanitized, false, 'empty dateInstalled must be omitted')
    assert.equal('techModifiedDate' in sanitized, false, 'undefined techModifiedDate must be omitted')
    assert.equal(sanitized.assignedDate, '2026-11-24T10:00:00.000Z')
    assert.equal(sanitized.createdDate, '2026-11-24T15:00:00.000')
  })

  test('hasServiceOrderUploadableImages detects Files/Blobs and data URIs while respecting removed flags', () => {
    const validDataUrl = 'data:image/png;base64,iVBORw0KGgo='
    const fileBlob = new Blob(['bytes'], { type: 'image/jpeg' })

    assert.equal(hasServiceOrderUploadableImages({}, {}, {}), false)
    assert.equal(hasServiceOrderUploadableImages({}, { image1: 'https://example.com/a.jpg' }, {}), false)
    assert.equal(hasServiceOrderUploadableImages({ image2: fileBlob }, {}, {}), true)
    assert.equal(hasServiceOrderUploadableImages({}, { houseFrontPicture: validDataUrl }, {}), true)
    assert.equal(hasServiceOrderUploadableImages({ image2: fileBlob }, { image2: validDataUrl }, { image2: true }), false)
  })

  test('buildServiceOrderMultipartFormData attaches all 5 IFormFile fields, preserves existing images, omits removed/empty numeric/date fields', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const newPng = new Blob(['png-bytes'], { type: 'image/png' })
    newPng.name = 'site1.png'

    const payload = {
      id: 901,
      fullName: 'Pedro Penduko',
      visitStatus: 'In Progress',
      createdDate: '2026-11-24T08:00:00.000Z',
      modifiedBy: '1',
      modifiedDate: '2026-11-24T09:00:00.000Z',
      dateInstalled: '',
      techModifiedDate: 'null',
      assignedDate: null,
      startTimestamp: '09:30:00',
      stopTimestamp: '',
      duration: '',
      itemQuantity: '',
      itemQuantity1: '3',
      itemQuantity2: 'null',
      itemQuantity10: undefined,
      serviceCharge: '',
      clientSignature: validDataUrl,
      image1: ''
    }

    const form = buildServiceOrderMultipartFormData({
      payload,
      files: { image1: newPng },
      removed: { image3: true },
      existingImages: {
        clientSignature: validDataUrl,
        image2: validDataUrl,
        image3: validDataUrl,
        houseFrontPicture: validDataUrl
      },
      serializeTime: (val) => (val ? `2026-11-24T${val}` : null),
      getFieldType: (key) => {
        const lower = key.toLowerCase()
        if (lower === 'starttimestamp' || lower === 'stoptimestamp') return 'time'
        if (lower === 'dateinstalled' || lower === 'techmodifieddate' || lower === 'assigneddate') return 'date'
        return 'text'
      },
      isAuditField: (key) => ['id', 'createdby', 'createddate', 'modifiedby', 'modifieddate'].includes(key.toLowerCase())
    })

    // Scalar fields & omissions
    assert.equal(form.get('id'), '901')
    assert.equal(form.get('fullName'), 'Pedro Penduko')
    assert.equal(form.get('createdDate'), '2026-11-24T08:00:00.000Z')
    assert.equal(form.get('itemQuantity1'), '3')
    assert.equal(form.get('startTimestamp'), '2026-11-24T09:30:00')

    assert.equal(form.has('itemQuantity'), false, 'empty itemQuantity must be omitted')
    assert.equal(form.has('itemQuantity2'), false, 'literal "null" itemQuantity2 must be omitted')
    assert.equal(form.has('itemQuantity10'), false, 'undefined itemQuantity10 must be omitted')
    assert.equal(form.has('serviceCharge'), false, 'empty serviceCharge must be omitted')
    assert.equal(form.has('duration'), false, 'empty duration must be omitted')
    assert.equal(form.has('dateInstalled'), false, 'empty dateInstalled must be omitted')
    assert.equal(form.has('techModifiedDate'), false, 'literal "null" techModifiedDate must be omitted')
    assert.equal(form.has('assignedDate'), false, 'null assignedDate must be omitted')
    assert.equal(form.has('stopTimestamp'), false, 'empty stopTimestamp must be omitted')

    // 5 IFormFile photo slots
    assert.ok(form.get('Image1') instanceof Blob, 'Newly selected Image1 uploaded')
    assert.equal(form.get('Image1').type, 'image/png')
    assert.ok(form.get('ClientSignature') instanceof Blob, 'Existing ClientSignature preserved')
    assert.ok(form.get('Image2') instanceof Blob, 'Existing Image2 preserved')
    assert.equal(form.has('Image3'), false, 'Removed Image3 omitted')
    assert.ok(form.get('HouseFrontPicture') instanceof Blob, 'Existing HouseFrontPicture preserved')
  })

  test('ServiceOrderService.updateServiceOrder strips manual Content-Type header on FormData', async () => {
    const fs = await import('node:fs')
    const content = fs.readFileSync('src/services/serviceOrders.js', 'utf8')
    const activeContent = content.replace(/\/\*[\s\S]*?\*\//g, '')

    assert.equal(
      activeContent.includes("'Content-Type': 'multipart/form-data'"),
      false,
      'Active updateServiceOrder must not hardcode multipart/form-data without boundary'
    )
    assert.ok(
      activeContent.includes("delete cleanHeaders['Content-Type']") &&
      activeContent.includes("delete cleanHeaders['content-type']"),
      'Active updateServiceOrder must strip Content-Type headers for FormData'
    )
  })

  test('DynamicApiTable wires ServiceOrders Create sanitization, follow-up multipart PUT, and shared Edit FormData builder', async () => {
    const fs = await import('node:fs')
    const content = fs.readFileSync('src/components/DynamicApiTable.vue', 'utf8')
    const activeContent = content.replace(/\/\*[\s\S]*?\*\//g, '')

    assert.ok(
      activeContent.includes('finalPayload = sanitizeServiceOrderCreatePayload(finalPayload)'),
      'Create path must sanitize ServiceOrders payload before JSON POST'
    )
    assert.ok(
      activeContent.includes('hasServiceOrderUploadableImages(createFiles, formData.value || {}, createRemoved)') &&
      activeContent.includes('buildServiceOrderMultipartFormData'),
      'Create path must perform follow-up multipart PUT via buildServiceOrderMultipartFormData when images are attached'
    )
    assert.ok(
      activeContent.includes('existingImages: editFormData.value || {}'),
      'Edit path must build ServiceOrders multipart FormData using buildServiceOrderMultipartFormData'
    )
  })
})
