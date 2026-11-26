/*
// Gene - Nov, 26, 2026: Pinia store for centralized /api/Status options, token-aware overlays, and label lookup
import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  StatusService,
  groupStatusesByType,
  normalizeStatusToken,
  normalizeStatusType,
  resolveStatusLabel
} from '../services/status.js'
*/
// Gene - Nov, 27, 2026: Add computed, DEFAULT_STATUSES, and getFallbackStatusOptions for JSON fallback + live /api/Status mode
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DEFAULT_STATUSES,
  StatusService,
  getFallbackStatusOptions,
  groupStatusesByType,
  normalizeStatusToken,
  normalizeStatusType,
  resolveStatusLabel
} from '../services/status.js'

const extractArray = (response) => {
  if (Array.isArray(response)) return response
  if (response && typeof response === 'object') {
    const arrayKey = Object.keys(response).find(k => Array.isArray(response[k]))
    if (arrayKey) return response[arrayKey]
  }
  return []
}

export const useStatusStore = defineStore('statuses', () => {
  const statuses = ref([])
  const groupedByType = ref({})
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const isSeeding = ref(false)
  const error = ref(null)
  // Gene - Nov, 27, 2026: Cached JSON fallback map and fallback indicator when live /api/Status is unavailable or empty
  const fallbackGroupedByType = groupStatusesByType(DEFAULT_STATUSES)
  const isUsingFallback = computed(() => !isLoaded.value || statuses.value.length === 0 || Boolean(error.value))

  let pendingLoadPromise = null

  const loadStatuses = async ({ force = false } = {}) => {
    if (pendingLoadPromise && !force) return pendingLoadPromise
    if (isLoaded.value && !force) return groupedByType.value

    isLoading.value = true
    error.value = null

    const run = async () => {
      try {
        const response = await StatusService.getAll()
        const rows = extractArray(response)
        statuses.value = [...rows]
        groupedByType.value = groupStatusesByType(rows)
        isLoaded.value = true
        return groupedByType.value
      } catch (err) {
        error.value = err?.message || 'Unable to load statuses.'
        return groupedByType.value
      } finally {
        isLoading.value = false
        pendingLoadPromise = null
      }
    }

    pendingLoadPromise = run()
    return pendingLoadPromise
  }

  /*
  const getOptions = (typeCode, fallbackOptions = [], { preserveFallbackOnly = false } = {}) => {
    const normType = normalizeStatusType(typeCode)
    const apiList = Array.isArray(groupedByType.value?.[normType]) ? groupedByType.value[normType] : []
    const fallbackList = Array.isArray(fallbackOptions) ? fallbackOptions : []
    if (apiList.length === 0) return fallbackList

    const apiByLower = new Map()
    const apiByToken = new Map()
    for (const item of apiList) {
      const val = String(item?.value ?? '').trim()
      if (!val) continue
      const lower = val.toLowerCase()
      const token = normalizeStatusToken(val)
      if (!apiByLower.has(lower)) apiByLower.set(lower, item)
      if (token && !apiByToken.has(token)) apiByToken.set(token, item)
    }

    if (preserveFallbackOnly) {
      return fallbackList.map((opt) => {
        const val = String(opt?.value ?? '').trim()
        const lower = val.toLowerCase()
        const token = normalizeStatusToken(val)
        return apiByLower.get(lower) || (token ? apiByToken.get(token) : null) || opt
      })
    }

    const merged = []
    const seenTokens = new Set()
    const seenLower = new Set()
    for (const item of [...apiList, ...fallbackList]) {
      const val = String(item?.value ?? '').trim()
      if (!val) continue
      const lower = val.toLowerCase()
      const token = normalizeStatusToken(val)
      if (seenLower.has(lower) || (token && seenTokens.has(token))) continue
      seenLower.add(lower)
      if (token) seenTokens.add(token)
      merged.push({
        ...(typeof item === 'object' ? item : {}),
        label: String(item?.label || val).trim(),
        value: val
      })
    }
    return merged
  }
  */
  // Gene - Nov, 27, 2026: Use live /api/Status authoritatively when available and fall back to saved JSON catalog when unavailable/empty
  const getOptions = (typeCode, fallbackOptions = null, { preserveFallbackOnly = false } = {}) => {
    const normType = normalizeStatusType(typeCode)
    const jsonFallback = getFallbackStatusOptions(normType)
    const fallbackList = (Array.isArray(fallbackOptions) && fallbackOptions.length > 0)
      ? fallbackOptions
      : jsonFallback
    const apiList = Array.isArray(groupedByType.value?.[normType]) ? groupedByType.value[normType] : []
    if (apiList.length === 0) return fallbackList

    const hexByLower = new Map()
    const hexByToken = new Map()
    for (const fb of [...fallbackList, ...jsonFallback]) {
      if (typeof fb?.hex === 'string' && fb.hex.trim()) {
        const val = String(fb.value ?? '').trim()
        const lower = val.toLowerCase()
        const token = normalizeStatusToken(val)
        if (lower && !hexByLower.has(lower)) hexByLower.set(lower, fb.hex.trim())
        if (token && !hexByToken.has(token)) hexByToken.set(token, fb.hex.trim())
      }
    }

    const attachFallbackHex = (item, opt = null) => {
      const val = String(item?.value ?? '').trim()
      const lower = val.toLowerCase()
      const token = normalizeStatusToken(val)
      const hex = item?.hex || opt?.hex || hexByLower.get(lower) || (token ? hexByToken.get(token) : '')
      return {
        label: String(item?.label || val).trim(),
        value: val,
        ...(hex ? { hex } : {})
      }
    }

    const apiByLower = new Map()
    const apiByToken = new Map()
    for (const item of apiList) {
      const val = String(item?.value ?? '').trim()
      if (!val) continue
      const lower = val.toLowerCase()
      const token = normalizeStatusToken(val)
      if (!apiByLower.has(lower)) apiByLower.set(lower, item)
      if (token && !apiByToken.has(token)) apiByToken.set(token, item)
    }

    if (preserveFallbackOnly) {
      const matched = []
      const seenLower = new Set()
      const seenTokens = new Set()
      for (const opt of fallbackList) {
        const val = String(opt?.value ?? '').trim()
        const lower = val.toLowerCase()
        const token = normalizeStatusToken(val)
        const apiMatch = apiByLower.get(lower) || (token ? apiByToken.get(token) : null)
        if (!apiMatch) continue
        const matchVal = String(apiMatch.value ?? '').trim()
        const matchLower = matchVal.toLowerCase()
        const matchToken = normalizeStatusToken(matchVal)
        if (!matchVal || seenLower.has(matchLower) || (matchToken && seenTokens.has(matchToken))) continue
        seenLower.add(matchLower)
        if (matchToken) seenTokens.add(matchToken)
        matched.push(attachFallbackHex(apiMatch, opt))
      }
      return matched.length > 0 ? matched : fallbackList
    }

    return apiList.map(item => attachFallbackHex(item))
  }

  const getLabel = (typeCode, rawValue) => {
    return resolveStatusLabel(groupedByType.value, typeCode, rawValue)
  }

  const seedDefaults = async (createdBy = '1') => {
    isSeeding.value = true
    error.value = null
    try {
      const result = await StatusService.seedDefaultStatuses(createdBy)
      await loadStatuses({ force: true })
      return result
    } catch (err) {
      error.value = err?.message || 'Failed to seed default statuses.'
      throw err
    } finally {
      isSeeding.value = false
    }
  }

  return {
    statuses,
    groupedByType,
    fallbackGroupedByType,
    isUsingFallback,
    isLoading,
    isLoaded,
    isSeeding,
    error,
    loadStatuses,
    getOptions,
    getLabel,
    seedDefaults
  }
})
