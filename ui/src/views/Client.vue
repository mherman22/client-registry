<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="flex items-center gap-2 text-sm text-carbon-500 mb-6">
      <router-link to="/" class="text-blue-600 hover:underline">Home</router-link>
      <span class="text-carbon-300">/</span>
      <span>Patient</span>
      <span class="text-carbon-300">/</span>
      <span class="text-carbon-700">{{ patientName || 'Details' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-carbon-400">
      <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-carbon-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <p class="text-sm">Loading patient...</p>
    </div>

    <template v-else-if="patient">
      <!-- Page Header -->
      <div class="flex items-start justify-between mb-6">
        <div>
          <h1 class="text-2xl font-semibold text-carbon-900 mb-1">{{ patientName }}</h1>
          <div class="flex items-center gap-3 text-sm text-carbon-500">
            <span v-if="source" class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{{ source }}</span>
            <span v-if="patient.gender">{{ patient.gender }}</span>
            <span v-if="patient.birthDate">DOB: {{ patient.birthDate }}</span>
          </div>
        </div>
      </div>

      <!-- Submitting System + Golden Record -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div class="bg-white border border-carbon-100 p-5">
          <div class="text-xs text-carbon-500 uppercase tracking-wide mb-2">Submitting System</div>
          <div class="text-sm font-semibold text-carbon-900">{{ source || '--' }}</div>
        </div>
        <div class="bg-white border border-carbon-100 p-5">
          <div class="text-xs text-carbon-500 uppercase tracking-wide mb-2">Golden Record (CRUID)</div>
          <div class="text-sm font-mono text-carbon-700">{{ goldenRecord ? goldenRecord.id : '--' }}</div>
        </div>
      </div>

      <!-- Demographics — config-driven fields -->
      <div class="bg-white border border-carbon-100 p-5 mb-5">
        <h2 class="text-lg font-semibold text-carbon-900 mb-4">Demographics</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
          <div>
            <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Full Name</div>
            <div class="text-sm font-medium text-carbon-900">{{ patientName }}</div>
          </div>
          <div>
            <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Gender</div>
            <div class="text-sm font-medium text-carbon-900">{{ patient.gender || '--' }}</div>
          </div>
          <div>
            <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Date of Birth</div>
            <div class="text-sm font-medium text-carbon-900">{{ patient.birthDate || '--' }}</div>
          </div>
          <div v-if="address">
            <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Address</div>
            <div class="text-sm font-medium text-carbon-900">{{ address }}</div>
          </div>
          <div v-if="phone">
            <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Phone</div>
            <div class="text-sm font-medium text-carbon-900">{{ phone }}</div>
          </div>
          <div v-if="patient.multipleBirthBoolean || patient.multipleBirthInteger">
            <div class="text-xs text-carbon-500 uppercase tracking-wide mb-1">Multiple Birth</div>
            <div class="text-sm font-medium text-carbon-900">
              <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                {{ patient.multipleBirthInteger ? 'Birth order: ' + patient.multipleBirthInteger : 'Yes' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Identifiers — rendered from config systems -->
      <div class="bg-white border border-carbon-100 p-5 mb-5">
        <h2 class="text-lg font-semibold text-carbon-900 mb-4">Identifiers</h2>
        <div v-if="identifiers.length" class="divide-y divide-carbon-50">
          <div v-for="(id, idx) in identifiers" :key="idx" class="flex items-center justify-between py-2.5">
            <div class="text-xs text-carbon-500 uppercase tracking-wide">{{ id.label }}</div>
            <div class="text-sm font-medium font-mono text-carbon-900">{{ id.value }}</div>
          </div>
        </div>
        <div v-else class="text-sm text-carbon-400">No identifiers</div>
      </div>

      <!-- Match Status Tags -->
      <div v-if="statusTags.length" class="bg-white border border-carbon-100 p-5 mb-5">
        <h2 class="text-lg font-semibold text-carbon-900 mb-4">Match Status</h2>
        <div class="flex gap-2 flex-wrap">
          <span
            v-for="(tag, idx) in statusTags"
            :key="idx"
            :class="tagClass(tag)"
            class="text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {{ tag.display || tag.code }}
          </span>
        </div>
      </div>

      <!-- Matched Records -->
      <div class="bg-white border border-carbon-100 p-5 mb-5">
        <h2 class="text-lg font-semibold text-carbon-900 mb-4">
          Matched Records
          <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-carbon-100 text-carbon-600 ml-2">{{ linkedPatients.length }}</span>
        </h2>

        <div v-if="linkedPatients.length === 0" class="text-center py-8">
          <div class="text-carbon-300 mb-2">
            <svg class="h-10 w-10 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.702a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
            </svg>
          </div>
          <h3 class="text-sm font-medium text-carbon-500">No matched records found</h3>
        </div>

        <div v-else class="divide-y divide-carbon-50">
          <div
            v-for="lp in linkedPatients"
            :key="lp.id"
            class="py-4 hover:bg-carbon-25 transition cursor-pointer -mx-5 px-5"
            @click="goToPatient(lp.id)"
          >
            <div class="flex items-start justify-between mb-2">
              <div>
                <div class="font-semibold text-carbon-900">{{ lp.name }}</div>
                <div class="flex items-center gap-3 text-sm text-carbon-500 mt-0.5">
                  <span v-if="lp.gender">{{ lp.gender }}</span>
                  <span v-if="lp.birthDate">DOB: {{ lp.birthDate }}</span>
                </div>
              </div>
              <span v-if="lp.source" class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">{{ lp.source }}</span>
            </div>
            <div v-if="lp.identifiers.length" class="flex flex-wrap gap-1.5 mt-1">
              <span
                v-for="(id, idx) in lp.identifiers"
                :key="idx"
                class="text-xs font-medium px-2 py-0.5 rounded-full bg-carbon-100 text-carbon-600"
              >
                {{ id.label }}: {{ id.value }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="bg-white border border-carbon-100 p-5 mb-5">
        <h2 class="text-lg font-semibold text-carbon-900 mb-4">Actions</h2>
        <button
          class="h-10 px-4 bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="linkedPatients.length < 2 || breaking"
          @click="breakMatch"
        >
          {{ breaking ? 'Breaking...' : 'Break Match' }}
        </button>
      </div>
    </template>

    <!-- Not Found -->
    <div v-else class="text-center py-16">
      <div class="text-carbon-300 mb-3">
        <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-carbon-500">Patient not found</h3>
      <p class="text-sm text-carbon-400">The requested patient record could not be loaded</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const app = useAppStore()
const auth = useAuthStore()

const patient = ref(null)
const goldenRecord = ref(null)
const linkedPatients = ref([])
const loading = ref(false)
const breaking = ref(false)

const patientName = computed(() => {
  if (!patient.value || !patient.value.name) return 'Unknown'
  const n = patient.value.name.find(n => n.use === 'official') || patient.value.name[0]
  const given = n.given ? n.given.join(' ') : ''
  return `${given} ${n.family || ''}`.trim() || 'Unknown'
})

const address = computed(() => {
  if (!patient.value || !patient.value.address || !patient.value.address[0]) return ''
  const a = patient.value.address[0]
  return [a.line && a.line.join(', '), a.city, a.state, a.country].filter(Boolean).join(', ')
})

const phone = computed(() => {
  if (!patient.value || !patient.value.telecom) return ''
  const t = patient.value.telecom.find(t => t.system === 'phone')
  return t ? t.value : ''
})

const source = computed(() => {
  if (!patient.value || !patient.value.meta || !patient.value.meta.tag) return ''
  const clientTag = patient.value.meta.tag.find(t => t.system === 'http://openclientregistry.org/fhir/clientid')
  return clientTag ? app.getClientDisplayName(clientTag.code) || clientTag.code : ''
})

const identifiers = computed(() => {
  if (!patient.value || !patient.value.identifier) return []
  return patient.value.identifier.map(id => {
    const dn = app.getSystemURIDisplayName(id.system)
    return {
      label: dn ? dn.name : (id.type && id.type.text) || id.system || 'ID',
      value: id.value
    }
  })
})

const statusTags = computed(() => {
  if (!patient.value || !patient.value.meta || !patient.value.meta.tag) return []
  return patient.value.meta.tag.filter(t => t.system !== 'http://openclientregistry.org/fhir/clientid')
})

function tagClass(tag) {
  if (tag.code === 'autoMatches') return 'bg-green-100 text-green-700'
  if (tag.code === 'potentialMatches') return 'bg-yellow-100 text-yellow-800'
  if (tag.code === 'conflictMatches') return 'bg-red-100 text-red-700'
  return 'bg-carbon-100 text-carbon-600'
}

function parseName(resource) {
  if (!resource.name || !resource.name[0]) return 'Unknown'
  const n = resource.name.find(n => n.use === 'official') || resource.name[0]
  const given = n.given ? n.given.join(' ') : ''
  return `${given} ${n.family || ''}`.trim() || 'Unknown'
}

function parseLinked(resource) {
  const clientTag = resource.meta && resource.meta.tag &&
    resource.meta.tag.find(t => t.system === 'http://openclientregistry.org/fhir/clientid')
  const ids = (resource.identifier || []).map(id => {
    const dn = app.getSystemURIDisplayName(id.system)
    return { label: dn ? dn.name : (id.type && id.type.text) || id.system || 'ID', value: id.value }
  })
  return {
    id: resource.id,
    name: parseName(resource),
    gender: resource.gender,
    birthDate: resource.birthDate,
    source: clientTag ? app.getClientDisplayName(clientTag.code) : '',
    identifiers: ids
  }
}

async function fetchPatient() {
  loading.value = true
  patient.value = null
  goldenRecord.value = null
  linkedPatients.value = []
  try {
    const res = await axios.get(`/ocrux/fhir/Patient?_id=${route.params.clientId}&_include=Patient:link`)
    const bundle = res.data
    if (!bundle.entry || bundle.entry.length === 0) { loading.value = false; return }

    const goldenCode = '5c827da5-4858-4f3d-a50c-62ece001efea'
    const linked = []
    for (const entry of bundle.entry) {
      const r = entry.resource
      const isGolden = r.meta && r.meta.tag && r.meta.tag.find(t => t.code === goldenCode)
      if (r.id === route.params.clientId) {
        patient.value = r
      } else if (isGolden) {
        goldenRecord.value = r
      } else {
        linked.push(parseLinked(r))
      }
    }
    linkedPatients.value = linked
  } catch (e) {
    console.error('Failed to load patient', e)
  }
  loading.value = false
}

async function breakMatch() {
  if (linkedPatients.value.length < 2) return
  breaking.value = true
  try {
    const ids = linkedPatients.value.map(lp => 'Patient/' + lp.id)
    await axios.post(`/ocrux/match/break-match?username=${auth.username}`, ids)
    app.showNotification('success', 'Match broken successfully')
    await fetchPatient()
    app.fetchMatchCounts()
  } catch (e) {
    app.showNotification('error', 'Failed to break match', e.message)
  }
  breaking.value = false
}

function goToPatient(id) {
  router.push({ name: 'client', params: { clientId: id } })
}

// Re-fetch when navigating between patients
watch(() => route.params.clientId, (newId, oldId) => {
  if (newId && newId !== oldId) fetchPatient()
})

onMounted(fetchPatient)
</script>
