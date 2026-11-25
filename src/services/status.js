// Gene - Nov, 25, 2026: Centralized REST API service, canonical type codes, and default catalog for /api/Status
import apiClient from './api.js'

/*
export const STATUS_TYPES = [
  { code: 'APPLICATION', label: 'Applications (status)' },
  { code: 'JOB_ORDER', label: 'Job Orders (status)' },
  { code: 'JO_ONSITE', label: 'Job Orders Onsite (onsiteStatus)' },
  { code: 'SO_SUPPORT', label: 'Service Orders Support (supportStatus)' },
  { code: 'SO_VISIT', label: 'Service Orders Visit (visitStatus)' },
  { code: 'BILLING', label: 'Billing Status (billingStatus)' },
  { code: 'DELIVERY', label: 'Delivery Status (deliveryStatus)' },
  { code: 'INVOICE', label: 'Invoice Status (status)' },
  { code: 'PAYMENT', label: 'Payment Status (status)' },
  { code: 'DISCOUNT', label: 'Discount Status (discountStatus)' },
  { code: 'INVENTORY_LOG', label: 'Inventory Logs (status)' }
]
*/
// Gene - Nov, 26, 2026: Expand STATUS_TYPES to cover all 22 status and form dropdown option lists across SwitchFiber
export const STATUS_TYPES = [
  { code: 'APPLICATION', label: 'Applications (status)' },
  { code: 'JOB_ORDER', label: 'Job Orders (status)' },
  { code: 'JO_ONSITE', label: 'Job Orders Onsite (onsiteStatus)' },
  { code: 'SO_SUPPORT', label: 'Service Orders Support (supportStatus)' },
  { code: 'SO_VISIT', label: 'Service Orders Visit (visitStatus)' },
  { code: 'BILLING', label: 'Billing Status (billingStatus)' },
  { code: 'DELIVERY', label: 'Delivery Status (deliveryStatus)' },
  { code: 'INVOICE', label: 'Invoice Status (status)' },
  { code: 'PAYMENT', label: 'Payment Status (status)' },
  { code: 'DISCOUNT', label: 'Discount Status (discountStatus)' },
  { code: 'INVENTORY_LOG', label: 'Inventory Logs (status)' },
  { code: 'RENTER', label: 'Renter / Ownership (renter)' },
  { code: 'APPLYING_FOR', label: 'Application Type (applyingFor)' },
  { code: 'CONTRACT_TEMPLATE', label: 'Contract Template (contractTemplate)' },
  { code: 'USAGE_TYPE', label: 'Usage Type (usageType)' },
  { code: 'PRIORITY', label: 'Priority Level (priority)' },
  { code: 'REPAIR_CATEGORY', label: 'Repair Category (repairCategory)' },
  { code: 'CONCERN', label: 'Service Order Concern (concern)' },
  { code: 'CONNECTION_TYPE', label: 'Connection Type (connectionType)' },
  { code: 'PROMO_PLACEMENT', label: 'Promotion Placement (placement)' },
  { code: 'PROMO_IMAGE_SIZE', label: 'Promotion Image Size (imageSize)' },
  { code: 'PROMO_THEME_COLOR', label: 'Promotion Theme Color (themeColor)' }
]

/**
 * Default status catalog covering all modules across SwitchFiber:
 * - `type`: type code indicating where the status is used
 * - `name`: stored status code / value persisted on records
 * - `description`: human-readable label displayed in dropdown lists
 */
