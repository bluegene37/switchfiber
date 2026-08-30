// Shared date-window presets for the list toolbars.
//
// Applications, Job Orders, Service Orders and the Logs screens all render the
// same row of range buttons and had four copies of the same arithmetic, so the
// ranges live here once. Each view keeps its own state: Applications and Job
// Orders layer an auto-widen fallback on top, Service Orders and Logs clear the
// range when the active preset is clicked again.
//
// A window is always inclusive of whole days — `from` at 00:00:00.000 and `to`
// at 23:59:59.999 — because the backend compares against timestamps, and a `to`
// bound at midnight silently drops everything recorded that day.

export const startOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)

export const endOfDay = (d) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

/** Monday-to-Sunday, matching how the operations team reads a week. */
export const currentWeekBounds = (now = new Date()) => {
  const day = now.getDay()
  const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1)
  return {
    from: new Date(now.getFullYear(), now.getMonth(), diffToMonday, 0, 0, 0, 0),
    to: new Date(now.getFullYear(), now.getMonth(), diffToMonday + 6, 23, 59, 59, 999)
  }
}

// The preset marking a hand-picked range. It has no arithmetic of its own — the
// From/To pickers are the source of truth — but it needs a name so the button
// can light up and the auto-widen fallback knows to stand down.
export const CUSTOM_PRESET = 'custom'

// Rendered left to right. Anything past `this_month` spans more than one month,
// which is the whole point of the wider entries.
export const DATE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_12_months', label: 'Last 12 Months' },
  { id: CUSTOM_PRESET, label: 'Custom' }
]

/** How many months back a `last_N_months` preset reaches. */
const MONTHS_BACK = {
  last_12_months: 12
}

/**
 * Resolve a preset id to `{ from, to }`.
 * Returns null for `custom` and for anything unrecognised, so callers leave the
 * pickers alone rather than snapping them to a range the user did not ask for.
 */
export const resolveDatePreset = (preset, now = new Date()) => {
  if (preset === 'today') {
    return { from: startOfDay(now), to: endOfDay(now) }
  }
  if (preset === 'this_week') {
    return currentWeekBounds(now)
  }
  if (preset === 'this_month') {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0),
      to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
    }
  }
  const months = MONTHS_BACK[preset]
  if (months) {
    // Whole months back through today: "Last 3 Months" on 30 Aug starts 1 Jun,
    // so a range never begins mid-month and the label stays honest.
    return {
      from: new Date(now.getFullYear(), now.getMonth() - (months - 1), 1, 0, 0, 0, 0),
      to: endOfDay(now)
    }
  }
  return null
}

/** True when the preset spans more than the calendar month it sits in. */
export const isWideRange = (preset) => Boolean(MONTHS_BACK[preset])
