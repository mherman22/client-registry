<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-semibold text-carbon-900 mb-1">CSV Reports</h1>
      <p class="text-sm text-carbon-500">View and download uploaded CSV patient data reports</p>
    </div>

    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="text-xs uppercase text-carbon-500 bg-carbon-50 border-b border-carbon-200">
          <tr>
            <th class="px-4 py-3 text-left font-medium">Report Name</th>
            <th class="px-4 py-3 text-left font-medium">Date</th>
            <th class="px-4 py-3 text-left font-medium">Records</th>
            <th class="px-4 py-3 text-left font-medium">Status</th>
            <th class="px-4 py-3 text-left font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          <!-- Loading State -->
          <tr v-if="loading">
            <td :colspan="5" class="px-4 py-16 text-center">
              <svg class="animate-spin h-8 w-8 mx-auto mb-3 text-carbon-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <p class="text-sm text-carbon-400">Loading reports...</p>
            </td>
          </tr>

          <!-- Empty State -->
          <tr v-else-if="reports.length === 0">
            <td :colspan="5" class="px-4 py-16 text-center">
              <div class="text-carbon-300 mb-3">
                <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 class="text-lg font-medium text-carbon-500">No CSV reports available</h3>
              <p class="text-sm text-carbon-400 mt-1">Upload a CSV file to see reports here</p>
            </td>
          </tr>

          <!-- Data Rows -->
          <tr
            v-for="(report, idx) in reports"
            :key="report.id || idx"
            class="border-b border-carbon-100 hover:bg-carbon-50"
          >
            <td class="px-4 py-3 font-medium text-carbon-900">{{ report.name || report.id }}</td>
            <td class="px-4 py-3 text-carbon-600">{{ report.date || '--' }}</td>
            <td class="px-4 py-3 text-carbon-600">{{ report.records || '--' }}</td>
            <td class="px-4 py-3">
              <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                {{ report.status || 'Complete' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <button class="text-blue-600 text-sm hover:underline" @click="viewReport(report.id)">View</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="selectedReport" class="mt-6 bg-white border border-carbon-100 p-5">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-carbon-900">Report Detail</h2>
        <button class="text-sm text-carbon-500 hover:text-carbon-700" @click="selectedReport = null">Close</button>
      </div>
      <pre class="text-xs bg-carbon-50 p-4 overflow-x-auto border border-carbon-100 max-h-96">{{ JSON.stringify(selectedReport, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const reports = ref([])
const loading = ref(false)
const selectedReport = ref(null)

async function fetchReports() {
  loading.value = true
  try {
    const res = await axios.get('/ocrux/csv/getCSVUpload')
    reports.value = Array.isArray(res.data) ? res.data : []
  } catch (e) {
    console.warn('Failed to fetch CSV reports:', e.message)
    reports.value = []
  }
  loading.value = false
}

async function viewReport(id) {
  try {
    const res = await axios.get(`/ocrux/csv/getCSVReport/${id}`)
    selectedReport.value = res.data
  } catch (e) {
    console.warn('Failed to fetch report:', e.message)
  }
}

onMounted(fetchReports)
</script>

<style scoped>
</style>
