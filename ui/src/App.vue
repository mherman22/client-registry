<template>
  <div id="app">
    <cv-header aria-label="Open Client Registry">
      <cv-header-name to="/" prefix="Open">Client Registry</cv-header-name>

      <cv-header-nav v-if="auth.isAuthenticated">
        <cv-header-menu-item to="/">Patients</cv-header-menu-item>
        <cv-header-menu-item to="/review">
          Action Required
          <cv-tag v-if="app.totalMatchIssues > 0" :label="String(app.totalMatchIssues)" kind="red" size="sm" class="ml-1" />
        </cv-header-menu-item>
        <cv-header-menu-item to="/automatch">
          Auto-Matches
          <cv-tag v-if="app.totalAutoMatches > 0" :label="String(app.totalAutoMatches)" kind="blue" size="sm" class="ml-1" />
        </cv-header-menu-item>
        <cv-header-menu-item to="/audit">Audit Log</cv-header-menu-item>
      </cv-header-nav>

      <template v-slot:header-global v-if="auth.isAuthenticated">
        <cv-header-menu :aria-label="auth.username" :title="auth.username">
          <cv-header-menu-item to="/users">Manage Users</cv-header-menu-item>
          <cv-header-menu-item @click="handleLogout">Logout</cv-header-menu-item>
        </cv-header-menu>

        <cv-header-menu aria-label="Language" title="Lang">
          <cv-header-menu-item @click="setLocale('en')">English</cv-header-menu-item>
          <cv-header-menu-item @click="setLocale('fr')">Fran&ccedil;ais</cv-header-menu-item>
        </cv-header-menu>
      </template>
    </cv-header>

    <div class="content-area" :style="{ marginTop: '48px' }">
      <cv-inline-notification
        v-if="app.notification.open"
        :kind="app.notification.kind"
        :title="app.notification.title"
        :sub-title="app.notification.subtitle"
        @close="app.notification.open = false"
      />
      <router-view />
    </div>

    <cv-loading v-if="app.loading" overlay />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const { locale } = useI18n()
const auth = useAuthStore()
const app = useAppStore()

function setLocale(lang) {
  locale.value = lang
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

<style>
.ml-1 {
  margin-left: 0.5rem;
}
</style>
