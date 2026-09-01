<template>
  <div class="json-tree-node font-monospace small sfa-tracker-json-tree-node">
    <!-- 1. OBJECT OR ARRAY VALUE (Collapsible) -->
    <div v-if="isObjectOrArray" class="d-flex flex-column">
      <div 
        class="d-inline-flex align-items-center gap-1.5 py-0.5 px-1 rounded-2 cursor-pointer hover-bg-node user-select-none"
        @click="toggleExpand"
      >
        <!-- Toggle Chevron Icon -->
        <i 
          class="pi text-secondary transition-transform me-0.5" 
          :class="isExpanded ? 'pi-chevron-down' : 'pi-chevron-right'" 
          style="font-size: 0.72rem; width: 14px;"
        ></i>

        <!-- Key / Index label -->
        <span v-if="nodeKey !== null" class="fw-semibold text-body">
          <span v-if="typeof nodeKey === 'number'" class="badge bg-secondary bg-opacity-10 text-secondary border px-1.5 py-0.5 me-1" style="font-size: 0.68rem;">{{ nodeKey }}</span>
          <span v-else class="text-primary me-1">"{{ nodeKey }}":</span>
        </span>

        <!-- Open Bracket/Brace or Summary -->
        <span class="text-secondary fw-bold">
          {{ isArray ? '[' : '{' }}
        </span>

        <!-- Collapsed Summary Badge -->
        <span v-if="!isExpanded" class="badge bg-body-tertiary text-secondary border font-monospace px-1.5 py-0.5 mx-1 opacity-75" style="font-size: 0.7rem;">
          {{ isArray ? `${childEntries.length} items` : `${childEntries.length} keys` }}
        </span>

        <!-- Closing Bracket/Brace if collapsed -->
        <span v-if="!isExpanded" class="text-secondary fw-bold">
          {{ isArray ? ']' : '}' }}{{ isLast ? '' : ',' }}
        </span>
      </div>

      <!-- Expanded Children Container -->
      <div v-if="isExpanded" class="ps-3 border-start border-secondary border-opacity-25 ms-2 my-0.5 d-flex flex-column gap-0.5">
        <JsonTreeNode
          v-for="(entry, index) in visibleChildEntries"
          :key="entry.key"
          :node-key="entry.key"
          :data="entry.value"
          :depth="depth + 1"
          :is-last="index === childEntries.length - 1"
          :force-expand="forceExpand"
          :force-collapse="forceCollapse"
          :expand-state="expandState"
        />

        <!-- Show More Chunking Button for Large Lists -->
        <div v-if="childEntries.length > displayLimit" class="py-1.5 d-flex align-items-center gap-2">
          <button 
            type="button" 
            class="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-0.5 small shadow-xs"
            style="font-size: 0.75rem;"
            @click.stop="displayLimit += 100"
          >
            <i class="pi pi-plus me-1" style="font-size: 0.68rem;"></i>
            Show next 100 items ({{ childEntries.length - displayLimit }} remaining)
          </button>
          <button 
            type="button" 
            class="btn btn-sm btn-link text-secondary text-decoration-none p-0 small"
            style="font-size: 0.75rem;"
            @click.stop="displayLimit = childEntries.length"
          >
            Show all {{ childEntries.length }}
          </button>
        </div>
      </div>

      <!-- Closing Bracket/Brace if expanded -->
      <div v-if="isExpanded" class="ps-1 text-secondary fw-bold">
        {{ isArray ? ']' : '}' }}{{ isLast ? '' : ',' }}
      </div>
    </div>

    <!-- 2. PRIMITIVE VALUE (String, Number, Boolean, Null) -->
    <div v-else class="d-inline-flex align-items-center gap-1.5 py-0.5 px-1 ms-4">
      <span v-if="nodeKey !== null" class="fw-semibold">
        <span v-if="typeof nodeKey === 'number'" class="badge bg-secondary bg-opacity-10 text-secondary border px-1.5 py-0.5 me-1" style="font-size: 0.68rem;">{{ nodeKey }}</span>
        <span v-else class="text-primary me-1">"{{ nodeKey }}":</span>
      </span>

      <!-- Primitive Value Formatting -->
      <span :class="valueClass" class="fw-medium text-break">
        {{ formattedPrimitiveValue }}
      </span>

      <span v-if="!isLast" class="text-secondary opacity-75">,</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  nodeKey: { type: [String, Number], default: null },
  data: { type: [Object, Array, String, Number, Boolean, null], default: null },
  depth: { type: Number, default: 0 },
  isLast: { type: Boolean, default: true },
  forceExpand: { type: Number, default: 0 },
  forceCollapse: { type: Number, default: 0 },
  expandState: { type: String, default: 'collapsed' }
})

// Safe expansion: Root is always open (depth 0), child records default to collapsed
const isExpanded = ref(
  props.expandState === 'expanded'
    ? props.depth < 1
    : props.depth === 0
)

const isObjectOrArray = computed(() => {
  return props.data !== null && typeof props.data === 'object'
})

const isArray = computed(() => {
  return Array.isArray(props.data)
})

const parseValue = (val) => {
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        return JSON.parse(trimmed)
      } catch (e) {
        return val
      }
    }
  }
  return val
}

const childEntries = computed(() => {
  if (!isObjectOrArray.value) return []
  if (isArray.value) {
    return props.data.map((val, idx) => ({ key: idx, value: parseValue(val) }))
  }
  return Object.entries(props.data).map(([k, v]) => ({ key: k, value: parseValue(v) }))
})

// Render at most 50 items initially to keep DOM lightweight and avoid UI thread freezing
const displayLimit = ref(50)
const visibleChildEntries = computed(() => {
  if (childEntries.value.length <= displayLimit.value) return childEntries.value
  return childEntries.value.slice(0, displayLimit.value)
})

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
}

const formattedPrimitiveValue = computed(() => {
  if (props.data === null) return 'null'
  if (props.data === undefined) return 'undefined'
  if (typeof props.data === 'string') return `"${props.data}"`
  return String(props.data)
})

const valueClass = computed(() => {
  if (props.data === null || props.data === undefined) return 'text-muted fst-italic'
  if (typeof props.data === 'string') return 'text-success'
  if (typeof props.data === 'number') return 'text-warning'
  if (typeof props.data === 'boolean') return 'text-info fw-bold'
  return 'text-body'
})

watch(() => props.forceExpand, () => {
  if (isObjectOrArray.value) {
    isExpanded.value = true
  }
})

watch(() => props.forceCollapse, () => {
  if (isObjectOrArray.value) {
    isExpanded.value = props.depth === 0 // keep root open
  }
})

watch(() => props.expandState, (newState) => {
  if (isObjectOrArray.value) {
    isExpanded.value = newState === 'collapsed' ? props.depth === 0 : (props.depth < 1)
  }
})
</script>

<style scoped>
.hover-bg-node:hover {
  background-color: var(--bs-tertiary-bg);
  border-radius: 4px;
}
.cursor-pointer {
  cursor: pointer;
}
.transition-transform {
  transition: transform 0.15s ease-in-out;
}
</style>
