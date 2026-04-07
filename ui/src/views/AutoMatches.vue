<template>
  <div>
    <!-- Page Header -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-1">
        <h1 class="text-2xl font-semibold text-carbon-900">Auto-Matches</h1>
        <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">{{ filteredMatches.length }}</span>
      </div>
      <p class="text-sm text-carbon-500">Automatically matched patient pairs</p>
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
      <p class="text-sm">Loading auto-matches...</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredMatches.length === 0" class="text-center py-16">
      <div class="text-carbon-300 mb-3">
        <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.702a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.34 8.374" />
        </svg>
      </div>
      <h3 class="text-lg font-medium text-carbon-500">No auto-matches</h3>
      <p class="text-sm text-carbon-400">No new automatically matched records found</p>
    </div>

    <!-- Match List -->
    <div v-else>
      <div
        v-for="item in filteredMatches"
        :key="item.uid"
        class="bg-white border border-carbon-100 p-4 mb-3 hover:shadow-sm transition cursor-pointer"
        @click="openMatch(item)"
      >
        <div class="flex items-start justify-between mb-1">
          <div class="font-semibold text-carbon-900">{{ item.given }} {{ item.family }}</div>
          <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">{{ item.reason }}</span>
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-carbon-500">
          <span v-if="item.source">
            <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{{ getSourceName(item.source) }}</span>
          </span>
          <span v-if="item.source_id">ID: {{ item.source_id }}</span>
          <span v-if="item.date">Matched: {{ dayjs(item.date).format('MMM D, YYYY HH:mm') }}</span>
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
</style>