/*
export const DEFAULT_STATUSES = [
  // APPLICATION (12)
  { type: 'APPLICATION', name: 'Inprogress', description: 'In Progress' },
  { type: 'APPLICATION', name: 'Done', description: 'Done' },
  { type: 'APPLICATION', name: 'Approved', description: 'Approved' },
  { type: 'APPLICATION', name: 'Schedule', description: 'Scheduled' },
  { type: 'APPLICATION', name: 'Submitted', description: 'Submitted' },
  { type: 'APPLICATION', name: 'For Confirmation', description: 'For Confirmation' },
  { type: 'APPLICATION', name: 'Confirmed', description: 'Confirmed' },
  { type: 'APPLICATION', name: 'No Facility', description: 'No Facility' },
  { type: 'APPLICATION', name: 'No Slot', description: 'No Slot' },
  { type: 'APPLICATION', name: 'Duplicate', description: 'Duplicate' },
  { type: 'APPLICATION', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'APPLICATION', name: 'Cancelled', description: 'Cancelled' },

  // JOB_ORDER (9)
  { type: 'JOB_ORDER', name: 'Inprogress', description: 'In Progress' },
  { type: 'JOB_ORDER', name: 'Scheduled', description: 'Scheduled' },
  { type: 'JOB_ORDER', name: 'Completed', description: 'Completed' },
  { type: 'JOB_ORDER', name: 'Activated', description: 'Activated' },
  { type: 'JOB_ORDER', name: 'Failed', description: 'Failed' },
  { type: 'JOB_ORDER', name: 'For Confirmation', description: 'For Confirmation' },
  { type: 'JOB_ORDER', name: 'Confirmed', description: 'Confirmed' },
  { type: 'JOB_ORDER', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'JOB_ORDER', name: 'Cancelled', description: 'Cancelled' },

  // JO_ONSITE (4)
  { type: 'JO_ONSITE', name: 'Done', description: 'Done' },
  { type: 'JO_ONSITE', name: 'Failed', description: 'Failed' },
  { type: 'JO_ONSITE', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'JO_ONSITE', name: 'InProgress', description: 'In Progress' },

  // SO_SUPPORT (7)
  { type: 'SO_SUPPORT', name: 'Pending', description: 'Pending' },
  { type: 'SO_SUPPORT', name: 'In Progress', description: 'In Progress' },
  { type: 'SO_SUPPORT', name: 'For Visit', description: 'For Visit' },
  { type: 'SO_SUPPORT', name: 'Resolved', description: 'Resolved' },
  { type: 'SO_SUPPORT', name: 'Closed', description: 'Closed' },
  { type: 'SO_SUPPORT', name: 'Cancelled', description: 'Cancelled' },
  { type: 'SO_SUPPORT', name: 'Failed', description: 'Failed' },

  // SO_VISIT (8)
  { type: 'SO_VISIT', name: 'Scheduled', description: 'Scheduled' },
  { type: 'SO_VISIT', name: 'Dispatched', description: 'Dispatched' },
  { type: 'SO_VISIT', name: 'In Progress', description: 'In Progress' },
  { type: 'SO_VISIT', name: 'Done', description: 'Done' },
  { type: 'SO_VISIT', name: 'Completed', description: 'Completed' },
  { type: 'SO_VISIT', name: 'Reschedule', description: 'Reschedule' },
  { type: 'SO_VISIT', name: 'Cancelled', description: 'Cancelled' },
  { type: 'SO_VISIT', name: 'Failed', description: 'Failed' },

  // BILLING (6)
  { type: 'BILLING', name: 'Done', description: 'Done' },
  { type: 'BILLING', name: 'Pending', description: 'Pending' },
  { type: 'BILLING', name: 'Approved', description: 'Approved' },
  { type: 'BILLING', name: 'Active', description: 'Active' },
  { type: 'BILLING', name: 'Suspended', description: 'Suspended' },
  { type: 'BILLING', name: 'Disconnected', description: 'Disconnected' },

  // DELIVERY (6)
  { type: 'DELIVERY', name: 'Delivered', description: 'Delivered' },
  { type: 'DELIVERY', name: 'Pending', description: 'Pending' },
  { type: 'DELIVERY', name: 'Sent via Email', description: 'Sent via Email' },
  { type: 'DELIVERY', name: 'Sent via SMS', description: 'Sent via SMS' },
  { type: 'DELIVERY', name: 'Printed', description: 'Printed' },
  { type: 'DELIVERY', name: 'Failed', description: 'Failed' },

  // INVOICE (5)
  { type: 'INVOICE', name: 'Unpaid', description: 'Unpaid' },
  { type: 'INVOICE', name: 'Paid', description: 'Paid' },
  { type: 'INVOICE', name: 'Overdue', description: 'Overdue' },
  { type: 'INVOICE', name: 'Partially Paid', description: 'Partially Paid' },
  { type: 'INVOICE', name: 'Cancelled', description: 'Cancelled' },

  // PAYMENT (6)
  { type: 'PAYMENT', name: 'Paid', description: 'Paid' },
  { type: 'PAYMENT', name: 'Pending', description: 'Pending' },
  { type: 'PAYMENT', name: 'Verified', description: 'Verified' },
  { type: 'PAYMENT', name: 'Failed', description: 'Failed' },
  { type: 'PAYMENT', name: 'Refunded', description: 'Refunded' },
  { type: 'PAYMENT', name: 'Cancelled', description: 'Cancelled' },

  // DISCOUNT (6)
  { type: 'DISCOUNT', name: 'Active', description: 'Active' },
  { type: 'DISCOUNT', name: 'Used', description: 'Used' },
  { type: 'DISCOUNT', name: 'Pending', description: 'Pending' },
  { type: 'DISCOUNT', name: 'Approved', description: 'Approved' },
  { type: 'DISCOUNT', name: 'Expired', description: 'Expired' },
  { type: 'DISCOUNT', name: 'Cancelled', description: 'Cancelled' },

  // INVENTORY_LOG (5)
  { type: 'INVENTORY_LOG', name: 'Pending', description: 'Pending' },
  { type: 'INVENTORY_LOG', name: 'Approved', description: 'Approved' },
  { type: 'INVENTORY_LOG', name: 'Issued', description: 'Issued' },
  { type: 'INVENTORY_LOG', name: 'Returned', description: 'Returned' },
  { type: 'INVENTORY_LOG', name: 'Rejected', description: 'Rejected' }
]
*/
// Gene - Nov, 26, 2026: Complete 154-item catalog across 22 types covering all statuses & form dropdown values (using code 'inprogress' -> 'In Progress')
export const DEFAULT_STATUSES = [
  // APPLICATION (12)
  { type: 'APPLICATION', name: 'inprogress', description: 'In Progress' },
  { type: 'APPLICATION', name: 'Done', description: 'Done' },
  { type: 'APPLICATION', name: 'Approved', description: 'Approved' },
  { type: 'APPLICATION', name: 'Schedule', description: 'Scheduled' },
  { type: 'APPLICATION', name: 'Submitted', description: 'Submitted' },
  { type: 'APPLICATION', name: 'For Confirmation', description: 'For Confirmation' },
  { type: 'APPLICATION', name: 'Confirmed', description: 'Confirmed' },
  { type: 'APPLICATION', name: 'No Facility', description: 'No Facility' },
  { type: 'APPLICATION', name: 'No Slot', description: 'No Slot' },
  { type: 'APPLICATION', name: 'Duplicate', description: 'Duplicate' },
  { type: 'APPLICATION', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'APPLICATION', name: 'Cancelled', description: 'Cancelled' },

  // JOB_ORDER (9)
  { type: 'JOB_ORDER', name: 'inprogress', description: 'In Progress' },
  { type: 'JOB_ORDER', name: 'Scheduled', description: 'Scheduled' },
  { type: 'JOB_ORDER', name: 'Completed', description: 'Completed' },
  { type: 'JOB_ORDER', name: 'Activated', description: 'Activated' },
  { type: 'JOB_ORDER', name: 'Failed', description: 'Failed' },
  { type: 'JOB_ORDER', name: 'For Confirmation', description: 'For Confirmation' },
  { type: 'JOB_ORDER', name: 'Confirmed', description: 'Confirmed' },
  { type: 'JOB_ORDER', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'JOB_ORDER', name: 'Cancelled', description: 'Cancelled' },

  // JO_ONSITE (4)
  { type: 'JO_ONSITE', name: 'Done', description: 'Done' },
  { type: 'JO_ONSITE', name: 'Failed', description: 'Failed' },
  { type: 'JO_ONSITE', name: 'Rescheduled', description: 'Rescheduled' },
  { type: 'JO_ONSITE', name: 'inprogress', description: 'In Progress' },

  // SO_SUPPORT (7)
  { type: 'SO_SUPPORT', name: 'Pending', description: 'Pending' },
  { type: 'SO_SUPPORT', name: 'inprogress', description: 'In Progress' },
  { type: 'SO_SUPPORT', name: 'For Visit', description: 'For Visit' },
  { type: 'SO_SUPPORT', name: 'Resolved', description: 'Resolved' },
  { type: 'SO_SUPPORT', name: 'Closed', description: 'Closed' },
  { type: 'SO_SUPPORT', name: 'Cancelled', description: 'Cancelled' },
  { type: 'SO_SUPPORT', name: 'Failed', description: 'Failed' },

  // SO_VISIT (8)
  { type: 'SO_VISIT', name: 'Scheduled', description: 'Scheduled' },
  { type: 'SO_VISIT', name: 'Dispatched', description: 'Dispatched' },
  { type: 'SO_VISIT', name: 'inprogress', description: 'In Progress' },
  { type: 'SO_VISIT', name: 'Done', description: 'Done' },
  { type: 'SO_VISIT', name: 'Completed', description: 'Completed' },
  { type: 'SO_VISIT', name: 'Reschedule', description: 'Reschedule' },
  { type: 'SO_VISIT', name: 'Cancelled', description: 'Cancelled' },
  { type: 'SO_VISIT', name: 'Failed', description: 'Failed' },

  // BILLING (6)
  { type: 'BILLING', name: 'Done', description: 'Done' },
  { type: 'BILLING', name: 'Pending', description: 'Pending' },
  { type: 'BILLING', name: 'Approved', description: 'Approved' },
  { type: 'BILLING', name: 'Active', description: 'Active' },
  { type: 'BILLING', name: 'Suspended', description: 'Suspended' },
  { type: 'BILLING', name: 'Disconnected', description: 'Disconnected' },

  // DELIVERY (6)
  { type: 'DELIVERY', name: 'Delivered', description: 'Delivered' },
  { type: 'DELIVERY', name: 'Pending', description: 'Pending' },
  { type: 'DELIVERY', name: 'Sent via Email', description: 'Sent via Email' },
  { type: 'DELIVERY', name: 'Sent via SMS', description: 'Sent via SMS' },
  { type: 'DELIVERY', name: 'Printed', description: 'Printed' },
  { type: 'DELIVERY', name: 'Failed', description: 'Failed' },

  // INVOICE (5)
  { type: 'INVOICE', name: 'Unpaid', description: 'Unpaid' },
  { type: 'INVOICE', name: 'Paid', description: 'Paid' },
  { type: 'INVOICE', name: 'Overdue', description: 'Overdue' },
  { type: 'INVOICE', name: 'Partially Paid', description: 'Partially Paid' },
  { type: 'INVOICE', name: 'Cancelled', description: 'Cancelled' },

  // PAYMENT (6)
  { type: 'PAYMENT', name: 'Paid', description: 'Paid' },
  { type: 'PAYMENT', name: 'Pending', description: 'Pending' },
  { type: 'PAYMENT', name: 'Verified', description: 'Verified' },
  { type: 'PAYMENT', name: 'Failed', description: 'Failed' },
  { type: 'PAYMENT', name: 'Refunded', description: 'Refunded' },
  { type: 'PAYMENT', name: 'Cancelled', description: 'Cancelled' },

  // DISCOUNT (6)
  { type: 'DISCOUNT', name: 'Active', description: 'Active' },
  { type: 'DISCOUNT', name: 'Used', description: 'Used' },
  { type: 'DISCOUNT', name: 'Pending', description: 'Pending' },
  { type: 'DISCOUNT', name: 'Approved', description: 'Approved' },
  { type: 'DISCOUNT', name: 'Expired', description: 'Expired' },
  { type: 'DISCOUNT', name: 'Cancelled', description: 'Cancelled' },

  // INVENTORY_LOG (5)
  { type: 'INVENTORY_LOG', name: 'Pending', description: 'Pending' },
  { type: 'INVENTORY_LOG', name: 'Approved', description: 'Approved' },
  { type: 'INVENTORY_LOG', name: 'Issued', description: 'Issued' },
  { type: 'INVENTORY_LOG', name: 'Returned', description: 'Returned' },
  { type: 'INVENTORY_LOG', name: 'Rejected', description: 'Rejected' },

  // RENTER (2)
  { type: 'RENTER', name: 'No', description: 'No (Owner)' },
  { type: 'RENTER', name: 'Yes', description: 'Yes (Renter)' },

  // APPLYING_FOR (5)
  { type: 'APPLYING_FOR', name: 'New Installation', description: 'New Installation' },
  { type: 'APPLYING_FOR', name: 'Plan Upgrade', description: 'Plan Upgrade' },
  { type: 'APPLYING_FOR', name: 'Transfer of Location', description: 'Transfer of Location' },
  { type: 'APPLYING_FOR', name: 'Account Reconnection', description: 'Account Reconnection' },
  { type: 'APPLYING_FOR', name: 'Additional Line', description: 'Additional Line' },

  // CONTRACT_TEMPLATE (4)
  { type: 'CONTRACT_TEMPLATE', name: 'Standard 24-Month Residential', description: 'Standard 24-Month Residential' },
  { type: 'CONTRACT_TEMPLATE', name: 'Standard 12-Month Contract', description: 'Standard 12-Month Contract' },
  { type: 'CONTRACT_TEMPLATE', name: 'No Lock-in', description: 'No Lock-in (Month-to-Month)' },
  { type: 'CONTRACT_TEMPLATE', name: 'Corporate SLA', description: 'Corporate SLA Contract' },

  // USAGE_TYPE (4)
  { type: 'USAGE_TYPE', name: 'Regular Browsing', description: 'Regular Browsing' },
  { type: 'USAGE_TYPE', name: 'Business', description: 'Business' },
  { type: 'USAGE_TYPE', name: 'Gaming', description: 'Gaming' },
  { type: 'USAGE_TYPE', name: 'Streaming', description: 'Streaming' },

  // PRIORITY (5)
  { type: 'PRIORITY', name: 'Low', description: 'Low' },
  { type: 'PRIORITY', name: 'Medium', description: 'Medium' },
  { type: 'PRIORITY', name: 'High', description: 'High' },
  { type: 'PRIORITY', name: 'Urgent', description: 'Urgent' },
  { type: 'PRIORITY', name: 'Critical', description: 'Critical' },

  // REPAIR_CATEGORY (21)
  { type: 'REPAIR_CATEGORY', name: 'Resplice', description: 'Resplice' },
  { type: 'REPAIR_CATEGORY', name: 'Replace Patch Cord', description: 'Replace Patch Cord' },
  { type: 'REPAIR_CATEGORY', name: 'Fiber Relaying', description: 'Fiber Relaying' },
  { type: 'REPAIR_CATEGORY', name: 'Replace Router', description: 'Replace Router' },
  { type: 'REPAIR_CATEGORY', name: 'Transfer LCP / NAP / PORT', description: 'Transfer LCP / NAP / PORT' },
  { type: 'REPAIR_CATEGORY', name: 'Relocate Router', description: 'Relocate Router' },
  { type: 'REPAIR_CATEGORY', name: 'Update VLAN', description: 'Update VLAN' },
  { type: 'REPAIR_CATEGORY', name: 'Reboot/Reconfig Router', description: 'Reboot/Reconfig Router' },
  { type: 'REPAIR_CATEGORY', name: 'Migrate', description: 'Migrate' },
  { type: 'REPAIR_CATEGORY', name: 'Pullout', description: 'Pullout' },
  { type: 'REPAIR_CATEGORY', name: 'Others', description: 'Others' },
  { type: 'REPAIR_CATEGORY', name: 'Reconfig', description: 'Reconfig' },
  { type: 'REPAIR_CATEGORY', name: 'Retain', description: 'Retain' },
  { type: 'REPAIR_CATEGORY', name: 'Fiber Cut', description: 'Fiber Cut' },
  { type: 'REPAIR_CATEGORY', name: 'Modem Replacement', description: 'Modem Replacement' },
  { type: 'REPAIR_CATEGORY', name: 'Port Reassignment', description: 'Port Reassignment' },
  { type: 'REPAIR_CATEGORY', name: 'Configuration Issue', description: 'Configuration Issue' },
  { type: 'REPAIR_CATEGORY', name: 'Hardware Defect', description: 'Hardware Defect' },
  { type: 'REPAIR_CATEGORY', name: 'Relocation', description: 'Relocation' },
  { type: 'REPAIR_CATEGORY', name: 'Maintenance', description: 'Maintenance' },
  { type: 'REPAIR_CATEGORY', name: 'Other', description: 'Other' },

  // CONCERN (17)
  { type: 'CONCERN', name: 'New', description: 'New' },
  { type: 'CONCERN', name: 'No Internet', description: 'No Internet' },
  { type: 'CONCERN', name: 'Slow Internet', description: 'Slow Internet' },
  { type: 'CONCERN', name: 'Others', description: 'Others' },
  { type: 'CONCERN', name: 'Migrate', description: 'Migrate' },
  { type: 'CONCERN', name: 'Pullout', description: 'Pullout' },
  { type: 'CONCERN', name: 'Upgrade/Downgrade Plan', description: 'Upgrade/Downgrade Plan' },
  { type: 'CONCERN', name: 'Reconnect', description: 'Reconnect' },
  { type: 'CONCERN', name: 'Disconnect', description: 'Disconnect' },
  { type: 'CONCERN', name: 'Update Info', description: 'Update Info' },
  { type: 'CONCERN', name: 'Relocation', description: 'Relocation' },
  { type: 'CONCERN', name: 'Change Password', description: 'Change Password' },
  { type: 'CONCERN', name: 'High Loss', description: 'High Loss' },
  { type: 'CONCERN', name: 'Low Optical Reading', description: 'Low Optical Reading' },
  { type: 'CONCERN', name: 'Retain', description: 'Retain' },
  { type: 'CONCERN', name: 'High Power', description: 'High Power' },
  { type: 'CONCERN', name: 'Statement of Account', description: 'Statement of Account' },

  // CONNECTION_TYPE (4)
  { type: 'CONNECTION_TYPE', name: 'Fiber', description: 'Fiber Optic' },
  { type: 'CONNECTION_TYPE', name: 'Wireless', description: 'Wireless' },
  { type: 'CONNECTION_TYPE', name: 'Direct', description: 'Direct' },
  { type: 'CONNECTION_TYPE', name: 'Broadband', description: 'Broadband' },

  // PROMO_PLACEMENT (3)
  { type: 'PROMO_PLACEMENT', name: 'top_bar', description: 'Top Announcement Bar (top_bar)' },
  { type: 'PROMO_PLACEMENT', name: 'home_banner', description: 'Home Page Deal Spotlight (home_banner)' },
  { type: 'PROMO_PLACEMENT', name: 'plans_page', description: 'Plans & Pricing Page (plans_page)' },

  // PROMO_IMAGE_SIZE (3)
  { type: 'PROMO_IMAGE_SIZE', name: 'medium', description: 'Medium (Standard 16:10 card layout)' },
  { type: 'PROMO_IMAGE_SIZE', name: 'wide', description: 'Wide (Panoramic 21:9 banner layout)' },
  { type: 'PROMO_IMAGE_SIZE', name: 'large', description: 'Large (Square Hero 1:1 showcase layout)' },

  // PROMO_THEME_COLOR (12)
  { type: 'PROMO_THEME_COLOR', name: 'red', description: 'Red (Switch Red - Brand Primary)' },
  { type: 'PROMO_THEME_COLOR', name: 'amber', description: 'Amber (Amber Gold - MSME Business)' },
  { type: 'PROMO_THEME_COLOR', name: 'yellow', description: 'Yellow (Vibrant Yellow - Academic / Student)' },
  { type: 'PROMO_THEME_COLOR', name: 'emerald', description: 'Emerald (Emerald Green - Mandated Subsidy / Senior)' },
  { type: 'PROMO_THEME_COLOR', name: 'sky', description: 'Sky (Sky Blue - Fiber Deals)' },
  { type: 'PROMO_THEME_COLOR', name: 'indigo', description: 'Indigo (Indigo Royal - Ultra Tier)' },
  { type: 'PROMO_THEME_COLOR', name: 'purple', description: 'Purple (Purple Accent - Special Offers)' },
  { type: 'PROMO_THEME_COLOR', name: 'orange', description: 'Orange (Vibrant Orange - Flash Deals)' },
  { type: 'PROMO_THEME_COLOR', name: 'pink', description: 'Pink (Pink Rose - Seasonal Campaign)' },
  { type: 'PROMO_THEME_COLOR', name: 'teal', description: 'Teal (Teal Cyan - Community Connect)' },
  { type: 'PROMO_THEME_COLOR', name: 'lime', description: 'Lime (Lime Neon - Speed Boost)' },
  { type: 'PROMO_THEME_COLOR', name: 'slate', description: 'Slate (Slate Neutral - Modern Minimal)' }
]

