// Gene - Nov, 25, 2026: Flattening normalizer, concise DataTable columns, and full View modal section layout for composite /api/RadiusUser records

/**
 * Concise set of important subscriber columns shown in the Subscribers DataTable.
 * All remaining profile, RADIUS, billing, location, network, attachment, and audit
 * fields remain accessible inside the View Details modal.
 */
export const RADIUS_USER_CONCISE_COLUMNS = [
  'accountNo',
  'fullName',
  'name',
  'contactNumber',
  'plan',
  'group',
  'accountBalance',
  'billingStatus',
  'city',
  'dateInstalled'
]

/**
 * Organized 6-section layout for the Subscribers (RadiusUser) View Details modal.
 * Audit fields are automatically routed to System Audit & Timestamp Details.
 */
export const RADIUS_USER_VIEW_LAYOUT = [
  {
    key: 'profile',
    title: 'Subscriber Profile & Contact',
    icon: 'pi pi-user',
    badgeClass: 'text-primary',
    columns: [
      'accountNo',
      'fullName',
      'contactNumber',
      'secondContactNumber',
      'emailAddress',
      'userEmail',
      'referredBy',
      'referrersAccountNumber',
      'usageType',
      'renter'
    ]
  },
  {
    key: 'radius',
    title: 'RADIUS Account & Access',
    icon: 'pi pi-shield',
    badgeClass: 'text-info',
    columns: [
      'name',
      'username',
      'group',
      'disabled',
      'password',
      'shared_users',
      'attributes',
      'otp_secret'
    ]
  },
  {
    key: 'billing',
    title: 'Plan & Billing Details',
    icon: 'pi pi-credit-card',
    badgeClass: 'text-success',
    columns: [
      'plan',
      'provider',
      'status',
      'billingStatus',
      'deliveryStatus',
      'accountBalance',
      'balanceUpdateDate',
      'billingDay',
      'dateInstalled'
    ]
  },
  {
    key: 'location',
    title: 'Installation Address & Coordinates',
    icon: 'pi pi-map-marker',
    badgeClass: 'text-warning',
    columns: [
      'addressCoordinates',
      'region',
      'city',
      'barangay',
      'address',
      'location'
    ]
  },
  {
    key: 'network',
    title: 'Network Infrastructure & Equipment',
    icon: 'pi pi-wifi',
    badgeClass: 'text-primary',
    columns: [
      'connectionType',
      'routerModel',
      'routerModemSn',
      'ip',
      'lcp',
      'nap',
      'port',
      'vlan',
      'lcpNap',
      'lcpNapPort',
      'splynxId',
      'mikrotikId'
    ]
  },
  {
    key: 'attachments',
    title: 'Attachments & Documents',
    icon: 'pi pi-paperclip',
    badgeClass: 'text-secondary',
    columns: [
      'attachment1',
      'attachment2',
      'attachment3'
    ]
  }
]

const hasNonEmptyValue = (val) =>
  val !== null && val !== undefined && String(val).trim() !== ''

/**
 * Flatten a composite `{ radiusUser, billingDetails }` record from GET /api/RadiusUser
 * into a single object suitable for DataTable rendering and the View Details modal.
 * Legacy flat records pass through cleanly.
 */
export function normalizeRadiusUserRow(raw) {
  if (!raw || typeof raw !== 'object') return raw

  const hasRadiusObj = raw.radiusUser && typeof raw.radiusUser === 'object'
  const hasBillingObj = raw.billingDetails && typeof raw.billingDetails === 'object'

  if (!hasRadiusObj && !hasBillingObj) {
    return { ...raw }
  }

  const ru = hasRadiusObj ? raw.radiusUser : {}
  const bd = hasBillingObj ? raw.billingDetails : {}

  const resolvedId = hasNonEmptyValue(bd.id) ? bd.id : (ru.id ?? '')
  const resolvedGroup = hasNonEmptyValue(ru.group) ? ru.group : (bd.group ?? '')
  const resolvedRadiusName = ru.name || bd.username || ''
  const resolvedUsername = bd.username || ru.name || ''
  const resolvedRadiusModifiedBy = ru.modifiedBy ?? ru.ModifiedBy ?? ''
  const resolvedModifiedBy = bd.modifiedBy ?? (resolvedRadiusModifiedBy || '')
  const resolvedDateCreated = ru.dateCreated ?? ru.DateCreated ?? bd.created ?? null
  const resolvedDateModified = ru.dateModified ?? ru.DateModified ?? null
  const resolvedModifiedDate = bd.modifiedDate ?? resolvedDateModified ?? null

  return {
    ...bd,
    id: resolvedId,
    name: resolvedRadiusName,
    username: resolvedUsername,
    group: resolvedGroup,
    disabled: ru.disabled ?? false,
    password: ru.password ?? '',
    attributes: ru.attributes ?? '',
    otp_secret: ru.otp_secret ?? '',
    shared_users: ru.shared_users ?? 0,
    dateCreated: resolvedDateCreated,
    dateModified: resolvedDateModified,
    radiusModifiedBy: resolvedRadiusModifiedBy,
    modifiedBy: resolvedModifiedBy,
    modifiedDate: resolvedModifiedDate
  }
}
