<template>
  <div class="d-flex flex-column gap-4">
    <div class="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
      <div>
        <h1 class="fs-3 fw-bold text-body mb-0">Settings & Permissions</h1>
        <p class="small text-secondary mt-1 mb-0">Manage system configurations, user roles, and access controls.</p>
      </div>
    </div>

    <div class="card shadow-sm border-0 rounded-4 overflow-hidden p-4">
      <Tabs value="0">
        <TabList class="bg-body-tertiary border-bottom">
          <Tab value="0" class="px-4 py-3 small fw-medium">Roles Management</Tab>
          <Tab value="1" class="px-4 py-3 small fw-medium">Permissions Matrix</Tab>
        </TabList>
        <TabPanels class="p-0 mt-3">
          <!-- Roles Management Panel -->
          <TabPanel value="0" class="p-0">
            <div class="mt-4">
              <DataTable :value="rolesList" responsiveLayout="scroll" class="p-datatable-sm small">
                <Column field="name" header="Role Name" :sortable="true">
                  <template #body="{ data }">
                    <span class="fw-semibold text-body">{{ data.name }}</span>
                  </template>
                </Column>
                <Column field="description" header="Description"></Column>
                <Column field="users" header="Assigned Users" :sortable="true">
                  <template #body="{ data }">
                    <Tag severity="info" :value="data.users.toString()" rounded></Tag>
                  </template>
                </Column>
                <Column header="Actions" :exportable="false" style="min-width:8rem">
                  <template #body>
                    <Button icon="pi pi-pencil" text rounded severity="secondary" v-tooltip.top="'Edit Role'" />
                    <Button icon="pi pi-trash" text rounded severity="danger" v-tooltip.top="'Delete Role'" />
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>

          <!-- Permissions Matrix Panel -->
          <TabPanel value="1" class="p-0">
            <div class="mt-4 table-responsive">
              <table class="table table-hover align-middle border">
                <thead class="table-light">
                  <tr>
                    <th scope="col" class="text-secondary small fw-semibold text-uppercase">
                      Permission / Role
                    </th>
                    <th 
                      v-for="role in rolesList" 
                      :key="role.id" 
                      scope="col" 
                      class="text-center text-secondary small fw-semibold text-uppercase"
                    >
                      {{ role.name }}
                    </th>
                  </tr>
                </thead>
                <tbody class="table-group-divider">
                  <tr v-for="perm in permissionsList" :key="perm.id">
                    <td class="text-nowrap small fw-medium text-body">
                      {{ perm.name }}
                    </td>
                    <td 
                      v-for="role in rolesList" 
                      :key="role.id" 
                      class="text-center"
                    >
                      <Checkbox 
                        :binary="true" 
                        :modelValue="hasPermission(role.id, perm.id)"
                        @update:modelValue="(val) => handlePermissionChange(role.id, perm.id, val)"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAppStore } from '../stores/app'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'

const appStore = useAppStore()

const rolesList = computed(() => appStore.rolesList)
const permissionsList = computed(() => appStore.permissionsList)
const permissionsMatrix = computed(() => appStore.permissionsMatrix)

const hasPermission = (roleId, permId) => {
  return permissionsMatrix.value[roleId]?.includes(permId) || false
}

const handlePermissionChange = async (roleId, permId, val) => {
  await appStore.updatePermission(roleId, permId, val)
}
</script>
