<template>
  <div class="content-area">
    <div class="page-header">
      <h1>Auto-Matches</h1>
      <p>{{ filteredMatches.length }} automatically matched patient pairs</p>
    </div>

    <div class="search-bar">
      <input
        v-model="search"
        class="bx--text-input bx--search-input"
        placeholder="Search by name, ID, or reason..."
      />
    </div>

    <div v-if="loading" class="empty-state"><p>Loading auto-matches...</p></div>

    <div v-else-if="filteredMatches.length === 0" class="empty-state">
      <h3>No auto-matches</h3>
      <p>No new automatically matched records found</p>
    </div>

    <div v-else>
      <div
        v-for="item in filteredMatches"
        :key="item.uid"
        class="patient-card"
        @click="openMatch(item)"
      >
        <div class="patient-name">{{ item.given }} {{ item.family }}</div>
        <div class="patient-meta">
          <span v-if="item.source">
            <span class="bx--tag bx--tag--blue">{{ getSourceName(item.source) }}</span>
          </span>
          <span v-if="item.source_id">ID: {{ item.source_id }}</span>
          <span v-if="item.date">Matched: {{ dayjs(item.date).format('MMM D, YYYY HH:mm') }}</span>
        </div>
        <div class="patient-ids">
          <span class="bx--tag bx--tag--teal">{{ item.reason }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import dayjs from 'dayjs'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const app = useAppStore()

const matches = ref([])
const search = ref('')
const loading = ref(false)

const filteredMatches = computed(() => {
  if (!search.value) return matches.value
  const s = search.value.toLowerCase()
  return matches.value.filter(m =>
    (m.family && m.family.toLowerCase().includes(s)) ||
    (m.given && m.given.toLowerCase().includes(s)) ||
    (m.uid && m.uid.toLowerCase().includes(s)) ||
    (m.reason && m.reason.toLowerCase().includes(s)) ||
    (m.source_id && m.source_id.toLowerCase().includes(s))
  )
})

function getSourceName(source) {
  return app.getClientDisplayName(source)
}

function openMatch(item) {
  router.push({ name: 'client', params: { clientId: item.uid } })
}

async function fetchAutoMatches() {
  loading.value = true
  try {
    const res = await axios.get('/ocrux/match/get-new-auto-matches')
    matches.value = res.data || []
  } catch (e) {
    console.error('Failed to fetch auto-matches', e)
  }
  loading.value = false
}

onMounted(fetchAutoMatches)
</script>

<style scoped>
.search-bar {
  margin-bottom: 1.5rem;
}
.bx--search-input {
  height: 40px;
  width: 100%;
  max-width: 400px;
}
</style>
