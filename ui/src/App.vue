<template>
  <div id="app" class="min-h-screen bg-carbon-50 font-sans">
    <!-- Header -->
    <header v-if="auth.isAuthenticated" class="fixed top-0 left-0 right-0 h-12 bg-carbon-900 flex items-center z-50 border-b border-carbon-700">
      <router-link to="/" class="text-white text-sm font-semibold px-4 h-full flex items-center hover:bg-carbon-800 no-underline">
        <span class="font-light mr-1">Open</span>Client Registry
      </router-link>

      <nav class="flex h-full flex-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="text-carbon-200 text-sm px-4 h-full flex items-center hover:bg-carbon-800 hover:text-white no-underline transition-colors"
          active-class="!text-white border-b-[3px] border-blue-500"
          :exact="item.exact"
        >
          {{ item.label }}
          <span v-if="item.badge && item.badge > 0" class="ml-2 text-[10px] font-bold bg-red-600 text-white px-1.5 py-0.5 rounded-full leading-none">
            {{ item.badge }}
          </span>
        </router-link>
      </nav>

      <div class="flex h-full items-center">
        <button @click="toggleLocale" class="text-carbon-300 text-xs font-semibold px-3 h-full hover:bg-carbon-800 hover:text-white transition-colors tracking-wider">
          {{ locale === 'en' ? 'FR' : 'EN' }}
        </button>
        <router-link to="/users" class="text-carbon-300 text-sm px-3 h-full flex items-center hover:bg-carbon-800 hover:text-white no-underline transition-colors">
          Users
        </router-link>
        <button @click="handleLogout" class="text-carbon-300 text-sm px-4 h-full hover:bg-carbon-800 hover:text-white transition-colors">
          Logout
        </button>
      </div>
    </header>

    <!-- Notification -->
    <div v-if="app.notification.open" class="fixed top-12 left-0 right-0 z-40 px-4 py-3 flex items-center gap-2 text-sm"
      :class="{
        'bg-blue-50 border-l-4 border-blue-500': app.notification.kind === 'info',
        'bg-green-50 border-l-4 border-green-500': app.notification.kind === 'success',
        'bg-yellow-50 border-l-4 border-yellow-500': app.notification.kind === 'warning',
        'bg-red-50 border-l-4 border-red-500': app.notification.kind === 'error'
      }"
    >
      <span class="font-semibold">{{ app.notification.title }}</span>
      <span class="text-carbon-600">{{ app.notification.subtitle }}</span>
      <button @click="app.notification.open = false" class="ml-auto text-carbon-400 hover:text-carbon-900 text-lg">&times;</button>
    </div>

    <!-- Main content -->
    <main :class="auth.isAuthenticated ? 'pt-12' : ''">
      <div :class="auth.isAuthenticated ? 'max-w-7xl mx-auto p-6' : ''">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const { locale } = useI18n()
const auth = useAuthStore()
const app = useAppStore()

const navItems = computed(() => [
  { to: '/', label: 'Home', exact: true },
  { to: '/review', label: 'Action Required', badge: app.totalMatchIssues },
  { to: '/automatch', label: 'Auto-Matches', badge: app.totalAutoMatches },
  { to: '/audit', label: 'Audit Log' },
  { to: '/csvreport', label: 'CSV Reports' }
])

function toggleLocale() {
  locale.value = locale.value === 'en' ? 'fr' : 'en'
}

function handleLogout() {
  auth.logout()
  router.push('/login')
}

onMounted(async () => {
  if (auth.isAuthenticated) {
    await Promise.all([
      app.fetchClients(),
      app.fetchSystemURI(),
      app.fetchMatchCounts()
    ])
  }
})
</script>
