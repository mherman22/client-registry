<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-1">
        <h1 class="text-2xl font-semibold text-carbon-900">Action Required</h1>
        <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-red-100 text-red-700">{{ filteredReviews.length }}</span>
      </div>
      <p class="text-sm text-carbon-500">Flagged matches that need manual review</p>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <input
        v-model="search"
        class="w-full max-w-md h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
        placeholder="Search by name, ID, or reason..."
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center py-16 text-carbon-400">
      <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-carbon-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
      </svg>
      <p class="text-sm">Loading flagged matches...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredReviews.length === 0" class="text-center py-16">
      <div class="text-carbon-300 mb-3">
        <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-carbon-500">No action items</h3>
      <p class="text-sm text-carbon-400">All patient matches are resolved</p>
    </div>

    <!-- Review List -->
    <div v-else>
      <div
        v-for="item in filteredReviews"
        :key="item.uid"
        class="bg-white border border-carbon-100 p-4 mb-3 hover:shadow-sm transition cursor-pointer"
        @click="openReview(item)"
      >
        <div class="flex items-start justify-between mb-1">
          <div class="font-semibold text-carbon-900">{{ item.given }} {{ item.family }}</div>
          <span
            class="text-xs font-medium px-2 py-0.5 rounded-full"
            :class="item.reason === 'conflict' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'"
          >
            {{ item.reason }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-carbon-500">
          <span v-if="item.source">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{{ getSourceName(item.source) }}</span>
          </span>
          <span v-if="item.source_id">ID: {{ item.source_id }}</span>
          <span v-if="item.date">Flagged: {{ dayjs(item.date).format('MMM D, YYYY HH:mm') }}</span>
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
</style>
