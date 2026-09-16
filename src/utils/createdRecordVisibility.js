/**
 * Would a record saved just now be hidden by the list's current filters?
 *
 * A list page can hold a status tab (or a dedicated /<status> route) and a
 * date window at the moment the user clicks Save. The create succeeds and the
 * table refetches, but if the new record's status is not the active tab, or
 * the window is pinned to a past range, the row is nowhere on screen and the
 * page reads as "it was not saved". The page uses this to decide whether to
 * drop those filters so the new record is the first row the user sees.
 *
 * Status matching mirrors DynamicApiTable's client status filter: case is
 * ignored and spaces, underscores and dashes are dropped, so "In Progress",
 * "Inprogress" and "in-progress" are the same tab.
 */

const normStatus = (s) => String(s ?? '').trim().toLowerCase().replace(/[\s_-]+/g, '')

const toTime = (value) => {
  if (value === null || value === undefined || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return isNaN(d.getTime()) ? null : d
}

const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0).getTime()
const dayEnd = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime()

/**
 * @param {object} args
 * @param {string} [args.createdStatus]  status the new record was saved with
 * @param {string} [args.activeStatus]   status tab / route the list is filtered on ('' = All)
 * @param {Date|string|null} [args.fromDate]  start of the pinned date window (null = none)
 * @param {Date|string|null} [args.toDate]    end of the pinned date window (null = none)
 * @param {Date} [args.now]              when the record was created (defaults to now)
 * @returns {{ status: boolean, window: boolean, hidden: boolean }}
 *   `status`: the active tab would not show the record; `window`: the date
 *   range excludes today; `hidden`: either.
 */
export const createdRecordHiddenBy = ({ createdStatus, activeStatus, fromDate, toDate, now = new Date() } = {}) => {
  const active = normStatus(activeStatus)
  const status = Boolean(active) && normStatus(createdStatus) !== active

  const at = toTime(now) ?? new Date()
  const t = at.getTime()
  const from = toTime(fromDate)
  const to = toTime(toDate)
  const window = (from !== null && t < dayStart(from)) || (to !== null && t > dayEnd(to))

  return { status, window, hidden: status || window }
}

export default createdRecordHiddenBy
