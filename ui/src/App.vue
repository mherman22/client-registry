<template>
  <div id="app">
    <!-- Header - only show on authenticated pages -->
    <header v-if="auth.isAuthenticated" class="bx--header" role="banner">
      <router-link to="/" class="bx--header__name">
        <span class="bx--header__name--prefix">Open</span>
        Client Registry
      </router-link>

      <nav class="bx--header__nav" aria-label="Main navigation">
        <ul class="bx--header__menu-bar">
          <li>
            <router-link to="/" class="bx--header__menu-item" active-class="bx--header__menu-item--current">
              Patients
            </router-link>
          </li>
          <li>
            <router-link to="/review" class="bx--header__menu-item" active-class="bx--header__menu-item--current">
              Action Required
              <span v-if="app.totalMatchIssues > 0" class="nav-badge nav-badge--red">{{ app.totalMatchIssues }}</span>
            </router-link>
          </li>
          <li>
            <router-link to="/automatch" class="bx--header__menu-item" active-class="bx--header__menu-item--current">
              Auto-Matches
              <span v-if="app.totalAutoMatches > 0" class="nav-badge nav-badge--blue">{{ app.totalAutoMatches }}</span>
            </router-link>
          </li>
          <li>
            <router-link to="/audit" class="bx--header__menu-item" active-class="bx--header__menu-item--current">
              Audit Log
            </router-link>
          </li>
        </ul>
      </nav>

      <div class="bx--header__global">
        <div class="header-actions">
          <router-link to="/users" class="bx--header__menu-item">Users</router-link>
          <button class="bx--header__menu-item header-lang" @click="toggleLocale">
            {{ locale === 'en' ? 'FR' : 'EN' }}
          </button>
          <button class="bx--header__menu-item" @click="handleLogout">Logout</button>
        </div>
      </div>
    </header>

    <!-- Notification -->
    <div v-if="app.notification.open" class="notification-bar" :class="'notification-bar--' + app.notification.kind">
      <span class="notification-title">{{ app.notification.title }}</span>
      <span class="notification-subtitle">{{ app.notification.subtitle }}</span>
      <button class="notification-close" @click="app.notification.open = false">&times;</button>
    </div>

    <!-- Main content -->
    <main :class="auth.isAuthenticated ? 'content-area content-area--with-header' : ''">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const { locale } = useI18n()
const auth = useAuthStore()
const app = useAppStore()

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

<style>
.bx--header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  background: #161616;
  display: flex;
  align-items: center;
  z-index: 1000;
  border-bottom: 1px solid #393939;
}

.bx--header__name {
  color: #f4f4f4;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  padding: 0 2rem 0 1rem;
  height: 100%;
  display: flex;
  align-items: center;
  letter-spacing: 0.1px;
}

.bx--header__name--prefix {
  font-weight: 400;
  margin-right: 0.25rem;
}

.bx--header__nav {
  height: 100%;
  flex: 1;
}

.bx--header__menu-bar {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  height: 100%;
}

.bx--header__menu-item {
  color: #c6c6c6;
  text-decoration: none;
  font-size: 0.875rem;
  padding: 0 1rem;
  height: 100%;
  display: flex;
  align-items: center;
  border: none;
  background: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.bx--header__menu-item:hover {
  background: #353535;
  color: #f4f4f4;
}

.bx--header__menu-item--current,
.bx--header__menu-item.router-link-exact-active {
  color: #f4f4f4;
  border-bottom: 3px solid #0f62fe;
}

.bx--header__global {
  margin-left: auto;
  height: 100%;
  display: flex;
}

.header-actions {
  display: flex;
  height: 100%;
}

.header-lang {
  font-weight: 600;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
}

.nav-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 10px;
  margin-left: 0.5rem;
  line-height: 1;
}

.nav-badge--red {
  background: #da1e28;
  color: white;
}

.nav-badge--blue {
  background: #0f62fe;
  color: white;
}

.content-area--with-header {
  margin-top: 48px;
}

.notification-bar {
  position: fixed;
  top: 48px;
  left: 0;
  right: 0;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  z-index: 999;
  font-size: 0.875rem;
}

.notification-bar--info { background: #edf5ff; border-left: 3px solid #0f62fe; }
.notification-bar--success { background: #defbe6; border-left: 3px solid #24a148; }
.notification-bar--warning { background: #fcf4d6; border-left: 3px solid #f1c21b; }
.notification-bar--error { background: #fff1f1; border-left: 3px solid #da1e28; }

.notification-title { font-weight: 600; }
.notification-subtitle { color: #525252; }
.notification-close {
  margin-left: auto;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #525252;
}

.ml-1 { margin-left: 0.5rem; }
</style>
