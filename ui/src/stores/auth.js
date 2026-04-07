import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const userID = ref(localStorage.getItem('userID') || '')
  const role = ref(localStorage.getItem('role') || '')

  const isAuthenticated = computed(() => !!token.value)

  function setAuth(data) {
    token.value = data.token
    username.value = data.username
    userID.value = data.userID
    role.value = data.role || ''
    localStorage.setItem('token', data.token)
    localStorage.setItem('username', data.username)
    localStorage.setItem('userID', data.userID)
    localStorage.setItem('role', data.role || '')
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
  }

  function logout() {
    token.value = ''
    username.value = ''
    userID.value = ''
    role.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('userID')
    localStorage.removeItem('role')
    delete axios.defaults.headers.common['Authorization']
  }

  // Set auth header on init if token exists
  if (token.value) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  return { token, username, userID, role, isAuthenticated, setAuth, logout }
})
