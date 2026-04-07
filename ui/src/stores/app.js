import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useAppStore = defineStore('app', () => {
  const clients = ref([])
  const systemURI = ref({})
  const totalMatchIssues = ref(0)
  const totalAutoMatches = ref(0)
  const loading = ref(false)
  const notification = ref({ open: false, kind: 'info', title: '', subtitle: '' })

  async function fetchClients() {
    try {
      const res = await axios.get('/ocrux/config/getClients')
      clients.value = res.data
    } catch (e) {
      console.error('Failed to fetch clients', e)
    }
  }

  async function fetchSystemURI() {
    try {
      const res = await axios.get('/ocrux/config/getURI')
      systemURI.value = res.data
    } catch (e) {
      console.error('Failed to fetch system URIs', e)
    }
  }

  async function fetchMatchCounts() {
    try {
      const [issues, auto] = await Promise.all([
        axios.get('/ocrux/match/count-match-issues'),
        axios.get('/ocrux/match/count-new-auto-matches')
      ])
      totalMatchIssues.value = issues.data || 0
      totalAutoMatches.value = auto.data || 0
    } catch (e) {
      console.error('Failed to fetch match counts', e)
    }
  }

  function getClientDisplayName(clientId) {
    const client = clients.value.find(c => c.id === clientId)
    return client ? client.displayName : clientId
  }

  function getSystemURIDisplayName(uri) {
    if (!uri) return null
    for (const [key, val] of Object.entries(systemURI.value)) {
      if (typeof val === 'object' && val.uri) {
        const uris = Array.isArray(val.uri) ? val.uri : [val.uri]
        if (uris.includes(uri)) {
          return { name: val.displayName, id: key }
        }
      }
    }
    return null
  }

  function showNotification(kind, title, subtitle = '') {
    notification.value = { open: true, kind, title, subtitle }
    setTimeout(() => { notification.value.open = false }, 5000)
  }

  return {
    clients, systemURI, totalMatchIssues, totalAutoMatches, loading, notification,
    fetchClients, fetchSystemURI, fetchMatchCounts, getClientDisplayName, getSystemURIDisplayName,
    showNotification
  }
})
