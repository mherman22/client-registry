<template>
  <div class="content-area">
    <div class="page-header">
      <h1>{{ $t('menu_home') }}</h1>
      <p>Search and manage patient records across all facilities</p>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-label">Total Patients</div>
        <div class="stat-value">{{ totalPatients }}</div>
      </div>
      <div class="stat-card" style="border-left-color: #da1e28">
        <div class="stat-label">Action Required</div>
        <div class="stat-value">{{ app.totalMatchIssues }}</div>
      </div>
      <div class="stat-card" style="border-left-color: #0043ce">
        <div class="stat-label">Auto-Matches</div>
        <div class="stat-value">{{ app.totalAutoMatches }}</div>
      </div>
    </div>

    <!-- Search & Filter -->
    <div class="search-bar">
      <div class="search-input-wrapper">
        <input
          v-model="searchText"
          class="bx--text-input bx--search-input"
          placeholder="Search by name, identifier, or demographics..."
          @keyup.enter="searchPatients"
        />
      </div>
      <select v-model="selectedPOS" class="bx--select-input" @change="searchPatients">
        <option value="">All Facilities</option>
        <option v-for="client in app.clients" :key="client.id" :value="client.id">
          {{ client.displayName }}
        </option>
      </select>
      <button class="bx--btn bx--btn--primary" @click="searchPatients">Search</button>
    </div>

    <!-- Patient List -->
    <div v-if="loading" class="empty-state">
      <p>Loading patients...</p>
    </div>

    <div v-else-if="patients.length === 0" class="empty-state">
      <h3>No patients found</h3>
      <p>Try adjusting your search criteria or register a new patient</p>
    </div>

    <div v-else>
      <div
        v-for="patient in patients"
        :key="patient.id"
        class="patient-card"
        @click="openPatient(patient.id)"
      >
        <div class="patient-name">{{ patient.name }}</div>
        <div class="patient-meta">
          <span v-if="patient.gender">{{ patient.gender }}</span>
          <span v-if="patient.birthDate">DOB: {{ patient.birthDate }}</span>
          <span v-if="patient.phone">Phone: {{ patient.phone }}</span>
          <span v-if="patient.source" class="patient-source">
            <span class="bx--tag bx--tag--blue">{{ patient.source }}</span>
          </span>
        </div>
        <div class="patient-ids">
          <span
            v-for="(id, idx) in patient.identifiers"
            :key="idx"
            class="bx--tag bx--tag--gray"
          >
            {{ id.label }}: {{ id.value }}
          </span>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <button
          class="bx--btn bx--btn--ghost bx--btn--sm"
          :disabled="!prevPageUrl"
          @click="loadPage(prevPageUrl)"
        >Previous</button>
        <span class="pagination-info">{{ patients.length }} patients shown</span>
        <button
          class="bx--btn bx--btn--ghost bx--btn--sm"
          :disabled="!nextPageUrl"
          @click="loadPage(nextPageUrl)"
        >Next</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const app = useAppStore()

const searchText = ref('')
const selectedPOS = ref('')
const patients = ref([])
const totalPatients = ref(0)
const loading = ref(false)
const nextPageUrl = ref('')
const prevPageUrl = ref('')

function parsePatient(resource, clientTag) {
  const name = resource.name && resource.name[0]
  const given = name && name.given ? name.given.join(' ') : ''
  const family = name && name.family ? name.family : ''
  const fullName = `${given} ${family}`.trim() || 'Unknown'

  const phone = resource.telecom &&
    resource.telecom.find(t => t.system === 'phone')
  const phoneValue = phone ? phone.value : ''

  const identifiers = (resource.identifier || []).map(id => {
    const displName = app.getSystemURIDisplayName(id.system)
    return {
      label: displName ? displName.name : (id.type && id.type.text) || 'ID',
      value: id.value
    }
  })

  const source = clientTag ? app.getClientDisplayName(clientTag) : ''

  return {
    id: resource.id,
    name: fullName,
    gender: resource.gender,
    birthDate: resource.birthDate,
    phone: phoneValue,
    identifiers,
    source
  }
}

async function searchPatients() {
  loading.value = true
  try {
    let url = `/ocrux/fhir/Patient?_count=20`
    if (searchText.value) {
      url += `&name=${encodeURIComponent(searchText.value)}`
    }
    if (selectedPOS.value) {
      url += `&_tag=http://openclientregistry.org/fhir/clientid|${selectedPOS.value}`
    }
    await loadUrl(url)
  } catch (e) {
    console.error('Search failed', e)
  }
  loading.value = false
}

async function loadPage(url) {
  loading.value = true
  await loadUrl(url)
  loading.value = false
}

async function loadUrl(url) {
  const res = await axios.get(url)
  const bundle = res.data
  totalPatients.value = bundle.total || 0
  patients.value = []
  nextPageUrl.value = ''
  prevPageUrl.value = ''

  if (bundle.link) {
    const next = bundle.link.find(l => l.relation === 'next')
    const prev = bundle.link.find(l => l.relation === 'previous')
    if (next) nextPageUrl.value = next.url
    if (prev) prevPageUrl.value = prev.url
  }

  if (bundle.entry) {
    const goldenCode = '5c827da5-4858-4f3d-a50c-62ece001efea'
    for (const entry of bundle.entry) {
      const resource = entry.resource
      if (!resource || resource.resourceType !== 'Patient') continue

      // Skip golden records
      const isGolden = resource.meta && resource.meta.tag &&
        resource.meta.tag.find(t => t.code === goldenCode)
      if (isGolden) continue

      const clientTag = resource.meta && resource.meta.tag &&
        resource.meta.tag.find(t =>
          t.system === 'http://openclientregistry.org/fhir/clientid'
        )

      patients.value.push(parsePatient(resource, clientTag ? clientTag.code : ''))
    }
  }
}

function openPatient(id) {
  router.push({ name: 'client', params: { clientId: id } })
}

onMounted(() => {
  searchPatients()
})
</script>

<style scoped>
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  align-items: flex-end;
}

.search-input-wrapper {
  flex: 1;
}

.bx--search-input {
  height: 40px;
}

.bx--select-input {
  height: 40px;
  min-width: 180px;
  background: white;
  border: 1px solid #8d8d8d;
  padding: 0 2rem 0 1rem;
  font-size: 0.875rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem 0;
}

.pagination-info {
  font-size: 0.875rem;
  color: #525252;
}

.patient-source {
  margin-left: auto;
}
</style>