export function normalizeStatusType(type) {
  return String(type ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_')
}

// Gene - Nov, 26, 2026: Normalize status tokens for forgiving code-to-label lookup and deduplication
export function normalizeStatusToken(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')
}

/**
 * Normalize request payload to match ASP.NET `StatusRequest` schema:
 * { type, name, description, createdBy } (all non-nullable strings).
 */
export function normalizeStatusPayload(input = {}, fallbackUser = '1') {
  const type = normalizeStatusType(input.type) || 'GENERAL'
  const name = String(input.name ?? '').trim()
  const description = String(input.description ?? '').trim() || name
  const createdBy = String(input.createdBy ?? fallbackUser ?? '1').trim() || '1'
  return {
    type,
    name,
    description,
    createdBy
  }
}

/**
 * Filter Status records by `typeCode` and map `{ label: description, value: name }`,
 * deduplicating case-insensitively by `name`.
 */
export function mapStatusesToDropdownOptions(records = [], typeCode = '') {
  if (!Array.isArray(records) || records.length === 0) return []
  const targetType = normalizeStatusType(typeCode)
  const seen = new Set()
  const out = []

  for (const row of records) {
    if (!row || typeof row !== 'object') continue
    // Gene - Nov, 26, 2026: Exclude disabled Status rows from form dropdowns
    if (row.isEnable === false || row.isActive === false) continue
    if (targetType && normalizeStatusType(row.type) !== targetType) continue
    const value = String(row.name ?? '').trim()
    if (!value) continue
    const dedupKey = value.toLowerCase()
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)
    const label = String(row.description ?? '').trim() || value
    out.push({ label, value })
  }

  return out
}

