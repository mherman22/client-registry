<template>
  <div class="content-area">
    <div class="page-header">
      <h1>Audit Log</h1>
      <p>Full audit trail of patient record changes and user actions</p>
    </div>

    <div class="filter-row">
      <input v-model="search" class="bx--text-input bx--search-input" placeholder="Search events..." />
      <input v-model="dateFilter" type="date" class="bx--text-input date-input" />
      <button class="bx--btn bx--btn--secondary bx--btn--sm" @click="fetchAuditEvents">Refresh</button>
    </div>

    <div v-if="loading" class="empty-state"><p>Loading audit events...</p></div>

    <div v-else-if="filteredEvents.length === 0" class="empty-state">
      <h3>No audit events found</h3>
    </div>

    <div v-else class="data-table-container">
      <table class="bx--data-table bx--data-table-v2">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Type</th>
            <th>Action</th>
            <th>Outcome</th>
            <th>Agent</th>
            <th>Entity</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(ev, idx) in filteredEvents" :key="idx">
            <td>{{ dayjs(ev.recorded).format('YYYY-MM-DD HH:mm:ss') }}</td>
            <td>
              <span class="bx--tag" :class="typeTagClass(ev.type)">{{ ev.type }}</span>
            </td>
            <td>{{ ev.action }}</td>
            <td>
              <span :style="{ color: ev.outcome === '0' ? '#198038' : '#da1e28' }">
                {{ ev.outcome === '0' ? 'Success' : 'Failure' }}
              </span>
            </td>
            <td>{{ ev.agent }}</td>
            <td>
              <a v-if="ev.entityRef" class="bx--link" style="cursor:pointer" @click="goToPatient(ev.entityRef)">
                {{ ev.entity }}
              </a>
              <span v-else>{{ ev.entity }}</span>
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
    'Patient Create': 'bx--tag--green',
    'Patient Update': 'bx--tag--blue',
    'Patient Delete': 'bx--tag--red',
    'Authentication': 'bx--tag--gray',
    'Query': 'bx--tag--teal'
  }
  return map[type] || 'bx--tag--warm-gray'
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
.filter-row {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: flex-end;
}
.bx--search-input {
  height: 40px;
  flex: 1;
  max-width: 300px;
}
.date-input {
  height: 40px;
  max-width: 180px;
}
.bx--data-table {
  width: 100%;
  border-collapse: collapse;
}
.bx--data-table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #525252;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #f4f4f4;
}
.bx--data-table td {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #e0e0e0;
}
.bx--data-table tbody tr:hover {
  background: #e8e8e8;
}
</style>
