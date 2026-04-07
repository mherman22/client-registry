<template>
  <div class="content-area">
    <div class="page-header">
      <h1>Action Required</h1>
      <p>{{ filteredReviews.length }} flagged matches need review</p>
    </div>

    <div class="search-bar">
      <input
        v-model="search"
        class="bx--text-input bx--search-input"
        placeholder="Search by name, ID, or reason..."
      />
    </div>

    <div v-if="loading" class="empty-state"><p>Loading flagged matches...</p></div>

    <div v-else-if="filteredReviews.length === 0" class="empty-state">
      <h3>No action items</h3>
      <p>All patient matches are resolved</p>
    </div>

    <div v-else>
      <div
        v-for="item in filteredReviews"
        :key="item.uid"
        class="patient-card"
        @click="openReview(item)"
      >
        <div class="patient-name">{{ item.given }} {{ item.family }}</div>
        <div class="patient-meta">
          <span v-if="item.source">
            <span class="bx--tag bx--tag--blue">{{ getSourceName(item.source) }}</span>
          </span>
          <span v-if="item.source_id">ID: {{ item.source_id }}</span>
          <span v-if="item.date">Flagged: {{ dayjs(item.date).format('MMM D, YYYY HH:mm') }}</span>
        </div>
        <div class="patient-ids">
          <span class="bx--tag" :class="item.reason === 'conflict' ? 'bx--tag--red' : 'bx--tag--warm-gray'">
            {{ item.reason }}
          </span>
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

const reviews = ref([])
const search = ref('')
const loading = ref(false)

const filteredReviews = computed(() => {
  if (!search.value) return reviews.value
  const s = search.value.toLowerCase()
  return reviews.value.filter(r =>
    (r.family && r.family.toLowerCase().includes(s)) ||
    (r.given && r.given.toLowerCase().includes(s)) ||
    (r.uid && r.uid.toLowerCase().includes(s)) ||
    (r.reason && r.reason.toLowerCase().includes(s)) ||
    (r.source_id && r.source_id.toLowerCase().includes(s))
  )
})

function getSourceName(source) {
  return app.getClientDisplayName(source)
}

function openReview(item) {
  router.push({ name: 'client', params: { clientId: item.uid } })
}

async function fetchReviews() {
  loading.value = true
  try {
    const res = await axios.get('/ocrux/match/get-match-issues')
    reviews.value = res.data || []
  } catch (e) {
    console.error('Failed to fetch match issues', e)
  }
  loading.value = false
}

onMounted(fetchReviews)
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
