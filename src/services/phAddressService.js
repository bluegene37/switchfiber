/*
import defaultRegions from '../../public/data/philippines/regions.json'
import defaultProvinces from '../../public/data/philippines/provinces.json'

let regionsCache = defaultRegions || null
let provincesCache = defaultProvinces || null
let citiesCache = null
let barangaysCache = null

export const phAddressService = {
  async getRegions() {
    if (!regionsCache || regionsCache.length === 0) {
      try {
        const res = await fetch('/data/philippines/regions.json')
        if (res.ok) {
          regionsCache = await res.json()
        }
      } catch (e) {
        regionsCache = defaultRegions || []
      }
    }
    return regionsCache || defaultRegions || []
  },

  async getProvinces(regionCode = null) {
    if (!provincesCache) {
      const res = await fetch('/data/philippines/provinces.json')
      provincesCache = await res.json()
    }
    if (!regionCode) return provincesCache
    return provincesCache.filter(p => p.regionCode === regionCode)
  },

  async getCities(regionCode = null, provinceCode = null) {
    if (!citiesCache) {
      const res = await fetch('/data/philippines/cities.json')
      citiesCache = await res.json()
    }

    if (provinceCode) {
      return citiesCache.filter(c => c.provinceCode === provinceCode)
    }

    if (regionCode) {
      return citiesCache.filter(c => c.regionCode === regionCode)
    }

    return citiesCache
  },

  async getBarangays(cityCode) {
    if (!cityCode) return []
    if (!barangaysCache) {
      const res = await fetch('/data/philippines/barangays.json')
      barangaysCache = await res.json()
    }
    return barangaysCache[cityCode] || []
  }
}
*/
// Gene - Oct 23, 2026: Statically import defaultCities to eliminate 404/network failures, resolve BASE_URL for public assets, and add safe fallbacks
import defaultRegions from '../../public/data/philippines/regions.json'
import defaultProvinces from '../../public/data/philippines/provinces.json'
import defaultCities from '../../public/data/philippines/cities.json'

let regionsCache = defaultRegions || null
let provincesCache = defaultProvinces || null
let citiesCache = defaultCities || null
let barangaysCache = null

const resolveDataUrl = (relPath) => {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
    ? import.meta.env.BASE_URL
    : '/'
  const cleanBase = base.endsWith('/') ? base : `${base}/`
  const cleanRel = relPath.startsWith('/') ? relPath.slice(1) : relPath
  return `${cleanBase}${cleanRel}`
}

export const phAddressService = {
  /**
   * Fetch all Regions
   * @returns {Promise<Array<{code: string, name: string, regionName: string}>>}
   */
  async getRegions() {
    if (!regionsCache || regionsCache.length === 0) {
      try {
        const res = await fetch(resolveDataUrl('data/philippines/regions.json'))
        if (res.ok) {
          regionsCache = await res.json()
        }
      } catch (e) {
        regionsCache = defaultRegions || []
      }
    }
    return regionsCache || defaultRegions || []
  },

  /**
   * Fetch Provinces (all or filtered by Region Code)
   * @param {string|null} regionCode
   * @returns {Promise<Array<{code: string, name: string, regionCode: string}>>}
   */
  async getProvinces(regionCode = null) {
    if (!provincesCache || provincesCache.length === 0) {
      try {
        const res = await fetch(resolveDataUrl('data/philippines/provinces.json'))
        if (res.ok) {
          provincesCache = await res.json()
        }
      } catch (e) {
        provincesCache = defaultProvinces || []
      }
    }
    const list = provincesCache || defaultProvinces || []
    if (!regionCode) return list
    return list.filter(p => p.regionCode === regionCode)
  },

  /**
   * Fetch Cities & Municipalities (all or filtered by Region and/or Province Code)
   * @param {string|null} regionCode
   * @param {string|null} provinceCode
   * @returns {Promise<Array<{code: string, name: string, isCity: boolean, isMunicipality: boolean, provinceCode: string|null, regionCode: string}>>}
   */
  async getCities(regionCode = null, provinceCode = null) {
    if (!citiesCache || citiesCache.length === 0) {
      try {
        const res = await fetch(resolveDataUrl('data/philippines/cities.json'))
        if (res.ok) {
          citiesCache = await res.json()
        }
      } catch (e) {
        citiesCache = defaultCities || []
      }
    }

    const list = citiesCache || defaultCities || []

    if (provinceCode) {
      return list.filter(c => c.provinceCode === provinceCode)
    }

    if (regionCode) {
      return list.filter(c => c.regionCode === regionCode)
    }

    return list
  },

  /**
   * Fetch Barangays by City / Municipality Code
   * @param {string} cityCode
   * @returns {Promise<Array<{code: string, name: string}>>}
   */
  async getBarangays(cityCode) {
    if (!cityCode) return []
    if (!barangaysCache) {
      try {
        const res = await fetch(resolveDataUrl('data/philippines/barangays.json'))
        if (res.ok) {
          barangaysCache = await res.json()
        }
      } catch (e) {
        console.warn('Failed to load barangays data:', e)
      }
    }
    return (barangaysCache && barangaysCache[cityCode]) ? barangaysCache[cityCode] : []
  }
}

export default phAddressService
