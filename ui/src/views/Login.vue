<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <h1>Open Client Registry</h1>
        <p>Sign in to manage patient identities</p>
      </div>
      <form @submit.prevent="login">
        <div class="login-field">
          <label class="bx--label">Username</label>
          <input v-model="username" class="bx--text-input" placeholder="Enter your username" />
          <div v-if="errors.username" class="bx--form-requirement">{{ errors.username }}</div>
        </div>
        <div class="login-field">
          <label class="bx--label">Password</label>
          <input v-model="password" type="password" class="bx--text-input" placeholder="Enter your password" />
          <div v-if="errors.password" class="bx--form-requirement">{{ errors.password }}</div>
        </div>
        <div v-if="loginError" class="login-error">{{ loginError }}</div>
        <button type="submit" class="bx--btn bx--btn--primary login-button" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'

const router = useRouter()
const auth = useAuthStore()
const app = useAppStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const loginError = ref('')
const errors = ref({ username: '', password: '' })

async function login() {
  errors.value = { username: '', password: '' }
  if (!username.value) { errors.value.username = 'Username is required'; return }
  if (!password.value) { errors.value.password = 'Password is required'; return }

  loading.value = true
  loginError.value = ''

  try {
    const res = await axios.post('/ocrux/user/authenticate', null, {
      params: { username: username.value, password: password.value }
    })

    if (res.data && res.data.token) {
      auth.setAuth({
        token: res.data.token,
        username: res.data.username || username.value,
        userID: res.data.userID || '',
        role: res.data.role || ''
      })

      await Promise.all([
        app.fetchClients(),
        app.fetchSystemURI(),
        app.fetchMatchCounts()
      ])

      router.push('/')
    } else {
      loginError.value = 'Invalid credentials'
    }
  } catch (e) {
    loginError.value = e.response?.data?.message || 'Unable to connect to server'
  }

  loading.value = false
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: calc(100vh - 48px);
  overflow: hidden;
  background: #f4f4f4;
}
.login-card {
  background: white;
  width: 100%;
  max-width: 400px;
  padding: 2.5rem;
  border-left: 4px solid #0f62fe;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
.login-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #161616;
  margin: 0 0 0.5rem 0;
}
.login-header p {
  font-size: 0.875rem;
  color: #525252;
  margin: 0 0 2rem 0;
}
.login-field {
  margin-bottom: 1.5rem;
}
.login-error {
  background: #fff1f1;
  border-left: 3px solid #da1e28;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: #da1e28;
  margin-bottom: 1.5rem;
}
.login-button {
  width: 100%;
}
</style>
