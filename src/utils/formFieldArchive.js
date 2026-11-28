// Gene - Nov, 28, 2026: AppSheet field-alignment archive configuration and section partitioning for Applications, Job Orders, and Service Orders

export const ARCHIVED_SECTION_KEY = 'archived'

export function normalizeArchiveEndpoint(endpoint) {
  const norm = String(endpoint || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '')
  if (norm === 'application' || norm === 'applications') return 'applications'
  if (norm === 'joborder' || norm === 'joborders') return 'joborders'
  if (norm === 'serviceorder' || norm === 'serviceorders') return 'serviceorders'
  return norm
}

export function normalizeArchiveColKey(col) {
  return String(col || '').trim().toLowerCase().replace(/_/g, '')
}

export const ARCHIVED_FORM_FIELDS_BY_ENDPOINT = {
  // Unused in AppSheet TST - SWITCH CBMS Application / Application Visit forms
  applications: new Set([
    'barangay1',
    'barangay2',
    'landmark',
    'applyingfor',
    'referrersaccountnumber',
    'proofofbilling',
    'pictureofstatmentbillingfromotherprovider',
    'pictureofstatementbillingfromotherprovider',
    'visitby',
    'visitwith',
    'visitwithother',
    'useremail'
  ]),
  // Unused in AppSheet TST - SWITCH CBMS Job_Order Edit form (remarks & statusRemarks remain hidden by isHiddenJobOrderFormField)
  joborders: new Set([
    'accountno',
    'emailaddress',
    'email',
    'referrersaccountnumber',
    'location',
    'installationlandmark',
    'installationfee',
    'billingday',
    'preferredday',
    'billingstatus',
    'lcpnapid',
    'lcpnapportid',
    'verifiedby',
    'starttimestamp',
    'endtimestamp',
    'duration',
    'renter',
    'usernamestatus',
    'externalid',
    'applicationid',
    'applicationidvalue',
    'joremarks',
    'housefront',
    'housefrontpicture',
    'speedtestimage',
    'portlabelimage',
    'useremail'
  ]),
  // Unused in AppSheet TST - SWITCH CBMS Service_Order Edit form
  serviceorders: new Set([
    'addresscoordinates',
    'coordinates',
    'region',
    'city',
    'barangay',
    'address',
    'prioritylevel',
    'requestedby',
    'useremail',
    'assignedby',
    'assigneddate',
    'starttimestamp',
    'stoptimestamp',
    'duration',
    'pulloutroutermodel',
    'pulloutroutermodelsn',
    'pulloutcpesn',
    'pulloutremarks',
    'itemname',
    'itemquantity',
    'housefrontpicture',
    'techmodifieddate'
  ])
}

const EMPTY_FIELD_SET = new Set()

export function getArchivedFieldSet(endpoint) {
  const key = normalizeArchiveEndpoint(endpoint)
  return ARCHIVED_FORM_FIELDS_BY_ENDPOINT[key] || EMPTY_FIELD_SET
}

export function isArchivedFormField(endpoint, col) {
  const archivedSet = getArchivedFieldSet(endpoint)
  if (!archivedSet.size || !col) return false
  return archivedSet.has(normalizeArchiveColKey(col))
}

export function filterNonArchivedColumns(endpoint, cols = []) {
  const list = Array.isArray(cols) ? cols : []
  const archivedSet = getArchivedFieldSet(endpoint)
  if (!archivedSet.size) return list
  return list.filter(col => !archivedSet.has(normalizeArchiveColKey(col)))
}

export function partitionArchivedFormSections(sections = [], endpoint) {
  if (!Array.isArray(sections) || sections.length === 0) return Array.isArray(sections) ? sections : []
  const archivedSet = getArchivedFieldSet(endpoint)
  if (!archivedSet.size) return sections

  const activeSections = []
  const auditSections = []
  const archivedCols = []
  const seenArchived = new Set()

  sections.forEach(sec => {
    if (!sec) return
    if (sec.key === 'audit') {
      auditSections.push(sec)
      return
    }
    if (sec.key === ARCHIVED_SECTION_KEY || sec.isArchived) {
      ;(sec.columns || []).forEach(col => {
        const key = normalizeArchiveColKey(col)
        if (!seenArchived.has(key)) {
          seenArchived.add(key)
          archivedCols.push(col)
        }
      })
      return
    }

    const activeCols = []
    ;(sec.columns || []).forEach(col => {
      const key = normalizeArchiveColKey(col)
      if (archivedSet.has(key)) {
        if (!seenArchived.has(key)) {
          seenArchived.add(key)
          archivedCols.push(col)
        }
      } else {
        activeCols.push(col)
      }
    })

    if (activeCols.length > 0) {
      activeSections.push({ ...sec, columns: activeCols })
    }
  })

  if (archivedCols.length === 0) {
    return [...activeSections, ...auditSections]
  }

  return [
    ...activeSections,
    {
      key: ARCHIVED_SECTION_KEY,
      title: 'Archived Fields (Unused in AppSheet)',
      icon: 'pi pi-box',
      badgeClass: 'text-secondary',
      isArchived: true,
      collapsible: true,
      columns: archivedCols
    },
    ...auditSections
  ]
}
