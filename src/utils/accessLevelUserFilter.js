// Gene - Nov, 23, 2026: Name-based Access Level user filtering helpers for scoped user tables (e.g., Tech -> FIT1 / Field Installation Team)
import {
  normalizeAccessLevelKey,
  stripAccessLevelCodeFromName,
  extractAccessLevelCode
} from '../constants/accessLevelCatalog.js'

const addCandidateKeys = (keySet, raw) => {
  if (raw === null || raw === undefined) return
  const str = String(raw).trim()
  if (!str) return

  const fullKey = normalizeAccessLevelKey(str)
  if (fullKey) keySet.add(fullKey)

  const strippedKey = normalizeAccessLevelKey(stripAccessLevelCodeFromName(str))
  if (strippedKey) keySet.add(strippedKey)

  const codeKey = normalizeAccessLevelKey(extractAccessLevelCode(str))
  if (codeKey) keySet.add(codeKey)
}

const collectCandidateNames = (levelItem) => {
  if (!levelItem) return []
  if (typeof levelItem === 'string') {
    const trimmed = levelItem.trim()
    return trimmed ? [trimmed] : []
  }
  if (typeof levelItem !== 'object') return []

  const candidates = []
  const backendNames = [levelItem.rawName, levelItem.name, levelItem.Name]
    .map(v => (v === null || v === undefined ? '' : String(v).trim()))
    .filter(Boolean)

  if (backendNames.length > 0) {
    candidates.push(...backendNames)
  } else {
    const displayNames = [levelItem.label, levelItem.nameOnly]
      .map(v => (v === null || v === undefined ? '' : String(v).trim()))
      .filter(Boolean)
    candidates.push(...displayNames)
  }

  const explicitCodes = [levelItem.shortCode, levelItem.ShortCode, levelItem.code, levelItem.Code]
    .map(v => (v === null || v === undefined ? '' : String(v).trim()))
    .filter(Boolean)
  candidates.push(...explicitCodes)

  return candidates
}

/**
 * Tests whether an Access Level record or name string matches any target Access Level name or short code
 * without falling back to mutable numeric IDs.
 */
export const matchesAccessLevelTargetNames = (levelItem, targetNames = []) => {
  if (!levelItem || !Array.isArray(targetNames) || targetNames.length === 0) return false

  const targetKeys = new Set()
  targetNames.forEach(t => addCandidateKeys(targetKeys, t))
  if (targetKeys.size === 0) return false

  const candidates = collectCandidateNames(levelItem)
  for (const str of candidates) {
    const itemKeys = new Set()
    addCandidateKeys(itemKeys, str)
    for (const k of itemKeys) {
      if (targetKeys.has(k)) return true
    }
  }

  return false
}

/**
 * Resolves the set of stringified Access Level IDs whose names/codes match targetNames.
 */
export const resolveMatchingAccessLevelIds = (accessLevelsList = [], targetNames = []) => {
  const matchedIds = new Set()
  if (!Array.isArray(accessLevelsList) || !Array.isArray(targetNames) || targetNames.length === 0) {
    return matchedIds
  }

  accessLevelsList.forEach(item => {
    if (!item || typeof item !== 'object') return
    if (!matchesAccessLevelTargetNames(item, targetNames)) return
    const rawId = item.value ?? item.id ?? item.Id ?? item.ID
    if (rawId === null || rawId === undefined) return
    const idStr = String(rawId).trim()
    if (idStr !== '') {
      matchedIds.add(idStr)
    }
  })

  return matchedIds
}

/**
 * Filters a Users array to rows belonging to any Access Level matching targetNames.
 */
export const filterUsersByAccessLevelNames = (users = [], accessLevelsList = [], targetNames = []) => {
  if (!Array.isArray(users)) return []
  if (!Array.isArray(targetNames) || targetNames.length === 0) return users

  const matchedIds = resolveMatchingAccessLevelIds(accessLevelsList, targetNames)

  return users.filter(row => {
    if (!row || typeof row !== 'object') return false

    const idKey = Object.keys(row).find(k => k.toLowerCase().replace(/_/g, '') === 'accesslevelid')
    if (idKey) {
      const rawId = row[idKey]
      if (rawId !== null && rawId !== undefined) {
        const idStr = String(rawId).trim()
        if (idStr !== '' && matchedIds.has(idStr)) {
          return true
        }
      }
    }

    const inlineNameKey = Object.keys(row).find(k => {
      const norm = k.toLowerCase().replace(/_/g, '')
      return norm === 'accesslevelname' || norm === 'role'
    })
    if (inlineNameKey && row[inlineNameKey]) {
      return matchesAccessLevelTargetNames(String(row[inlineNameKey]), targetNames)
    }

    return false
  })
}
