import { EndpointSchemaMeta } from './schemaMeta.js'

/**
 * Decides which form fields are mandatory.
 *
 * The API cannot answer this on its own: ASP.NET emits every non-nullable
 * property into the OpenAPI `required` array, so CreateApplicationRequest
 * claims all 36 of its fields are required. Taking that literally would make
 * the Application form impossible to submit.
 *
 * So the schema list (already narrowed to required-and-non-nullable by
 * scripts/generate_schema_meta.js) is filtered through two layers:
 *
 *   1. SYSTEM_FIELDS      — audit/identity columns the app fills in itself.
 *   2. ENDPOINT_OVERRIDES — a hand-tuned list for the three endpoints where
 *                           the schema is still far too broad.
 *
 * Editing the overrides below is the intended way to change what a form
 * demands; nothing else needs to be touched.
 */

/**
 * Columns the server or DynamicApiTable populates, never the user.
 * Compared after normalization, so `created_by`, `createdBy` and
 * `CreatedByUserId` all match.
 */
const SYSTEM_FIELDS = new Set([
  'id',
  'rowversion',
  'timestamp',
  'created',
  'createdat',
  'createdby',
  'createdbyuserid',
  'createddate',
  'modifiedat',
  'modifiedby',
  'modifiedbyuserid',
  'modifieddate',
  'lastmodified',
  'lastmodifiedby',
  'updatedat',
  'updatedby',
  'updateddate',
  'useremail'
])

/**
 * Endpoints where the schema-derived list is still unusable, with the set a
 * user actually has to fill in. Keys are matched case-insensitively against
 * the DynamicApiTable `endpoint` prop.
 *
 * The counts in the comments are what the schema alone would have demanded.
 * Every other endpoint is left to the schema, which gets it right — the
 * lookup tables resolve to `name` + `description`, Users to its eight real
 * fields, and so on.
 */
const ENDPOINT_OVERRIDES = {
  applications: [ // schema says 32
    'emailAddress', 'region', 'city', 'barangay',
    'firstName', 'lastName', 'mobileNumber',
    'installationAddress', 'desiredPlan', 'status',
    'houseFrontPicture', 'governmentValidId'
    // documentPicture is NOT hard-required: it forms an either-or pair with
    // proofOfBilling (see EITHER_OR_GROUPS below), matching the user website's
    // registration wizard.
  ],
  joborders: [ // schema says 78
    'firstName', 'lastName', 'contactNumber', 'address',
    'region', 'city', 'barangay', 'planId', 'status',
    // Numeric columns the API refuses to take blank in either spelling: null
    // answers 400 "The BillingDay field is required", '' answers 500 because
    // the empty string cannot be converted to a number. Left off this list,
    // a job order with an empty fee or billing day could not be saved at all
    // and the dialog gave no clue which field to fill in.
    'installationFee', 'billingDay'
  ],
  billingdetails: [ // schema says 34
    'fullName', 'contactNumber', 'address',
    'region', 'city', 'barangay', 'plan', 'status'
  ],
  lcpnaplocations: [
    'lcp', 'nap', 'portTotal', 'coordinates'
  ],
  serviceorders: [ // schema says 60
    'accountNumber', 'fullName', 'contactNumber', 'address',
    'plan', 'concern', 'priorityLevel', 'supportStatus', 'visitStatus'
  ],
  discounttypes: [
    'name', 'amount'
  ],
  discounts: [
    'fullName', 'contactNumber', 'discounttype_id'
  ],
  plans: [
    'name', 'amount'
  ]
}

/**
 * Groups of columns where at least ONE member must be filled in, but no single
 * member is individually required. Mirrors the user website's registration
 * wizard, where an applicant provides Proof of Billing OR an Additional
 * Supporting Document (documentPicture).
 */
const EITHER_OR_GROUPS = {
  applications: [
    ['proofOfBilling', 'documentPicture']
  ]
}

/**
 * Same normalization DynamicApiTable's getFieldType uses, so the API's
 * `menu_id` / `accesslevel_id` line up with the form's `menuId` /
 * `accessLevelId`.
 */
const normalize = (name) => String(name || '').toLowerCase().replace(/_/g, '')

const lookupEndpointMeta = (endpoint) => {
  if (!endpoint) return null
  const target = normalize(endpoint)
  const key = Object.keys(EndpointSchemaMeta).find(k => normalize(k) === target)
  return key ? EndpointSchemaMeta[key] : null
}

/**
 * The mandatory columns for a form, expressed as names that exist in
 * `formColumns` (so callers can look them up in the form data directly).
 *
 * Endpoints with no request schema — RadiusUser, BillingStatements — and
 * those whose DTO is entirely nullable — Plans, Invoices — return an empty
 * array, leaving those forms exactly as they behaved before.
 *
 * @param {string} endpoint      the DynamicApiTable `endpoint` prop
 * @param {string[]} formColumns the columns actually rendered in the form
 * @param {'create'|'update'} mode
 * @returns {string[]} column names, in `formColumns` order
 */
export function resolveRequiredFields(endpoint, formColumns = [], mode = 'create') {
  const override = ENDPOINT_OVERRIDES[normalize(endpoint)]

  let candidates
  if (override) {
    candidates = override
  } else {
    const meta = lookupEndpointMeta(endpoint)
    // Fall back to the other verb's schema: several endpoints describe only
    // one of POST/PUT, and the two shapes are near-identical where both exist.
    const modeMeta = meta?.[mode] || meta?.create || meta?.update
    candidates = modeMeta?.required || []
  }

  const wanted = new Set(
    candidates.map(normalize).filter(name => !SYSTEM_FIELDS.has(name))
  )
  if (!wanted.size) return []

  // Only ever require something the form actually renders. UpdateBarangayRequest
  // demands `city`, for instance, which the Barangays form has no input for.
  return formColumns.filter(col => wanted.has(normalize(col)))
}

/**
 * The either-or groups that apply to a form, restricted to columns it actually
 * renders. A group only makes sense when at least two of its members are on
 * screen; otherwise it is dropped rather than silently requiring a lone field.
 *
 * @param {string} endpoint      the DynamicApiTable `endpoint` prop
 * @param {string[]} formColumns the columns actually rendered in the form
 * @returns {string[][]} groups of column names, in `formColumns` order
 */
export function resolveEitherOrGroups(endpoint, formColumns = []) {
  const groups = EITHER_OR_GROUPS[normalize(endpoint)] || []
  return groups
    .map(group => {
      const wanted = new Set(group.map(normalize))
      return formColumns.filter(col => wanted.has(normalize(col)))
    })
    .filter(group => group.length >= 2)
}

/**
 * True when the endpoint's required set came from a hand-tuned override rather
 * than straight from the schema. The Models page uses this to explain why a
 * field the API calls required is not marked required in the form.
 */
export function hasRequiredOverride(endpoint) {
  return Boolean(ENDPOINT_OVERRIDES[normalize(endpoint)])
}

/** True for columns the app fills in itself, so a form never asks for them. */
export function isSystemField(name) {
  return SYSTEM_FIELDS.has(normalize(name))
}
