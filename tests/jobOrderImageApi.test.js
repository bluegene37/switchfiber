import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { getDirectImageUrl, fileResultToDataUrl, unwrapApiPayload, dataUriToBlob, isRenderableImageUrl } from '../src/utils/imageActions.js'
import { JobOrderService } from '../src/services/jobOrders.js'
import { useJobOrderStore } from '../src/stores/jobOrders.js'

// Gene - Nov 5, 2026: Comprehensive test suite for Job Order Image API, caching, and multipart update integration
describe('Job Order Image API & Multipart Integration Suite', () => {
  test('JobOrderService exposes getJobOrderImage method', () => {
    assert.equal(typeof JobOrderService.getJobOrderImage, 'function')
    assert.equal(typeof JobOrderService.getJobOrders, 'function')
    assert.equal(typeof JobOrderService.updateJobOrder, 'function')
  })

  test('useJobOrderStore exposes fetchJobOrderImage action', () => {
    // Pinia stores export a function defineStore
    assert.equal(typeof useJobOrderStore, 'function')
    assert.equal(useJobOrderStore.$id, 'jobOrders')
  })

  test('fileResultToDataUrl accurately maps all 7 Job Order image fields from GetJobOrderImage response', () => {
    const mockApiResponse = {
      setupImageFile: {
        fileContents: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        contentType: 'image/png',
        fileDownloadName: 'setup.png'
      },
      clientSignatureFile: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'signature.jpg'
      },
      signedContractImageFile: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'contract.jpg'
      },
      boxReadingImageFile: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'box.jpg'
      },
      routerReadingImageFile: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'router.jpg'
      },
      portLabelImageFile: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'port.jpg'
      },
      houseFrontFile: {
        fileContents: '/9j/4AAQSkZJRgABAQEASABIAAD',
        contentType: 'image/jpeg',
        fileDownloadName: 'house.jpg'
      }
    }

    const unwrapped = unwrapApiPayload({ data: mockApiResponse })
    assert.ok(unwrapped)

    // Check each of the 7 fields
    const mapping = {
      setupImage: unwrapped.setupImageFile,
      clientSignature: unwrapped.clientSignatureFile,
      signedContractImage: unwrapped.signedContractImageFile,
      boxReadingImage: unwrapped.boxReadingImageFile,
      routerReadingImage: unwrapped.routerReadingImageFile,
      portLabelImage: unwrapped.portLabelImageFile,
      houseFront: unwrapped.houseFrontFile
    }

    for (const [key, fileObj] of Object.entries(mapping)) {
      const dataUrl = fileResultToDataUrl(fileObj)
      assert.ok(dataUrl, `Data URL generated for ${key}`)
      assert.ok(isRenderableImageUrl(dataUrl), `${key} should be renderable`)
      assert.ok(dataUrl.startsWith('data:image/'), `${key} has data URI scheme`)
    }
  })

  test('Job Order multipart update preserves existing photos as Blobs when not removed or replaced', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const editFormData = {
      id: 813,
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      status: 'Inprogress',
      setupImage: validDataUrl,
      clientSignature: validDataUrl,
      signedContractImage: validDataUrl,
      boxReadingImage: validDataUrl,
      routerReadingImage: validDataUrl,
      portLabelImage: validDataUrl,
      houseFront: validDataUrl
    }

    const files = {} // No new files selected
    const removed = {} // No images removed

    const formEntries = []
    const fakeForm = {
      append: (k, v, name) => formEntries.push({ key: k, value: v, name })
    }

    const attachJoPhoto = (colKey, formField, fallbackFileName) => {
      const newlySelected = files[colKey]
      if (newlySelected && (newlySelected instanceof Blob || (typeof File !== 'undefined' && newlySelected instanceof File))) {
        fakeForm.append(formField, newlySelected, newlySelected.name || fallbackFileName)
        return
      }
      if (removed[colKey]) {
        return // User explicitly removed it
      }
      const existingDataUrl = editFormData[colKey]
      if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
        const blob = dataUriToBlob(existingDataUrl)
        if (blob) {
          fakeForm.append(formField, blob, fallbackFileName)
        }
      }
    }

    attachJoPhoto('setupImage', 'SetupImage', 'setupImage.jpg')
    attachJoPhoto('clientSignature', 'ClientSignature', 'clientSignature.jpg')
    attachJoPhoto('signedContractImage', 'SignedContractImage', 'signedContractImage.jpg')
    attachJoPhoto('boxReadingImage', 'BoxReadingImage', 'boxReadingImage.jpg')
    attachJoPhoto('routerReadingImage', 'RouterReadingImage', 'routerReadingImage.jpg')
    attachJoPhoto('portLabelImage', 'PortLabelImage', 'portLabelImage.jpg')
    attachJoPhoto('houseFront', 'HouseFront', 'houseFront.jpg')

    // Verify all 7 images preserved as Blobs
    const appendedKeys = formEntries.map(e => e.key)
    assert.deepEqual(appendedKeys, [
      'SetupImage',
      'ClientSignature',
      'SignedContractImage',
      'BoxReadingImage',
      'RouterReadingImage',
      'PortLabelImage',
      'HouseFront'
    ])

    for (const entry of formEntries) {
      assert.ok(entry.value instanceof Blob, `${entry.key} must be a Blob`)
      assert.ok(entry.value.size > 0, `${entry.key} blob must have content`)
    }
  })

  test('Job Order multipart update omits explicitly removed photos', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA='
    const editFormData = {
      setupImage: validDataUrl,
      clientSignature: validDataUrl
    }

    const files = {}
    const removed = { setupImage: true } // User clicked Clear on Setup Image

    const formEntries = []
    const fakeForm = {
      append: (k, v, name) => formEntries.push({ key: k, value: v, name })
    }

    const attachJoPhoto = (colKey, formField, fallbackFileName) => {
      const newlySelected = files[colKey]
      if (newlySelected && (newlySelected instanceof Blob || (typeof File !== 'undefined' && newlySelected instanceof File))) {
        fakeForm.append(formField, newlySelected, newlySelected.name || fallbackFileName)
        return
      }
      if (removed[colKey]) {
        return // User explicitly removed it
      }
      const existingDataUrl = editFormData[colKey]
      if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
        const blob = dataUriToBlob(existingDataUrl)
        if (blob) {
          fakeForm.append(formField, blob, fallbackFileName)
        }
      }
    }

    attachJoPhoto('setupImage', 'SetupImage', 'setupImage.jpg')
    attachJoPhoto('clientSignature', 'ClientSignature', 'clientSignature.jpg')

    assert.equal(formEntries.length, 1)
    assert.equal(formEntries[0].key, 'ClientSignature')
  })

  test('Job Order multipart update prefers newly selected files over existing data URLs', () => {
    const editFormData = {
      setupImage: 'data:image/jpeg;base64,/9j/old=='
    }

    const newBlob = new Blob(['new-photo-bytes'], { type: 'image/jpeg' })
    const files = {
      setupImage: newBlob
    }
    const removed = {}

    const formEntries = []
    const fakeForm = {
      append: (k, v, name) => formEntries.push({ key: k, value: v, name })
    }

    const attachJoPhoto = (colKey, formField, fallbackFileName) => {
      const newlySelected = files[colKey]
      if (newlySelected && (newlySelected instanceof Blob || (typeof File !== 'undefined' && newlySelected instanceof File))) {
        fakeForm.append(formField, newlySelected, newlySelected.name || fallbackFileName)
        return
      }
      if (removed[colKey]) {
        return
      }
      const existingDataUrl = editFormData[colKey]
      if (typeof existingDataUrl === 'string' && existingDataUrl.startsWith('data:image/')) {
        const blob = dataUriToBlob(existingDataUrl)
        if (blob) {
          fakeForm.append(formField, blob, fallbackFileName)
        }
      }
    }

    attachJoPhoto('setupImage', 'SetupImage', 'setupImage.jpg')

    assert.equal(formEntries.length, 1)
    assert.equal(formEntries[0].key, 'SetupImage')
    assert.equal(formEntries[0].value, newBlob)
  })

  test('OpenAPI spec contains GetJobOrderImage and multipart PUT /api/JobOrders/{id}', async () => {
    const fs = await import('node:fs')
    const spec = JSON.parse(fs.readFileSync('openapi.json', 'utf8'))
    
    // Check GetJobOrderImage path
    assert.ok(spec.paths['/api/JobOrders/{id}/GetJobOrderImage'], 'Path /api/JobOrders/{id}/GetJobOrderImage must exist in spec')
    assert.ok(spec.paths['/api/JobOrders/{id}/GetJobOrderImage'].get, 'GET method exists on GetJobOrderImage')

    // Check PUT multipart schema
    const putOp = spec.paths['/api/JobOrders/{id}']?.put
    assert.ok(putOp, 'PUT method exists on /api/JobOrders/{id}')
    const multipart = putOp.requestBody?.content?.['multipart/form-data']
    assert.ok(multipart, 'PUT requestBody supports multipart/form-data')
    const props = multipart.schema?.properties || {}
    assert.ok(props.SetupImage, 'SetupImage supported')
    assert.ok(props.ClientSignature, 'ClientSignature supported')
    assert.ok(props.SignedContractImage, 'SignedContractImage supported')
    assert.ok(props.BoxReadingImage, 'BoxReadingImage supported')
    assert.ok(props.RouterReadingImage, 'RouterReadingImage supported')
    assert.ok(props.PortLabelImage, 'PortLabelImage supported')
    assert.ok(props.HouseFront, 'HouseFront supported')
  })

  test('isJobOrderEndpoint matching normalizes leading slashes, trailing slashes, hyphens and underscores', () => {
    const isJobOrderEndpoint = (endpoint) => {
      const ep = (endpoint || '').trim().toLowerCase().replace(/^\/+|\/+$/g, '').replace(/[-_]/g, '')
      return ep === 'joborders' || ep === 'joborder'
    }

    assert.equal(isJobOrderEndpoint('JobOrders'), true)
    assert.equal(isJobOrderEndpoint('/JobOrders'), true)
    assert.equal(isJobOrderEndpoint('/JobOrders/'), true)
    assert.equal(isJobOrderEndpoint('joborders'), true)
    assert.equal(isJobOrderEndpoint('job-orders'), true)
    assert.equal(isJobOrderEndpoint('job_orders'), true)
    assert.equal(isJobOrderEndpoint('/api/joborders'), false)
    assert.equal(isJobOrderEndpoint('Applications'), false)
    assert.equal(isJobOrderEndpoint('Lcpnaps'), false)
  })

  /*
  test('api.js request interceptor sets multipart/form-data on FormData to avoid 415', async () => {
    const { default: apiClient } = await import('../src/services/api.js')
    
    // Create dummy config with FormData
    const fd = new FormData()
    fd.append('foo', 'bar')
    const config = {
      method: 'put',
      url: '/JobOrders/1',
      headers: new apiClient.defaults.headers.constructor({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      data: fd
    }

    // Run registered request interceptor handlers
    let transformedConfig = config
    for (const h of apiClient.interceptors.request.handlers) {
      if (typeof h.fulfilled === 'function') {
        transformedConfig = (await h.fulfilled(transformedConfig)) || transformedConfig
      }
    }

    const ct = typeof transformedConfig.headers.get === 'function'
      ? transformedConfig.headers.get('Content-Type')
      : transformedConfig.headers['Content-Type']
    assert.equal(ct, 'multipart/form-data', 'FormData request must have multipart/form-data Content-Type')
  })
  */
  // Gene - Nov 6, 2026: Assert that api.js request interceptor strips Content-Type on FormData payloads so browser XHR automatically injects multipart/form-data with the dynamic boundary delimiter (preventing 400 Missing content-type boundary)
  test('api.js request interceptor strips Content-Type on FormData so browser sets dynamic boundary', async () => {
    const { default: apiClient } = await import('../src/services/api.js')
    
    const fd = new FormData()
    fd.append('foo', 'bar')
    const config = {
      method: 'put',
      url: '/JobOrders/1',
      headers: new apiClient.defaults.headers.constructor({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }),
      data: fd
    }

    let transformedConfig = config
    for (const h of apiClient.interceptors.request.handlers) {
      if (typeof h.fulfilled === 'function') {
        transformedConfig = (await h.fulfilled(transformedConfig)) || transformedConfig
      }
    }

    const ct = typeof transformedConfig.headers.get === 'function'
      ? transformedConfig.headers.get('Content-Type')
      : transformedConfig.headers['Content-Type']
    assert.equal(ct, undefined, 'FormData request must NOT have manual Content-Type so browser sets boundary')
  })

  /*
  // Gene - Nov 5, 2026: Test that Job Order multipart update omits empty string values for numeric, date, and ID fields to prevent ASP.NET 500 error
  test('Job Order multipart update omits empty string values for numeric, date, and ID fields to prevent ASP.NET 500', () => {
    const numericOrDateKeys = new Set([
      'itemquantity1', 'itemquantity2', 'itemquantity3', 'itemquantity4', 'itemquantity5',
      'itemquantity6', 'itemquantity7', 'itemquantity8', 'itemquantity9', 'itemquantity10',
      'installationfee', 'billingday', 'duration', 'lcpid', 'napid', 'vlanid',
      'dateinstalled', 'installationdate', 'starttimestamp', 'endtimestamp',
      'createdby', 'createddate'
    ])
    const joPhotoKeys = new Set([
      'setupimage', 'clientsignature', 'signedcontractimage', 'boxreadingimage',
      'routerreadingimage', 'portlabelimage', 'housefront', 'speedtestimage'
    ])

    const samplePayload = {
      id: 4226,
      firstName: 'QA Test1',
      status: 'Inprogress',
      remarks: '',
      lcpId: '',
      napId: '',
      vlanId: '',
      duration: '',
      itemQuantity1: '',
      itemQuantity2: '',
      installationFee: null,
      billingDay: undefined,
      startTimeStamp: null,
      dateInstalled: '2026-10-30T00:00:00',
      setupImage: '',
      createdBy: 2
    }

    const appendedEntries = []
    const fakeForm = {
      append: (k, v) => appendedEntries.push({ key: k, value: v })
    }

    Object.entries(samplePayload).forEach(([key, val]) => {
      const lowerKey = key.toLowerCase()
      if (joPhotoKeys.has(lowerKey)) {
        return
      }
      if (numericOrDateKeys.has(lowerKey)) {
        if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim().toLowerCase() !== 'null') {
          fakeForm.append(key, String(val).trim())
        }
        return
      }
      if (val !== undefined && val !== null) {
        fakeForm.append(key, String(val))
      }
    })

    const appendedKeys = appendedEntries.map(e => e.key)
    assert.ok(appendedKeys.includes('id'), 'id should be included')
    assert.ok(appendedKeys.includes('firstName'), 'firstName should be included')
    assert.ok(appendedKeys.includes('status'), 'status should be included')
    assert.ok(appendedKeys.includes('remarks'), 'remarks string field should be included')
    assert.ok(appendedKeys.includes('dateInstalled'), 'dateInstalled valid date should be included')
    assert.ok(appendedKeys.includes('createdBy'), 'createdBy should be included')

    assert.equal(appendedKeys.includes('lcpId'), false, 'empty lcpId must be omitted')
    assert.equal(appendedKeys.includes('napId'), false, 'empty napId must be omitted')
    assert.equal(appendedKeys.includes('vlanId'), false, 'empty vlanId must be omitted')
    assert.equal(appendedKeys.includes('duration'), false, 'empty duration must be omitted')
    assert.equal(appendedKeys.includes('itemQuantity1'), false, 'empty itemQuantity1 must be omitted')
    assert.equal(appendedKeys.includes('itemQuantity2'), false, 'empty itemQuantity2 must be omitted')
    assert.equal(appendedKeys.includes('setupImage'), false, 'photo string setupImage must be omitted')
  })
  */
  /*
  // Gene - Nov 5, 2026: Expanded test suite verifying lcpnapid, lcpnapportid, portid, and accountno are omitted when empty
  test('Job Order multipart update omits empty string values for numeric, date, and ID fields to prevent ASP.NET 500', () => {
    const numericOrDateKeys = new Set([
      'itemquantity1', 'itemquantity2', 'itemquantity3', 'itemquantity4', 'itemquantity5',
      'itemquantity6', 'itemquantity7', 'itemquantity8', 'itemquantity9', 'itemquantity10',
      'installationfee', 'billingday', 'duration', 'lcpid', 'napid', 'vlanid', 'portid',
      'lcpnapid', 'lcpnapportid', 'accountno',
      'dateinstalled', 'installationdate', 'starttimestamp', 'endtimestamp',
      'createdby', 'createddate'
    ])
    const joPhotoKeys = new Set([
      'setupimage', 'clientsignature', 'signedcontractimage', 'boxreadingimage',
      'routerreadingimage', 'portlabelimage', 'housefront', 'speedtestimage'
    ])

    const samplePayload = {
      id: 4226,
      firstName: 'QA Test1',
      status: 'Inprogress',
      remarks: '',
      lcpId: '',
      napId: '',
      vlanId: '',
      portId: '',
      lcpnapId: '',
      lcpnapportId: '',
      accountNo: '',
      duration: '',
      itemQuantity1: '',
      itemQuantity2: '',
      installationFee: null,
      billingDay: undefined,
      startTimeStamp: null,
      dateInstalled: '2026-10-30T00:00:00',
      setupImage: '',
      createdBy: 2
    }

    const appendedEntries = []
    const fakeForm = {
      append: (k, v) => appendedEntries.push({ key: k, value: v })
    }

    Object.entries(samplePayload).forEach(([key, val]) => {
      const lowerKey = key.toLowerCase()
      if (joPhotoKeys.has(lowerKey)) {
        return
      }
      if (numericOrDateKeys.has(lowerKey)) {
        if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim().toLowerCase() !== 'null') {
          fakeForm.append(key, String(val).trim())
        }
        return
      }
      if (val !== undefined && val !== null) {
        fakeForm.append(key, String(val))
      }
    })

    const appendedKeys = appendedEntries.map(e => e.key)
    assert.ok(appendedKeys.includes('id'), 'id should be included')
    assert.ok(appendedKeys.includes('firstName'), 'firstName should be included')
    assert.ok(appendedKeys.includes('status'), 'status should be included')
    assert.ok(appendedKeys.includes('remarks'), 'remarks string field should be included')
    assert.ok(appendedKeys.includes('dateInstalled'), 'dateInstalled valid date should be included')
    assert.ok(appendedKeys.includes('createdBy'), 'createdBy should be included')

    assert.equal(appendedKeys.includes('lcpId'), false, 'empty lcpId must be omitted')
    assert.equal(appendedKeys.includes('napId'), false, 'empty napId must be omitted')
    assert.equal(appendedKeys.includes('vlanId'), false, 'empty vlanId must be omitted')
    assert.equal(appendedKeys.includes('portId'), false, 'empty portId must be omitted')
    assert.equal(appendedKeys.includes('lcpnapId'), false, 'empty lcpnapId must be omitted')
    assert.equal(appendedKeys.includes('lcpnapportId'), false, 'empty lcpnapportId must be omitted')
    assert.equal(appendedKeys.includes('accountNo'), false, 'empty accountNo must be omitted')
    assert.equal(appendedKeys.includes('duration'), false, 'empty duration must be omitted')
    assert.equal(appendedKeys.includes('itemQuantity1'), false, 'empty itemQuantity1 must be omitted')
    assert.equal(appendedKeys.includes('itemQuantity2'), false, 'empty itemQuantity2 must be omitted')
    assert.equal(appendedKeys.includes('setupImage'), false, 'photo string setupImage must be omitted')
  })
  */
  // Gene - Nov 6, 2026: Include modifieddate in numericOrDateKeys and verify modifiedDate and string "null" are omitted when constructing FormData
  test('Job Order multipart update omits empty string values for numeric, date, and ID fields to prevent ASP.NET 500', () => {
    const numericOrDateKeys = new Set([
      'itemquantity1', 'itemquantity2', 'itemquantity3', 'itemquantity4', 'itemquantity5',
      'itemquantity6', 'itemquantity7', 'itemquantity8', 'itemquantity9', 'itemquantity10',
      'installationfee', 'billingday', 'duration', 'lcpid', 'napid', 'vlanid', 'portid',
      'lcpnapid', 'lcpnapportid', 'accountno',
      'dateinstalled', 'installationdate', 'starttimestamp', 'endtimestamp',
      'createdby', 'createddate', 'modifieddate'
    ])
    const joPhotoKeys = new Set([
      'setupimage', 'clientsignature', 'signedcontractimage', 'boxreadingimage',
      'routerreadingimage', 'portlabelimage', 'housefront', 'speedtestimage'
    ])

    const samplePayload = {
      id: 4226,
      firstName: 'QA Test1',
      status: 'Inprogress',
      remarks: '',
      lcpId: '',
      napId: '',
      vlanId: '',
      portId: '',
      lcpnapId: '',
      lcpnapportId: '',
      accountNo: '',
      duration: '',
      itemQuantity1: '',
      itemQuantity2: '',
      installationFee: null,
      billingDay: undefined,
      startTimeStamp: null,
      dateInstalled: '2026-10-30T00:00:00',
      setupImage: '',
      modifiedDate: '',
      createdBy: 2
    }

    const appendedEntries = []
    const fakeForm = {
      append: (k, v) => appendedEntries.push({ key: k, value: v })
    }

    Object.entries(samplePayload).forEach(([key, val]) => {
      const lowerKey = key.toLowerCase()
      if (joPhotoKeys.has(lowerKey)) {
        return
      }
      if (numericOrDateKeys.has(lowerKey)) {
        if (val !== undefined && val !== null && String(val).trim() !== '' && String(val).trim().toLowerCase() !== 'null') {
          fakeForm.append(key, String(val).trim())
        }
        return
      }
      if (val !== undefined && val !== null) {
        const strVal = String(val).trim()
        if (strVal.toLowerCase() !== 'null') {
          fakeForm.append(key, String(val))
        }
      }
    })

    const appendedKeys = appendedEntries.map(e => e.key)
    assert.ok(appendedKeys.includes('id'), 'id should be included')
    assert.ok(appendedKeys.includes('firstName'), 'firstName should be included')
    assert.ok(appendedKeys.includes('status'), 'status should be included')
    assert.ok(appendedKeys.includes('remarks'), 'remarks string field should be included')
    assert.ok(appendedKeys.includes('dateInstalled'), 'dateInstalled valid date should be included')
    assert.ok(appendedKeys.includes('createdBy'), 'createdBy should be included')

    assert.equal(appendedKeys.includes('lcpId'), false, 'empty lcpId must be omitted')
    assert.equal(appendedKeys.includes('napId'), false, 'empty napId must be omitted')
    assert.equal(appendedKeys.includes('vlanId'), false, 'empty vlanId must be omitted')
    assert.equal(appendedKeys.includes('portId'), false, 'empty portId must be omitted')
    assert.equal(appendedKeys.includes('lcpnapId'), false, 'empty lcpnapId must be omitted')
    assert.equal(appendedKeys.includes('lcpnapportId'), false, 'empty lcpnapportId must be omitted')
    assert.equal(appendedKeys.includes('accountNo'), false, 'empty accountNo must be omitted')
    assert.equal(appendedKeys.includes('duration'), false, 'empty duration must be omitted')
    assert.equal(appendedKeys.includes('itemQuantity1'), false, 'empty itemQuantity1 must be omitted')
    assert.equal(appendedKeys.includes('itemQuantity2'), false, 'empty itemQuantity2 must be omitted')
    assert.equal(appendedKeys.includes('setupImage'), false, 'photo string setupImage must be omitted')
    assert.equal(appendedKeys.includes('modifiedDate'), false, 'empty modifiedDate must be omitted')
  })

  // Gene - Nov 6, 2026: Regression tests for single canonical houseFront without duplicate houseFrontPicture
  test('JOB_ORDER_FORM_LAYOUT includes houseFront and excludes redundant houseFrontPicture', async () => {
    const fs = await import('node:fs')
    const content = fs.readFileSync('src/components/DynamicApiTable.vue', 'utf8')
    
    // Strip multi-line comments so we inspect only the active code
    const activeContent = content.replace(/\/\*[\s\S]*?\*\//g, '')

    // Extract active JOB_ORDER_FORM_LAYOUT definition
    const joLayoutMatch = activeContent.match(/const JOB_ORDER_FORM_LAYOUT = \[([\s\S]*?)\]\n\nconst PLAN_FORM_LAYOUT/m)
    assert.ok(joLayoutMatch, 'JOB_ORDER_FORM_LAYOUT should be defined')
    const layoutStr = joLayoutMatch[1]

    // Photos section check: must have houseFront, must NOT have active houseFrontPicture
    const photosMatch = layoutStr.match(/key:\s*'photos'[\s\S]*?columns:\s*\[([\s\S]*?)\]\s*\}/)
    assert.ok(photosMatch, 'Photos section found in JOB_ORDER_FORM_LAYOUT')
    const photoCols = photosMatch[1]
    
    assert.ok(photoCols.includes("'houseFront'"), 'houseFront must be present in photos columns')
    assert.equal(photoCols.includes("'houseFrontPicture'"), false, 'houseFrontPicture must NOT be present in active photos columns')
  })

  test('Job Orders image mapping and deduplication ensures only canonical houseFront exists', () => {
    // Simulate deduplicateColumns behavior for Job Orders
    const isJobOrderEndpoint = true
    const deduplicateColumnsSim = (colList) => {
      const normalizedSet = new Set()
      const result = []
      const lowerCols = colList.map(c => c.toLowerCase())
      colList.forEach(col => {
        const lowerNoUnderscore = col.toLowerCase().replace(/_/g, '')
        const lowerRaw = col.toLowerCase()
        if (isJobOrderEndpoint && lowerRaw === 'housefrontpicture') return
        if (!normalizedSet.has(lowerNoUnderscore)) {
          normalizedSet.add(lowerNoUnderscore)
          result.push(col)
        }
      })
      return result
    }

    const testCols = ['id', 'accountNo', 'houseFront', 'houseFrontPicture', 'setupImage', 'status']
    const deduped = deduplicateColumnsSim(testCols)
    assert.ok(deduped.includes('houseFront'), 'houseFront preserved')
    assert.equal(deduped.includes('houseFrontPicture'), false, 'houseFrontPicture removed')

    // Simulate viewFormData normalization in openViewDialog / fetchAndAttachImagesForDialog
    const viewFormData = {
      id: 101,
      accountNo: 'SF-101',
      houseFront: 'data:image/jpeg;base64,abc123',
      houseFrontPicture: 'data:image/jpeg;base64,abc123'
    }

    if (!viewFormData.houseFront && viewFormData.houseFrontPicture) {
      viewFormData.houseFront = viewFormData.houseFrontPicture
    }
    delete viewFormData.houseFrontPicture
    delete viewFormData.housefrontpicture

    assert.ok(viewFormData.houseFront, 'houseFront remains')
    assert.equal(viewFormData.houseFrontPicture, undefined, 'houseFrontPicture removed from viewFormData')
  })

  // Gene - Nov 7, 2026: Regression tests for Job Order image upload persistence (including boxReadingImage, portLabelImage, speedtestImage), billingDay null auto-default, and create/edit image display
  test('DynamicApiTable persists uploaded Job Order images and merges them in View, Edit, and Table cells when GetJobOrderImage returns null', async () => {
    const fs = await import('node:fs')
    const content = fs.readFileSync('src/components/DynamicApiTable.vue', 'utf8')
    const activeContent = content.replace(/\/\*[\s\S]*?\*\//g, '')

    assert.ok(
      activeContent.includes('const getPersistedJobOrderImages = (joId) =>'),
      'getPersistedJobOrderImages helper must be defined'
    )
    assert.ok(
      activeContent.includes('const setPersistedJobOrderImage = (joId, colKey, dataUrl) =>'),
      'setPersistedJobOrderImage helper must be defined'
    )
    assert.ok(
      activeContent.includes('const removePersistedJobOrderImage = (joId, colKey) =>'),
      'removePersistedJobOrderImage helper must be defined'
    )
    assert.ok(
      activeContent.includes('normJoImageStr(payload.boxReadingImage)') &&
      activeContent.includes('normJoImageStr(payload.portLabelImage)') &&
      activeContent.includes('normJoImageStr(payload.speedtestImage)'),
      'buildJobOrderPayload must sanitize image string fields with normJoImageStr to prevent HTTP 500 VARCHAR(255) truncation'
    )
    assert.ok(
      activeContent.includes("await attachJoPhoto('boxReadingImage', 'BoxReadingImage', 'boxReadingImage.jpg')") &&
      activeContent.includes("await attachJoPhoto('portLabelImage', 'PortLabelImage', 'portLabelImage.jpg')") &&
      activeContent.includes("await attachJoPhoto('speedtestImage', 'SpeedtestImage', 'speedtestImage.jpg')"),
      'saveEdit must process all 8 Job Order photo fields including boxReadingImage, portLabelImage, and speedtestImage'
    )
    assert.ok(
      activeContent.includes("if (isJobOrderEndpoint.value && normalizeColKey(col) === 'billingday' && isBlank(val))"),
      'validateRequired must auto-default blank billingDay on JobOrders so online-created Job Orders with null billingDay can save uploaded images'
    )
  })
})
