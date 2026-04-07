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

    <!-- Review Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-xs uppercase text-carbon-500 bg-carbon-50 border-b border-carbon-200">
          <tr>
            <th class="px-4 py-3 text-left font-medium">Patient Name</th>
            <th class="px-4 py-3 text-left font-medium">Source</th>
            <th class="px-4 py-3 text-left font-medium">Reason</th>
            <th class="px-4 py-3 text-left font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading -->
          <tr v-if="loading">
            <td :colspan="4" class="px-4 py-16 text-center">
              <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-carbon-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p class="text-sm text-carbon-400">Loading flagged matches...</p>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="filteredReviews.length === 0">
            <td :colspan="4" class="px-4 py-16 text-center">
              <div class="text-carbon-300 mb-3">
                <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-carbon-500">No action items</h3>
              <p class="text-sm text-carbon-400">All patient matches are resolved</p>
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-for="item in filteredReviews"
            :key="item.uid"
            class="border-b border-carbon-100 hover:bg-carbon-50 cursor-pointer"
            @click="openReview(item)"
          >
            <td class="px-4 py-3 font-medium text-carbon-900">{{ item.given }} {{ item.family }}</td>
            <td class="px-4 py-3">
              <span v-if="item.source" class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{{ getSourceName(item.source) }}</span>
              <span v-else class="text-carbon-400">--</span>
            </td>
            <td class="px-4 py-3">
              <span
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="item.reason === 'conflict' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'"
              >{{ item.reason }}</span>
            </td>
            <td class="px-4 py-3 text-carbon-600">{{ item.date ? dayjs(item.date).format('MMM D, YYYY HH:mm') : '--' }}</td>
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