/**
 * Group Status records by normalized `type` code into `{ [TYPE]: [{ label, value }, ...] }`.
 */
export function groupStatusesByType(records = []) {
  const grouped = {}
  if (!Array.isArray(records)) return grouped

  const seenByType = {}
  for (const row of records) {
    if (!row || typeof row !== 'object') continue
    // Gene - Nov, 26, 2026: Exclude disabled Status rows from form dropdowns
    if (row.isEnable === false || row.isActive === false) continue
    const typeKey = normalizeStatusType(row.type)
    const value = String(row.name ?? '').trim()
    if (!typeKey || !value) continue
    if (!grouped[typeKey]) {
      grouped[typeKey] = []
      seenByType[typeKey] = new Set()
    }
    const dedupKey = value.toLowerCase()
    if (seenByType[typeKey].has(dedupKey)) continue
    seenByType[typeKey].add(dedupKey)
    grouped[typeKey].push({
      label: String(row.description ?? '').trim() || value,
      value
    })
  }

  return grouped
}

// Gene - Nov, 26, 2026: Resolve human-readable description label for a stored status code using live grouped Status map or DEFAULT_STATUSES
export function resolveStatusLabel(groupedOrRecords, typeCode = '', rawValue = '') {
  if (rawValue === null || rawValue === undefined) return ''
  const rawStr = String(rawValue).trim()
  if (!rawStr) return ''

  const grouped = Array.isArray(groupedOrRecords)
    ? groupStatusesByType(groupedOrRecords)
    : (groupedOrRecords && typeof groupedOrRecords === 'object' ? groupedOrRecords : {})

  const normType = normalizeStatusType(typeCode)
  const lower = rawStr.toLowerCase()
  const token = normalizeStatusToken(rawStr)

  const matchInList = (list = []) => {
    if (!Array.isArray(list) || list.length === 0) return null
    const exact = list.find(item => String(item?.value ?? item?.name ?? '').trim().toLowerCase() === lower)
    if (exact) return String(exact.label ?? exact.description ?? exact.value ?? rawStr).trim()
    if (token) {
      const byToken = list.find(item => normalizeStatusToken(item?.value ?? item?.name ?? '') === token)
      if (byToken) return String(byToken.label ?? byToken.description ?? byToken.value ?? rawStr).trim()
    }
    return null
  }

  if (normType && grouped[normType]) {
    const matched = matchInList(grouped[normType])
    if (matched) return matched
  }

  for (const list of Object.values(grouped)) {
    const matched = matchInList(list)
    if (matched) return matched
  }

  const defaultCandidates = normType
    ? DEFAULT_STATUSES.filter(d => normalizeStatusType(d.type) === normType)
    : DEFAULT_STATUSES
  const matchedDefault = matchInList(defaultCandidates) || (normType ? matchInList(DEFAULT_STATUSES) : null)
  return matchedDefault || rawStr
}

