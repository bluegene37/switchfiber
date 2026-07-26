<template>
  <div :class="['ph-address-select', layout === 'grid' ? 'row g-3' : 'd-flex flex-column gap-3']">
    <!-- Region -->
    <div :class="layout === 'grid' ? 'col-md-6 col-lg-3' : ''">
      <label v-if="showLabels" class="form-label font-medium text-sm">
        Region <span v-if="required" class="text-danger">*</span>
      </label>
      <select
        v-model="selectedRegionCode"
        @change="handleRegionChange"
        :disabled="disabled || loadingRegions"
        class="form-select"
      >
        <option value="">{{ loadingRegions ? 'Loading Regions...' : 'Select Region' }}</option>
        <option v-for="region in regions" :key="region.code" :value="region.code">
          {{ region.name }} ({{ region.regionName }})
        </option>
      </select>
    </div>

    <!-- Province -->
    <div :class="layout === 'grid' ? 'col-md-6 col-lg-3' : ''">
      <label v-if="showLabels" class="form-label font-medium text-sm">
        Province <span v-if="required && provinces.length > 0" class="text-danger">*</span>
      </label>
      <select
        v-model="selectedProvinceCode"
        @change="handleProvinceChange"
        :disabled="disabled || !selectedRegionCode || provinces.length === 0"
        class="form-select"
      >
        <option value="">
          {{
            !selectedRegionCode
              ? 'Select Region First'
              : provinces.length === 0
              ? 'N/A (No Provinces)'
              : 'Select Province'
          }}
        </option>
        <option v-for="prov in provinces" :key="prov.code" :value="prov.code">
          {{ prov.name }}
        </option>
      </select>
    </div>

    <!-- City / Municipality -->
    <div :class="layout === 'grid' ? 'col-md-6 col-lg-3' : ''">
      <label v-if="showLabels" class="form-label font-medium text-sm">
        City / Municipality <span v-if="required" class="text-danger">*</span>
      </label>
      <select
        v-model="selectedCityCode"
        @change="handleCityChange"
        :disabled="disabled || !selectedRegionCode || loadingCities"
        class="form-select"
      >
        <option value="">
          {{
            !selectedRegionCode
              ? 'Select Region First'
              : loadingCities
              ? 'Loading Cities...'
              : 'Select City / Municipality'
          }}
        </option>
        <option v-for="city in cities" :key="city.code" :value="city.code">
          {{ city.name }} {{ city.isCity ? '(City)' : '' }}
        </option>
      </select>
    </div>

    <!-- Barangay -->
    <div :class="layout === 'grid' ? 'col-md-6 col-lg-3' : ''">
      <label v-if="showLabels" class="form-label font-medium text-sm">
        Barangay <span v-if="required" class="text-danger">*</span>
      </label>
      <select
        v-model="selectedBarangayCode"
        @change="emitUpdate"
        :disabled="disabled || !selectedCityCode || loadingBarangays"
        class="form-select"
      >
        <option value="">
          {{
            !selectedCityCode
              ? 'Select City First'
              : loadingBarangays
              ? 'Loading Barangays...'
              : 'Select Barangay'
          }}
        </option>
        <option v-for="brgy in barangays" :key="brgy.code" :value="brgy.code">
          {{ brgy.name }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import phAddressService from '../services/phAddressService'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      region: null,
      province: null,
      city: null,
      barangay: null
    })
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  showLabels: {
    type: Boolean,
    default: true
  },
  layout: {
    type: String,
    default: 'grid', // 'grid' | 'stacked'
    validator: v => ['grid', 'stacked'].includes(v)
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

const regions = ref([])
const provinces = ref([])
const cities = ref([])
const barangays = ref([])

const loadingRegions = ref(false)
const loadingCities = ref(false)
const loadingBarangays = ref(false)

const selectedRegionCode = ref('')
const selectedProvinceCode = ref('')
const selectedCityCode = ref('')
const selectedBarangayCode = ref('')

onMounted(async () => {
  loadingRegions.value = true
  try {
    regions.value = await phAddressService.getRegions()
  } catch (err) {
    console.error('Failed to load PH regions:', err)
  } finally {
    loadingRegions.value = false
  }

  // Prepopulate if modelValue has existing codes
  if (props.modelValue?.region?.code) {
    selectedRegionCode.value = props.modelValue.region.code
    await handleRegionChange(false)
    if (props.modelValue?.province?.code) {
      selectedProvinceCode.value = props.modelValue.province.code
      await handleProvinceChange(false)
    }
    if (props.modelValue?.city?.code) {
      selectedCityCode.value = props.modelValue.city.code
      await handleCityChange(false)
    }
    if (props.modelValue?.barangay?.code) {
      selectedBarangayCode.value = props.modelValue.barangay.code
    }
  }
})

const handleRegionChange = async (resetChildSelection = true) => {
  provinces.value = []
  cities.value = []
  barangays.value = []

  if (resetChildSelection) {
    selectedProvinceCode.value = ''
    selectedCityCode.value = ''
    selectedBarangayCode.value = ''
  }

  if (!selectedRegionCode.value) {
    emitUpdate()
    return
  }

  // Load provinces and cities for region
  loadingCities.value = true
  try {
    const [provList, cityList] = await Promise.all([
      phAddressService.getProvinces(selectedRegionCode.value),
      phAddressService.getCities(selectedRegionCode.value)
    ])
    provinces.value = provList
    cities.value = cityList
  } catch (err) {
    console.error('Error fetching region details:', err)
  } finally {
    loadingCities.value = false
  }

  emitUpdate()
}

const handleProvinceChange = async (resetChildSelection = true) => {
  cities.value = []
  barangays.value = []

  if (resetChildSelection) {
    selectedCityCode.value = ''
    selectedBarangayCode.value = ''
  }

  if (selectedRegionCode.value) {
    loadingCities.value = true
    try {
      cities.value = await phAddressService.getCities(
        selectedRegionCode.value,
        selectedProvinceCode.value || null
      )
    } catch (err) {
      console.error('Error fetching cities:', err)
    } finally {
      loadingCities.value = false
    }
  }

  emitUpdate()
}

const handleCityChange = async (resetChildSelection = true) => {
  barangays.value = []

  if (resetChildSelection) {
    selectedBarangayCode.value = ''
  }

  if (selectedCityCode.value) {
    loadingBarangays.value = true
    try {
      barangays.value = await phAddressService.getBarangays(selectedCityCode.value)
    } catch (err) {
      console.error('Error fetching barangays:', err)
    } finally {
      loadingBarangays.value = false
    }
  }

  emitUpdate()
}

const emitUpdate = () => {
  const regionObj = regions.value.find(r => r.code === selectedRegionCode.value) || null
  const provinceObj = provinces.value.find(p => p.code === selectedProvinceCode.value) || null
  const cityObj = cities.value.find(c => c.code === selectedCityCode.value) || null
  const barangayObj = barangays.value.find(b => b.code === selectedBarangayCode.value) || null

  const addressParts = [
    barangayObj ? `Brgy. ${barangayObj.name}` : null,
    cityObj ? cityObj.name : null,
    provinceObj ? provinceObj.name : null,
    regionObj ? regionObj.name : null
  ].filter(Boolean)

  const payload = {
    region: regionObj,
    province: provinceObj,
    city: cityObj,
    barangay: barangayObj,
    fullAddress: addressParts.join(', ')
  }

  emit('update:modelValue', payload)
  emit('change', payload)
}
</script>
