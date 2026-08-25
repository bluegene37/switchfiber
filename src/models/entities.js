/**
 * Default list of system entities recorded in the audit trail and error logs.
 * Maintained locally so dropdown selection operates offline and does not
 * depend on backend data existence or date-window availability.
 */
export const DEFAULT_LOG_ENTITIES = [
  'AccessLevel',
  'AccesslevelMenu',
  'Applications',
  'Auth',
  'Barangays',
  'BillingDetails',
  'BillingStatements',
  'BillingStatuses',
  'Invoices',
  'JobOrders',
  'LCPNapLocations',
  'Lcpnapports',
  'Lcpnaps',
  'Lcps',
  'LogError',
  'LogTrail',
  'Menus',
  'Naps',
  'Plans',
  'Ports',
  'RadiusSession',
  'RadiusUser',
  'Routers',
  'ServiceOrders',
  'Token',
  'Users',
  'Vlans'
]

export const DEFAULT_AUDIT_TRAIL_ENTITIES = DEFAULT_LOG_ENTITIES