export const StatusService = {
  getAll(config = {}) {
    return apiClient.get('/Status', { cancelOnNavigate: false, ...config })
  },
  getByCode(code, config = {}) {
    return apiClient.get(`/Status/${encodeURIComponent(String(code))}`, config)
  },
  create(data, config = {}) {
    return apiClient.post('/Status', normalizeStatusPayload(data), config)
  },
  update(code, data, config = {}) {
    return apiClient.put(`/Status/${encodeURIComponent(String(code))}`, normalizeStatusPayload(data), config)
  },
  remove(code, config = {}) {
    return apiClient.delete(`/Status/${encodeURIComponent(String(code))}`, config)
  },
  /*
  async seedDefaultStatuses(createdBy = '1') {
    const res = await this.getAll()
    const existing = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])
    const created = []

    for (const item of DEFAULT_STATUSES) {
      const match = existing.find(e =>
        normalizeStatusType(e?.type) === normalizeStatusType(item.type) &&
        String(e?.name || '').trim().toLowerCase() === item.name.trim().toLowerCase()
      )
      if (!match) {
        const postRes = await this.create({ ...item, createdBy: String(createdBy || '1') })
        created.push(postRes || item)
      }
    }

    return {
      existing,
      created,
      total: existing.length + created.length
    }
  }
  */
  // Gene - Nov, 26, 2026: Resilient idempotent seeder matching by type + normalized token with consecutive-500 circuit breaker
  async seedDefaultStatuses(createdBy = '1') {
    const res = await this.getAll()
    let existing = []
    if (Array.isArray(res)) {
      existing = res
    } else if (res && typeof res === 'object') {
      const arrayKey = Object.keys(res).find(k => Array.isArray(res[k]))
      if (arrayKey) existing = res[arrayKey]
    }

    const created = []
    const skipped = []
    const failed = []
    let consecutiveServerErrors = 0

    for (const item of DEFAULT_STATUSES) {
      const match = existing.find(e =>
        normalizeStatusType(e?.type) === normalizeStatusType(item.type) &&
        normalizeStatusToken(e?.name) === normalizeStatusToken(item.name)
      )
      if (match) {
        skipped.push(item)
        continue
      }

      try {
        const postRes = await this.create({ ...item, createdBy: String(createdBy || '1') })
        created.push(postRes || item)
        existing.push(postRes || item)
        consecutiveServerErrors = 0
      } catch (err) {
        const status = err?.response?.status || err?.status || 0
        failed.push({
          ...item,
          status,
          error: err?.response?.data?.message || err?.response?.data || err?.message || 'Failed to create status'
        })
        if (status >= 500) {
          consecutiveServerErrors++
          if (consecutiveServerErrors >= 3) break
        } else {
          consecutiveServerErrors = 0
        }
      }
    }

    return {
      existing,
      created,
      skipped,
      failed,
      total: existing.length
    }
  }
}

export default StatusService
