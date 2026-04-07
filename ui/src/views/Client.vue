<template>
  <div class="content-area">
    <nav class="bx--breadcrumb" style="margin-bottom: 1.5rem">
      <div class="bx--breadcrumb-item"><router-link to="/" class="bx--link">Home</router-link></div>
      <div class="bx--breadcrumb-item"><span class="bx--link">Patient</span></div>
      <div class="bx--breadcrumb-item">{{ patientName || 'Details' }}</div>
    </nav>

    <div class="page-header">
      <h1>{{ patientName }}</h1>
      <p>Patient record detail and linked matches</p>
    </div>

    <div v-if="loading" class="empty-state"><p>Loading patient...</p></div>

    <template v-else-if="patient">
      <!-- Demographics -->
      <div class="detail-section">
        <h3>Demographics</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <div class="detail-label">Full Name</div>
            <div class="detail-value">{{ patientName }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Gender</div>
            <div class="detail-value">{{ patient.gender || '--' }}</div>
          </div>
          <div class="detail-item">
            <div class="detail-label">Date of Birth</div>
            <div class="detail-value">{{ patient.birthDate ? dayjs(patient.birthDate).format('MMM D, YYYY') : '--' }}</div>
          </div>
          <div class="detail-item" v-if="address">
            <div class="detail-label">Address</div>
            <div class="detail-value">{{ address }}</div>
          </div>
          <div class="detail-item" v-if="phone">
            <div class="detail-label">Phone</div>
            <div class="detail-value">{{ phone }}</div>
          </div>
        </div>
      </div>

      <!-- Identifiers -->
      <div class="detail-section">
        <h3>Identifiers</h3>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
          <span v-for="(id, idx) in identifiers" :key="idx" class="bx--tag bx--tag--blue">
            {{ id.label }}: {{ id.value }}
          </span>
          <span v-if="identifiers.length === 0" style="color: #525252">No identifiers</span>
        </div>
      </div>

      <!-- Match Status Tags -->
      <div class="detail-section" v-if="statusTags.length">
        <h3>Match Status</h3>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap">
          <span v-for="(tag, idx) in statusTags" :key="idx" class="bx--tag bx--tag--green">
            {{ tag.display || tag.code }}
          </span>
        </div>
      </div>

      <!-- Linked Patients -->
      <div class="detail-section">
        <h3>Linked Patients ({{ linkedPatients.length }})</h3>
        <div v-if="linkedPatients.length === 0" class="empty-state" style="padding: 2rem">
          <p>No linked patients found</p>
        </div>
        <div v-for="lp in linkedPatients" :key="lp.id" class="patient-card" @click="goToPatient(lp.id)">
          <div class="patient-name">{{ lp.name }}</div>
          <div class="patient-meta">
            <span v-if="lp.gender">{{ lp.gender }}</span>
            <span v-if="lp.birthDate">DOB: {{ lp.birthDate }}</span>
            <span v-if="lp.source" class="bx--tag bx--tag--blue">{{ lp.source }}</span>
          </div>
          <div class="patient-ids" v-if="lp.identifiers.length">
            <span v-for="(id, idx) in lp.identifiers" :key="idx" class="bx--tag bx--tag--gray">
              {{ id.label }}: {{ id.value }}
            </span>
          </div>
        </div>
      </div>

      <!-- Break Match -->
      <div class="detail-section">
        <h3>Actions</h3>
        <button class="bx--btn bx--btn--danger" :disabled="linkedPatients.length < 2 || breaking" @click="breakMatch">
          {{ breaking ? 'Breaking...' : 'Break Match' }}
        </button>
      </div>
    </template>

    <div v-else class="empty-state">
      <h3>Patient not found</h3>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import dayjs from 'dayjs'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const app = useAppStore()
const auth = useAuthStore()

const patient = ref(null)
const linkedPatients = ref([])
const loading = ref(false)
const breaking = ref(false)

const patientName = computed(() => {
  if (!patient.value || !patient.value.name) return 'Unknown'
  const n = patient.value.name[0]
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

const identifiers = computed(() => {
  if (!patient.value || !patient.value.identifier) return []
  return patient.value.identifier.map(id => {
    const dn = app.getSystemURIDisplayName(id.system)
    return { label: dn ? dn.name : (id.type && id.type.text) || 'ID', value: id.value }
  })
})

const statusTags = computed(() => {
  if (!patient.value || !patient.value.meta || !patient.value.meta.tag) return []
  return patient.value.meta.tag.filter(t => t.system !== 'http://openclientregistry.org/fhir/clientid')
})

function parseName(resource) {
  if (!resource.name || !resource.name[0]) return 'Unknown'
  const n = resource.name[0]
  const given = n.given ? n.given.join(' ') : ''
  return `${given} ${n.family || ''}`.trim() || 'Unknown'
}

function parseLinked(resource) {
  const clientTag = resource.meta && resource.meta.tag &&
    resource.meta.tag.find(t => t.system === 'http://openclientregistry.org/fhir/clientid')
  const ids = (resource.identifier || []).map(id => {
    const dn = app.getSystemURIDisplayName(id.system)
    return { label: dn ? dn.name : (id.type && id.type.text) || 'ID', value: id.value }
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
  try {
    const res = await axios.get(`/ocrux/fhir/Patient/${route.params.clientId}?_include=Patient:link`)
    const bundle = res.data
    if (!bundle.entry || bundle.entry.length === 0) { loading.value = false; return }

    const goldenCode = '5c827da5-4858-4f3d-a50c-62ece001efea'
    const linked = []
    for (const entry of bundle.entry) {
      const r = entry.resource
      if (r.id === route.params.clientId) {
        patient.value = r
      } else {
        const isGolden = r.meta && r.meta.tag && r.meta.tag.find(t => t.code === goldenCode)
        if (!isGolden) linked.push(parseLinked(r))
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

onMounted(fetchPatient)
</script>

<style scoped>
.bx--breadcrumb {
  display: flex;
  gap: 0.5rem;
  font-size: 0.875rem;
}
.bx--breadcrumb-item + .bx--breadcrumb-item::before {
  content: '/';
  margin-right: 0.5rem;
  color: #8d8d8d;
}
.bx--link {
  color: #0f62fe;
  text-decoration: none;
}
</style>
