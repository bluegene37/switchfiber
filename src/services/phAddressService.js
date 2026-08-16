import defaultRegions from '../../public/data/philippines/regions.json'
import defaultProvinces from '../../public/data/philippines/provinces.json'

let regionsCache = defaultRegions || null
let provincesCache = defaultProvinces || null
let citiesCache = null
let barangaysCache = null

export const phAddressService = {
  /**
   * Fetch all Regions
   * @returns {Promise<Array<{code: string, name: string, regionName: string}>>}
   */
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

  /**
   * Fetch Provinces (all or filtered by Region Code)
   * @param {string|null} regionCode
   * @returns {Promise<Array<{code: string, name: string, regionCode: string}>>}
   */
  async getProvinces(regionCode = null) {
    if (!provincesCache) {
      const res = await fetch('/data/philippines/provinces.json')
      provincesCache = await res.json()
    }
    if (!regionCode) return provincesCache
    return provincesCache.filter(p => p.regionCode === regionCode)
  },

  /**
   * Fetch Cities & Municipalities (all or filtered by Region and/or Province Code)
   * @param {string|null} regionCode
   * @param {string|null} provinceCode
   * @returns {Promise<Array<{code: string, name: string, isCity: boolean, isMunicipality: boolean, provinceCode: string|null, regionCode: string}>>}
   */
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

  /**
   * Fetch Barangays by City / Municipality Code
   * @param {string} cityCode
   * @returns {Promise<Array<{code: string, name: string}>>}
   */
  async getBarangays(cityCode) {
    if (!cityCode) return []
    if (!barangaysCache) {
      const res = await fetch('/data/philippines/barangays.json')
      barangaysCache = await res.json()
    }
    return barangaysCache[cityCode] || []
  }
}

export default phAddressService
