<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-carbon-900 mb-1">{{ $t('menu_home') }}</h1>
      <p class="text-sm text-carbon-500">Search and manage patient records across all facilities</p>
    </div>

    <!-- Stats Row -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div class="bg-white border-l-4 border-blue-500 p-4">
        <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Total Patients</div>
        <div class="text-2xl font-semibold text-carbon-900">{{ totalPatients }}</div>
      </div>
      <div class="bg-white border-l-4 border-red-600 p-4">
        <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Action Required</div>
        <div class="text-2xl font-semibold text-carbon-900">{{ app.totalMatchIssues }}</div>
      </div>
      <div class="bg-white border-l-4 border-blue-700 p-4">
        <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Auto-Matches</div>
        <div class="text-2xl font-semibold text-carbon-900">{{ app.totalAutoMatches }}</div>
      </div>
    </div>

    <!-- Search Filters -->
    <div class="bg-white border border-carbon-100 p-5 mb-6">
      <h2 class="text-sm font-semibold text-carbon-700 uppercase tracking-wide mb-4">Search Patients</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <label class="block text-xs font-medium text-carbon-600 mb-1.5">Given Name</label>
          <input
            v-model="givenName"
            class="w-full h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            placeholder="e.g. Jean"
            @keyup.enter="searchPatients"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-carbon-600 mb-1.5">Surname</label>
          <input
            v-model="familyName"
            class="w-full h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            placeholder="e.g. Baptiste"
            @keyup.enter="searchPatients"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-carbon-600 mb-1.5">Gender</label>
          <select
            v-model="gender"
            class="w-full h-10 px-3 text-sm border border-carbon-300 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="">Any</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-carbon-600 mb-1.5">Identifier / CRUID</label>
          <input
            v-model="identifier"
            class="w-full h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
            placeholder="e.g. 07D6MD or golden record ID"
            @keyup.enter="searchPatients"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-carbon-600 mb-1.5">Point of Service</label>
          <select
            v-model="selectedPOS"
            class="w-full h-10 px-3 text-sm border border-carbon-300 bg-white outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          >
            <option value="">All Facilities</option>
            <option v-for="client in app.clients" :key="client.id" :value="client.id">
              {{ client.displayName }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-carbon-600 mb-1.5">Date of Birth</label>
          <input
            v-model="birthDate"
            type="date"
            class="w-full h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
          />
        </div>
      </div>
      <div class="flex gap-3">
        <button
          class="h-10 px-6 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          @click="searchPatients"
        >Search</button>
        <button
          class="h-10 px-4 border border-carbon-300 text-carbon-700 text-sm hover:bg-carbon-50"
          @click="clearSearch"
        >Clear</button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-16 text-carbon-400">
      <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-carbon-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <p class="text-sm">Loading patients...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="patients.length === 0" class="bg-white border border-carbon-100 text-center py-16">
      <div class="text-carbon-300 mb-3">
        <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-carbon-500">No patients found</h3>
      <p class="text-sm text-carbon-400 mt-1">Try adjusting your search criteria or register a new patient</p>
    </div>

    <!-- Patient List -->
    <div v-else>
      <div
        v-for="patient in patients"
        :key="patient.id"
        class="bg-white border border-carbon-100 p-4 mb-3 hover:shadow-sm transition cursor-pointer"
        @click="openPatient(patient.id)"
      >
        <div class="font-semibold text-carbon-900 mb-1">{{ patient.name }}</div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-carbon-500 mb-2">
          <span v-if="patient.gender">{{ patient.gender }}</span>
          <span v-if="patient.birthDate">DOB: {{ patient.birthDate }}</span>
          <span v-if="patient.phone">Phone: {{ patient.phone }}</span>
          <span v-if="patient.source" class="ml-auto">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{{ patient.source }}</span>
          </span>
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="(id, idx) in patient.identifiers"
            :key="idx"
            class="text-xs font-medium px-2 py-0.5 rounded-full bg-carbon-100 text-carbon-600"
          >
            {{ id.label }}: {{ id.value }}
          </span>
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-center gap-4 py-6">
        <button
          class="h-10 px-4 border border-carbon-300 text-carbon-700 text-sm hover:bg-carbon-50 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!prevPageUrl"
          @click="loadPage(prevPageUrl)"
        >Previous</button>
        <span class="text-sm text-carbon-500">{{ patients.length }} patients shown</span>
        <button
          class="h-10 px-4 border border-carbon-300 text-carbon-700 text-sm hover:bg-carbon-50 disabled:opacity-40 disabled:cursor-not-allowed"
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

const givenName = ref('')
const familyName = ref('')
const gender = ref('')
const identifier = ref('')
const selectedPOS = ref('')
const birthDate = ref('')
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
    if (givenName.value) url += `&given=${encodeURIComponent(givenName.value)}`
    if (familyName.value) url += `&family=${encodeURIComponent(familyName.value)}`
    if (gender.value) url += `&gender=${gender.value}`
    if (identifier.value) url += `&identifier=${encodeURIComponent(identifier.value)}`
    if (birthDate.value) url += `&birthdate=${birthDate.value}`
    if (selectedPOS.value) {
      url += `&_tag=http://openclientregistry.org/fhir/clientid|${selectedPOS.value}`
    }
    await loadUrl(url)
  } catch (e) {
    console.error('Search failed', e)
  }
  loading.value = false
}

function clearSearch() {
  givenName.value = ''
  familyName.value = ''
  gender.value = ''
  identifier.value = ''
  selectedPOS.value = ''
  birthDate.value = ''
  searchPatients()
}

async function loadPage(url) {
  loading.value = true
  await loadUrl(url)
  loading.value = false
}

async function loadUrl(url) {
  const res = await axios.get(url)
  const bundle = res.data
  if (!bundle || typeof bundle !== 'object' || !bundle.resourceType) {
    console.warn('Unexpected API response:', bundle)
    totalPatients.value = 0
    patients.value = []
    return
  }
  totalPatients.value = typeof bundle.total === 'number' ? bundle.total : 0
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
</style>
