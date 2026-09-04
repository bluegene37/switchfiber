import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const reportOutputDir = path.resolve(__dirname, '../docs/reports')
if (!fs.existsSync(reportOutputDir)) fs.mkdirSync(reportOutputDir, { recursive: true })

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const BASE_URL = 'https://103.249.198.50:8090/api'
const TEST_TIMESTAMP = Date.now().toString().slice(-6)
const MARKER = `UM_${TEST_TIMESTAMP}`

const crudResults = {
  timestamp: new Date().toISOString(),
  operator: 'bluegene37',
  marker: MARKER,
  summary: { total: 0, passed: 0, failed: 0 },
  operations: []
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}/${endpoint}`
  const startTime = Date.now()
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    })
    const durationMs = Date.now() - startTime
    const text = await res.text()
    let data = null
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
    return { ok: res.ok, status: res.status, data, durationMs }
  } catch (err) {
    return { ok: false, status: 0, error: err.message, durationMs: Date.now() - startTime }
  }
}

function recordResult(entity, menu, action, method, status, ok, details = '') {
  crudResults.operations.push({
    entity,
    menu,
    action,
    method,
    status,
    success: ok,
    details
  })
  crudResults.summary.total++
  if (ok) {
    crudResults.summary.passed++
    console.log(`  [PASS] ${entity} (${action}) -> ${method} HTTP ${status} ${details ? `(${details})` : ''}`)
  } else {
    crudResults.summary.failed++
    console.error(`  [FAIL] ${entity} (${action}) -> ${method} HTTP ${status} ${details ? `(${details})` : ''}`)
  }
}

async function runCrudMatrix() {
  console.log(`=============================================================`)
  console.log(`🚀 SwitchFiber Complete Menu & Entity Live CRUD Execution`)
  console.log(`Authenticated Operator: bluegene37 | Session Marker: ${MARKER}`)
  console.log(`Target Backend: ${BASE_URL}`)
  console.log(`=============================================================\n`)

  // 0. AUTHENTICATION CHECK
  console.log('[CRUD] 0. Authenticating bluegene37...')
  const authRes = await request('Users/login', {
    method: 'POST',
    body: JSON.stringify({ username: 'bluegene37', password: '1234' })
  })
  const authOk = authRes.ok && (authRes.data?.id || authRes.data?.username)
  recordResult('Users', 'Authentication', 'LOGIN', 'POST /api/Users/login', authRes.status, authOk, `User: ${authRes.data?.firstName} ${authRes.data?.lastName}`)

  // 1. PLANS
  console.log('\n[CRUD] 1. Entity: Plans (Menu: File Maintenance > Plan)')
  const plansBefore = await request('Plans')
  recordResult('Plans', 'Plan', 'READ_ALL', 'GET /api/Plans', plansBefore.status, plansBefore.ok, `Count: ${Array.isArray(plansBefore.data) ? plansBefore.data.length : 0}`)

  const planCreate = await request('Plans', {
    method: 'POST',
    body: JSON.stringify({
      planName: `${MARKER} UltraFiber 250M`,
      bandwidth: '250 Mbps',
      amount: '2199',
      planDescription: 'User Manual Test Plan Description',
      status: 'Active',
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const planId = planCreate.data?.id
  recordResult('Plans', 'Plan', 'CREATE', 'POST /api/Plans', planCreate.status, planCreate.ok && !!planId, `ID: ${planId}`)

  if (planId) {
    const planRead = await request(`Plans/${planId}`)
    recordResult('Plans', 'Plan', 'READ_SINGLE', `GET /api/Plans/${planId}`, planRead.status, planRead.ok)

    const planUpdate = await request(`Plans/${planId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: planId,
        planName: `${MARKER} UltraFiber 300M`,
        bandwidth: '300 Mbps',
        amount: '2499',
        planDescription: 'Updated User Manual Test Plan',
        status: 'Active',
        createdBy: '2',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('Plans', 'Plan', 'UPDATE', `PUT /api/Plans/${planId}`, planUpdate.status, planUpdate.ok)

    const planDelete = await request(`Plans/${planId}`, { method: 'DELETE' })
    recordResult('Plans', 'Plan', 'DELETE', `DELETE /api/Plans/${planId}`, planDelete.status, planDelete.ok)
  }

  // 2. ROUTERS
  console.log('\n[CRUD] 2. Entity: Routers (Menu: File Maintenance > Router)')
  const routerBefore = await request('Routers')
  recordResult('Routers', 'Router', 'READ_ALL', 'GET /api/Routers', routerBefore.status, routerBefore.ok)

  const routerCreate = await request('Routers', {
    method: 'POST',
    body: JSON.stringify({
      name: `${MARKER}_Router_X1`,
      description: 'Gigabit Dual Band Router',
      brand: 'Huawei',
      model: 'HG8145V5',
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const routerId = routerCreate.data?.id
  recordResult('Routers', 'Router', 'CREATE', 'POST /api/Routers', routerCreate.status, routerCreate.ok && !!routerId, `ID: ${routerId}`)

  if (routerId) {
    const routerUpdate = await request(`Routers/${routerId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: routerId,
        name: `${MARKER}_Router_X1_Updated`,
        description: 'Updated Specs',
        brand: 'Huawei',
        model: 'HG8145V5-PRO',
        createdBy: '2',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('Routers', 'Router', 'UPDATE', `PUT /api/Routers/${routerId}`, routerUpdate.status, routerUpdate.ok)

    const routerDelete = await request(`Routers/${routerId}`, { method: 'DELETE' })
    recordResult('Routers', 'Router', 'DELETE', `DELETE /api/Routers/${routerId}`, routerDelete.status, routerDelete.ok)
  }

  // 3. VLANS
  console.log('\n[CRUD] 3. Entity: Vlans (Menu: File Maintenance > VLAN)')
  const vlanBefore = await request('Vlans')
  recordResult('Vlans', 'VLan', 'READ_ALL', 'GET /api/Vlans', vlanBefore.status, vlanBefore.ok)

  const vlanCreate = await request('Vlans', {
    method: 'POST',
    body: JSON.stringify({
      name: `${MARKER}_VLAN_850`,
      description: 'Test VLAN Subnet',
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const vlanDbId = vlanCreate.data?.id
  recordResult('Vlans', 'VLan', 'CREATE', 'POST /api/Vlans', vlanCreate.status, vlanCreate.ok && !!vlanDbId, `ID: ${vlanDbId}`)

  if (vlanDbId) {
    const vlanUpdate = await request(`Vlans/${vlanDbId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: vlanDbId,
        name: `${MARKER}_VLAN_850_MOD`,
        description: 'Updated VLAN Subnet',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('Vlans', 'VLan', 'UPDATE', `PUT /api/Vlans/${vlanDbId}`, vlanUpdate.status, vlanUpdate.ok)

    const vlanDelete = await request(`Vlans/${vlanDbId}`, { method: 'DELETE' })
    recordResult('Vlans', 'VLan', 'DELETE', `DELETE /api/Vlans/${vlanDbId}`, vlanDelete.status, vlanDelete.ok)
  }

  // 4. LCPs
  console.log('\n[CRUD] 4. Entity: LCPs (Menu: File Maintenance > LCP)')
  const lcpBefore = await request('Lcps')
  recordResult('Lcps', 'LCP', 'READ_ALL', 'GET /api/Lcps', lcpBefore.status, lcpBefore.ok)

  const lcpCreate = await request('Lcps', {
    method: 'POST',
    body: JSON.stringify({
      name: `${MARKER}_LCP_09`,
      description: 'Primary Fiber Distribution Cabinet, Bacoor',
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const lcpId = lcpCreate.data?.id
  recordResult('Lcps', 'LCP', 'CREATE', 'POST /api/Lcps', lcpCreate.status, lcpCreate.ok && !!lcpId, `ID: ${lcpId}`)

  if (lcpId) {
    const lcpUpdate = await request(`Lcps/${lcpId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: lcpId,
        name: `${MARKER}_LCP_09_MOD`,
        description: 'Updated LCP specs',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('Lcps', 'LCP', 'UPDATE', `PUT /api/Lcps/${lcpId}`, lcpUpdate.status, lcpUpdate.ok)

    const lcpDelete = await request(`Lcps/${lcpId}`, { method: 'DELETE' })
    recordResult('Lcps', 'LCP', 'DELETE', `DELETE /api/Lcps/${lcpId}`, lcpDelete.status, lcpDelete.ok)
  }

  // 5. NAPs
  console.log('\n[CRUD] 5. Entity: NAPs (Menu: File Maintenance > NAP)')
  const napBefore = await request('Naps')
  recordResult('Naps', 'NAP', 'READ_ALL', 'GET /api/Naps', napBefore.status, napBefore.ok)

  const napCreate = await request('Naps', {
    method: 'POST',
    body: JSON.stringify({
      name: `${MARKER}_NAP_091`,
      description: 'Pole 14, Main Ave NAP Box 1:8',
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const napId = napCreate.data?.id
  recordResult('Naps', 'NAP', 'CREATE', 'POST /api/Naps', napCreate.status, napCreate.ok && !!napId, `ID: ${napId}`)

  if (napId) {
    const napUpdate = await request(`Naps/${napId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: napId,
        name: `${MARKER}_NAP_091_MOD`,
        description: 'Updated Pole 14 NAP Box',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('Naps', 'NAP', 'UPDATE', `PUT /api/Naps/${napId}`, napUpdate.status, napUpdate.ok)

    const napDelete = await request(`Naps/${napId}`, { method: 'DELETE' })
    recordResult('Naps', 'NAP', 'DELETE', `DELETE /api/Naps/${napId}`, napDelete.status, napDelete.ok)
  }

  // 6. PORTS
  console.log('\n[CRUD] 6. Entity: Ports (Menu: File Maintenance > Port)')
  const portBefore = await request('Ports')
  recordResult('Ports', 'Port', 'READ_ALL', 'GET /api/Ports', portBefore.status, portBefore.ok)

  const portCreate = await request('Ports', {
    method: 'POST',
    body: JSON.stringify({
      name: `Port-${TEST_TIMESTAMP}`,
      description: 'Feeder port termination',
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const portId = portCreate.data?.id
  recordResult('Ports', 'Port', 'CREATE', 'POST /api/Ports', portCreate.status, portCreate.ok && !!portId, `ID: ${portId}`)

  if (portId) {
    const portUpdate = await request(`Ports/${portId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: portId,
        name: `Port-${TEST_TIMESTAMP}-MOD`,
        description: 'Updated feeder port',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('Ports', 'Port', 'UPDATE', `PUT /api/Ports/${portId}`, portUpdate.status, portUpdate.ok)

    const portDelete = await request(`Ports/${portId}`, { method: 'DELETE' })
    recordResult('Ports', 'Port', 'DELETE', `DELETE /api/Ports/${portId}`, portDelete.status, portDelete.ok)
  }

  // 7. ACCESS LEVELS & PERMISSIONS MATRIX
  console.log('\n[CRUD] 7. Entity: AccessLevel (Menu: Users Management > Access Level)')
  const alBefore = await request('AccessLevel')
  recordResult('AccessLevel', 'Access Level', 'READ_ALL', 'GET /api/AccessLevel', alBefore.status, alBefore.ok)

  const alCreate = await request('AccessLevel', {
    method: 'POST',
    body: JSON.stringify({
      name: `${MARKER}_Support_Lead`,
      description: 'Tier 2 Customer Support Supervisor Role',
      createdBy: '2',
      createdDate: new Date().toISOString(),
      modifiedBy: '2',
      modifiedDate: new Date().toISOString()
    })
  })
  const alId = alCreate.data?.id
  recordResult('AccessLevel', 'Access Level', 'CREATE', 'POST /api/AccessLevel', alCreate.status, alCreate.ok && !!alId, `ID: ${alId}`)

  if (alId) {
    const alRead = await request(`AccessLevel/${alId}`)
    recordResult('AccessLevel', 'Access Level', 'READ_SINGLE', `GET /api/AccessLevel/${alId}`, alRead.status, alRead.ok)

    const alUpdate = await request(`AccessLevel/${alId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: alId,
        name: `${MARKER}_Support_Supervisor`,
        description: 'Updated Role Description with elevated privileges',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('AccessLevel', 'Access Level', 'UPDATE', `PUT /api/AccessLevel/${alId}`, alUpdate.status, alUpdate.ok)

    const almCreate = await request('AccesslevelMenu', {
      method: 'POST',
      body: JSON.stringify({
        accesslevel_id: alId,
        menu_id: 4, // Dashboard
        createdBy: '2'
      })
    })
    const almId = almCreate.data?.id
    recordResult('AccesslevelMenu', 'Access Level Menu', 'CREATE', 'POST /api/AccesslevelMenu', almCreate.status, almCreate.ok, `Link ID: ${almId}`)

    if (almId) {
      const almDelete = await request(`AccesslevelMenu/${almId}`, { method: 'DELETE' })
      recordResult('AccesslevelMenu', 'Access Level Menu', 'DELETE', `DELETE /api/AccesslevelMenu/${almId}`, almDelete.status, almDelete.ok)
    }

    const alDelete = await request(`AccessLevel/${alId}`, { method: 'DELETE' })
    recordResult('AccessLevel', 'Access Level', 'DELETE', `DELETE /api/AccessLevel/${alId}`, alDelete.status, alDelete.ok)
  }

  // 8. USERS
  console.log('\n[CRUD] 8. Entity: Users (Menu: Users Management > User)')
  const usersBefore = await request('Users')
  recordResult('Users', 'User', 'READ_ALL', 'GET /api/Users', usersBefore.status, usersBefore.ok)

  const userCreate = await request('Users', {
    method: 'POST',
    body: JSON.stringify({
      fname: 'Field',
      mname: 'T',
      lname: `Technician_${TEST_TIMESTAMP}`,
      contactnumber: '09170001122',
      address: 'Cavite Ops Center',
      email: `tech_${TEST_TIMESTAMP}@switchfiber.local`,
      username: `tech_${TEST_TIMESTAMP}`,
      password: 'TempPassword123!',
      active: true,
      accesslevel_id: 3
    })
  })
  const userId = userCreate.data?.id
  recordResult('Users', 'User', 'CREATE', 'POST /api/Users', userCreate.status, userCreate.ok && !!userId, `ID: ${userId}`)

  if (userId) {
    const userRead = await request(`Users/${userId}`)
    recordResult('Users', 'User', 'READ_SINGLE', `GET /api/Users/${userId}`, userRead.status, userRead.ok)

    const userUpdate = await request(`Users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: userId,
        fname: 'Senior Field',
        mname: 'T',
        lname: `Technician_${TEST_TIMESTAMP}`,
        contactnumber: '09170009988',
        address: 'Cavite Ops Center',
        email: `tech_${TEST_TIMESTAMP}@switchfiber.local`,
        username: `tech_${TEST_TIMESTAMP}`,
        active: true,
        accesslevel_id: 3
      })
    })
    recordResult('Users', 'User', 'UPDATE', `PUT /api/Users/${userId}`, userUpdate.status, userUpdate.ok)

    const userDelete = await request(`Users/${userId}`, { method: 'DELETE' })
    recordResult('Users', 'User', 'DELETE', `DELETE /api/Users/${userId}`, userDelete.status, userDelete.ok)
  }

  // 9. SUBSCRIBER APPLICATIONS
  console.log('\n[CRUD] 9. Entity: Applications (Menu: Application > All Application)')
  const appBefore = await request('Applications')
  recordResult('Applications', 'Application', 'READ_ALL', 'GET /api/Applications', appBefore.status, appBefore.ok, `Count: ${Array.isArray(appBefore.data) ? appBefore.data.length : 0}`)

  const appCreate = await request('Applications', {
    method: 'POST',
    body: JSON.stringify({
      timestamp: new Date().toISOString(),
      emailAddress: `juan_${TEST_TIMESTAMP}@example.com`,
      region: 'Region IV-A (CALABARZON)',
      city: 'Bacoor City',
      barangay: 'Molino III',
      referredBy: 'Walk-in',
      firstName: 'Juan',
      middleName: 'Dela',
      lastName: `Cruz_${TEST_TIMESTAMP}`,
      mobileNumber: '09175551234',
      secondaryMobileNumber: '09185554321',
      installationAddress: 'Block 12 Lot 34 Phase 2',
      landmark: 'Near Barangay Hall',
      desiredPlan: 'Plan 1499 - 100 Mbps',
      proofOfBilling: 'None',
      governmentValidId: 'UMID',
      secondGovernmentValidId: 'Drivers License',
      houseFrontPicture: 'house_front.jpg',
      termsAndConditionsAgreement: true,
      firstNearestLandmark: 'Molino High School',
      secondNearestLandmark: 'Water District Tank',
      applicablePromo: 'None',
      documentPicture: 'id_doc.jpg',
      barangay1: 'Molino III',
      barangay2: 'Molino III',
      pictureofstatmentbillingfromotherprovider: 'billing.jpg',
      referrersAccountNumber: 'N/A',
      applyingFor: 'Residential',
      status: 'Pending Verification',
      visitBy: 'Engr. Alex',
      visitWith: 'Tech Juan',
      visitWithOther: 'None',
      remarks: 'Automated User Manual verification application',
      modifiedBy: '2',
      modifiedDate: new Date().toISOString(),
      userEmail: 'bluegene37@switchfiber.ph'
    })
  })
  const appId = appCreate.data?.id
  recordResult('Applications', 'Application', 'CREATE', 'POST /api/Applications', appCreate.status, appCreate.ok && !!appId, `ID: ${appId}`)

  if (appId) {
    const appRead = await request(`Applications/${appId}`)
    recordResult('Applications', 'Application', 'READ_SINGLE', `GET /api/Applications/${appId}`, appRead.status, appRead.ok)

    const appUpdate = await request(`Applications/${appId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: appId,
        emailAddress: `juan_${TEST_TIMESTAMP}@example.com`,
        region: 'Region IV-A (CALABARZON)',
        city: 'Bacoor City',
        barangay: 'Molino III',
        referredBy: 'Walk-in',
        firstName: 'Juan',
        middleName: 'Dela',
        lastName: `Cruz_${TEST_TIMESTAMP}`,
        mobileNumber: '09175551234',
        secondaryMobileNumber: '09185554321',
        installationAddress: 'Block 12 Lot 34 Phase 2',
        landmark: 'Near Barangay Hall',
        desiredPlan: 'Plan 1499 - 100 Mbps',
        proofOfBilling: 'None',
        governmentValidId: 'UMID',
        secondGovernmentValidId: 'Drivers License',
        houseFrontPicture: 'house_front.jpg',
        termsAndConditionsAgreement: true,
        firstNearestLandmark: 'Molino High School',
        secondNearestLandmark: 'Water District Tank',
        applicablePromo: 'None',
        documentPicture: 'id_doc.jpg',
        barangay1: 'Molino III',
        barangay2: 'Molino III',
        pictureofstatmentbillingfromotherprovider: 'billing.jpg',
        referrersAccountNumber: 'N/A',
        applyingFor: 'Residential',
        status: 'Approved',
        visitBy: 'Engr. Alex',
        visitWith: 'Tech Juan',
        visitWithOther: 'None',
        remarks: 'Documents verified and approved for installation',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString(),
        userEmail: 'bluegene37@switchfiber.ph'
      })
    })
    recordResult('Applications', 'Application', 'UPDATE', `PUT /api/Applications/${appId}`, appUpdate.status, appUpdate.ok)

    const appDelete = await request(`Applications/${appId}`, { method: 'DELETE' })
    recordResult('Applications', 'Application', 'DELETE', `DELETE /api/Applications/${appId}`, appDelete.status, appDelete.ok)
  }

  // 10. TECHNICAL JOB ORDERS
  console.log('\n[CRUD] 10. Entity: JobOrders (Menu: Job Orders > All Job Orders)')
  const joBefore = await request('JobOrders')
  recordResult('JobOrders', 'Job Orders', 'READ_ALL', 'GET /api/JobOrders', joBefore.status, joBefore.ok)

  const joCreate = await request('JobOrders', {
    method: 'POST',
    body: JSON.stringify({
      emailAddress: `juan_${TEST_TIMESTAMP}@example.com`,
      referredBy: 'Direct',
      firstName: 'Juan',
      middleInitial: 'D',
      lastName: `Cruz_${TEST_TIMESTAMP}`,
      contactNumber: '09175551234',
      applicantEmailAddress: `juan_${TEST_TIMESTAMP}@example.com`,
      address: 'Block 12 Lot 34 Phase 2',
      location: 'Bacoor City',
      barangay: 'Molino III',
      city: 'Bacoor City',
      region: 'Region IV-A (CALABARZON)',
      planId: 1,
      remarks: 'Fiber drop cable pullout',
      installationFee: '0',
      contractTemplate: 'Standard Residential',
      billingDay: '15',
      preferredDay: 'Morning',
      joRemarks: 'User Manual test dispatch',
      status: 'Pending Dispatch',
      verifiedBy: 'CSR Admin',
      modemRouterSN: 'HW12345678',
      provider: 'SwitchFiber',
      lcpId: 1,
      napId: 1,
      portId: 1,
      vlanId: 1,
      username: `user_${TEST_TIMESTAMP}`,
      visitBy: 'Tech Alex',
      visitWith: 'Tech Juan',
      visitWithOther: 'None',
      onsiteStatus: 'Scheduled',
      onsiteRemarks: 'Standard installation',
      modifiedBy: '2',
      modifiedDate: new Date().toISOString(),
      contractLink: 'https://docs.switchfiber.ph/contracts/1234',
      connectionType: 'Fiber GPON',
      assignedEmail: 'tech@switchfiber.ph',
      setupImage: 'setup.jpg',
      speedtestImage: 'speedtest.jpg',
      startTimeStamp: new Date().toISOString(),
      endTimeStamp: new Date().toISOString(),
      duration: '45 mins',
      externalId: `EXT-${TEST_TIMESTAMP}`,
      lcpnapId: 1,
      billingStatus: 'Active',
      routerModel: 'HG8145V5',
      dateInstalled: new Date().toISOString(),
      clientSignature: 'signature_data',
      ip: '100.64.12.34',
      signedContractImage: 'contract.jpg',
      boxReadingImage: 'reading.jpg',
      routerReadingImage: 'router.jpg',
      usernameStatus: 'Active',
      lcpnapportId: 1,
      usageType: 'Residential',
      renter: 'No',
      installationLandmark: 'Near Water Tank',
      statusRemarks: 'Ready for installation',
      portLabelImage: 'label.jpg',
      secondContactNumber: '09185554321',
      accountNo: `ACCT-${TEST_TIMESTAMP}`,
      addressCoordinates: '14.4123, 120.9876',
      referrersAccountNumber: 'N/A',
      applicationId: 1,
      houseFront: 'front.jpg',
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const joId = joCreate.data?.id
  recordResult('JobOrders', 'Job Orders', 'CREATE', 'POST /api/JobOrders', joCreate.status, joCreate.ok && !!joId, `ID: ${joId}`)

  if (joId) {
    const joUpdate = await request(`JobOrders/${joId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: joId,
        emailAddress: `juan_${TEST_TIMESTAMP}@example.com`,
        referredBy: 'Direct',
        firstName: 'Juan',
        middleInitial: 'D',
        lastName: `Cruz_${TEST_TIMESTAMP}`,
        contactNumber: '09175551234',
        applicantEmailAddress: `juan_${TEST_TIMESTAMP}@example.com`,
        address: 'Block 12 Lot 34 Phase 2',
        location: 'Bacoor City',
        barangay: 'Molino III',
        city: 'Bacoor City',
        region: 'Region IV-A (CALABARZON)',
        planId: 1,
        remarks: 'Fiber drop cable pullout',
        installationFee: '0',
        contractTemplate: 'Standard Residential',
        billingDay: '15',
        preferredDay: 'Morning',
        joRemarks: 'User Manual test dispatch',
        status: 'Completed',
        verifiedBy: 'CSR Admin',
        modemRouterSN: 'HW12345678',
        provider: 'SwitchFiber',
        lcpId: 1,
        napId: 1,
        portId: 1,
        vlanId: 1,
        username: `user_${TEST_TIMESTAMP}`,
        visitBy: 'Tech Alex',
        visitWith: 'Tech Juan',
        visitWithOther: 'None',
        onsiteStatus: 'Installed',
        onsiteRemarks: 'Optical power -18.5 dBm verified',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString(),
        contractLink: 'https://docs.switchfiber.ph/contracts/1234',
        connectionType: 'Fiber GPON',
        assignedEmail: 'tech@switchfiber.ph',
        setupImage: 'setup.jpg',
        speedtestImage: 'speedtest.jpg',
        startTimeStamp: new Date().toISOString(),
        endTimeStamp: new Date().toISOString(),
        duration: '45 mins',
        externalId: `EXT-${TEST_TIMESTAMP}`,
        lcpnapId: 1,
        billingStatus: 'Active',
        routerModel: 'HG8145V5',
        dateInstalled: new Date().toISOString(),
        clientSignature: 'signature_data',
        ip: '100.64.12.34',
        signedContractImage: 'contract.jpg',
        boxReadingImage: 'reading.jpg',
        routerReadingImage: 'router.jpg',
        usernameStatus: 'Active',
        lcpnapportId: 1,
        usageType: 'Residential',
        renter: 'No',
        installationLandmark: 'Near Water Tank',
        statusRemarks: 'Installation sign-off complete',
        portLabelImage: 'label.jpg',
        secondContactNumber: '09185554321',
        accountNo: `ACCT-${TEST_TIMESTAMP}`,
        addressCoordinates: '14.4123, 120.9876',
        referrersAccountNumber: 'N/A',
        applicationId: 1,
        houseFront: 'front.jpg',
        createdBy: '2',
        createdDate: new Date().toISOString()
      })
    })
    recordResult('JobOrders', 'Job Orders', 'UPDATE', `PUT /api/JobOrders/${joId}`, joUpdate.status, joUpdate.ok)

    const joDelete = await request(`JobOrders/${joId}`, { method: 'DELETE' })
    recordResult('JobOrders', 'Job Orders', 'DELETE', `DELETE /api/JobOrders/${joId}`, joDelete.status, joDelete.ok)
  }

  // 11. CUSTOMER SERVICE ORDERS
  console.log('\n[CRUD] 11. Entity: ServiceOrders (Menu: Service Orders)')
  const soBefore = await request('ServiceOrders')
  recordResult('ServiceOrders', 'Service Orders', 'READ_ALL', 'GET /api/ServiceOrders', soBefore.status, soBefore.ok)

  const soCreate = await request('ServiceOrders', {
    method: 'POST',
    body: JSON.stringify({
      ticketNumber: `SO-${TEST_TIMESTAMP}`,
      customerName: `Juan Cruz_${TEST_TIMESTAMP}`,
      contactNumber: '09175551234',
      issueType: 'Loss of Signal (Red LOS LED)',
      priority: 'High',
      status: 'Pending',
      notes: 'Customer reported red light after typhoon gust',
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const soId = soCreate.data?.id
  recordResult('ServiceOrders', 'Service Orders', 'CREATE', 'POST /api/ServiceOrders', soCreate.status, soCreate.ok && !!soId, `ID: ${soId}`)

  if (soId) {
    const soUpdate = await request(`ServiceOrders/${soId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: soId,
        ticketNumber: `SO-${TEST_TIMESTAMP}`,
        customerName: `Juan Cruz_${TEST_TIMESTAMP}`,
        contactNumber: '09175551234',
        issueType: 'Loss of Signal (Red LOS LED)',
        priority: 'High',
        status: 'Resolved',
        notes: 'Respliced drop cable at NAP-04 port 2. Optical power reading -19.2 dBm.',
        createdBy: '2',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('ServiceOrders', 'Service Orders', 'UPDATE', `PUT /api/ServiceOrders/${soId}`, soUpdate.status, soUpdate.ok)

    const soDelete = await request(`ServiceOrders/${soId}`, { method: 'DELETE' })
    recordResult('ServiceOrders', 'Service Orders', 'DELETE', `DELETE /api/ServiceOrders/${soId}`, soDelete.status, soDelete.ok)
  }

  // 12. INVOICES
  console.log('\n[CRUD] 12. Entity: Invoices (Menu: Transaction > Invoice)')
  const invBefore = await request('Invoices')
  recordResult('Invoices', 'Invoice', 'READ_ALL', 'GET /api/Invoices', invBefore.status, invBefore.ok)

  const invCreate = await request('Invoices', {
    method: 'POST',
    body: JSON.stringify({
      invoiceNumber: `INV-${TEST_TIMESTAMP}`,
      subscriberName: `Juan Cruz_${TEST_TIMESTAMP}`,
      billingPeriod: 'September 2026',
      totalAmount: '1499.00',
      status: 'Unpaid',
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
      createdBy: '2',
      createdDate: new Date().toISOString()
    })
  })
  const invId = invCreate.data?.id
  recordResult('Invoices', 'Invoice', 'CREATE', 'POST /api/Invoices', invCreate.status, invCreate.ok && !!invId, `ID: ${invId}`)

  if (invId) {
    const invUpdate = await request(`Invoices/${invId}`, {
      method: 'PUT',
      body: JSON.stringify({
        id: invId,
        invoiceNumber: `INV-${TEST_TIMESTAMP}`,
        subscriberName: `Juan Cruz_${TEST_TIMESTAMP}`,
        billingPeriod: 'September 2026',
        totalAmount: '1499.00',
        status: 'Paid',
        paymentMethod: 'GCash',
        paymentDate: new Date().toISOString(),
        createdBy: '2',
        modifiedBy: '2',
        modifiedDate: new Date().toISOString()
      })
    })
    recordResult('Invoices', 'Invoice', 'UPDATE', `PUT /api/Invoices/${invId}`, invUpdate.status, invUpdate.ok)

    const invDelete = await request(`Invoices/${invId}`, { method: 'DELETE' })
    recordResult('Invoices', 'Invoice', 'DELETE', `DELETE /api/Invoices/${invId}`, invDelete.status, invDelete.ok)
  }

  // 13. READ-ONLY AUDIT TRAIL, ERROR LOGS, & RADIUS DISCONNECTIONS
  console.log('\n[CRUD] 13. Querying System Logs & RADIUS Users...')
  const logTrail = await request('LogTrail')
  recordResult('LogTrail', 'Audit Trail', 'READ_ALL', 'GET /api/LogTrail', logTrail.status, logTrail.ok, `Logs count: ${Array.isArray(logTrail.data) ? logTrail.data.length : 'N/A'}`)

  const logError = await request('LogError')
  recordResult('LogError', 'Error Logs', 'READ_ALL', 'GET /api/LogError', logError.status, logError.ok, `Logs count: ${Array.isArray(logError.data) ? logError.data.length : 'N/A'}`)

  const radiusUsers = await request('RadiusUser')
  recordResult('RadiusUser', 'Disconnection', 'READ_ALL', 'GET /api/RadiusUser', radiusUsers.status, radiusUsers.ok, `Accounts count: ${Array.isArray(radiusUsers.data) ? radiusUsers.data.length : 'N/A'}`)

  // Write JSON report
  const jsonReportPath = path.resolve(reportOutputDir, 'switchfiber_live_crud_results.json')
  fs.writeFileSync(jsonReportPath, JSON.stringify(crudResults, null, 2), 'utf8')

  console.log(`\n=============================================================`)
  console.log(`🏁 Complete CRUD Execution Finished!`)
  console.log(`Summary: Total ${crudResults.summary.total} Operations | Passed: ${crudResults.summary.passed} | Failed: ${crudResults.summary.failed}`)
  console.log(`Report JSON saved: ${jsonReportPath}`)
  console.log(`=============================================================\n`)
}

runCrudMatrix()
