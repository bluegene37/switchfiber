/**
 * Field search for the Create / Update / View dialogs.
 *
 * The dialogs keep their section cards; the query only decides which fields
 * inside each card stay visible. A card with no visible field is hidden, and a
 * query that matches a card's title shows every field in it.
 *
 * Matching is case-insensitive and every typed word must appear somewhere in
 * the field's label, its raw column key, or its label with spaces removed, so
 * "bill day", "billingday" and "BillingDay" all find Billing Day.
 */

const norm = (s) => String(s ?? '').toLowerCase().trim()

export const tokenizeFieldQuery = (query) => norm(query).split(/\s+/).filter(Boolean)

const haystackFor = (parts) => {
  const texts = parts.map(norm).filter(Boolean)
  const squashed = texts.map(t => t.replace(/[^a-z0-9]/g, ''))
  return ` ${texts.join(' ')} ${squashed.join(' ')} `
}

const wordsMatch = (words, haystack) => words.every(w => haystack.includes(w))

/**
 * @param {string} query
 * @param {{ label?: string, key?: string, aliases?: string[] }} field
 */
export const fieldMatchesQuery = (query, { label, key, aliases = [] } = {}) => {
  const words = tokenizeFieldQuery(query)
  if (!words.length) return true
  return wordsMatch(words, haystackFor([label, key, ...aliases]))
}

/**
 * @param {Array<{ key: string, title?: string, columns?: string[] }>} sections
 * @param {string} query
 * @param {{ labelFor?: (col: string) => string, aliasesFor?: (col: string) => string[] }} opts
 * @returns {{
 *   active: boolean, shown: number, total: number,
 *   isSectionShown: (secKey: string) => boolean,
 *   isFieldShown: (secKey: string, col: string) => boolean,
 *   shownInSection: (secKey: string) => number
 * }}
 */
export const filterFormSections = (sections, query, { labelFor, aliasesFor } = {}) => {
  const words = tokenizeFieldQuery(query)
  const active = words.length > 0
  const list = Array.isArray(sections) ? sections : []
  const label = typeof labelFor === 'function' ? labelFor : (c) => c
  const aliases = typeof aliasesFor === 'function' ? aliasesFor : () => []

  const shownSections = new Set()
  const shownFields = new Set()
  const perSection = new Map()
  let shown = 0
  let total = 0

  list.forEach(sec => {
    const cols = Array.isArray(sec?.columns) ? sec.columns : []
    total += cols.length
    const titleMatch = active && wordsMatch(words, haystackFor([sec?.title]))
    let any = titleMatch
    cols.forEach(col => {
      const visible = !active || titleMatch ||
        wordsMatch(words, haystackFor([label(col), col, ...(aliases(col) || [])]))
      if (!visible) return
      any = true
      shown += 1
      shownFields.add(`${sec.key} ${col}`)
      perSection.set(sec.key, (perSection.get(sec.key) || 0) + 1)
    })
    if (!active || any) shownSections.add(sec.key)
  })

  return {
    active,
    shown,
    total,
    isSectionShown: (secKey) => shownSections.has(secKey),
    isFieldShown: (secKey, col) => shownFields.has(`${secKey} ${col}`),
    shownInSection: (secKey) => perSection.get(secKey) || 0
  }
}
