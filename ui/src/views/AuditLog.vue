<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-carbon-900 mb-1">Audit Log</h1>
      <p class="text-sm text-carbon-500">Full audit trail of patient record changes and user actions</p>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-3 mb-6">
      <input
        v-model="search"
        class="flex-1 max-w-xs h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
        placeholder="Search events..."
      />
      <input
        v-model="dateFilter"
        type="date"
        class="h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none max-w-[180px]"
      />
      <button
        class="h-10 px-4 border border-carbon-300 text-carbon-700 text-sm hover:bg-carbon-50"
        @click="fetchAuditEvents"
      >Refresh</button>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-xs uppercase text-carbon-500 bg-carbon-50 border-b border-carbon-200">
          <tr>
            <th class="px-4 py-3 text-left font-medium">Timestamp</th>
            <th class="px-4 py-3 text-left font-medium">Type</th>
            <th class="px-4 py-3 text-left font-medium">Action</th>
            <th class="px-4 py-3 text-left font-medium">Outcome</th>
            <th class="px-4 py-3 text-left font-medium">Agent</th>
            <th class="px-4 py-3 text-left font-medium">Entity</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading State -->
          <tr v-if="loading">
            <td :colspan="6" class="px-4 py-16 text-center">
              <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-carbon-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p class="text-sm text-carbon-400">Loading audit events...</p>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="filteredEvents.length === 0">
            <td :colspan="6" class="px-4 py-16 text-center">
              <div class="text-carbon-300 mb-3">
                <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-carbon-500">No audit events found</h3>
              <p class="text-sm text-carbon-400">Try adjusting your search or date filter</p>
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-for="(ev, idx) in filteredEvents"
            :key="idx"
            class="border-b border-carbon-100 hover:bg-carbon-50"
            :class="idx % 2 === 1 ? 'bg-white' : 'bg-carbon-50/30'"
          >
            <td class="px-4 py-3 whitespace-nowrap text-carbon-600">{{ dayjs(ev.recorded).format('YYYY-MM-DD HH:mm:ss') }}</td>
            <td class="px-4 py-3">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="typeTagClass(ev.type)"
              >{{ ev.type }}</span>
            </td>
            <td class="px-4 py-3 text-carbon-700">{{ ev.action }}</td>
            <td class="px-4 py-3">
              <span class="flex items-center gap-1.5">
                <svg v-if="ev.outcome === '0'" class="h-4 w-4 text-green-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <svg v-else class="h-4 w-4 text-red-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span :class="ev.outcome === '0' ? 'text-green-700' : 'text-red-700'">
                  {{ ev.outcome === '0' ? 'Success' : 'Failure' }}
                </span>
              </span>
            </td>
            <td class="px-4 py-3 text-carbon-600">{{ ev.agent }}</td>
            <td class="px-4 py-3">
              <a
                v-if="ev.entityRef"
                class="text-blue-600 hover:underline cursor-pointer"
                @click="goToPatient(ev.entityRef)"
              >{{ ev.entity }}</a>
              <span v-else class="text-carbon-600">{{ ev.entity }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import dayjs from 'dayjs'

const router = useRouter()

const events = ref([])
const search = ref('')
const dateFilter = ref('')
const loading = ref(false)

const filteredEvents = computed(() => {
  let result = events.value
  if (search.value) {
    const s = search.value.toLowerCase()
    result = result.filter(e =>
      (e.agent && e.agent.toLowerCase().includes(s)) ||
      (e.entity && e.entity.toLowerCase().includes(s)) ||
      (e.type && e.type.toLowerCase().includes(s))
    )
  }
  if (dateFilter.value) {
    result = result.filter(e => e.recorded && e.recorded.startsWith(dateFilter.value))
  }
  return result
})

function mapEventType(typeCoding, subtypeCoding, action) {
  if (!typeCoding) return 'Unknown'
  const code = typeCoding.code || ''
  const sub = (subtypeCoding && subtypeCoding.code) || ''
  if (code === '110110') {
    if (sub === 'create' || action === 'C') return 'Patient Create'
    if (sub === 'update' || action === 'U') return 'Patient Update'
    if (sub === 'delete' || action === 'D') return 'Patient Delete'
    if (sub === 'read' || action === 'R') return 'Patient Read'
    return 'Patient Record'
  }
  if (code === '110112') return 'Query'
  if (code === '110100') return 'Authentication'
  if (code === '110106') return 'Export'
  if (code === '110107') return 'Import'
  return typeCoding.display || sub || code || 'Unknown'
}

function typeTagClass(type) {
  const map = {
    'Patient Create': 'bg-green-100 text-green-700',
    'Patient Update': 'bg-blue-100 text-blue-700',
    'Patient Delete': 'bg-red-100 text-red-700',
    'Authentication': 'bg-carbon-100 text-carbon-600',
    'Query': 'bg-teal-100 text-teal-700'
  }
  return map[type] || 'bg-carbon-100 text-carbon-600'
}

async function fetchAuditEvents() {
  loading.value = true
  try {
    let url = '/ocrux/fhir/AuditEvent?_count=200&_sort=-date'
    if (dateFilter.value) url += `&date=ge${dateFilter.value}`
    const res = await axios.get(url)
    const bundle = res.data
    const parsed = []
    if (bundle && bundle.entry) {
      for (const entry of bundle.entry) {
        const ae = entry.resource
        if (!ae) continue
        const typeCoding = ae.type && ae.type.coding ? ae.type.coding[0] : ae.type
        const subtypeCoding = ae.subtype && ae.subtype[0]
        const agentName = ae.agent && ae.agent[0] && ae.agent[0].who &&
          (ae.agent[0].who.display || ae.agent[0].who.reference)
        const entityRef = ae.entity && ae.entity[0] && ae.entity[0].what &&
          ae.entity[0].what.reference
        const entityDisplay = ae.entity && ae.entity[0] && ae.entity[0].what &&
          (ae.entity[0].what.display || ae.entity[0].what.reference)

        parsed.push({
          recorded: ae.recorded || '',
          type: mapEventType(typeCoding, subtypeCoding, ae.action),
          action: ae.action || '',
          outcome: ae.outcome || '',
          agent: agentName || 'System',
          entity: entityDisplay || '',
          entityRef: entityRef || null
        })
      }
    }
    events.value = parsed
  } catch (e) {
    console.error('Failed to fetch audit events', e)
  }
  loading.value = false
}

function goToPatient(ref) {
  if (ref && ref.startsWith('Patient/')) {
    router.push({ name: 'client', params: { clientId: ref.replace('Patient/', '') } })
  }
}

onMounted(fetchAuditEvents)
</script>

<style scoped>
</style>
