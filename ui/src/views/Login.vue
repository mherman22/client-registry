<template>
  <div class="min-h-screen bg-carbon-50 flex items-center justify-center">
    <div class="bg-white w-full max-w-md p-8 border-l-4 border-blue-600 shadow-md">
      <div class="flex items-center gap-3 mb-1">
        <img src="/favicon.ico" alt="crux" class="h-8 w-8" />
        <h1 class="text-2xl font-semibold text-carbon-900">Open Client Registry</h1>
      </div>
      <p class="text-sm text-carbon-500 mb-8">Sign in to manage patient identities</p>

      <form @submit.prevent="login" class="space-y-5">
        <div>
          <label class="block text-xs font-medium text-carbon-600 mb-1.5">Username</label>
          <input
            v-model="username"
            type="text"
            placeholder="Enter your username"
            class="w-full h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
          />
          <p v-if="errors.username" class="text-red-600 text-xs mt-1">{{ errors.username }}</p>
        </div>

        <div>
          <label class="block text-xs font-medium text-carbon-600 mb-1.5">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter your password"
            class="w-full h-10 px-3 text-sm border border-carbon-300 bg-carbon-50 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition"
          />
          <p v-if="errors.password" class="text-red-600 text-xs mt-1">{{ errors.password }}</p>
        </div>

        <div v-if="loginError" class="bg-red-50 border-l-4 border-red-600 p-3 text-sm text-red-700">
          {{ loginError }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full h-10 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-carbon-300 disabled:cursor-not-allowed transition"
        >
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
